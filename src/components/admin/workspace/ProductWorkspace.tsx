// Product workspace shell: one coherent editor for a whole product review.
// Data stays in separate entities behind the scenes — this shell loads the
// product plus related records and routes between the nine workspace tabs.

import { lazy, Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AdminErrorBoundary } from '../ErrorBoundary';
import { ErrorNote, Spinner } from '../ui';
import { WorkspaceProvider, useProductWorkspaceState } from './context';
import { ProductWorkspaceHeader } from './ProductWorkspaceHeader';
import { WORKSPACE_TABS, type WorkspaceTabId } from './completion';

const SetupTab = lazy(() => import('./tabs/SetupTab').then((m) => ({ default: m.SetupTab })));
const TestingTab = lazy(() => import('./tabs/TestingTab').then((m) => ({ default: m.TestingTab })));
const VerdictTab = lazy(() => import('./tabs/VerdictTab').then((m) => ({ default: m.VerdictTab })));
const ReviewTab = lazy(() => import('./tabs/ReviewTab').then((m) => ({ default: m.ReviewTab })));
const MediaTab = lazy(() => import('./tabs/MediaTab').then((m) => ({ default: m.MediaTab })));
const CharactersTab = lazy(() =>
  import('./tabs/CharactersTab').then((m) => ({ default: m.CharactersTab })),
);
const PricingTab = lazy(() => import('./tabs/PricingTab').then((m) => ({ default: m.PricingTab })));
const SeoTab = lazy(() => import('./tabs/SeoTab').then((m) => ({ default: m.SeoTab })));
const PublishTab = lazy(() => import('./tabs/PublishTab').then((m) => ({ default: m.PublishTab })));

const TAB_IDS = WORKSPACE_TABS.map((t) => t.id) as string[];

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

  if (ws.loading) return <Spinner />;
  if (!ws.original) {
    return <ErrorNote message={ws.saveError ?? 'Product not found.'} />;
  }

  return (
    <WorkspaceProvider value={ws}>
      <div className="space-y-4">
        <ProductWorkspaceHeader />
        {ws.saveError && <ErrorNote message={ws.saveError} />}
        <AdminErrorBoundary>
          <Suspense fallback={<Spinner />}>
            {tab === 'setup' && <SetupTab />}
            {tab === 'testing' && <TestingTab />}
            {tab === 'verdict' && <VerdictTab />}
            {tab === 'review' && <ReviewTab />}
            {tab === 'media' && <MediaTab />}
            {tab === 'characters' && <CharactersTab />}
            {tab === 'pricing' && <PricingTab />}
            {tab === 'seo' && <SeoTab />}
            {tab === 'publish' && <PublishTab />}
          </Suspense>
        </AdminErrorBoundary>
      </div>
    </WorkspaceProvider>
  );
}
