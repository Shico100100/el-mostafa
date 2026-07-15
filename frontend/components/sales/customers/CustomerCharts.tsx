'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Customer, CustomerStats } from './types';

interface CustomerChartsProps {
  stats: CustomerStats;
  customers: Customer[];
}

export function CustomerCharts({ stats, customers }: CustomerChartsProps) {
  // Pie chart data
  const pieData = [
    { name: 'أمين', value: stats.cleanCount, color: '#10b981' },
    { name: 'مدين', value: stats.debtorsCount - Math.floor(stats.debtorsCount * 0.3), color: '#f59e0b' },
    { name: 'مدين متأخر', value: Math.floor(stats.debtorsCount * 0.3), color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Bar chart data (last 6 months)
  const barData = [
    { name: 'يناير', sales: 45000 },
    { name: 'فبراير', sales: 52000 },
    { name: 'مارس', sales: 48000 },
    { name: 'أبريل', sales: 61000 },
    { name: 'مايو', sales: 55000 },
    { name: 'يونيو', sales: 67000 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/10 rounded-lg p-3">
          <p className="text-white text-sm">{label}</p>
          <p className="text-emerald-400 text-sm">
            {payload[0].value.toLocaleString('ar-EG')} ج.م
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Pie Chart */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">توزيع الديون</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">المبيعات الأخيرة</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
