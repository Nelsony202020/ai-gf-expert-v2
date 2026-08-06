import { testContributorUrl } from '../slugs';
import { weightedValue } from '../scores';
import {
  buildMemberWeightsInGroup,
  getMemberNominalWeights,
} from '../ratings/evidenceGroupScoring';
import { buildRedistributedCalcItems } from '../scores';
import type {
  DraftEvidenceCalculation,
  DraftEvidenceCalculationRow,
  DraftMeasurement,
  DraftProofItem,
} from './types';
import {
  buildNotApplicableWhatThisMeans,
  isNotApplicableCategory,
  isNotApplicableMeasurement,
  type NotApplicableExplanationInput,
} from './notApplicableExplanation';

const ENHANCED_SCOPE: Record<string, string> = {
  // Characters — Variety
  amount:
    'How many characters you can pick from, and whether the library covers different genders, anime styles, and identity groups.',
  styles: 'How many different visual styles you can choose from (realistic, anime, and so on).',
  genders: 'Which gender and identity groups are actually available to browse.',
  ethnicities: 'How many ethnicity or background options show up in the library.',
  personalities: 'How many personality types you can pick from when browsing characters.',
  scenarios: 'How many relationship or story types are available to explore.',
  // Characters — Discovery
  filters: 'How well filters help you narrow the library to what you want.',
  categories: 'How the app groups characters so you can browse by type or theme.',
  search: 'How well search finds characters by name, trait, or keyword.',
  browsing: 'How easy it is to scroll, explore, and discover characters without search.',
  // Characters — Quality
  duplicates: 'How often the library repeats the same or near-identical characters.',
  originality: 'How unique and varied the characters feel rather than copy-pasted.',
  'profile-quality': 'How complete and believable character profiles are (bio, traits, photos).',
  'visual-quality': 'How good character photos look — consistency, realism, and polish.',
  // Customization — Appearance
  ethnicity: 'Ethnicity or background options when creating or editing a character look.',
  age: 'Age range options available for character appearance.',
  'eye-color': 'Eye color choices during character customization.',
  'body-type': 'Body type and physique options you can pick from.',
  'breast-size': 'Chest/breast size options where the creator offers them.',
  'ss-size': 'SS size options where the creator offers them.',
  'hair-style': 'Hairstyle options (length, cut, and style).',
  'hair-color': 'Hair color choices in the creator.',
  outfits: 'Clothing and outfit options for characters.',
  'creator-personalities': 'Personality presets you can assign when building a character.',
  gender: 'Gender or presentation options in the character creator.',
  face: 'Face shape and facial feature options.',
  hair: 'Combined hair customization (style, color, length).',
  body: 'Body proportions and build options beyond basic body type.',
  clothing: 'Wardrobe and outfit customization depth.',
  // Customization — Personality
  traits: 'Personality trait tags or sliders you can set.',
  interests: 'Hobbies and interest tags for characters.',
  communication: 'Communication style options (flirty, shy, dominant, etc.).',
  relationship: 'Relationship type or dynamic you can choose.',
  role: 'Role or archetype presets (friend, partner, mentor, etc.).',
  voice: 'Voice options tied to personality or character identity.',
  // Customization — Control
  'custom-prompts': 'Whether you can steer creation with your own text prompts.',
  editing: 'How much you can change after creating a character.',
  'detail-level': 'How deep customization goes (simple presets vs fine control).',
  combinations: 'How many meaningful trait combinations the creator supports.',
  preview: 'How well previews show the character before you save.',
  // Chat — Understanding
  memory: 'Whether the AI remembers what you said earlier in the same chat or session.',
  relevance: 'How directly the AI answers your question instead of going off-topic.',
  context: 'How well the AI uses recent messages to stay coherent.',
  instructions: 'How well the AI follows rules you set (tone, boundaries, scenario).',
  'roleplay-accuracy': 'How consistently the AI stays in character during roleplay.',
  // Chat — Realism
  naturalness: 'How human and conversational replies feel — not robotic or templated.',
  personality: 'How distinct and consistent the AI personality feels over time.',
  roleplay: 'How immersive and believable roleplay responses are.',
  emotion: 'How well the AI expresses and responds to emotional cues.',
  initiative: 'How often the AI drives the conversation forward on its own.',
  style: 'Writing style quality — pacing, vocabulary, and flow.',
  // Chat — Reliability
  speed: 'How fast the AI replies under normal use.',
  errors: 'How often chats break, fail, or return garbled responses.',
  consistency: 'Whether results stay stable and repeatable across sessions or generations.',
  recovery: 'How well the app recovers when something goes wrong mid-chat.',
  repetition: 'How often the AI repeats itself or loops the same phrases.',
  refusals: 'How often the AI refuses reasonable requests or breaks immersion.',
  'reply-speed': 'Median time to get a reply after you send a message.',
  // Chat Features — Media
  'images-sent': 'Whether you can send your own images in chat.',
  'images-received': 'Whether characters can send you images in chat.',
  'voice-sent': 'Whether you can send voice messages.',
  'voice-received': 'Whether characters can reply with voice messages.',
  'chat-video': 'Whether video clips can appear inside chat.',
  gifs: 'GIF support when messaging characters.',
  reactions: 'Emoji reactions on individual messages.',
  // Chat Features — Interaction
  'voice-calls': 'Live voice calling with a character.',
  'chat-modes': 'Different chat modes that change how the AI behaves.',
  'mode-types': 'What kinds of modes exist (romance, roleplay, story, etc.).',
  'group-chat': 'Chatting with more than one AI character at once.',
  'double-texting': 'How often the AI sends a follow-up before you reply.',
  'proactive-messages': 'Unprompted messages from characters when you are away.',
  // Chat Features — Controls
  'edit-messages': 'Editing messages you already sent.',
  'delete-messages': 'Deleting individual messages.',
  'regenerate-replies': 'Regenerating an AI reply you did not like.',
  'save-memories': 'Manually saving facts the AI should remember.',
  'edit-memories': 'Viewing, editing, or deleting saved memories.',
  'reset-chat': 'Resetting a conversation to start fresh.',
  'export-chat': 'Exporting chat history to a file.',
  // Chat Features — Platform extras
  'live-cam': 'Live webcam-style experience with a character on video.',
  'platform-extras-list': 'Extra bonus features beyond standard chat (games, shorts, roulette, etc.).',
  // Images
  realism: 'How realistic generated images look (face, body, lighting).',
  'visual-errors': 'Anatomy glitches and obvious mistakes in images.',
  detail: 'Fine detail quality in faces, hands, and textures.',
  composition: 'Framing, posing, and overall shot quality.',
  resolution: 'Output size and sharpness of generated images.',
  'image-editing': 'Tools to edit or refine images after generation.',
  'batch-quality': 'Quality across a batch of many generations.',
  'image-consistency': 'Whether the same character looks the same across images.',
  // Video
  'video-quality': 'Visual quality of generated video clips.',
  'video-realism': 'How realistic motion and appearance are in video.',
  'video-length': 'Typical clip length and limits.',
  'video-speed': 'How long you wait for video to generate.',
  'video-capabilities': 'What video features exist (length, style, controls).',
  'video-experience': 'End-to-end workflow for creating video in the app.',
  // Privacy
  'data-use': 'What the privacy policy says about how your data is used.',
  'user-control': 'Account settings for data, deletion, and opt-outs.',
  security: 'Security basics like HTTPS, billing discretion, and account protection.',
  support: 'How to reach customer support and how helpful they are.',
  'support-channels': 'Which support channels exist (email, chat, help center).',
  'support-available': 'Whether live or responsive support is offered.',
  'support-helpfulness': 'How useful support replies were in our test.',
  // Pricing
  'plan-value': 'Monthly and annual subscription prices and what you get.',
  'usage-costs': 'Per-use costs for images, video, voice, calls, and estimated monthly spend.',
  'free-access': 'What you can use without paying on the free tier.',
  billing: 'Pricing clarity, credit expiry, refunds, and easy cancellation.',
  'monthly-price': 'Cheapest paid monthly plan price.',
  'annual-price': 'Annual plan price or monthly equivalent.',
  'annual-discount': 'Percentage saved when paying annually vs monthly.',
  'pricing-clarity': 'How clearly the platform explains costs before you pay.',
  'included-credits': 'Tokens or credits included with a normal subscription.',
  'included-features': 'Which major features are included without extra payment.',
  'image-cost': 'Estimated dollar cost per image.',
  'video-cost': 'Estimated dollar cost per 10 seconds of video.',
  'voice-cost': 'Estimated dollar cost per 10 seconds of voice.',
  'call-cost': 'Estimated dollar cost per minute of voice calling.',
  'top-up-value': 'Smallest and largest credit packages available.',
  'monthly-spend': 'Estimated monthly cost for regular use.',
  'free-chat': 'How many chat messages are free before payment.',
  'free-images': 'How many images are free before payment.',
  'free-video': 'How many videos are free before payment.',
  'free-voice': 'How much voice is free before payment.',
  'free-characters': 'How many characters are free before payment.',
  'free-value': 'Whether users can start a free trial without a credit card.',
  'credit-expiry': 'Whether purchased credits expire and when.',
  refunds: 'Whether refunds are offered and on what terms.',
  cancellation: 'How easy it is to cancel a subscription (Yes, Limited, or No).',
  'payment-privacy': 'Whether billing is discreet on statements (from Pricing tab).',
};

function slugToPlainScope(slug: string): string {
  const label = slug.replace(/-/g, ' ');
  return `What we checked for ${label} during hands-on testing.`;
}

export function enhancedScopeDescription(slug: string, fallback?: string): string {
  return ENHANCED_SCOPE[slug] ?? fallback?.trim() ?? slugToPlainScope(slug);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseCount(value: string): number | null {
  const num = Number.parseInt(value.replace(/,/g, ''), 10);
  return Number.isNaN(num) ? null : num;
}

const UNAVAILABLE_VALUE_LABELS: Record<string, string> = {
  'not available': 'Not available',
  'not offered': 'Not offered',
  'not applicable': 'Not applicable',
  'could not verify': 'Unknown',
  unknown: 'Unknown',
};

/** True when a row should not use score bands (missing, N/A, not offered, etc.). */
export function isUnavailableMeasurement(
  m: Pick<DraftMeasurement, 'status' | 'value'>,
): boolean {
  if (
    m.status === 'not-applicable' ||
    m.status === 'not-offered' ||
    m.status === 'could-not-verify' ||
    m.status === 'not-tested' ||
    m.status === 'missing' ||
    m.status === 'test-failed'
  ) {
    return true;
  }
  const lower = m.value.trim().toLowerCase();
  if (!lower || lower === '—' || lower === '-') return true;
  return lower in UNAVAILABLE_VALUE_LABELS;
}

function availabilityInterpretation(m: DraftMeasurement): string | undefined {
  if (m.status === 'not-applicable') return 'Not applicable';
  if (m.status === 'not-offered') return 'Not offered';
  if (m.status === 'could-not-verify' || m.status === 'not-tested') return 'Unknown';
  if (m.status === 'missing' || m.status === 'test-failed') return 'Not scored';

  const lower = m.value.trim().toLowerCase();
  if (!lower || lower === '—' || lower === '-') return 'Not scored';
  if (UNAVAILABLE_VALUE_LABELS[lower]) return UNAVAILABLE_VALUE_LABELS[lower];

  return undefined;
}

/** Short drawer label from a normalized 0–10 score. */
export function interpretScoreBand(score: number): string {
  if (score >= 9.0) return 'Excellent';
  if (score >= 8.0) return 'Very good';
  if (score >= 7.0) return 'Good';
  if (score >= 6.0) return 'Fair';
  if (score >= 5.0) return 'Mixed';
  if (score >= 3.0) return 'Limited';
  if (score >= 1.0) return 'Very limited';
  return 'None found';
}

function scoreVerdict(score: number | null | undefined): string | undefined {
  if (score == null || Number.isNaN(score)) return undefined;
  if (score >= 6.5) return 'Overall: good — a strong result in our tests.';
  if (score >= 5.5) return 'Overall: okay — usable, but with clear weak spots.';
  return 'Overall: poor — likely to disappoint if this matters to you.';
}

function measurementVerdict(results: DraftMeasurement[]): string | undefined {
  const scored = results.filter((m) => m.normalizedScore != null);
  if (scored.length === 0) return undefined;
  const avg = scored.reduce((sum, m) => sum + m.normalizedScore!, 0) / scored.length;
  return scoreVerdict(avg);
}

export function interpretMeasurement(m: DraftMeasurement): string | undefined {
  const availability = availabilityInterpretation(m);
  if (availability) return availability;

  const lower = m.value.trim().toLowerCase();
  const labelLower = m.label.toLowerCase();

  if (lower === 'yes' && m.normalizedScore === 0) {
    if (labelLower.includes('human review')) return 'Human review allowed';
    if (labelLower.includes('expir') || m.slug.includes('expir')) return 'Credits expire';
    return 'Concerning';
  }
  if (lower === 'no' && m.normalizedScore === 0) {
    if (labelLower.includes('encrypt')) return 'Not confirmed';
    return 'Not available';
  }

  const INVERTED_SLUGS = new Set(['consistency', 'repetition', 'refusals', 'errors', 'duplicates']);
  if (INVERTED_SLUGS.has(m.slug) && m.normalizedScore != null) {
    return interpretScoreBand(m.normalizedScore);
  }

  if (m.normalizedScore != null) {
    return interpretScoreBand(m.normalizedScore);
  }

  const count = parseCount(m.value);
  if (count === 0) return 'None found';

  if (lower === 'no' || lower === 'none') return 'Not available';
  if (m.value && m.value !== '—') return 'Not scored';

  return undefined;
}

export function buildHeadlineConclusion(
  name: string,
  results: DraftMeasurement[],
  naContext?: Omit<NotApplicableExplanationInput, 'testResults'>,
): string | undefined {
  if (naContext && isNotApplicableCategory(results)) {
    return buildNotApplicableWhatThisMeans({ ...naContext, testResults: results, evidenceName: name });
  }

  const verified = results.filter((m) => m.value && m.value !== '—' && !isNotApplicableMeasurement(m));
  if (verified.length === 0) return undefined;

  const counts = verified
    .map((m) => ({ m, count: parseCount(m.value) }))
    .filter((x): x is { m: DraftMeasurement; count: number } => x.count != null);

  if (counts.length >= 2) {
    const sorted = [...counts].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const zeros = counts.filter((x) => x.count === 0);
    const weak = counts.filter((x) => x.count > 0 && x.count <= 15);

    if (zeros.length > 0 && top.count >= 40) {
      return `Strong in one area, but weak in several others.`;
    }
    if (weak.length > 0 && top.count >= 40) {
      return `Good overall numbers, but some groups have very little choice.`;
    }
  }

  return undefined;
}

function countForSlug(results: DraftMeasurement[], slug: string): number | null {
  const row = results.find((m) => m.slug === slug);
  return row ? parseCount(row.value) : null;
}

export function buildWhatThisMeans(
  productName: string,
  slug: string,
  results: DraftMeasurement[],
  score?: number | null,
): string | undefined {
  const verified = results.filter((m) => m.value && m.value !== '—');
  if (verified.length === 0) return undefined;

  let body: string | undefined;
  let verdict = scoreVerdict(score) ?? measurementVerdict(verified);

  if (slug === 'amount') {
    const female = countForSlug(verified, 'female-count');
    const male = countForSlug(verified, 'male-count');
    const animeFemale = countForSlug(verified, 'anime-female-count');
    const animeMale = countForSlug(verified, 'anime-male-count');
    const transgender = countForSlug(verified, 'transgender-count');
    const nonBinary = countForSlug(verified, 'non-binary-count');
    const other = countForSlug(verified, 'other-count');

    let out =
      female != null && female >= 40
        ? `${productName} has a big character library`
        : `${productName} has a mixed character library`;

    const weak: string[] = [];
    if (male != null && male <= 20) weak.push(`only ${male} male characters`);
    if (animeFemale != null && animeMale != null && (animeFemale <= 30 || animeMale <= 15)) {
      weak.push(`limited anime options (${animeFemale} anime female, ${animeMale} anime male)`);
    } else if (animeMale != null && animeMale <= 15) {
      weak.push(`very few anime male characters (${animeMale})`);
    }

    const missing: string[] = [];
    if (transgender === 0) missing.push('transgender');
    if (nonBinary === 0) missing.push('non-binary');
    if (other === 0) missing.push('other identity');

    if (weak.length > 0) out += `, but ${weak.join(' and ')}`;
    if (missing.length > 0) {
      out += `${weak.length > 0 ? ', and' : ', but'} no ${missing.join(', ')} characters`;
    }

    body = `${out}.`;
    if (weak.length > 0 || missing.length > 0) {
      verdict = 'Overall: not great for variety seekers — big in some areas, weak in others.';
    } else if (female != null && female >= 40) {
      verdict = 'Overall: good — strong breadth for most users.';
    } else {
      verdict = 'Overall: okay — enough choice for basics, not a standout library.';
    }
  } else if (slug === 'platform-extras-list') {
    const summary = verified[0]?.value;
    body = summary
      ? `${productName} ${summary.toLowerCase().startsWith('no') ? 'does not' : 'includes'} notable bonus features beyond standard chat.`
      : `${productName} has optional extras we noted during testing.`;
    verdict =
      summary?.toLowerCase().startsWith('no') || summary?.toLowerCase().includes('no bonus')
        ? 'Overall: fine if you only care about chat — nothing extra to explore.'
        : 'Overall: nice bonus if you like extras — not required for core chat quality.';
  } else if (verified.length === 1) {
    const row = verified[0];
    const lower = row.value.toLowerCase();
    if (lower === 'yes' || lower === 'available' || lower.startsWith('yes')) {
      body = `${productName} supports ${row.label.toLowerCase()} — we recorded ${row.value}.`;
      verdict = scoreVerdict(score) ?? 'Overall: good — this feature is there when you need it.';
    } else if (lower === 'no' || lower === 'none' || lower.startsWith('no')) {
      body = `${productName} does not offer ${row.label.toLowerCase()} (we recorded ${row.value}).`;
      verdict = scoreVerdict(score) ?? 'Overall: poor — missing if this feature matters to you.';
    } else {
      body = `For most users, this means ${productName} offers ${row.value} for ${row.label.toLowerCase()}.`;
    }
  } else {
    const highlights = verified
      .slice(0, 3)
      .map((m) => `${m.label.toLowerCase()}: ${m.value}`)
      .join(', ');
    body = `In plain terms, ${productName} showed ${highlights}.`;
  }

  if (!body) return verdict;
  return verdict ? `${body} ${verdict}` : body;
}

export function buildPublicHowWeTested(
  productName: string,
  categorySlug: string,
  evidenceSlug: string,
  fallback?: string,
): string {
  if (categorySlug === 'characters' && evidenceSlug === 'amount') {
    return `We opened ${productName}'s character library with a paid account and counted how many characters were in each group.`;
  }
  if (fallback?.trim() && !fallback.toLowerCase().includes('open the character library once')) {
    return fallback.trim();
  }
  return `We tested ${productName} with a paid account and wrote down the results you see below.`;
}

export function buildCalculationSummary(
  productName: string,
  name: string,
  results: DraftMeasurement[],
): string | undefined {
  const scored = results.filter((m) => m.normalizedScore != null);
  if (scored.length < 2) return undefined;

  const sorted = [...scored].sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0));
  const strongest = sorted[0];
  const weakestNonZero = [...sorted].reverse().find((m) => (m.normalizedScore ?? 0) > 0);
  const zeros = scored.filter((m) => (m.normalizedScore ?? 0) === 0);

  const parts: string[] = [];
  if (strongest.normalizedScore != null && strongest.normalizedScore >= 7) {
    parts.push(
      `${productName} scored highly for ${strongest.label.toLowerCase()} (${strongest.value})`,
    );
  }
  if (weakestNonZero && weakestNonZero.slug !== strongest.slug) {
    parts.push(`the smaller ${weakestNonZero.label.toLowerCase()} result (${weakestNonZero.value}) reduced the score`);
  }
  if (zeros.length > 0) {
    const labels = zeros.map((m) => m.label.toLowerCase()).slice(0, 3).join(', ');
    parts.push(`missing ${labels} groups also lowered the final ${name.toLowerCase()} score`);
  }

  if (parts.length === 0) return undefined;
  return `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)}${parts.length > 1 ? `, but ${parts.slice(1).join(', and ')}` : ''}.`;
}

export function buildEvidenceCalculation(
  name: string,
  score: number | null,
  results: DraftMeasurement[],
  opts?: {
    categorySlug?: string;
    subscoreSlug?: string;
    groupLabel?: string;
    memberSlugs?: string[];
  },
): DraftEvidenceCalculation | undefined {
  const scored = results.filter((m) => m.normalizedScore != null);
  if (score == null || scored.length === 0) return undefined;

  const intro =
    scored.length === 1
      ? `This score comes straight from the result below.`
      : `Each group gets a score from 0 to 10. We combine those scores to get the final ${name} score.`;

  if (scored.length === 1) {
    const m = scored[0];
    const contribution = m.normalizedScore != null ? round2(m.normalizedScore) : null;
    return {
      intro,
      method: 'single',
      rows: [
        {
          label: m.label,
          measuredValue: m.value,
          internalScore: m.normalizedScore ?? null,
          weight: 100,
          contribution,
        },
      ],
      formulaParts: contribution != null ? [contribution.toFixed(2)] : [],
      formulaTotal: contribution,
      finalScore: score,
    };
  }

  const memberSlugs = opts?.memberSlugs ?? scored.map((m) => m.slug);

  if (opts?.categorySlug && opts?.subscoreSlug && memberSlugs.length > 1) {
    const nominalWeights = getMemberNominalWeights(
      opts.categorySlug,
      opts.subscoreSlug,
      memberSlugs,
    );
    const weightBySlug = new Map(memberSlugs.map((slug, i) => [slug, nominalWeights[i] ?? 0]));
    const calcItems = memberSlugs
      .map((slug) => {
        const measurement = scored.find((m) => m.slug === slug);
        if (!measurement) return null;
        return {
          name: measurement.label,
          score: measurement.normalizedScore,
          nominalWeight: weightBySlug.get(slug) ?? 0,
          measurement,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null);

    const { rows: calcRows } = buildRedistributedCalcItems(
      calcItems.map((item) => ({
        name: item.name,
        score: item.score,
        nominalWeight: item.nominalWeight,
      })),
    );

    const rows: DraftEvidenceCalculationRow[] = calcItems.map((item, index) => ({
      label: item.measurement.label,
      measuredValue: item.measurement.value,
      internalScore: item.measurement.normalizedScore ?? null,
      weight: calcRows[index]?.weight ?? 0,
      contribution: calcRows[index]?.contribution ?? null,
    }));

    const formulaParts = rows
      .map((r) => r.contribution)
      .filter((v): v is number => v != null)
      .map((v) => v.toFixed(2));
    const formulaTotal = round2(formulaParts.reduce((sum, p) => sum + Number.parseFloat(p), 0));

    return {
      intro,
      method: 'average',
      rows,
      formulaParts,
      formulaTotal,
      finalScore: score ?? (formulaTotal > 0 ? Math.round(formulaTotal * 10) / 10 : null),
    };
  }

  const allWeights =
    opts?.categorySlug && opts?.subscoreSlug
      ? buildMemberWeightsInGroup(
          opts.categorySlug,
          opts.subscoreSlug,
          opts.groupLabel ?? name,
          memberSlugs,
        )
      : memberSlugs.map(() => round2(100 / memberSlugs.length));
  const weightBySlug = new Map(memberSlugs.map((slug, i) => [slug, allWeights[i] ?? 0]));

  const rows: DraftEvidenceCalculationRow[] = scored.map((m) => {
    const weight =
      weightBySlug.get(m.slug) ??
      weightBySlug.get(memberSlugs.find((s) => s === m.slug) ?? '') ??
      round2(100 / scored.length);
    return {
      label: m.label,
      measuredValue: m.value,
      internalScore: m.normalizedScore ?? null,
      weight,
      contribution:
        m.normalizedScore != null ? round2(weightedValue(m.normalizedScore, weight)) : null,
    };
  });

  const formulaParts = rows
    .map((r) => r.contribution)
    .filter((v): v is number => v != null)
    .map((v) => v.toFixed(2));
  const formulaTotal = round2(formulaParts.reduce((sum, p) => sum + Number.parseFloat(p), 0));

  return {
    intro,
    method: 'average',
    rows,
    formulaParts,
    formulaTotal,
    finalScore: score,
  };
}

export function buildProofDescription(
  proof: DraftProofItem,
  related?: DraftMeasurement,
  productName?: string,
): { title: string; description: string } {
  const base = proof.caption?.trim() || related?.label || 'Test proof';
  const title = base.replace(/^Evidence:\s*/i, '').trim();

  if (related?.value && related.value !== '—') {
    return {
      title,
      description: `Shows the visible ${related.label.toLowerCase()} results used for the count of ${related.value}${productName ? ` on ${productName}` : ''}.`,
    };
  }

  if (proof.caption && proof.caption.length > 24) {
    return { title, description: proof.caption };
  }

  return {
    title,
    description: `Supporting screenshot captured during our ${title.toLowerCase()} test.`,
  };
}

export function buildTechnicalAuditRows(
  memberSlugs: string[] | undefined,
  results: DraftMeasurement[],
  bySlug: Map<string, { id: string; slug: string }>,
  methodologyVersion?: string,
  lastTested?: string,
): string[] {
  const lines: string[] = [];
  if (methodologyVersion) lines.push(`Methodology version: ${methodologyVersion}`);
  if (lastTested) lines.push(`Test date: ${lastTested}`);

  for (const m of results) {
    const row = bySlug.get(m.slug);
    lines.push(
      `${m.slug} · metric ID: ${m.slug}${row ? ` · evidence record: ${row.id}` : ''} · raw value: ${m.value}${m.normalizedScore != null ? ` · internal score: ${m.normalizedScore.toFixed(1)}` : ''}`,
    );
  }

  if (memberSlugs?.length) {
    lines.push(`Member slugs: ${memberSlugs.join(', ')}`);
  }

  return lines;
}

export function methodologyLinkForEvidence(
  categorySlug: string,
  subscoreSlug: string,
  evidenceName: string,
): string {
  return testContributorUrl(categorySlug, subscoreSlug, evidenceName);
}

export function interpretationTone(
  m: DraftMeasurement,
): 'good' | 'fair' | 'poor' | 'neutral' | 'na' {
  if (isNotApplicableMeasurement(m)) return 'na';

  const label = m.interpretation ?? interpretMeasurement(m);
  if (!label) return 'neutral';

  const lower = label.toLowerCase();
  if (lower === 'excellent' || lower === 'very good' || lower === 'good') return 'good';
  if (lower === 'fair' || lower === 'mixed') return 'fair';
  if (lower === 'limited' || lower === 'very limited' || lower === 'none found') return 'poor';
  return 'neutral';
}

export function interpretationBadgeClass(tone?: string): string {
  if (tone === 'good') return 'ratings-drawer-status-badge ratings-drawer-status-badge--good';
  if (tone === 'fair') return 'ratings-drawer-status-badge ratings-drawer-status-badge--limited';
  if (tone === 'poor') return 'ratings-drawer-status-badge ratings-drawer-status-badge--na';
  if (tone === 'na') return 'ratings-drawer-status-badge ratings-drawer-status-badge--neutral';
  return 'ratings-drawer-status-badge';
}

export function enrichMeasurements(results: DraftMeasurement[]): DraftMeasurement[] {
  return results.map((m) => ({
    ...m,
    interpretation: m.interpretation ?? interpretMeasurement(m),
    interpretationTone: m.interpretationTone ?? interpretationTone(m),
  }));
}

export function buildTrustBadges(input: {
  paidAccount?: boolean;
  lastTested?: string;
  methodologyVersion?: string;
  fullLibrary?: boolean;
}): Array<{ icon: string; label: string }> {
  const badges: Array<{ icon: string; label: string }> = [
    {
      icon: 'verified_user',
      label: input.paidAccount ? 'Paid account' : 'Test account',
    },
  ];
  if (input.fullLibrary) {
    badges.push({ icon: 'menu_book', label: 'Full visible library' });
  }
  if (input.lastTested) {
    badges.push({ icon: 'calendar_today', label: `Tested ${input.lastTested}` });
  }
  if (input.methodologyVersion) {
    badges.push({ icon: 'science', label: `Methodology ${input.methodologyVersion}` });
  }
  return badges;
}

const PROOF_SHORT_LABELS: Record<string, string> = {
  'female-count': 'Female',
  'male-count': 'Male',
  'anime-female-count': 'Anime F',
  'anime-male-count': 'Anime M',
  'transgender-count': 'Transgender',
  'non-binary-count': 'Non-binary',
  'other-count': 'Other',
};

export function proofShortCaption(
  proof: DraftProofItem,
  related?: DraftMeasurement,
): string {
  const userCaption = proof.caption?.replace(/^Evidence:\s*/i, '').trim();
  if (userCaption) {
    const pipe = userCaption.indexOf('|');
    const label = pipe === -1 ? userCaption : userCaption.slice(pipe + 1).trim();
    if (label && !label.startsWith('bonus-extra:') && label !== 'live-cam-proof') {
      return label.length <= 48 ? label : `${label.slice(0, 45)}…`;
    }
  }
  if (related?.slug && PROOF_SHORT_LABELS[related.slug]) {
    return PROOF_SHORT_LABELS[related.slug];
  }
  if (related?.label) {
    const short = related.label.replace(/\s+characters?$/i, '').trim();
    if (short.length <= 16) return short;
    return short.split(/\s+/).slice(0, 2).join(' ');
  }
  const caption = proof.caption?.replace(/^Evidence:\s*/i, '').trim();
  if (caption && caption.length <= 20) return caption;
  if (caption) return caption.split(/\s+/).slice(0, 2).join(' ');
  return proof.alt ?? 'Proof';
}

export function formatMetadataRow(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(' · ');
}

export function formatDrawerTestMetadata(input: {
  paidAccount?: boolean;
  fullLibrary?: boolean;
  lastTested?: string;
  methodologyVersion?: string;
}): string {
  return formatMetadataRow([
    input.paidAccount ? 'Paid account' : 'Test account',
    input.fullLibrary ? 'Full library' : undefined,
    input.lastTested,
    input.methodologyVersion,
  ]);
}

export function buildSubscoreCalcScope(
  productName: string,
  subscoreName: string,
  scopeDescription?: string,
): string {
  if (scopeDescription?.trim()) {
    let text = scopeDescription.trim();
    if (text.includes('the AI')) {
      return text.replace(/the AI/gi, productName);
    }
    if (!text.toLowerCase().includes(productName.toLowerCase())) {
      return `${productName}: ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
    }
    return text;
  }
  return `How ${productName} performs on ${subscoreName.toLowerCase()} in our hands-on testing.`;
}

export function buildSubscoreCalcHeadline(
  subscoreName: string,
  items: Array<{ name: string; score: number | null; contribution?: number | null }>,
): string {
  const scored = items.filter((i) => i.score != null);
  if (scored.length === 0) {
    return `Weighted combination of evidence categories for the final ${subscoreName} score.`;
  }
  const totalContrib = items.reduce((sum, i) => sum + (i.contribution ?? 0), 0);
  const avgScore =
    totalContrib > 0
      ? totalContrib
      : scored.reduce((sum, i) => sum + i.score!, 0) / scored.length;
  const band = interpretScoreBand(avgScore);
  const sorted = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  if (avgScore >= 7) {
    return `${band} ${subscoreName.toLowerCase()} — strongest on ${highest.name.toLowerCase()}.`;
  }
  if (avgScore >= 5) {
    return `${band} ${subscoreName.toLowerCase()} — ${highest.name} leads; ${lowest.name.toLowerCase()} pulls it down.`;
  }
  return `${band} ${subscoreName.toLowerCase()} — ${lowest.name.toLowerCase()} is the main weak spot.`;
}

export function buildSubscoreKeyTakeaways(
  productName: string,
  items: Array<{ name: string; score: number | null }>,
  fallback?: string,
): string {
  if (fallback?.trim() && fallback.length > 40) {
    const text = fallback.trim();
    if (text.toLowerCase().includes(productName.toLowerCase())) return text;
    return `${productName} ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }
  const scored = items.filter((i) => i.score != null);
  if (scored.length === 0) {
    return `${productName} combines several evidence categories into this subscore.`;
  }
  const sorted = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const strengths = sorted.slice(0, 2).map((i) => i.name.toLowerCase());
  const weakest = sorted[sorted.length - 1];
  if (scored.length >= 3 && strengths.length >= 2) {
    return `${productName} performs very well on ${strengths[0]} and ${strengths[1]}. ${weakest.name} is the main area pulling the score down.`;
  }
  if (scored.length >= 2) {
    return `${productName} is strongest on ${strengths[0]}. ${weakest.name} is the main area pulling the score down.`;
  }
  return `${productName} scored this area based on ${scored[0].name.toLowerCase()} in our testing.`;
}

export { round1 };
