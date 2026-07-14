import { apiClient, assertApiSuccess, type ApiEnvelope } from './api-client';

export interface LabelPrintingComment {
  id: string;
  commentText: string;
  sortOrder: number;
  isActive: boolean;
}

export interface LabelPrintingCommentCreateDto {
  commentText: string;
  sortOrder: number;
}

export interface LabelPrintingCommentUpdateDto {
  commentText: string;
  sortOrder: number;
  isActive: boolean;
}

function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

function normalizeComment(raw: Record<string, unknown>): LabelPrintingComment {
  return {
    id: String(pick<string>(raw, 'id', 'Id') ?? ''),
    commentText: String(pick<string>(raw, 'commentText', 'CommentText') ?? ''),
    sortOrder: Number(pick(raw, 'sortOrder', 'SortOrder') ?? 0),
    isActive: Boolean(pick(raw, 'isActive', 'IsActive') ?? true),
  };
}

function parseListEnvelope(envelope: ApiEnvelope<Record<string, unknown>>): LabelPrintingComment[] {
  const body = envelope.data;
  if (!body || typeof body !== 'object') return [];
  const rawList = pick<unknown[]>(body, 'comments', 'Comments') ?? [];
  if (!Array.isArray(rawList)) return [];
  return rawList.map((row) => normalizeComment(row as Record<string, unknown>));
}

export function getLabelPrintingCommentsErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
    const d = ax.response?.data;
    return d?.error?.message ?? d?.message ?? (err instanceof Error ? err.message : 'Request failed');
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export const labelPrintingCommentsApi = {
  async getAll(activeOnly = false): Promise<LabelPrintingComment[]> {
    const params = new URLSearchParams();
    params.append('activeOnly', String(activeOnly));
    const response = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(
      `/api/label-printing-comments?${params}`
    );
    assertApiSuccess(response.data);
    return parseListEnvelope(response.data);
  },

  async create(data: LabelPrintingCommentCreateDto): Promise<LabelPrintingComment> {
    const response = await apiClient.post<ApiEnvelope<Record<string, unknown>>>(
      '/api/label-printing-comments',
      data
    );
    assertApiSuccess(response.data);
    return normalizeComment(response.data.data as Record<string, unknown>);
  },

  async update(id: string, data: LabelPrintingCommentUpdateDto): Promise<LabelPrintingComment> {
    const response = await apiClient.put<ApiEnvelope<Record<string, unknown>>>(
      `/api/label-printing-comments/${id}`,
      data
    );
    assertApiSuccess(response.data);
    return normalizeComment(response.data.data as Record<string, unknown>);
  },
};
