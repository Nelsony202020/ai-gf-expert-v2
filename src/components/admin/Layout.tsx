// Admin layout: collapsible sidebar + routed content area.

import { useEffect, useMemo, useState } from 'react';
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getAuthor } from '../../data/authors';
import { useMe, useCan, type Me } from './context';
import { AdminLogo } from './AdminLogo';
import { NotificationBell } from './Notifications';
import { Icon } from './ui';
import { EntityPage } from './EntityPage';
import {
  authorsModule,
  methodologyVersionsModule,
  categoriesModule,
  subscoresModule,
  evidenceDefinitionsModule,
  adminUsersModule,
} from './modules';
import { lazy, Suspense } from 'react';
import { AdminErrorBoundary } from './ErrorBoundary';
import { Spinner } from './ui';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const ProductsPage = lazy(() => import('./pages/Products').then((m) => ({ default: m.ProductsPage })));
const NewProductPage = lazy(() =>
  import('./pages/NewProduct').then((m) => ({ default: m.NewProductPage })),
);
const ProductWorkspace = lazy(() =>
  import('./workspace/ProductWorkspace').then((m) => ({ default: m.ProductWorkspace })),
);
const TestRunsPage = lazy(() =>
  import('./pages/TestRuns').then((m) => ({ default: m.TestRunsPage })),
);
const TestRunDetail = lazy(() =>
  import('./pages/TestRuns').then((m) => ({ default: m.TestRunDetail })),
);
const HomepagePage = lazy(() =>
  import('./pages/Homepage').then((m) => ({ default: m.HomepagePage })),
);
const RedirectsPage = lazy(() =>
  import('./pages/Redirects').then((m) => ({ default: m.RedirectsPage })),
);
const AffiliateLinksPage = lazy(() =>
  import('./pages/AffiliateLinks').then((m) => ({ default: m.AffiliateLinksPage })),
);
const SeoMetadataPage = lazy(() =>
  import('./pages/Seo').then((m) => ({ default: m.SeoMetadataPage })),
);
const SeoIndexingPage = lazy(() =>
  import('./pages/Seo').then((m) => ({ default: m.SeoIndexingPage })),
);
const AuditPage = lazy(() => import('./pages/Audit').then((m) => ({ default: m.AuditPage })));
const RolesPage = lazy(() => import('./pages/Roles').then((m) => ({ default: m.RolesPage })));
const ComingSoon = lazy(() => import('./pages/ComingSoon').then((m) => ({ default: m.ComingSoon })));

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';
const SIDEBAR_EXPANDED_W = '15rem'; // w-60
const SIDEBAR_COLLAPSED_W = '5rem';

function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}
interface NavItem {
  to: string;
  label: string;
  /** Hide unless the user has this permission. */
  permission?: string;
}
interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
  /** Hide the whole group unless the user has this permission. */
  permission?: string;
}

const NAV: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    items: [
      { to: '/', label: 'Overview' },
      { to: '/homepage', label: 'Homepage', permission: 'homepage.edit' },
    ],
  },
  {
    label: 'Products',
    icon: 'inventory_2',
    items: [
      { to: '/products', label: 'All products' },
      { to: '/products/new', label: 'Add product', permission: 'content.edit' },
    ],
  },
  {
    label: 'Testing',
    icon: 'science',
    items: [
      { to: '/testing/runs', label: 'Test runs' },
      {
        to: '/testing/evidence-definitions',
        label: 'Evidence definitions',
        permission: 'methodology.edit',
      },
      { to: '/testing/categories', label: 'Categories', permission: 'methodology.edit' },
      { to: '/testing/subscores', label: 'Subscores', permission: 'methodology.edit' },
      {
        to: '/testing/methodology-versions',
        label: 'Methodology versions',
        permission: 'methodology.edit',
      },
    ],
  },
  {
    label: 'SEO',
    icon: 'travel_explore',
    permission: 'seo.edit',
    items: [
      { to: '/seo/metadata', label: 'Metadata' },
      { to: '/seo/redirects', label: 'Redirects', permission: 'redirects.edit' },
      { to: '/seo/indexing', label: 'Canonicals & indexing' },
    ],
  },
  {
    label: 'Monetization',
    icon: 'payments',
    permission: 'affiliates.edit',
    items: [
      { to: '/monetization/affiliate-links', label: 'Affiliate links' },
      { to: '/monetization/link-performance', label: 'Link performance' },
    ],
  },
  {
    label: 'Administration',
    icon: 'admin_panel_settings',
    permission: 'audit.view',
    items: [
      { to: '/administration/users', label: 'Users', permission: 'users.manage' },
      { to: '/administration/roles', label: 'Roles', permission: 'users.manage' },
      { to: '/administration/audit', label: 'Audit log' },
    ],
  },
];

function groupForPath(pathname: string): string {
  if (pathname === '/' || pathname === '' || pathname === '/homepage') return 'Dashboard';
  const seg = pathname.split('/').filter(Boolean)[0];
  const map: Record<string, string> = {
    products: 'Products',
    testing: 'Testing',
    seo: 'SEO',
    monetization: 'Monetization',
    administration: 'Administration',
    homepage: 'Dashboard',
  };
  return map[seg] ?? 'Dashboard';
}

function adminAvatarUrl(me: Me): string | null {
  const email = me.email.toLowerCase();
  const herman = getAuthor('herman-carter');
  if (!herman) return null;
  if (email === herman.email.toLowerCase() || email.includes('herman')) {
    return herman.avatar;
  }
  return null;
}

function AdminUserAvatar({ me }: { me: Me }) {
  const avatarUrl = adminAvatarUrl(me);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full bg-pink-100 object-cover dark:bg-pink-950"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-700 dark:bg-pink-950 dark:text-pink-300">
      {me.email?.[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

export function AdminLayout({ onSignOut }: { onSignOut: () => void }) {
  const me = useMe();
  const can = useCan();
  const location = useLocation();
  const activeGroup = useMemo(() => groupForPath(location.pathname), [location.pathname]);
  const [collapsed, setCollapsed] = useState(loadSidebarCollapsed);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV.map((g) => [g.label, g.label === activeGroup])),
  );

  const visibleNav = useMemo(
    () =>
      NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || can(item.permission)),
      })).filter(
        (group) =>
          (!group.permission || can(group.permission)) &&
          (group.label === 'Dashboard' || group.items.length > 0),
      ),
    [can],
  );

  useEffect(() => {
    setOpenGroups((prev) => ({ ...prev, [activeGroup]: true }));
  }, [activeGroup]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function toggleCollapsed() {
    setCollapsed((c) => !c);
  }

  function expandSidebar(groupLabel?: string) {
    setCollapsed(false);
    if (groupLabel) {
      setOpenGroups((prev) => ({ ...prev, [groupLabel]: true }));
    }
  }

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside
        style={{ width: sidebarW }}
        className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex h-14 shrink-0 items-center gap-1.5 border-b border-slate-100 px-2 dark:border-slate-800">
          <div className={collapsed ? 'shrink-0' : 'min-w-0 flex-1'}>
            <AdminLogo variant="sidebar" compact={collapsed} />
          </div>
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleCollapsed}
            className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon
              name={collapsed ? 'right_panel_open' : 'left_panel_close'}
              className="!text-[20px]"
            />
          </button>
        </div>

        <div className={`shrink-0 border-b border-slate-100 dark:border-slate-800 ${collapsed ? 'px-1 py-2' : 'px-2 py-2'}`}>
          <NotificationBell compact={collapsed} />
        </div>

        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-1' : 'px-2'}`}>
          {visibleNav.map((group) => {
            const isOpen = openGroups[group.label] ?? false;
            const isSingle = group.items.length === 1 && group.label === 'Dashboard';
            const groupActive = activeGroup === group.label;

            if (collapsed) {
              if (isSingle) {
                const item = group.items[0];
                return (
                  <NavLink
                    key={group.label}
                    to={item.to}
                    end
                    title={group.label}
                    onClick={() => expandSidebar(group.label)}
                    className={({ isActive }) =>
                      `mb-2 flex justify-center rounded-lg p-2 transition-colors ${
                        isActive
                          ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon name={group.icon} className="!text-[20px]" />
                  </NavLink>
                );
              }

              return (
                <div key={group.label} className="relative mb-1" data-sidebar-group>
                  <button
                    type="button"
                    title={group.label}
                    onClick={() => expandSidebar(group.label)}
                    className={`flex w-full justify-center rounded-lg p-2 transition-colors ${
                      groupActive
                        ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon name={group.icon} className="!text-[20px]" />
                  </button>
                </div>
              );
            }

            if (isSingle) {
              const item = group.items[0];
              return (
                <NavLink
                  key={group.label}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `mb-3 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon name={group.icon} className="!text-[18px]" />
                  {group.label}
                </NavLink>
              );
            }
            return (
              <div key={group.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors ${
                    groupActive
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon name={group.icon} className="!text-[18px]" />
                  <span className="flex-1">{group.label}</span>
                  <Icon
                    name="expand_more"
                    className={`!text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="mb-2 ml-2 space-y-0.5 border-l border-slate-100 pl-2 dark:border-slate-800">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/products'}
                        className={({ isActive }) =>
                          `block rounded-md px-2 py-1.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-pink-50 font-medium text-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/80'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`border-t border-slate-100 dark:border-slate-800 ${collapsed ? 'px-1 py-2' : 'px-3 py-3'}`}>
          {collapsed ? (
            <>
              <div className="flex justify-center py-1" title={me.name || me.email}>
                <AdminUserAvatar me={me} />
              </div>
              <button
                type="button"
                aria-label="Sign out"
                title="Sign out"
                onClick={onSignOut}
                className="mt-1 flex w-full justify-center rounded-lg p-2 text-pink-600 transition-colors hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-950/30"
              >
                <Icon name="logout" className="!text-[18px]" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800/60">
                <AdminUserAvatar me={me} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                    {me.name || me.email?.split('@')[0]}
                  </p>
                  <p className="truncate text-xs capitalize text-slate-400">{me.role}</p>
                </div>
              </div>
              <button
                className="mt-2 w-full text-left text-xs font-medium text-pink-600 hover:underline dark:text-pink-400"
                onClick={onSignOut}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </aside>

      <main
        style={{ marginLeft: sidebarW }}
        className="min-w-0 flex-1 p-4 transition-[margin] duration-200 md:p-6"
      >
        <AdminErrorBoundary>
          <Suspense fallback={<Spinner />}>
            <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/homepage" element={<HomepagePage />} />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<NewProductPage />} />
          <Route path="/products/pricing" element={<Navigate to="/products" replace />} />
          <Route path="/products/characters" element={<Navigate to="/products" replace />} />
          <Route path="/products/media" element={<Navigate to="/products" replace />} />
          {/* Product workspace: /products/{id}/{setup|pricing|testing|verdict|review|media|characters|seo|publish} */}
          <Route path="/products/:id" element={<ProductWorkspace />} />
          <Route path="/products/:id/:tab" element={<ProductWorkspace />} />

          <Route path="/testing/runs" element={<TestRunsPage />} />
          <Route path="/testing/runs/:id" element={<TestRunDetail />} />
          <Route
            path="/testing/evidence-definitions"
            element={<EntityPage config={evidenceDefinitionsModule} />}
          />
          <Route path="/testing/categories" element={<EntityPage config={categoriesModule} />} />
          <Route path="/testing/subscores" element={<EntityPage config={subscoresModule} />} />
          <Route
            path="/testing/methodology-versions"
            element={<EntityPage config={methodologyVersionsModule} />}
          />

          <Route
            path="/content/comparisons"
            element={
              <ComingSoon
                title="Comparisons"
                note="Comparison pages are future-ready: products already expose structured scores, specs, and pricing, so this module can be added without schema changes."
              />
            }
          />
          <Route path="/content/homepage" element={<Navigate to="/homepage" replace />} />
          <Route path="/content/reviews" element={<Navigate to="/products" replace />} />
          <Route path="/content/roundups" element={<Navigate to="/" replace />} />
          <Route path="/content/roundups/:id" element={<Navigate to="/" replace />} />
          <Route path="/content/authors" element={<EntityPage config={authorsModule} />} />

          <Route path="/seo/metadata" element={<SeoMetadataPage />} />
          <Route path="/seo/redirects" element={<RedirectsPage />} />
          <Route path="/seo/indexing" element={<SeoIndexingPage />} />

          <Route path="/monetization/affiliate-links" element={<AffiliateLinksPage />} />
          <Route
            path="/monetization/link-performance"
            element={
              <ComingSoon
                title="Link performance"
                note="Click counts are already recorded on /go/ redirects. Performance charts land in Phase 6+."
              />
            }
          />

          <Route path="/administration/users" element={<EntityPage config={adminUsersModule} />} />
          <Route path="/administration/roles" element={<RolesPage />} />
          <Route path="/administration/audit" element={<AuditPage />} />
          <Route path="/administration/settings" element={<Navigate to="/" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AdminErrorBoundary>
      </main>
    </div>
  );
}
