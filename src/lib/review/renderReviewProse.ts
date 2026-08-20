import type { PublishedGlossaryTerm } from '../glossary/types';
import {
  createGlossaryDecorateState,
  decorateGlossaryPlainText,
  setGlossarySection,
  type GlossaryDecorateState,
} from '../glossary/decorate';

export interface ReviewProseGlossaryContext {
  terms: PublishedGlossaryTerm[];
  state: GlossaryDecorateState;
}

/** Shared glossary decorate state for a review prose section (e.g. overview verdict, pricing intro). */
export function reviewProseGlossaryContext(
  terms: PublishedGlossaryTerm[],
  sectionKey: string,
): ReviewProseGlossaryContext | undefined {
  if (terms.length === 0) return undefined;
  const state = createGlossaryDecorateState();
  setGlossarySection(state, sectionKey);
  return { terms, state };
}

/** Decorate plain review copy with glossary triggers (first occurrence per term per section). */
export function renderReviewProseText(
  text: string,
  glossary?: ReviewProseGlossaryContext,
): string {
  if (!text) return '';
  if (glossary?.terms.length) {
    return decorateGlossaryPlainText(text, glossary.terms, glossary.state);
  }
  return decorateGlossaryPlainText(text, [], createGlossaryDecorateState());
}
