import { Link } from 'react-router-dom';
import { Badge, Icon, statusTone } from './ui';

interface ProductSummarySidebarProps {
  fields: Record<string, any>;
  isNew: boolean;
  productId?: string;
  showPreview: boolean;
  previewUrl?: string;
}

export function ProductSummarySidebar({
  fields,
  isNew,
  productId,
  showPreview,
  previewUrl,
}: ProductSummarySidebarProps) {
  const saved = Boolean(!isNew && productId);

  return (
    <aside className="xl:sticky xl:top-36 xl:self-start">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Product Summary</h3>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <Badge tone={statusTone(String(fields.status ?? 'draft'))}>{fields.status ?? 'draft'}</Badge>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Slug</dt>
            <dd className="truncate font-mono text-xs text-slate-800 dark:text-slate-200">
              {fields.slug ? `/${fields.slug}` : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Last updated</dt>
            <dd className="text-slate-800 dark:text-slate-200">
              {fields.updatedAt ? fmtRelative(fields.updatedAt) : isNew ? 'Just now' : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Created</dt>
            <dd className="text-slate-800 dark:text-slate-200">
              {fields.createdAt ? fmtRelative(fields.createdAt) : isNew ? 'Just now' : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick links</p>
          <ul className="space-y-1.5 text-sm">
            {productId ? (
              <>
                <QuickLink to={`/products/${productId}/media`} label="Media" icon="perm_media" saved={saved} />
                <QuickLink to={`/products/${productId}/pricing`} label="Pricing" icon="payments" saved={saved} />
              </>
            ) : (
              <>
                <QuickLink to="/products" label="Media" icon="perm_media" saved={false} />
                <QuickLink to="/products" label="Pricing" icon="payments" saved={false} />
              </>
            )}
            <QuickLink to="/products" label="All products" icon="inventory_2" saved />
            {showPreview && previewUrl ? (
              <li>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-medium text-pink-600 hover:underline dark:text-pink-400"
                >
                  <Icon name="open_in_new" className="!text-[16px]" /> Preview product
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-gradient-to-br from-pink-50/80 to-white p-4 dark:border-slate-800 dark:from-pink-950/20 dark:to-slate-900">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Need help?</p>
        <p className="mt-1 text-xs text-slate-500">See how product records connect to reviews, tests, and publishing.</p>
        <a
          href="/editorial-process"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-pink-600 hover:underline dark:text-pink-400"
        >
          View guide <Icon name="menu_book" className="!text-[14px]" />
        </a>
      </div>
    </aside>
  );
}

function QuickLink({
  to,
  label,
  icon,
  saved,
}: {
  to: string;
  label: string;
  icon: string;
  saved?: boolean;
}) {
  if (!saved) {
    return (
      <li className="flex items-center gap-2 text-slate-400" title="Save the product first">
        <Icon name={icon} className="!text-[16px]" />
        <span>{label}</span>
      </li>
    );
  }
  return (
    <li>
      <Link to={to} className="flex items-center gap-2 text-slate-700 hover:text-pink-600 dark:text-slate-300">
        <Icon name={icon} className="!text-[16px]" /> {label}
      </Link>
    </li>
  );
}

function fmtRelative(ms: number): string {
  const diff = Date.now() - Number(ms);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(Number(ms)).toLocaleDateString();
}
