/** Product capability toggles — field keys, labels, and admin icons. */

/** Character options shown on the product Setup tab (directory filters). */
export const SETUP_CHARACTER_CAPABILITIES = [
  { name: 'capFemaleCharacters', label: 'Female characters', icon: 'woman' },
  { name: 'capMaleCharacters', label: 'Male characters', icon: 'man' },
  { name: 'capAnimeCharacters', label: 'Anime characters', icon: 'animation' },
  { name: 'capLgbtqOptions', label: 'LGBTQ+ characters', icon: 'diversity_3' },
  { name: 'capCustomCharacters', label: 'Custom characters', icon: 'person_add' },
] as const;

export type SetupCharacterCapabilityName = (typeof SETUP_CHARACTER_CAPABILITIES)[number]['name'];

/** Visual grouping for the Setup tab character toggles. */
export const SETUP_CHARACTER_GROUPS: {
  id: string;
  caps: SetupCharacterCapabilityName[];
}[] = [
  {
    id: 'gender',
    caps: ['capFemaleCharacters', 'capMaleCharacters'],
  },
  {
    id: 'style',
    caps: ['capAnimeCharacters', 'capLgbtqOptions'],
  },
  {
    id: 'creation',
    caps: ['capCustomCharacters'],
  },
];

/** Legacy / full capability list (schema + public site filters). */
export const PRODUCT_CAPABILITIES = [
  ...SETUP_CHARACTER_CAPABILITIES,
  { name: 'capFreePlan', label: 'Free plan', icon: 'savings' },
  { name: 'capNsfw', label: 'NSFW support', icon: 'explicit' },
  { name: 'capRealisticCharacters', label: 'Realistic characters', icon: 'face' },
  { name: 'capImageGeneration', label: 'Image generation', icon: 'image' },
  { name: 'capVideoGeneration', label: 'Video generation', icon: 'movie' },
  { name: 'capVoiceMessages', label: 'Voice messages', icon: 'mic' },
  { name: 'capVoiceCalls', label: 'Voice calls', icon: 'call' },
  { name: 'capGroupChat', label: 'Group chat', icon: 'groups' },
  { name: 'capLongTermMemory', label: 'Long-term memory', icon: 'psychology' },
  { name: 'capMemoryInjection', label: 'Memory injection', icon: 'neurology' },
  { name: 'capCustomScenarios', label: 'Custom scenarios', icon: 'theater_comedy' },
  { name: 'capDiscreetBilling', label: 'Discreet billing', icon: 'credit_card' },
  { name: 'capE2eEncryption', label: 'End-to-end encryption', icon: 'lock' },
  { name: 'capInChatImages', label: 'In-chat images', icon: 'photo_library' },
  { name: 'capDedicatedImageGenerator', label: 'Dedicated image generator', icon: 'photo_camera' },
  { name: 'capDedicatedVideoGenerator', label: 'Dedicated video generator', icon: 'videocam' },
  { name: 'capTokenSystem', label: 'Token / credit system', icon: 'toll' },
] as const;

export type ProductCapabilityName = (typeof PRODUCT_CAPABILITIES)[number]['name'];

export function capabilityByName(name: string) {
  return PRODUCT_CAPABILITIES.find((c) => c.name === name);
}

export function countSetupCharacterCapabilities(fields: Record<string, unknown>): {
  enabled: number;
  total: number;
  pct: number;
} {
  const total = SETUP_CHARACTER_CAPABILITIES.length;
  const enabled = SETUP_CHARACTER_CAPABILITIES.filter((c) => fields[c.name] === true).length;
  const pct = total === 0 ? 0 : Math.round((enabled / total) * 100);
  return { enabled, total, pct };
}

export function countEnabledCapabilities(fields: Record<string, unknown>): {
  enabled: number;
  total: number;
  pct: number;
} {
  return countSetupCharacterCapabilities(fields);
}
