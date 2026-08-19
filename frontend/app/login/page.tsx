'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, setApiBaseUrl, getApiUrl } from '@/lib/api';
import { Server } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showServerConfig, setShowServerConfig] = useState(false);
    const [serverUrl, setServerUrl] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('');
    const [connectionOk, setConnectionOk] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const current = getApiUrl();
        if (current !== '/api') {
            setServerUrl(current);
            setShowServerConfig(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('الرجاء إدخال البريد الإلكتروني');
            return;
        }

        if (password.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 خانات على الأقل');
            return;
        }

        if (serverUrl && serverUrl !== '/api') {
            setApiBaseUrl(serverUrl);
        }

        setLoading(true);

        try {
            const result = await api.loginByEmail(email, password);

            if (result?.token) {
                localStorage.setItem('token', result.token);
                if (result.refreshToken) {
                    localStorage.setItem('refreshToken', result.refreshToken);
                }
                router.push('/dashboard');
            } else {
                setError('كلمة المرور غير صحيحة');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'حدث خطأ في الاتصال بالسيرفر';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        const url = serverUrl.replace(/\/+$/, '');
        try {
            const res = await fetch(`${url}/api/v1/auth/me`);
            if (res.ok) {
                setConnectionStatus('✓ متصل بنجاح');
                setConnectionOk(true);
            } else {
                setConnectionStatus('✗ فشل الاتصال - تحقق من العنوان');
                setConnectionOk(false);
            }
        } catch {
            setConnectionStatus('✗ لا يمكن الوصول للخادم');
            setConnectionOk(false);
        }
    };

    const saveServerUrl = () => {
        setApiBaseUrl(serverUrl);
        setConnectionStatus('✓ تم الحفظ');
        setConnectionOk(true);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0f0d] bg-gradient-to-br from-[#0f1714] via-[#0a0f0d] to-[#0a0f0d] px-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1f2d26] bg-[#0f1714] shadow-2xl shadow-emerald-500/5">
                {/* Header */}
                <div className="relative border-b border-[#1f2d26] bg-gradient-to-r from-emerald-600/10 to-teal-600/5 px-8 py-7 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-black text-[#04130d] shadow-lg shadow-emerald-500/30">
                        م
                    </div>
                    <h1 className="text-2xl font-bold text-white">ELMostafa</h1>
                    <p className="mt-1 text-sm text-[#6b8378]">نظام إدارة المصنع</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#6b8378]">
                                البريد الإلكتروني
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-[#1f2d26] bg-[#121a16] px-4 py-3 text-white placeholder-[#4a5d54] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                placeholder="أدخل بريدك الإلكتروني"
                                required
                                dir="rtl"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#6b8378]">
                                كلمة المرور
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-[#1f2d26] bg-[#121a16] px-4 py-3 text-white placeholder-[#4a5d54] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                placeholder="أدخل كلمة المرور"
                                required
                                dir="rtl"
                                minLength={8}
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300" dir="rtl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white transition hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
                        </button>
                    </form>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => setShowServerConfig(!showServerConfig)}
                            className="flex w-full items-center justify-center gap-2 text-sm text-[#6b8378] transition hover:text-emerald-400"
                        >
                            <Server className="h-4 w-4" />
                            {showServerConfig ? 'إخفاء إعدادات الخادم' : 'إعدادات الخادم للتطبيق'}
                        </button>

                        {showServerConfig && (
                            <div className="mt-4 rounded-xl border border-[#1f2d26] bg-[#121a16] p-4">
                                <p className="mb-2 text-xs text-[#6b8378]">عنوان الخادم لتطبيق الجوال</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={serverUrl}
                                        onChange={(e) => setServerUrl(e.target.value)}
                                        placeholder="http://192.168.1.100:3001"
                                        dir="ltr"
                                        className="flex-1 rounded-lg border border-[#1f2d26] bg-[#0a0f0d] px-3 py-2 text-sm font-mono text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={testConnection}
                                        className="rounded-lg bg-teal-600 px-3 py-2 text-xs text-white transition hover:bg-teal-500"
                                    >
                                        اختبار
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveServerUrl}
                                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white transition hover:bg-emerald-500"
                                    >
                                        حفظ
                                    </button>
                                </div>
                                {connectionStatus && (
                                    <p className={`mt-2 text-xs ${connectionOk ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {connectionStatus}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
