'use client';

import { Bell, Search, LogOut, Menu, User, Settings as SettingsIcon, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme/theme-context';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/theme/theme-toggle';
import { formatSlDate, formatSlTime } from '@/lib/sri-lanka-time';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const router = useRouter();
  const { pageColor } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Mock news ticker data - will be replaced with real data later
  const [newsItems] = useState([
    'System running smoothly',
    'Daily production report available',
    'New delivery schedule updated',
  ]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [clockNow, setClockNow] = useState(() => new Date());

  // Live clock for top bar (date + time)
  useEffect(() => {
    const id = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // News ticker rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [newsItems.length]);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <header className="flex-shrink-0" style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
      {/* News Ticker / Notification Bar */}
      <div
        className="h-8 px-4 flex items-center justify-between text-white text-xs"
        style={{ backgroundColor: pageColor }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="hidden md:block animate-pulse">
            {newsItems[currentNewsIndex]}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs whitespace-nowrap tabular-nums">
          <span>
            {formatSlDate(clockNow, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="opacity-80" aria-hidden="true">
            ·
          </span>
          <time dateTime={clockNow.toISOString()}>
            {formatSlTime(clockNow, {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </time>
        </div>
      </div>

      {/* Main Header */}
      <div className="h-16 flex items-center justify-between px-4 lg:px-6">
        {/* Left Section - Mobile Menu + Search */}
        <div className="flex items-center flex-1 space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted-foreground)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search products, showrooms, orders..."
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none text-sm"
                style={{ 
                  border: '1px solid var(--input)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `2px solid ${pageColor}`;
                  e.currentTarget.style.outlineOffset = '2px';
                  e.currentTarget.style.borderColor = pageColor;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = 'var(--input)';
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Icon for Mobile */}
          <button 
            className="sm:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted-foreground)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button 
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted-foreground)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Bell className="w-5 h-5" />
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: pageColor }}
            ></span>
          </button>

          {/* User Menu */}
          <div className="relative flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {user?.isSuperAdmin ? 'Super Admin' : user?.roles?.[0]?.name || 'User'}
              </p>
            </div>
            
            {/* User Avatar with Dropdown */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: pageColor }}
            >
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                ></div>
                <div className="absolute right-0 top-12 w-56 rounded-lg shadow-lg py-2 z-20" style={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--popover-foreground)' }}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/dashboard');
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2"
                    style={{ color: 'var(--foreground)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/administrator/system-settings');
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2"
                    style={{ color: 'var(--foreground)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2"
                      style={{ color: '#DC2626' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
