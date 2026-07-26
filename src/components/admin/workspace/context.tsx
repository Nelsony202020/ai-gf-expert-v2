// Product workspace state: one provider loads the product + all related
// records once, exposes per-entity refresh, and owns product-field saving.
// Tabs consume this instead of fetching or computing progress themselves.

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import { computeProductCompletion, type ProductCompletion } from './completion';

export interface ScoreHistoryRun {
  runId: string;
  runName: string;
  status: string;
  isCurrentPublished: boolean;
  methodologyVersion: string | null;
  publishedAt: number | null;
  overall: number | null;
  categories: { slug: string; value: number; weight?: number }[];
}

export interface WorkspaceRelated {
  authors: EntityRow[];
  /** Full media library (for pickers). */
  mediaAll: EntityRow[];
  /** Media scoped to this product. */
  media: EntityRow[];
  testRuns: EntityRow[];
  plans: EntityRow[];
  packages: EntityRow[];
  paymentProfile: EntityRow | null;
  characters: EntityRow[];
  affiliateLinks: EntityRow[];
  review: EntityRow | null;
  categories: EntityRow[];
  scoreHistory: ScoreHistoryRun[];
  pricingSnapshots: EntityRow[];
  featureCosts: EntityRow[];
  pricingPromotions: EntityRow[];
}

const EMPTY_RELATED: WorkspaceRelated = {
  authors: [],
  mediaAll: [],
  media: [],
  testRuns: [],
  plans: [],
  packages: [],
  paymentProfile: null,
  characters: [],
  affiliateLinks: [],
  review: null,
  categories: [],
  scoreHistory: [],
  pricingSnapshots: [],
  featureCosts: [],
  pricingPromotions: [],
};

export interface ProductWorkspaceState {
  productId: string;
  loading: boolean;
  fields: Record<string, any>;
  links: Record<string, string | null>;
  original: EntityRow | null;
  set: (name: string, value: unknown) => void;
  setMany: (updates: Record<string, unknown>) => void;
  setLinks: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  fieldErrors: Record<string, string>;
  isDirty: boolean;
  saving: boolean;
  saveError: string | null;
  lastSavedAt: number | null;
  /** Saves ONLY the product record (each tab saves its own related entities). */
  save: () => Promise<boolean>;
  reloadProduct: () => Promise<void>;
  related: WorkspaceRelated;
  relatedLoading: boolean;
  refreshRelated: () => Promise<void>;
  completion: ProductCompletion;
  slugAuto: boolean;
  markSlugManual: () => void;
  confirmSlugChange: (nextSlug: string, previousSlug: string) => boolean;
}

const WorkspaceContext = createContext<ProductWorkspaceState | null>(null);

export function useWorkspace(): ProductWorkspaceState {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace outside ProductWorkspaceProvider');
  return ctx;
}

export const WorkspaceProvider = WorkspaceContext.Provider;

/** Product fields the workspace is allowed to write. */
const EDITABLE_FIELDS = [
  'name', 'slug', 'status', 'tagline', 'websiteUrl', 'youtubeReviewUrl',
  'oneLineVerdict', 'ourTake', 'directoryDescription', 'mainStrength', 'mainLimitation',
  'pros', 'cons', 'bestForLabel', 'verified', 'editorsPick', 'homepageFeatured',
  'displayOrder', 'revisionNotes', 'publishedInDirectory',
  'recommendedFor', 'notRecommendedFor', 'expertOpinion', 'categoryVerdicts',
  'minMonthlyPrice', 'typicalMonthlyCost', 'priceCurrency', 'scheduledAt',
  'seoTitle', 'seoDescription', 'h1Override', 'canonicalUrl', 'noindex', 'nofollow',
  'ogTitle', 'ogDescription', 'ogImageUrl', 'socialImageUrl', 'breadcrumbLabel', 'searchExcerpt',
];

const CAPABILITY_PREFIX = 'cap';

function extractLinks(row: EntityRow): Record<string, string | null> {
  return {
    author: row.author?.id ?? null,
    factChecker: row.factChecker?.id ?? null,
    logo: row.logo?.id ?? null,
    featuredImage: row.featuredImage?.id ?? null,
  };
}

function snapshot(fields: Record<string, unknown>, links: Record<string, string | null>): string {
  return JSON.stringify({ fields, links });
}

export function useProductWorkspaceState(productId: string): ProductWorkspaceState {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Record<string, any>>({});
  const [links, setLinks] = useState<Record<string, string | null>>({});
  const [original, setOriginal] = useState<EntityRow | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [related, setRelated] = useState<WorkspaceRelated>(EMPTY_RELATED);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [slugAuto, setSlugAuto] = useState(false);
  const savedSnapshot = useRef('');
  const slugAccepted = useRef('');

  async function reloadProduct() {
    const r = await dataApi.get('products', productId);
    setOriginal(r.row);
    setFields({ ...r.row });
    const nextLinks = extractLinks(r.row);
    setLinks(nextLinks);
    savedSnapshot.current = snapshot({ ...r.row }, nextLinks);
    slugAccepted.current = String(r.row.slug ?? '');
  }

  async function refreshRelated() {
    setRelatedLoading(true);
    try {
      const [authors, media, testRuns, plans, packages, paymentProfiles, characters, affiliateLinks, reviews, categories, history, snapshots, featureCosts, promotions] =
        await Promise.all([
          dataApi.list('authors'),
          dataApi.list('media'),
          dataApi.list('testRuns'),
          dataApi.list('subscriptionPlans'),
          dataApi.list('creditPackages'),
          dataApi.list('paymentProfiles'),
          dataApi.list('characters'),
          dataApi.list('affiliateLinks'),
          dataApi.list('reviews'),
          dataApi.list('categories'),
          api
            .get<{ history: ScoreHistoryRun[] }>(`/api/admin/products/${productId}/score-history`)
            .catch(() => ({ history: [] as ScoreHistoryRun[] })),
          dataApi.list('pricingSnapshots').catch(() => ({ rows: [] as EntityRow[] })),
          dataApi.list('featureCosts').catch(() => ({ rows: [] as EntityRow[] })),
          dataApi.list('pricingPromotions').catch(() => ({ rows: [] as EntityRow[] })),
        ]);
      const byProduct = (rows: EntityRow[]) => rows.filter((r) => r.product?.id === productId);
      setRelated({
        authors: authors.rows,
        mediaAll: media.rows,
        media: byProduct(media.rows),
        testRuns: byProduct(testRuns.rows),
        plans: byProduct(plans.rows),
        packages: byProduct(packages.rows),
        paymentProfile: byProduct(paymentProfiles.rows)[0] ?? null,
        characters: byProduct(characters.rows),
        affiliateLinks: byProduct(affiliateLinks.rows),
        review: byProduct(reviews.rows)[0] ?? null,
        categories: categories.rows
          .filter((c) => c.active)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
        scoreHistory: history.history,
        pricingSnapshots: byProduct(snapshots.rows).sort(
          (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
        ),
        featureCosts: byProduct(featureCosts.rows),
        pricingPromotions: byProduct(promotions.rows),
      });
    } finally {
      setRelatedLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSaveError(null);
    reloadProduct()
      .catch((e) => {
        if (!cancelled) setSaveError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    refreshRelated().catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const isDirty = useMemo(() => {
    if (loading || !original) return false;
    return snapshot(fields, links) !== savedSnapshot.current;
  }, [fields, links, loading, original]);

  // Warn before closing/leaving the browser tab with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  function set(name: string, value: unknown) {
    if (name === 'slug') {
      setSlugAuto(false);
      setFields((prev) => ({ ...prev, slug: value }));
      return;
    }
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function setMany(updates: Record<string, unknown>) {
    setFields((prev) => ({ ...prev, ...updates }));
  }

  function confirmSlugChange(nextSlug: string, previousSlug: string): boolean {
    const next = nextSlug.trim();
    const prev = previousSlug.trim();
    if (!next || next === prev) return true;
    const ok = confirm(
      `You changed the slug from "/reviews/${prev}" to "/reviews/${next}".\n\n` +
        'Saving this will offer a 301 redirect from the old URL to the new one.\n\n' +
        'Are you sure you want to change it?',
    );
    if (ok) slugAccepted.current = next;
    return ok;
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!String(fields.name ?? '').trim()) errors.name = 'Product name is required.';
    const slug = String(fields.slug ?? '').trim();
    if (!slug) errors.slug = 'Slug is required.';
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.slug = 'Use lowercase letters, numbers, and hyphens only.';
    }
    return errors;
  }

  function cleanFields(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(fields)) {
      const editable = EDITABLE_FIELDS.includes(key) || key.startsWith(CAPABILITY_PREFIX);
      if (!editable) continue;
      if (typeof v === 'boolean') out[key] = v;
      else if (v !== undefined && v !== null && v !== '') out[key] = v;
    }
    return out;
  }

  async function save(): Promise<boolean> {
    setSaveError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError('Fix the highlighted fields before saving.');
      return false;
    }
    setFieldErrors({});

    if (fields.noindex || fields.nofollow) {
      const flags: string[] = [];
      if (fields.noindex) flags.push('noindex (hide from search results)');
      if (fields.nofollow) flags.push('nofollow (do not follow links on this page)');
      const ok = confirm(
        `Warning: you have enabled ${flags.join(' and ')}.\n\nThis limits how search engines treat this product page. Save anyway?`,
      );
      if (!ok) return false;
    }

    const payload = cleanFields();
    setSaving(true);
    try {
      // Slug changes go through the dedicated endpoint so a 301 can be created.
      if (original && payload.slug !== original.slug) {
        const wasPublished = original.status === 'published';
        const createRedirect = wasPublished
          ? confirm(
              `The published URL is changing from /reviews/${original.slug} to /reviews/${payload.slug}.\n\n` +
                'Create a 301 redirect from the previous URL? (Recommended)',
            )
          : false;
        await api.post(`/api/admin/products/${productId}/slug`, {
          slug: payload.slug,
          createRedirect,
        });
        delete payload.slug;
      }

      await dataApi.update('products', productId, payload, links);
      await reloadProduct();
      setLastSavedAt(Date.now());
      return true;
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setSaving(false);
    }
  }

  const completion = useMemo(
    () =>
      computeProductCompletion({
        fields,
        links,
        testRuns: related.testRuns,
        plans: related.plans,
        paymentProfile: related.paymentProfile,
        characters: related.characters,
        media: related.media,
        affiliateLinks: related.affiliateLinks,
        review: related.review,
      }),
    [fields, links, related],
  );

  return {
    productId,
    loading,
    fields,
    links,
    original,
    set,
    setMany,
    setLinks,
    fieldErrors,
    isDirty,
    saving,
    saveError,
    lastSavedAt,
    save,
    reloadProduct,
    related,
    relatedLoading,
    refreshRelated,
    completion,
    slugAuto,
    markSlugManual: () => setSlugAuto(false),
    confirmSlugChange,
  };
}
