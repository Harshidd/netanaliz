import React from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface FatalModuleErrorProps {
    title: string
    message: string
    details?: string[]
}

export const FatalModuleError: React.FC<FatalModuleErrorProps> = ({ title, message, details }) => {
    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl border border-red-100 text-center animate-fade-in">
            <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 mb-6 max-w-md">{message}</p>

            {details && details.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-red-200 text-left w-full max-w-md mb-6 shadow-sm">
                    <h3 className="text-xs font-bold text-red-800 uppercase mb-2 tracking-wider">Hata Detayları</h3>
                    <ul className="space-y-1">
                        {details.map((d, i) => (
                            <li key={i} className="text-sm text-red-600 font-mono break-all flex items-start gap-2">
                                <span className="opacity-50 mt-1">•</span>
                                {d}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow active:scale-95"
            >
                <RefreshCcw className="w-4 h-4" />
                Sayfayı Yenile
            </button>
        </div>
    )
}
