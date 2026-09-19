/** Small presentation helpers shared by the vault page and its client script. */
import { optimizedImageUrl, imageSrcSet } from '../media/optimize';
import type { VaultCategory, VaultPrompt, VaultResult } from './types';
import { VAULT_GENERATOR_LABELS } from './types';

/** Card image widths: 171 (mobile / hero) and 384 (desktop 3-column). */
export const CARD_SIZES = '(min-width: 768px) 384px, 171px';
const CARD_WIDTHS = [171, 342, 384, 768];
const DETAIL_WIDTHS = [358, 472, 716, 944];

export interface ResultImage {
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
}

/** 4:5 is fixed by design; declared dimensions fall back to it until real files exist. */
export function resultImage(result: VaultResult, prompt: VaultPrompt, widths = CARD_WIDTHS): ResultImage | null {
  if (!result.imagePath) return null;
  return {
    src: optimizedImageUrl(result.imagePath, { width: widths[1], dpr: 1, quality: 82, format: 'webp' }),
    srcset: imageSrcSet(result.imagePath, widths, 82),
    width: result.width ?? 1200,
    height: result.height ?? 1500,
    alt: result.alt ?? `${prompt.title} — OurDream AI result for the prompt ${prompt.promptText}`,
  };
}

export function detailImages(prompt: VaultPrompt): Array<ResultImage | null> {
  return prompt.results.map((r) => resultImage(r, prompt, DETAIL_WIDTHS));
}

/** "Realistic Default · 2 results" (Figma 251:169). */
export function modelMeta(prompt: VaultPrompt): string {
  const parts: string[] = [];
  if (prompt.generator === 'dreamy') parts.push('Realistic Default');
  if (prompt.results.length > 1) parts.push(`${prompt.results.length} results`);
  return parts.join(' · ');
}

/** Weight note (Figma 251:163) — only when the prompt carries a weight. */
export function weightNote(promptText: string): string | null {
  const m = promptText.match(/:(\d+(?:\.\d+)?)\s*\)/);
  if (!m) return null;
  return `Weight ${m[1]}: the number after the colon sets how strongly the trait is applied. Copy it exactly as tested.`;
}

export function generatorLabel(prompt: VaultPrompt): string {
  return VAULT_GENERATOR_LABELS[prompt.generator];
}

/** Lower-cased text search runs against: name, prompt, category and chip names. */
export function searchHaystack(prompt: VaultPrompt, category: VaultCategory, filterLabel: string): string {
  return [prompt.title, prompt.promptText, category.title, category.shortTitle ?? '', filterLabel]
    .join(' ')
    .toLowerCase()
    .replace(/[_\s]+/g, ' ');
}
