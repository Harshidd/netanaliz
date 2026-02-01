import React, { useState, useMemo } from 'react'
import { Button } from './ui/Button'
import { Download, Printer, FileSpreadsheet, LayoutGrid } from 'lucide-react'
import * as XLSX from 'xlsx'
import { buildAnalysis } from '../core/analysisEngine'
import { exportFullReportPDF } from './report/pdfExport'

// Components
import { AnalysisSidebar } from './analysis/AnalysisSidebar'
import { SummarySection } from './analysis/SummarySection'
import { ClassAnalysisSection } from './analysis/ClassAnalysisSection'
import { OutcomeAnalysisSection } from './analysis/OutcomeAnalysisSection'
import { ItemAnalysisSection } from './analysis/ItemAnalysisSection'
import { StudentReportSection } from './analysis/StudentReportSection'

const AnalysisDashboard = ({ students, grades, questions, config }) => {
  const [activeSection, setActiveSection] = useState('ozet')
  const [isExporting, setIsExporting] = useState(false)

  // 1. Core Analysis Calculation
  const analysis = useMemo(() => {
    return buildAnalysis({
      students,
      grades,
      questions,
      outcomes: config.outcomes || [],
      generalPassingScore: config.generalPassingScore || 50,
      outcomeMasteryThreshold: config.outcomeMasteryThreshold || 50
    })
  }, [students, grades, questions, config])

  // 2. Export Functions
  const handlePrint = () => {
    window.print()
  }

  // PDF Export - @react-pdf/renderer ile profesyonel vektör PDF
  const exportToPDF = async () => {
    console.log("PDF EXPORT: exportFullReportPDF ÇAĞRILDI", new Date().toISOString())
    try {
      setIsExporting(true)
      console.log('[PDF] Generating professional vector PDF...')

      await exportFullReportPDF({
        analysis,
        config,
        questions
      })

      console.log('[PDF] Export complete!')
    } catch (error) {
      console.error('[PDF] Export Error:', error)
      alert('PDF oluşturulurken bir hata oluştu: ' + (error?.message || error))
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(analysis.studentResults.map(s => ({
      'Öğrenci No': s.no || s.studentNumber,
      'Ad Soyad': s.name,
      'Puan': s.total,
      'Durum': s.isPassing ? 'Geçti' : 'Kaldı',
      'Sıralama': s.rank
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sinif_Listesi")
    XLSX.writeFile(wb, "NetAnaliz_Sinif_Listesi.xlsx")
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'ozet': return <SummarySection analysis={analysis} config={config} />
      case 'sinif': return <ClassAnalysisSection analysis={analysis} config={config} />
      case 'kazanim': return <OutcomeAnalysisSection analysis={analysis} config={config} />
      case 'soru': return <ItemAnalysisSection analysis={analysis} config={config} />
      case 'karne': return <StudentReportSection analysis={analysis} config={config} />
      default: return <SummarySection analysis={analysis} config={config} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-4 shadow-sm no-print screen-only">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">NetAnaliz Raporu</h1>
              <p className="text-xs text-slate-500 mt-1">{config.schoolName || 'Okul Adı Girilmedi'} • {new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSection === 'ozet' && (
              <>
                <Button variant="outline" size="sm" onClick={handlePrint} className="hidden md:flex">
                  <Printer className="w-4 h-4 mr-2" /> Yazdır
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel} className="hidden md:flex border-green-200 text-green-700 hover:bg-green-50">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className="bg-blue-600 hover:bg-blue-700 group min-w-[120px]"
                >
                  {isExporting ? (
                    <span className="flex items-center">Hazırlanıyor...</span>
                  ) : (
                    <span className="flex items-center"><Download className="w-4 h-4 mr-2 group-hover:animate-bounce" /> PDF İndir</span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 screen-only">
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0 sticky top-28 no-print">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Rapor Bölümleri</h3>
              <AnalysisSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            </div>
          </aside>

          {/* Mobile Nav */}
          <div className="md:hidden w-full overflow-x-auto pb-2 -mt-4 mb-4 scrollbar-hide no-print">
            <div className="flex gap-2 min-w-max">
              <AnalysisSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white/50 min-h-[500px] rounded-3xl print:p-0">
              {renderSection()}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AnalysisDashboard
