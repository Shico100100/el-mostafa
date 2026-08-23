'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.firstName || !form.lastName) { setError('الرجاء إدخال الاسم الكامل'); return; }
    if (!form.email) { setError('الرجاء إدخال البريد الإلكتروني'); return; }
    if (form.password.length < 8) { setError('كلمة المرور يجب أن تكون 8 خانات على الأقل'); return; }
    if (form.password !== form.confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/v1/auth/email/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message?.[0] || data.message || 'حدث خطأ في التسجيل');
      }
      setSuccess('تم التسجيل بنجاح! تحقق من بريدك الإلكتروني لتفعيل الحساب');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ في التسجيل';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f0d] bg-gradient-to-br from-[#0f1714] via-[#0a0f0d] to-[#0a0f0d] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1f2d26] bg-[#0f1714] shadow-2xl shadow-emerald-500/5">
        <div className="relative border-b border-[#1f2d26] bg-gradient-to-r from-emerald-600/10 to-teal-600/5 px-8 py-7 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-black text-[#04130d] shadow-lg shadow-emerald-500/30">
            <UserPlus className="w-7 h-7 text-[#04130d]" />
          </div>
          <h1 className="text-2xl font-bold text-white">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-[#6b8378]">نظام إدارة المصنع</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#6b8378]">الاسم الأول</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full rounded-lg border border-[#1f2d26] bg-[#121a16] px-4 py-3 text-white placeholder-[#4a5d54] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="الاسم الأول" dir="rtl" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#6b8378]">اسم العائلة</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full rounded-lg border border-[#1f2d26] bg-[#121a16] px-4 py-3 text-white placeholder-[#4a5d54] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="اسم العائلة" dir="rtl" required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6b8378]">البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-[#1f2d26] bg-[#121a16] px-4 py-3 text-white placeholder-[#4a5d54] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="أدخل بريدك الإلكتروني" dir="rtl" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6b8378]">كلمة المرور</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-[#1f2d26] bg-[#121a16] px-4 py-3 text-white placeholder-[#4a5d54] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="8 خانات على الأقل" dir="rtl" required minLength={8} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6b8378]">تأكيد كلمة المرور</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full rounded-lg border border-[#1f2d26] bg-[#121a16] px-4 py-3 text-white placeholder-[#4a5d54] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="أعد إدخال كلمة المرور" dir="rtl" required minLength={8} />
            </div>
            {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300" dir="rtl">{error}</div>}
            {success && <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300" dir="rtl">{success}</div>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white transition hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-[#6b8378]">
            لديك حساب بالفعل؟{' '}
            <button onClick={() => router.push('/login')} className="text-emerald-400 hover:text-emerald-300 font-medium transition">تسجيل الدخول</button>
          </div>
        </div>
      </div>
    </div>
  );
}
