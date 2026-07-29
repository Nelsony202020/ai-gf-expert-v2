import { getTestCategories } from './test-framework';
import { getDb, isDbConfigured } from './db/server';

export type TestHubMetric = {
  icon: string;
  value: string;
  label: string;
};

type FrameworkCounts = {
  ratingCategories: number;
  subscores: number;
  evidencePoints: number;
};

function countFromFramework(): FrameworkCounts {
  const categories = getTestCategories();
  let subscores = 0;
  let evidencePoints = 0;

  for (const category of categories) {
    subscores += category.subscores.length;
    for (const sub of category.subscores) {
      evidencePoints += sub.contributors.length;
    }
  }

  return {
    ratingCategories: categories.length,
    subscores,
    evidencePoints,
  };
}

async function countPublishedProducts(): Promise<number> {
  if (!isDbConfigured()) {
    const { products } = await import('../data/products');
    return products.length;
  }

  try {
    const db = getDb();
    const { products } = await (db.query as any)({
      products: {
        $: { where: { status: 'published' } },
      },
    });

    return (products as any[]).filter((product) => !product.deletedAt).length;
  } catch (error) {
    console.error('[test-hub] product count failed — using file products', error);
    const { products } = await import('../data/products');
    return products.length;
  }
}

async function countFromActiveMethodology(): Promise<FrameworkCounts | null> {
  if (!isDbConfigured()) return null;

  try {
    const db = getDb();
    const { methodologyVersions } = await (db.query as any)({
      methodologyVersions: {
        $: { where: { status: 'active' } },
        categories: {
          subscores: {
            evidenceDefinitions: {},
          },
        },
      },
    });

    const active = (methodologyVersions as any[])[0];
    if (!active) return null;

    const categories = (active.categories ?? []).filter((category: any) => category.active !== false);
    let subscores = 0;
    let evidencePoints = 0;

    for (const category of categories) {
      const subs = (category.subscores ?? []).filter((sub: any) => sub.active !== false);
      subscores += subs.length;
      for (const sub of subs) {
        evidencePoints += (sub.evidenceDefinitions ?? []).filter((def: any) => def.active !== false).length;
      }
    }

    return {
      ratingCategories: categories.length,
      subscores,
      evidencePoints,
    };
  } catch (error) {
    console.error('[test-hub] methodology counts failed — using framework file', error);
    return null;
  }
}

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

/** Live trust metrics for the /test/ hub hero — DB + methodology tree when available. */
export async function loadTestHubMetrics(): Promise<TestHubMetric[]> {
  const framework = countFromFramework();
  const methodology = await countFromActiveMethodology();
  const counts = methodology ?? framework;
  const productsReviewed = await countPublishedProducts();

  return [
    {
      icon: 'apps',
      value: formatCount(productsReviewed),
      label: productsReviewed === 1 ? 'product reviewed' : 'products reviewed',
    },
    {
      icon: 'category',
      value: formatCount(counts.ratingCategories),
      label: counts.ratingCategories === 1 ? 'rating category' : 'rating categories',
    },
    {
      icon: 'analytics',
      value: formatCount(counts.subscores),
      label: counts.subscores === 1 ? 'subscore' : 'subscores',
    },
    {
      icon: 'fact_check',
      value: formatCount(counts.evidencePoints),
      label: counts.evidencePoints === 1 ? 'evidence test' : 'evidence tests',
    },
  ];
}
