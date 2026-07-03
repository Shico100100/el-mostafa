'use client';

import { Package, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { AnalyticsData } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function AnalyticsTab({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="space-y-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 flex flex-col min-h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Package className="w-5 h-5" /> قيمة المخزون حسب التصنيف (ج.م)
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.inventory} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number | string | undefined) => [`${Number(value ?? 0).toLocaleString()} ج.م`, 'القيمة']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {analytics.inventory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">يعتمد هذا الرسم على سعر التكلفة لتقييم المخزون</p>
        </div>
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 flex flex-col min-h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> توزيع المبيعات حسب القسم
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.sales}
                  cx="50%" cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {analytics.sales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number | string | undefined) => [`${Number(value ?? 0).toLocaleString()} ج.م`, 'المبيعات']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">تحليل المبيعات بناءً على الأصناف خلال الفترة المختارة</p>
        </div>
      </div>
    </div>
  );
}
