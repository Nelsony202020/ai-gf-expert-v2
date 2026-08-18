import type { RoundupPick } from '../../data/roundups/ai-girlfriend';

/** Known product names → roundup pick anchor ids (includes picks not always in the template). */
const PRODUCT_PICK_IDS: Record<string, string> = {
  'OurDream AI': 'ourdream-ai',
  GirlfriendGPT: 'girlfriendgpt',
  'Nectar AI': 'nectar-ai',
  'Candy AI': 'candy-ai',
  'JuicyChat AI': 'juicychat-ai',
};

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
