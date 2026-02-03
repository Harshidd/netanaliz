import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { ArrowLeft, Users, LayoutDashboard, TableProperties } from 'lucide-react'
import StudentList from './pages/StudentList'
import RosterPage from './pages/RosterPage'
import SeatingGeneratePage from './seating/pages/SeatingGeneratePage'
import SeatingHistoryPage from './seating/pages/SeatingHistoryPage'
import SeatingAnalyticsPage from './seating/pages/SeatingAnalyticsPage'
import { Routes, Route } from 'react-router-dom'

// Placeholder Dashboard
const ClassDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">

        <Link
            to="roster"
            className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                <TableProperties className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Sınıf Listesi (Roster)</h3>
            <p className="text-sm text-gray-500">
                Ana öğrenci listesini yönetin, Excel'den toplu içe aktarın.
            </p>
        </Link>

        <Link
            to="students"
            className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
        >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Öğrenci Profilleri</h3>
            <p className="text-sm text-gray-500">
                Öğrenci özelliklerini, özel durumlarını ve oturma kısıtlamalarını düzenleyin.
            </p>
        </Link>

        {/* Seating Module */}
        <Link
            to="seating"
            className="group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
        >
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Oturma Planı</h3>
            <p className="text-sm text-gray-500">
                Otomatik veya manuel yerleşim ile sınıf düzeni oluşturun.
            </p>
        </Link>
    </div>
)

import ClassHeader from './components/ClassHeader'

export default function ClassManagement() {
    const location = useLocation()

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6 font-sans">
            <ClassHeader title="Sınıf Yönetimi" />

            <main className="max-w-6xl mx-auto">
                <Routes>
                    <Route path="/" element={<ClassDashboard />} />
                    <Route path="students" element={<StudentList />} />
                    <Route path="roster" element={<RosterPage />} />
                    <Route path="seating" element={<SeatingGeneratePage />} />
                    <Route path="seating/history" element={<SeatingHistoryPage />} />
                    <Route path="seating/analytics" element={<SeatingAnalyticsPage />} />
                </Routes>
            </main>
        </div>
    )
}
