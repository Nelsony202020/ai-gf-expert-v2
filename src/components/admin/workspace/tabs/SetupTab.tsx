// Setup tab: core identity, links (incl. embedded affiliate management),
// basic media, visibility flags, and grouped capability toggles.

import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { dataApi, type EntityRow } from '../../api';
import { useCan } from '../../context';
import { AuthorSelect } from '../../AuthorSelect';
import { ProductFormSection } from '../../ProductFormSection';
import { ProductMediaField } from '../../ProductMediaField';
import {
  SETUP_CHARACTER_CAPABILITIES,
  SETUP_CHARACTER_GROUPS,
  countSetupCharacterCapabilities,
} from '../../productCapabilities';
import { ToggleWithHint } from '../../FieldHint';
import {
  Badge,
  Button,
  ErrorNote,
  Field,
  Icon,
  InputWithPrefix,
  InsetTextInput,
  Modal,
  Select,
  TextArea,
  TextInput,
  Toggle,
  YouTubeIcon,
  fmtDate,
  useAsync,
} from '../../ui';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';
import { workspaceTabPath } from '../completion';

export function SetupTab() {
  const ws = useWorkspace();
  const { fields, links, set, setLinks, fieldErrors, related } = ws;
  const [searchParams, setSearchParams] = useSearchParams();
  const slugFocusValue = useRef('');
  const justCreated = searchParams.get('created') === '1';

  const status = String(fields.status ?? 'draft');
  const statusEditable = status === 'draft' || status === 'archived';

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_250px]">
      <div className="space-y-4">
        {justCreated && (
          <div className="rounded-xl border border-green-200 bg-green-50/80 p-4 dark:border-green-900/50 dark:bg-green-950/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2.5">
                <Icon name="check_circle" className="mt-0.5 shrink-0 !text-[20px] text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                    {fields.name} has been created as a draft.
                  </p>
                  <p className="mt-0.5 text-xs text-green-800/80 dark:text-green-300/80">
                    Work through the sections below, or jump straight to another part of the review.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <QuickAction label="Complete setup" icon="checklist" to={workspaceTabPath(ws.productId, 'setup')} />
                    <QuickAction label="Start testing" icon="science" to={workspaceTabPath(ws.productId, 'testing')} />
                    <QuickAction label="Write verdict" icon="gavel" to={workspaceTabPath(ws.productId, 'verdict')} />
                    <QuickAction label="Write full review" icon="article" to={workspaceTabPath(ws.productId, 'review')} />
                    <QuickAction label="Add pricing" icon="payments" to={workspaceTabPath(ws.productId, 'pricing')} />
                    <QuickAction label="Add characters" icon="group" to={workspaceTabPath(ws.productId, 'characters')} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                className="text-green-700/60 hover:text-green-800 dark:text-green-400"
                onClick={() => {
                  searchParams.delete('created');
                  setSearchParams(searchParams, { replace: true });
                }}
              >
                <Icon name="close" className="!text-[18px]" />
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <ProductFormSection num={1} title="Core identity">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Product name" required>
                <TextInput
                  value={fields.name ?? ''}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Aura AI"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={fieldErrors.name ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
              </Field>
              <Field
                label="Slug"
                required
                help={status === 'published' ? 'Changing a published slug will offer a 301 redirect.' : undefined}
              >
                <TextInput
                  value={fields.slug ?? ''}
                  onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  onFocus={() => {
                    slugFocusValue.current = String(fields.slug ?? '');
                  }}
                  onBlur={() => {
                    const next = String(fields.slug ?? '').trim();
                    if (next !== slugFocusValue.current) {
                      const ok = ws.confirmSlugChange(next, slugFocusValue.current);
                      if (!ok) set('slug', slugFocusValue.current);
                      else slugFocusValue.current = next;
                    }
                  }}
                  placeholder="e.g. aura-ai"
                  aria-invalid={Boolean(fieldErrors.slug)}
                  className={fieldErrors.slug ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.slug && <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>}
              </Field>
              <Field
                label="Status"
                hint={
                  statusEditable
                    ? 'Publishing happens from the Publish tab after all checks pass.'
                    : 'Manage publication from the Publish tab.'
                }
              >
                {statusEditable ? (
                  <Select value={status} onChange={(e) => set('status', e.target.value)} className="capitalize">
                    <option value="draft">draft</option>
                    <option value="archived">archived</option>
                  </Select>
                ) : (
                  <div className="flex h-[34px] items-center">
                    <Badge tone={status === 'published' ? 'green' : 'blue'}>{status.replace('_', ' ')}</Badge>
                  </div>
                )}
              </Field>
              <Field label="Short tagline" hint="Brief description shown in listings and previews.">
                <TextInput
                  value={fields.tagline ?? ''}
                  onChange={(e) => set('tagline', e.target.value)}
                  placeholder="e.g. The most realistic AI girlfriend experience"
                />
              </Field>
              <Field label="Author" required>
                <AuthorSelect
                  authors={related.authors}
                  value={links.author ?? null}
                  onChange={(id) => setLinks((p) => ({ ...p, author: id }))}
                  allowEmpty={false}
                  emptyLabel="Select author"
                />
              </Field>
              <Field label="Fact checker">
                <AuthorSelect
                  authors={related.authors}
                  value={links.factChecker ?? null}
                  onChange={(id) => setLinks((p) => ({ ...p, factChecker: id }))}
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Revision notes" hint="Internal notes about the latest changes to this review.">
                <TextArea
                  rows={2}
                  value={fields.revisionNotes ?? ''}
                  onChange={(e) => set('revisionNotes', e.target.value)}
                />
              </Field>
            </div>
          </ProductFormSection>

          <ProductFormSection num={2} title="Links" divider>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Official website URL" required>
                  <InputWithPrefix prefix={<Icon name="language" className="!text-[18px]" />}>
                    <InsetTextInput
                      value={fields.websiteUrl ?? ''}
                      onChange={(e) => set('websiteUrl', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </InputWithPrefix>
                </Field>
              </div>
              <AffiliateLinksPanel />
            </div>
          </ProductFormSection>

          <ProductFormSection num={3} title="Basic media" divider>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProductMediaField
                label="Product logo"
                hint="Shown on review cards, comparisons, and directory listings."
                supportedText="PNG, JPG, JPEG, or SVG • Max 2MB"
                role="logo"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                productId={ws.productId}
                value={links.logo ?? null}
                mediaRows={related.mediaAll}
                onChange={(id) => setLinks((p) => ({ ...p, logo: id }))}
                onUploaded={() => void ws.refreshRelated()}
              />
              <ProductMediaField
                label="Featured image"
                hint="Hero image on the review page and social previews."
                supportedText="JPG or PNG • Recommended 16:9 • Max 5MB"
                role="featured"
                accept="image/png,image/jpeg,image/webp"
                productId={ws.productId}
                value={links.featuredImage ?? null}
                mediaRows={related.mediaAll}
                onChange={(id) => setLinks((p) => ({ ...p, featuredImage: id }))}
                onUploaded={() => void ws.refreshRelated()}
              />
              <Field
                label="Open Graph image URL"
                hint="Shown in social link previews (1200×630 recommended). Falls back to the featured image."
              >
                <InputWithPrefix prefix={<Icon name="share" className="!text-[18px]" />}>
                  <InsetTextInput
                    value={fields.ogImageUrl ?? ''}
                    onChange={(e) => set('ogImageUrl', e.target.value)}
                    placeholder="https://example.com/social.jpg"
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
            </div>
          </ProductFormSection>

          <ProductFormSection num={4} title="Visibility" divider>
            <div className="grid gap-4 sm:grid-cols-2">
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
          </ProductFormSection>

          <ProductFormSection num={5} title="Character options" divider>
            <CapabilitiesEditor />
          </ProductFormSection>
        </div>
      </div>

      <CompletionSidebar />
    </div>
  );
}

function QuickAction({ label, icon, to }: { label: string; icon: string; to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-white px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-50 dark:border-green-900 dark:bg-slate-900 dark:text-green-300"
    >
      <Icon name={icon} className="!text-[14px]" /> {label}
    </Link>
  );
}

function CapabilitiesEditor() {
  const ws = useWorkspace();
  const { fields, set, setMany } = ws;
  const counts = countSetupCharacterCapabilities(fields);

  const capByName = Object.fromEntries(SETUP_CHARACTER_CAPABILITIES.map((c) => [c.name, c]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {counts.enabled} of {counts.total}
          </span>{' '}
          selected · used for directory filters and comparisons.
        </p>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() =>
              setMany(Object.fromEntries(SETUP_CHARACTER_CAPABILITIES.map((c) => [c.name, true])))
            }
          >
            Select all
          </Button>
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() =>
              setMany(Object.fromEntries(SETUP_CHARACTER_CAPABILITIES.map((c) => [c.name, false])))
            }
          >
            Clear all
          </Button>
        </div>
      </div>

      <div className="grid gap-x-12 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {SETUP_CHARACTER_GROUPS.map((group) => (
          <ul key={group.id} className="space-y-3">
            {group.caps.map((name) => {
              const cap = capByName[name];
              if (!cap) return null;
              return (
                <li key={cap.name} className="flex items-center gap-3">
                  <Toggle
                    checked={fields[cap.name]}
                    onChange={(v) => set(cap.name, v)}
                    aria-label={cap.label}
                  />
                  <span className="min-w-0 text-sm text-slate-700 dark:text-slate-300">{cap.label}</span>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Embedded affiliate-link management (centralized entity, edited in place)
// ---------------------------------------------------------------------------

function AffiliateLinksPanel() {
  const ws = useWorkspace();
  const can = useCan();
  const linksForProduct = ws.related.affiliateLinks;
  const [editing, setEditing] = useState<EntityRow | 'new' | null>(null);
  const canEdit = can('affiliates.edit');

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Affiliate links</p>
        {canEdit && (
          <Button variant="secondary" className="text-xs" onClick={() => setEditing('new')}>
            <Icon name="add" className="!text-[14px]" /> Add link
          </Button>
        )}
      </div>
      {linksForProduct.length === 0 ? (
        <p className="px-3 py-3 text-sm text-slate-400">
          No affiliate link yet — CTAs fall back to the official website URL.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {linksForProduct.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
              <code className="font-mono text-xs text-slate-800 dark:text-slate-200">/go/{link.cloakedSlug}</code>
              <Badge tone={link.active ? 'green' : 'gray'}>{link.active ? 'active' : 'inactive'}</Badge>
              {link.lastCheckStatus && (
                <Badge
                  tone={
                    link.lastCheckStatus === 'ok' ? 'green' : link.lastCheckStatus === 'broken' ? 'red' : 'amber'
                  }
                >
                  {link.lastCheckStatus}
                </Badge>
              )}
              <span className="min-w-0 flex-1 truncate text-xs text-slate-400">{link.destinationUrl}</span>
              <span className="text-xs text-slate-400">
                Checked {link.lastCheckedAt ? fmtDate(link.lastCheckedAt) : 'never'}
              </span>
              {canEdit && (
                <Button variant="ghost" className="text-xs" onClick={() => setEditing(link)}>
                  Edit
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <AffiliateLinkModal
          productId={ws.productId}
          link={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void ws.refreshRelated();
          }}
        />
      )}
    </div>
  );
}

export function AffiliateLinkModal({
  productId,
  link,
  onClose,
  onSaved,
}: {
  productId: string;
  link: EntityRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [destinationUrl, setDestinationUrl] = useState(String(link?.destinationUrl ?? ''));
  const [cloakedSlug, setCloakedSlug] = useState(String(link?.cloakedSlug ?? ''));
  const [campaign, setCampaign] = useState(String(link?.campaign ?? ''));
  const [active, setActive] = useState(link ? Boolean(link.active) : true);
  const { busy, error, run } = useAsync();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fields: Record<string, unknown> = {
      destinationUrl: destinationUrl.trim(),
      cloakedSlug: cloakedSlug.trim(),
      active,
      linkType: 'product',
    };
    if (campaign.trim()) fields.campaign = campaign.trim();
    const done = await run(async () => {
      if (link) await dataApi.update('affiliateLinks', link.id, fields);
      else await dataApi.create('affiliateLinks', fields, { product: productId });
      return true;
    });
    if (done) onSaved();
  }

  return (
    <Modal title={link ? 'Edit affiliate link' : 'New affiliate link'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        {error && <ErrorNote message={error} />}
        <Field label="Destination URL" required help="The tracking URL from the affiliate network.">
          <TextInput
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="https://partner.example.com/?ref=..."
            required
          />
        </Field>
        <Field label="Cloaked slug" required help="Rendered sitewide as /go/{slug} — changing it changes every CTA.">
          <InputWithPrefix prefix={<span className="font-mono text-xs">/go/</span>}>
            <InsetTextInput
              value={cloakedSlug}
              onChange={(e) => setCloakedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="aura-ai"
              required
            />
          </InputWithPrefix>
        </Field>
        <Field label="Campaign (optional)">
          <TextInput value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. summer-2026" />
        </Field>
        <Toggle checked={active} onChange={setActive} label="Active" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !destinationUrl.trim() || !cloakedSlug.trim()}>
            {busy ? 'Saving…' : link ? 'Save link' : 'Create link'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
