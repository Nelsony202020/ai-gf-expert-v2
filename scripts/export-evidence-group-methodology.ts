#!/usr/bin/env npx tsx
/**
 * Evidence-group methodology export for rewriting drawer copy / AI explanations.
 *
 * Uses PUBLIC_EVIDENCE_GROUPS (all 8 categories) — not the slimmer ratings registry.
 *
 * Usage:
 *   npx tsx scripts/export-evidence-group-methodology.ts
 *   npx tsx scripts/export-evidence-group-methodology.ts --json-only
 *
 * Prerequisite: methodology-full-export.json (run export-methodology.ts if missing).
 *
 * Outputs:
 *   evidence-group-methodology-export.md
 *   evidence-group-methodology-export.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getPublicEvidenceGroups } from '../src/lib/test-subscore-public-evidence';
import { getTestSubscoreMethodology } from '../src/data/test-subscore-methodology';
import { getEvidenceMethodology } from '../src/data/evidence-drawer-methodology';
import { enhancedScopeDescription } from '../src/lib/draft-ratings/evidenceDrawerContent';
import { TEST_SESSIONS, type TestSessionDef } from '../src/components/admin/testing/sessions';
import { SAMPLE, chatReplyTotal } from '../src/components/admin/testing/sampleSizes';
import { CHAT_UNDERSTANDING_SCRIPT } from '../src/components/admin/testing/chatTestScript';
import { SHORT_QUESTIONS } from '../src/components/admin/testing/shortQuestions';

const JSON_PATH = resolve(process.cwd(), 'methodology-full-export.json');
const OUT_JSON = resolve(process.cwd(), 'evidence-group-methodology-export.json');
const OUT_MD = resolve(process.cwd(), 'evidence-group-methodology-export.md');

/** Resolved numeric constants — every value ChatGPT needs, with source constant name. */
const SAMPLE_CONSTANTS = {
  characterReview: {
    constant: 'SAMPLE.characterReview',
    value: SAMPLE.characterReview,
    label: `${SAMPLE.characterReview} characters reviewed in the character quality check session`,
    appliesTo: 'characters/quality groups (duplicates, originality, profile-quality, visual-quality)',
  },
  chatConversations: {
    constant: 'SAMPLE.chatConversations',
    value: SAMPLE.chatConversations,
    label: `${SAMPLE.chatConversations} separate chat conversations`,
    appliesTo: 'chat/understanding, chat/realism, chat/reliability groups',
  },
  chatRepliesPerChat: {
    constant: 'SAMPLE.chatRepliesPerChat',
    value: SAMPLE.chatRepliesPerChat,
    label: `${SAMPLE.chatRepliesPerChat} AI replies per chat conversation`,
    appliesTo: 'chat/understanding, chat/realism, chat/reliability groups',
  },
  chatReplyTotal: {
    constant: 'SAMPLE.chatConversations × SAMPLE.chatRepliesPerChat',
    value: chatReplyTotal(),
    label: `${chatReplyTotal()} total AI replies (${SAMPLE.chatConversations} chats × ${SAMPLE.chatRepliesPerChat} replies)`,
    appliesTo: 'chat/understanding, chat/realism, chat/reliability groups',
  },
  imageBatch: {
    constant: 'SAMPLE.imageBatch',
    value: SAMPLE.imageBatch,
    label: `${SAMPLE.imageBatch} generated images in the image batch review session`,
    appliesTo: 'images/quality and images/accuracy groups using the 10-images session (realism, visual-errors, composition, prompt-accuracy)',
  },
  imageConsistency: {
    constant: 'SAMPLE.imageConsistency',
    value: SAMPLE.imageConsistency,
    label: `${SAMPLE.imageConsistency} same-character images in the consistency session`,
    appliesTo: 'images/accuracy consistency groups (character-consistency, face-consistency, body-consistency, style-consistency)',
  },
  videoBatch: {
    constant: 'SAMPLE.videoBatch',
    value: SAMPLE.videoBatch,
    label: `${SAMPLE.videoBatch} generated videos in the video batch review session`,
    appliesTo: 'video/quality groups (motion, accuracy, character-consistency, visual-errors, frame-consistency)',
  },
  refusalPrompts: {
    constant: 'SAMPLE.refusalPrompts',
    value: SAMPLE.refusalPrompts,
    label: `${SAMPLE.refusalPrompts} refusal-test prompts`,
    appliesTo: 'chat/reliability/refusals',
  },
  speedTestReplies: {
    constant: 'SAMPLE.speedTestReplies',
    value: SAMPLE.speedTestReplies,
    label: `${SAMPLE.speedTestReplies} timed replies for the speed test`,
    appliesTo: 'chat/reliability/reply-speed',
  },
  chatMediaAttempts: {
    constant: '(session rule, not SAMPLE)',
    value: 3,
    label: '3 attempts per in-chat media feature',
    appliesTo: 'chat-features/media and chat-features/controls groups',
  },
  creatorControlCharacters: {
    constant: '(session rule, not SAMPLE)',
    value: 5,
    label: '5 test characters in the creator control session',
    appliesTo: 'customization/control groups (custom-prompts, editing, preview)',
  },
} as const;

interface EvidenceRow {
  slug: string;
  name: string;
  publicDescription?: string;
  internalInstructions?: string;
  testInstructions?: string;
  shortDescription?: string;
  whyItMatters?: string;
  sampleSize?: number;
  questionLabel?: string;
}

interface CategoryTree {
  slug: string;
  name: string;
  subscores: { slug: string; name: string; evidence: EvidenceRow[] }[];
}

interface GroupRef {
  groupKey: string;
  categorySlug: string;
  subscoreSlug: string;
  groupSlug: string;
  categoryName: string;
  subscoreName: string;
  groupName: string;
  memberSlugs: string[];
}

interface ResolvedSampleSize {
  /** Human-readable, always includes the actual number when one exists. */
  description: string;
  /** Numeric value when fixed; null for full-library / single-check tests. */
  numericValue: number | null;
  /** Which SAMPLE constant or session rule this came from. */
  source: string;
}

interface MemberExport {
  slug: string;
  name: string;
  sampleSize: ResolvedSampleSize;
  testSession: string | null;
  testSessionIntro: string | null;
  whatItMeasures?: string;
  whyItMatters?: string;
  publicDescription?: string;
  internalInstructions?: string;
  testInstructions?: string[];
  testerQuestion?: string;
  testerHint?: string;
  howWeTestFromTestPage?: string;
  whatWeCount?: string[];
  whatWeDoNotCount?: string[];
}

interface GroupExport {
  groupKey: string;
  category: string;
  subscore: string;
  groupName: string;
  memberSlugs: string[];
  /** Primary sample size for this group — use this in “How we tested” rewrites. */
  exactSampleSize: string;
  applicableConstants: string[];
  whatThisMeasures: string;
  whyItMatters?: string;
  howWeTested: string;
  testSessions: string[];
  drawerCopy?: { whatItMeasures: string; howWeTested: string };
  groupIntro?: string[];
  subscoreHowWeTest?: string[];
  members: MemberExport[];
}

function loadMethodologyTree(): { version: string; categories: CategoryTree[] } {
  if (!existsSync(JSON_PATH)) {
    throw new Error(
      'methodology-full-export.json not found. Run: npx tsx scripts/export-methodology.ts',
    );
  }
  const raw = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  return {
    version: String(raw.methodologyVersion ?? 'unknown'),
    categories: (raw.categories ?? []) as CategoryTree[],
  };
}

function listAllPublicGroups(categories: CategoryTree[]): GroupRef[] {
  const out: GroupRef[] = [];
  for (const cat of categories) {
    for (const sub of cat.subscores) {
      const groups = getPublicEvidenceGroups(cat.slug, sub.slug);
      if (!groups?.length) continue;
      for (const g of groups) {
        out.push({
          groupKey: `${cat.slug}/${sub.slug}/${g.slug}`,
          categorySlug: cat.slug,
          subscoreSlug: sub.slug,
          groupSlug: g.slug,
          categoryName: cat.name,
          subscoreName: sub.name,
          groupName: g.label,
          memberSlugs: g.memberSlugs,
        });
      }
    }
  }
  return out;
}

function evidenceByCategorySlug(
  categories: CategoryTree[],
): Map<string, Map<string, EvidenceRow>> {
  const out = new Map<string, Map<string, EvidenceRow>>();
  for (const cat of categories) {
    const map = new Map<string, EvidenceRow>();
    for (const sub of cat.subscores) {
      for (const e of sub.evidence) map.set(e.slug, e);
    }
    out.set(cat.slug, map);
  }
  return out;
}

function sessionForSlug(categorySlug: string, evidenceSlug: string): TestSessionDef | null {
  for (const session of TEST_SESSIONS[categorySlug] ?? []) {
    if (session.slugs.includes(evidenceSlug)) return session;
  }
  return null;
}

function resolveSampleSize(
  categorySlug: string,
  session: TestSessionDef | null,
  evidence: EvidenceRow | undefined,
): ResolvedSampleSize {
  const sessionBased = (): ResolvedSampleSize | null => {
    if (!session) return null;
    switch (session.id) {
      case 'chat-understanding':
      case 'chat-realism':
      case 'chat-reliability':
        if (evidence?.slug === 'refusals') {
          return {
            description: `${SAMPLE.refusalPrompts} refusal-test prompts`,
            numericValue: SAMPLE.refusalPrompts,
            source: 'SAMPLE.refusalPrompts',
          };
        }
        if (evidence?.slug === 'reply-speed') {
          return {
            description: `${SAMPLE.speedTestReplies} timed replies`,
            numericValue: SAMPLE.speedTestReplies,
            source: 'SAMPLE.speedTestReplies',
          };
        }
        return {
          description: `${SAMPLE.chatConversations} conversations × ${SAMPLE.chatRepliesPerChat} replies = ${chatReplyTotal()} total replies`,
          numericValue: chatReplyTotal(),
          source: 'SAMPLE.chatConversations × SAMPLE.chatRepliesPerChat',
        };
      case 'image-batch-review':
        return {
          description: `${SAMPLE.imageBatch} generated images`,
          numericValue: SAMPLE.imageBatch,
          source: 'SAMPLE.imageBatch',
        };
      case 'image-consistency':
        return {
          description: `${SAMPLE.imageConsistency} same-character images`,
          numericValue: SAMPLE.imageConsistency,
          source: 'SAMPLE.imageConsistency',
        };
      case 'video-batch-review':
        return {
          description: `${SAMPLE.videoBatch} generated videos`,
          numericValue: SAMPLE.videoBatch,
          source: 'SAMPLE.videoBatch',
        };
      case 'chat-media':
      case 'chat-controls':
        return {
          description: '3 attempts per feature',
          numericValue: 3,
          source: 'session rule (3 attempts each)',
        };
      case 'creator-control':
        return {
          description: '5 test characters',
          numericValue: 5,
          source: 'session rule (Make 5 test characters)',
        };
      default:
        return null;
    }
  };

  if (session?.sampleSizeField) {
    const n = session.sampleSizeField.default ?? SAMPLE.characterReview;
    return {
      description: `${n} characters — ${session.sampleSizeField.label} (SAMPLE.characterReview default = ${SAMPLE.characterReview})`,
      numericValue: n,
      source: `TEST_SESSIONS.${session.id}.sampleSizeField`,
    };
  }

  const fromSession = sessionBased();
  if (evidence?.sampleSize != null) {
    const dbVal = evidence.sampleSize;
    if (fromSession && fromSession.numericValue != null && fromSession.numericValue !== dbVal) {
      return {
        description: `${dbVal} per DB evidenceDefinitions.sampleSize (session constant ${fromSession.source} = ${fromSession.numericValue} — both listed; prefer DB + internal instructions for rewrite)`,
        numericValue: dbVal,
        source: `DB evidenceDefinitions.sampleSize (conflicts with ${fromSession.source}=${fromSession.numericValue})`,
      };
    }
    return {
      description: `${dbVal} (DB evidenceDefinitions.sampleSize)`,
      numericValue: dbVal,
      source: 'DB evidenceDefinitions.sampleSize',
    };
  }

  if (fromSession) return fromSession;

  if (!session) {
    return {
      description: 'No fixed numeric sample — count the full library or perform a single check',
      numericValue: null,
      source: 'none',
    };
  }

  switch (session.id) {
    case 'library-tags':
    case 'finding-characters':
    case 'appearance-options':
    case 'personality-options':
      return {
        description: 'Full library or all available options — no fixed numeric sample',
        numericValue: null,
        source: 'count-all session',
      };
    default:
      if (session.intro?.toLowerCase().includes('once')) {
        return {
          description: 'Single review pass — no fixed numeric sample',
          numericValue: null,
          source: session.id,
        };
      }
      return {
        description: `See session intro: ${session.intro ?? session.title}`,
        numericValue: null,
        source: session.id,
      };
  }
}

function splitSteps(text: string | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)/, '').trim())
    .filter(Boolean);
}

function uniqueSampleDescriptions(members: MemberExport[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of members) {
    if (!seen.has(m.sampleSize.description)) {
      seen.add(m.sampleSize.description);
      out.push(m.sampleSize.description);
    }
  }
  return out;
}

function buildApplicableConstants(members: MemberExport[]): string[] {
  const lines = new Set<string>();
  for (const m of members) {
    lines.add(`${m.sampleSize.source}: ${m.sampleSize.description}`);
  }
  return [...lines];
}

function buildGroupExport(
  group: GroupRef,
  evidenceMaps: Map<string, Map<string, EvidenceRow>>,
): GroupExport {
  const { categorySlug, subscoreSlug, groupSlug, groupName, groupKey, memberSlugs } = group;
  const subMethodology = getTestSubscoreMethodology(categorySlug, subscoreSlug);
  const groupContent = subMethodology?.evidenceGroupContent?.[groupSlug];
  const drawerCopy = getEvidenceMethodology(categorySlug, subscoreSlug, groupSlug);

  let whatThisMeasures =
    drawerCopy?.whatItMeasures ??
    groupContent?.intro?.join(' ') ??
    enhancedScopeDescription(groupSlug, groupName) ??
    `What we checked for ${groupName.toLowerCase()} during hands-on testing.`;

  if (!drawerCopy?.whatItMeasures && !groupContent?.intro?.length && subMethodology?.evidenceSections) {
    const sections = subMethodology.evidenceSections.filter((s) => memberSlugs.includes(s.id));
    if (sections.length) whatThisMeasures = sections.map((s) => s.whatItMeasures).join(' ');
  }

  const catEvidence = evidenceMaps.get(categorySlug) ?? new Map();
  const sessionsUsed = new Map<string, TestSessionDef>();
  for (const slug of memberSlugs) {
    const session = sessionForSlug(categorySlug, slug);
    if (session) sessionsUsed.set(session.id, session);
  }

  const sessionList = [...sessionsUsed.values()];
  const primarySession = sessionList[0] ?? null;
  const howWeTested =
    drawerCopy?.howWeTested ??
    primarySession?.intro ??
    subMethodology?.howWeTest.paragraphs.join(' ') ??
    'We tested with a paid account and recorded the results shown below.';

  const members: MemberExport[] = memberSlugs.map((slug) => {
    const evidence = catEvidence.get(slug);
    const session = sessionForSlug(categorySlug, slug);
    const section = subMethodology?.evidenceSections.find((s) => s.id === slug);
    const sq = SHORT_QUESTIONS[`${categorySlug}|${slug}`];

    return {
      slug,
      name: evidence?.name ?? slug,
      sampleSize: resolveSampleSize(categorySlug, session, evidence),
      testSession: session?.title ?? null,
      testSessionIntro: session?.intro ?? null,
      whatItMeasures: section?.whatItMeasures ?? evidence?.shortDescription,
      whyItMatters: section?.whyItMatters ?? evidence?.whyItMatters,
      publicDescription: evidence?.publicDescription,
      internalInstructions: evidence?.internalInstructions,
      testInstructions: splitSteps(evidence?.testInstructions),
      testerQuestion: sq?.q ?? evidence?.questionLabel,
      testerHint: sq?.hint,
      howWeTestFromTestPage: section?.howWeTest,
      whatWeCount: section?.whatWeCount,
      whatWeDoNotCount: section?.whatWeDoNotCount,
    };
  });

  const sampleDescriptions = uniqueSampleDescriptions(members);
  const exactSampleSize =
    sampleDescriptions.length === 1
      ? sampleDescriptions[0]!
      : sampleDescriptions.join(' · ');

  return {
    groupKey,
    category: group.categoryName,
    subscore: group.subscoreName,
    groupName,
    memberSlugs,
    exactSampleSize,
    applicableConstants: buildApplicableConstants(members),
    whatThisMeasures,
    whyItMatters: groupContent?.whyItMatters,
    howWeTested,
    testSessions: sessionList.map((s) => s.title),
    drawerCopy,
    groupIntro: groupContent?.intro,
    subscoreHowWeTest: subMethodology?.howWeTest.paragraphs,
    members,
  };
}

function renderMarkdown(groups: GroupExport[], methodologyVersion: string): string {
  const lines: string[] = [];

  lines.push('# Evidence group methodology export');
  lines.push('');
  lines.push(`Exported: ${new Date().toISOString()}`);
  lines.push(`Methodology version: ${methodologyVersion}`);
  lines.push(`Total public evidence groups: ${groups.length}`);
  lines.push('');
  lines.push('## Instructions for rewriting');
  lines.push('');
  lines.push('Rewrite each group as two short sentences (high-school reading level):');
  lines.push('');
  lines.push('- **What this measures:** …');
  lines.push('- **How we tested:** … (must include the exact number from **Exact sample size** below)');
  lines.push('');
  lines.push('Organize output by **Category → Subscore → Group**. Keep combined groups (Amount, Genders, etc.) as single entries.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Sample size constants (resolved values — do not guess)');
  lines.push('');
  lines.push('| Constant | Value | Meaning |');
  lines.push('|----------|------:|---------|');
  for (const c of Object.values(SAMPLE_CONSTANTS)) {
    lines.push(`| \`${c.constant}\` | **${c.value}** | ${c.label} |`);
  }
  lines.push('');
  lines.push('### Chat understanding test script (used in all standard chat sessions)');
  lines.push('');
  lines.push('Each chat uses the script below. Standard chat testing = **5 conversations × 20 replies = 100 total replies**.');
  lines.push('');
  lines.push('```');
  lines.push(CHAT_UNDERSTANDING_SCRIPT.trim());
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');

  let lastCat = '';
  let lastSub = '';

  for (const g of groups) {
    if (g.category !== lastCat) {
      lastCat = g.category;
      lastSub = '';
      lines.push(`# ${g.category}`);
      lines.push('');
    }
    if (g.subscore !== lastSub) {
      lastSub = g.subscore;
      lines.push(`## ${g.subscore}`);
      lines.push('');
    }

    lines.push(`### ${g.groupName}`);
    lines.push(`\`${g.groupKey}\``);
    lines.push('');
    lines.push(`**Exact sample size:** ${g.exactSampleSize}`);
    lines.push(`**Member slugs:** ${g.memberSlugs.join(', ')}`);
    if (g.testSessions.length) lines.push(`**Test sessions:** ${g.testSessions.join('; ')}`);
    lines.push('');
    lines.push('**What this measures (current):**');
    lines.push(g.whatThisMeasures);
    lines.push('');
    if (g.whyItMatters) {
      lines.push('**Why it matters (current):**');
      lines.push(g.whyItMatters);
      lines.push('');
    }
    lines.push('**How we tested (current drawer copy):**');
    lines.push(g.howWeTested);
    lines.push('');
    if (g.groupIntro?.length) {
      lines.push('**/test page group intro:**');
      for (const p of g.groupIntro) lines.push(p);
      lines.push('');
    }
    if (g.subscoreHowWeTest?.length) {
      lines.push('**Subscore testing approach:**');
      for (const p of g.subscoreHowWeTest) lines.push(p);
      lines.push('');
    }

    lines.push('**Testing steps & sample sizes (per member evidence slug):**');
    lines.push('');
    for (const m of g.members) {
      lines.push(`#### ${m.name} (\`${m.slug}\`)`);
      lines.push(`- Sample size: **${m.sampleSize.description}**`);
      lines.push(`- Source: \`${m.sampleSize.source}\`${m.sampleSize.numericValue != null ? ` (numeric value: **${m.sampleSize.numericValue}**)` : ''}`);
      if (m.testSession) lines.push(`- Session: ${m.testSession}`);
      if (m.testSessionIntro) lines.push(`- Session intro: ${m.testSessionIntro}`);
      if (m.whatItMeasures) lines.push(`- What it measures: ${m.whatItMeasures}`);
      if (m.whyItMatters) lines.push(`- Why it matters: ${m.whyItMatters}`);
      if (m.internalInstructions) {
        lines.push('- Internal instructions:');
        for (const step of splitSteps(m.internalInstructions)) lines.push(`  - ${step}`);
      }
      if (m.testInstructions?.length) {
        lines.push('- Tester steps:');
        for (const step of m.testInstructions) lines.push(`  - ${step}`);
      }
      if (m.howWeTestFromTestPage) lines.push(`- /test page how we test: ${m.howWeTestFromTestPage}`);
      if (m.whatWeCount?.length) lines.push(`- What we count: ${m.whatWeCount.join('; ')}`);
      if (m.whatWeDoNotCount?.length) lines.push(`- What we do not count: ${m.whatWeDoNotCount.join('; ')}`);
      if (m.testerQuestion) lines.push(`- Tester question: ${m.testerQuestion}`);
      if (m.testerHint) lines.push(`- Tester hint: ${m.testerHint}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const jsonOnly = process.argv.includes('--json-only');
  const { version, categories } = loadMethodologyTree();
  const evidenceMaps = evidenceByCategorySlug(categories);
  const groups = listAllPublicGroups(categories).map((g) => buildGroupExport(g, evidenceMaps));

  const payload = {
    exportedAt: new Date().toISOString(),
    methodologyVersion: version,
    groupCount: groups.length,
    rewriteFormat: {
      whatThisMeasures: 'One short sentence, high-school reading level.',
      howWeTested:
        'One short sentence with the exact sample size number (images, videos, chats, replies, characters, or attempts).',
    },
    sampleSizeConstants: SAMPLE_CONSTANTS,
    chatUnderstandingScript: CHAT_UNDERSTANDING_SCRIPT.trim(),
    groups,
  };

  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), 'utf8');
  if (!jsonOnly) writeFileSync(OUT_MD, renderMarkdown(groups, version), 'utf8');

  console.log(`Wrote ${OUT_JSON} (${groups.length} groups)`);
  if (!jsonOnly) console.log(`Wrote ${OUT_MD}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
