import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Printer, Download } from 'lucide-react'
import { exportItemAnalysisPDF } from '../report/pdfExport'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { BarChart3 } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export const ItemAnalysisSection = ({ analysis, config }) => {
    const [isExporting, setIsExporting] = useState(false)
    const items = analysis?.questions ?? []

    const handleDownloadPDF = async () => {
        try {
            setIsExporting(true)
            await exportItemAnalysisPDF({ analysis, config })
        } catch (error) {
            console.error(error)
            alert('PDF oluşturulamadı: ' + error.message)
        } finally {
            setIsExporting(false)
        }
    }

    const handlePrint = () => window.print()

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200">
                    <p className="font-semibold text-slate-800">{label}</p>
                    <p className="text-sm text-slate-600">
                        Zorluk (Başarı): <span className="font-bold text-blue-600">%{payload[0].value.toFixed(0)}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Daha düşük = Daha zor</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Soru Analizi</h2>
                    <p className="text-slate-500">Soru bazında başarı ve ayırt edicilik (zorluk) analizi</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Grafik */}
                <Card className="lg:col-span-2 border border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                            Soru Başarı Grafiği
                        </CardTitle>
                        <CardDescription>Her soru için sınıf başarısı (%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="qNo"
                                        tickFormatter={(val) => `S${val}`}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                    <Bar dataKey="difficulty" radius={[4, 4, 0, 0]}>
                                        {items.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.difficulty > 70 ? '#10b981' : entry.difficulty > 40 ? '#f59e0b' : '#ef4444'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Liste */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:h-[420px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Soru</th>
                                <th className="px-4 py-3 text-center">Max</th>
                                <th className="px-4 py-3 text-center">Ort.</th>
                                <th className="px-4 py-3 text-right">Zorluk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item) => (
                                <tr key={item.qNo}>
                                    <td className="px-4 py-3 font-medium text-slate-700">Soru {item.qNo}</td>
                                    <td className="px-4 py-3 text-center text-slate-500">{item.maxScore}</td>
                                    <td className="px-4 py-3 text-center text-slate-900 font-medium">{item.avgScore.toFixed(1)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`inline-block px-2 py-0.5 rounded textxs font-bold ${item.difficulty > 70 ? 'bg-emerald-100 text-emerald-700' :
                                            item.difficulty > 40 ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            %{item.difficulty.toFixed(0)}
                                        </span>
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
