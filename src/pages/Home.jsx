import React from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Users, ChevronRight, School } from 'lucide-react'

// Home Layout
export default function Home() {
    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center p-6">
            <div className="w-full max-w-4xl animate-fade-in">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-6">
                        <School className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                        BiSınıf
                    </h1>
                    <p className="text-xl text-gray-500 font-medium">
                        Bugün ne yapmak istiyorsun?
                    </p>
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

                    {/* Card 1: Exam Analysis */}
                    <Link
                        to="/exams"
                        className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BarChart3 className="w-32 h-32" />
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                <BarChart3 className="w-7 h-7" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Sınav Analizi
                            </h2>
                            <p className="text-gray-500 mb-8 flex-1">
                                PDF ve Excel raporları ile detaylı sınav analizi ve karne oluşturma.
                            </p>

                            <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                                Başla <ChevronRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: Class Management */}
                    <Link
                        to="/class"
                        className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-32 h-32" />
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-7 h-7" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Sınıf Yönetimi
                            </h2>
                            <p className="text-gray-500 mb-8 flex-1">
                                Oturma düzeni, öğrenci profilleri ve sınıf içi yönetim araçları.
                            </p>

                            <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">
                                Yönet <ChevronRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-12">
                    © 2026 BiSınıf · Tüm hakları saklıdır
                </p>

            </div>
        </div>
    )
}
