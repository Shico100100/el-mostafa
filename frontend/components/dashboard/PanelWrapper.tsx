'use client';

import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

type PanelState = 'loading' | 'error' | 'empty' | 'refetching' | 'ready';

interface PanelWrapperProps {
  title: string;
  state: PanelState;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
  errorMessage?: string;
  onRetry?: () => void;
  children?: ReactNode;
  settings?: ReactNode;
  className?: string;
}

export function PanelWrapper({
  title,
  state,
  isEmpty,
  emptyMessage = 'لا توجد بيانات',
  emptyAction,
  errorMessage = 'حدث خطأ في الاتصال',
  onRetry,
  children,
  settings,
  className = '',
}: PanelWrapperProps) {
  const showContent = state === 'ready' || state === 'refetching';

  return (
    <div
      className={`glass rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 ${state === 'refetching' ? 'opacity-60' : ''} ${className}`}
    >
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
          <h3 className="text-white font-bold text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {state === 'refetching' && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {settings}
        </div>
      </div>

      <div className="p-5">
        {state === 'loading' && <LoadingState />}
        {state === 'error' && <ErrorState message={errorMessage} onRetry={onRetry} />}
        {state === 'empty' && isEmpty && <EmptyState message={emptyMessage} action={emptyAction} />}
        {showContent && children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-white/5 rounded-full w-3/4" />
      <div className="h-4 bg-white/5 rounded-full w-1/2" />
      <div className="h-4 bg-white/5 rounded-full w-5/6" />
      <div className="h-4 bg-white/5 rounded-full w-2/3" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-red-300 text-sm font-medium mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-medium transition border border-red-500/20"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
        <span className="text-slate-500 text-xl">-</span>
      </div>
      <p className="text-slate-400 text-sm mb-3">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg text-xs font-medium transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
