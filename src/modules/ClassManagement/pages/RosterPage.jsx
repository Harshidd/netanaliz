import React, { useState, useEffect, useMemo } from 'react'
import { classRepo } from '../repo/classRepo'
import StudentImporter from '../../../components/StudentImporter'
import { Trash2, Edit2, Search, GraduationCap } from 'lucide-react'

export default function RosterPage() {
    const [students, setStudents] = useState([])
    const [search, setSearch] = useState('')

    const refresh = () => {
        setStudents(classRepo.listRoster())
    }

    useEffect(() => {
        refresh()
    }, [])

    // Filter
    const filtered = useMemo(() => {
        const term = search.toLowerCase()
        return students.filter(s =>
            (s.fullName || '').toLowerCase().includes(term) ||
            (s.schoolNo || '').includes(term)
        )
    }, [students, search])

    const handleDelete = (id) => {
        if (window.confirm('Bu öğrenciyi ana listeden silmek istediğinize emin misiniz?')) {
            classRepo.removeRosterStudent(id)
            refresh()
        }
    }

    return (
        <div className="pb-20 space-y-6 animate-fade-in">

            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 items-start">

                {/* Left: Importer */}
                <div className="space-y-6">
                    <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <GradingTableIcon className="w-32 h-32" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 relative z-10">Sınıf Listesi</h2>
                        <p className="text-blue-100 text-sm relative z-10 opacity-90">
                            Tüm modüllerin kullandığı ana öğrenci kaynağıdır. Buraya eklenen öğrenciler sınav ve sınıf yönetimi ekranlarında görünür.
                        </p>
                    </div>

                    <StudentImporter
                        target="roster"
                        onImport={refresh} // Refresh list after import
                    />
                </div>

                {/* Right: List */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 min-h-[500px]">

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Kayıtlı Öğrenciler ({filtered.length})</h3>

                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Ara..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3 w-20">No</th>
                                    <th className="px-4 py-3">Ad Soyad</th>
                                    <th className="px-4 py-3 w-24 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-gray-400 italic">
                                            Liste boş. Yandaki panelden ekleme yapın.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(s => (
                                        <tr key={s.rosterId} className="hover:bg-blue-50/30 group transition-colors">
                                            <td className="px-4 py-3 font-mono text-gray-500">{s.schoolNo || '-'}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{s.fullName}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(s.rosterId)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    )
}

function GradingTableIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
