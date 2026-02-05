import React from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function InlineSelect({ value, options, onChange, placeholder = 'Seçiniz', className = '' }) {
    return (
        <div className={`relative group ${className}`}>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 cursor-pointer focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all pr-8"
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-gray-600" />
        </div>
    )
}
