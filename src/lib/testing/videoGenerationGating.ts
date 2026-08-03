/** Gate video quality / experience tests when no dedicated video generator exists. */

type RawStatus = { status?: string };

type SlugResultRow = { notApplicable?: boolean; rawValue?: unknown };

function readYnlStatus(resultBySlug: Map<string, SlugResultRow>, slug: string): string | null {
  const row = resultBySlug.get(slug);
  const raw = row?.rawValue as RawStatus | undefined;
  if (row?.notApplicable || raw?.status === 'na') return 'na';
  return raw?.status ?? null;
}

/** True when both text-to-video and image-to-video are answered No. */
export function isDedicatedVideoGenerationBlocked(
  resultBySlug: Map<string, SlugResultRow>,
): boolean {
  return (
    readYnlStatus(resultBySlug, 'text-to-video') === 'no' &&
    readYnlStatus(resultBySlug, 'image-to-video') === 'no'
  );
}

export const VIDEO_NOT_POSSIBLE_DETAIL = { notPossible: true } as const;
