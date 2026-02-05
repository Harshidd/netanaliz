import React, { useState, useEffect, useMemo, memo, useCallback, useRef, useDeferredValue } from 'react'
import { classRepo } from '../repo/classRepo'
import StudentImporter from '../../../components/StudentImporter'
import { perfMonitor } from '../utils/performanceUtils'
import StudentEditorModal from '../components/StudentEditorModal'
import ImportWizard from '../components/ImportWizard'
import ConflictModal from '../components/ConflictModal'
import InlineSelect from '../components/InlineSelect'
import InlineToggle from '../components/InlineToggle'
import InlineTags from '../components/InlineTags'
import { Trash2, Edit2, Search, UserPlus, Filter, ArrowUpDown, FileText, Users, ShieldAlert } from 'lucide-react'

// Options for dropdowns - Stable constants
const GENDER_OPTIONS = [
    { value: 'K', label: 'Kız' },
    { value: 'E', label: 'Erkek' },
]

const EMPTY_ARRAY = []

/**
 * OPTIMIZED ROW COMPONENT
 * Completely memoized.
 * - Receives ONLY primitive props (ids, strings, numbers, booleans) to ensure React.memo works.
 * - 'tagsStr' is passed instead of array to prevent reference issues.
 * - 'conflictCount' passed as primitive number.
 */
const StudentRow = memo(({
    studentId,
    no,
    name,
    studentNumber,
    gender,
    frontRowPreferred,
    conflictCount, // Primitive number
    hasConflict,   // Primitive boolean
    onUpdateGender,
    onUpdateProfile,
    onEdit,
    onDelete,
    onOpenConflicts
}) => {
    // Callbacks with ID pre-bound to avoid inline arrow functions in render
    const handleGenderChange = useCallback((val) => {
        onUpdateGender(studentId, val)
    }, [studentId, onUpdateGender])

    const handleFrontRowChange = useCallback((val) => {
        onUpdateProfile(studentId, { frontRowPreferred: val })
    }, [studentId, onUpdateProfile])

    const handleOpenConflicts = useCallback(() => {
        onOpenConflicts(studentId)
    }, [studentId, onOpenConflicts])

    const handleEdit = useCallback(() => {
        onEdit(studentId)
    }, [studentId, onEdit])

    const handleDelete = useCallback(() => {
        onDelete(studentId)
    }, [studentId, onDelete])

    return (
        <tr className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
            {/* No */}
            <td className="py-3 px-4 w-16 text-sm text-gray-500 font-mono">
                {no || '-'}
            </td>

            {/* Name */}
            <td className="py-3 px-4">
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm">{name || '-'}</span>
                    <span className="text-[10px] text-gray-400 font-mono hidden sm:inline-block">{studentNumber}</span>
                </div>
            </td>

            {/* Gender - Inline */}
            <td className="py-3 px-4 w-32">
                <InlineSelect
                    value={gender}
                    options={GENDER_OPTIONS}
                    onChange={handleGenderChange}
                    placeholder="Seç.."
                    className="w-full"
                />
            </td>

            {/* Front Row Preference - Inline */}
            <td className="py-3 px-4 w-32">
                <InlineToggle
                    checked={frontRowPreferred}
                    onChange={handleFrontRowChange}
                    label={frontRowPreferred ? 'Evet' : 'Hayır'}
                    activeColor="bg-emerald-500"
                />
            </td>



            {/* Conflicts Indicator - Yan Yana Oturmasın */}
            <td className="py-3 px-4 text-center">
                <button
                    onClick={handleOpenConflicts}
                    className={`
                        px-3 py-2 rounded-lg transition-all relative font-medium text-sm flex items-center gap-2 mx-auto
                        ${hasConflict
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 shadow-sm border border-red-200'
                            : 'bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200'}
                    `}
                    title="Yan yana oturmaması gereken öğrencileri seçin"
                >
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline">
                        {hasConflict ? `${conflictCount} Kısıt` : 'Kısıt Ekle'}
                    </span>
                    {conflictCount > 0 && (
                        <span className="sm:hidden bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {conflictCount}
                        </span>
                    )}
                </button>
            </td>

            {/* Actions */}
            <td className="py-3 px-4 w-28 text-right">
                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleEdit}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Detaylı Düzenle"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    )
}, (prev, next) => {
    // STRICT EQUALITY CHECK FOR PRIMITIVES
    return (
        prev.studentId === next.studentId &&
        prev.no === next.no &&
        prev.name === next.name &&
        prev.gender === next.gender &&
        prev.frontRowPreferred === next.frontRowPreferred &&
        prev.conflictCount === next.conflictCount &&
        prev.hasConflict === next.hasConflict
    )
})

export default function RosterPage() {
    const [students, setStudents] = useState([])
    const [conflicts, setConflicts] = useState([]) // Raw conflicts array
    const [search, setSearch] = useState('')

    // Filters & Sort
    const [filterGender, setFilterGender] = useState('ALL')
    const [sortBy, setSortBy] = useState('NO_ASC')

    // UI States
    const [isEditorOpen, setEditorOpen] = useState(false)
    const [isImportWizardOpen, setImportWizardOpen] = useState(false)
    const [editTargetId, setEditTargetId] = useState(null)
    const [showImporter, setShowImporter] = useState(false)
    const [isConflictModalOpen, setConflictModalOpen] = useState(false)
    const [conflictTargetId, setConflictTargetId] = useState(null)

    // --- REFS FOR PERFORMANCE ---
    // Keep a ref to students to access them in debounced functions without dependency issues
    const studentsRef = useRef([])
    useEffect(() => {
        studentsRef.current = students
    }, [students])

    // Initial Load
    useEffect(() => {
        refresh()
    }, [])

    const refresh = () => {
        if (import.meta.env.DEV) {
            perfMonitor.startTimer('roster-refresh')
        }
        setStudents(classRepo.getStudents())
        setConflicts(classRepo.listConflicts())
        if (import.meta.env.DEV) {
            perfMonitor.endTimer('roster-refresh')
        }
    }

    // --- DEBOUNCED PERSISTENCE HOOK LOGIC ---
    // Manages timeouts and accumulation of updates

    // We store timeouts in refs to clear them across renders
    const saveTimeouts = useRef({})
    // We accumulate profile updates specifically because partial updates might come in sequence
    const pendingProfileUpdates = useRef({})

    const debouncedSaveStudent = useCallback((id, gender) => {
        if (saveTimeouts.current[`student-${id}`]) {
            clearTimeout(saveTimeouts.current[`student-${id}`])
        }

        saveTimeouts.current[`student-${id}`] = setTimeout(() => {
            // Get latest State from Ref to ensure we don't save stale data
            const currentStudent = studentsRef.current.find(s => s.id === id)
            if (currentStudent) {
                // Ensure the gender we explicitly changed is the one being saved
                // (Though optimistic state should have it, this is explicit safety)
                classRepo.upsertRosterStudent({
                    ...currentStudent,
                    gender: gender
                })
            }
            delete saveTimeouts.current[`student-${id}`]
        }, 500)
    }, [])

    const debouncedSaveProfile = useCallback((id, updates) => {
        // Accumulate updates for this ID
        pendingProfileUpdates.current[id] = {
            ...(pendingProfileUpdates.current[id] || {}),
            ...updates
        }

        if (saveTimeouts.current[`profile-${id}`]) {
            clearTimeout(saveTimeouts.current[`profile-${id}`])
        }

        saveTimeouts.current[`profile-${id}`] = setTimeout(() => {
            const finalUpdates = pendingProfileUpdates.current[id]
            if (finalUpdates) {
                classRepo.upsertProfile(id, finalUpdates)
            }
            // Cleanup
            delete saveTimeouts.current[`profile-${id}`]
            delete pendingProfileUpdates.current[id]
        }, 500)
    }, [])


    // --- OPTIMIZED HANDLERS ---

    // Stable identity callback for Gender
    const handleUpdateGender = useCallback((id, newGender) => {
        // 1. Instant Optimistic UI Update
        setStudents(prev => prev.map(s =>
            s.id === id ? { ...s, gender: newGender } : s
        ))

        // 2. Debounced Persist
        debouncedSaveStudent(id, newGender)
    }, [debouncedSaveStudent])

    // Stable identity callback for Profile
    const handleUpdateProfile = useCallback((id, updates) => {
        // 1. Instant Optimistic UI Update
        setStudents(prev => prev.map(s => {
            if (s.id === id) {
                return {
                    ...s,
                    _profile: { ...s._profile, ...updates }
                }
            }
            return s
        }))

        // 2. Debounced Persist
        debouncedSaveProfile(id, updates)
    }, [debouncedSaveProfile])

    const handleDelete = useCallback((id) => {
        if (window.confirm('Bu öğrenciyi ve tüm kayıtlarını silmek istediğinize emin misiniz?')) {
            classRepo.deleteStudentCascade(id)
            refresh() // Delete is rare, full refresh is fine
        }
    }, [])

    const openEdit = useCallback((id) => {
        setEditTargetId(id)
        setEditorOpen(true)
    }, [])

    const openConflicts = useCallback((id) => {
        setConflictTargetId(id)
        setConflictModalOpen(true)
    }, [])


    // --- CONFLICTS OPTIMIZATION ---
    // O(1) lookup Map. Only recalculates when `conflicts` array changes.
    // Does NOT run on every render.
    const conflictMap = useMemo(() => {
        if (import.meta.env.DEV) {
            perfMonitor.startTimer('conflict-index-build')
        }
        const map = {}
        conflicts.forEach(c => {
            map[c.studentIdA] = (map[c.studentIdA] || 0) + 1
            map[c.studentIdB] = (map[c.studentIdB] || 0) + 1
        })
        if (import.meta.env.DEV) {
            perfMonitor.endTimer('conflict-index-build')
        }
        return map
    }, [conflicts])


    // --- CONFLICT MODAL ACTIONS ---
    const handleAddConflict = (idA, idB, reason) => {
        const res = classRepo.addConflict(idA, idB, reason)
        if (!res.success) {
            alert(res.error)
        } else {
            setConflicts(classRepo.listConflicts())
        }
    }

    // --- FILTER & SORT LOGIC ---
    // Memoized to prevent re-filtering when unrelated states (like Modal open) change
    // Use deferred search value to prevent lag during typing
    const deferredSearch = useDeferredValue(search)

    const filtered = useMemo(() => {
        if (import.meta.env.DEV) {
            perfMonitor.startTimer('filter-sort')
        }
        let result = students
        const term = deferredSearch.toLowerCase().trim()

        if (term) {
            result = result.filter(s =>
                (s.name || '').toLowerCase().includes(term) ||
                (s.no || '').includes(term)
            )
        }

        if (filterGender !== 'ALL') {
            result = result.filter(s => s.gender === filterGender)
        }

        const sorted = [...result].sort((a, b) => {
            if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '')
            if (sortBy === 'NO_ASC') {
                const nA = parseInt(a.no, 10)
                const nB = parseInt(b.no, 10)
                if (!isNaN(nA) && !isNaN(nB)) return nA - nB
                return (a.no || '').localeCompare(b.no || '')
            }
            return 0
        })

        if (import.meta.env.DEV) {
            perfMonitor.endTimer('filter-sort')
        }
        return sorted
    }, [students, deferredSearch, filterGender, sortBy])

    // Action wrappers (Non-row) - Stable
    const openCreate = () => {
        setEditTargetId(null)
        setEditorOpen(true)
    }

    return (
        <div className="pb-24 space-y-6 animate-fade-in relative min-h-[600px]">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Sınıf Listesi
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Öğrencileri ekleyin, düzenleyin ve özel durumlarını yönetin.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setShowImporter(!showImporter)}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${showImporter ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {showImporter ? 'Sihirbazı Gizle' : 'E-Okul / Excel'}
                    </button>

                    <button
                        onClick={() => setImportWizardOpen(true)}
                        className="px-4 py-2.5 rounded-xl font-semibold text-sm border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
                    >
                        <FileText className="w-4 h-4 text-green-600" />
                        CSV Yükle
                    </button>

                    <button
                        onClick={openCreate}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-gray-200 whitespace-nowrap"
                    >
                        <UserPlus className="w-4 h-4" />
                        Öğrenci Ekle
                    </button>
                </div>
            </div>

            {/* Importer Panel */}
            {showImporter && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 animate-fade-in">
                    <StudentImporter target="roster" onImport={() => { refresh(); setShowImporter(false) }} />
                </div>
            )}

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                {/* ... same as before but ensured state setters don't cause new objects unless needed ... */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="İsim veya numara ile ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent rounded-lg focus:outline-none focus:bg-gray-50 transition-colors"
                    />
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                    {['ALL', 'K', 'E'].map(g => (
                        <button
                            key={g}
                            onClick={() => setFilterGender(g)}
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${filterGender === g ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {g === 'ALL' ? 'Tümü' : g === 'K' ? 'Kız' : 'Erkek'}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setSortBy(prev => prev === 'NO_ASC' ? 'NAME_ASC' : 'NO_ASC')}
                    className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-600 font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                >
                    <ArrowUpDown className="w-4 h-4" />
                    {sortBy === 'NO_ASC' ? 'No Sıralı' : 'İsim Sıralı'}
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-4 w-16 font-semibold">No</th>
                                <th className="py-3 px-4 font-semibold">Ad Soyad</th>
                                <th className="py-3 px-4 w-32 font-semibold">Cinsiyet</th>
                                <th className="py-3 px-4 w-32 font-semibold">Ön Sıra</th>
                                <th className="py-3 px-4 text-center font-semibold">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span>Yan Yana Oturmasın</span>
                                    </div>
                                </th>
                                <th className="py-3 px-4 w-28 text-right font-semibold">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length > 0 ? (
                                filtered.map(s => {
                                    // Calculate primitives for memoization
                                    // Use stable 'conflictMap' for O(1)
                                    const cCount = conflictMap[s.id] || 0

                                    return (
                                        <StudentRow
                                            key={s.id}
                                            studentId={s.id}
                                            no={s.no}
                                            name={s.name || s.fullName}
                                            studentNumber={s.studentNumber}
                                            gender={s.gender}
                                            frontRowPreferred={s._profile?.frontRowPreferred || false}
                                            conflictCount={cCount} // Primitive number
                                            hasConflict={cCount > 0} // Primitive boolean

                                            // Pass Stable Handlers
                                            onUpdateGender={handleUpdateGender}
                                            onUpdateProfile={handleUpdateProfile}
                                            onEdit={openEdit}
                                            onDelete={handleDelete}
                                            onOpenConflicts={openConflicts}
                                        />
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Filter className="w-10 h-10 opacity-20" />
                                            <span>Kriterlere uygun sonuç bulunamadı.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50/30 border-t border-gray-100 text-xs text-gray-500 font-medium flex justify-between items-center">
                    <span>Toplam {filtered.length} öğrenci listeleniyor</span>
                    <span>{students.length} Kayıtlı</span>
                </div>
            </div>

            {/* Modals */}
            <StudentEditorModal
                isOpen={isEditorOpen}
                onClose={() => setEditorOpen(false)}
                studentId={editTargetId}
                onSave={refresh}
            />

            {isImportWizardOpen && (
                <ImportWizard
                    onClose={() => setImportWizardOpen(false)}
                    onFinish={refresh}
                />
            )}

            <ConflictModal
                isOpen={isConflictModalOpen}
                onClose={() => setConflictModalOpen(false)}
                selectedStudentId={conflictTargetId}
                students={students}
                onConfirm={handleAddConflict}
            />
        </div>
    )
}
