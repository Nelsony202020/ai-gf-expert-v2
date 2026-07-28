import { describe, expect, it } from 'vitest';
import type { EntityRow } from '../components/admin/api';
import {
  sessionHasBlockedRequired,
  sessionRequiredProgress,
  type ProgressContext,
} from '../components/admin/testing/progress';
import type { SessionItem } from '../components/admin/testing/sessionUi';

const items: SessionItem[] = [
  {
    def: { id: 'def-1', slug: 'voice-calls', required: true, evidenceRequirements: [{ type: 'screenshot', description: 'Proof' }] } as EntityRow,
    sub: {} as EntityRow,
  },
];

function ctx(partial: Partial<ProgressContext>): ProgressContext {
  return {
    hasValue: () => true,
    getResult: () => undefined,
    attachmentCount: () => 0,
    isSkipped: () => false,
    ...partial,
  };
}

describe('progress N/A gating', () => {
  it('treats notApplicable as complete without proof', () => {
    const progress = sessionRequiredProgress('chat-features', items, ctx({
      hasValue: () => true,
      getResult: () => ({ notApplicable: true } as EntityRow),
      attachmentCount: () => 0,
    }));
    expect(progress.complete).toBe(1);
    expect(progress.remaining).toBe(0);
  });

  it('does not block sessions when required item is N/A', () => {
    expect(
      sessionHasBlockedRequired(items, ctx({
        hasValue: () => true,
        getResult: () => ({ notApplicable: true } as EntityRow),
        attachmentCount: () => 0,
      })),
    ).toBe(false);
  });
});
