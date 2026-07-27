// Maps server publish validation messages to workspace tabs for deep links.

import type { WorkspaceTabId } from '../completion';

export function tabForServerMessage(msg: string): WorkspaceTabId {
  const m = msg.toLowerCase();
  if (m.includes('test run')) return 'testing';
  if (m.includes('seo') || m.includes('meta description')) return 'seo';
  if (m.includes('plan') || m.includes('price') || m.includes('payment')) return 'pricing';
  if (m.includes('media') || m.includes('alt text')) return 'media';
  if (m.includes('affiliate')) return 'setup';
  if (
    m.includes('verdict') ||
    m.includes('our take') ||
    m.includes('pro ') ||
    m.includes('con ') ||
    m.includes('pros') ||
    m.includes('cons') ||
    m.includes('directory description')
  ) {
    return 'verdict';
  }
  if (m.includes('author') || m.includes('fact checker')) return 'setup';
  return 'setup';
}

export interface PublishValidationResult {
  errors: string[];
  warnings: string[];
}
