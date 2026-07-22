export const APPS_PER_PAGE = 12;

export function appsPageUrl(page: number, basePath = '/apps'): string {
  if (page <= 1) return basePath;
  return `${basePath}?page=${page}`;
}

export function parseAppsPage(search: string): number {
  const value = Number(new URLSearchParams(search).get('page') ?? '1');
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

export function totalPages(count: number, perPage = APPS_PER_PAGE): number {
  return Math.max(1, Math.ceil(count / perPage));
}
