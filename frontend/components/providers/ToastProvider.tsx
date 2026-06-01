'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            richColors
            closeButton
            dir="rtl"
            toastOptions={{
                style: {
                    fontFamily: 'inherit',
                },
                className: 'rtl-toast',
            }}
        />
    );
}
