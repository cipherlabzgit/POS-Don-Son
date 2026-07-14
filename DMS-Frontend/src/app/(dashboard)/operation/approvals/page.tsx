'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Unified approval queue: `/administrator/approvals` */
export default function OperationApprovalsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/administrator/approvals');
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
        <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Redirecting to Approvals…
        </p>
      </div>
    </div>
  );
}
