import React, { useState, useRef, useEffect } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'

export default function InlineTags({ tags = [], options = [], onChange, placeholder = 'Etiket Ekle' }) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleTag = (tag) => {
        if (tags.includes(tag)) {
            onChange(tags.filter(t => t !== tag))
        } else {
            onChange([...tags, tag])
        }
    }

    const removeTag = (e, tag) => {
        e.stopPropagation()
        onChange(tags.filter(t => t !== tag))
    }

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Area */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="min-h-[32px] flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all"
            >
                {tags.length > 0 ? (
                    tags.map(tag => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100"
                        >
                            {tag}
                            <div
                                onClick={(e) => removeTag(e, tag)}
                                className="hover:bg-blue-100 rounded-full p-0.5 cursor-pointer"
                            >
                                <X className="w-2.5 h-2.5" />
                            </div>
                        </span>
                    ))
                ) : (
                    <span className="text-sm text-gray-400 flex items-center justify-between w-full">
                        {placeholder}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </span>
                )}

                {tags.length > 0 && (
                    <div className="ml-auto opacity-0 group-hover:opacity-100">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div className="p-1">
                        {options.map(opt => {
                            const isSelected = tags.includes(opt)
                            return (
                                <button
                                    key={opt}
                                    onClick={() => toggleTag(opt)}
                                    className={`
                                        w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                                        ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    {opt}
                                    {isSelected && <Plus className="w-3.5 h-3.5 rotate-45" />}
                                </button>
                            )
                        })}
                    </div>
                    {/* Future: Add custom tag input here */}
                </div>
            )}
        </div>
    )
}
