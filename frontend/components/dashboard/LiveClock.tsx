'use client';

import { useEffect, useState } from 'react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  const h12 = hours % 12 || 12;

  return (
    <div className="flex items-center gap-2 text-slate-400">
      <span className="text-2xl font-light tabular-nums text-white/80">
        {h12}:{minutes}
      </span>
      <span className="text-xs text-slate-600">{ampm}</span>
    </div>
  );
}
