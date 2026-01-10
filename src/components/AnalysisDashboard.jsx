import React, { useMemo, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Alert, AlertDescription } from './ui/Alert'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
} from 'recharts'
import { 
  Printer, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Download,
  FileSpreadsheet,
  Edit3,
  BarChart3,
  Users,
  GraduationCap,
  Calendar,
  Building2,
  ImageDown,
  RotateCcw,
  ArrowLeft
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

// Pastel renk paleti
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  pastel: ['#93c5fd', '#86efac', '#fcd34d', '#fca5a5', '#c4b5fd', '#f9a8d4'],
  chart: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6']
}

// ===== TÜRKÇE KARAKTER DÖNÜŞTÜRME (jsPDF için) =====
// jsPDF varsayılan fontlar Türkçe karakterleri desteklemiyor
// Bu fonksiyon Türkçe karakterleri ASCII eşdeğerlerine çevirir
const toAscii = (str) => {
  if (!str) return ''
  return String(str)
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
}

const AnalysisDashboard = ({ config, students, grades, onBack, onEditGrades, onNewAnalysis }) => {
  const [activeTab, setActiveTab] = useState('class') // 'class' | 'student'
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  
  // Refs for PDF export
  const classTableRef = useRef(null)
  const studentCardRef = useRef(null)
  const chartsRef = useRef(null)

  // Analiz hesaplamaları
  const analysis = useMemo(() => {
    const maxTotalScore = config.outcomeScores?.reduce((sum, score) => sum + score, 0) || 100
    
    // YENİ: Ayrıştırılmış Başarı Kriterleri
    // 1. Genel geçme puanı (mutlak değer) - Öğrencinin dersi geçmesi için
    const generalPassingScore = config.generalPassingScore ?? 50
    // 2. Kazanım ustalık barajı (yüzde) - Telafi listesi için
    const outcomeMasteryThreshold = config.outcomeMasteryThreshold ?? 50
    
    // Geriye uyumluluk: eski successThreshold varsa kullan
    const legacyThreshold = config.successThreshold 
      ? (maxTotalScore * config.successThreshold) / 100 
      : generalPassingScore

    // Öğrenci sonuçları
    const studentResults = students.map((student) => {
      let total = 0
      const outcomeScores = {}

      config.outcomes.forEach((_, outcomeIndex) => {
        const score = parseFloat(grades[student.id]?.[outcomeIndex]) || 0
        outcomeScores[outcomeIndex] = score
        total += score
      })

      return {
        ...student,
        total,
        outcomeScores,
        // YENİ: Genel geçme puanına göre değerlendirme (mutlak değer)
        isPassing: total >= generalPassingScore,
        percentage: (total / maxTotalScore) * 100,
      }
    })

    // Sınıf istatistikleri
    const passingCount = studentResults.filter((s) => s.isPassing).length
    const failingCount = studentResults.length - passingCount
    const passRate = studentResults.length > 0 ? (passingCount / studentResults.length) * 100 : 0
    const classAverage = studentResults.length > 0 
      ? studentResults.reduce((sum, s) => sum + s.total, 0) / studentResults.length 
      : 0
    const classAveragePercentage = (classAverage / maxTotalScore) * 100

    // Kazanım analizi - YENİ: outcomeMasteryThreshold kullanılıyor
    const outcomeAnalysis = config.outcomes.map((outcome, index) => {
      const maxScore = config.outcomeScores[index]
      // YENİ: Kazanım ustalık barajını kullan (yüzde bazlı)
      const outcomeThreshold = maxScore * (outcomeMasteryThreshold / 100)

      let successCount = 0
      let totalScore = 0

      studentResults.forEach((student) => {
        const score = student.outcomeScores[index]
        totalScore += score
        if (score >= outcomeThreshold) {
          successCount++
        }
      })

      const successRate = studentResults.length > 0 ? (successCount / studentResults.length) * 100 : 0
      const avgScore = studentResults.length > 0 ? totalScore / studentResults.length : 0
      const avgPercentage = (avgScore / maxScore) * 100

      return {
        outcome,
        index,
        maxScore,
        successRate,
        avgScore,
        avgPercentage,
        successCount,
        failCount: studentResults.length - successCount,
        failRate: 100 - successRate,
      }
    })

    // En zorlanılan 3 kazanım
    const troubledOutcomes = [...outcomeAnalysis]
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 3)
      .filter(o => o.failRate > 30)

    // Puan dağılımı (histogram için)
    const scoreDistribution = [
      { range: '0-20', count: 0, label: '0-20', color: COLORS.danger },
      { range: '21-40', count: 0, label: '21-40', color: COLORS.warning },
      { range: '41-60', count: 0, label: '41-60', color: '#fbbf24' },
      { range: '61-80', count: 0, label: '61-80', color: COLORS.success },
      { range: '81-100', count: 0, label: '81-100', color: '#059669' },
    ]

    studentResults.forEach((student) => {
      const pct = student.percentage
      if (pct <= 20) scoreDistribution[0].count++
      else if (pct <= 40) scoreDistribution[1].count++
      else if (pct <= 60) scoreDistribution[2].count++
      else if (pct <= 80) scoreDistribution[3].count++
      else scoreDistribution[4].count++
    })

    // Kazanım Bazlı Telafi Listesi (Failure Matrix)
    // YENİ: outcomeMasteryThreshold kullanılıyor - dersi geçen öğrenci bile kazanım bazlı eksik olabilir
    const failureMatrix = config.outcomes.map((outcome, index) => {
      const maxScore = config.outcomeScores[index]
      // YENİ: Kazanım ustalık barajını kullan (yüzde bazlı)
      const failThreshold = maxScore * (outcomeMasteryThreshold / 100)
      
      // Bu kazanımda başarısız olan öğrencileri filtrele
      // ÖNEMLİ: Dersi geçmiş olsa bile bu kazanımda düşük puan alan öğrenciler listelenir
      const failedStudents = studentResults.filter((student) => {
        const score = student.outcomeScores[index]
        return score < failThreshold
      }).map(student => ({
        id: student.id,
        name: student.name,
        score: student.outcomeScores[index],
        maxScore: maxScore,
        percentage: (student.outcomeScores[index] / maxScore) * 100,
        // YENİ: Öğrencinin dersi geçip geçmediğini de ekle
        isPassingOverall: student.isPassing
      }))

      const failRate = studentResults.length > 0 
        ? (failedStudents.length / studentResults.length) * 100 
        : 0

      return {
        outcome,
        index,
        maxScore,
        failedStudents,
        failedCount: failedStudents.length,
        totalStudents: studentResults.length,
        failRate,
        isAllSuccess: failedStudents.length === 0
      }
    })

    return {
      studentResults,
      passingCount,
      failingCount,
      passRate,
      classAverage,
      classAveragePercentage,
      outcomeAnalysis,
      troubledOutcomes,
      scoreDistribution,
      failureMatrix,
      maxTotalScore,
      generalPassingScore,
      outcomeMasteryThreshold,
    }
  }, [config, students, grades])

  // Seçili öğrenci
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null
    return analysis.studentResults.find(s => s.id === selectedStudentId)
  }, [selectedStudentId, analysis.studentResults])

  // Öğrenci için otomatik yorum üret
  const generateStudentComment = (student) => {
    if (!student) return ''
    
    const isAboveAverage = student.total > analysis.classAverage
    const weakOutcomes = config.outcomes.filter((_, i) => {
      const score = student.outcomeScores[i]
      const maxScore = config.outcomeScores[i]
      return (score / maxScore) < 0.5
    })
    
    let comment = `${student.name}, `
    
    if (isAboveAverage) {
      comment += `sınıf ortalamasının ${(student.total - analysis.classAverage).toFixed(1)} puan üzerinde performans göstermiştir`
    } else {
      comment += `sınıf ortalamasının ${(analysis.classAverage - student.total).toFixed(1)} puan altında performans göstermiştir`
    }
    
    if (weakOutcomes.length > 0 && weakOutcomes.length <= 2) {
      const weakNames = weakOutcomes.map((o) => `"Kazanım ${config.outcomes.indexOf(o) + 1}"`).join(' ve ')
      comment += `. ${weakNames} konusunda ek çalışma önerilmektedir.`
    } else if (weakOutcomes.length > 2) {
      comment += `. Genel bir tekrar çalışması önerilmektedir.`
    } else {
      comment += `. Tüm kazanımlarda başarılı bir performans sergilemiştir.`
    }
    
    return comment
  }

  const handlePrint = () => {
    window.print()
  }

  // ===== EXCEL EXPORT FONKSİYONLARI =====
  const exportClassToExcel = () => {
    try {
      const headers = [
        'Sıra No',
        'Okul No',
        'Adı Soyadı',
        ...config.outcomes.map((_, i) => `S${i + 1} (${config.outcomeScores[i]})`),
        `Toplam (${analysis.maxTotalScore})`,
        'Sonuç'
      ]

      const data = analysis.studentResults.map((student, idx) => [
        idx + 1,
        student.studentNumber || student.no || '-',
        student.name,
        ...config.outcomes.map((_, i) => Number(student.outcomeScores[i].toFixed(1))),
        Number(student.total.toFixed(1)),
        student.isPassing ? 'GEÇTİ' : 'KALDI'
      ])

      const avgRow = [
        '',
        '',
        'SINIF ORTALAMASI',
        ...config.outcomes.map((_, i) => Number(analysis.outcomeAnalysis[i].avgScore.toFixed(1))),
        Number(analysis.classAverage.toFixed(1)),
        `%${analysis.passRate.toFixed(0)}`
      ]
      data.push(avgRow)

      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
      ws['!cols'] = [
        { wch: 8 },
        { wch: 10 },
        { wch: 25 },
        ...config.outcomes.map(() => ({ wch: 10 })),
        { wch: 12 },
        { wch: 10 }
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sınıf Listesi')

      const fileName = `NetAnaliz_${config.courseName || 'Rapor'}_Sinif_Listesi.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Excel export hatası:', error)
      alert('Excel dosyası oluşturulurken bir hata oluştu.')
    }
  }

  const exportStudentToExcel = () => {
    if (!selectedStudent) {
      alert('Lütfen önce bir öğrenci seçin.')
      return
    }

    try {
      const infoData = [
        ['ÖĞRENCİ KARNESİ - NetAnaliz'],
        [],
        ['Okul', config.schoolName || '-'],
        ['Ders', config.courseName || '-'],
        ['Öğrenci Adı', selectedStudent.name],
        ['Okul No', selectedStudent.no || '-'],
        ['Toplam Puan', `${selectedStudent.total.toFixed(1)} / ${analysis.maxTotalScore}`],
        ['Başarı Oranı', `%${selectedStudent.percentage.toFixed(1)}`],
        ['Sonuç', selectedStudent.isPassing ? 'GEÇTİ' : 'KALDI'],
        [],
        ['KAZANIM DETAYLARI'],
        ['Soru', 'Kazanım', 'Alınan Puan', 'Max Puan', 'Başarı Durumu']
      ]

      config.outcomes.forEach((outcome, idx) => {
        const score = selectedStudent.outcomeScores[idx]
        const maxScore = config.outcomeScores[idx]
        const pct = (score / maxScore) * 100
        const isSuccess = pct >= (config.outcomeMasteryThreshold || 50)

        infoData.push([
          `S${idx + 1}`,
          outcome,
          Number(score.toFixed(1)),
          maxScore,
          isSuccess ? 'BAŞARILI' : 'BAŞARISIZ'
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(infoData)
      ws['!cols'] = [
        { wch: 10 },
        { wch: 40 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 }
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Öğrenci Karnesi')

      const fileName = `NetAnaliz_${selectedStudent.name.replace(/\s+/g, '_')}_Karnesi.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Excel export hatası:', error)
      alert('Excel dosyası oluşturulurken bir hata oluştu.')
    }
  }

  // ===== GELİŞMİŞ PDF EXPORT FONKSİYONLARI =====
  const waitForCharts = useCallback(() => {
    return new Promise((resolve) => {
      setTimeout(resolve, 500) // Grafiklerin render edilmesini bekle
    })
  }, [])

  // Font düzeltmesi için onclone konfigürasyonu - OPTİMİZE EDİLMİŞ
  const getHtml2CanvasConfig = (element, highQuality = false) => ({
    scale: highQuality ? 2.5 : 2,  // Optimize edilmiş çözünürlük (hız için)
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    allowTaint: true,
    imageTimeout: 5000,  // 5 saniye timeout
    removeContainer: true,
    onclone: (clonedDoc) => {
      // Font düzeltmeleri
      clonedDoc.body.style.fontFamily = 'Arial, Helvetica, sans-serif';
      clonedDoc.body.style.letterSpacing = '0';
      clonedDoc.body.style.wordSpacing = 'normal';
      
      // Sadece kritik elementleri düzelt (performans için)
      const elements = clonedDoc.querySelectorAll('h1, h2, h3, p, td, th, span, div');
      elements.forEach(el => {
        el.style.fontFamily = 'Arial, Helvetica, sans-serif';
        el.style.letterSpacing = '0';
        // Transform'ları kaldır (bulanıklık önlemi)
        if (el.style.transform && el.style.transform.includes('translate')) {
          el.style.transform = 'none';
        }
      });

      // Tabloların bölünmemesi için
      Array.from(clonedDoc.querySelectorAll('table, tr, .card-apple')).forEach(el => {
        el.style.pageBreakInside = 'avoid';
        el.style.breakInside = 'avoid';
      });
    }
  })

  // Tarih formatı (dosya adları için)
  const getDateString = () => {
    const now = new Date()
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  }

  const exportClassToPDF = async () => {
    if (!classTableRef.current) return

    setIsExporting(true)
    try {
      await waitForCharts()
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // ===== RESMİ BELGE HEADER (Ortalanmış) =====
      const headerHeight = 28
      pdf.setFillColor(37, 99, 235)
      pdf.rect(0, 0, pdfWidth, headerHeight, 'F')
      
      // Tüm bilgiler ortalanmış
      const centerX = pdfWidth / 2
      pdf.setTextColor(255, 255, 255)
      
      // Okul Adı (En büyük - 1. satır)
      const schoolName = toAscii(config.schoolName || 'Okul Adi')
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text(schoolName, centerX, 8, { align: 'center' })
      
      // Ders ve Sınıf Bilgisi (2. satır)
      const courseName = toAscii(config.courseName || 'Ders')
      const gradeLevel = toAscii(config.gradeLevel || 'Sinif')
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${gradeLevel} - ${courseName} Dersi Sinav Analizi`, centerX, 14, { align: 'center' })
      
      // Öğretmen ve Tarih (3. satır)
      const teacherName = toAscii(config.teacherName || 'Ogretmen')
      pdf.setFontSize(8)
      pdf.text(`Ders Ogretmeni: ${teacherName}  |  Tarih: ${today}`, centerX, 20, { align: 'center' })
      
      // Alt çizgi dekorasyon
      pdf.setDrawColor(255, 255, 255)
      pdf.setLineWidth(0.3)
      pdf.line(centerX - 40, 24, centerX + 40, 24)

      // ===== ANA İÇERİK =====
      const element = classTableRef.current
      const canvas = await html2canvas(element, getHtml2CanvasConfig(element))

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min((pdfWidth - 12) / imgWidth, (pdfHeight - headerHeight - 15) / imgHeight)
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = headerHeight + 4

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, 'FAST')

      // ===== FOOTER =====
      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(7)
      pdf.text('NetAnaliz Raporu', centerX, pdfHeight - 4, { align: 'center' })

      const fileName = `NetAnaliz_Sinif_Listesi_${getDateString()}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('PDF export hatası:', error)
      alert('PDF dosyası oluşturulurken bir hata oluştu.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportStudentToPDF = async () => {
    if (!studentCardRef.current || !selectedStudent) {
      alert('Lütfen önce bir öğrenci seçin.')
      return
    }

    setIsExporting(true)
    try {
      await waitForCharts()

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // ===== RESMİ BELGE HEADER (Ortalanmış) =====
      const headerHeight = 32
      pdf.setFillColor(37, 99, 235)
      pdf.rect(0, 0, pdfWidth, headerHeight, 'F')
      
      const centerX = pdfWidth / 2
      pdf.setTextColor(255, 255, 255)
      
      // Okul Adı (1. satır)
      const schoolName = toAscii(config.schoolName || 'Okul Adi')
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(schoolName, centerX, 9, { align: 'center' })
      
      // Belge Başlığı (2. satır)
      pdf.setFontSize(10)
      pdf.text('OGRENCI BASARI KARNESI', centerX, 17, { align: 'center' })
      
      // Öğrenci Bilgisi (3. satır)
      const studentName = toAscii(selectedStudent.name || 'Ogrenci')
      const studentNo = selectedStudent.studentNumber || selectedStudent.no || '-'
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Ogrenci: ${studentName}  |  No: ${studentNo}`, centerX, 24, { align: 'center' })
      
      // Tarih ve Öğretmen (4. satır)
      const teacherName = toAscii(config.teacherName || 'Ogretmen')
      pdf.setFontSize(7)
      pdf.text(`Ders Ogretmeni: ${teacherName}  |  Tarih: ${today}`, centerX, 30, { align: 'center' })

      // ===== ANA İÇERİK =====
      const element = studentCardRef.current
      const canvas = await html2canvas(element, getHtml2CanvasConfig(element, true))

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min((pdfWidth - 16) / imgWidth, (pdfHeight - headerHeight - 35) / imgHeight)
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = headerHeight + 4

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, 'FAST')

      // ===== İMZA ALANLARI =====
      const signY = pdfHeight - 22
      pdf.setTextColor(60, 60, 60)
      pdf.setFontSize(8)
      
      // Sol: Ders Öğretmeni
      pdf.line(20, signY, 70, signY)
      pdf.text('Ders Ogretmeni', 32, signY + 5)
      
      // Sağ: Okul Müdürü
      pdf.line(pdfWidth - 70, signY, pdfWidth - 20, signY)
      pdf.text('Okul Muduru', pdfWidth - 58, signY + 5)

      // ===== FOOTER =====
      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(7)
      pdf.text('NetAnaliz Raporu', centerX, pdfHeight - 5, { align: 'center' })

      const safeStudentName = toAscii(selectedStudent.name || 'Ogrenci').replace(/\s+/g, '_')
      const fileName = `NetAnaliz_Ogrenci_Karnesi_${safeStudentName}_${getDateString()}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('PDF export hatası:', error)
      alert('PDF dosyası oluşturulurken bir hata oluştu.')
    } finally {
      setIsExporting(false)
    }
  }

  // ===== GRAFİK İNDİRME FONKSİYONU =====
  const exportChartsToImage = async () => {
    if (!chartsRef.current) return

    setIsExporting(true)
    try {
      await waitForCharts()

      const element = chartsRef.current
      const canvas = await html2canvas(element, getHtml2CanvasConfig(element, true))

      // PNG olarak indir
      const link = document.createElement('a')
      link.download = `NetAnaliz_Sinif_Grafikleri_${getDateString()}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (error) {
      console.error('Grafik export hatası:', error)
      alert('Grafikler indirilirken bir hata oluştu.')
    } finally {
      setIsExporting(false)
    }
  }

  // Ref for full export (banner + charts + remedial cards)
  const fullExportRef = useRef(null)
  const remedialCardsRef = useRef(null)

  // ===== PREMIUM RAPOR İNDİRME (Çok Sayfalı PDF) =====
  const exportFullReportToPDF = async () => {
    setIsExporting(true)
    try {
      await waitForCharts()

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // ===== SAYFA 1: Banner + Grafikler =====
      // Premium Banner Header - BEYAZ ARKA PLAN, Resmi Evrak Stili
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pdfWidth, 50, 'F')
      
      // Koyu gri/siyah metin - TÜM METİNLER ASCII'YE ÇEVRİLİYOR
      const schoolNameAscii = toAscii(config.schoolName || 'Okul Adi').toUpperCase()
      const academicYearAscii = toAscii(config.academicYear || '2025-2026')
      const semesterAscii = toAscii(config.semester || '1. Donem')
      const courseNameAscii = toAscii(config.courseName || 'Ders')
      const examNumberAscii = toAscii(config.examNumber || '1. Sinav')
      const gradeLevelAscii = toAscii(config.gradeLevel || 'Sinif')
      const teacherNameAscii = toAscii(config.teacherName || 'Ogretmen')
      
      pdf.setTextColor(30, 30, 30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(schoolNameAscii, pdfWidth / 2, 12, { align: 'center' })
      
      // Alt çizgi
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.5)
      pdf.line(pdfWidth / 2 - 30, 16, pdfWidth / 2 + 30, 16)
      
      pdf.setTextColor(80, 80, 80)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${academicYearAscii} Egitim Yili - ${semesterAscii}`, pdfWidth / 2, 24, { align: 'center' })
      
      pdf.setTextColor(50, 50, 50)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      const examInfo = `${courseNameAscii} Dersi - ${examNumberAscii} Analiz Raporu`
      pdf.text(examInfo, pdfWidth / 2, 33, { align: 'center' })
      
      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const teacherInfo = `Sinif: ${gradeLevelAscii}  |  Ders Ogretmeni: ${teacherNameAscii}  |  Tarih: ${today}`
      pdf.text(teacherInfo, pdfWidth / 2, 42, { align: 'center' })
      
      // Alt border
      pdf.setDrawColor(220, 220, 220)
      pdf.line(10, 48, pdfWidth - 10, 48)

      // Grafikler
      if (chartsRef.current) {
        const chartsCanvas = await html2canvas(chartsRef.current, getHtml2CanvasConfig(chartsRef.current, true))
        
        const chartsImg = chartsCanvas.toDataURL('image/png')
        const chartsRatio = Math.min((pdfWidth - 20) / chartsCanvas.width, (pdfHeight - 80) / chartsCanvas.height)
        const chartsX = (pdfWidth - chartsCanvas.width * chartsRatio) / 2
        
        pdf.addImage(chartsImg, 'PNG', chartsX, 50, chartsCanvas.width * chartsRatio, chartsCanvas.height * chartsRatio)
      }

      // Page 1 Footer
      pdf.setTextColor(150, 150, 150)
      pdf.setFontSize(8)
      pdf.text('NetAnaliz Raporu | Sayfa 1', pdfWidth / 2, pdfHeight - 5, { align: 'center' })

      // ===== SAYFA 2: Telafi Kartları =====
      pdf.addPage()
      
      // Page 2 Header - Beyaz arka plan
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pdfWidth, 25, 'F')
      
      pdf.setTextColor(30, 30, 30)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Kazanim Bazli Telafi Listesi', pdfWidth / 2, 12, { align: 'center' })
      
      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${courseNameAscii} - ${gradeLevelAscii}`, pdfWidth / 2, 19, { align: 'center' })
      
      // Alt border
      pdf.setDrawColor(220, 220, 220)
      pdf.line(10, 23, pdfWidth - 10, 23)

      // Telafi kartları
      if (remedialCardsRef.current) {
        const remedialCanvas = await html2canvas(remedialCardsRef.current, getHtml2CanvasConfig(remedialCardsRef.current, true))
        
        const remedialImg = remedialCanvas.toDataURL('image/png')
        const remedialRatio = Math.min((pdfWidth - 20) / remedialCanvas.width, (pdfHeight - 50) / remedialCanvas.height)
        const remedialX = (pdfWidth - remedialCanvas.width * remedialRatio) / 2
        
        pdf.addImage(remedialImg, 'PNG', remedialX, 30, remedialCanvas.width * remedialRatio, remedialCanvas.height * remedialRatio)
      }

      // Page 2 Footer
      pdf.setTextColor(150, 150, 150)
      pdf.setFontSize(8)
      pdf.text('NetAnaliz Raporu | Sayfa 2', pdfWidth / 2, pdfHeight - 5, { align: 'center' })

      // Save
      const safeCourseNameForFile = toAscii(config.courseName || 'Ders').replace(/\s+/g, '_')
      const fileName = `NetAnaliz_Tam_Rapor_${safeCourseNameForFile}_${getDateString()}.pdf`
      pdf.save(fileName)

    } catch (error) {
      console.error('PDF export hatası:', error)
      alert('PDF dosyası oluşturulurken bir hata oluştu.')
    } finally {
      setIsExporting(false)
    }
  }

  // ===== PREMIUM RAPOR İNDİRME (PNG) =====
  const exportFullReportToImage = async () => {
    if (!fullExportRef.current) return

    setIsExporting(true)
    try {
      await waitForCharts()

      const element = fullExportRef.current
      const canvas = await html2canvas(element, getHtml2CanvasConfig(element, true))

      const link = document.createElement('a')
      link.download = `NetAnaliz_Tam_Rapor_${config.courseName?.replace(/\s+/g, '_') || 'Ders'}_${getDateString()}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (error) {
      console.error('Resim export hatası:', error)
      alert('Resim indirilirken bir hata oluştu.')
    } finally {
      setIsExporting(false)
    }
  }

  // Bugünün tarihi
  const today = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Üst Navigasyon Bar - Apple Style */}
      <div className="no-print">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          {/* Sol: Tab Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('class')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'class'
                  ? 'bg-white text-gray-900 shadow-apple'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Sınıf Analizi
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'student'
                  ? 'bg-white text-gray-900 shadow-apple'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Öğrenci Karnesi
            </button>
        </div>

          {/* Sağ: Aksiyon Butonları */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={onEditGrades}
              variant="ghost"
              size="sm"
              className="text-gray-600"
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              Notları Düzenle
            </Button>
            <Button 
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-gray-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Geri
            </Button>
            {onNewAnalysis && (
              <Button 
                onClick={onNewAnalysis}
                variant="secondary"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Yeni Analiz
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ==================== TAB 1: SINIF GENEL DURUMU ==================== */}
      {activeTab === 'class' && (
        <div className="space-y-6">
          {/* Aksiyon Butonları */}
          <div className="no-print flex justify-end gap-2">
            <Button 
              onClick={handlePrint} 
              variant="outline"
              size="sm"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Yazdır
            </Button>
            <Button 
              onClick={exportClassToPDF} 
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isExporting ? 'İşleniyor...' : 'PDF'}
            </Button>
            <Button 
              onClick={exportClassToExcel} 
              variant="outline"
              size="sm"
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Excel
          </Button>
          </div>

          {/* ===== RESMİ BELGE ===== */}
          <div ref={classTableRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Başlık Banner - Kompakt ve Okunabilir */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white leading-tight">{config.schoolName || 'Okul Adı'}</h1>
                    <p className="text-sm text-white/90">{config.gradeLevel} - {config.courseName} Dersi</p>
                  </div>
                </div>
                <div className="text-right text-xs text-white/90">
                  <div className="flex items-center gap-1.5 justify-end mb-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {today}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <User className="w-3.5 h-3.5" />
                    {config.teacherName || 'Öğretmen'}
                  </div>
                </div>
        </div>
      </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/50">
              <div className="bg-white p-4 rounded-xl shadow-soft border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Öğrenci</p>
                    <p className="text-xl font-bold text-slate-800">{students.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-soft border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Başarılı</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {analysis.passingCount} <span className="text-sm font-normal">(%{analysis.passRate.toFixed(0)})</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-soft border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Başarısız</p>
                    <p className="text-xl font-bold text-red-600">
                      {analysis.failingCount} <span className="text-sm font-normal">(%{(100 - analysis.passRate).toFixed(0)})</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-soft border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ortalama</p>
                    <p className="text-xl font-bold text-purple-600">
                      {analysis.classAverage.toFixed(1)} <span className="text-sm font-normal">/ {analysis.maxTotalScore}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ana Tablo */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Sıra</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider w-20">Okul No</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Adı Soyadı</th>
                    {config.outcomes.map((_, index) => (
                      <th 
                        key={index} 
                        className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-14"
                        title={config.outcomes[index]}
                      >
                        <div>S{index + 1}</div>
                        <div className="text-[10px] font-normal text-gray-400 normal-case">({config.outcomeScores[index]})</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50">
                      <div>Toplam</div>
                      <div className="text-[10px] font-normal text-gray-400 normal-case">({analysis.maxTotalScore})</div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">Sonuç</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analysis.studentResults.map((student, idx) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3 text-center text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-blue-600">
                        {student.studentNumber || student.no || '-'}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {student.name}
                      </td>
                      {config.outcomes.map((_, outcomeIndex) => {
                        const score = student.outcomeScores[outcomeIndex]
                        const maxScore = config.outcomeScores[outcomeIndex]
                        const pct = (score / maxScore) * 100
                        return (
                          <td 
                            key={outcomeIndex} 
                            className={`px-2 py-3 text-center ${
                              pct < 40 ? 'text-red-600 font-medium' : pct >= 80 ? 'text-green-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {score.toFixed(score % 1 === 0 ? 0 : 1)}
                          </td>
                        )
                      })}
                      <td className="px-3 py-3 text-center font-semibold text-gray-900 bg-gray-50">
                        {student.total.toFixed(1)}
                      </td>
                      <td className={`px-3 py-3 text-center font-medium ${
                        student.isPassing 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {student.isPassing ? 'Geçti' : 'Kaldı'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-3 py-3 text-right font-medium text-gray-500 uppercase text-xs tracking-wider">
                      Sınıf Ortalaması
                    </td>
                    {config.outcomes.map((_, outcomeIndex) => {
                      const avgScore = analysis.outcomeAnalysis[outcomeIndex].avgScore
                      return (
                        <td key={outcomeIndex} className="px-2 py-3 text-center text-gray-600 font-medium">
                          {avgScore.toFixed(1)}
                        </td>
                      )
                    })}
                    <td className="px-3 py-3 text-center font-bold text-primary">
                      {analysis.classAverage.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-gray-600">
                      %{analysis.passRate.toFixed(0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* İmza Alanları */}
            <div className="p-6 pt-0">
              <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200">
                <div className="flex justify-between items-end">
                  <div className="text-center w-48">
                    <div className="border-b-2 border-slate-400 mb-2 pb-8"></div>
                    <p className="font-semibold text-slate-800">{config.teacherName || 'Ders Öğretmeni'}</p>
                    <p className="text-xs text-slate-500">Ders Öğretmeni</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">NetAnaliz © 2026</p>
                  </div>
                  <div className="text-center w-48">
                    <div className="border-b-2 border-slate-400 mb-2 pb-8"></div>
                    <p className="font-semibold text-slate-800">{config.principalName || 'Okul Müdürü'}</p>
                    <p className="text-xs text-slate-500">Okul Müdürü</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alarm Veren Konular */}
          {analysis.troubledOutcomes.length > 0 && (
            <Card className="no-print border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-amber-700 text-lg">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Dikkat Gerektiren Kazanımlar
            </CardTitle>
          </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {analysis.troubledOutcomes.map((outcome, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200 shadow-soft"
                    >
                      <div>
                        <span className="font-bold text-amber-700">S{outcome.index + 1}</span>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{outcome.outcome}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-amber-600">
                          %{outcome.failRate.toFixed(0)}
                        </span>
                        <p className="text-[10px] text-slate-500">başarısız</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
        </Card>
          )}

          {/* ===== EXPORT WRAPPER - Premium Rapor Alanı ===== */}
          <div ref={fullExportRef} className="bg-white rounded-2xl">
            {/* PREMIUM BANNER - Beyaz arka plan, Resmi Evrak Başlığı */}
            <div className="bg-white border-b-2 border-gray-200 p-8 print:block">
              <div className="text-center space-y-3">
                {/* Okul Adı - En Büyük */}
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">
                  {config.schoolName || 'Okul Adı'}
                </h1>
                {/* Alt çizgi dekorasyon */}
                <div className="flex justify-center">
                  <div className="w-24 h-1 bg-gray-300 rounded-full"></div>
                </div>
                {/* Sınav Bilgisi */}
                <h2 className="text-lg font-semibold text-gray-700">
                  {config.academicYear || '2025-2026'} Eğitim Yılı - {config.semester || '1. Dönem'}
                </h2>
                <h2 className="text-xl font-bold text-gray-800">
                  {config.courseName || 'Ders Adı'} Dersi - {config.examNumber || '1. Sınav'} Analiz Raporu
                </h2>
                {/* Öğretmen ve Sınıf Bilgisi */}
                <div className="flex justify-center gap-8 text-sm text-gray-600 pt-2">
                  <span><strong>Sınıf:</strong> {config.gradeLevel || '-'}</span>
                  <span><strong>Ders Öğretmeni:</strong> {config.teacherName || '-'}</span>
                  <span><strong>Tarih:</strong> {today}</span>
                </div>
              </div>
      </div>

            {/* Grafikler Başlık + Export Butonları */}
            <div className="no-print flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Sınıf Grafikleri & Analiz Raporu
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={exportChartsToImage}
                  variant="outline"
                  size="sm"
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  disabled={isExporting}
                >
                  <ImageDown className="w-4 h-4 mr-1.5" />
                  Grafik PNG
                </Button>
                <Button 
                  onClick={exportFullReportToImage}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  disabled={isExporting}
                >
                  <ImageDown className="w-4 h-4 mr-1.5" />
                  Tam Rapor PNG
                </Button>
                <Button 
                  onClick={exportFullReportToPDF}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  {isExporting ? 'İşleniyor...' : 'PDF Rapor'}
                </Button>
              </div>
            </div>

            {/* Grafikler */}
            <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-white">
            {/* Histogram */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                <CardTitle className="flex items-center text-slate-800">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                  Başarı Dağılımı
                </CardTitle>
                <CardDescription>Puan aralıklarına göre öğrenci sayısı</CardDescription>
          </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analysis.scoreDistribution} barCategoryGap="20%" margin={{ bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      name="Öğrenci Sayısı" 
                      radius={[8, 8, 0, 0]}
                    >
                      {analysis.scoreDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

            {/* Kazanım Başarı Grafiği */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                <CardTitle className="flex items-center text-slate-800">
                  <Target className="w-5 h-5 mr-2 text-emerald-500" />
                  Kazanım Başarı Oranları
                </CardTitle>
                <CardDescription>Her soru için sınıf başarı yüzdesi</CardDescription>
          </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={Math.max(280, analysis.outcomeAnalysis.length * 35)}>
                  <BarChart 
                    data={analysis.outcomeAnalysis.map((o, i) => ({
                      name: `S${i + 1}`,
                      başarı: o.successRate,
                    }))}
                    layout="vertical"
                    barCategoryGap="15%"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={35}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine 
                      x={config.outcomeMasteryThreshold || 50} 
                      stroke="#f59e0b" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                    <Bar 
                      dataKey="başarı" 
                      name="Başarı %" 
                      radius={[0, 6, 6, 0]}
                    >
                      {analysis.outcomeAnalysis.map((o, index) => (
                        <Cell 
                          key={index} 
                          fill={o.successRate >= (config.outcomeMasteryThreshold || 50) ? '#10b981' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

            {/* ===== KAZANIM BAZLI TELAFİ LİSTESİ (Failure Matrix) ===== */}
            <div ref={remedialCardsRef} className="p-6 bg-white border-t border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Kazanım Bazlı Telafi Listesi
                </h2>
                <p className="text-sm text-gray-500">
                  Her kazanımda %50'nin altında kalan öğrenciler
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.failureMatrix.map((item) => (
                <div 
                  key={item.index}
                  className={`bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${
                    item.isAllSuccess ? 'border-emerald-200' : 'border-gray-100'
                  }`}
                >
                  {/* Kart Başlığı */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          K{item.index + 1}: {item.outcome}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Max Puan: {item.maxScore}
                        </p>
                        </div>
                      {item.isAllSuccess ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Tam Başarı
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          {item.failedCount} Öğrenci
                        </span>
                      )}
                      </div>
                      </div>

                  {/* Progress Bar */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>Başarısızlık Oranı</span>
                      <span className={item.failRate > 50 ? 'text-red-600 font-medium' : ''}>
                        %{item.failRate.toFixed(0)}
                      </span>
                  </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.isAllSuccess 
                            ? 'bg-emerald-500' 
                            : item.failRate > 50 
                              ? 'bg-red-500' 
                              : item.failRate > 25 
                                ? 'bg-amber-500' 
                                : 'bg-orange-400'
                        }`}
                        style={{ width: item.isAllSuccess ? '100%' : `${item.failRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Öğrenci Listesi */}
                  <div className="px-4 pb-4">
                    {item.isAllSuccess ? (
                      <div className="flex items-center justify-center py-4 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        <span className="font-medium">Tebrikler! Tüm öğrenciler başarılı.</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-xs text-gray-500 font-medium">Telafi Gereken Öğrenciler:</p>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-thin">
                          {item.failedStudents.map((student) => {
                            // İsmi kısalt: "Ahmet Mehmet Yılmaz" → "Ahmet M."
                            const nameParts = student.name.split(' ')
                            const shortName = nameParts.length > 1 
                              ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`
                              : nameParts[0]
                            
                            return (
                              <span 
                                key={student.id}
                                className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-red-50 text-red-600 rounded text-[10px] border border-red-100"
                                title={`${student.name} - Aldığı: ${student.score.toFixed(1)} / ${student.maxScore}`}
                              >
                                <span className="truncate max-w-[70px]">{shortName}</span>
                                <span className="text-red-400">({student.score.toFixed(0)})</span>
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

              {/* Export Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  NetAnaliz Raporu - Designed & Engineered by MRK Design
                </p>
              </div>
            </div>
          </div>
          {/* ===== END EXPORT WRAPPER ===== */}
        </div>
      )}

      {/* ==================== TAB 2: ÖĞRENCİ KARNESİ ==================== */}
      {activeTab === 'student' && (
        <div className="space-y-6">
          {/* Öğrenci Seçimi */}
      <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-primary" />
                    Öğrenci Seçin
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Detaylı karne görüntülemek için bir öğrenci seçin
                  </CardDescription>
                </div>
                {selectedStudent && (
                  <div className="no-print flex gap-2">
                    <Button 
                      onClick={handlePrint} 
                      variant="outline"
                      size="sm"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Yazdır
                    </Button>
                    <Button 
                      onClick={exportStudentToPDF} 
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button 
                      onClick={exportStudentToExcel} 
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      Excel
                    </Button>
                  </div>
                )}
              </div>
        </CardHeader>
        <CardContent>
              <Select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="max-w-md"
              >
                <option value="">-- Öğrenci Seçin --</option>
                {analysis.studentResults.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.siraNo}. {student.name} ({student.studentNumber || student.no || '-'}) - {student.total.toFixed(1)} puan
                    {student.isPassing ? ' ✓' : ' ✗'}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          {/* Öğrenci Karnesi */}
          {selectedStudent && (
            <div ref={studentCardRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Karne Başlığı - Kompakt */}
              <div className={`px-5 py-4 ${selectedStudent.isPassing ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold leading-tight">{selectedStudent.name}</h2>
                      <p className="text-sm text-white/90">Okul No: {selectedStudent.studentNumber || selectedStudent.no || '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex flex-col items-center justify-center">
                      <Award className="w-6 h-6 mb-0.5" />
                      <span className="text-xs font-bold">{selectedStudent.isPassing ? 'GEÇTİ' : 'KALDI'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Sol: Puan Bilgileri */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Puan Özeti
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <div className="text-3xl font-bold text-blue-600">{selectedStudent.total.toFixed(1)}</div>
                      <div className="text-xs text-slate-500">Toplam Puan</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl text-center">
                      <div className="text-3xl font-bold text-purple-600">%{selectedStudent.percentage.toFixed(0)}</div>
                      <div className="text-xs text-slate-500">Başarı Oranı</div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${selectedStudent.total > analysis.classAverage ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedStudent.total > analysis.classAverage ? (
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-amber-600" />
                      )}
                      <span className={`font-medium ${selectedStudent.total > analysis.classAverage ? 'text-emerald-700' : 'text-amber-700'}`}>
                        Sınıf Ortalaması: {analysis.classAverage.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {selectedStudent.total > analysis.classAverage 
                        ? `Ortalamanın ${(selectedStudent.total - analysis.classAverage).toFixed(1)} puan üzerinde`
                        : `Ortalamanın ${(analysis.classAverage - selectedStudent.total).toFixed(1)} puan altında`
                      }
                    </p>
                  </div>

                  {/* Değerlendirme */}
                  <Alert className="bg-slate-50 border-slate-200">
                    <AlertDescription className="text-slate-700 text-sm">
                      <strong className="text-slate-800">Değerlendirme:</strong><br/>
                      {generateStudentComment(selectedStudent)}
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Orta: Kazanım Durumları */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Kazanım Detayları
                  </h3>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
                    {config.outcomes.map((outcome, idx) => {
                      const score = selectedStudent.outcomeScores[idx]
                      const maxScore = config.outcomeScores[idx]
                      const pct = (score / maxScore) * 100
                      const isSuccess = pct >= (config.outcomeMasteryThreshold || 50)
                      
                      return (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                            isSuccess ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isSuccess ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            )}
                            <span className="text-sm truncate">
                              <strong className="text-slate-700">S{idx + 1}:</strong>{' '}
                              <span className="text-slate-600">{outcome}</span>
                            </span>
                          </div>
                          <div className={`font-bold text-sm ml-2 ${isSuccess ? 'text-emerald-600' : 'text-red-600'}`}>
                            {score.toFixed(1)}/{maxScore}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Sağ: Grafik */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Karşılaştırma
                  </h3>
                  
                  <div className="bg-slate-50 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={config.outcomes.map((_, idx) => ({
                          name: `S${idx + 1}`,
                          'Öğrenci': selectedStudent.outcomeScores[idx],
                          'Sınıf': analysis.outcomeAnalysis[idx].avgScore,
                        }))}
                        barGap={4}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                        <Bar 
                          dataKey="Öğrenci" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                          dataKey="Sınıf" 
                          fill="#cbd5e1" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Karne Alt Bilgi */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {config.schoolName || 'Okul'}
                        </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {today}
                        </span>
          </div>
                  <span>NetAnaliz © 2026</span>
                </div>
              </div>
            </div>
          )}

          {!selectedStudentId && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-slate-300" />
      </div>
              <p className="text-slate-500">Detaylı karne görüntülemek için yukarıdan bir öğrenci seçin.</p>
            </div>
          )}
        </div>
      )}

      {/* Print Stilleri - Gelişmiş */}
      <style>{`
        @media print {
          /* Temel ayarlar */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Sayfa ayarları */
          @page {
            size: A4 landscape;
            margin: 10mm 8mm;
          }

          /* Gizlenecek elementler */
          .no-print,
          button,
          nav,
          .recharts-tooltip-wrapper {
            display: none !important;
          }

          /* Body */
          body {
            background: #fff !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 10pt !important;
          }

          /* TABLO BÖLÜNME ÖNLEMİ */
          table {
            page-break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          /* Kartlar ve containerlar */
          .rounded-2xl,
          .rounded-xl,
          .shadow-sm,
          [class*="card"] {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }

          /* Başlıklar */
          h1, h2, h3 {
            page-break-after: avoid !important;
            font-size: 12pt !important;
          }

          /* Hücreler */
          th, td {
            padding: 6px 8px !important;
            font-size: 9pt !important;
          }

          /* Grafikler */
          .recharts-wrapper {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AnalysisDashboard
