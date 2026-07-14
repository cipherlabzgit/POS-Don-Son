'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/components/ui/button';

interface IdleLogoutBannerProps {
  idleTimeoutMinutes?: number;
  warningBeforeMinutes?: number;
  onLogout: () => void;
  className?: string;
}

export function IdleLogoutBanner({ 
  idleTimeoutMinutes = 15, 
  warningBeforeMinutes = 2,
  onLogout,
  className 
}: IdleLogoutBannerProps) {
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lastActivity, setLastActivity] = useState(() => Date.now());

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const resetActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
      setIsIdle(false);
    };

    events.forEach(event => {
      document.addEventListener(event, resetActivity);
    });

    const interval = setInterval(() => {
      const idleTimeMs = Date.now() - lastActivity;
      const idleTimeMinutes = idleTimeMs / (1000 * 60);

      const warningThreshold = idleTimeoutMinutes - warningBeforeMinutes;

      if (idleTimeMinutes >= idleTimeoutMinutes) {
        setIsIdle(true);
        onLogout();
      } else if (idleTimeMinutes >= warningThreshold) {
        setShowWarning(true);
        const secondsRemaining = Math.floor((idleTimeoutMinutes * 60) - (idleTimeMs / 1000));
        setSecondsLeft(secondsRemaining);
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity);
      });
      clearInterval(interval);
    };
  }, [lastActivity, idleTimeoutMinutes, warningBeforeMinutes, onLogout]);

  const handleDismiss = () => {
    setShowWarning(false);
    setLastActivity(Date.now());
  };

  if (!showWarning || isIdle) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 max-w-md bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg z-50",
      "animate-in slide-in-from-bottom-4",
      className
    )}>
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
                onClick={onLogout}
                size="sm"
                variant="outline"
                className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
              >
                Logout Now
              </Button>
            </div>
          </div>
          <button
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
