import React from 'react';

export function H1({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <h1 className={`text-3xl font-bold text-white ${className}`}>{children}</h1>;
}

export function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <h2 className={`text-2xl font-semibold text-white ${className}`}>{children}</h2>;
}
