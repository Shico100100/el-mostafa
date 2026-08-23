'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!email) { setError('الرجاء إدخال البريد الإلكتروني'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/v1/auth/forgot/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.errors?.email || data.message?.[0] || data.message || 'حدث خطأ');
      }
      setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ';
      if (msg.includes('emailNotExists')) {
        setError('البريد الإلكتروني غير مسجل');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f0d] bg-gradient-to-br from-[#0f1714] via-[#0a0f0d] to-[#0a0f0d] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1f2d26] bg-[#0f1714] shadow-2xl shadow-emerald-500/5">
        <div className="relative border-b border-[#1f2d26] bg-gradient-to-r from-emerald-600/10 to-teal-600/5 px-8 py-7 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-black text-[#04130d] shadow-lg shadow-emerald-500/30">
            <KeyRound className="w-7 h-7 text-[#04130d]" />
          </div>
          <h1 className="text-2xl font-bold text-white">نسيت كلمة المرور</h1>
          <p className="mt-1 text-sm text-[#6b8378]">أدخل بريدك الإلكتروني لإعادة التعيين</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#6b8378]">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#1f2d26] bg-[#121a16] px-4 py-3 text-white placeholder-[#4a5d54] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="أدخل بريدك الإلكتروني" dir="rtl" required />
            </div>
            {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300" dir="rtl">{error}</div>}
            {success && <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300" dir="rtl">{success}</div>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white transition hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-[#6b8378]">
            <button onClick={() => router.push('/login')} className="text-emerald-400 hover:text-emerald-300 font-medium transition">العودة لتسجيل الدخول</button>
          </div>
        </div>
      </div>
    </div>
  );
}
