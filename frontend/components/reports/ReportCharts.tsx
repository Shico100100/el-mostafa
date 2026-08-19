'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
const COLORS = ['#10b981', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#ec4899', '#06b6d4', '#84cc16'];

export function ReportBarChart({ data, title, xKey = 'name', yKey = 'value', color = '#10b981' }: {
  data: { name: string; value: number }[];
  title: string;
  xKey?: string;
  yKey?: string;
  color?: string;
}) {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
      <h3 className="text-white font-bold mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={xKey} tick={{ fill: '#6b8378', fontSize: 11 }} />
          <YAxis tick={{ fill: '#6b8378', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0f1714', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
            formatter={(value) => [`${Number(value).toLocaleString()} ج.م`]}
          />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportPieChart({ data, title }: {
  data: { name: string; value: number }[];
  title: string;
}) {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
      <h3 className="text-white font-bold mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}
            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            labelLine={{ stroke: '#6b8378' }}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0f1714', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
            formatter={(value) => [`${Number(value).toLocaleString()} ج.م`]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportLineChart({ data, title, xKey = 'date', lines }: {
  data: Record<string, string | number | null | undefined>[];
  title: string;
  xKey?: string;
  lines: { key: string; color: string; name: string }[];
}) {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
      <h3 className="text-white font-bold mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={xKey} tick={{ fill: '#6b8378', fontSize: 11 }} />
          <YAxis tick={{ fill: '#6b8378', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0f1714', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
            formatter={(value) => [`${Number(value).toLocaleString()} ج.م`]}
          />
          <Legend />
          {lines.map(l => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} name={l.name} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportComparisonChart({ data, title }: {
  data: { name: string; revenue: number; cost: number; profit: number }[];
  title: string;
}) {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
      <h3 className="text-white font-bold mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fill: '#6b8378', fontSize: 10 }} />
          <YAxis tick={{ fill: '#6b8378', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0f1714', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
            formatter={(value) => [`${Number(value).toLocaleString()} ج.م`]}
          />
          <Legend />
          <Bar dataKey="revenue" name="الإيراد" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="cost" name="التكلفة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" name="الربح" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
