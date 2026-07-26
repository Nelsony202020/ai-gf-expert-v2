// SEO tab — search appearance, indexing, and social sharing with live previews.

import { useState } from 'react';
import type { EntityRow } from './api';
import { CharCounter, FieldHint, PreviewViewToggle, ToggleWithHint } from './FieldHint';
import { ProductFormSection } from './ProductFormSection';
import { ProductSetupStatusBar } from './ProductSetupStatusBar';
import { ProductSummarySidebar } from './ProductSummarySidebar';
import type { computeProductSetupProgress } from './productSetupProgress';
import { Field, Icon, TextArea, TextInput } from './ui';

type SetupProgress = ReturnType<typeof computeProductSetupProgress>;

interface ProductSeoTabProps {
  fields: Record<string, any>;
  set: (name: string, value: unknown) => void;
  links: Record<string, string | null>;
  mediaRows: EntityRow[];
  isNew: boolean;
  productId?: string;
  showPreview: boolean;
  previewUrl?: string;
  setupProgress: SetupProgress;
}

export function ProductSeoTab({
  fields,
  set,
  links,
  mediaRows,
  isNew,
  productId,
  showPreview,
  previewUrl,
  setupProgress,
}: ProductSeoTabProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <ProductSetupStatusBar
          status={String(fields.status ?? 'draft')}
          progressPct={setupProgress.pct}
          missingCount={setupProgress.statusMissingCount}
          missingKind={setupProgress.statusMissingKind}
          showPreview={showPreview}
          previewUrl={previewUrl}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <ProductFormSection num={1} title="Search appearance">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <LimitedField
                    label="SEO title"
                    hint="The blue clickable title in Google results. Keep it clear and under 60 characters."
                    max={60}
                    value={fields.seoTitle ?? ''}
                    onChange={(v) => set('seoTitle', v)}
                    placeholder="Product name — short benefit or verdict"
                  />
                  <LimitedField
                    label="H1 override"
                    hint="Changes the main heading on the review page only. Leave blank to use the product name."
                    max={60}
                    value={fields.h1Override ?? ''}
                    onChange={(v) => set('h1Override', v)}
                    placeholder="Optional page heading"
                  />
                </div>
                <LimitedField
                  label="Meta description"
                  hint="The gray snippet under your title in search results. Summarize the review in plain language."
                  max={160}
                  multiline
                  rows={3}
                  value={fields.seoDescription ?? ''}
                  onChange={(v) => set('seoDescription', v)}
                  placeholder="Brief summary shown in Google and other search engines."
                />
                <LimitedField
                  label="Search excerpt"
                  hint="Optional shorter blurb some internal search uses instead of the meta description."
                  max={160}
                  multiline
                  rows={2}
                  value={fields.searchExcerpt ?? ''}
                  onChange={(v) => set('searchExcerpt', v)}
                  help="Optional. Shown in some search results instead of the meta description."
                  placeholder="Optional alternate snippet"
                />
              </div>
              <SearchPreviewPanel fields={fields} />
            </div>
          </ProductFormSection>

          <ProductFormSection num={2} title="URL and indexing" divider>
            <div className="space-y-4">
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
                    placeholder="https://example.com/reviews/product-slug"
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
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Indexing controls</p>
                <div className="mt-3 flex flex-wrap gap-8">
                  <ToggleWithHint
                    checked={fields.noindex}
                    onChange={(v) => set('noindex', v)}
                    label="noindex"
                    hint="Hides this page from search results entirely."
                  />
                  <ToggleWithHint
                    checked={fields.nofollow}
                    onChange={(v) => set('nofollow', v)}
                    label="nofollow"
                    hint="Tells search engines not to follow links on this page."
                  />
                </div>
              </div>
            </div>
          </ProductFormSection>

          <ProductFormSection num={3} title="Social sharing" divider>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <LimitedField
                  label="Open Graph title"
                  hint="Title shown when someone shares this page on Facebook, X, Discord, etc. Falls back to the SEO title if empty."
                  max={95}
                  value={fields.ogTitle ?? ''}
                  onChange={(v) => set('ogTitle', v)}
                  placeholder="Catchy share headline"
                />
                <Field
                  label={
                    <span className="inline-flex items-center">
                      Open Graph image URL
                      <FieldHint text="Image displayed in link previews on social apps. Use a 1200×630 image for best results. Falls back to the featured image if empty." />
                    </span>
                  }
                >
                  <TextInput
                    value={fields.ogImageUrl ?? ''}
                    onChange={(e) => set('ogImageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </Field>
                <LimitedField
                  label="Open Graph description"
                  hint="Short description under the image in social previews. Falls back to the meta description if empty."
                  max={200}
                  multiline
                  rows={3}
                  value={fields.ogDescription ?? ''}
                  onChange={(v) => set('ogDescription', v)}
                  placeholder="What should people know when they see this link shared?"
                />
              </div>
              <SocialPreviewPanel fields={fields} links={links} mediaRows={mediaRows} />
            </div>
          </ProductFormSection>

          <div className="mt-6 flex gap-3 rounded-lg border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            <Icon name="info" className="mt-0.5 shrink-0 !text-[18px] text-blue-600 dark:text-blue-400" />
            <p>
              Structured data (JSON-LD) is generated automatically from product fields — no manual
              JSON is needed for normal pages.
            </p>
          </div>
        </div>
      </div>

      <ProductSummarySidebar
        fields={fields}
        isNew={isNew}
        productId={productId}
        showPreview={showPreview}
        previewUrl={previewUrl}
      />
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
  help,
}: {
  label: string;
  hint?: string;
  max: number;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  help?: string;
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
          onChange={(e) => onChange(clamp(e.target.value))}
        />
      ) : (
        <TextInput
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(clamp(e.target.value))}
        />
      )}
      {help ? <p className="mt-1 text-xs text-slate-400">{help}</p> : null}
    </div>
  );
}

function SearchPreviewPanel({ fields }: { fields: Record<string, any> }) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const slug = fields.slug ? String(fields.slug) : 'product-slug';
  const siteHost = 'aigirlfriendexpert.com';
  const title =
    fields.seoTitle?.trim() ||
    fields.name?.trim() ||
    'Example Product Title — Review & Rating';
  const description =
    fields.seoDescription?.trim() ||
    fields.searchExcerpt?.trim() ||
    fields.directoryDescription?.trim() ||
    fields.tagline?.trim() ||
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
          {siteHost} › reviews › {slug}
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
  fields,
  links,
  mediaRows,
}: {
  fields: Record<string, any>;
  links: Record<string, string | null>;
  mediaRows: EntityRow[];
}) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const mobile = view === 'mobile';

  const title =
    fields.ogTitle?.trim() ||
    fields.seoTitle?.trim() ||
    fields.name?.trim() ||
    'Product title';
  const description =
    fields.ogDescription?.trim() ||
    fields.seoDescription?.trim() ||
    'Add an Open Graph description to control social share snippets.';
  const featured = links.featuredImage
    ? mediaRows.find((m) => m.id === links.featuredImage)?.url
    : null;
  const imageUrl = fields.ogImageUrl?.trim() || featured || null;
  const domain = 'aigirlfriendexpert.com';

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
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{domain}</p>
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
