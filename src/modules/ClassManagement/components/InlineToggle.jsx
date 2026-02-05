import React from 'react'

export default function InlineToggle({ checked, onChange, label, activeColor = 'bg-blue-600' }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-gray-50 w-full"
            title={label}
        >
            <div className={`
                relative w-9 h-5 transition-colors rounded-full 
                ${checked ? activeColor : 'bg-gray-200'}
            `}>
                <div className={`
                    absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200
                    ${checked ? 'translate-x-4' : 'translate-x-0'}
                `} />
            </div>
            {label && (
                <span className={`text-xs font-medium ${checked ? 'text-gray-900' : 'text-gray-400'}`}>
                    {label}
                </span>
            )}
        </button>
    )
}
