import type { RoundupPick } from '../../data/roundups/ai-girlfriend';
import type { PublishedGlossaryTerm } from '../glossary/types';
import {
  createGlossaryDecorateState,
  decorateGlossaryPlainText,
  setGlossarySection,
  type GlossaryDecorateState,
} from '../glossary/decorate';

/** Known product names → roundup pick anchor ids (includes picks not always in the template). */
const PRODUCT_PICK_IDS: Record<string, string> = {
  'OurDream AI': 'ourdream-ai',
  GirlfriendGPT: 'girlfriendgpt',
  'Nectar AI': 'nectar-ai',
  'Candy AI': 'candy-ai',
  'JuicyChat AI': 'juicychat-ai',
};

const BOLD_SEGMENT = /(\*\*[^*]+\*\*)/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Turn `**Product Name**` markers into editorial pick-anchor links. */
export function renderRoundupText(text: string, picks?: RoundupPick[]): string {
  const nameToId = { ...PRODUCT_PICK_IDS };
  picks?.forEach((pick) => {
    nameToId[pick.name] = pick.id;
  });

  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, (_match, rawName: string) => {
    const name = rawName.trim();
    const pickId = nameToId[name];
    if (!pickId) return `<strong>${name}</strong>`;
    return `<a href="#pick-${pickId}" class="content-link" data-pick-anchor="${pickId}">${name}</a>`;
  });
}

export interface RoundupFaqGlossaryContext {
  terms: PublishedGlossaryTerm[];
  state: GlossaryDecorateState;
}

/** FAQ answer copy — product anchors plus server-side glossary triggers in plain-text spans. */
export function renderRoundupFaqText(
  text: string,
  picks?: RoundupPick[],
  glossary?: RoundupFaqGlossaryContext,
): string {
  if (!text) return '';

  return text.split(BOLD_SEGMENT).map((part) => {
    if (!part) return '';
    if (/^\*\*[^*]+\*\*$/.test(part)) return renderRoundupText(part, picks);
    if (glossary?.terms.length) return decorateGlossaryPlainText(part, glossary.terms, glossary.state);
    return escapeHtml(part);
  }).join('');
}

export function faqGlossaryContext(
  terms: PublishedGlossaryTerm[],
  sectionKey: string,
): RoundupFaqGlossaryContext | undefined {
  if (terms.length === 0) return undefined;
  const state = createGlossaryDecorateState();
  setGlossarySection(state, sectionKey);
  return { terms, state };
}
