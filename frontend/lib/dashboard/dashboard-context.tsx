'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { DashboardPanel, DashboardConfig } from './types';
import { DEFAULT_PANELS } from './types';

const STORAGE_KEY = 'dashboard-config';

interface DashboardContextValue {
  config: DashboardConfig;
  visiblePanels: DashboardPanel[];
  togglePanel: (id: string) => void;
  movePanel: (id: string, direction: 'up' | 'down') => void;
  movePanelToColumn: (id: string, column: 1 | 2 | 3) => void;
  resetDefaults: () => void;
  isCustomizing: boolean;
  setIsCustomizing: (v: boolean) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function loadConfig(): DashboardConfig {
  if (typeof window === 'undefined') return { panels: DEFAULT_PANELS, date: '' };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { console.error('Failed to load dashboard config from localStorage:', e); }
  return { panels: DEFAULT_PANELS, date: '' };
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DashboardConfig>(loadConfig);
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const visiblePanels = config.panels.filter((p) => p.visible).sort((a, b) => a.order - b.order);

  const togglePanel = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      panels: prev.panels.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)),
    }));
  }, []);

  const movePanel = useCallback((id: string, direction: 'up' | 'down') => {
    setConfig((prev) => {
      const visible = prev.panels.filter((p) => p.visible).sort((a, b) => a.order - b.order);
      const idx = visible.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= visible.length) return prev;
      const currentOrder = visible[idx].order;
      visible[idx] = { ...visible[idx], order: visible[swapIdx].order };
      visible[swapIdx] = { ...visible[swapIdx], order: currentOrder };
      const panelMap = new Map(visible.map((p) => [p.id, p]));
      return {
        ...prev,
        panels: prev.panels.map((p) => panelMap.get(p.id) || p),
      };
    });
  }, []);

  const movePanelToColumn = useCallback((id: string, column: 1 | 2 | 3) => {
    setConfig((prev) => ({
      ...prev,
      panels: prev.panels.map((p) => (p.id === id ? { ...p, column } : p)),
    }));
  }, []);

  const resetDefaults = useCallback(() => {
    setConfig({ panels: DEFAULT_PANELS, date: '' });
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        config,
        visiblePanels,
        togglePanel,
        movePanel,
        movePanelToColumn,
        resetDefaults,
        isCustomizing,
        setIsCustomizing,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider');
  return ctx;
}
