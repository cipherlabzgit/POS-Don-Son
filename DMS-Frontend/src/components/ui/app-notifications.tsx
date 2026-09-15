'use client';

import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

const BRAND = '#C8102E';

export function AppConfirmToast({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dms-confirm-title"
      aria-describedby="dms-confirm-message"
      className={`w-[min(92vw,26rem)] overflow-hidden rounded-xl border bg-white shadow-2xl transition ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{ borderColor: 'rgba(200,16,46,0.18)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ backgroundColor: BRAND }}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p id="dms-confirm-title" className="text-sm font-semibold tracking-wide">
          {title}
        </p>
      </div>
      <div className="px-4 py-4">
        <p id="dms-confirm-message" className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: variant === 'danger' ? BRAND : BRAND }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastIcon({ type }: { type: string }) {
  if (type === 'success') return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />;
  if (type === 'error') return <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: BRAND }} />;
  if (type === 'loading') return <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: BRAND }} />;
  return <Info className="h-5 w-5 shrink-0" style={{ color: '#2563eb' }} />;
}

export default function AppNotifications() {
  return (
    <Toaster
      position="top-center"
      containerStyle={{ zIndex: 99999, top: 72 }}
      toastOptions={{
        duration: 4200,
        success: { duration: 3800 },
        error: { duration: 5600 },
      }}
    >
      {(t) =>
        t.type === 'custom' ? (
          <>{t.message}</>
        ) : (
          <ToastBar
            toast={t}
            style={{
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
              maxWidth: 'min(92vw, 28rem)',
            }}
          >
            {({ message }) => (
              <div
                className="flex w-[min(92vw,28rem)] items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-xl"
                style={{
                  borderColor:
                    t.type === 'error'
                      ? 'rgba(200,16,46,0.28)'
                      : t.type === 'success'
                        ? 'rgba(5,150,105,0.28)'
                        : 'var(--border)',
                }}
              >
                <ToastIcon type={t.type} />
                <div className="min-w-0 flex-1 text-sm leading-snug" style={{ color: 'var(--foreground)' }}>
                  {message}
                </div>
                {t.type !== 'loading' ? (
                  <button
                    type="button"
                    className="rounded p-0.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    onClick={() => toast.dismiss(t.id)}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            )}
          </ToastBar>
        )
      }
    </Toaster>
  );
}
