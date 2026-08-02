// SEO tab: search appearance, URL & indexing, and social sharing with live
// previews — plus URL preview, missing-field warnings, structured-data status,
// canonical warnings, and redirect status. Site-wide SEO stays in the global
// admin pages.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataApi, type EntityRow } from '../../api';
import { AiFieldAssist } from '../../ai-verdict/AiFieldAssist';
import { useCan } from '../../context';
import { CharCounter, FieldHint, PreviewViewToggle, ToggleWithHint } from '../../FieldHint';
import { Badge, Field, Icon, TextArea, TextInput } from '../../ui';
import { resolveMediaUrl } from '../../../../lib/media/url';
import { resolveProductSeoMeta } from '../../../../lib/seo/productMeta';
import { SEO_TEMPLATE_TAGS } from '../../../../lib/seo/templateTags';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';
import { useVerdictTestingSummary } from '../verdict/useVerdictTestingSummary';

const SITE_HOST = 'aigirlfriendexpert.com';

export function SeoTab() {
  const ws = useWorkspace();
  const can = useCan();
  const canEdit = can('content.edit');
  const { fields, set, links, related, completion, productId } = ws;
  const testing = useVerdictTestingSummary(related.testRuns);
  const testRunId = testing.currentRun?.id ?? testing.publishedRun?.id;

  const templateContext = useMemo(
    () => ({ productName: String(fields.name ?? '').trim() }),
    [fields.name],
  );

  const featuredImageUrl = useMemo(() => {
    if (!links.featuredImage) return null;
    return resolveMediaUrl(related.mediaAll.find((m) => m.id === links.featuredImage)) || null;
  }, [links.featuredImage, related.mediaAll]);

  const resolvedMeta = useMemo(
    () =>
      resolveProductSeoMeta(fields, {
        ...templateContext,
        featuredImageUrl,
      }),
    [fields, templateContext, featuredImageUrl],
  );

  const publicPath = `/reviews/${fields.slug ?? ''}`;
  const seoTab = completion.tabById.seo;
  const missing = [...seoTab.missingRequired, ...seoTab.missingRecommended];

  // Redirect status: active redirects that point at (or away from) this URL.
  const [redirects, setRedirects] = useState<EntityRow[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    dataApi
      .list('redirects')
      .then((r) => {
        if (!cancelled) setRedirects(r.rows.filter((row) => row.active));
      })
      .catch(() => {
        if (!cancelled) setRedirects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const incoming = useMemo(
    () => (redirects ?? []).filter((r) => String(r.destinationPath) === publicPath),
    [redirects, publicPath],
  );
  const outgoing = useMemo(
    () => (redirects ?? []).filter((r) => String(r.sourcePath) === publicPath),
    [redirects, publicPath],
  );

  // Canonical warning: only warn when an override points somewhere else.
  const canonical = String(fields.canonicalUrl ?? '').trim();
  const defaultCanonical = `https://${SITE_HOST}${publicPath}`;
  const canonicalWarning =
    canonical !== '' && canonical !== defaultCanonical && canonical !== publicPath;

  // Structured-data readiness (generated server-side from these fields).
  const structuredDataReady =
    Boolean(String(fields.name ?? '').trim()) &&
    Boolean(String(fields.oneLineVerdict ?? '').trim()) &&
    related.testRuns.some((r) => r.isCurrentPublished);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-4">
        {/* Missing-field warnings from the shared completion service */}
        {missing.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
              {seoTab.missingRequired.length > 0
                ? `${seoTab.missingRequired.length} required SEO field${seoTab.missingRequired.length === 1 ? '' : 's'} missing`
                : 'Recommended SEO fields missing'}
            </p>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-400">
              {missing.map((m) => m.label).join(' · ')}
            </p>
          </div>
        )}

        {/* 1. Search appearance */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Search appearance</h3>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <SeoTitleField
                  value={fields.seoTitle ?? ''}
                  resolved={resolvedMeta.seoTitle}
                  productName={templateContext.productName}
                  onChange={(v) => set('seoTitle', v)}
                  disabled={!canEdit}
                />
                <LimitedField
                  label="H1 override"
                  hint="Changes the main heading on the review page only. Leave blank to use the product name."
                  max={60}
                  value={fields.h1Override ?? ''}
                  onChange={(v) => set('h1Override', v)}
                  placeholder="Optional page heading"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <LimitedField
                  label="Meta description"
                  hint="The gray snippet under your title in search results. Summarize the review in plain language."
                  max={160}
                  multiline
                  rows={3}
                  value={fields.seoDescription ?? ''}
                  onChange={(v) => set('seoDescription', v)}
                  placeholder="Brief summary shown in Google and other search engines."
                  disabled={!canEdit}
                />
                {testRunId ? (
                  <div className="mt-1.5">
                    <AiFieldAssist
                      productId={productId}
                      testRunId={testRunId}
                      targetField="meta description — max 155 characters for Google search, plain language overall review summary"
                      currentText={String(fields.seoDescription ?? '')}
                      hasText={Boolean(String(fields.seoDescription ?? '').trim())}
                      onText={(text) => set('seoDescription', text.slice(0, 160))}
                    />
                  </div>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Add a test run on the Testing tab to use Write with AI for the meta description.
                  </p>
                )}
              </div>
              <LimitedField
                label="Search excerpt"
                hint="Optional shorter blurb some internal search uses instead of the meta description."
                max={160}
                multiline
                rows={2}
                value={fields.searchExcerpt ?? ''}
                onChange={(v) => set('searchExcerpt', v)}
                placeholder="Optional alternate snippet"
                disabled={!canEdit}
              />
            </div>
            <SearchPreviewPanel resolved={resolvedMeta} slug={String(fields.slug ?? 'product-slug')} />
          </div>
        </section>

        {/* 2. URL and indexing */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">URL and indexing</h3>

          <div className="mt-3 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Slug"
                help="Changing the slug of a published product prompts for a 301 redirect on save."
              >
                <TextInput
                  value={fields.slug ?? ''}
                  onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  disabled={!canEdit}
                />
              </Field>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">URL preview</p>
                <p className="truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                  https://{SITE_HOST}
                  <span className="text-slate-900 dark:text-slate-100">{publicPath}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={
                  <span className="inline-flex items-center">
                    Canonical URL override
                    <FieldHint text="Tell Google the official URL for this page if it differs from the default /reviews/slug address — useful after duplicates or campaign links." />
                  </span>
                }
              >
                <TextInput
                  value={fields.canonicalUrl ?? ''}
                  onChange={(e) => set('canonicalUrl', e.target.value)}
                  placeholder={defaultCanonical}
                  disabled={!canEdit}
                />
              </Field>
              <Field
                label={
                  <span className="inline-flex items-center">
                    Breadcrumb label
                    <FieldHint text="Short label shown in the breadcrumb trail (e.g. Home › Reviews › This label). Leave blank to use the product name." />
                  </span>
                }
              >
                <TextInput
                  value={fields.breadcrumbLabel ?? ''}
                  onChange={(e) => set('breadcrumbLabel', e.target.value)}
                  placeholder="e.g. Candy AI"
                  disabled={!canEdit}
                />
              </Field>
            </div>

            {canonicalWarning && (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                <Icon name="warning" className="mt-0.5 shrink-0 !text-[14px]" />
                <p>
                  The canonical URL points somewhere other than this page ({canonical}). Search
                  engines will credit that URL instead of this review. Only keep this if intentional.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Indexing controls</p>
              <div className="mt-3 flex flex-wrap gap-8">
                <ToggleWithHint
                  checked={fields.noindex}
                  onChange={(v) => canEdit && set('noindex', v)}
                  label="noindex"
                  hint="Hides this page from search results entirely. Saving with either enabled asks for confirmation."
                />
                <ToggleWithHint
                  checked={fields.nofollow}
                  onChange={(v) => canEdit && set('nofollow', v)}
                  label="nofollow"
                  hint="Tells search engines not to follow links on this page."
                />
              </div>
            </div>

            {/* Redirect status */}
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Redirect status</p>
                <Link to="/seo/redirects" className="text-xs text-pink-600 hover:underline dark:text-pink-400">
                  Manage all redirects
                </Link>
              </div>
              {redirects === null ? (
                <p className="mt-1 text-xs text-slate-400">Checking redirects…</p>
              ) : outgoing.length > 0 ? (
                <div className="mt-1 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                  <Icon name="error" className="mt-0.5 !text-[14px]" />
                  <p>
                    An active redirect sends this URL to {String(outgoing[0].destinationPath)} — visitors
                    cannot reach this review at its own address.
                  </p>
                </div>
              ) : incoming.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                  {incoming.map((r) => (
                    <li key={r.id} className="font-mono">
                      {String(r.sourcePath)} → {publicPath}{' '}
                      <Badge tone="green">{String(r.redirectType ?? 301)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  No redirects point to or from this URL.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 3. Social sharing */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Social sharing</h3>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <LimitedField
                label="Open Graph title"
                hint="Title when this page is shared on social apps. Leave blank to use the SEO title."
                max={95}
                value={fields.ogTitle ?? ''}
                onChange={(v) => set('ogTitle', v)}
                placeholder={resolvedMeta.seoTitle || 'Uses SEO title when empty'}
                disabled={!canEdit}
              />
              {!String(fields.ogTitle ?? '').trim() && resolvedMeta.seoTitle && (
                <p className="text-[11px] text-slate-400">
                  Using SEO title: <span className="text-slate-600 dark:text-slate-300">{resolvedMeta.seoTitle}</span>
                </p>
              )}
              <Field
                label={
                  <span className="inline-flex items-center">
                    Open Graph image URL
                    <FieldHint text="Image in social link previews. Leave blank to use the product social/featured image." />
                  </span>
                }
              >
                <TextInput
                  value={fields.ogImageUrl ?? ''}
                  onChange={(e) => set('ogImageUrl', e.target.value)}
                  placeholder={
                    resolvedMeta.ogImageUrl && !String(fields.ogImageUrl ?? '').trim()
                      ? String(resolvedMeta.ogImageUrl)
                      : 'Uses featured image when empty'
                  }
                  disabled={!canEdit}
                />
              </Field>
              {!String(fields.ogImageUrl ?? '').trim() && resolvedMeta.ogImageUrl && (
                <p className="text-[11px] text-slate-400">
                  Using featured image: <span className="break-all text-slate-600 dark:text-slate-300">{resolvedMeta.ogImageUrl}</span>
                </p>
              )}
              <LimitedField
                label="Open Graph description"
                hint="Description under the image in social previews. Leave blank to use the meta description."
                max={200}
                multiline
                rows={3}
                value={fields.ogDescription ?? ''}
                onChange={(v) => set('ogDescription', v)}
                placeholder={
                  resolvedMeta.metaDescription
                    ? resolvedMeta.metaDescription.slice(0, 120) + (resolvedMeta.metaDescription.length > 120 ? '…' : '')
                    : 'Uses meta description when empty'
                }
                disabled={!canEdit}
              />
              {!String(fields.ogDescription ?? '').trim() && resolvedMeta.metaDescription && (
                <p className="text-[11px] text-slate-400">
                  Using meta description:{' '}
                  <span className="text-slate-600 dark:text-slate-300">{resolvedMeta.metaDescription.slice(0, 100)}{resolvedMeta.metaDescription.length > 100 ? '…' : ''}</span>
                </p>
              )}
            </div>
            <SocialPreviewPanel resolved={resolvedMeta} />
          </div>
        </section>

        {/* Structured-data status */}
        <div
          className={`flex gap-3 rounded-lg border p-3 text-sm ${
            structuredDataReady
              ? 'border-green-100 bg-green-50/80 text-green-900 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-200'
              : 'border-blue-100 bg-blue-50/80 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200'
          }`}
        >
          <Icon
            name={structuredDataReady ? 'check_circle' : 'info'}
            className={`mt-0.5 shrink-0 !text-[18px] ${structuredDataReady ? 'text-green-600' : 'text-blue-600 dark:text-blue-400'}`}
          />
          <p>
            Structured data (JSON-LD) is generated automatically from product fields — no manual JSON needed.{' '}
            {structuredDataReady
              ? 'This product has everything needed for a full Review rich result (name, verdict, published score).'
              : 'For a full Review rich result, add the product name, one-line verdict, and a published test run.'}
          </p>
        </div>
      </div>

      <CompletionSidebar />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared field + preview panels (adapted from the legacy SEO tab)
// ---------------------------------------------------------------------------

function SeoTitleField({
  value,
  resolved,
  productName,
  onChange,
  disabled,
}: {
  value: string;
  resolved: string;
  productName: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const max = 60;
  const clamp = (raw: string) => raw.slice(0, max);

  function insertTag(tag: string) {
    onChange(clamp(`${value}${value && !value.endsWith(' ') ? ' ' : ''}${tag}`));
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center text-xs font-medium text-slate-600 dark:text-slate-400">
          SEO title
          <FieldHint text="The blue clickable title in Google. You can use dynamic tags like %currentyear% — they update automatically." />
        </span>
        <CharCounter value={value} max={max} />
      </div>
      <TextInput
        value={value}
        placeholder={`${productName || 'Product'} Review (%currentyear%)`}
        disabled={disabled}
        onChange={(e) => onChange(clamp(e.target.value))}
      />
      <div className="mt-1.5 flex flex-wrap gap-1">
        {SEO_TEMPLATE_TAGS.map(({ tag, label }) => (
          <button
            key={tag}
            type="button"
            disabled={disabled}
            title={label}
            onClick={() => insertTag(tag)}
            className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 hover:border-pink-300 hover:text-pink-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {tag}
          </button>
        ))}
      </div>
      {value.trim() && (
        <p className="mt-1 text-[11px] text-slate-400">
          Preview: <span className="text-slate-600 dark:text-slate-300">{resolved}</span>
        </p>
      )}
    </div>
  );
}

function LimitedField({
  label,
  hint,
  max,
  value,
  onChange,
  multiline,
  rows = 3,
  placeholder,
  disabled,
}: {
  label: string;
  hint?: string;
  max: number;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  const clamp = (raw: string) => raw.slice(0, max);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center text-xs font-medium text-slate-600 dark:text-slate-400">
          {label}
          {hint ? <FieldHint text={hint} /> : null}
        </span>
        <CharCounter value={value} max={max} />
      </div>
      {multiline ? (
        <TextArea
          rows={rows}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(clamp(e.target.value))}
        />
      ) : (
        <TextInput
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(clamp(e.target.value))}
        />
      )}
    </div>
  );
}

function SearchPreviewPanel({
  resolved,
  slug,
}: {
  resolved: { seoTitle: string; metaDescription: string };
  slug: string;
}) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const title = resolved.seoTitle || 'Example Product Title — Review & Rating';
  const description =
    resolved.metaDescription ||
    'Add a meta description to control how this product appears in Google search results.';

  const mobile = view === 'mobile';
  const displayTitle = mobile && title.length > 48 ? `${title.slice(0, 48)}…` : title;
  const displayDesc =
    mobile && description.length > 120 ? `${description.slice(0, 120)}…` : description;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search preview</p>
        <PreviewViewToggle view={view} onChange={setView} />
      </div>
      <div
        className={`rounded-md border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 ${
          mobile ? 'max-w-[320px]' : ''
        }`}
      >
        <p className="truncate text-xs text-slate-500">
          {SITE_HOST} › reviews › {slug}
        </p>
        <p className="mt-1 text-lg leading-snug text-[#1a0dab] dark:text-blue-400">{displayTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{displayDesc}</p>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Preview uses available information and may not reflect actual search results.
      </p>
    </div>
  );
}

function SocialPreviewPanel({
  resolved,
}: {
  resolved: { ogTitle: string; ogDescription: string; ogImageUrl: string | null };
}) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const mobile = view === 'mobile';

  const title = resolved.ogTitle || 'Product title';
  const description = resolved.ogDescription || 'Add a meta description to control social share snippets.';
  const imageUrl = resolved.ogImageUrl;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Social preview</p>
        <PreviewViewToggle view={view} onChange={setView} />
      </div>
      <div
        className={`overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${
          mobile ? 'max-w-[280px]' : ''
        }`}
      >
        {imageUrl ? (
          <div className={mobile ? 'aspect-video w-full' : 'aspect-[1.91/1] w-full bg-slate-100'}>
            <img src={String(imageUrl)} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${
              mobile ? 'aspect-video' : 'aspect-[1.91/1]'
            }`}
          >
            <Icon name="image" className="!text-[32px] text-slate-300" />
          </div>
        )}
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{SITE_HOST}</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {mobile && title.length > 55 ? `${title.slice(0, 55)}…` : title}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
            {mobile && description.length > 80 ? `${description.slice(0, 80)}…` : description}
          </p>
        </div>
      </div>
    </div>
  );
}
