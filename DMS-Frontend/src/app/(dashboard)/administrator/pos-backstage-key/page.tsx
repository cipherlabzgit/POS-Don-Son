'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, KeyRound, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ProtectedPage } from '@/components/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { posBackstageApi } from '@/lib/api/pos-backstage';

function KeyField({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  const [show, setShow] = useState(false)
  const copy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success('Copied.')
  }
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="flex gap-2">
        <input
          readOnly
          type={show ? 'text' : 'password'}
          value={value}
          className="w-full rounded-lg border bg-neutral-50 px-3 py-2 font-mono text-sm"
        />
        <Button type="button" variant="secondary" onClick={() => setShow((v) => !v)}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="secondary" onClick={() => void copy()}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </label>
  )
}

function PosBackstageKeyContent() {
  const user = useAuthStore((s) => s.user)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const apply = (pair: { current: string; next: string }) => {
    setCurrent(pair.current)
    setNext(pair.next)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      apply(await posBackstageApi.getKey())
    } catch {
      toast.error('Could not load the POS admin key. Super Admin only.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.isSuperAdmin) void load()
    else setLoading(false)
  }, [user?.isSuperAdmin, load])

  const generateNext = async () => {
    setBusy(true)
    try {
      apply(await posBackstageApi.generateNext())
      toast.success('Next password generated. Current POS key is unchanged.')
    } catch {
      toast.error('Could not generate the next password.')
    } finally {
      setBusy(false)
    }
  }

  const activateNext = async () => {
    setBusy(true)
    try {
      apply(await posBackstageApi.activateNext())
      toast.success('Next password is now active on POS (when tills are online). A new next password was generated.')
    } catch {
      toast.error('Could not activate the next password.')
    } finally {
      setBusy(false)
    }
  }

  if (!user?.isSuperAdmin) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Only a Super Admin can view or change the POS Hidden Admin Key.
      </p>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          <KeyRound className="mr-3 inline-block h-8 w-8" style={{ color: '#C8102E' }} />
          POS Admin Key
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          One password for the POS app (Ctrl+Shift+A). The next password is generated here automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Passwords</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          ) : (
            <>
              <KeyField
                label="Current POS password"
                value={current}
                hint="Use this on every POS till until you activate the next one."
              />
              <KeyField
                label="Next POS password (auto-generated)"
                value={next}
                hint="Not active yet. Activate when you want tills to start using it."
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" disabled={busy} onClick={() => void generateNext()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate new next
                </Button>
                <Button type="button" disabled={busy} onClick={() => void activateNext()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {busy ? 'Working…' : 'Activate next password'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PosBackstageKeyPage() {
  return (
    <ProtectedPage permission="setting:view">
      <PosBackstageKeyContent />
    </ProtectedPage>
  )
}
