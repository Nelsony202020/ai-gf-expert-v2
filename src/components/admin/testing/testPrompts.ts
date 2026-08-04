/** Standard prompts for batch image / video / consistency tests. */

export const IMAGE_BATCH_PROMPT =
  'Full-body photo wearing a red summer dress, standing on a sunny beach, soft natural lighting.';

/** Reference image — character is already loaded in the app. */
export const IMAGE_CONSISTENCY_REFERENCE_PROMPT =
  'Portrait, neutral expression, plain gray background, waist-up framing. Pink crop top, white skirt.';

/** Different scenes/outfits — do not repeat “same woman”; character is pre-selected. */
export const IMAGE_CONSISTENCY_VARIATION_PROMPTS = [
  'Full-body shot in a red summer dress on a sunny beach.',
  'Business casual outfit, standing in a modern office, soft lighting.',
  'Winter coat on a city street at night.',
  'Athletic wear at a gym.',
] as const;

/** @deprecated Use IMAGE_CONSISTENCY_REFERENCE_PROMPT */
export const IMAGE_CONSISTENCY_PROMPT = IMAGE_CONSISTENCY_REFERENCE_PROMPT;

export const VIDEO_BATCH_PROMPTS = [
  'Waves hello and smiles at the camera, gentle breeze in hair, stable camera.',
  'She walks toward the camera, turns around once, then looks back and smiles.',
  'She picks up a glass, takes a sip, puts it down, then smiles at the camera.',
] as const;

/** @deprecated Use VIDEO_BATCH_PROMPTS or videoBatchPromptForStep */
export const VIDEO_BATCH_PROMPT = VIDEO_BATCH_PROMPTS[0];

export function videoBatchPromptForStep(step: number): string {
  return VIDEO_BATCH_PROMPTS[step] ?? VIDEO_BATCH_PROMPTS[0];
}

export function consistencyPromptForStep(step: number): string {
  if (step === 0) return IMAGE_CONSISTENCY_REFERENCE_PROMPT;
  return IMAGE_CONSISTENCY_VARIATION_PROMPTS[step - 1] ?? IMAGE_CONSISTENCY_VARIATION_PROMPTS[0];
}
