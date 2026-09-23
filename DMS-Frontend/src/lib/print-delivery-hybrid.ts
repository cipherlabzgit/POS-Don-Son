import type { Delivery } from '@/lib/api/deliveries';
import { dnPrintJobsApi } from '@/lib/api/dn-print-jobs';
import { printDeliveries } from '@/lib/print-delivery-notes';

export type HybridPrintResult = {
  mode: 'client' | 'browser';
  jobCount: number;
};

/**
 * Prefer hybrid DN Print Client queue; fall back to browser 5×5 print if enqueue fails.
 */
export async function printDeliveryNotesHybrid(
  deliveries: Delivery[],
  options?: { printedBy?: string; stationCode?: string; browserFallback?: boolean }
): Promise<HybridPrintResult> {
  const ids = deliveries.map((d) => d.id).filter(Boolean);
  if (!ids.length) throw new Error('No deliveries to print');

  try {
    const jobs = await dnPrintJobsApi.enqueueBatch(ids, options?.stationCode);
    return { mode: 'client', jobCount: Array.isArray(jobs) ? jobs.length : ids.length };
  } catch (err) {
    if (options?.browserFallback === false) throw err;
    await printDeliveries(deliveries, options?.printedBy ?? 'System');
    return { mode: 'browser', jobCount: ids.length };
  }
}
