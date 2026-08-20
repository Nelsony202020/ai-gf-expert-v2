// Affiliate link manager: cloaked /go/ slugs, centralized destination
// changes (with history), campaign windows, click counts.

import { useEffect, useState } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import { useCan } from '../context';
import {
  Button,
  Badge,
  Card,
  Field,
  TextInput,
  Select,
  Toggle,
  Spinner,
  ErrorNote,
  EmptyState,
  Modal,
  useAsync,
  fmtDate,
  Icon,
} from '../ui';
import { DEFAULT_AFFILIATE_REL } from '../../../lib/affiliate/rel';
import { needsYoutubeAgeGate } from '../../../lib/affiliate/youtubeAgeGate';

export function AffiliateLinksPage() {
  const canDelete = useCan('records.delete');
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<EntityRow | null | 'new'>(null);
  const [changingDest, setChangingDest] = useState<EntityRow | null>(null);
  const [checkReport, setCheckReport] = useState<{
    checked: number;
    ok: number;
    redirect: number;
    broken: number;
  } | null>(null);
  const { busy: checking, run: runCheck } = useAsync();

  function reload() {
    dataApi
      .list('affiliateLinks')
      .then((r) => setRows(r.rows))
      .catch((e) => setError(e.message));
  }
  useEffect(reload, []);

  async function checkAll() {
    const report = await runCheck(() =>
      api.post<{ checked: number; ok: number; redirect: number; broken: number }>(
        '/api/admin/affiliate-links/check',
      ),
    );
    if (report) {
      setCheckReport(report);
      reload();
    }
  }

  async function deleteLink(link: EntityRow) {
    const slug = String(link.cloakedSlug ?? '');
    const ok = confirm(
      `Delete affiliate link /go/${slug}?\n\nThis permanently removes the link and its change history. This cannot be undone.`,
    );
    if (!ok) return;
    setDeletingId(link.id);
    try {
      await dataApi.remove('affiliateLinks', link.id);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingId(null);
    }
  }

  const now = Date.now();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Affiliate links</h2>
          <p className="text-sm text-slate-500">
            Every CTA renders <code>/go/[slug]</code> — change a destination here and it updates
            sitewide instantly. Destination changes keep history.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={checkAll} disabled={checking}>
            <Icon name="network_check" /> {checking ? 'Checking…' : 'Check all links'}
          </Button>
          <Button onClick={() => setEditing('new')}>
            <Icon name="add" /> Add link
          </Button>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {checkReport && (
        <Card>
          <p className="text-sm">
            Link health: {checkReport.checked} checked ·{' '}
            <span className="font-semibold text-green-700">{checkReport.ok} ok</span> ·{' '}
            <span className="font-semibold text-amber-700">{checkReport.redirect} redirect</span> ·{' '}
            <span className={`font-semibold ${checkReport.broken > 0 ? 'text-red-700' : 'text-slate-400'}`}>
              {checkReport.broken} broken
            </span>
          </p>
        </Card>
      )}

      <Card>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState message="No affiliate links yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-2 py-2">Cloaked URL</th>
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2">Destination</th>
                <th className="px-2 py-2">Rel tags</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Clicks</th>
                <th className="px-2 py-2">Verified</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((link) => {
                const expired = link.endAt && link.endAt < now;
                return (
                  <tr key={link.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-2 font-mono text-xs">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span>/go/{link.cloakedSlug}</span>
                        {needsYoutubeAgeGate(link) ? <Badge tone="red">18+ gate</Badge> : null}
                      </span>
                    </td>
                    <td className="px-2 py-2">{link.product?.name ?? '—'}</td>
                    <td className="max-w-56 truncate px-2 py-2 text-xs text-slate-500">
                      {link.destinationUrl}
                    </td>
                    <td className="max-w-40 truncate px-2 py-2 font-mono text-[10px] text-slate-500">
                      {link.relTags ?? DEFAULT_AFFILIATE_REL}
                    </td>
                    <td className="px-2 py-2">
                      {!link.active ? (
                        <Badge tone="gray">inactive</Badge>
                      ) : expired ? (
                        <Badge tone="red">expired</Badge>
                      ) : link.lastCheckStatus === 'broken' ? (
                        <Badge tone="red">broken</Badge>
                      ) : (
                        <Badge tone="green">active</Badge>
                      )}
                    </td>
                    <td className="px-2 py-2">{link.clickCount ?? 0}</td>
                    <td className="px-2 py-2">{fmtDate(link.lastVerifiedAt)}</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      <button
                        className="mr-2 text-slate-400 hover:text-amber-600"
                        title="Change destination (kept in history)"
                        onClick={() => setChangingDest(link)}
                      >
                        <Icon name="swap_horiz" />
                      </button>
                      <button className="text-slate-400 hover:text-pink-600" onClick={() => setEditing(link)}>
                        <Icon name="edit" />
                      </button>
                      {canDelete && (
                        <button
                          className="ml-2 text-slate-400 hover:text-red-600 disabled:opacity-40"
                          title="Delete link"
                          disabled={deletingId === link.id}
                          onClick={() => deleteLink(link)}
                        >
                          <Icon name="delete" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {editing !== null && (
        <LinkModal
          link={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {changingDest && (
        <DestinationModal
          link={changingDest}
          onClose={() => setChangingDest(null)}
          onDone={() => {
            setChangingDest(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function LinkModal({
  link,
  onClose,
  onDone,
}: {
  link: EntityRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [products, setProducts] = useState<EntityRow[]>([]);
  const [fields, setFields] = useState<Record<string, any>>({
    cloakedSlug: link?.cloakedSlug ?? '',
    destinationUrl: link?.destinationUrl ?? '',
    linkType: link?.linkType ?? 'product',
    campaign: link?.campaign ?? '',
    active: link ? Boolean(link.active) : true,
    notes: link?.notes ?? '',
    relTags: link?.relTags ?? DEFAULT_AFFILIATE_REL,
    startAt: link?.startAt ? new Date(link.startAt).toISOString().slice(0, 10) : '',
    endAt: link?.endAt ? new Date(link.endAt).toISOString().slice(0, 10) : '',
  });
  const [productId, setProductId] = useState(link?.product?.id ?? '');
  const { busy, error, run } = useAsync();

  useEffect(() => {
    dataApi.list('products').then((r) => setProducts(r.rows)).catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      cloakedSlug: fields.cloakedSlug,
      linkType: fields.linkType,
      campaign: fields.campaign || undefined,
      active: fields.active,
      notes: fields.notes || undefined,
      relTags: String(fields.relTags || '').trim() || DEFAULT_AFFILIATE_REL,
      startAt: fields.startAt ? new Date(fields.startAt).getTime() : undefined,
      endAt: fields.endAt ? new Date(fields.endAt).getTime() : undefined,
    };
    // Destination changes on existing links go through the history endpoint.
    if (!link) payload.destinationUrl = fields.destinationUrl;

    const done = await run(async () => {
      if (link) await dataApi.update('affiliateLinks', link.id, payload, { product: productId || null });
      else await dataApi.create('affiliateLinks', payload, { product: productId || null });
      return true;
    });
    if (done) onDone();
  }

  return (
    <Modal title={link ? `Edit /go/${link.cloakedSlug}` : 'New affiliate link'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        {error && <ErrorNote message={error} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cloaked slug" required help="Public URL: /go/[slug]">
            <TextInput
              value={fields.cloakedSlug}
              onChange={(e) => setFields({ ...fields, cloakedSlug: e.target.value })}
              required
            />
          </Field>
          <Field label="Product">
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— none —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {!link && (
          <Field label="Destination URL" required>
            <TextInput
              value={fields.destinationUrl}
              onChange={(e) => setFields({ ...fields, destinationUrl: e.target.value })}
              required
            />
          </Field>
        )}
        {link && (
          <p className="rounded-md bg-slate-50 p-2 text-xs text-slate-500">
            Destination: <span className="font-mono">{link.destinationUrl}</span> — change it via
            the <Icon name="swap_horiz" className="!text-[14px]" /> action so history is preserved.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={fields.linkType} onChange={(e) => setFields({ ...fields, linkType: e.target.value })}>
              <option value="product">product</option>
              <option value="character">character</option>
              <option value="campaign">campaign</option>
            </Select>
          </Field>
          <Field
            label="Campaign tag"
            hint="Use youtube to show the 18+ interstitial before the destination. No sends visitors back to YouTube."
          >
            <TextInput value={fields.campaign} onChange={(e) => setFields({ ...fields, campaign: e.target.value })} />
          </Field>
          <Field label="Start date">
            <TextInput type="date" value={fields.startAt} onChange={(e) => setFields({ ...fields, startAt: e.target.value })} />
          </Field>
          <Field label="Expiration date">
            <TextInput type="date" value={fields.endAt} onChange={(e) => setFields({ ...fields, endAt: e.target.value })} />
          </Field>
        </div>
        <Field label="Notes (terms, contact, payout)">
          <TextInput value={fields.notes} onChange={(e) => setFields({ ...fields, notes: e.target.value })} />
        </Field>
        <Field
          label="Link rel tags"
          help="Space-separated tokens on every public CTA for this cloaked link. Default: nofollow sponsored noopener."
        >
          <TextInput
            value={fields.relTags}
            onChange={(e) => setFields({ ...fields, relTags: e.target.value })}
            placeholder={DEFAULT_AFFILIATE_REL}
          />
        </Field>
        <Toggle checked={fields.active} onChange={(v) => setFields({ ...fields, active: v })} label="Active" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DestinationModal({
  link,
  onClose,
  onDone,
}: {
  link: EntityRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [destinationUrl, setDestinationUrl] = useState(link.destinationUrl);
  const [reason, setReason] = useState('');
  const { busy, error, run } = useAsync();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      await api.post(`/api/admin/affiliate-links/${link.id}/destination`, {
        destinationUrl,
        reason: reason || undefined,
      });
      return true;
    });
    if (done) onDone();
  }

  return (
    <Modal title={`Change destination: /go/${link.cloakedSlug}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        {error && <ErrorNote message={error} />}
        <p className="text-xs text-slate-500">
          Current: <span className="font-mono">{link.destinationUrl}</span>
        </p>
        <Field label="New destination URL" required>
          <TextInput value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} required />
        </Field>
        <Field label="Reason (stored in history)">
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. new campaign tracking link" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Change destination'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
