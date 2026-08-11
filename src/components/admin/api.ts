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

/** Normalize API paths to trailing-slash form (defensive; trailingSlash is 'ignore'). */
function withTrailingSlash(path: string): string {
  const q = path.indexOf('?');
  if (q === -1) return path.endsWith('/') ? path : `${path}/`;
  const base = path.slice(0, q);
  const query = path.slice(q);
  return `${base.endsWith('/') ? base : `${base}/`}${query}`;
}

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (refreshToken) headers.set('Authorization', `Bearer ${refreshToken}`);
  if (init.body && typeof init.body === 'string') headers.set('Content-Type', 'application/json');
  let res: Response;
  try {
    res = await fetch(withTrailingSlash(path), { ...init, headers });
  } catch {
    throw new ApiError(0, 'Network error — check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fromBody = typeof (data as { error?: unknown }).error === 'string'
      ? (data as { error: string }).error.trim()
      : '';
    const fallback =
      res.status === 504 || res.status === 502
        ? 'Server timed out — try again. Long AI jobs can take up to a minute.'
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, fromBody || fallback);
  }
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
  /** Download a binary export (CSV, PDF, etc.) and trigger a browser save. */
  download: async (path: string): Promise<void> => {
    const headers = new Headers();
    if (refreshToken) headers.set('Authorization', `Bearer ${refreshToken}`);
    let res: Response;
    try {
      res = await fetch(withTrailingSlash(path), { headers });
    } catch {
      throw new ApiError(0, 'Network error — check your connection and try again.');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, (data as any).error ?? `Download failed (${res.status})`);
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') ?? '';
    const match = /filename="([^"]+)"/i.exec(cd);
    const filename = match?.[1] ?? 'download';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
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
