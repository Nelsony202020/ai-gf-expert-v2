import type { DraftMeasurement } from './types';

export interface NotApplicableExplanationInput {
  productName: string;
  categorySlug: string;
  subscoreSlug: string;
  evidenceSlug: string;
  evidenceName: string;
  testResults?: DraftMeasurement[];
}

interface NotApplicableContext {
  featureName?: string;
  location?: string;
  mainFeature?: string;
  userAction?: string;
}

const CONTEXT_BY_KEY: Record<string, NotApplicableContext> = {
  'characters/variety/personalities': {
    featureName: 'personality options',
    location: 'its ready-made character library',
  },
  'characters/variety/scenarios': {
    featureName: 'scenario options',
    location: 'its ready-made character library',
  },
  'characters/variety/ethnicities': {
    featureName: 'ethnicity options',
    location: 'its ready-made character library',
  },
  'customization/personality/traits': {
    mainFeature: 'a character creator',
    userAction: 'choose personality traits',
  },
  'customization/personality/interests': {
    mainFeature: 'a character creator',
    userAction: 'choose interests',
  },
  'customization/personality/relationship': {
    mainFeature: 'a character creator',
    userAction: 'choose a relationship type',
  },
  'customization/personality/role': {
    mainFeature: 'a character creator',
    userAction: 'choose a role',
  },
  'customization/personality/voice': {
    mainFeature: 'a character creator',
    userAction: 'choose a voice',
  },
  'customization/personality/kink-options': {
    mainFeature: 'a character creator',
    userAction: 'choose intimacy preferences',
  },
  'customization/appearance/personality-presets': {
    mainFeature: 'a character creator',
    userAction: 'choose a personality',
  },
  'images/accuracy/editing-accuracy': {
    mainFeature: 'an image generator',
    userAction: 'edit finished images',
  },
  'images/experience/image-editing': {
    mainFeature: 'an image generator',
    userAction: 'edit finished images',
  },
  'chat-features/controls/export-chat': {
    userAction: 'export conversations',
  },
  'chat-features/interaction/voice-calls': {
    featureName: 'live voice calls',
  },
  'privacy/security/two-factor-authentication': {
    featureName: 'two-factor authentication',
    location: 'account settings',
  },
  'privacy/data-use/retention': {
    featureName: 'a stated data retention period',
    location: 'its privacy policy',
  },
  'privacy/security/security-incidents': {
    featureName: 'public records of security incidents',
  },
  'pricing/plan-value/plan-limits': {
    featureName: 'clear plan limits',
    location: 'its subscription plans',
  },
};

const FEATURE_NAME_BY_LABEL: Record<string, string> = {
  personalities: 'personality options',
  scenarios: 'scenario options',
  ethnicities: 'ethnicity options',
  traits: 'personality traits',
  'personality presets': 'personality options',
  'voice calls': 'live voice calls',
  'two-factor authentication': 'two-factor authentication',
  'export chat': 'chat export',
  retention: 'a stated data retention period',
  'security incidents': 'public records of security incidents',
  'plan limits': 'clear plan limits',
  'editing accuracy': 'image editing',
};

const USER_ACTION_BY_SLUG: Record<string, string> = {
  'export-chat': 'export conversations',
  'delete-messages': 'delete individual messages',
  'edit-messages': 'edit messages after sending them',
  'regenerate-replies': 'regenerate replies',
  'save-memories': 'save chat memories',
  'edit-memories': 'edit saved memories',
  'reset-chat': 'reset a chat',
  'voice-calls': 'make live voice calls',
  'group-chat': 'chat with multiple characters at once',
  'image-editing': 'edit finished images',
  'creator-personalities': 'choose a personality',
};

const MAIN_FEATURE_BY_PREFIX: Record<string, string> = {
  'customization/appearance': 'a character creator',
  'customization/personality': 'a character creator',
  'customization/control': 'a character creator',
  images: 'an image generator',
  'image-generator': 'an image generator',
};

const LOCATION_BY_PREFIX: Record<string, string> = {
  characters: 'its ready-made character library',
  'customization/appearance': 'its character creator',
  'customization/personality': 'its character creator',
  'customization/control': 'its character creator',
  images: 'its image generator',
  'image-generator': 'its image generator',
  'chat-features/controls': 'chat',
  'privacy/security': 'account settings',
  'privacy/data-use': 'its privacy policy',
  'privacy/support': 'its help center',
  pricing: 'its subscription plans',
};

export function isNotApplicableMeasurement(
  m: Pick<DraftMeasurement, 'status' | 'value'>,
): boolean {
  if (m.status === 'not-applicable') return true;
  return m.value.trim().toLowerCase() === 'not applicable';
}

export function isNotApplicableCategory(testResults: DraftMeasurement[]): boolean {
  if (testResults.length === 0) return false;
  return testResults.every(isNotApplicableMeasurement);
}

function featureNameFromInput(input: NotApplicableExplanationInput, ctx: NotApplicableContext): string {
  if (ctx.featureName) return ctx.featureName;
  const labelKey = input.evidenceName.trim().toLowerCase();
  if (FEATURE_NAME_BY_LABEL[labelKey]) return FEATURE_NAME_BY_LABEL[labelKey];
  return labelKey;
}

function inferLocation(input: NotApplicableExplanationInput, ctx: NotApplicableContext): string | undefined {
  if (ctx.location) return ctx.location;
  const subKey = `${input.categorySlug}/${input.subscoreSlug}`;
  if (LOCATION_BY_PREFIX[subKey]) return LOCATION_BY_PREFIX[subKey];
  if (LOCATION_BY_PREFIX[input.categorySlug]) return LOCATION_BY_PREFIX[input.categorySlug];
  return undefined;
}

function inferMainFeature(input: NotApplicableExplanationInput, ctx: NotApplicableContext): string | undefined {
  if (ctx.mainFeature) return ctx.mainFeature;
  const subKey = `${input.categorySlug}/${input.subscoreSlug}`;
  if (MAIN_FEATURE_BY_PREFIX[subKey]) return MAIN_FEATURE_BY_PREFIX[subKey];
  if (MAIN_FEATURE_BY_PREFIX[input.categorySlug]) return MAIN_FEATURE_BY_PREFIX[input.categorySlug];
  return undefined;
}

function inferUserAction(input: NotApplicableExplanationInput, ctx: NotApplicableContext): string | undefined {
  if (ctx.userAction) return ctx.userAction;
  return USER_ACTION_BY_SLUG[input.evidenceSlug];
}

export function buildNotApplicableWhatThisMeans(input: NotApplicableExplanationInput): string | undefined {
  if (input.testResults?.length && !isNotApplicableCategory(input.testResults)) {
    return undefined;
  }

  const key = `${input.categorySlug}/${input.subscoreSlug}/${input.evidenceSlug}`;
  const ctx = CONTEXT_BY_KEY[key] ?? {};
  const featureName = featureNameFromInput(input, ctx);
  const location = inferLocation(input, ctx);
  const mainFeature = inferMainFeature(input, ctx);
  const userAction = inferUserAction(input, ctx);
  const { productName } = input;

  if (mainFeature && userAction) {
    return `${productName} has ${mainFeature}, but it does not let you ${userAction}.`;
  }

  if (location && !mainFeature && !userAction) {
    return `${productName} does not offer ${featureName} in ${location}.`;
  }

  if (userAction && !location) {
    return `You cannot ${userAction} in ${productName}.`;
  }

  if (location) {
    return `${productName} does not offer ${featureName} in ${location}.`;
  }

  return `${productName} does not offer ${featureName}.`;
}

export function resolveNotApplicableCategoryScore(
  testResults: DraftMeasurement[],
  fallbackScore?: number | null,
): number | null {
  if (isNotApplicableCategory(testResults)) return null;
  if (testResults.some(isNotApplicableMeasurement) && testResults.length === 1) return null;
  return fallbackScore ?? null;
}
