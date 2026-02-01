import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Download, Printer } from 'lucide-react'
import { exportClassListPDF } from '../report/pdfExport'

export const ClassAnalysisSection = ({ analysis, config }) => {
    const [isExporting, setIsExporting] = useState(false)
    const students = analysis?.studentResults ?? []
    const questions = analysis?.questions ?? []

    const handlePrint = () => window.print()

    const handleDownloadPDF = async () => {
        try {
            setIsExporting(true)
            await exportClassListPDF({ analysis, config })
        } catch (error) {
            console.error(error)
            alert('PDF oluşturulamadı: ' + error.message)
        } finally {
            setIsExporting(false)
        }
    }

    // Sıralama: En düşük puandan en yüksek puana, eşitse numaraya göre
    const sortedStudents = [...students].sort((a, b) => {
        const totalA = a.total ?? 0
        const totalB = b.total ?? 0

        // Önce puana göre (düşükten yükseğe)
        if (totalA !== totalB) {
            return totalA - totalB
        }

        // Puanlar eşitse numaraya göre
        const noA = parseInt(a.no || a.studentNumber || '9999')
        const noB = parseInt(b.no || b.studentNumber || '9999')
        return noA - noB
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Sınıf Listesi</h2>
                    <p className="text-slate-500">Tüm öğrencilerin başarı sıralaması (düşükten yükseğe)</p>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Yazdır
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isExporting ? 'Hazırlanıyor...' : (
                            <>
                                <Download className="w-4 h-4 mr-2" /> PDF İndir
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-16">Sıra</th>
                                <th className="px-4 py-3 w-20">No</th>
                                <th className="px-4 py-3">Adı Soyadı</th>
                                {/* Soru Sütunları */}
                                {questions.map((q, i) => (
                                    <th key={`q-${i}`} className="px-2 py-3 text-center text-xs">
                                        S{i + 1}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center font-bold">Toplam</th>
                                <th className="px-4 py-3 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedStudents.map((student, idx) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-400">
                                        {idx + 1}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-600">
                                        {student.no || student.studentNumber || '-'}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {student.name}
                                    </td>
                                    {/* Soru Puanları */}
                                    {questions.map((q, i) => {
                                        const score = student.questionScores?.[i] ?? 0
                                        return (
                                            <td key={`s-${student.id}-q-${i}`} className="px-2 py-3 text-center text-xs text-slate-600">
                                                {Math.round(score)}
                                            </td>
                                        )
                                    })}
                                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                                        {Math.round(student.total)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {student.isPassing ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                Geçti
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                Kaldı
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
