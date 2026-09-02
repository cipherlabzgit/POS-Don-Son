export type TillConfig = {
  apiBaseUrl: string
  showroomCode: string
  configPath?: string
  encrypted?: boolean
}

export type UnlockResult = {
  ok: boolean
  locked?: boolean
  message?: string
}

export type SaveConfigResult = {
  ok: boolean
  message?: string
  config?: TillConfig
}
