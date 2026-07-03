'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Trend {
  month: string;
  sales: number;
  purchases: number;
  production: number;
}

interface ProductionBarChartProps { data: Trend[] }

export function ProductionBarChart({ data }: ProductionBarChartProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
      <h2 className="text-xl font-bold mb-6">نشاط الإنتاج (عدد القطع)</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#ffffff05' }}
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', textAlign: 'right' }} />
            <Bar dataKey="production" name="الإنتاج" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
