import React from 'react';

export function GlassPanel({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: React.ReactNode }) {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          {typeof title === 'string' ? (
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          ) : (
            title
          )}
        </div>
      )}
      <div className={title ? 'card-body' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

export function GlassCard({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`card p-6 ${onClick ? 'cursor-pointer hover:bg-white/5 transition' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default GlassPanel;
