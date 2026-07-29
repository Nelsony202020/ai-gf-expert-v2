// Compact workflow status labels for the product workspace sidebar.

import type { EntityRow } from '../../api';
import type { ProductCompletion, TabCompletion, WorkspaceTabId } from '../completion';
import { tabVisualStatus } from '../completion';

export interface SidebarContext {
  completion: ProductCompletion;
  fields: Record<string, unknown>;
  characters: EntityRow[];
  media: EntityRow[];
  plans: EntityRow[];
  pricingSnapshots: EntityRow[];
  review: EntityRow | null;
  status: string;
}

function setupStatus(tab: TabCompletion): string {
  if (tab.pct === 100) return 'Complete';
  if (tab.missingRequired.length > 0) return 'Missing fields';
  if (tab.pct !== null && tab.pct >= 80) return 'Almost done';
  return 'In progress';
}

function testingStatus(tab: TabCompletion, hasPublishedRun: boolean): string {
  if (hasPublishedRun) return 'Published';
  if (tab.filled === 0) return 'Not started';
  return 'In progress';
}

function verdictStatus(tab: TabCompletion): string {
  if (tab.pct === 100) return 'Complete';
  if (tab.filled === 0) return 'Not started';
  return `${tab.filled}/${tab.total} sections`;
}

function reviewStatus(review: EntityRow | null, tab: TabCompletion): string {
  if (!review || tab.filled === 0) return 'Not started';
  if (tab.pct === 100) return 'Complete';
  return 'Draft';
}

function mediaStatus(media: EntityRow[]): string {
  const count = media.filter((m) => !m.deletedAt).length;
  if (count === 0) return 'No files';
  return `${count} file${count === 1 ? '' : 's'}`;
}

function charactersStatus(characters: EntityRow[]): string {
  const active = characters.filter((c) => !c.deletedAt && c.active !== false).length;
  if (active === 0) return 'None';
  return `${active} active`;
}

function pricingStatus(plans: EntityRow[]): string {
  const activePlans = plans.filter((p) => p.active && !p.deletedAt);
  if (activePlans.length === 0) return 'Missing';
  return 'Added';
}

function seoStatus(tab: TabCompletion): string {
  if (tab.pct === 100) return 'Complete';
  if (tab.filled === 0) return 'Not started';
  return `${tab.filled}/${tab.total} fields`;
}

function publishStatus(status: string, blocked: boolean): string {
  if (status === 'published') return 'Published';
  if (blocked) return 'Blocked';
  return 'Ready';
}

export function workflowStatusLabel(tab: TabCompletion, ctx: SidebarContext): string {
  const hasPublishedRun = !ctx.completion.tabById.testing.missingRequired.some(
    (m) => m.key === 'publishedTestRun',
  );

  switch (tab.id) {
    case 'setup':
      return setupStatus(tab);
    case 'testing':
      return testingStatus(tab, hasPublishedRun);
    case 'verdict':
      return verdictStatus(tab);
    case 'review':
      return reviewStatus(ctx.review, tab);
    case 'media':
      if (tab.pct === 100) return 'Complete';
      return mediaStatus(ctx.media);
    case 'characters':
      if (tab.pct === 100) return 'Complete';
      return charactersStatus(ctx.characters);
    case 'pricing':
      return pricingStatus(ctx.plans);
    case 'seo':
      return seoStatus(tab);
    case 'publish':
      return publishStatus(ctx.status, Boolean(tab.blocked));
    default:
      return tab.pct === null ? 'Optional' : `${tab.pct}%`;
  }
}

export function statusTone(tab: TabCompletion, label: string): string {
  const visual = tabVisualStatus(tab);
  if (visual === 'blocked' || label === 'Blocked') return 'text-red-600 dark:text-red-400';
  if (visual === 'complete' || label === 'Complete' || label === 'Published' || label === 'Ready') {
    return 'text-green-700 dark:text-green-400';
  }
  if (visual === 'attention' || label === 'Missing' || label === 'Missing fields') {
    return 'text-amber-700 dark:text-amber-400';
  }
  return 'text-slate-500 dark:text-slate-400';
}
