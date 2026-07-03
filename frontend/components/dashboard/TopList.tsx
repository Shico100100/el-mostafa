/* eslint-disable @typescript-eslint/no-explicit-any */

export function TopList({ items, labelKey, valueKey, title, icon, color }: {
  items?: any[]; labelKey: string; valueKey: string; title: string; icon: React.ReactNode; color: string;
}) {
  if (!items || items.length === 0) return null;
  const maxVal = Math.max(...items.map((i) => Number(i[valueKey])), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <h4 className="text-xs font-bold text-slate-300">{title}</h4>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const pct = (Number(item[valueKey]) / maxVal) * 100;
          return (
            <div key={item[labelKey] || idx} className="group/top">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-300 truncate ml-2">{item[labelKey] || `#${idx + 1}`}</span>
                <span className="text-[11px] font-bold text-slate-400 tabular-nums shrink-0">
                  {Number(item[valueKey]).toLocaleString()}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 group-hover/top:opacity-80`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
