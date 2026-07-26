// Client-side API helper for the admin panel. Attaches the InstantDB refresh
// token so the server can verify identity and enforce role permissions.

let refreshToken: string | null = null;

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (refreshToken) headers.set('Authorization', `Bearer ${refreshToken}`);
  if (init.body && typeof init.body === 'string') headers.set('Content-Type', 'application/json');
  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as any).error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
};

// ---- Typed convenience wrappers for the generic CRUD API -------------------

export interface EntityRow {
  id: string;
  [key: string]: any;
}

export const dataApi = {
  list: (entity: string) => api.get<{ rows: EntityRow[] }>(`/api/admin/data/${entity}`),
  get: (entity: string, id: string) => api.get<{ row: EntityRow }>(`/api/admin/data/${entity}/${id}`),
  create: (entity: string, fields: Record<string, unknown>, links?: Record<string, string | null>) =>
    api.post<{ id: string }>(`/api/admin/data/${entity}`, { fields, links }),
  update: (entity: string, id: string, fields: Record<string, unknown>, links?: Record<string, string | null>) =>
    api.patch<{ ok: true }>(`/api/admin/data/${entity}/${id}`, { fields, links }),
  remove: (entity: string, id: string, permanent = false) =>
    api.del<{ ok: true }>(`/api/admin/data/${entity}/${id}${permanent ? '?permanent=1' : ''}`),
  restore: (entity: string, id: string) =>
    api.post<{ ok: true }>(`/api/admin/data/${entity}/${id}/restore`),
};
