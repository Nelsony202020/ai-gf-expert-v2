// Identity tab — sectioned product setup form with validation helpers.

import { useRef } from 'react';
import type { EntityRow } from './api';
import { ProductMediaField } from './ProductMediaField';
import { ProductFormSection } from './ProductFormSection';
import { ProductSummarySidebar } from './ProductSummarySidebar';
import { ProductSetupStatusBar } from './ProductSetupStatusBar';
import type { computeProductSetupProgress } from './productSetupProgress';
import {
  Button,
  Field,
  Icon,
  InputWithPrefix,
  InsetTextInput,
  Select,
  TextInput,
  YouTubeIcon,
} from './ui';

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
];

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-amber-500',
  in_review: 'bg-amber-500',
  scheduled: 'bg-blue-500',
  published: 'bg-green-500',
  archived: 'bg-slate-300',
};

/** Fields counted toward the “required fields remaining” warning. */
export const IDENTITY_SETUP_REQUIRED = ['name', 'slug', 'logo'] as const;

export const IDENTITY_REQUIRED = ['name', 'slug'] as const;

export const IDENTITY_PROGRESS_FIELDS = [
  'name',
  'slug',
  'tagline',
  'websiteUrl',
  'youtubeReviewUrl',
  'logo',
  'featuredImage',
  'minMonthlyPrice',
  'priceCurrency',
] as const;

export function computeIdentityProgress(
  fields: Record<string, unknown>,
  links: Record<string, string | null>,
): { pct: number; missingRequired: number; filled: number; total: number } {
  let filled = 0;
  for (const key of IDENTITY_PROGRESS_FIELDS) {
    if (key === 'logo' || key === 'featuredImage') {
      if (links[key]) filled++;
    } else if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
      filled++;
    }
  }
  const missingRequired = IDENTITY_SETUP_REQUIRED.filter((k) => {
    if (k === 'logo') return !links.logo;
    const v = fields[k];
    return v === undefined || v === null || String(v).trim() === '';
  }).length;
  const total = IDENTITY_PROGRESS_FIELDS.length;
  const pct = Math.round((filled / total) * 100);
  return { pct, missingRequired, filled, total };
}

export function validateIdentityFields(fields: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!String(fields.name ?? '').trim()) errors.name = 'Product name is required.';
  if (!String(fields.slug ?? '').trim()) errors.slug = 'Slug is required.';
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(fields.slug))) {
    errors.slug = 'Use lowercase letters, numbers, and hyphens only.';
  }
  return errors;
}

interface ProductIdentityTabProps {
  fields: Record<string, any>;
  links: Record<string, string | null>;
  set: (name: string, value: unknown) => void;
  setLinks: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  mediaRows: EntityRow[];
  isNew: boolean;
  productId?: string;
  fieldErrors: Record<string, string>;
  onMediaReload: () => void;
  showPreview: boolean;
  previewUrl?: string;
  slugAuto: boolean;
  onSlugManual: () => void;
  onSlugConfirm: (nextSlug: string, previousSlug: string) => boolean;
  setupProgress: ReturnType<typeof computeProductSetupProgress>;
}

export function ProductIdentityTab({
  fields,
  links,
  set,
  setLinks,
  mediaRows,
  isNew,
  productId,
  fieldErrors,
  onMediaReload,
  showPreview,
  previewUrl,
  slugAuto,
  onSlugManual,
  onSlugConfirm,
  setupProgress,
}: ProductIdentityTabProps) {
  const slugFocusValue = useRef('');

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
          <ProductFormSection num={1} title="Core identity">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Product name" required>
                <TextInput
                  name="name"
                  value={fields.name ?? ''}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. AI Girlfriend"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={fieldErrors.name ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
              </Field>
              <Field
                label="Slug"
                required
                help={
                  slugAuto
                    ? 'Auto-generated from product name — click to edit manually.'
                    : !isNew
                      ? 'Changing a published slug will offer a 301 redirect.'
                      : undefined
                }
              >
                <TextInput
                  name="slug"
                  value={fields.slug ?? ''}
                  onChange={(e) => {
                    if (slugAuto) onSlugManual();
                    const next = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    set('slug', next);
                  }}
                  onFocus={() => {
                    slugFocusValue.current = String(fields.slug ?? '');
                  }}
                  onBlur={() => {
                    const next = String(fields.slug ?? '').trim();
                    if (next !== slugFocusValue.current) {
                      const ok = onSlugConfirm(next, slugFocusValue.current);
                      if (!ok) set('slug', slugFocusValue.current);
                      else slugFocusValue.current = next;
                    }
                  }}
                  placeholder="e.g. ai-girlfriend"
                  aria-invalid={Boolean(fieldErrors.slug)}
                  className={[
                    fieldErrors.slug ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : '',
                    slugAuto ? 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
                {fieldErrors.slug && <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>}
              </Field>
              <Field label="Status" required>
                <div className="relative">
                  <span
                    className={`pointer-events-none absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${STATUS_DOT[String(fields.status ?? 'draft')] ?? 'bg-slate-400'}`}
                  />
                  <Select
                    value={fields.status ?? 'draft'}
                    onChange={(e) => set('status', e.target.value)}
                    className="pl-7 capitalize"
                  >
                    {(() => {
                      const current = String(fields.status ?? 'draft');
                      const options = ['draft', 'published'];
                      const list = options.includes(current) ? options : [current, ...options];
                      return list.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ));
                    })()}
                  </Select>
                </div>
              </Field>
              <Field label="Short tagline" hint="Brief description shown in listings and previews.">
                <TextInput
                  value={fields.tagline ?? ''}
                  onChange={(e) => set('tagline', e.target.value)}
                  placeholder="e.g. The most realistic AI girlfriend experience"
                />
              </Field>
            </div>
          </ProductFormSection>

          <ProductFormSection num={2} title="Links and media" divider>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Official website URL" help="The product's official website or landing page.">
                <InputWithPrefix prefix={<Icon name="language" className="!text-[18px]" />}>
                  <InsetTextInput
                    value={fields.websiteUrl ?? ''}
                    onChange={(e) => set('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </InputWithPrefix>
              </Field>
              <Field label="YouTube review URL" hint="Link to your review or overview video.">
                <InputWithPrefix prefix={<YouTubeIcon className="h-[18px] w-[18px] text-red-600" />}>
                  <InsetTextInput
                    value={fields.youtubeReviewUrl ?? ''}
                    onChange={(e) => set('youtubeReviewUrl', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </InputWithPrefix>
              </Field>
              <ProductMediaField
                label="Product logo"
                hint="Shown on review cards, comparisons, and directory listings."
                supportedText="PNG, JPG, JPEG, or SVG • Max 2MB"
                role="logo"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                productId={productId}
                value={links.logo ?? null}
                mediaRows={mediaRows}
                onChange={(id) => setLinks((p) => ({ ...p, logo: id }))}
                onUploaded={onMediaReload}
              />
              <ProductMediaField
                label="Featured image"
                hint="Hero image on the review page and social previews."
                supportedText="JPG or PNG • Recommended 16:9 • Max 5MB"
                role="featured"
                accept="image/png,image/jpeg,image/webp"
                productId={productId}
                productName={String(fields.name ?? '')}
                value={links.featuredImage ?? null}
                mediaRows={mediaRows}
                onChange={(id) => setLinks((p) => ({ ...p, featuredImage: id }))}
                onUploaded={onMediaReload}
              />
            </div>
          </ProductFormSection>

          <ProductFormSection num={3} title="Pricing snapshot" divider>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Min monthly price (cache)" help="Lowest monthly price used in product listings and comparisons.">
                <InputWithPrefix prefix={<span className="text-sm font-medium">$</span>}>
                  <InsetTextInput
                    inputMode="decimal"
                    value={fields.minMonthlyPrice ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, '');
                      set('minMonthlyPrice', raw === '' ? undefined : Number(raw));
                    }}
                    placeholder="e.g. 9.99"
                  />
                </InputWithPrefix>
              </Field>
              <Field label="Currency">
                <Select
                  value={fields.priceCurrency ?? 'USD'}
                  onChange={(e) => set('priceCurrency', e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                  {fields.priceCurrency &&
                    !CURRENCIES.some((c) => c.code === fields.priceCurrency) && (
                      <option value={fields.priceCurrency}>{fields.priceCurrency}</option>
                    )}
                </Select>
              </Field>
            </div>
          </ProductFormSection>

          <div className="mt-6 flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-900/50 dark:bg-blue-950/30 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3 text-sm text-blue-900 dark:text-blue-200">
              <Icon name="info" className="mt-0.5 shrink-0 !text-[18px] text-blue-600 dark:text-blue-400" />
              <p>
                Gallery media, pricing, and characters are managed inside each product workspace
                (Media, Pricing, and Characters tabs).
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a href="/editorial-guidelines/" target="_blank" rel="noreferrer">
                <Button variant="secondary" className="text-xs">
                  View docs
                </Button>
              </a>
            </div>
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
