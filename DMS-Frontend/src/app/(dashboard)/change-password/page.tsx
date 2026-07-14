'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api/auth';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await authApi.changePassword(data);
      setSuccess(true);
      reset();
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Change Password</h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Update your password to keep your account secure
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5" style={{ color: '#C8102E' }} />
            <CardTitle>Password Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <p className="text-sm" style={{ color: '#166534' }}>
                  Password changed successfully! Redirecting...
                </p>
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Current Password
              </label>
              <div className="relative">
                <input
                  {...register('currentPassword')}
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="block w-full rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--input)',
                    color: 'var(--foreground)'
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
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1.5 text-sm" style={{ color: '#DC2626' }}>{errors.currentPassword.message}</p>
              )}
            </div>

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
                    color: 'var(--foreground)'
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
                  placeholder="Enter new password"
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
                    color: 'var(--foreground)'
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

            <div className="flex items-center justify-end space-x-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
              >
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C4', border: '1px solid #FFD100' }}>
        <h4 className="font-medium mb-2" style={{ color: '#78350F' }}>
          Password Requirements
        </h4>
        <ul className="text-sm space-y-1" style={{ color: '#92400E' }}>
          <li>• At least 6 characters long</li>
          <li>• Mix of letters, numbers, and special characters recommended</li>
          <li>• Avoid using common words or personal information</li>
        </ul>
      </div>
    </div>
  );
}
