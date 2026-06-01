'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'اختر...',
    className = '',
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-white/5 border ${isOpen ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/10'} rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-300 ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.08]'}`}
            >
                <span className={`truncate font-medium ${!selectedOption ? 'text-slate-500' : 'text-slate-200'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in duration-200 origin-top">
                    <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="بحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-lg pr-9 pl-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-md transition">
                                    <X className="w-3 h-3 text-slate-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-8 text-center text-xs text-slate-500 italic">لا توجد نتائج مطابقة</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${opt.value === value ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                >
                                    <span className="text-sm font-medium">{opt.label}</span>
                                    {opt.value === value && <Check className="w-3.5 h-3.5 shadow-glow shadow-blue-500" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
