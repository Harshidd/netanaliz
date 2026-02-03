import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Download, RotateCw, Eye, Calendar, LayoutGrid, CheckCircle2, Edit2, Check, X, Palette } from 'lucide-react'
import { seatingRepo } from '../repo/seatingRepo'
import { classRepo } from '../../repo/classRepo'
import { pdf } from '@react-pdf/renderer'
import { ClassSeatingPDF } from '../report/ClassSeatingPDF'
import { generateReportData } from '../report/reportLogic'
import { validatePlan } from '../logic/algo'

const MiniSeatGrid = ({ snapshot, students, showGenderColors }) => {
    const { setup, layout } = snapshot
    if (!setup) return <div className="text-xs text-gray-400">Veri yok</div>

    // Calculate generic cell size based on grid dimensions to fit in a fixed box
    const rows = Array.from({ length: setup.rows }, (_, i) => i + 1)
    const cols = Array.from({ length: setup.cols }, (_, i) => i + 1)

    // Helper to get color
    const getCellColor = (seatId) => {
        const studentId = layout[seatId]
        if (!studentId) return 'bg-gray-100 border-gray-200'

        if (!showGenderColors) return 'bg-gray-400 border-gray-500' // Neutral (darker gray for occupied)

        const student = students.find(s => s.id === studentId)
        if (!student) return 'bg-gray-300 border-gray-400' // Unknown student

        return student.gender === 'K' ? 'bg-pink-300 border-pink-400' : 'bg-blue-300 border-blue-400'
    }

    return (
        <div className="w-full h-32 bg-gray-50 rounded-lg p-2 flex items-center justify-center border border-gray-100 select-none pointer-events-none">
            <div
                className="grid gap-0.5"
                style={{
                    gridTemplateColumns: `repeat(${setup.cols}, 1fr)`,
                    width: '100%',
                    maxWidth: '180px'
                }}
            >
                {rows.map(r => (
                    cols.map(c => {
                        if (setup.deskType === 'double') {
                            const l = getCellColor(`R${r}-C${c}-L`)
                            const right = getCellColor(`R${r}-C${c}-R`)
                            return (
                                <div key={`${r}-${c}`} className="flex gap-[1px]">
                                    <div className={`flex-1 h-3 rounded-[1px] border ${l}`}></div>
                                    <div className={`flex-1 h-3 rounded-[1px] border ${right}`}></div>
                                </div>
                            )
                        } else {
                            const color = getCellColor(`R${r}-C${c}`)
                            return (
                                <div key={`${r}-${c}`} className={`h-3 w-full rounded-[2px] border ${color}`}></div>
                            )
                        }
                    })
                ))}
            </div>
        </div>
    )
}

// --- HELPER: Sanitize ---
const sanitizeFileName = (title) => {
    const trMap = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i', 'i': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u' }
    return title.split('').map(c => trMap[c] || c).join('').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

const LoadConfirmModal = ({ item, onClose, onConfirm }) => {
    const [dontShow, setDontShow] = useState(false)
    if (!item) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Planı Yükle?</h3>
                <p className="text-sm text-gray-600 mb-4">
                    <strong>"{item.title}"</strong> yüklendiğinde mevcut çalışma alanındaki düzenin üzerine yazılacak.
                </p>

                <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => setDontShow(!dontShow)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${dontShow ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {dontShow && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-700 select-none">Bir daha sorma</span>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 font-bold text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                        İptal
                    </button>
                    <button onClick={() => onConfirm(dontShow)} className="flex-1 py-2.5 bg-blue-600 font-bold text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                        Yükle
                    </button>
                </div>
            </div>
        </div>
    )
}

const HistoryCard = ({ item, students, onDelete, onLoad, onDownload, onRename, showGenderColors }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(item.title)

    const handleSaveTitle = () => {
        const val = editTitle.trim()
        if (val) onRename(item.id, val)
        else setEditTitle(item.title)
        setIsEditing(false)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditTitle(item.title)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSaveTitle()
        if (e.key === 'Escape') handleCancelEdit()
    }

    return (
        <div className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col ${item.isPinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'}`}>
            {/* Header */}
            <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                <div className="flex justify-between items-start mb-2">
                    {/* Title Edit */}
                    <div className="flex-1 mr-2 min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <input
                                    className="w-full text-xs font-bold bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    autoFocus
                                    onBlur={handleCancelEdit}
                                    onKeyDown={handleKeyDown}
                                    onClick={e => e.stopPropagation()}
                                />
                                {/* Icons removed for cleaner input UX since we support KBD shortcuts. */}
                            </div>
                        ) : (
                            <div className="group/title flex items-center gap-2">
                                <h3 className="text-sm font-bold text-gray-900 truncate cursor-pointer" title={item.title} onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                                    {item.title}
                                </h3>
                                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="opacity-0 group-hover/title:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                {item.isPinned && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold">PIN</span>}
                            </div>
                        )}
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString('tr-TR')} • {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.stats?.unplaced === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.stats?.unplaced === 0 ? 'Tamam' : `${item.stats?.unplaced} Eksik`}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            {item.setup?.rows}x{item.setup?.cols}
                        </span>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="p-4 flex justify-center bg-white group-hover:bg-gray-50/30 transition-colors cursor-pointer" onClick={(e) => onLoad(item, e)}>
                <MiniSeatGrid snapshot={item} students={students} showGenderColors={showGenderColors} />
            </div>

            {/* Actions */}
            <div className="p-2 border-t border-gray-100 grid grid-cols-3 gap-2 bg-gray-50/50 mt-auto">
                <button
                    onClick={(e) => onLoad(item, e)}
                    className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all shadow-sm"
                    title="Bu planı yükle"
                >
                    <RotateCw className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Yükle</span>
                </button>

                <button
                    onClick={(e) => onDownload(item, e)}
                    className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-900 transition-all"
                    title="PDF İndir"
                >
                    <Download className="w-4 h-4" />
                    <span className="text-[10px] font-medium">PDF</span>
                </button>

                <button
                    onClick={(e) => onDelete(item.id, e)}
                    className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-red-600 transition-all"
                    title="Sil"
                >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Sil</span>
                </button>
            </div>
        </div>
    )
}

export default function SeatingHistoryPage() {
    const navigate = useNavigate()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState([])
    const [showGenderColors, setShowGenderColors] = useState(false)
    const [confirmItem, setConfirmItem] = useState(null) // for modal

    useEffect(() => {
        // Hydrate
        setStudents(classRepo.getStudents())
        setHistory(seatingRepo.loadHistory())
        setLoading(false)
    }, [])

    const handleDelete = (id, e) => {
        e.stopPropagation()
        if (window.confirm('Bu geçmiş kaydı kalıcı olarak silinecek. Emin misiniz?')) {
            seatingRepo.deleteHistoryItem(id)
            setHistory(seatingRepo.loadHistory()) // Reload
        }
    }

    const handleLoadRequest = (item, e) => {
        e?.stopPropagation()
        const skip = localStorage.getItem('bisinif_class_seating_confirm_load_v1') === 'true'
        if (skip) {
            performLoad(item)
        } else {
            setConfirmItem(item)
        }
    }

    const performLoad = (item) => {
        // Pin before loading
        if (!item.isPinned) {
            seatingRepo.updateHistoryItemPinned(item.id, true)
        }

        seatingRepo.saveSetup(item.setup)
        seatingRepo.savePlan({
            assignments: item.layout,
            pinnedSeatIds: item.pinnedSeatIds,
            stats: item.stats,
            manualMoves: item.manualMoves
        })
        navigate('/class/seating')
    }

    const onModalConfirm = (dontShow) => {
        if (dontShow) {
            localStorage.setItem('bisinif_class_seating_confirm_load_v1', 'true')
        }
        performLoad(confirmItem)
        setConfirmItem(null)
    }

    const handleRename = (id, newTitle) => {
        if (!newTitle.trim()) return
        seatingRepo.updateHistoryItemTitle(id, newTitle)
        setHistory(seatingRepo.loadHistory())
    }

    const handleDownload = async (item, e) => {
        e.stopPropagation()
        try {
            const rules = seatingRepo.loadRules()

            // Reconstruct seats logic
            const seats = []
            if (item.setup) {
                for (let r = 1; r <= item.setup.rows; r++) {
                    for (let c = 1; c <= item.setup.cols; c++) {
                        const isFront = r <= item.setup.frontRows
                        if (item.setup.deskType === 'double') {
                            seats.push({ id: `R${r}-C${c}-L`, isFront }); seats.push({ id: `R${r}-C${c}-R`, isFront })
                        } else {
                            seats.push({ id: `R${r}-C${c}`, isFront })
                        }
                    }
                }
            }

            const violations = validatePlan(item.layout, seats, students, classRepo.listConflicts(), rules)

            const reportData = generateReportData({
                stats: item.stats,
                manualMoves: item.manualMoves
            }, item.setup, rules, students, violations)

            const doc = (
                <ClassSeatingPDF
                    setup={item.setup}
                    assignments={item.layout}
                    students={students}
                    reportData={reportData}
                    violations={violations}
                />
            )

            const blob = await pdf(doc).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${sanitizeFileName(item.title)}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error(error)
            alert('PDF oluşturulamadı: ' + error.message)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>

    return (
        <div className="space-y-6 pb-20 animate-fade-in relative">
            {confirmItem && (
                <LoadConfirmModal
                    item={confirmItem}
                    onClose={() => setConfirmItem(null)}
                    onConfirm={onModalConfirm}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/class/seating')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Plan Geçmişi</h2>
                        <p className="text-xs text-gray-500">Son 50 kayıt. ({history.length} adet)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowGenderColors(!showGenderColors)}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                            ${showGenderColors
                                ? 'bg-pink-50 border-pink-200 text-pink-700'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }
                        `}
                    >
                        <Palette className="w-4 h-4" />
                        {showGenderColors ? 'Renkler Açık' : 'Renklendir'}
                    </button>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Henüz kayıtlı bir geçmiş yok.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {history.map((item) => (
                        <HistoryCard
                            key={item.id}
                            item={item}
                            students={students}
                            onLoad={handleLoadRequest}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                            onRename={handleRename}
                            showGenderColors={showGenderColors}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
