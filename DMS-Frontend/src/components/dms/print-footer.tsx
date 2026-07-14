'use client';

import React from 'react';
import { formatSlDate, formatSlTime } from '@/lib/sri-lanka-time';

interface PrintFooterProps {
  preparedBy: string;
  planId?: string;
  className?: string;
}

export function PrintFooter({ preparedBy, planId, className }: PrintFooterProps) {
  const now = new Date();
  const formattedDate = formatSlDate(now, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = formatSlTime(now, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className={cn(
      "text-center text-sm text-gray-600 border-t border-gray-300 pt-3 mt-6",
      "print:text-black print:border-black",
      className
    )}>
      <p>
        This file was prepared by <strong>{preparedBy}</strong> on <strong>{formattedDate}</strong> at <strong>{formattedTime}</strong>
        {planId && <span> · Plan ID: <strong>{planId}</strong></span>}
      </p>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
