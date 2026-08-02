/**
 * Generates src/data/evidence-drawer-methodology.ts from static-drawer-copy markdown.
 * Usage: npx tsx scripts/generate-evidence-drawer-methodology.ts <path-to.md>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface SubscoreCopy {
  whatItMeasures: string;
  scoreCalculation: string;
}

interface EvidenceCopy {
  whatItMeasures: string;
  howWeTested: string;
}

const CATEGORY_SLUGS: Record<string, string> = {
  characters: 'characters',
  customization: 'customization',
  chat: 'chat',
  'chat features': 'chat-features',
  images: 'images',
  video: 'video',
  privacy: 'privacy',
  pricing: 'pricing',
};

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function categorySlug(heading: string): string {
  const key = heading.trim().toLowerCase();
  return CATEGORY_SLUGS[key] ?? toSlug(heading);
}

function escapeTs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function parseMarkdown(md: string): {
  subscores: Record<string, SubscoreCopy>;
  evidence: Record<string, EvidenceCopy>;
} {
  const subscores: Record<string, SubscoreCopy> = {};
  const evidence: Record<string, EvidenceCopy> = {};

  let cat = '';
  let sub = '';
  let level: 'category' | 'subscore' | 'evidence' | null = null;
  let pendingField: 'whatItMeasures' | 'scoreCalculation' | 'howWeTested' | null = null;
  let currentSub: SubscoreCopy | null = null;
  let currentEvidence: EvidenceCopy | null = null;

  function flushSub() {
    if (cat && sub && currentSub) {
      subscores[`${cat}/${sub}`] = currentSub;
    }
    currentSub = null;
  }

  function flushEvidence() {
    if (cat && sub && currentEvidence) {
      const key = `${cat}/${sub}/${toSlug(evidenceKeyName)}`;
      evidence[key] = currentEvidence;
    }
    currentEvidence = null;
  }

  let evidenceKeyName = '';

  for (const rawLine of md.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('Use the text')) continue;

    if (line.startsWith('# ')) {
      flushEvidence();
      flushSub();
      cat = categorySlug(line.slice(2));
      sub = '';
      level = 'category';
      pendingField = null;
      continue;
    }

    if (line.startsWith('## ')) {
      flushEvidence();
      flushSub();
      sub = toSlug(line.slice(3));
      currentSub = { whatItMeasures: '', scoreCalculation: '' };
      level = 'subscore';
      pendingField = null;
      continue;
    }

    if (line.startsWith('### ')) {
      flushEvidence();
      evidenceKeyName = line.slice(4).trim();
      const slug = toSlug(evidenceKeyName);
      currentEvidence = { whatItMeasures: '', howWeTested: '' };
      level = 'evidence';
      pendingField = null;
      // Pre-set key name for special slug overrides applied at write time
      void slug;
      continue;
    }

    const whatMatch = line.match(/^\*\*What this measures:\*\*\s*(.*)$/);
    const calcMatch = line.match(/^\*\*How the score is calculated:\*\*\s*(.*)$/);
    const testMatch = line.match(/^\*\*How we tested:\*\*\s*(.*)$/);

    if (whatMatch) {
      pendingField = 'whatItMeasures';
      const text = whatMatch[1].trim();
      if (level === 'subscore' && currentSub) currentSub.whatItMeasures = text;
      if (level === 'evidence' && currentEvidence) currentEvidence.whatItMeasures = text;
      continue;
    }

    if (calcMatch) {
      pendingField = 'scoreCalculation';
      if (currentSub) currentSub.scoreCalculation = calcMatch[1].trim();
      continue;
    }

    if (testMatch) {
      pendingField = 'howWeTested';
      if (currentEvidence) currentEvidence.howWeTested = testMatch[1].trim();
      continue;
    }

    if (pendingField && currentSub && level === 'subscore') {
      currentSub[pendingField as 'whatItMeasures' | 'scoreCalculation'] += ` ${line}`;
      continue;
    }
    if (pendingField && currentEvidence && level === 'evidence') {
      currentEvidence[pendingField as 'howWeTested' | 'whatItMeasures'] += ` ${line}`;
      continue;
    }
  }

  flushEvidence();
  flushSub();

  // Normalize whitespace
  for (const s of Object.values(subscores)) {
    s.whatItMeasures = s.whatItMeasures.trim();
    s.scoreCalculation = s.scoreCalculation.trim();
  }
  for (const e of Object.values(evidence)) {
    e.whatItMeasures = e.whatItMeasures.trim();
    e.howWeTested = e.howWeTested.trim();
  }

  return { subscores, evidence };
}

function evidenceSlugOverrides(cat: string, sub: string, label: string): string {
  const base = toSlug(label);
  if (cat === 'customization' && sub === 'appearance' && base === 'personality-presets') {
    return 'personality-presets';
  }
  if (cat === 'chat-features' && sub === 'platform-extras' && base === 'other-extras') {
    return 'other-extras';
  }
  if (cat === 'privacy' && sub === 'support' && label === 'Ease of Contact') {
    return 'support-reach';
  }
  if (cat === 'privacy' && sub === 'support' && label === 'Response Speed') {
    return 'support-speed';
  }
  if (cat === 'privacy' && sub === 'support' && label === 'Helpfulness') {
    return 'support-helpfulness';
  }
  if (cat === 'video' && sub === 'quality' && label === 'Prompt Accuracy') {
    return 'accuracy';
  }
  return base;
}

function rekeyEvidence(
  md: string,
  parsed: ReturnType<typeof parseMarkdown>,
): Record<string, EvidenceCopy> {
  const out: Record<string, EvidenceCopy> = {};
  let cat = '';
  let sub = '';
  let evidenceLabel = '';

  for (const rawLine of md.split('\n')) {
    const line = rawLine.trim();
    if (line.startsWith('# ')) {
      cat = categorySlug(line.slice(2));
      sub = '';
      continue;
    }
    if (line.startsWith('## ')) {
      sub = toSlug(line.slice(3));
      continue;
    }
    if (line.startsWith('### ')) {
      evidenceLabel = line.slice(4).trim();
      continue;
    }
    const whatMatch = line.match(/^\*\*What this measures:\*\*\s*(.*)$/);
    const testMatch = line.match(/^\*\*How we tested:\*\*\s*(.*)$/);
    if ((whatMatch || testMatch) && cat && sub && evidenceLabel) {
      const slug = evidenceSlugOverrides(cat, sub, evidenceLabel);
      const key = `${cat}/${sub}/${slug}`;
      const genericKey = `${cat}/${sub}/${toSlug(evidenceLabel)}`;
      const copy = parsed.evidence[genericKey] ?? parsed.evidence[key];
      if (copy) out[key] = copy;
    }
  }

  // Re-parse evidence with proper keys - simpler approach: parse again with slug overrides inline

  return out;
}

function parseMarkdownWithKeys(md: string): {
  subscores: Record<string, SubscoreCopy>;
  evidence: Record<string, EvidenceCopy>;
} {
  const subscores: Record<string, SubscoreCopy> = {};
  const evidence: Record<string, EvidenceCopy> = {};

  let cat = '';
  let sub = '';
  let evidenceLabel = '';
  let mode: 'idle' | 'subscore' | 'evidence' = 'idle';

  let subCopy: SubscoreCopy = { whatItMeasures: '', scoreCalculation: '' };
  let evCopy: EvidenceCopy = { whatItMeasures: '', howWeTested: '' };

  for (const rawLine of md.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('Use the text')) continue;

    if (line.startsWith('# ')) {
      if (cat && sub && evidenceLabel && mode === 'evidence') {
        const slug = evidenceSlugOverrides(cat, sub, evidenceLabel);
        evidence[`${cat}/${sub}/${slug}`] = {
          whatItMeasures: evCopy.whatItMeasures.trim(),
          howWeTested: evCopy.howWeTested.trim(),
        };
      }
      if (cat && sub && mode === 'subscore') {
        subscores[`${cat}/${sub}`] = {
          whatItMeasures: subCopy.whatItMeasures.trim(),
          scoreCalculation: subCopy.scoreCalculation.trim(),
        };
      }
      cat = categorySlug(line.slice(2));
      sub = '';
      evidenceLabel = '';
      mode = 'idle';
      continue;
    }

    if (line.startsWith('## ')) {
      if (cat && sub && evidenceLabel && mode === 'evidence') {
        const slug = evidenceSlugOverrides(cat, sub, evidenceLabel);
        evidence[`${cat}/${sub}/${slug}`] = {
          whatItMeasures: evCopy.whatItMeasures.trim(),
          howWeTested: evCopy.howWeTested.trim(),
        };
        evidenceLabel = '';
      }
      if (cat && sub && mode === 'subscore') {
        subscores[`${cat}/${sub}`] = {
          whatItMeasures: subCopy.whatItMeasures.trim(),
          scoreCalculation: subCopy.scoreCalculation.trim(),
        };
      }
      sub = toSlug(line.slice(3));
      subCopy = { whatItMeasures: '', scoreCalculation: '' };
      mode = 'subscore';
      continue;
    }

    if (line.startsWith('### ')) {
      if (cat && sub && evidenceLabel && mode === 'evidence') {
        const slug = evidenceSlugOverrides(cat, sub, evidenceLabel);
        evidence[`${cat}/${sub}/${slug}`] = {
          whatItMeasures: evCopy.whatItMeasures.trim(),
          howWeTested: evCopy.howWeTested.trim(),
        };
      }
      if (cat && sub && mode === 'subscore') {
        subscores[`${cat}/${sub}`] = {
          whatItMeasures: subCopy.whatItMeasures.trim(),
          scoreCalculation: subCopy.scoreCalculation.trim(),
        };
      }
      evidenceLabel = line.slice(4).trim();
      evCopy = { whatItMeasures: '', howWeTested: '' };
      mode = 'evidence';
      continue;
    }

    const whatMatch = line.match(/^\*\*What this measures:\*\*\s*(.*)$/);
    const calcMatch = line.match(/^\*\*How the score is calculated:\*\*\s*(.*)$/);
    const testMatch = line.match(/^\*\*How we tested:\*\*\s*(.*)$/);

    if (whatMatch) {
      if (mode === 'subscore') subCopy.whatItMeasures = whatMatch[1].trim();
      if (mode === 'evidence') evCopy.whatItMeasures = whatMatch[1].trim();
      continue;
    }
    if (calcMatch && mode === 'subscore') {
      subCopy.scoreCalculation = calcMatch[1].trim();
      continue;
    }
    if (testMatch && mode === 'evidence') {
      evCopy.howWeTested = testMatch[1].trim();
      continue;
    }
  }

  if (cat && sub && evidenceLabel && mode === 'evidence') {
    const slug = evidenceSlugOverrides(cat, sub, evidenceLabel);
    evidence[`${cat}/${sub}/${slug}`] = {
      whatItMeasures: evCopy.whatItMeasures.trim(),
      howWeTested: evCopy.howWeTested.trim(),
    };
  }
  if (cat && sub && mode === 'subscore') {
    subscores[`${cat}/${sub}`] = {
      whatItMeasures: subCopy.whatItMeasures.trim(),
      scoreCalculation: subCopy.scoreCalculation.trim(),
    };
  }

  // Combined platform-extras drawer slug used in review UI
  if (subscores['chat-features/platform-extras']) {
    evidence['chat-features/platform-extras/platform-extras'] = {
      whatItMeasures: subscores['chat-features/platform-extras'].whatItMeasures,
      howWeTested:
        'We opened Live Cam when available, reviewed other bonus features on the platform, and recorded what each feature does.',
    };
  }

  // Candy-specific pricing slug alias target
  if (evidence['pricing/free-access/free-value']) {
    evidence['pricing/free-access/free-trial'] = evidence['pricing/free-access/free-value'];
  }

  return { subscores, evidence };
}

function renderTs(subscores: Record<string, SubscoreCopy>, evidence: Record<string, EvidenceCopy>): string {
  const subLines = Object.entries(subscores)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, copy]) =>
        `  '${key}': {\n    whatItMeasures: '${escapeTs(copy.whatItMeasures)}',\n    scoreCalculation: '${escapeTs(copy.scoreCalculation)}',\n  },`,
    )
    .join('\n');

  const evLines = Object.entries(evidence)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, copy]) =>
        `  '${key}': {\n    whatItMeasures: '${escapeTs(copy.whatItMeasures)}',\n    howWeTested: '${escapeTs(copy.howWeTested)}',\n  },`,
    )
    .join('\n');

  return `// Auto-generated from static drawer copy — do not edit by hand.
// Regenerate: npx tsx scripts/generate-evidence-drawer-methodology.ts <copy.md>

export interface SubscoreMethodologyCopy {
  whatItMeasures: string;
  scoreCalculation: string;
}

export interface EvidenceMethodologyCopy {
  whatItMeasures: string;
  howWeTested: string;
}

export const SUBSCORE_METHODOLOGY: Record<string, SubscoreMethodologyCopy> = {
${subLines}
};

export const EVIDENCE_METHODOLOGY: Record<string, EvidenceMethodologyCopy> = {
${evLines}
};

const EVIDENCE_SLUG_ALIASES: Record<string, string> = {
  'customization/appearance/creator-personalities': 'customization/appearance/personality-presets',
  'chat-features/platform-extras/platform-extras-list': 'chat-features/platform-extras/other-extras',
  'video/quality/prompt-accuracy': 'video/quality/accuracy',
  'privacy/support/ease-of-contact': 'privacy/support/support-reach',
  'privacy/support/response-speed': 'privacy/support/support-speed',
  'privacy/support/helpfulness': 'privacy/support/support-helpfulness',
  'pricing/free-access/free-trial': 'pricing/free-access/free-value',
};

export function getSubscoreMethodology(
  categorySlug: string,
  subscoreSlug: string,
): SubscoreMethodologyCopy | undefined {
  return SUBSCORE_METHODOLOGY[\`\${categorySlug}/\${subscoreSlug}\`];
}

export function getEvidenceMethodology(
  categorySlug: string,
  subscoreSlug: string,
  evidenceSlug: string,
): EvidenceMethodologyCopy | undefined {
  if (!categorySlug || !subscoreSlug || !evidenceSlug) return undefined;
  const key = \`\${categorySlug}/\${subscoreSlug}/\${evidenceSlug}\`;
  const resolved = EVIDENCE_SLUG_ALIASES[key] ?? key;
  return EVIDENCE_METHODOLOGY[resolved];
}
`;
}

const input = process.argv[2] ?? resolve(process.cwd(), 'static-drawer-copy-v3.1.md');
const output = resolve(process.cwd(), 'src/data/evidence-drawer-methodology.ts');
const md = readFileSync(input, 'utf8');
const { subscores, evidence } = parseMarkdownWithKeys(md);

writeFileSync(output, renderTs(subscores, evidence), 'utf8');
console.log(`Wrote ${output}`);
console.log(`Subscores: ${Object.keys(subscores).length}, Evidence: ${Object.keys(evidence).length}`);
