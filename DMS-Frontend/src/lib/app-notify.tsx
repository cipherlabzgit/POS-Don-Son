'use client';

import toast from 'react-hot-toast';
import { AppConfirmToast } from '@/components/ui/app-notifications';

export { default as toast } from 'react-hot-toast';

export type AppConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
};

export function appConfirm(message: string, options: AppConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <AppConfirmToast
          visible={t.visible}
          title={options.title ?? 'Please confirm'}
          message={message}
          confirmLabel={options.confirmLabel ?? 'OK'}
          cancelLabel={options.cancelLabel ?? 'Cancel'}
          variant={options.variant ?? 'danger'}
          onConfirm={() => {
            toast.dismiss(t.id);
            resolve(true);
          }}
          onCancel={() => {
            toast.dismiss(t.id);
            resolve(false);
          }}
        />
      ),
      { duration: Infinity, id: 'dms-app-confirm' },
    );
  });
}
