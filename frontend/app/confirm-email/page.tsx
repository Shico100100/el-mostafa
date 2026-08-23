'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hash = searchParams.get('hash');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!hash) {
      setStatus('error');
      setMessage('رابط التفعيل غير صحيح');
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/v1/auth/email/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.errors?.hash || data.message?.[0] || data.message || 'حدث خطأ');
        }
        setStatus('success');
        setMessage('تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول');
      } catch (err: unknown) {
        setStatus('error');
        const msg = err instanceof Error ? err.message : 'حدث خطأ';
        if (msg.includes('invalidHash')) {
          setMessage('رابط التفعيل غير صالح أو منتهي الصلاحية');
        } else {
          setMessage(msg);
        }
      }
    };
    confirm();
  }, [hash]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f0d] bg-gradient-to-br from-[#0f1714] via-[#0a0f0d] to-[#0a0f0d] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1f2d26] bg-[#0f1714] shadow-2xl shadow-emerald-500/5 p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">جاري تفعيل الحساب...</h1>
            <p className="text-[#6b8378]">يرجى الانتظار</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">تم التفعيل بنجاح</h1>
            <p className="text-[#6b8378] mb-6">{message}</p>
            <button onClick={() => router.push('/login')}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white transition hover:from-emerald-500 hover:to-teal-500">
              تسجيل الدخول
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">فشل التفعيل</h1>
            <p className="text-red-300 mb-6">{message}</p>
            <button onClick={() => router.push('/login')}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white transition hover:from-emerald-500 hover:to-teal-500">
              العودة لتسجيل الدخول
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f0d]">
        <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
