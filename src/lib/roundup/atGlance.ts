import type { AtGlanceData, AtGlanceStat, AtGlanceTooltip } from '../../data/roundups/ai-girlfriend';
import type { Product } from '../../data/products';
import type { PricingTabViewModel } from '../pricing-tab/types';
import { fmtMoney } from '../pricing/calc';
import { reviewPageUrl } from '../slugs';

const PRICING_MODEL_LABELS: Record<string, string> = {
  subscription_only: 'Subscription only',
  subscription_credits: 'Subscription + tokens',
  credits_only: 'Token based',
  free_plus_credits: 'Freemium + tokens',
  mixed: 'Mixed pricing',
  custom: 'Custom pricing',
};

const REGULAR_USE_DESCRIPTION =
  'Based on our regular-use profile, including chat, images, videos, and voice features.';

const POWER_USER_DESCRIPTION =
  'Based on heavier daily use of images, videos, voice, and other token-based features.';

function unavailable(): string {
  return 'Not available';
}

function notTested(): string {
  return 'Not tested';
}

/** Visual tone for at-a-glance value cells. */
export function atGlanceValueTone(value: string): 'muted' | 'default' {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'no' ||
    normalized === 'not available' ||
    normalized === 'not tested' ||
    normalized === '—' ||
    normalized === '-'
  ) {
    return 'muted';
  }
  return 'default';
}

const STYLE_LABELS: Record<string, string> = {
  realistic: 'Realistic',
  anime: 'Anime',
  fantasy: 'Fantasy',
  'semi-realistic': 'Semi-realistic',
  '2d': '2D',
  '2d / cartoon': '2D',
  '3d': '3D',
  '3d render': '3D',
};

function normalizeStyleToken(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed || trimmed === '—') return null;
  if (/^\d+$/.test(trimmed)) return null;
  const key = trimmed.toLowerCase();
  if (STYLE_LABELS[key]) return STYLE_LABELS[key];
  if (/^\d+\s+styles?$/i.test(trimmed)) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function normalizeStylesList(raw: string): string | null {
  const parts = raw
    .split(/[,·+/]|(?:\s+and\s+)/i)
    .map(normalizeStyleToken)
    .filter((part): part is string => Boolean(part));
  if (parts.length === 0) return null;
  return [...new Set(parts)].join(' + ');
}

function findContributorValue(product: Product, label: string): string | null {
  const needle = label.trim().toLowerCase();
  for (const cat of product.categories) {
    for (const sub of cat.subscores) {
      for (const contributor of sub.contributors) {
        if (contributor.label.trim().toLowerCase() !== needle) continue;
        const raw = contributor.value?.trim();
        if (raw && raw !== '—') return raw;
      }
    }
  }
  return null;
}

function parseYesNo(value: string | null): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'yes' || normalized.startsWith('yes ')) return true;
  if (normalized === 'no' || normalized.startsWith('no ')) return false;
  return null;
}

function characterStylesFromTesting(product: Product): string | null {
  const charactersCat = product.categories.find((c) => c.key === 'characters');
  if (!charactersCat) return null;

  for (const sub of charactersCat.subscores) {
    const stylesRow = sub.contributors.find((c) => c.label.trim().toLowerCase() === 'styles');
    const raw = stylesRow?.value?.trim();
    if (!raw || raw === '—') continue;
    const normalized = normalizeStylesList(raw);
    if (normalized) return normalized;
  }
  return null;
}

function formatCharacterStyles(product: Product): string {
  const fromTesting = characterStylesFromTesting(product);
  if (fromTesting) return fromTesting;

  const caps = product.capabilities;
  const styles: string[] = [];
  if (caps?.realisticCharacters) styles.push('Realistic');
  if (caps?.animeCharacters) styles.push('Anime');
  if (styles.length > 0) return styles.join(' + ');

  return unavailable();
}

function formatAiPhoneCalls(product: Product, vm: PricingTabViewModel): string {
  const fromTesting = parseYesNo(findContributorValue(product, 'AI phone calls'));
  if (fromTesting === true) return 'Yes';
  if (fromTesting === false) return 'No';

  const caps = product.capabilities;
  if (caps?.voiceCalls === false) return 'No';

  const row = vm.featureCosts.find((r) => r.key === 'voice_call');
  if (caps?.voiceCalls === true) return 'Yes';
  if (row?.value && row.value !== '—') {
    if (/^yes$/i.test(row.value.trim())) return 'Yes';
    if (/^no$/i.test(row.value.trim())) return 'No';
    return 'Yes';
  }

  return notTested();
}

function formatVoiceMessages(product: Product): string {
  const canSend = parseYesNo(findContributorValue(product, 'Voice messages you can send'));
  const canReceive = parseYesNo(findContributorValue(product, 'Voice message generation'));

  if (canSend === true && canReceive === true) return 'Send + receive';
  if (canSend === true) return 'Send only';
  if (canReceive === true) return 'Receive only';
  if (canSend === false && canReceive === false) return 'No';
  if (canSend != null || canReceive != null) return 'Yes';

  const caps = product.capabilities;
  if (caps?.voiceMessages === false) return 'No';
  if (caps?.voiceMessages === true) return 'Send + receive';
  return notTested();
}

function formatVideoFromTesting(product: Product): string | null {
  const hasText = parseYesNo(findContributorValue(product, 'Text-to-Video'));
  const hasImage = parseYesNo(findContributorValue(product, 'Image-to-Video'));

  if (hasText === true && hasImage === true) return 'Text + image-to-video';
  if (hasImage === true) return 'Image-to-video';
  if (hasText === true) return 'Text-to-video';
  if (hasText === false && hasImage === false) return 'No';
  return null;
}

function formatVideoGenerator(product: Product, vm: PricingTabViewModel): string {
  const fromTesting = formatVideoFromTesting(product);
  if (fromTesting) return fromTesting;

  const caps = product.capabilities;
  if (caps?.videoGeneration === false) return 'No';

  const hasText = hasFeatureCost(vm, ['text_to_video']);
  const hasImage = hasFeatureCost(vm, ['image_to_video']);
  const hasStandard = hasFeatureCost(vm, ['standard_video', 'premium_video']);

  if (hasText && hasImage) return 'Text + image-to-video';
  if (hasImage) return 'Image-to-video';
  if (hasText) return 'Text-to-video';
  if (hasStandard || caps?.videoGeneration === true) return 'Yes';

  return notTested();
}

function hasFeatureCost(vm: PricingTabViewModel, keys: string[]): boolean {
  return keys.some((key) => {
    const row = vm.featureCosts.find((r) => r.key === key);
    return Boolean(row?.value && row.value !== '—');
  });
}

function formatPricingModel(product: Product, vm: PricingTabViewModel): string {
  if (vm.pricingModel && PRICING_MODEL_LABELS[vm.pricingModel]) {
    return PRICING_MODEL_LABELS[vm.pricingModel];
  }
  const caps = product.capabilities;
  if (caps?.freePlan && caps?.tokenSystem) return 'Freemium + tokens';
  if (caps?.tokenSystem) return 'Subscription + tokens';
  if (caps?.freePlan) return 'Freemium';
  if (vm.advertisedMonthly != null) return 'Subscription only';
  return unavailable();
}

function formatStartingPrice(product: Product, vm: PricingTabViewModel): string {
  const monthly = product.pricingDisplay.monthly?.trim();
  if (monthly && monthly !== '—') return monthly;
  if (vm.advertisedMonthly != null) {
    return `${fmtMoney(vm.advertisedMonthly, vm.currency)}/mo`;
  }
  return unavailable();
}

function formatMonthlyEstimate(amount: number | null | undefined, currency: string): string {
  if (amount == null || !Number.isFinite(amount)) return unavailable();
  return `~${fmtMoney(amount, currency)}/mo`;
}

function findFeatureCost(vm: PricingTabViewModel, keys: string[]): string | null {
  for (const key of keys) {
    const row = vm.featureCosts.find((r) => r.key === key);
    if (row?.value && row.value !== '—') return row.value;
  }
  return null;
}

function formatBreakdownLine(label: string, raw: string | null, fallbackUnit: string): string | null {
  if (!raw) return null;
  if (raw.includes('/')) {
    return `${label}: ${raw.startsWith('~') ? raw : `~${raw}`}`;
  }
  return `${label}: ${raw.startsWith('~') ? raw : `~${raw}`} ${fallbackUnit}`;
}

function buildPricingBreakdown(vm: PricingTabViewModel): string[] {
  const lines: string[] = [];
  const image = formatBreakdownLine(
    'Images',
    findFeatureCost(vm, ['standard_image', 'premium_image', 'in_chat_image']),
    'each',
  );
  const video = formatBreakdownLine(
    'Videos',
    findFeatureCost(vm, ['standard_video', 'text_to_video', 'image_to_video']),
    'each',
  );
  const calls = formatBreakdownLine('Calls', findFeatureCost(vm, ['voice_call']), '');

  if (image) lines.push(image);
  if (video) lines.push(video);
  if (calls) lines.push(calls);
  return lines;
}

function buildUsageTooltip(
  product: Product,
  vm: PricingTabViewModel,
  kind: 'regular' | 'power',
  amount: number | null,
): AtGlanceTooltip | undefined {
  if (amount == null || !Number.isFinite(amount)) return undefined;

  const tier = vm.usageTiers.find((t) => t.id === kind);
  const title = kind === 'regular' ? 'Estimated regular use' : 'Estimated power use';
  const description =
    tier?.description?.trim() ||
    (kind === 'regular' ? REGULAR_USE_DESCRIPTION : POWER_USER_DESCRIPTION);

  return {
    title,
    amount: formatMonthlyEstimate(amount, vm.currency),
    description,
    breakdown: kind === 'regular' ? buildPricingBreakdown(vm) : undefined,
    pricingHref: `${reviewPageUrl(product.slug)}#pricing`,
  };
}

function stat(
  id: string,
  icon: string,
  label: string,
  value: string,
  tooltip?: AtGlanceTooltip,
): AtGlanceStat {
  return { id, icon, label, value, ...(tooltip ? { tooltip } : {}) };
}

/** Build feature + pricing rows for the roundup at-a-glance section. */
export function buildAtGlanceStats(product: Product, vm: PricingTabViewModel): AtGlanceData {
  const parsedTypical = product.pricingDisplay.typicalMonthly
    ? parseFloat(product.pricingDisplay.typicalMonthly.replace(/[^\d.]/g, ''))
    : NaN;
  const regularAmount =
    vm.regularUseMonthly ?? (Number.isFinite(parsedTypical) ? parsedTypical : null);

  const regularValue =
    vm.regularUseMonthly != null
      ? formatMonthlyEstimate(vm.regularUseMonthly, vm.currency)
      : product.pricingDisplay.typicalMonthly?.trim() || unavailable();

  const powerValue = formatMonthlyEstimate(vm.powerUserMonthly, vm.currency);

  return {
    features: [
      stat('character-styles', 'face_retouching_natural', 'Character styles', formatCharacterStyles(product)),
      stat('ai-phone-calls', 'call', 'AI phone calls', formatAiPhoneCalls(product, vm)),
      stat('voice-messages', 'mic', 'Voice messages', formatVoiceMessages(product)),
      stat('video-generator', 'videocam', 'Video generator', formatVideoGenerator(product, vm)),
    ],
    pricing: [
      stat('pricing-model', 'toll', 'Pricing model', formatPricingModel(product, vm)),
      stat('starting-price', 'credit_card', 'Starting price', formatStartingPrice(product, vm)),
      stat(
        'regular-use',
        'account_balance_wallet',
        'Regular use',
        regularValue,
        buildUsageTooltip(product, vm, 'regular', regularAmount),
      ),
      stat(
        'power-user',
        'bolt',
        'Power user',
        powerValue,
        buildUsageTooltip(product, vm, 'power', vm.powerUserMonthly),
      ),
    ],
  };
}
