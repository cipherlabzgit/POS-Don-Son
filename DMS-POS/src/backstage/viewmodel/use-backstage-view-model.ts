import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { getApiBaseUrl } from '../../lib/api'
import { normalizeApiBaseUrl } from '../../lib/api-url'
import { applyBootstrapConfig } from '../../lib/bootstrap-config'
import { useSettingsStore } from '../../lib/settings-store'
import { toast } from '../../lib/toast-store'
import type { SaveConfigResult, UnlockResult } from '../model/till-config'

export type BackstagePhase = 'locked' | 'unlocked'

/** View-model for the hidden backstage panel (MVVM). */
export function useBackstageViewModel() {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<BackstagePhase>('locked')
  const [password, setPassword] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [posVerificationCode, setPosVerificationCode] = useState('')
  const [showroomCode, setShowroomCode] = useState('')
  const [configPath, setConfigPath] = useState('')
  const [encrypted, setEncrypted] = useState(false)
  const [error, setError] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [saving, setSaving] = useState(false)
  const desktop = Boolean(window.dmsPos?.unlockBackstage)

  const openCommand = useCallback(() => {
    setVisible(true)
    setPhase('locked')
    setPassword('')
    setError('')
  }, [])

  const closeCommand = useCallback(() => {
    void window.dmsPos?.lockBackstage?.()
    setVisible(false)
    setPhase('locked')
    setPassword('')
    setError('')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        e.stopPropagation()
        openCommand()
      }
    }
    window.addEventListener('keydown', onKey, true)
    const off = window.dmsPos?.onBackstageHotkey?.(openCommand)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      off?.()
    }
  }, [openCommand])

  const loadConfigCommand = useCallback(async () => {
    const cfg = (await window.dmsPos?.getSecureConfig?.()) ?? (await window.dmsPos?.getConfig?.())
    const store = useSettingsStore.getState()
    setApiBaseUrl(cfg?.apiBaseUrl || store.apiBaseUrl)
    setPosVerificationCode(cfg?.posVerificationCode || store.assignedShowroomCode)
    setShowroomCode(cfg?.showroomPublicCode || cfg?.showroomCode || store.assignedShowroomPublicCode)
    setConfigPath(cfg?.configPath ?? '')
    setEncrypted(Boolean(cfg?.encrypted))
  }, [])

  const unlockCommand = useCallback(async () => {
    if (!desktop) {
      setError('Backstage is available only on the POS desktop app.')
      return
    }
    if (!password.trim()) {
      setError('Verification Admin Key is required.')
      return
    }
    setUnlocking(true)
    setError('')
    try {
      let unlocked = false
      try {
        const { data } = await axios.post(`${getApiBaseUrl()}/api/pos-backstage/verify`, {
          key: password,
        })
        const ok = Boolean(
          (data as { success?: boolean })?.success ?? (data as { Success?: boolean })?.Success,
        )
        if (ok) {
          const granted = await window.dmsPos?.grantBackstageSession?.()
          unlocked = Boolean(granted?.ok)
        }
      } catch {
        /* offline or old API — fall back to the baked-in hash */
      }
      if (!unlocked) {
        const result = (await window.dmsPos?.unlockBackstage?.(password)) as UnlockResult | undefined
        if (!result?.ok) {
          setError(result?.message || 'Invalid verification key.')
          return
        }
      }
      setPhase('unlocked')
      setPassword('')
      await loadConfigCommand()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlock failed.')
    } finally {
      setUnlocking(false)
    }
  }, [desktop, password, loadConfigCommand])

  const saveCommand = useCallback(async () => {
    const url = normalizeApiBaseUrl(apiBaseUrl)
    const verify = posVerificationCode.trim()
    const publicCode = showroomCode.trim()
    if (!url) {
      setError('API URL is required.')
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      setError('API URL must start with http:// or https://')
      return
    }
    if (!verify) {
      setError('POS Verification Code is required.')
      return
    }
    if (!publicCode) {
      setError('Showroom Code is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const result = (await window.dmsPos?.saveSecureConfig?.({
        apiBaseUrl: url,
        posVerificationCode: verify,
        showroomCode: publicCode,
        showroomPublicCode: publicCode,
      })) as SaveConfigResult | undefined
      if (!result?.ok) {
        setError(result?.message || 'Could not save encrypted configuration.')
        return
      }
      useSettingsStore.getState().setApiBaseUrl(url)
      useSettingsStore.getState().setAssignedShowroomCode(verify)
      useSettingsStore.getState().setAssignedShowroomPublicCode(publicCode)
      await applyBootstrapConfig()
      setEncrypted(true)
      setConfigPath(result.config?.configPath ?? configPath)
      toast('Encrypted till configuration saved.', 'success')
      closeCommand()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }, [apiBaseUrl, posVerificationCode, showroomCode, configPath, closeCommand])

  return {
    visible,
    phase,
    password,
    apiBaseUrl,
    posVerificationCode,
    showroomCode,
    configPath,
    encrypted,
    error,
    unlocking,
    saving,
    desktop,
    setPassword,
    setApiBaseUrl,
    setPosVerificationCode,
    setShowroomCode,
    openCommand,
    closeCommand,
    unlockCommand,
    saveCommand,
  }
}
