'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { mode, setMode, _hasHydrated } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !_hasHydrated) {
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center">
        <Sun className="w-5 h-5" style={{ color: '#6B7280' }} />
      </div>
    );
  }

  const cycleMode = () => {
    if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('system');
    } else {
      setMode('light');
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'system':
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System mode';
    }
  };

  return (
    <button
      onClick={cycleMode}
      className="relative p-2 rounded-lg transition-colors group"
      style={{ color: 'var(--muted-foreground)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--foreground)';
        e.currentTarget.style.backgroundColor = 'var(--muted)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--muted-foreground)';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={getLabel()}
      aria-label={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
