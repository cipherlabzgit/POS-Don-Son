import apiClient, { type ApiEnvelope } from './client';

type KeyPayload = {
  current?: string
  Current?: string
  next?: string
  Next?: string
}

function readPair(data: KeyPayload | undefined) {
  return {
    current: String(data?.current ?? data?.Current ?? ''),
    next: String(data?.next ?? data?.Next ?? ''),
  }
}

export const posBackstageApi = {
  async getKey(): Promise<{ current: string; next: string }> {
    const response = await apiClient.get<ApiEnvelope<KeyPayload>>('/api/pos-backstage/key')
    return readPair(response.data.data)
  },

  async generateNext(): Promise<{ current: string; next: string }> {
    const response = await apiClient.post<ApiEnvelope<KeyPayload>>('/api/pos-backstage/generate-next')
    return readPair(response.data.data)
  },

  async activateNext(): Promise<{ current: string; next: string }> {
    const response = await apiClient.post<ApiEnvelope<KeyPayload>>('/api/pos-backstage/activate-next')
    return readPair(response.data.data)
  },
}
