'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

interface InventoryValue {
  [key: string]: unknown;
  name: string;
  value: number;
}

interface InventoryPieChartProps { data: InventoryValue[] }

export function InventoryPieChart({ data }: InventoryPieChartProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
      <h2 className="text-xl font-bold mb-6">توزيع قيمة المخزون</h2>
      <div className="h-[300px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={80} outerRadius={110}
              paddingAngle={8} dataKey="value"
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
