import { describe, expect, it } from 'vitest';
import { isEvidenceAnswerComplete, repairChatModesRaw } from './evidenceComplete';

describe('isEvidenceAnswerComplete', () => {
  it('rejects chat-modes yes without a mode count', () => {
    expect(
      isEvidenceAnswerComplete({
        slug: 'chat-modes',
        rawValue: { status: 'yes' },
      }),
    ).toBe(false);
  });

  it('repairs chat-modes yes without count from rated mode-types', () => {
    expect(
      repairChatModesRaw({ status: 'yes' }, {
        structured: { modes: [{ name: 'Romance', rating: 'good' }, { name: 'Roleplay', rating: 'good' }] },
      }),
    ).toEqual({ status: 'yes', detail: { count: 2 } });
  });

  it('accepts repaired chat-modes in completion check', () => {
    expect(
      isEvidenceAnswerComplete({
        slug: 'chat-modes',
        rawValue: { status: 'yes', detail: { count: 6 } },
      }),
    ).toBe(true);
  });

  it('rejects mode-types when chat-modes count is missing', () => {
    expect(
      isEvidenceAnswerComplete({
        slug: 'mode-types',
        rawValue: {
          structured: { modes: [{ name: 'Romance', rating: 'good' }] },
        },
        relatedAnswers: { 'chat-modes': { status: 'yes' } },
      }),
    ).toBe(false);
  });

  it('accepts pricing autofill when suggestion exists', () => {
    expect(
      isEvidenceAnswerComplete({
        slug: 'annual-price',
        hasAutofillSuggestion: true,
      }),
    ).toBe(true);
  });
});
