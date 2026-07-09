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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">ELMostafa</h1>
                    <p className="text-gray-300">نظام إدارة المصنع</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                            البريد الإلكتروني
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="أدخل بريدك الإلكتروني"
                            required
                            dir="rtl"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                            كلمة المرور
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="أدخل كلمة المرور"
                            required
                            dir="rtl"
                            minLength={8}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm" dir="rtl">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
                    </button>
                </form>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => setShowServerConfig(!showServerConfig)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition"
                    >
                        <Server className="w-4 h-4" />
                        {showServerConfig ? 'إخفاء إعدادات الخادم' : 'إعدادات الخادم للتطبيق'}
                    </button>

                    {showServerConfig && (
                        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs text-slate-400 mb-2">عنوان الخادم لتطبيق الجوال</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={serverUrl}
                                    onChange={(e) => setServerUrl(e.target.value)}
                                    placeholder="http://192.168.1.100:3001"
                                    dir="ltr"
                                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={testConnection}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs transition"
                                >
                                    اختبار
                                </button>
                                <button
                                    type="button"
                                    onClick={saveServerUrl}
                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-xs transition"
                                >
                                    حفظ
                                </button>
                            </div>
                            {connectionStatus && (
                                <p className={`mt-2 text-xs ${connectionOk ? 'text-green-400' : 'text-red-400'}`}>
                                    {connectionStatus}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}