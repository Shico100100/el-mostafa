'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Trend {
  month: string;
  sales: number;
  purchases: number;
  production: number;
}

interface TrendChartProps { data: Trend[] }

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">المبيعات مقابل المشتريات</h2>
        <div className="flex gap-4 text-xs font-bold">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> مبيعات</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> مشتريات</div>
        </div>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', textAlign: 'right' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }} />
            <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            <Area type="monotone" dataKey="purchases" name="المشتريات" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
