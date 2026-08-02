import React from 'react';

export function H1({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h1 className={`text-2xl font-bold text-white ${className}`}>{children}</h1>;
}

export function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-semibold text-white ${className}`}>{children}</h2>;
}

export function H3({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>;
}

export function H4({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h4 className={`text-base font-semibold text-white ${className}`}>{children}</h4>;
}

export function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium text-gray-400 mb-1.5 ${className}`}>{children}</label>;
}

export function Caption({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs text-gray-500 ${className}`}>{children}</p>;
}

export function StatValue({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-2xl font-bold text-white ${className}`}>{children}</div>;
}

export function StatLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-xs text-gray-400 ${className}`}>{children}</div>;
}

export function PageTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h1 className={`page-title ${className}`}>{children}</h1>;
}

export function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`section-title ${className}`}>{children}</h2>;
}

export function Text({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-300 ${className}`}>{children}</p>;
}

export function Muted({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs text-gray-500 ${className}`}>{children}</p>;
}
