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
    getConfig?: () => Promise<{ apiBaseUrl?: string; showroomCode?: string; configPath?: string } | null>
    shutdown?: () => void
    toggleFullscreen?: () => void
    isFullscreen?: () => Promise<boolean>
    sqliteOp?: (op: string, payload?: unknown) => Promise<unknown>
    printSilent?: (html: string) => Promise<{ success: boolean; error?: string }>
  }
}