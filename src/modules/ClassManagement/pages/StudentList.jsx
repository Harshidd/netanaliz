import React, { useState, useEffect, useMemo } from 'react'
import { classRepo } from '../repo/classRepo'
import {
    Search, Save, X, AlertTriangle, UserPlus,
    MessageCircle, Zap, ShieldAlert, CheckCircle2, Loader2
} from 'lucide-react'

// ... RatingControl Component remains same
const RatingControl = ({ label, value, max = 5, onChange, icon: Icon, colorClass }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </div>
            <div className="flex gap-1">
                {[...Array(max)].map((_, i) => {
                    const score = i + 1
                    const isActive = score <= value
                    return (
                        <button
                            key={i}
                            onClick={() => onChange(score)}
                            className={`
                  h-1.5 flex-1 rounded-full transition-all duration-200
                  ${isActive ? colorClass : 'bg-gray-100 hover:bg-gray-200'}
                `}
                            title={`${score}/${max}`}
                        />
                    )
                })}
            </div>
            <div className="text-[10px] text-gray-400 text-right font-medium">
                {value}/{max}
            </div>
        </div>
    )
}

const StudentCard = ({ student, conflicts, allStudents, onSave, onAddConflict, onRemoveConflict }) => {
    const [profile, setProfile] = useState(student._profile)
    const [isDirty, setIsDirty] = useState(false)

    // Status: 'idle' | 'saving' | 'saved'
    const [saveStatus, setSaveStatus] = useState('idle')

    useEffect(() => {
        setProfile(student._profile)
        setIsDirty(false)
    }, [student.id])

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }))
        setIsDirty(true)
        setSaveStatus('idle')
    }

    const handleSave = async () => {
        setSaveStatus('saving')

        // Simulate tiny network delay for UX realism if needed, or just direct save
        // Here we assume sync save for localStorage, but async feel is nice
        await new Promise(r => setTimeout(r, 400))

        onSave(student.id, profile)
        setIsDirty(false)
        setSaveStatus('saved')

        setTimeout(() => {
            setSaveStatus('idle')
        }, 2000)
    }

    // Conflict Data Logic
    const myConflicts = useMemo(() => {
        return conflicts.map(c => {
            const otherId = c.studentIdA === student.id ? c.studentIdB : c.studentIdA
            const otherStudent = allStudents.find(s => s.id === otherId)
            return {
                conflictId: c.id,
                otherName: otherStudent ? (otherStudent.name || otherStudent.fullName) : 'Bilinmeyen',
                reason: c.reason
            }
        })
    }, [conflicts, student.id, allStudents])

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900">{student.name || student.fullName}</h3>
                    <p className="text-xs text-gray-400 font-medium h-4">
                        {student.id.startsWith('unsafe') ?
                            <span className="text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Kaydedilmemiş Öğrenci</span> :
                            `#${student.no || student.studentNumber || '?'}`
                        }
                    </p>
                </div>

                {/* Action Button - Enhanced Feedback */}
                <div className="flex items-center gap-2 h-8">
                    {saveStatus === 'saved' && (
                        <span className="text-xs text-green-600 font-bold flex items-center animate-fade-in bg-green-50 px-2 py-1 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Kaydedildi
                        </span>
                    )}

                    {saveStatus === 'saving' && (
                        <span className="text-xs text-blue-600 font-medium flex items-center animate-fade-in px-2">
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Kaydediliyor
                        </span>
                    )}

                    {isDirty && saveStatus === 'idle' && (
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow"
                        >
                            <Save className="w-3.5 h-3.5" /> Kaydet
                        </button>
                    )}
                </div>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <RatingControl
                    label="Konuşkanlık"
                    value={profile.talkativeness}
                    onChange={(v) => handleChange('talkativeness', v)}
                    icon={MessageCircle}
                    colorClass="bg-amber-400"
                />
                <RatingControl
                    label="Dikkat"
                    value={profile.attention}
                    onChange={(v) => handleChange('attention', v)}
                    icon={Zap}
                    colorClass="bg-emerald-500"
                />
                <RatingControl
                    label="Disiplin Riski"
                    value={profile.disciplineRisk}
                    max={3}
                    onChange={(v) => handleChange('disciplineRisk', v)}
                    icon={ShieldAlert}
                    colorClass="bg-red-500"
                />
            </div>

            {/* Inputs - MODIFIED: Special Needs Checkbox */}
            <div className="space-y-3 mb-4">
                <div>
                    <label className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="relative inline-flex items-center">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={!!profile.specialNeeds}
                                onChange={(e) => handleChange('specialNeeds', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Özel Durum (Ön Sıra Önceliği)</span>
                    </label>
                </div>
                <div>
                    <textarea
                        rows={2}
                        value={profile.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="Özel notlar..."
                        className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* Conflicts */}
            <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Kısıtlamalar</span>
                    <button
                        onClick={() => onAddConflict(student.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                        title="Konflikt Ekle"
                    >
                        <UserPlus className="w-4 h-4" />
                    </button>
                </div>

                {myConflicts.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {myConflicts.map(c => (
                            <div key={c.conflictId} className="flex items-center bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded-[6px] text-xs">
                                <span className="font-medium truncate max-w-[90px]" title={c.reason}>{c.otherName}</span>
                                <button
                                    onClick={() => onRemoveConflict(c.conflictId)}
                                    className="ml-1.5 text-red-400 hover:text-red-700 p-0.5 rounded-full hover:bg-red-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-300 italic">...</div>
                )}
            </div>
        </div>
    )
}

// ... ConflictModal remains unchanged ...
const ConflictModal = ({ isOpen, onClose, selectedStudentId, students, onConfirm }) => {
    const [targetId, setTargetId] = useState('')
    const [reason, setReason] = useState('')

    if (!isOpen) return null

    const sourceStudent = students.find(s => s.id === selectedStudentId)
    // Filter out self
    const candidates = students.filter(s => s.id !== selectedStudentId)

    const handleSubmit = () => {
        if (!targetId) return
        onConfirm(selectedStudentId, targetId, reason)
        setTargetId('')
        setReason('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Kısıtlama Ekle</h3>
                <p className="text-sm text-gray-500 mb-4">
                    <span className="font-bold text-gray-700">{sourceStudent?.name}</span> ile kim yan yana oturmamalı?
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Öğrenci Seç</label>
                        <select
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                        >
                            <option value="">Seçiniz...</option>
                            {candidates.map(s => (
                                <option key={s.id} value={s.id}>{s.name || s.fullName} ({s.no})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Sebep (Opsiyonel)</label>
                        <input
                            type="text"
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                            placeholder="Çok konuşuyorlar..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!targetId}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Ekle
                    </button>
                </div>
            </div>
        </div>
    )
}

// ... StudentList remains largely unchanged, just imports updated implicitely ...
export default function StudentList() {
    const [students, setStudents] = useState([])
    const [conflicts, setConflicts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedStudentId, setSelectedStudentId] = useState(null)

    const refreshData = () => {
        const list = classRepo.getStudents()
        const allConflicts = classRepo.listConflicts()
        setStudents(list)
        setConflicts(allConflicts)
        setLoading(false)
    }

    useEffect(() => {
        refreshData()
    }, [])

    const handleSaveProfile = (id, updates) => {
        classRepo.upsertProfile(id, updates)
    }

    const handleOpenConflictModal = (studentId) => {
        setSelectedStudentId(studentId)
        setIsModalOpen(true)
    }

    const handleAddConflict = (idA, idB, reason) => {
        const result = classRepo.addConflict(idA, idB, reason)
        if (result.success) {
            setConflicts(classRepo.listConflicts())
        } else {
            alert(result.error)
        }
    }

    const handleRemoveConflict = (conflictId) => {
        if (window.confirm('Bu kısıtlamayı kaldırmak istiyor musunuz?')) {
            classRepo.removeConflict(conflictId)
            setConflicts(classRepo.listConflicts())
        }
    }

    const filteredStudents = useMemo(() => {
        const term = search.toLowerCase()
        return students.filter(s =>
            (s.name || s.fullName || '').toLowerCase().includes(term) ||
            String(s.no || '').includes(term)
        )
    }, [students, search])

    if (!loading && students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Öğrenci Listesi Bulunamadı</h2>
                <p className="text-gray-500 max-w-md">
                    Sınıf yönetimi aracını kullanmak için önce <strong>Sınav Analizi</strong> modülünde bir sınıf listesi yüklemelisiniz.
                </p>
            </div>
        )
    }

    return (
        <div className="pb-20">
            {/* Utility Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center mb-6 sticky top-4 z-20">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Öğrenci ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    Toplam: <span className="text-gray-900 font-bold">{filteredStudents.length}</span> öğrenci
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredStudents.map(student => (
                    <StudentCard
                        key={student.id}
                        student={student}
                        conflicts={conflicts.filter(c => c.studentIdA === student.id || c.studentIdB === student.id)}
                        allStudents={students}
                        onSave={handleSaveProfile}
                        onAddConflict={handleOpenConflictModal}
                        onRemoveConflict={handleRemoveConflict}
                    />
                ))}
            </div>

            {/* Modals */}
            <ConflictModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedStudentId={selectedStudentId}
                students={students}
                onConfirm={handleAddConflict}
            />
        </div>
    )
}
