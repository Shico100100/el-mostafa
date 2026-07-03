'use client';

import { PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { GlassPanel } from '@/components/ui/GlassPanel';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#fbbf24', '#22c55e', '#a855f7'];

interface Props {
  accountTypeCounts: { name: string; value: number }[];
  topTrialBalance: { name: string; debit: number; credit: number }[];
}

export function ChartsSection({ accountTypeCounts, topTrialBalance }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <GlassPanel className="p-6 h-[400px]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-blue-400" />
          توزيع الحسابات
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie data={accountTypeCounts as any[]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
              {PIE_COLORS.map((color, index) => (
                <Cell key={`cell-${index}`} fill={color} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </GlassPanel>

      <GlassPanel className="p-6 h-[400px]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-purple-400" />
          أرصدة ميزان المراجعة (لأعلى 5 حسابات)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topTrialBalance as any[]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Legend />
            <Bar dataKey="debit" name="مدين" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="credit" name="دائن" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassPanel>
    </div>
  );
}
