'use client';

import { toast } from 'sonner';

interface ConfirmDialogOptions {
  message: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function confirmDialog({
  message,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
  onConfirm,
}: ConfirmDialogOptions) {
  toast.custom(
    (t) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-2">{message}</p>
        {description && <p className="text-gray-400 text-sm mb-4 whitespace-pre-line">{description}</p>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              await onConfirm();
            }}
            className={`px-4 py-2 rounded-lg transition ${danger
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    ),
    { duration: Infinity },
  );
}
