import React, { useState, useEffect, useMemo } from 'react'
import { X, Save, User, ShieldAlert, Users, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { classRepo } from '../repo/classRepo'

const TABS = {
    BASIC: 'basic',
    CONSTRAINTS: 'constraints'
}



export default function StudentEditorModal({ isOpen, onClose, studentId, onSave }) {
    const [activeTab, setActiveTab] = useState(TABS.BASIC)
    const [formData, setFormData] = useState({
        fullName: '',
        schoolNo: '',
        gender: '',
        tags: [],
        notes: ''
    })
    const [conflicts, setConflicts] = useState([])
    const [allStudents, setAllStudents] = useState([])
    const [isSaving, setIsSaving] = useState(false)

    // Conflict Form
    const [newConflictTarget, setNewConflictTarget] = useState('')
    const [newConflictReason, setNewConflictReason] = useState('')

    useEffect(() => {
        if (!isOpen) return

        const studentsList = classRepo.getStudents()
        setAllStudents(studentsList)

        if (studentId) {
            const student = studentsList.find(s => s.id === studentId)
            if (student) {
                setFormData({
                    fullName: student.name,
                    schoolNo: student.no,
                    gender: student.gender || '', // Ensure gender is passed from repo
                    tags: student._profile?.tags || [],
                    notes: student._profile?.notes || ''
                })

                const allConflicts = classRepo.listConflicts()
                const myConflicts = allConflicts.filter(c => c.studentIdA === studentId || c.studentIdB === studentId)
                setConflicts(myConflicts)
            }
        } else {
            // New Student
            setFormData({
                fullName: '',
                schoolNo: '',
                gender: '',
                tags: [],
                notes: ''
            })
            setConflicts([])
        }
        setActiveTab(TABS.BASIC)
    }, [isOpen, studentId])

    const handleSaveBasic = () => {
        if (!formData.fullName || !formData.schoolNo) {
            alert('Ad Soyad ve Okul Numarası zorunludur.')
            return
        }

        setIsSaving(true)
        setTimeout(() => {
            // 1. Roster Update
            const studentData = {
                rosterId: studentId, // undefined if new
                fullName: formData.fullName,
                schoolNo: formData.schoolNo,
                gender: formData.gender
            }
            const savedStudent = classRepo.upsertRosterStudent(studentData)

            // 2. Profile Update
            const profileUpdates = {
                tags: formData.tags,
                notes: formData.notes
            }
            // If new student, savedStudent.rosterId is the new ID
            classRepo.upsertProfile(savedStudent.rosterId, profileUpdates)

            setIsSaving(false)
            onSave() // Trigger parent refresh
            if (!studentId) onClose() // Close if create mode
        }, 400)
    }

    const handleAddConflict = () => {
        if (!studentId) {
            alert('Önce öğrenciyi kaydetmelisiniz.')
            return
        }
        if (!newConflictTarget) return

        const res = classRepo.addConflict(studentId, newConflictTarget, newConflictReason)
        if (res.success) {
            setConflicts(prev => [...prev, res.conflict])
            setNewConflictTarget('')
            setNewConflictReason('')
        } else {
            alert(res.error)
        }
    }

    const handleRemoveConflict = (conflictId) => {
        if (window.confirm('Bu kısıtlamayı silmek istiyor musunuz?')) {
            classRepo.removeConflict(conflictId)
            setConflicts(prev => prev.filter(c => c.id !== conflictId))
        }
    }



    const resolveConflictName = (c) => {
        const otherId = c.studentIdA === studentId ? c.studentIdB : c.studentIdA
        const other = allStudents.find(s => s.id === otherId)
        return other ? other.name : 'Bilinmeyen'
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {studentId ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {studentId ? `#${formData.schoolNo} - ${formData.fullName}` : 'Sınıf listesine yeni kayıt'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
                    <button
                        onClick={() => setActiveTab(TABS.BASIC)}
                        className={`py-4 mr-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === TABS.BASIC ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <User className="w-4 h-4" /> Temel Bilgiler
                    </button>
                    <button
                        onClick={() => setActiveTab(TABS.CONSTRAINTS)}
                        disabled={!studentId}
                        className={`py-4 mr-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === TABS.CONSTRAINTS ? 'border-red-500 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                            } ${!studentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ShieldAlert className="w-4 h-4" /> Kısıtlamalar ({conflicts.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {activeTab === TABS.BASIC && (
                        <div className="space-y-6">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Okul No <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.schoolNo}
                                        onChange={e => setFormData({ ...formData, schoolNo: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono"
                                        placeholder="123"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Tam Ad <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Ad Soyad"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Cinsiyet</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer flex items-center justify-center gap-2 ${formData.gender === 'K' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="K"
                                            checked={formData.gender === 'K'}
                                            onChange={() => setFormData({ ...formData, gender: 'K' })}
                                            className="hidden"
                                        />
                                        Kız
                                    </label>
                                    <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer flex items-center justify-center gap-2 ${formData.gender === 'E' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="E"
                                            checked={formData.gender === 'E'}
                                            onChange={() => setFormData({ ...formData, gender: 'E' })}
                                            className="hidden"
                                        />
                                        Erkek
                                    </label>
                                </div>
                            </div>



                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Öğretmen Notu</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none text-sm"
                                    placeholder="Öğrenci hakkında özel notlar..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === TABS.CONSTRAINTS && (
                        <div className="space-y-6">
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-800 flex gap-3">
                                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                                <p>Eklediğiniz kısıtlamalar, otomatik oturma planı oluşturulurken dikkate alınır. Yan yana oturması istenmeyen öğrenciler fiziksel olarak ayrılır.</p>
                            </div>

                            {/* Add New */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Kısıtlama Ekle (Birlikte Oturmasın)</label>
                                <div className="flex gap-2">
                                    <select
                                        value={newConflictTarget}
                                        onChange={e => setNewConflictTarget(e.target.value)}
                                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="">Öğrenci Seçiniz...</option>
                                        {allStudents
                                            .filter(s => s.id !== studentId && !conflicts.some(c => c.studentIdA === s.id || c.studentIdB === s.id))
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.no})</option>
                                            ))
                                        }
                                    </select>
                                    <button
                                        onClick={handleAddConflict}
                                        disabled={!newConflictTarget}
                                        className="bg-red-600 text-white px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Ekle
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Mevcut Kısıtlamalar</label>
                                {conflicts.length === 0 ? (
                                    <div className="text-gray-400 text-sm italic py-4 text-center">Henüz kısıtlama eklenmemiş.</div>
                                ) : (
                                    conflicts.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 shadow-sm rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                                                    🚫
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{resolveConflictName(c)}</p>
                                                    <p className="text-xs text-gray-400">Yan Yana Oturmasın</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveConflict(c.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Kapat
                    </button>
                    {activeTab === TABS.BASIC && (
                        <button
                            onClick={handleSaveBasic}
                            disabled={isSaving}
                            className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {isSaving ? <span className="animate-spin">⌛</span> : <Save className="w-5 h-5" />}
                            {studentId ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Oluştur'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
