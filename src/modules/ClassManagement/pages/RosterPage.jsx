import React, { useState, useEffect, useMemo, memo, useCallback } from 'react'
import { classRepo } from '../repo/classRepo'
import StudentImporter from '../../../components/StudentImporter'
import StudentEditorModal from '../components/StudentEditorModal'
import ImportWizard from '../components/ImportWizard'
import ConflictModal from '../components/ConflictModal'
import InlineSelect from '../components/InlineSelect'
import InlineToggle from '../components/InlineToggle'
import InlineTags from '../components/InlineTags'
import { Trash2, Edit2, Search, UserPlus, Filter, ArrowUpDown, FileText, Users, ShieldAlert } from 'lucide-react'

// Options for dropdowns
const GENDER_OPTIONS = [
    { value: 'K', label: 'Kız' },
    { value: 'E', label: 'Erkek' },
]

const TAG_OPTIONS = ['Dikkat', 'Gözlük', 'Kaynaştırma', 'Davranış', 'İşitme', 'Bedensel', 'Solak']

/**
 * OPTIMIZED ROW COMPONENT
 * - Uses mostly primitive props for efficient memoization.
 * - 'tags' is an array, but we rely on the parent to manage its reference or use equality check if needed.
 * - 'conflictCount' replaces the conflicts array to avoid O(N) filtering in parent render loop.
 */
const StudentRow = memo(({
    studentId,
    no,
    name,
    studentNumber,
    gender,
    frontRowPreferred,
    tags,
    conflictCount,
    onUpdateGender,
    onUpdateProfile,
    onEdit,
    onDelete,
    onOpenConflicts
}) => {

    // Callbacks to avoid inline arrow functions in render if possible, 
    // but wrappers are passed from parent. 
    // We wrap calls to pass ID implicitly.

    const handleGenderChange = useCallback((val) => {
        onUpdateGender(studentId, val)
    }, [studentId, onUpdateGender])

    const handleFrontRowChange = useCallback((val) => {
        onUpdateProfile(studentId, { frontRowPreferred: val })
    }, [studentId, onUpdateProfile])

    const handleTagsChange = useCallback((newTags) => {
        onUpdateProfile(studentId, { tags: newTags })
    }, [studentId, onUpdateProfile])

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

            {/* Special Status (Tags) - Inline */}
            <td className="py-3 px-4 min-w-[200px]">
                <InlineTags
                    tags={tags}
                    options={TAG_OPTIONS}
                    onChange={handleTagsChange}
                    placeholder="Özel Durum Seç..."
                />
            </td>

            {/* Conflicts Indicator */}
            <td className="py-3 px-4 w-24 text-center">
                <button
                    onClick={() => onOpenConflicts(studentId)}
                    className={`
                        p-2 rounded-lg transition-all relative
                        ${conflictCount > 0
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-sm'
                            : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}
                    `}
                    title="Kısıtlamaları Yönet"
                >
                    <ShieldAlert className="w-4 h-4" />
                    {conflictCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                            {conflictCount}
                        </span>
                    )}
                </button>
            </td>

            {/* Actions */}
            <td className="py-3 px-4 w-28 text-right">
                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(studentId)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Detaylı Düzenle"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(studentId)}
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
    // Custom Memo Comparison for strict performance control
    // Returns true if equal (do not re-render)
    return (
        prev.studentId === next.studentId &&
        prev.no === next.no &&
        prev.name === next.name &&
        prev.gender === next.gender &&
        prev.frontRowPreferred === next.frontRowPreferred &&
        prev.conflictCount === next.conflictCount &&
        // Array comparison for tags
        prev.tags.length === next.tags.length &&
        prev.tags.every((t, i) => t === next.tags[i])
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

    // Initial Load
    useEffect(() => {
        refresh()
    }, [])

    const refresh = () => {
        setStudents(classRepo.getStudents())
        setConflicts(classRepo.listConflicts())
    }

    // --- OPTIMIZED UPDATES (No full refresh) ---

    const handleUpdateGender = useCallback((id, newGender) => {
        // 1. Optimistic UI Update
        setStudents(prev => prev.map(s => {
            if (s.id === id) {
                return { ...s, gender: newGender }
            }
            return s // Keep reference for others!
        }))

        // 2. Persist (Sync)
        // We find the current student to be safe
        const currentStudent = students.find(s => s.id === id)
        if (currentStudent) {
            classRepo.upsertRosterStudent({
                ...currentStudent,
                gender: newGender
            })
        }
    }, [students])

    const handleUpdateProfile = useCallback((id, updates) => {
        // 1. Optimistic UI Update
        setStudents(prev => prev.map(s => {
            if (s.id === id) {
                // Determine what parts of profile changed for the UI object flattened properties
                const updatedStudent = {
                    ...s,
                    _profile: { ...s._profile, ...updates }
                }
                return updatedStudent
            }
            return s
        }))

        // 2. Persist
        classRepo.upsertProfile(id, updates)
    }, [])

    const handleDelete = useCallback((id) => {
        if (window.confirm('Bu öğrenciyi ve tüm kayıtlarını silmek istediğinize emin misiniz?')) {
            classRepo.deleteStudentCascade(id)
            refresh() // Delete requires full refresh to re-index potentially
        }
    }, [])

    // --- CONFLICTS OPTIMIZATION ---
    // Create a Map of studentId -> conflictCount
    // This runs only when the defaults conflict list changes, not on every render
    const conflictMap = useMemo(() => {
        const map = {}
        conflicts.forEach(c => {
            map[c.studentIdA] = (map[c.studentIdA] || 0) + 1
            map[c.studentIdB] = (map[c.studentIdB] || 0) + 1
        })
        return map
    }, [conflicts])

    // --- CONFLICT MODAL ACTIONS ---
    const handleAddConflict = (idA, idB, reason) => {
        const res = classRepo.addConflict(idA, idB, reason)
        if (!res.success) {
            alert(res.error)
        } else {
            // Only refresh conflicts part
            setConflicts(classRepo.listConflicts())
        }
    }

    // --- FILTER & SORT LOGIC ---
    const filtered = useMemo(() => {
        let result = students
        const term = search.toLowerCase().trim()

        if (term) {
            result = result.filter(s =>
                (s.name || '').toLowerCase().includes(term) ||
                (s.no || '').includes(term)
            )
        }

        if (filterGender !== 'ALL') {
            result = result.filter(s => s.gender === filterGender)
        }

        // Sort - ensure we copy the array to not mutate state
        // Use Memo to prevent re-sorting unless criteria changes
        return [...result].sort((a, b) => {
            if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '')
            if (sortBy === 'NO_ASC') {
                const nA = parseInt(a.no, 10)
                const nB = parseInt(b.no, 10)
                if (!isNaN(nA) && !isNaN(nB)) return nA - nB
                return (a.no || '').localeCompare(b.no || '')
            }
            return 0
        })
    }, [students, search, filterGender, sortBy])

    // Handlers
    const openEdit = useCallback((id) => {
        setEditTargetId(id)
        setEditorOpen(true)
    }, [])

    const openCreate = () => {
        setEditTargetId(null)
        setEditorOpen(true)
    }

    const openConflicts = useCallback((id) => {
        setConflictTargetId(id)
        setConflictModalOpen(true)
    }, [])

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
                                <th className="py-3 px-4 min-w-[200px] font-semibold">Özel Durum</th>
                                <th className="py-3 px-4 w-24 text-center font-semibold">Kısıtlar</th>
                                <th className="py-3 px-4 w-28 text-right font-semibold">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length > 0 ? (
                                filtered.map(s => (
                                    <StudentRow
                                        key={s.id}
                                        studentId={s.id}
                                        no={s.no}
                                        name={s.name || s.fullName}
                                        studentNumber={s.studentNumber}
                                        gender={s.gender}
                                        frontRowPreferred={s._profile?.frontRowPreferred || false}
                                        tags={s._profile?.tags || []} // Warning: Ensure this array is stable if empty
                                        conflictCount={conflictMap[s.id] || 0}
                                        onUpdateGender={handleUpdateGender}
                                        onUpdateProfile={handleUpdateProfile}
                                        onEdit={openEdit}
                                        onDelete={handleDelete}
                                        onOpenConflicts={openConflicts}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400">
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

                {/* Footer / Count */}
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
