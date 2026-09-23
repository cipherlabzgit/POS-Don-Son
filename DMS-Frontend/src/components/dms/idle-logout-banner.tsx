'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/components/ui/button';

interface IdleLogoutBannerProps {
  idleTimeoutMinutes?: number;
  warningBeforeMinutes?: number;
  onLogout: () => void;
  className?: string;
}

/**
 * Client-side idle timeout: auto-logout after inactivity (mouse/keyboard/touch).
 * Shows a warning banner shortly before logout.
 */
export function IdleLogoutBanner({
  idleTimeoutMinutes = 15,
  warningBeforeMinutes = 2,
  onLogout,
  className,
}: IdleLogoutBannerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const logoutCalledRef = useRef(false);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    logoutCalledRef.current = false;
    setShowWarning(false);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    let lastMoveHandled = 0;

    const handleActivity = (event: Event) => {
      if (event.type === 'mousemove') {
        const now = Date.now();
        if (now - lastMoveHandled < 1000) return;
        lastMoveHandled = now;
      }
      resetActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
    const warningMs = Math.max(0, (idleTimeoutMinutes - warningBeforeMinutes) * 60 * 1000);

    const interval = setInterval(() => {
      const idleTimeMs = Date.now() - lastActivityRef.current;

      if (idleTimeMs >= idleTimeoutMs) {
        if (!logoutCalledRef.current) {
          logoutCalledRef.current = true;
          onLogoutRef.current();
        }
        return;
      }

      if (idleTimeMs >= warningMs) {
        setShowWarning(true);
        setSecondsLeft(Math.max(0, Math.ceil((idleTimeoutMs - idleTimeMs) / 1000)));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [idleTimeoutMinutes, warningBeforeMinutes, resetActivity]);

  const handleDismiss = () => {
    resetActivity();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 max-w-md bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg z-50',
        'animate-in slide-in-from-bottom-4',
        className,
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900 mb-1">
              Idle Timeout Warning
            </h3>
            <p className="text-sm text-yellow-800 mb-3">
              You will be logged out in <strong>{secondsLeft}</strong> seconds due to inactivity.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleDismiss}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Stay Logged In
              </Button>
              <Button
                onClick={() => onLogoutRef.current()}
                size="sm"
                variant="outline"
                className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
              >
                Logout Now
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
