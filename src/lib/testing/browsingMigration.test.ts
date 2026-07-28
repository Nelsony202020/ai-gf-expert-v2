import { describe, expect, it } from 'vitest';
import { migrateBrowsingDraft } from '../components/admin/testing/browsingMigration';

describe('migrateBrowsingDraft', () => {
  const def = { slug: 'browsing' } as never;

  it('moves legacy text answers to yes with note', () => {
    expect(
      migrateBrowsingDraft(def, {
        raw: { text: '90% tasks passed, avg 2 clicks' },
        internalNotes: '',
      }),
    ).toEqual({
      raw: { status: 'yes' },
      internalNotes: '90% tasks passed, avg 2 clicks',
    });
  });

  it('preserves existing yes/no answers', () => {
    expect(
      migrateBrowsingDraft(def, {
        raw: { status: 'no' },
        internalNotes: 'Hard to browse',
      }),
    ).toEqual({
      raw: { status: 'no' },
      internalNotes: 'Hard to browse',
    });
  });
});
