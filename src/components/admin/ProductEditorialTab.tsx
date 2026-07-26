// Editorial tab — written content, metadata, and feature flags.

import type { EntityRow } from './api';
import { AuthorSelect } from './AuthorSelect';
import { ProductFormSection } from './ProductFormSection';
import { ProductSetupStatusBar } from './ProductSetupStatusBar';
import { ProductSummarySidebar } from './ProductSummarySidebar';
import type { computeProductSetupProgress } from './productSetupProgress';
import { ToggleWithHint } from './FieldHint';
import { Field, LinesTextArea, TextArea, TextInput } from './ui';

export const EDITORIAL_RECOMMENDED = [
  'oneLineVerdict',
  'ourTake',
  'directoryDescription',
  'mainStrength',
  'mainLimitation',
  'pros',
  'cons',
] as const;

export const EDITORIAL_PROGRESS_FIELDS = [
  ...EDITORIAL_RECOMMENDED,
  'author',
  'factChecker',
  'bestForLabel',
  'displayOrder',
  'revisionNotes',
] as const;

function isFilled(fields: Record<string, unknown>, links: Record<string, string | null>, key: string): boolean {
  if (key === 'author') return Boolean(links.author);
  if (key === 'factChecker') return Boolean(links.factChecker);
  if (key === 'pros' || key === 'cons') {
    const v = fields[key];
    return Array.isArray(v) && v.length > 0;
  }
  const v = fields[key];
  return v !== undefined && v !== null && v !== '';
}

export function computeEditorialProgress(
  fields: Record<string, unknown>,
  links: Record<string, string | null>,
): {
  pct: number;
  missingRecommended: number;
  missingRequired: number;
  statusMissingCount: number;
  statusMissingKind: 'required' | 'recommended';
} {
  let filled = 0;
  for (const key of EDITORIAL_PROGRESS_FIELDS) {
    if (isFilled(fields, links, key)) filled++;
  }

  const missingRequired = links.author ? 0 : 1;
  const missingRecommended = EDITORIAL_RECOMMENDED.filter((k) => !isFilled(fields, links, k)).length;
  const pct = Math.round((filled / EDITORIAL_PROGRESS_FIELDS.length) * 100);

  const statusMissingCount = missingRequired > 0 ? missingRequired : missingRecommended;
  const statusMissingKind = missingRequired > 0 ? 'required' : 'recommended';

  return { pct, missingRecommended, missingRequired, statusMissingCount, statusMissingKind };
}

export function validateEditorialFields(
  fields: Record<string, unknown>,
  links: Record<string, string | null>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!links.author) errors.author = 'Author is required.';
  return errors;
}

interface ProductEditorialTabProps {
  fields: Record<string, any>;
  links: Record<string, string | null>;
  set: (name: string, value: unknown) => void;
  setLinks: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  authors: EntityRow[];
  isNew: boolean;
  productId?: string;
  fieldErrors: Record<string, string>;
  showPreview: boolean;
  previewUrl?: string;
  setupProgress: ReturnType<typeof computeProductSetupProgress>;
}

export function ProductEditorialTab({
  fields,
  links,
  set,
  setLinks,
  authors,
  isNew,
  productId,
  fieldErrors,
  showPreview,
  previewUrl,
  setupProgress,
}: ProductEditorialTabProps) {
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
          <ProductFormSection num={1} title="Editorial summary">
            <div className="space-y-3">
              <Field label="One-line verdict">
                <TextInput
                  value={fields.oneLineVerdict ?? ''}
                  onChange={(e) => set('oneLineVerdict', e.target.value)}
                  placeholder="Summarize your overall verdict in a single line."
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Our Take">
                  <TextArea
                    rows={4}
                    value={fields.ourTake ?? ''}
                    onChange={(e) => set('ourTake', e.target.value)}
                  />
                </Field>
                <Field label="Short directory description">
                  <TextArea
                    rows={4}
                    value={fields.directoryDescription ?? ''}
                    onChange={(e) => set('directoryDescription', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </ProductFormSection>

          <ProductFormSection num={2} title="Highlights and trade-offs" divider>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Main strength">
                <TextInput
                  value={fields.mainStrength ?? ''}
                  onChange={(e) => set('mainStrength', e.target.value)}
                />
              </Field>
              <Field label="Main limitation">
                <TextInput
                  value={fields.mainLimitation ?? ''}
                  onChange={(e) => set('mainLimitation', e.target.value)}
                />
              </Field>
              <Field label="Pros (one per line)">
                <LinesTextArea rows={4} value={fields.pros} onChange={(v) => set('pros', v)} />
              </Field>
              <Field label="Cons (one per line)">
                <LinesTextArea rows={4} value={fields.cons} onChange={(v) => set('cons', v)} />
              </Field>
            </div>
          </ProductFormSection>

          <ProductFormSection num={3} title="Editorial metadata" divider>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={'Optional "Best for" award label'}
                  help="Optional — products are never forced to have an award."
                >
                  <TextInput
                    value={fields.bestForLabel ?? ''}
                    onChange={(e) => set('bestForLabel', e.target.value)}
                  />
                </Field>
                <Field label="Display order override">
                  <TextInput
                    type="number"
                    value={fields.displayOrder ?? ''}
                    onChange={(e) =>
                      set('displayOrder', e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Author" required>
                  <AuthorSelect
                    authors={authors}
                    value={links.author ?? null}
                    onChange={(id) => setLinks((p) => ({ ...p, author: id }))}
                    allowEmpty={false}
                    emptyLabel="Select author"
                    invalid={Boolean(fieldErrors.author)}
                  />
                  {fieldErrors.author && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.author}</p>
                  )}
                </Field>
                <Field label="Fact checker">
                  <AuthorSelect
                    authors={authors}
                    value={links.factChecker ?? null}
                    onChange={(id) => setLinks((p) => ({ ...p, factChecker: id }))}
                  />
                </Field>
              </div>
              <Field label="Revision notes">
                <TextArea
                  rows={2}
                  value={fields.revisionNotes ?? ''}
                  onChange={(e) => set('revisionNotes', e.target.value)}
                />
              </Field>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Feature flags & visibility
                </h4>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <ToggleWithHint
                    checked={fields.verified}
                    onChange={(v) => set('verified', v)}
                    label="Verified product"
                    hint="Mark this product as verified by our team."
                  />
                  <ToggleWithHint
                    checked={fields.editorsPick}
                    onChange={(v) => set('editorsPick', v)}
                    label="Editor's Pick"
                    hint="Show the Editor's Pick badge on this product."
                  />
                  <ToggleWithHint
                    checked={fields.homepageFeatured}
                    onChange={(v) => set('homepageFeatured', v)}
                    label="Homepage featured"
                    hint="Feature this product on the homepage."
                  />
                  <ToggleWithHint
                    checked={fields.publishedInDirectory}
                    onChange={(v) => set('publishedInDirectory', v)}
                    label="Published in directory"
                    hint="Include this product in public directories."
                  />
                </div>
              </div>
            </div>
          </ProductFormSection>
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
