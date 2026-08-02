import { getDb, isDbConfigured } from '../db/server';
import { resolveMediaUrl } from '../media/url';
import type { Product } from '../../data/products';
import { buildDraftRatingsViewModel } from './buildDraftRatingsViewModel';
import { resolveEvidenceDisplayValue } from './resolveEvidenceDisplay';
import { loadApprovedExplanationMapBySlug } from '../ai-explanations/publicExplanations';
import { loadApprovedTakeawayMapBySlug } from '../subscore-takeaways/publicTakeaways';
import { LEGACY_AGGREGATE_EVIDENCE_SLUGS } from '../ratings/evidenceIndex';
import type { DraftRatingsDbContext, DraftRatingsViewModel, DraftProofItem } from './types';

function mapProof(media: any[]): DraftProofItem[] {
  return (media ?? [])
    .filter((m) => !m.deletedAt)
    .map((m) => {
      const url = resolveMediaUrl(m);
      if (!url) return null;
      return {
        id: String(m.id),
        thumbUrl: url,
        fullUrl: url,
        caption: m.caption ?? m.altText ?? undefined,
        alt: m.altText ?? m.caption ?? 'Test proof',
        kind: (m.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
        posterUrl: m.posterUrl ? resolveMediaUrl({ url: m.posterUrl }) : undefined,
      };
    })
    .filter((item): item is DraftProofItem => item != null);
}

export async function loadDraftRatingsDbContext(slug: string, preview = false): Promise<DraftRatingsDbContext | null> {
  if (!isDbConfigured()) return null;

  try {
    const db = getDb();
    const { products } = await (db.query as any)({
      products: {
        $: { where: { slug } },
        scoreSnapshots: { testRun: {} },
        evidenceResults: {
          testRun: {},
          evidenceDefinition: { subscore: { category: {} } },
          attachments: { file: {} },
        },
        subscriptionPlans: {},
      },
      categories: { subscores: {} },
    });

    const product = (products as any[])?.find((p) => !p.deletedAt);
    if (!product) return null;

    const allEvidence: any[] = product.evidenceResults ?? [];
    const hasPublishedEvidence = allEvidence.some((r: any) => r.testRun?.isCurrentPublished);
    const evidenceRows = preview
      ? hasPublishedEvidence
        ? allEvidence.filter((r: any) => r.testRun?.isCurrentPublished)
        : allEvidence
      : allEvidence.filter((r: any) => r.testRun?.isCurrentPublished);

    const runs = (product.scoreSnapshots ?? [])
      .map((s: any) => s.testRun)
      .filter(Boolean);
    const testRun =
      preview && !hasPublishedEvidence
        ? runs.find((r: any) => r.status === 'in_progress') ??
          runs.find((r: any) => r.status === 'published') ??
          runs[0] ??
          null
        : runs.find((r: any) => r.isCurrentPublished) ??
          runs.find((r: any) => r.status === 'published') ??
          runs[0] ??
          null;

    const subscoresByCategory = new Map<string, Array<{ slug: string; name: string; displayOrder: number }>>();
    for (const cat of (product.categories ?? []) as any[]) {
      /* product link may not include categories — query global categories below */
    }

    const { categories: methodologyCats } = await (db.query as any)({
      categories: { subscores: {} },
    });
    for (const cat of methodologyCats ?? []) {
      subscoresByCategory.set(
        String(cat.slug),
        (cat.subscores ?? [])
          .filter((s: any) => s.active !== false)
          .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((s: any) => ({
            slug: String(s.slug),
            name: String(s.name),
            displayOrder: Number(s.displayOrder ?? 0),
          })),
      );
    }

    const methodologyVersion =
      (product.scoreSnapshots ?? []).find((s: any) => s.testRun?.isCurrentPublished)?.methodologyVersion ??
      testRun?.methodologyVersion;

    const approvedExplanations = await loadApprovedExplanationMapBySlug(slug);
    const approvedSubscoreTakeaways = await loadApprovedTakeawayMapBySlug(slug);

    const evidenceResults = evidenceRows
      .filter((r: any) => {
        const def = r.evidenceDefinition ?? {};
        if (def.active === false) return false;
        const slug = String(def.slug ?? '');
        if (LEGACY_AGGREGATE_EVIDENCE_SLUGS.has(slug)) return false;
        return true;
      })
      .map((r: any) => {
      const def = r.evidenceDefinition ?? {};
      const sub = def.subscore ?? {};
      const cat = sub.category ?? {};
      const proof = mapProof(r.attachments ?? []);
      const notApplicable = Boolean(r.notApplicable);
      const displayValue = resolveEvidenceDisplayValue(def, {
        publicResult: r.publicResult,
        rawValue: r.rawValue,
        notApplicable,
        isUnknown: r.isUnknown,
        unableToVerify: r.unableToVerify,
      });
      return {
        id: String(r.id),
        slug: String(def.slug ?? ''),
        name: String(def.name ?? def.slug ?? 'Evidence'),
        categorySlug: cat.slug ? String(cat.slug) : undefined,
        subscoreSlug: sub.slug ? String(sub.slug) : undefined,
        publicResult: displayValue || null,
        rawValue: r.rawValue ?? null,
        normalizedScore: notApplicable ? null : r.normalizedScore ?? null,
        required: Boolean(def.required),
        notApplicable,
        isUnknown: Boolean(r.isUnknown),
        unableToVerify: Boolean(r.unableToVerify),
        verificationStatus: r.verificationStatus ?? null,
        proofCount: proof.length,
        proof,
      };
    });

    return {
      methodologyVersion: methodologyVersion ? String(methodologyVersion) : undefined,
      paidAccountTested: Boolean(product.lastTestedAt),
      lastTestedAt: product.lastTestedAt ? Number(product.lastTestedAt) : undefined,
      testRun: testRun
        ? {
            id: String(testRun.id),
            name: testRun.name,
            status: testRun.status,
            startedAt: testRun.startedAt,
            publishedAt: testRun.publishedAt,
            isCurrentPublished: testRun.isCurrentPublished,
          }
        : null,
      evidenceResults,
      subscoresByCategory,
      approvedExplanations,
      approvedSubscoreTakeaways,
    };
  } catch (error) {
    console.error('[draft-ratings] DB context load failed', error);
    return null;
  }
}

/** Build view model from product + optional DB enrichment (falls back to product-only). */
export async function loadDraftRatingsViewModel(
  product: Product,
  opts?: { preview?: boolean },
): Promise<DraftRatingsViewModel> {
  const ctx =
    (await loadDraftRatingsDbContext(product.slug, opts?.preview)) ??
    ({
      evidenceResults: product.categories.flatMap((cat) =>
        cat.subscores.flatMap((sub) =>
          sub.contributors.map((c, i) => ({
            id: `${cat.key}-${i}`,
            slug: c.label.toLowerCase().replace(/\s+/g, '-'),
            name: c.label,
            categorySlug: cat.key,
            subscoreSlug: sub.name.toLowerCase().replace(/\s+/g, '-'),
            publicResult: c.value,
            normalizedScore: c.internalScore ?? null,
            required: false,
            notApplicable: false,
            isUnknown: false,
            unableToVerify: false,
            verificationStatus: null,
            proofCount: 0,
            proof: [],
          })),
        ),
      ),
      subscoresByCategory: new Map(
        product.categories.map((c) => [
          c.key,
          c.subscores.map((s) => ({
            slug: s.name.toLowerCase().replace(/\s+/g, '-'),
            name: s.name,
            displayOrder: 0,
          })),
        ]),
      ),
      testRun: null,
    } satisfies DraftRatingsDbContext);

  return buildDraftRatingsViewModel(product, ctx);
}

/** Testing credentials summary for Ratings & Specs and Draft Ratings tabs. */
export async function loadTestingOverview(
  product: Product,
  opts?: { preview?: boolean },
): Promise<DraftRatingsViewModel['overview']> {
  const model = await loadDraftRatingsViewModel(product, opts);
  return model.overview;
}
