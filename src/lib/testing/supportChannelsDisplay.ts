/** Support channel structured answers — public summary + drawer detail lines. */

export type SupportChannels = {
  email: string;
  contactPage: string;
  discord: string;
  reddit: string;
  telegram: string;
};

export const SUPPORT_CHANNEL_LABELS: { key: keyof SupportChannels; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'contactPage', label: 'Help / contact page' },
  { key: 'discord', label: 'Discord' },
  { key: 'reddit', label: 'Reddit' },
  { key: 'telegram', label: 'Telegram' },
];

export function parseSupportChannelsStructured(raw: unknown): SupportChannels | null {
  if (!raw || typeof raw !== 'object' || !('structured' in raw)) return null;
  const structured = (raw as { structured?: Record<string, unknown> }).structured;
  if (!structured || typeof structured !== 'object') return null;
  return {
    email: typeof structured.email === 'string' ? structured.email.trim() : '',
    contactPage: typeof structured.contactPage === 'string' ? structured.contactPage.trim() : '',
    discord: typeof structured.discord === 'string' ? structured.discord.trim() : '',
    reddit: typeof structured.reddit === 'string' ? structured.reddit.trim() : '',
    telegram: typeof structured.telegram === 'string' ? structured.telegram.trim() : '',
  };
}

export function countFilledSupportChannels(channels: SupportChannels): number {
  return SUPPORT_CHANNEL_LABELS.filter(({ key }) => Boolean(channels[key])).length;
}

/** Compact public / list display: "4 support channels". */
export function formatSupportChannelsSummary(raw: unknown): string | null {
  const channels = parseSupportChannelsStructured(raw);
  if (!channels) return null;
  const n = countFilledSupportChannels(channels);
  if (n === 0) return null;
  return n === 1 ? '1 support channel' : `${n} support channels`;
}

export function formatSupportChannelsDetailLines(
  raw: unknown,
): { label: string; value: string }[] {
  const channels = parseSupportChannelsStructured(raw);
  if (!channels) return [];
  return SUPPORT_CHANNEL_LABELS.filter(({ key }) => Boolean(channels[key])).map(
    ({ key, label }) => ({ label, value: channels[key] }),
  );
}
