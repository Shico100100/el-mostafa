import React from 'react';

export function GlassPanel({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) {
    return (
        <div className={`backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl ${className}`}>
            {title && (
                <div className="px-6 py-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
            )}
            {children}
        </div>
    );
}

export default GlassPanel;
