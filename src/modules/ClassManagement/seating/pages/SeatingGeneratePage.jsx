import React, { useState, useEffect, useCallback } from 'react'
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDraggable,
    useDroppable
} from '@dnd-kit/core'
import { seatingRepo } from '../repo/seatingRepo'
import { generateSeatingPlan, validatePlan } from '../logic/algo'
import { classRepo } from '../../repo/classRepo'
import { pdf } from '@react-pdf/renderer'
import { ClassSeatingPDF } from '../report/ClassSeatingPDF'
import { generateReportData } from '../report/reportLogic'
import { Settings, Play, Save, Users, RefreshCw, LayoutGrid, Armchair, Lock, Unlock, AlertCircle, AlertTriangle, RotateCcw, FileText, Download } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

// --- DRAGGABLE ITEMS ---

const DraggableStudent = ({ id, student, isLocked }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { studentId: student?.id, sourceSeatId: id },
        disabled: isLocked || !student
    })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
    } : undefined

    if (!student) return null

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                w-full h-full flex flex-col items-center justify-center p-1 rounded-lg text-center select-none cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-50 ring-2 ring-blue-500 bg-blue-100' : isLocked ? 'cursor-default' : 'hover:bg-gray-50'}
            `}
        >
            <span className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{student.name}</span>
            {student._profile?.specialNeeds && <span className="text-[9px] text-red-500 font-bold mt-0.5">(!)</span>}
        </div>
    )
}

const DroppableSeat = ({ seatId, isLocked, onToggleLock, children, isActive, warning }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: seatId,
        disabled: isLocked
    })

    return (
        <div
            ref={setNodeRef}
            className={`
                relative flex-1 flex flex-col items-center justify-center min-h-[70px] rounded-lg border transition-all
                ${isOver && !isLocked ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-200' : ''}
                ${isLocked ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200'}
                ${warning ? 'border-red-300 bg-red-50' : ''}
            `}
        >
            {/* Pin Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(seatId); }}
                className={`absolute top-1 right-1 p-1 rounded-full hover:bg-black/5 transition-colors z-10 ${isLocked ? 'text-gray-600' : 'text-gray-300 hover:text-gray-400'}`}
                title={isLocked ? "Kilidi Aç" : "Kilitle"}
            >
                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>

            {/* Warning Dot */}
            {warning && (
                <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" title={warning.message}></div>
            )}

            {children}
        </div>
    )
}

// --- GRID COMPONENT ---

const SeatGrid = ({ setup, assignments, students, pinnedSeats, onToggleLock, violations }) => {
    const rows = Array.from({ length: setup.rows }, (_, i) => i + 1)
    const cols = Array.from({ length: setup.cols }, (_, i) => i + 1)

    const getWarning = (seatId) => violations.find(v => v.seatId === seatId)

    return (
        <div className="flex flex-col gap-4 items-center overflow-x-auto p-4 bg-gray-50 rounded-xl border border-gray-200 select-none">
            <div className="w-full max-w-md bg-gray-200 text-gray-500 text-xs text-center py-1 rounded-full mb-4">
                TAHTA / ÖĞRETMEN MASASI
            </div>

            <div
                className="grid gap-x-8 gap-y-6"
                style={{ gridTemplateColumns: `repeat(${setup.cols}, minmax(140px, 1fr))` }}
            >
                {rows.map(r => (
                    React.FragmentKey = r,
                    cols.map(c => {
                        const leftId = `R${r}-C${c}-L`
                        const rightId = `R${r}-C${c}-R`
                        const singleId = `R${r}-C${c}`

                        const getStudent = (id) => students.find(s => s.id === assignments[id])

                        if (setup.deskType === 'double') {
                            return (
                                <div key={`desk-${r}-${c}`} className="flex gap-1 p-2 bg-white rounded-xl shadow-sm border border-gray-200">
                                    <DroppableSeat
                                        seatId={leftId}
                                        isLocked={pinnedSeats.includes(leftId)}
                                        onToggleLock={onToggleLock}
                                        warning={getWarning(leftId)}
                                    >
                                        <DraggableStudent id={leftId} student={getStudent(leftId)} isLocked={pinnedSeats.includes(leftId)} />
                                    </DroppableSeat>
                                    <div className="w-[1px] bg-gray-200 my-2"></div>
                                    <DroppableSeat
                                        seatId={rightId}
                                        isLocked={pinnedSeats.includes(rightId)}
                                        onToggleLock={onToggleLock}
                                        warning={getWarning(rightId)}
                                    >
                                        <DraggableStudent id={rightId} student={getStudent(rightId)} isLocked={pinnedSeats.includes(rightId)} />
                                    </DroppableSeat>
                                </div>
                            )
                        } else {
                            return (
                                <div key={`desk-${r}-${c}`} className="flex flex-col items-center justify-center p-1 bg-white rounded-xl shadow-sm border border-gray-200 min-h-[90px]">
                                    <DroppableSeat
                                        seatId={singleId}
                                        isLocked={pinnedSeats.includes(singleId)}
                                        onToggleLock={onToggleLock}
                                        warning={getWarning(singleId)}
                                    >
                                        <DraggableStudent id={singleId} student={getStudent(singleId)} isLocked={pinnedSeats.includes(singleId)} />
                                    </DroppableSeat>
                                </div>
                            )
                        }
                    })
                ))}
            </div>
        </div>
    )
}

// --- SETUP PANEL ---
const SetupPanel = ({ setup, onChange, mode, onModeChange }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-gray-400" /> Sınıf Ayarları
        </h3>

        {/* Geometry */}
        <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Geometri</label>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Sıra Tipi</label>
                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <button onClick={() => onChange({ ...setup, deskType: 'single' })} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${setup.deskType === 'single' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tekli</button>
                        <button onClick={() => onChange({ ...setup, deskType: 'double' })} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${setup.deskType === 'double' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Çiftli</button>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ön Sıra</label>
                    <input type="number" min="1" max="3" value={setup.frontRows} onChange={e => onChange({ ...setup, frontRows: parseInt(e.target.value) })} className="w-full p-2 text-sm font-medium border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-blue-100 outline-none" />
                </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Grid Boyutu (Satır x Sütun)</label>
                <div className="flex gap-2 items-center">
                    <input type="number" min="1" max="10" value={setup.rows} onChange={e => onChange({ ...setup, rows: parseInt(e.target.value) })} className="w-full p-2 text-sm font-medium border border-gray-200 rounded-lg text-center" />
                    <span className="text-gray-300 font-bold">X</span>
                    <input type="number" min="1" max="10" value={setup.cols} onChange={e => onChange({ ...setup, cols: parseInt(e.target.value) })} className="w-full p-2 text-sm font-medium border border-gray-200 rounded-lg text-center" />
                </div>
            </div>
        </div>

        {/* Algorithm Mode */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Algoritma</label>
            <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Dağılım Modu</label>
                <select
                    value={mode}
                    onChange={(e) => onModeChange(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500"
                >
                    <option value="free">Serbest (Karışık)</option>
                    <option value="girl_boy">Kız - Erkek (Dengeli)</option>
                </select>
            </div>
        </div>
    </div>
)

// --- MAIN PAGE ---

export default function SeatingGeneratePage() {
    const navigate = useNavigate()
    const [setup, setSetup] = useState(seatingRepo.loadSetup())
    const [mode, setMode] = useState('free') // New State for Mode
    const [assignments, setAssignments] = useState({})
    const [pinnedSeats, setPinnedSeats] = useState([])
    const [stats, setStats] = useState({ placed: 0, unplaced: 0 })
    const [violations, setViolations] = useState([])
    const [loading, setLoading] = useState(false)
    const [students, setStudents] = useState([])
    const [activeId, setActiveId] = useState(null)
    const [message, setMessage] = useState(null)

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    useEffect(() => {
        setStudents(classRepo.getStudents())
        const savedPlan = seatingRepo.loadPlan()
        if (savedPlan) {
            setAssignments(savedPlan.assignments || {})
            setPinnedSeats(savedPlan.pinnedSeatIds || [])
            setStats(savedPlan.stats || {})
            // Re-validate
            if (savedPlan.assignments) {
                const roster = classRepo.getStudents()
                const conflicts = classRepo.listConflicts()
                const rules = seatingRepo.loadRules()
                setViolations(validatePlan(savedPlan.assignments, savedPlan.seats, roster, conflicts, rules))
            }
        }
    }, [])

    const savePlan = (newAssignments, newPinned) => {
        const roster = classRepo.getStudents()
        const conflicts = classRepo.listConflicts()
        const rules = seatingRepo.loadRules()

        // Re-construct logic-friendly structure for validation (need seats array)
        const seats = []
        for (let r = 1; r <= setup.rows; r++) {
            for (let c = 1; c <= setup.cols; c++) {
                const isFront = r <= setup.frontRows
                if (setup.deskType === 'double') {
                    seats.push({ id: `R${r}-C${c}-L`, isFront }); seats.push({ id: `R${r}-C${c}-R`, isFront })
                } else {
                    seats.push({ id: `R${r}-C${c}`, isFront })
                }
            }
        }

        const newViolations = validatePlan(newAssignments, seats, roster, conflicts, rules)

        const placedCount = Object.values(newAssignments).filter(Boolean).length
        const total = roster.length

        const savedStats = {
            totalStudents: total,
            placed: placedCount,
            unplaced: total - placedCount,
            conflictsViolated: newViolations.filter(v => v.type === 'conflict').length
        }

        setViolations(newViolations)
        setStats(savedStats)

        // Save to Repo
        seatingRepo.saveSetup(setup)
        seatingRepo.savePlan({
            assignments: newAssignments,
            pinnedSeatIds: newPinned,
            stats: savedStats,
            seats: seats
        })
    }

    const handleGenerate = () => {
        setLoading(true)
        setTimeout(() => {
            seatingRepo.saveSetup(setup)
            // Pass current state AND mode
            const currentPlan = { assignments, pinnedSeatIds: pinnedSeats }
            const result = generateSeatingPlan(currentPlan, mode) // Pass mode

            if (result.error) {
                alert(result.error)
            } else {
                setAssignments(result.assignments)
                setPinnedSeats(result.pinnedSeatIds)
                setStats(result.stats)
                setViolations(result.violations || [])
                seatingRepo.savePlan(result)
                setMessage('Yeni plan oluşturuldu')
                setTimeout(() => setMessage(null), 2000)
            }
            setLoading(false)
        }, 600)
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        setActiveId(null)

        if (!over || active.id === over.id) return

        const sourceSeatId = active.id
        const targetSeatId = over.id

        if (pinnedSeats.includes(targetSeatId)) return

        const sourceStudentId = assignments[sourceSeatId]
        const targetStudentId = assignments[targetSeatId]

        const newAssignments = { ...assignments }

        if (targetStudentId) {
            newAssignments[sourceSeatId] = targetStudentId
            newAssignments[targetSeatId] = sourceStudentId
        } else {
            newAssignments[targetSeatId] = sourceStudentId
            newAssignments[sourceSeatId] = null
        }

        setAssignments(newAssignments)
        savePlan(newAssignments, pinnedSeats)
    }

    const handleDragStart = (event) => {
        setActiveId(event.active.id)
    }

    // ... toggleLock, handleReset, handleDownloadReport remain same ...
    const toggleLock = (seatId) => {
        const newPinned = pinnedSeats.includes(seatId)
            ? pinnedSeats.filter(id => id !== seatId)
            : [...pinnedSeats, seatId]
        setPinnedSeats(newPinned)
        savePlan(assignments, newPinned)
    }

    const handleReset = () => {
        if (window.confirm('Oturma planı sıfırlanacak (Kilitli koltuklar hariç). Onaylıyor musunuz?')) {
            const newAssignments = { ...assignments }
            // Clear unpinned assignments
            Object.keys(newAssignments).forEach(key => {
                if (!pinnedSeats.includes(key)) newAssignments[key] = null
            })
            setAssignments(newAssignments)
            savePlan(newAssignments, pinnedSeats)
        }
    }

    const handleDownloadReport = async () => {
        if (students.length === 0 || Object.keys(assignments).length === 0) {
            alert('Rapor almak için önce bir plan oluşturmalısınız.')
            return
        }

        const btn = document.getElementById('btn-report')
        if (btn) btn.disabled = true;

        try {
            const rules = seatingRepo.loadRules()
            // Re-calculate violations for the report to be sure
            const reportData = generateReportData({
                stats,
                manualMoves: seatingRepo.loadPlan()?.manualMoves || 0
            }, setup, rules, students, violations)

            const doc = (
                <ClassSeatingPDF
                    setup={setup}
                    assignments={assignments}
                    students={students}
                    reportData={reportData}
                    violations={violations}
                />
            )

            const blob = await pdf(doc).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `BiSınıf_OturmaPlani_${new Date().toISOString().slice(0, 10)}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err) {
            console.error(err)
            alert('PDF oluşturulurken hata oluştu.')
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    if (students.length === 0) return (<div className="p-8 text-center text-gray-500">Liste boş.</div>)

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6 pb-20 animate-fade-in">
                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Oturma Planı Oluşturucu</h2>
                        <p className="text-xs text-gray-500">Otomatik yerleştirin veya sürükleyip bırakarak düzenleyin.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            id="btn-report"
                            onClick={handleDownloadReport}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <FileText className="w-4 h-4" /> Öneri Belgesi
                        </button>
                        <div className="h-9 w-[1px] bg-gray-200 mx-1"></div>
                        <button onClick={handleReset} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sıfırla">
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <div className="h-9 w-[1px] bg-gray-200 mx-1"></div>
                        <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all disabled:opacity-70">
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-blue-100" />}
                            {Object.keys(assignments).length > 0 ? 'Yeniden Dağıt' : 'Öneri Üret'}
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-xl z-50 animate-fade-in-up">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
                    {/* Left Sidebar */}
                    <div className="space-y-6">
                        <SetupPanel setup={setup} onChange={setSetup} mode={mode} onModeChange={setMode} />

                        {/* Stats Panel - FIXED UI */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 text-sm">Durum Özeti</h3>
                            </div>

                            <div className="space-y-3">
                                {/* Row 1 */}
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500">Yerleşen</span>
                                    <span className="text-sm font-bold text-gray-900">{stats.placed} <span className="text-gray-400 font-normal">/ {stats.totalStudents}</span></span>
                                </div>

                                {/* Row 2 */}
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500">Boşta</span>
                                    {stats.unplaced > 0 ? (
                                        <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {stats.unplaced}
                                        </span>
                                    ) : (
                                        <span className="text-sm font-bold text-green-600">0</span>
                                    )}
                                </div>

                                {/* Row 3 */}
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500">Kilitli</span>
                                    <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{pinnedSeats.length}</span>
                                </div>
                            </div>

                            {/* Violations */}
                            {violations.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="font-bold text-red-600 text-xs mb-2 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> {violations.length} Uyarı Mevcut
                                    </h4>
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {violations.map((v, idx) => (
                                            <div key={idx} className="bg-red-50 p-2 rounded text-[11px] text-red-800 leading-snug border border-red-100">
                                                {v.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-[10px] text-gray-400 text-center leading-relaxed px-4">
                            Koltuklardaki <Lock className="w-3 h-3 inline mx-0.5" /> ikonuna basarak kilitleyebilirsiniz.
                        </div>
                    </div>

                    {/* Right Grid */}
                    <div className="min-h-[500px]">
                        <SeatGrid
                            setup={setup}
                            assignments={assignments}
                            students={students}
                            pinnedSeats={pinnedSeats}
                            onToggleLock={toggleLock}
                            violations={violations}
                        />
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeId ? (
                    <div className="w-[120px] h-[60px] bg-white border-2 border-blue-500 shadow-xl rounded-lg flex items-center justify-center p-2 opacity-90 cursor-grabbing">
                        <span className="text-xs font-bold text-gray-900">{students.find(s => s.id === assignments[activeId])?.name}</span>
                    </div>
                ) : null}
            </DragOverlay>

        </DndContext>
    )
}
