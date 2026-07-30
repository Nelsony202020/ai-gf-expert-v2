// Product workspace shell: one coherent editor for a whole product review.
// Data stays in separate entities behind the scenes — this shell loads the
// product plus related records and routes between the nine workspace tabs.

import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AdminErrorBoundary } from '../ErrorBoundary';
import { lazyImport } from '../lazyImport';
import { ErrorNote, Spinner } from '../ui';
import { useToast } from '../Toast';
import { WorkspaceProvider, useProductWorkspaceState, useWorkspace } from './context';
import { WorkflowMobileButton } from './CompletionSidebar';
import { ProductWorkspaceHeader } from './ProductWorkspaceHeader';
import { WORKSPACE_TABS, type WorkspaceTabId } from './completion';

const SetupTab = lazy(() => import('./tabs/SetupTab').then((m) => ({ default: m.SetupTab })));
const TestingTab = lazy(() => import('./tabs/TestingTab').then((m) => ({ default: m.TestingTab })));
const VerdictTab = lazy(() => import('./tabs/VerdictTab').then((m) => ({ default: m.VerdictTab })));
const ReviewTab = lazyImport(
  () => import('./tabs/ReviewTab').then((m) => ({ default: m.ReviewTab })),
  'ReviewTab',
);
const MediaTab = lazy(() => import('./tabs/MediaTab').then((m) => ({ default: m.MediaTab })));
const CharactersTab = lazy(() =>
  import('./tabs/CharactersTab').then((m) => ({ default: m.CharactersTab })),
);
const PricingTab = lazy(() => import('./tabs/PricingTab').then((m) => ({ default: m.PricingTab })));
const SeoTab = lazy(() => import('./tabs/SeoTab').then((m) => ({ default: m.SeoTab })));
const PublishTab = lazy(() => import('./tabs/PublishTab').then((m) => ({ default: m.PublishTab })));

const TAB_IDS = WORKSPACE_TABS.map((t) => t.id) as string[];

function TabLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 py-12">
      <Spinner />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading {label}…</p>
    </div>
  );
}

const TAB_LABELS: Record<WorkspaceTabId, string> = Object.fromEntries(
  WORKSPACE_TABS.map((t) => [t.id, t.label]),
) as Record<WorkspaceTabId, string>;

export function ProductWorkspace() {
  const { id, tab } = useParams();

  if (!id) return <Navigate to="/products" replace />;
  if (!tab || !TAB_IDS.includes(tab)) {
    return <Navigate to={`/products/${id}/setup`} replace />;
  }

  return <WorkspaceInner key={id} productId={id} tab={tab as WorkspaceTabId} />;
}

function WorkspaceInner({ productId, tab }: { productId: string; tab: WorkspaceTabId }) {
  const ws = useProductWorkspaceState(productId);
  const [tabLoadKey, setTabLoadKey] = useState(0);

  if (ws.loading) return <Spinner />;
  if (!ws.original) {
    return <ErrorNote message={ws.saveError ?? 'Product not found.'} />;
  }

  return (
    <WorkspaceProvider value={ws}>
      <WorkspaceSaveErrorToast />
      <div className="space-y-4">
        <ProductWorkspaceHeader />
        <AdminErrorBoundary onReset={() => setTabLoadKey((k) => k + 1)}>
          <Suspense
            fallback={<TabLoading label={TAB_LABELS[tab]} />}
            key={`${tab}-${tabLoadKey}`}
          >
            {tab === 'setup' && <SetupTab />}
            {tab === 'pricing' && <PricingTab />}
            {tab === 'testing' && <TestingTab />}
            {tab === 'verdict' && <VerdictTab />}
            {tab === 'review' && <ReviewTab />}
            {tab === 'media' && <MediaTab />}
            {tab === 'characters' && <CharactersTab />}
            {tab === 'seo' && <SeoTab />}
            {tab === 'publish' && <PublishTab />}
          </Suspense>
        </AdminErrorBoundary>
        <WorkflowMobileButton />
      </div>
    </WorkspaceProvider>
  );
}

function WorkspaceSaveErrorToast() {
  const { saveError, clearSaveError } = useWorkspace();
  const toast = useToast();
  useEffect(() => {
    if (saveError) {
      toast.error(saveError);
      clearSaveError();
    }
  }, [saveError, clearSaveError, toast]);
  return null;
}
