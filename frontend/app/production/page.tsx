'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthCheck } from '@/lib/useAuthCheck';

export default function ProductionPage() {
    const ready = useAuthCheck();
    const router = useRouter();

    useEffect(() => {
        if (ready) {
            router.push('/manufacturing');
        }
    }, [ready, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-white text-xl">جاري التوجيه...</div>
        </div>
    );
}
