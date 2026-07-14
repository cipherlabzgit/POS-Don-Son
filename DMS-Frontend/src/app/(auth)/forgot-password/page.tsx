'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(data);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div 
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#10B981' }}
            >
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>
              Check Your Email
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C8102E' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div 
            className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ backgroundColor: '#C8102E' }}
          >
            <span className="text-white font-bold text-3xl">D&S</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="block w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all"
                style={{ 
                  border: '1px solid #D1D5DB',
                  color: '#111827'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C8102E';
                  e.currentTarget.style.outline = '2px solid #C8102E';
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.outline = 'none';
                }}
                placeholder="your.email@donandson.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>{errors.email.message}</p>
              )}
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
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
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
        </div>
      </div>
    </div>
  );
}
