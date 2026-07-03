export function SalesTrendChart({ data }: { data: { date: string; value: number }[] }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const last7 = data.slice(-7);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">آخر 7 أيام</span>
        <span className="text-[10px] text-slate-600">
          الإجمالي: {last7.reduce((s, d) => s + d.value, 0).toLocaleString()} ج.م
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {last7.map((d) => {
          const pct = (d.value / maxVal) * 100;
          const h = Math.max(pct * 0.8, 8);
          const dayNames = ['أحد', 'إثن', 'ثلاث', 'أرب', 'خمي', 'جمعة', 'سبت'];
          const day = dayNames[new Date(d.date).getDay()];
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group/chart">
              <span className="text-[9px] text-slate-600 opacity-0 group-hover/chart:opacity-100 transition-opacity">
                {d.value.toLocaleString()}
              </span>
              <div className="w-full rounded-md relative overflow-hidden" style={{ height: `${h}%`, minHeight: '4px' }}>
                <div
                  className="absolute inset-0 bg-gradient-to-t from-blue-600/80 to-cyan-400/60 rounded-md hover:from-blue-500 hover:to-cyan-300 transition-all cursor-pointer"
                  style={{ height: '100%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent rounded-md" />
              </div>
              <span className="text-[9px] text-slate-600 truncate w-full text-center">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
