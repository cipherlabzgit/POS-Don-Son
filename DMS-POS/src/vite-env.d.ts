/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  dmsPos?: {
    mode: string
    getVersion?: () => Promise<string>
    getConfig?: () => Promise<{
      apiBaseUrl?: string
      posVerificationCode?: string
      showroomCode?: string
      showroomPublicCode?: string
      configPath?: string
      encrypted?: boolean
    } | null>
    shutdown?: () => void
    toggleFullscreen?: () => void
    isFullscreen?: () => Promise<boolean>
    sqliteOp?: (op: string, payload?: unknown) => Promise<unknown>
    printSilent?: (html: string) => Promise<{ success: boolean; error?: string }>
    openCashDrawer?: () => Promise<{ success: boolean; error?: string }>
    getDisplayStatus?: () => Promise<{
      secondaryAvailable: boolean
      primaryId: number
      displays: { id: number; primary: boolean; bounds: { x: number; y: number; width: number; height: number } }[]
    }>
    openCustomerDisplay?: () => Promise<{ ok: boolean; reason?: string; reused?: boolean }>
    listComPorts?: () => Promise<string[]>
    getPoleConfig?: () => Promise<{ port: string; baud: number }>
    setPolePort?: (port: string) => Promise<{ port: string; baud: number }>
    writePole?: (line1: string, line2: string) => Promise<{ success: boolean; error?: string }>
    pushCustomerCart?: (payload: {
      lines: { productId: string; name: string; qty: number; unitPrice: number }[]
      total: number
      change?: number
      thankYou?: boolean
    }) => void
    onCustomerCart?: (cb: (payload: {
      lines: { productId: string; name: string; qty: number; unitPrice: number }[]
      total: number
      change?: number
      thankYou?: boolean
    }) => void) => () => void
    unlockBackstage?: (password: string) => Promise<{ ok: boolean; locked?: boolean; message?: string }>
    grantBackstageSession?: () => Promise<{ ok: boolean }>
    lockBackstage?: () => Promise<{ ok: boolean }>
    backstageStatus?: () => Promise<{ unlocked: boolean }>
    getSecureConfig?: () => Promise<{
      apiBaseUrl?: string
      posVerificationCode?: string
      showroomCode?: string
      showroomPublicCode?: string
      configPath?: string
      encrypted?: boolean
    } | null>
    saveSecureConfig?: (payload: {
      apiBaseUrl: string
      posVerificationCode: string
      showroomCode: string
      showroomPublicCode?: string
    }) => Promise<{ ok: boolean; message?: string; config?: { apiBaseUrl: string; posVerificationCode: string; showroomCode: string; configPath?: string; encrypted?: boolean } }>
    onBackstageHotkey?: (cb: () => void) => () => void
  }
}