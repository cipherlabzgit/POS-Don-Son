export type TillConfig = {
  apiBaseUrl: string
  posVerificationCode: string
  showroomCode: string
  showroomPublicCode?: string
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
