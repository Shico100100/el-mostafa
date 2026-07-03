'use client';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Account { id: number; code: string; name: string; type: string; balance: string | number; }
interface TrialBalanceItem { account_name: string; debit: string | number; credit: string | number; }

export function AccountingCharts({ accounts, trialBalance }: { accounts: Account[]; trialBalance: TrialBalanceItem[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <GlassPanel className="p-6 h-[400px]">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.17 15.17 0 0 1 8 4.47A15.17 15.17 0 0 1 12 22 15.17 15.17 0 0 1 4 6.47 15.17 15.17 0 0 1 12 2z"/></svg>
                    توزيع الحسابات
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'أصول', value: accounts.filter((a: Account) => a.type === 'ASSET').length },
                                { name: 'خصوم', value: accounts.filter((a: Account) => a.type === 'LIABILITY').length },
                                { name: 'حقوق ملكية', value: accounts.filter((a: Account) => a.type === 'EQUITY').length },
                                { name: 'إيرادات', value: accounts.filter((a: Account) => a.type === 'REVENUE').length },
                                { name: 'مصروفات', value: accounts.filter((a: Account) => a.type === 'EXPENSE').length },
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                            paddingAngle={5} dataKey="value"
                        >
                            {[
                                { color: '#3b82f6' }, { color: '#ef4444' }, { color: '#fbbf24' },
                                { color: '#22c55e' }, { color: '#a855f7' },
                            ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </GlassPanel>

            <GlassPanel className="p-6 h-[400px]">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
                    أرصدة ميزان المراجعة (لأعلى 5 حسابات)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={trialBalance
                            .sort((a, b) => (Number(b.debit) + Number(b.credit)) - (Number(a.debit) + Number(a.credit)))
                            .slice(0, 5)
                            .map(item => ({
                                name: item.account_name,
                                debit: Number(item.debit),
                                credit: Number(item.credit)
                            }))
                        }
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Legend />
                        <Bar dataKey="debit" name="مدين" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="credit" name="دائن" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </GlassPanel>
        </div>
    );
}
