'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function formatLoginError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: unknown; status?: number } }).response;
    if (!response) {
      return 'Cannot reach the server. Confirm the API is running and NEXT_PUBLIC_API_URL matches your browser (same host/port you use to open the app).';
    }
    const data = response.data;
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      if (typeof o.message === 'string') return o.message;
      if (typeof o.detail === 'string') return o.detail;
      if (typeof o.title === 'string' && typeof o.detail === 'string') return `${o.title}: ${o.detail}`;
      const errs = o.errors;
      if (errs && typeof errs === 'object') {
        const first = Object.values(errs as Record<string, unknown>)[0];
        if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
      }
    }
  }
  return 'Invalid email or password';
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(data);
      login(response.accessToken, response.refreshToken, response.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(formatLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--muted)' }}>
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <div 
            className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ backgroundColor: '#C8102E' }}
          >
            <span className="text-white font-bold text-3xl">D&S</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Don & Sons
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Delivery Management System
          </p>
        </div>

        <div className="rounded-lg shadow-xl p-8" style={{ backgroundColor: 'var(--card)' }}>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Email Address
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--input)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#C8102E';
                    e.currentTarget.style.outline = '2px solid #C8102E';
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--input)';
                    e.currentTarget.style.outline = 'none';
                  }}
                  placeholder="your.email@donandson.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Password
                </label>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="block w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--input)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#C8102E';
                    e.currentTarget.style.outline = '2px solid #C8102E';
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--input)';
                    e.currentTarget.style.outline = 'none';
                  }}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    id="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 rounded"
                    style={{ 
                      borderColor: 'var(--input)',
                      color: '#C8102E'
                    }}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#C8102E' }}>
                    Forgot password?
                  </a>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#C8102E' }}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Don & Sons (Pvt) Ltd © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
