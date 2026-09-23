'use client';

import { useEffect, useState } from 'react';
import { dnPrintJobsApi, type DnPrintPresence } from '@/lib/api/dn-print-jobs';

/**
 * Live DN Print Client presence from heartbeats (polls every 5s).
 */
export function DnPrintStatusBadge({ className }: { className?: string }) {
  const [presence, setPresence] = useState<DnPrintPresence | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await dnPrintJobsApi.getPresence();
        if (!cancelled) setPresence(data);
      } catch {
        if (!cancelled) {
          setPresence({
            isOnline: false,
            onlineAgentCount: 0,
            offlineSecondsThreshold: 15,
            agents: [],
          });
        }
      }
    };

    void load();
    const id = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const online = presence?.isOnline === true;
  const agent = presence?.agents?.find((a) => a.isOnline) ?? presence?.agents?.[0];
  const detail = online
    ? [
        agent?.stationCode,
        agent?.machineName,
        agent?.printerName ? `→ ${agent.printerName}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'No DN Print Client heartbeat';

  return (
    <div
      className={className}
      title={detail}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
        fontSize: 12,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: online ? '#16a34a' : '#9ca3af',
          boxShadow: online ? '0 0 0 3px rgba(22,163,74,0.2)' : 'none',
        }}
      />
      <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
        DN Print {online ? 'Online' : 'Offline'}
      </span>
      {online && presence && presence.onlineAgentCount > 1 && (
        <span style={{ color: 'var(--muted-foreground)' }}>
          ({presence.onlineAgentCount})
        </span>
      )}
    </div>
  );
}
