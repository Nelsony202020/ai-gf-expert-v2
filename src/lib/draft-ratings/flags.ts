import { env } from '../env';

/** When true, show the experimental Draft Ratings & Specs review tab. */
export function isDraftRatingsSpecsEnabled(): boolean {
  const flag = env('ENABLE_DRAFT_RATINGS_SPECS') ?? '';
  return flag === '1' || flag === 'true';
}
