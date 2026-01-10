import React, { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Alert, AlertDescription } from './ui/Alert'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Info } from 'lucide-react'
import * as XLSX from 'xlsx'

/**
 * STANDART VERİ MODELİ:
 * - siraNo: Sıra numarası (1, 2, 3...) - Otomatik atanır
 * - studentNumber: Öğrenci/Okul numarası (1453, 2587...) - Excel'den OKUL NO sütunu
 * - name: Öğrenci adı soyadı - Excel'den ADI SOYADI sütunu
 */

const ExcelUploader = ({ onStudentsImported, onNext, onBack, existingStudents }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [students, setStudents] = useState(existingStudents || [])
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(existingStudents?.length ? 'Mevcut liste yüklü' : '')
  const [debugInfo, setDebugInfo] = useState(null)

  // Excel şablonu indirme fonksiyonu
  const downloadTemplate = useCallback(() => {
    const templateData = [
      ['SIRA NO', 'OKUL NO', 'ADI SOYADI'],
      [1, 1001, 'Ahmet YILMAZ'],
      [2, 1002, 'Ayşe DEMİR'],
      [3, 1003, 'Mehmet KAYA'],
      [4, '', ''],
      [5, '', '']
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(templateData)

    ws['!cols'] = [
      { wch: 10 },
      { wch: 15 },
      { wch: 30 }
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Öğrenci Listesi')
    XLSX.writeFile(wb, 'ogrenci_listesi_sablonu.xlsx')
  }, [])

  // Türkçe karakterleri normalize et
  const normalizeTurkish = (str) => {
    if (!str) return ''
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
  }

  // Değeri güvenli şekilde string'e çevir
  const cleanValue = (val) => {
    if (val === null || val === undefined) return ''
    return String(val).trim()
  }

  // BAŞLIK TESPİT FONKSİYONU - ÇOK KRİTİK!
  const detectColumnType = (headerText) => {
    const normalized = normalizeTurkish(headerText)
    
    // SIRA NO tespiti - EN ÖNCE kontrol et!
    // "sira" kelimesi içeriyorsa kesinlikle SIRA NO'dur
    if (normalized.includes('sira')) {
      return 'SIRA_NO'
    }
    
    // ADI SOYADI tespiti
    if (normalized.includes('adi') || 
        normalized.includes('soyadi') || 
        normalized.includes('isim') || 
        normalized.includes('ogrenci') && !normalized.includes('no') ||
        normalized === 'ad' ||
        normalized === 'name') {
      return 'ADI_SOYADI'
    }
    
    // OKUL NO tespiti - "sira" İÇERMİYORSA ve şunlardan biriyse
    if (!normalized.includes('sira')) {
      if (normalized.includes('okul') ||
          normalized.includes('ogrenci no') ||
          normalized.includes('ogrenci numarasi') ||
          normalized === 'numara' ||
          normalized === 'no' ||
          normalized === 'num') {
        return 'OKUL_NO'
      }
    }
    
    return null
  }

  const parseExcelFile = useCallback((file) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

        // Sütun indekslerini bul
        let headerRowIndex = -1
        let siraNoColIndex = -1
        let okulNoColIndex = -1
        let adiSoyadiColIndex = -1

        // İlk 10 satırda başlık ara
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i]
          if (!row || row.length < 2) continue

          let foundHeaders = 0
          
          for (let j = 0; j < row.length; j++) {
            const cellValue = row[j]
            if (!cellValue) continue
            
            const columnType = detectColumnType(cellValue)
            
            if (columnType === 'SIRA_NO' && siraNoColIndex === -1) {
              siraNoColIndex = j
              foundHeaders++
            } else if (columnType === 'OKUL_NO' && okulNoColIndex === -1) {
              okulNoColIndex = j
              foundHeaders++
            } else if (columnType === 'ADI_SOYADI' && adiSoyadiColIndex === -1) {
              adiSoyadiColIndex = j
              foundHeaders++
            }
          }
          
          // En az 2 başlık bulunmuşsa bu satır başlık satırı
          if (foundHeaders >= 2) {
            headerRowIndex = i
            break
          }
        }

        // Debug bilgisi
        const debug = {
          headerRow: headerRowIndex,
          headers: jsonData[headerRowIndex] || [],
          mapping: {
            'SIRA NO': siraNoColIndex,
            'OKUL NO': okulNoColIndex,
            'ADI SOYADI': adiSoyadiColIndex
          },
          firstDataRow: jsonData[headerRowIndex + 1] || []
        }
        console.log('📊 Excel Analizi:', debug)
        setDebugInfo(debug)

        // ADI SOYADI zorunlu
        if (adiSoyadiColIndex === -1) {
          setError(
            'Excel dosyasında "ADI SOYADI" sütunu bulunamadı.\n\n' +
            '📋 Lütfen şablonu indirip kullanın.\n' +
            '📌 Gerekli sütun başlıkları:\n' +
            '   • SIRA NO\n' +
            '   • OKUL NO\n' +
            '   • ADI SOYADI'
          )
          return
        }

        // OKUL NO bulunamadıysa uyarı ver ama devam et
        const hasOkulNo = okulNoColIndex !== -1

        // Öğrenci verilerini parse et
        const parsedStudents = []
        
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue

          // ADI SOYADI - Zorunlu
          const rawName = row[adiSoyadiColIndex]
          const studentName = cleanValue(rawName)
          if (!studentName) continue // İsim yoksa atla

          // OKUL NO - Excel'den al (varsa)
          const rawOkulNo = hasOkulNo ? row[okulNoColIndex] : null
          const studentNumber = cleanValue(rawOkulNo)

          // SIRA NO - Her zaman otomatik ata (Excel'deki değeri KULLANMA!)
          const autoSiraNo = parsedStudents.length + 1

          parsedStudents.push({
            id: `student-${i}-${Date.now()}`,
            siraNo: String(autoSiraNo),              // OTOMATİK SIRA
            studentNumber: studentNumber,             // EXCEL'DEN OKUL NO
            no: studentNumber,                        // Geriye uyumluluk
            name: studentName,
          })
        }

        console.log('📋 Oluşturulan öğrenci listesi:', parsedStudents.slice(0, 3))

        if (parsedStudents.length === 0) {
          setError('Excel dosyasında öğrenci verisi bulunamadı.')
          return
        }

        // OKUL NO bulunamadıysa veya boşsa uyarı göster
        const studentsWithoutNumber = parsedStudents.filter(s => !s.studentNumber).length
        if (!hasOkulNo || studentsWithoutNumber === parsedStudents.length) {
          setError(
            `⚠️ UYARI: Excel dosyasında "OKUL NO" sütunu ${!hasOkulNo ? 'bulunamadı' : 'boş'}!\n\n` +
            `${parsedStudents.length} öğrenci yüklendi ancak öğrenci numaraları eksik.\n\n` +
            '📋 Doğru format için şablonu indirin:\n' +
            '   SIRA NO | OKUL NO | ADI SOYADI\n' +
            '   1       | 1453    | Ahmet YILMAZ'
          )
        } else {
          setError(null)
        }

        setStudents(parsedStudents)
        onStudentsImported(parsedStudents)
        setFileName(file.name)
        
      } catch (err) {
        console.error('Excel parsing error:', err)
        setError('Excel dosyası okunurken hata: ' + err.message)
      }
    }

    reader.onerror = () => {
      setError('Dosya okuma hatası.')
    }

    reader.readAsArrayBuffer(file)
  }, [onStudentsImported])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parseExcelFile(file)
      } else {
        setError('Lütfen .xlsx veya .xls dosyası yükleyin.')
      }
    }
  }, [parseExcelFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e) => {
    const files = e.target.files
    if (files.length > 0) {
      parseExcelFile(files[0])
    }
  }, [parseExcelFile])

  const handleManualEntry = () => {
    const emptyStudents = Array.from({ length: 5 }, (_, i) => ({
      id: `student-manual-${i}-${Date.now()}`,
      siraNo: String(i + 1),
      studentNumber: '',
      no: '',
      name: '',
    }))
    setStudents(emptyStudents)
    onStudentsImported(emptyStudents)
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Öğrenci Listesi</CardTitle>
          <CardDescription>
            Excel dosyası yükleyin veya manuel giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* ÖNEMLİ UYARI */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">⚠️ Önemli: Excel Formatı</p>
                <p>
                  Excel dosyanızda <strong>"OKUL NO"</strong> sütunu ayrıca olmalıdır.
                  <br />
                  "SIRA NO" sütunundaki değerler öğrenci numarası olarak <u>kullanılmaz</u>.
                </p>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Doğru Formatlı Şablonu İndir
            </Button>
          </div>

          {/* Format Gösterimi */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-blue-800 mb-3">📋 Beklenen Excel Formatı:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-3 py-2 border border-blue-200 text-blue-700">SIRA NO</th>
                    <th className="px-3 py-2 border border-blue-200 text-blue-700 bg-blue-200">OKUL NO ⭐</th>
                    <th className="px-3 py-2 border border-blue-200 text-blue-700">ADI SOYADI</th>
                  </tr>
                </thead>
                <tbody className="text-blue-700">
                  <tr>
                    <td className="px-3 py-1.5 border border-blue-200 text-gray-400">1</td>
                    <td className="px-3 py-1.5 border border-blue-200 font-bold text-blue-600">1453</td>
                    <td className="px-3 py-1.5 border border-blue-200">Ahmet YILMAZ</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 border border-blue-200 text-gray-400">2</td>
                    <td className="px-3 py-1.5 border border-blue-200 font-bold text-blue-600">2587</td>
                    <td className="px-3 py-1.5 border border-blue-200">Ayşe DEMİR</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-blue-600 text-xs mt-2">
              ⭐ <strong>OKUL NO</strong> sütunu öğrencinin gerçek numarasını içermelidir!
            </p>
          </div>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
            `}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-800">
                  Excel dosyasını sürükleyip bırakın
                </p>
                <p className="text-sm text-gray-500">
                  veya tıklayarak seçin (.xlsx, .xls)
                </p>
              </div>
            </label>
          </div>

          {/* Error/Warning */}
          {error && (
            <Alert variant={error.includes('UYARI') ? 'default' : 'destructive'} 
                   className={error.includes('UYARI') ? 'bg-amber-50 border-amber-300' : ''}>
              <AlertCircle className={`h-4 w-4 ${error.includes('UYARI') ? 'text-amber-600' : ''}`} />
              <AlertDescription className={`whitespace-pre-line ${error.includes('UYARI') ? 'text-amber-800' : ''}`}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {students.length > 0 && !error && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong>{students.length} öğrenci</strong> başarıyla yüklendi ({fileName})
              </AlertDescription>
            </Alert>
          )}

          {/* Student List Preview */}
          {students.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Öğrenci Listesi Önizleme:</h3>
              <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-16">Sıra</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-600 uppercase">Okul No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Adı Soyadı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-sm text-gray-400">{student.siraNo}</td>
                        <td className="px-4 py-2.5 text-sm font-bold text-blue-600">
                          {student.studentNumber || <span className="text-red-400 font-normal">BOŞ!</span>}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-900">{student.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Eksik numara uyarısı */}
              {students.some(s => !s.studentNumber) && (
                <p className="text-sm text-red-500">
                  ⚠️ Bazı öğrencilerin okul numarası eksik! Excel dosyanızı kontrol edin.
                </p>
              )}
            </div>
          )}

          {/* Manual Entry */}
          <div className="pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleManualEntry} className="w-full">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Manuel Giriş Yap
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Geri
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          disabled={students.length === 0}
          className="min-w-[200px]"
        >
          Sonraki Adım
        </Button>
      </div>
    </div>
  )
}

export default ExcelUploader
