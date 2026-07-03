'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { format } from 'date-fns';

interface DateContextValue {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  debouncedDate: string;
  refreshKey: number;
  triggerRefresh: () => void;
}

const DateContext = createContext<DateContextValue | null>(null);

export function DateProvider({ children }: { children: ReactNode }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDateRaw] = useState(today);
  const [debouncedDate, setDebouncedDate] = useState(today);
  const [refreshKey, setRefreshKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateRaw(date);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedDate(date);
    }, 500);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate, debouncedDate, refreshKey, triggerRefresh }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const ctx = useContext(DateContext);
  if (!ctx) throw new Error('useDate must be used within a DateProvider');
  return ctx;
}
