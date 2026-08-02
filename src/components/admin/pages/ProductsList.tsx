// All products — filterable list with table/grid views and pagination.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { api, dataApi, type EntityRow } from '../api';
import { resolveMediaUrl } from '../../../lib/media/url';
import { ConfirmDialog } from '../ConfirmDialog';
import { useCan } from '../context';
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  Icon,
  Spinner,
  fmtDate,
  statusTone,
} from '../ui';

type PillFilter = 'all' | 'drafts' | 'published' | 'needs_testing' | 'missing_seo';
type ViewMode = 'list' | 'grid';
type SortKey = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc';

const PAGE_SIZE_DEFAULT = 20;

const PILL_FILTERS: { id: PillFilter; label: string; tone?: 'amber' | 'red' }[] = [
  { id: 'all', label: 'All' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'needs_testing', label: 'Needs testing', tone: 'amber' },
  { id: 'missing_seo', label: 'Missing SEO', tone: 'red' },
];

export function ProductsListPage() {
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [pill, setPill] = useState<PillFilter>(() => initialPill(searchParams));
  const [statusFilter, setStatusFilter] = useState(() => initialStatus(searchParams));
  const [directoryFilter, setDirectoryFilter] = useState(() => searchParams.get('directory') ?? 'all');
  const [sort, setSort] = useState<SortKey>(() => (searchParams.get('sort') as SortKey) || 'updated_desc');
  const [view, setView] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draftConfirmProduct, setDraftConfirmProduct] = useState<EntityRow | null>(null);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);
  const can = useCan();
  const canDelete = can('records.delete');
  const canPublish = can('content.publish');

  function reloadProducts() {
    setError(null);
    return dataApi
      .list('products')
      .then((r) => setRows(r.rows))
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    reloadProducts();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('q') ?? '');
    setPill(initialPill(searchParams));
    setStatusFilter(initialStatus(searchParams));
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, pill, statusFilter, directoryFilter, sort]);

  const pillCounts = useMemo(() => {
    if (!rows) return null;
    return {
      all: rows.length,
      drafts: rows.filter((r) => r.status === 'draft' || r.status === 'in_review').length,
      published: rows.filter((r) => r.status === 'published').length,
      needs_testing: rows.filter((r) => !r.lastTestedAt).length,
      missing_seo: rows.filter(
        (r) => r.status === 'published' && (!r.seoTitle || !r.seoDescription),
      ).length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    let list = [...rows];

    if (pill === 'drafts') {
      list = list.filter((r) => r.status === 'draft' || r.status === 'in_review');
    } else if (pill === 'published') {
      list = list.filter((r) => r.status === 'published');
    } else if (pill === 'needs_testing') {
      list = list.filter((r) => !r.lastTestedAt);
    } else if (pill === 'missing_seo') {
      list = list.filter((r) => r.status === 'published' && (!r.seoTitle || !r.seoDescription));
    }

    if (statusFilter !== 'all') {
      list = list.filter((r) => String(r.status) === statusFilter);
    }

    if (directoryFilter === 'in') {
      list = list.filter((r) => r.publishedInDirectory);
    } else if (directoryFilter === 'out') {
      list = list.filter((r) => !r.publishedInDirectory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        `${r.name} ${r.slug} ${r.status}`.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      switch (sort) {
        case 'updated_asc':
          return Number(a.updatedAt ?? 0) - Number(b.updatedAt ?? 0);
        case 'name_asc':
          return String(a.name).localeCompare(String(b.name));
        case 'name_desc':
          return String(b.name).localeCompare(String(a.name));
        default:
          return Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0);
      }
    });

    return list;
  }, [rows, pill, statusFilter, directoryFilter, search, sort]);

  const totalPages = filtered ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const paged = filtered?.slice((safePage - 1) * pageSize, safePage * pageSize) ?? null;

  function updatePill(next: PillFilter) {
    setPill(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('pill');
    else params.set('pill', next);
    setSearchParams(params, { replace: true });
  }

  async function deleteProduct(product: EntityRow) {
    const name = String(product.name ?? 'this product');
    const published = product.status === 'published';
    const ok = confirm(
      `Are you sure you want to delete "${name}"?\n\n` +
        (published
          ? 'This product is published — it will be removed from the site and admin.'
          : 'This will permanently remove the product and all related data (review, media, affiliate links, test runs, etc.).') +
        '\n\nThis cannot be undone.',
    );
    if (!ok) return;

    setMenuOpen(null);
    setDeletingId(product.id);
    try {
      await dataApi.remove('products', product.id);
      await reloadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingId(null);
    }
  }

  async function moveToDraft(product: EntityRow) {
    setDraftConfirmProduct(null);
    setMenuOpen(null);
    setUnpublishingId(product.id);
    try {
      await api.del(`/api/admin/products/${product.id}/publish`);
      await reloadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUnpublishingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">All products</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            One canonical record per platform — reviews, directory, roundups, and homepage all read
            from here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 !text-[18px] text-slate-400"
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, slugs…"
              className="admin-input w-52 rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-14 text-sm dark:border-slate-700 dark:bg-slate-900 md:w-64"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline dark:border-slate-600 dark:bg-slate-800">
              ⌘K
            </kbd>
          </div>
          <Link to="/products/new">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700 dark:bg-pink-600 dark:hover:bg-pink-500"
            >
              <Icon name="add" className="!text-[18px]" />
              <span className="hidden sm:inline">Add product</span>
              <span className="sm:hidden">Add</span>
            </button>
          </Link>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {/* Filters bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {PILL_FILTERS.map((f) => {
            const count = pillCounts?.[f.id];
            const active = pill === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => updatePill(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900 dark:bg-pink-950/50 dark:text-pink-300'
                    : f.tone === 'amber'
                      ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30'
                      : f.tone === 'red'
                        ? 'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
                {count != null && <span className="ml-1 tabular-nums opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'in_review', label: 'In review' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
          <FilterSelect
            label="Directory"
            value={directoryFilter}
            onChange={setDirectoryFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'in', label: 'In directory' },
              { value: 'out', label: 'Not in directory' },
            ]}
          />
          <FilterSelect
            label="Sort by"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: 'updated_desc', label: 'Updated (newest)' },
              { value: 'updated_asc', label: 'Updated (oldest)' },
              { value: 'name_asc', label: 'Name (A–Z)' },
              { value: 'name_desc', label: 'Name (Z–A)' },
            ]}
          />
          <div className="ml-1 flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            <ViewToggle active={view === 'list'} onClick={() => setView('list')} icon="view_list" label="List" />
            <ViewToggle active={view === 'grid'} onClick={() => setView('grid')} icon="grid_view" label="Grid" />
          </div>
        </div>
      </div>

      {/* Table / grid */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {!paged ? (
          <div className="p-8">
            <Spinner />
          </div>
        ) : paged.length === 0 ? (
          <EmptyState message="No products match your filters." />
        ) : view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Directory</th>
                  <th className="px-4 py-3">Last tested</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    menuOpen={menuOpen === p.id}
                    deleting={deletingId === p.id}
                    unpublishing={unpublishingId === p.id}
                    canDelete={canDelete}
                    canPublish={canPublish}
                    onMenuToggle={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                    onMenuClose={() => setMenuOpen(null)}
                    onDelete={() => deleteProduct(p)}
                    onMoveToDraft={() => {
                      setMenuOpen(null);
                      setDraftConfirmProduct(p);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paged.map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination footer */}
        {filtered && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of{' '}
              {filtered.length} products
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 enabled:hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:enabled:hover:bg-slate-800"
                aria-label="Previous page"
              >
                <Icon name="chevron_left" className="!text-[20px]" />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300">
                {safePage}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 enabled:hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:enabled:hover:bg-slate-800"
                aria-label="Next page"
              >
                <Icon name="chevron_right" className="!text-[20px]" />
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="ml-2 rounded-md border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                {[20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {draftConfirmProduct && (
        <ConfirmDialog
          title={`Move "${draftConfirmProduct.name}" to draft?`}
          message="This will remove the product from all public placements. The review page and admin record will remain — you can republish later."
          confirmLabel={unpublishingId ? 'Moving…' : 'Move to draft'}
          danger
          onCancel={() => setDraftConfirmProduct(null)}
          onConfirm={() => void moveToDraft(draftConfirmProduct)}
        >
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-slate-600 dark:text-slate-400">
            <li>Public review page removed from the site</li>
            <li>Removed from the app directory</li>
            <li>Removed from homepage top picks</li>
            <li>Featured characters removed from the homepage</li>
            <li>Removed from roundup / best-of pages</li>
            <li>Editor&apos;s pick badge cleared</li>
          </ul>
        </ConfirmDialog>
      )}
    </div>
  );
}

function ProductLogo({ product }: { product: EntityRow }) {
  const url = resolveMediaUrl(product.logo) || undefined;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon name="inventory_2" className="!text-[18px] text-slate-400" />
      )}
    </span>
  );
}

function ProductRow({
  product: p,
  menuOpen,
  deleting,
  unpublishing,
  canDelete,
  canPublish,
  onMenuToggle,
  onMenuClose,
  onDelete,
  onMoveToDraft,
}: {
  product: EntityRow;
  menuOpen: boolean;
  deleting: boolean;
  unpublishing: boolean;
  canDelete: boolean;
  canPublish: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onDelete: () => void;
  onMoveToDraft: () => void;
}) {
  const reviewUrl = p.status === 'published' && p.slug ? `/reviews/${p.slug}` : null;

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ProductLogo product={p} />
          <Link to={`/products/${p.id}`} className="font-medium text-slate-900 hover:text-pink-600 dark:text-slate-100">
            {p.name}
          </Link>
          {p.editorsPick && <Badge tone="pink">Pick</Badge>}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">/{p.slug}</td>
      <td className="px-4 py-3">
        <Badge tone={statusTone(String(p.status))}>{String(p.status).replace('_', ' ')}</Badge>
      </td>
      <td className="px-4 py-3">
        {p.publishedInDirectory ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
            <Icon name="check_circle" className="!text-[16px]" /> In directory
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Icon name="cancel" className="!text-[16px]" /> Not in directory
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <LastTestedCell lastTestedAt={p.lastTestedAt} />
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{fmtDate(p.updatedAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Link to={`/products/${p.id}`}>
            <button
              type="button"
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-pink-200 hover:text-pink-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              Edit
            </button>
          </Link>
          {reviewUrl ? (
            <a
              href={reviewUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:border-pink-200 hover:text-pink-600 dark:border-slate-700 dark:text-slate-400"
              title="View live page"
            >
              <Icon name="open_in_new" className="!text-[18px]" />
            </a>
          ) : (
            <span
              className="rounded-md border border-transparent p-1.5 text-slate-300 dark:text-slate-600"
              title="Not published"
            >
              <Icon name="open_in_new" className="!text-[18px]" />
            </span>
          )}
          <ProductActionsMenu
            open={menuOpen}
            onToggle={onMenuToggle}
            onClose={onMenuClose}
          >
            <MenuLink to={`/products/${p.id}`} icon="edit" onClick={onMenuClose}>
              Edit product
            </MenuLink>
            <MenuLink to={`/testing/runs?product=${p.id}`} icon="science" onClick={onMenuClose}>
              Test runs
            </MenuLink>
            <MenuLink to={`/products/${p.id}/pricing`} icon="payments" onClick={onMenuClose}>
              Pricing
            </MenuLink>
            <MenuLink to={`/products/${p.id}/media`} icon="perm_media" onClick={onMenuClose}>
              Media
            </MenuLink>
            {reviewUrl && (
              <li>
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={onMenuClose}
                >
                  <Icon name="open_in_new" className="!text-[16px]" /> View live page
                </a>
              </li>
            )}
            {canPublish && p.status === 'published' && (
              <>
                <li className="my-1 border-t border-slate-100 dark:border-slate-800" aria-hidden />
                <li>
                  <button
                    type="button"
                    disabled={unpublishing}
                    onClick={onMoveToDraft}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  >
                    <Icon name="undo" className="!text-[16px]" />
                    {unpublishing ? 'Moving to draft…' : 'Move to draft'}
                  </button>
                </li>
              </>
            )}
            {canDelete && (
              <>
                <li className="my-1 border-t border-slate-100 dark:border-slate-800" aria-hidden />
                <li>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={onDelete}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <Icon name="delete" className="!text-[16px]" />
                    {deleting ? 'Deleting…' : 'Delete product'}
                  </button>
                </li>
              </>
            )}
          </ProductActionsMenu>
        </div>
      </td>
    </tr>
  );
}

function ProductActionsMenu({
  open,
  onToggle,
  onClose,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const estimatedMenu = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < estimatedMenu && rect.top > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      top: openAbove ? rect.top - gap : rect.bottom + gap,
      right: window.innerWidth - rect.right,
      zIndex: 100,
      transform: openAbove ? 'translateY(-100%)' : undefined,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    function onMove() {
      reposition();
    }
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="More actions"
        aria-expanded={open}
      >
        <Icon name="more_vert" className="!text-[20px]" />
      </button>
      {open &&
        menuStyle &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={onClose} aria-hidden />
            <ul
              ref={menuRef}
              style={menuStyle}
              className="min-w-[10rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              {children}
            </ul>
          </>,
          document.body,
        )}
    </>
  );
}

function ProductGridCard({ product: p }: { product: EntityRow }) {
  const reviewUrl = p.status === 'published' && p.slug ? `/reviews/${p.slug}` : null;
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex items-start gap-3">
        <ProductLogo product={p} />
        <div className="min-w-0 flex-1">
          <Link to={`/products/${p.id}`} className="block truncate font-semibold text-slate-900 hover:text-pink-600 dark:text-slate-100">
            {p.name}
          </Link>
          <p className="truncate font-mono text-xs text-slate-400">/{p.slug}</p>
          <div className="mt-2">
            <Badge tone={statusTone(String(p.status))}>{String(p.status).replace('_', ' ')}</Badge>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
        <span>{fmtDate(p.updatedAt)}</span>
        <div className="flex gap-1">
          <Link to={`/products/${p.id}`}>
            <Button variant="secondary" className="!px-2 !py-1 text-xs">
              Edit
            </Button>
          </Link>
          {reviewUrl && (
            <a href={reviewUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost" className="!px-1.5 !py-1">
                <Icon name="open_in_new" className="!text-[16px]" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function LastTestedCell({ lastTestedAt }: { lastTestedAt?: number }) {
  if (!lastTestedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        Not tested
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      {fmtDate(lastTestedAt)}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="hidden sm:inline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`rounded-md p-1.5 transition-colors ${
        active
          ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400'
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      <Icon name={icon} className="!text-[18px]" />
    </button>
  );
}

function MenuLink({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={onClick}
      >
        <Icon name={icon} className="!text-[16px]" /> {children}
      </Link>
    </li>
  );
}

function initialPill(params: URLSearchParams): PillFilter {
  const s = params.get('status');
  if (s === 'draft') return 'drafts';
  if (s === 'published') return 'published';
  const pill = params.get('pill') as PillFilter | null;
  if (pill && PILL_FILTERS.some((f) => f.id === pill)) return pill;
  return 'all';
}

function initialStatus(params: URLSearchParams): string {
  const s = params.get('status');
  if (!s || s === 'draft' || s === 'published') return 'all';
  return s;
}
