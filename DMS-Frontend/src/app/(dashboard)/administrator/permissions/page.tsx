'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Legacy URL: canonical hub is `/administrator/security?tab=permissions`. */
export default function PermissionsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/administrator/security?tab=permissions');
  }, [router]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-6">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Opening Security…
      </p>
    </div>
  );
}
