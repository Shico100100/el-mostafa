'use client';

import { Edit, Trash2 } from 'lucide-react';
import { ROLES } from '@/components/users/types';
import type { User } from '@/components/users/types';

interface Props {
  users: User[];
  onEdit: (u: User) => void;
  onDelete: (id: number) => void;
}

export function UsersTable({ users, onEdit, onDelete }: Props) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-right">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="px-6 py-4">الاسم</th>
            <th className="px-6 py-4">البريد الإلكتروني</th>
            <th className="px-6 py-4">الصلاحية</th>
            <th className="px-6 py-4">الحالة</th>
            <th className="px-6 py-4">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-white/5 transition">
              <td className="px-6 py-4 font-medium">{u.firstName} {u.lastName}</td>
              <td className="px-6 py-4 text-slate-400">{u.email}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  u.role.id === 1 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  u.role.id === 3 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}>
                  {ROLES.find(r => r.id === u.role.id)?.label || u.role.name}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`w-2 h-2 rounded-full inline-block ml-2 ${u.status?.id === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {u.status?.id === 1 ? 'نشط' : 'معطل'}
              </td>
              <td className="px-6 py-4 flex gap-2">
                <button onClick={() => onEdit(u)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(u.id)} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
