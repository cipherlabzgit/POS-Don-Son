'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  /** Red square close control (e.g. item details dialogs). */
  closeVariant?: 'default' | 'danger';
  /** Optional class for the title element. */
  titleClassName?: string;
  /** Light “paper” panel (white) instead of theme card background. */
  panelTone?: 'default' | 'paper';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeVariant = 'default',
  titleClassName,
  panelTone = 'default',
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-500/40 transition-opacity dark:bg-stone-900/50"
        aria-hidden
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all`}
          style={{
            backgroundColor: panelTone === 'paper' ? '#ffffff' : 'var(--card)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h3
              className={
                titleClassName ??
                'text-lg font-semibold text-[var(--foreground)]'
              }
            >
              {title}
            </h3>
            {showCloseButton && closeVariant === 'danger' ? (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-red-700 bg-red-600 text-white transition-colors hover:bg-red-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            ) : showCloseButton ? (
              <button
                onClick={onClose}
                className="rounded-lg p-1 transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }}
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div 
      className="flex items-center justify-end space-x-3 px-6 py-4 mt-4"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {children}
    </div>
  );
}
