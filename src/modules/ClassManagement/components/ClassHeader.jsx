import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Users, Home, ChevronLeft, MoreVertical, Grid } from 'lucide-react'

const ClassHeader = ({ title = "Sınıf Yönetimi" }) => {
    const navigate = useNavigate()
    const location = useLocation()

    // Check Root vs Sub-Page
    // Current Rule: 
    // - Root (/class or /class/) -> Show only Home
    // - Sub (/class/...) -> Show Back + Home
    const isRoot = location.pathname === '/class' || location.pathname === '/class/'

    // History Logic
    const [canGoBack, setCanGoBack] = useState(false)
    useEffect(() => {
        if (window.history.state && typeof window.history.state.idx === 'number') {
            setCanGoBack(window.history.state.idx > 0)
        }
    }, [location])

    const handleBack = () => {
        if (canGoBack) {
            navigate(-1)
        }
    }

    // Dropdown State
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <header className="max-w-6xl mx-auto flex items-center justify-between mb-8 z-50 relative">
            <div className="flex items-center gap-3">
                {/* Back Button: Visual only on subpages */}
                {!isRoot && (
                    <button
                        onClick={handleBack}
                        disabled={!canGoBack}
                        className={`
                            flex items-center text-gray-500 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm transition-all
                            ${canGoBack
                                ? 'hover:text-gray-900 active:scale-95 cursor-pointer group'
                                : 'opacity-40 cursor-not-allowed text-gray-300'
                            }
                        `}
                        title={canGoBack ? "Önceki sayfaya dön" : "Geçmişte sayfa yok"}
                    >
                        <ChevronLeft className={`w-4 h-4 mr-1 ${canGoBack ? 'group-hover:-translate-x-0.5 transition-transform' : ''}`} />
                        <span className="text-sm font-medium">Geri</span>
                    </button>
                )}

                {/* Class Dashboard Home - Primary Module Link */}
                <Link
                    to="/class"
                    className={`
                        flex items-center px-3 py-2 rounded-xl border shadow-sm transition-all active:scale-95
                        ${location.pathname.startsWith('/class')
                            ? 'bg-gray-100 text-gray-900 border-gray-200 font-semibold'
                            : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-gray-100'
                        }
                    `}
                    title="Sınıf Yönetimi Paneli"
                >
                    <Grid className="w-4 h-4 mr-2" />
                    <span className="text-sm">Sınıf Yönetimi</span>
                </Link>

                {/* App Main Home - Module Selector */}
                <Link
                    to="/"
                    className={`
                        flex items-center px-3 py-2 rounded-xl border shadow-sm transition-all active:scale-95
                        ${location.pathname === '/'
                            ? 'bg-gray-100 text-gray-900 border-gray-200 font-semibold'
                            : 'bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-gray-100'
                        }
                    `}
                    title="Modül Seçimi (Ana Ekran)"
                >
                    <Home className="w-4 h-4 mr-2" />
                    <span className="text-sm">Ana Sayfa</span>
                </Link>
            </div>

            {/* Right Side: Cleaned up as requested */}
            <div></div>
        </header>
    )
}

export default ClassHeader
