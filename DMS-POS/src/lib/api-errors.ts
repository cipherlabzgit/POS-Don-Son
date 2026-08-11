import axios from 'axios'

const DAY_LOCK_MSG =
  'Today has been locked by the administrator. Changes are no longer allowed.'

export function getDayLockUserMessage(err: unknown): string | null {
  if (!axios.isAxiosError(err)) return null
  const data = err.response?.data as { error?: { code?: string } } | undefined
  if (data?.error?.code === 'DayLocked') return DAY_LOCK_MSG
  return null
}

export function formatSubmitError(err: unknown): string {
  const day = getDayLockUserMessage(err)
  if (day) return day
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined
    const m = data?.error?.message
    if (m) return String(m)
    if (err.response) {
      const status = err.response.status
      if (status === 401) return 'Your session expired. Please sign in again.'
      if (status === 403) return 'You do not have permission for this action.'
      if (status >= 500) return 'The server had a problem. Try again later.'
    }
    // No HTTP response: wrong URL, backend down, CORS, blocked mixed content, etc.
    if (
      !err.response &&
      (err.code === 'ERR_NETWORK' ||
        err.code === 'ECONNABORTED' ||
        (typeof err.message === 'string' &&
          (err.message === 'Network Error' || err.message.includes('Network Error'))))
    ) {
      return 'Could not reach the server. Check the Server URL on the login screen, firewall (port 5126), and that the backend is running.'
    }
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}
