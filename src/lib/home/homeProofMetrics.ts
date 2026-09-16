import { getTestCategories } from '../test-framework';
import { loadTestHubMetrics } from '../test-hub-stats';
import type { Product } from '../../data/products';

export type HomeProofFact = { value: string; label: string };

const METHODOLOGY_PROOF: HomeProofFact[] = [
  { value: '100%', label: 'Paid accounts' },
  { value: '30+ days', label: 'Hands-on per finalist' },
  { value: 'Weekly', label: 'Score updates' },
];

function formatExactCount(n: number): string {
  return n.toLocaleString('en-US');
}

/** Homepage proof rail — live counts where available, methodology copy otherwise. */
export async function buildHomeProofFacts(publishedProducts: Product[]): Promise<HomeProofFact[]> {
  const [hubMetrics] = await Promise.all([loadTestHubMetrics()]);
  const appsTested = hubMetrics[0]?.value
    ? hubMetrics[0].value.replace(/,/g, '')
    : String(publishedProducts.length);
  const appsNumeric = Number(appsTested);
  const appsLabel =
    Number.isFinite(appsNumeric) && appsNumeric === 1 ? 'App tested' : 'Apps tested';

  const categoryCount = getTestCategories().length;

  return [
    { value: formatExactCount(Number.isFinite(appsNumeric) ? appsNumeric : publishedProducts.length), label: appsLabel },
    { value: String(categoryCount), label: categoryCount === 1 ? 'Rating category' : 'Rating categories' },
    ...METHODOLOGY_PROOF,
  ];
}

export function buildHomeTesterFacts(publishedProducts: Product[]): HomeProofFact[] {
  const reviews = publishedProducts.filter((p) => p.overallScore != null);
  return [
    {
      value: formatExactCount(publishedProducts.length),
      label: publishedProducts.length === 1 ? 'App tested' : 'Apps tested',
    },
    {
      value: formatExactCount(reviews.length),
      label: reviews.length === 1 ? 'Full review' : 'Full reviews',
    },
    { value: '0', label: 'Free press accounts' },
  ];
}
