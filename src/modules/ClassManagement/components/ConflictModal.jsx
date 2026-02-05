import React, { useState } from 'react'

export default function ConflictModal({ isOpen, onClose, selectedStudentId, students, onConfirm }) {
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
