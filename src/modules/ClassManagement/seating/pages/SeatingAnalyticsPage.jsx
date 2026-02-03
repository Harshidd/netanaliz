import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart2, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { seatingRepo } from '../repo/seatingRepo'
import { classRepo } from '../../repo/classRepo'
import { getAvailableExams, calculateSeatingAnalytics } from '../logic/analytics'
import { ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function SeatingAnalyticsPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    const [includeSuspicious, setIncludeSuspicious] = useState(false)
    const [manualMap, setManualMap] = useState({})

    // Exam Selection State
    const [availableExams, setAvailableExams] = useState([])
    const [selectedExamId, setSelectedExamId] = useState(null)
    const [isExamMenuOpen, setIsExamMenuOpen] = useState(false)

    // We need list of exam students to offer in dropdown. 
    // Usually logic loads it. We will ask logic to return 'examStudents' or load it here.
    // For now, let's load logic inputs here to be safe.
    const [examStudentList, setExamStudentList] = useState([])

    // Initial Load
    useEffect(() => {
        const exams = getAvailableExams()
        setAvailableExams(exams)

        // Load Preference
        let initialExamId = seatingRepo.loadSelectedExamId()

        // Validation: Does preference exist?
        if (initialExamId && !exams.find(e => e.id === initialExamId)) {
            initialExamId = null // Invalid preference
        }

        // Default to first (newest)
        if (!initialExamId && exams.length > 0) {
            initialExamId = exams[0].id
        }

        setSelectedExamId(initialExamId)

        // If we picked a default, save it (optional, but good for UX)
        if (initialExamId) {
            seatingRepo.saveSelectedExamId(initialExamId)
        }
    }, [])

    // Refetch/Recalculate when dependencies change
    useEffect(() => {
        if (!selectedExamId && availableExams.length > 0) return // Wait for select

        // Load Inputs
        const plan = seatingRepo.loadPlan()
        const setup = seatingRepo.loadSetup()
        const roster = classRepo.getStudents()
        const savedMap = seatingRepo.loadAnalyticsMap()

        setManualMap(savedMap)

        // Identify Selected Exam Data
        const examObj = availableExams.find(e => e.id === selectedExamId)
        const selectedExamData = examObj ? examObj.data : null

        // Run Logic
        const result = calculateSeatingAnalytics(
            plan?.assignments || {},
            roster,
            setup,
            savedMap,
            includeSuspicious,
            selectedExamData
        )

        // Also get exam list indirectly or load project state here to populate dropdowns
        // We will assume result now returns `totalExamStudents` count, but checking source code of logic..
        // It returns `suspiciousMatches` which has { roster, exam, confidence }.
        // To build a full manual match UI we need all exam students. 
        // Let's grab them from `selectedExamData` directly for the UI dropdowns.
        if (selectedExamData && selectedExamData.students) {
            setExamStudentList(selectedExamData.students)
        }

        setData(result)
        setLoading(false)
    }, [includeSuspicious, selectedExamId, availableExams]) // Re-run when toggle or exam changes

    const handleExamSelect = (examId) => {
        setSelectedExamId(examId)
        seatingRepo.saveSelectedExamId(examId) // Persist
        setIsExamMenuOpen(false)
    }

    const handleManualMatch = (rosterId, examStudentId) => {
        const newMap = { ...manualMap }
        if (examStudentId === "") {
            delete newMap[rosterId]
        } else {
            newMap[rosterId] = {
                examStudentId,
                updatedAt: new Date().toISOString(),
                confidenceOverride: 1.0
            }
        }
        seatingRepo.saveAnalyticsMap(newMap)
        setManualMap(newMap)

        // Trigger Recalc
        const plan = seatingRepo.loadPlan()
        const setup = seatingRepo.loadSetup()
        const roster = classRepo.getStudents()

        const examObj = availableExams.find(e => e.id === selectedExamId)
        const selectedExamData = examObj ? examObj.data : null

        const result = calculateSeatingAnalytics(
            plan?.assignments || {},
            roster,
            setup,
            newMap,
            includeSuspicious,
            selectedExamData
        )
        setData(result)
    }



    if (loading) return <div className="p-8 text-center text-gray-500">Analizler hazırlanıyor...</div>

    const hasError = data?.error
    const zones = data?.zones || []

    // Neutral Chart Colors (Blue Variations)
    const getBarColor = (name) => {
        if (name.includes('Ön')) return '#60a5fa' // Blue-400
        if (name.includes('Orta')) return '#93c5fd' // Blue-300
        if (name.includes('Arka')) return '#bfdbfe' // Blue-200
        return '#cbd5e1'
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/class/seating')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-blue-600" />
                            Oturma Düzeni Analizi
                        </h2>
                        <p className="text-xs text-gray-500">Mevcut düzen ile son sınav sonuçları arasındaki ilişki.</p>
                    </div>

                    {/* Exam Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsExamMenuOpen(!isExamMenuOpen)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 min-w-[200px] justify-between transition-colors"
                        >
                            <span className="truncate max-w-[180px]">
                                {availableExams.find(e => e.id === selectedExamId)?.title || 'Sınav Seçiniz'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExamMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isExamMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                                {availableExams.length > 0 ? availableExams.map(exam => (
                                    <button
                                        key={exam.id}
                                        onClick={() => handleExamSelect(exam.id)}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex flex-col gap-0.5 border-b border-gray-50 last:border-0 transition-colors ${selectedExamId === exam.id ? 'bg-blue-50/50 text-blue-700' : 'text-gray-700'}`}
                                    >
                                        <span className="font-medium truncate">{exam.title}</span>
                                        <span className={`text-[10px] ${selectedExamId === exam.id ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {exam.date || 'Tarih Belirtilmemiş'}
                                        </span>
                                    </button>
                                )) : (
                                    <div className="px-4 py-3 text-xs text-gray-400 text-center">Kayıtlı sınav bulunamadı</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Suspicious Toggle */}
                {!hasError && (
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold text-gray-700">Şüpheli Eşleşmeler</span>
                            <span className="text-[10px] text-gray-500">Benzer isimleri dahil et</span>
                        </div>
                        <button
                            onClick={() => setIncludeSuspicious(!includeSuspicious)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${includeSuspicious ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${includeSuspicious ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                )}
            </div>

            {hasError ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                    <Info className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Veri Yetersiz</h3>
                    <p className="text-amber-700 mb-6 max-w-md mx-auto">{hasError}</p>
                    <button
                        onClick={() => navigate('/exam-analysis')}
                        className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-bold hover:bg-amber-200 transition-colors"
                    >
                        Sınav Analiz Modülüne Git
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Block 1: Zone Analysis Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <h3 className="text-base font-bold text-gray-900 mb-6">Bölgelere Göre Başarı</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={zones} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={50}>
                                        {zones.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {zones.map(z => (
                                <div key={z.name} className="text-center p-2 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-500">{z.name}</div>
                                    <div className="text-sm font-bold text-gray-900">{z.avg} Puan</div>
                                    <div className="text-[10px] text-gray-400">{z.count} Öğrenci</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Block 2: Generated Insights & Stats */}
                    <div className="space-y-6">
                        {/* Matching Quality Panel */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-gray-900">Veri Eşleşme Durumu</h3>
                                <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">
                                    Toplam: {data.matchStats.total}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="p-2 bg-green-50 rounded-lg border border-green-100 text-center">
                                    <div className="text-lg font-bold text-green-700">{data.matchStats.high}</div>
                                    <div className="text-[10px] text-green-600 font-medium">Güvenilir</div>
                                </div>
                                <div className={`p-2 rounded-lg border text-center transition-colors ${includeSuspicious ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className={`text-lg font-bold ${includeSuspicious ? 'text-blue-700' : 'text-amber-700'}`}>{data.matchStats.suspicious}</div>
                                    <div className={`text-[10px] font-medium ${includeSuspicious ? 'text-blue-600' : 'text-amber-600'}`}>
                                        Şüpheli {includeSuspicious && '(Dahil)'}
                                    </div>
                                </div>
                                <div className="p-2 bg-red-50 rounded-lg border border-red-100 text-center">
                                    <div className="text-lg font-bold text-red-700">{data.matchStats.unmatched}</div>
                                    <div className="text-[10px] text-red-600 font-medium">Eşleşmedi</div>
                                </div>
                            </div>

                            {/* Manual Matching UI for Suspicious/Unmatched */}
                            {data.suspiciousMatches.length > 0 && (
                                <div className="mt-4 border-t border-gray-100 pt-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Şüpheli Eşleşmeleri Onayla</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {data.suspiciousMatches.map((m, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg gap-2">
                                                <div className="flex-1 truncate">
                                                    <span className="font-semibold text-gray-800">{m.roster.name}</span>
                                                    <span className="text-gray-400 mx-1">→</span>
                                                    <span className="text-gray-600">{m.exam.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                        %{Math.round(m.confidence * 100)}
                                                    </span>
                                                    {!manualMap[m.roster.id] && (
                                                        <button
                                                            onClick={() => handleManualMatch(m.roster.id, m.exam.id)}
                                                            className="text-xs bg-white border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 px-2 py-1 rounded transition-colors"
                                                        >
                                                            Onayla
                                                        </button>
                                                    )}
                                                    {manualMap[m.roster.id] && (
                                                        <button
                                                            onClick={() => handleManualMatch(m.roster.id, "")}
                                                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                                        >
                                                            Geri Al
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* General Evaluation */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            {/* ... same as before but updated logic handles messages ... */}
                            <h3 className="text-base font-bold text-gray-900 mb-4">Genel Değerlendirme</h3>
                            <div className="space-y-3">
                                {data.comments.length > 0 ? (
                                    data.comments.map((comment, i) => (
                                        <div key={i} className="flex gap-3 items-start p-3 bg-blue-50/50 rounded-xl border border-blue-50">
                                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-blue-900 leading-relaxed">{comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 italic">
                                        Belirgin bir korelasyon tespit edilemedi.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 mb-4">İstatistiksel Özet</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-xs text-gray-500 mb-1">Korelasyon (r)</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-xl font-bold ${Math.abs(data.correlationRaw) > 0.3 ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {data.correlation}
                                        </span>
                                        {data.correlationN < 10 && (
                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded border border-amber-100" title="Veri sayısı güvenilir sonuç için yetersiz">
                                                Güven Düşük (N={data.correlationN})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
