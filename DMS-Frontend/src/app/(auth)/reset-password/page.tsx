'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({ token, ...data });
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The reset link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--muted)' }}>
        <div className="w-full max-w-md">
          <div className="rounded-lg shadow-xl p-8 text-center" style={{ backgroundColor: 'var(--card)' }}>
            <div 
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#10B981' }}
            >
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Password Reset Successfully
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              Your password has been changed. You can now log in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C8102E' }}
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--muted)' }}>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div 
            className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ backgroundColor: '#C8102E' }}
          >
            <span className="text-white font-bold text-3xl">D&S</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Enter your new password below
          </p>
        </div>

        <div className="rounded-lg shadow-xl p-8" style={{ backgroundColor: 'var(--card)' }}>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                New Password
              </label>
              <div className="relative">
                <input
                  {...register('newPassword')}
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="block w-full rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
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
                  placeholder="Enter new password (min. 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="block w-full rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
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
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full flex justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#C8102E' }}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: '#C8102E' }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </form>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C4', border: '1px solid #FFD100' }}>
            <h4 className="font-medium mb-2 text-sm" style={{ color: '#78350F' }}>
              Password Requirements
            </h4>
            <ul className="text-xs space-y-1" style={{ color: '#92400E' }}>
              <li>• At least 8 characters long</li>
              <li>• At least one uppercase letter</li>
              <li>• At least one lowercase letter</li>
              <li>• At least one number</li>
              <li>• At least one special character</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center px-4"
          style={{ backgroundColor: 'var(--muted)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Loading…
          </p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
