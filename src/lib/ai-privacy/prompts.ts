import type { PrivacyDocument } from './types';
import { AI_PRIVACY_SLUGS } from './types';
import { documentBodyText } from './scrape';
import { documentLooksLikeRefund } from './classifyUrl';

const SLUG_SPECS: Record<
  (typeof AI_PRIVACY_SLUGS)[number],
  { question: string; options: string; notes: string }
> = {
  'human-review': {
    question: 'Do humans review user chats/content?',
    options: 'status: yes | limited | no | unknown',
    notes:
      'yes = humans may broadly review; limited = only reported/flagged/specific cases; no = not routinely reviewed; unknown = not clearly stated.',
  },
  'data-sharing': {
    question: 'Is user data shared with third parties?',
    options: 'status: yes | optional | limited | no | unknown',
    notes:
      'yes = shared broadly; optional = user can opt out of sharing; limited = only necessary providers/narrow cases; no = not shared; unknown = unclear.',
  },
  advertising: {
    question: 'Is personal data used for advertising?',
    options: 'status: yes | optional | limited | no | unknown',
    notes: 'optional = opt-out available; limited = narrow advertising use; unknown if unclear.',
  },
  retention: {
    question: 'How long does the company keep user data?',
    options: 'raw: { "value": <positive number>, "detail": { "unit": "weeks"|"months"|"years" } }',
    notes:
      'Pick the longest clearly stated fixed duration. Convert days to weeks/months when clear (e.g. 30 days → value 1 unit months, or value 4 unit weeks). If only "as long as necessary" with no number, use status not_found and omit raw or use unknown — do NOT invent a duration.',
  },
  'policy-clarity': {
    question: 'How clear is the privacy policy overall for key data-use questions?',
    options: 'raw: { "value": 0|50|100, "detail": { "rubric": "Unclear"|"Neutral"|"Very clear" } }',
    notes: '0=Unclear, 50=Neutral, 100=Very clear based on whether training, human review, sharing, deletion, retention, and security are plainly answered.',
  },
  training: {
    question: 'Are chats/photos used for AI training?',
    options: 'status: yes | limited | no | unknown',
    notes: 'yes = may be used for training; limited = some data/opt-in limits; no = not used; unknown = not clearly stated.',
  },
  'training-opt-out': {
    question: 'Is there a training opt-out?',
    options: 'status: yes | limited | no | unknown',
    notes: 'yes = clear opt-out; limited = partial/hard to find; no = no opt-out; unknown = unclear.',
  },
  'delete-account': {
    question: 'Does the policy state users can delete their account?',
    options: 'status: yes | limited | no | unknown',
    notes:
      'Policy text only — do not assume in-app UI. yes = account deletion clearly offered; limited = only via support/email or unclear process; no = explicitly not offered; unknown = not stated. Note in rationale that hands-on app testing is still required.',
  },
  'delete-personal-data': {
    question: 'Does the policy state users can delete personal data / request erasure?',
    options: 'status: yes | limited | no | unknown',
    notes:
      'Policy text only. yes = clear deletion/erasure rights (e.g. GDPR request); limited = partial, request-only, or vague; no = not offered; unknown = not stated. Note in rationale that hands-on app testing is still required.',
  },
  refunds: {
    question: 'Are refunds available and what rules apply?',
    options: 'status: yes | limited | no | unknown',
    notes:
      'Use Refund Policy / Terms refund sections when present. yes = clear refunds allowed with reasonable terms; limited = refunds exist but with tight restrictions (e.g. short window, unused credits only); no = no refunds stated; unknown = not clearly stated. Do not infer from privacy policy alone unless it explicitly covers refunds.',
  },
};

export function slugsForPolicyDocuments(documents: PrivacyDocument[]): typeof AI_PRIVACY_SLUGS[number][] {
  const base = AI_PRIVACY_SLUGS.filter((slug) => slug !== 'refunds');
  const hasRefundDoc = documents.some((d) => documentLooksLikeRefund(d));
  return hasRefundDoc ? [...base, 'refunds'] : [...base];
}

/** Slugs the AI will never fill (manual test-account checks only). */
export const MANUAL_ONLY_PRIVACY_SLUGS = ['delete-chats', 'export-data'] as const;

export function buildPrivacySystemPrompt(): string {
  return `You are a careful privacy-policy analyst for a product testing tool.

Hard rules:
1. Use ONLY the documents provided in the user message. Do not use outside knowledge, industry norms, or other products.
2. Never invent facts. If a topic is missing, set status to "not_found" and do not choose "no".
3. If documents conflict, set status to "conflicting", include evidence from each side, and prefer raw with status "unknown" when a yes/limited/no answer is required.
4. Answer choices must match the allowed enums exactly. Do not invent new options or rewrite questions.
5. Every filled/needs_review/conflicting answer should include evidence with exact excerpts copied from the documents (usually under 300 characters) and a distinctive findText phrase (5–12 words) for Ctrl+F.
6. sourceLabel and sourceDocumentId must match the provided document metadata — never invent labels.
7. section should be the document heading when possible, otherwise "Section not identified".
8. confidence: high = directly stated and maps cleanly; medium = implied or combined clauses; low = ambiguous/partial.
9. For "status" on each answer, use ONLY: filled, needs_review, not_found, conflicting, or not_applicable. Never use yes/no/unknown as the answer status — those belong inside raw.status for choice questions.
10. rationale must be 1–4 short plain-language sentences for the tester (what the policy says and why you chose this answer). No bullet lists.
11. Return JSON only matching the schema described by the user.`;
}

export function buildPrivacyUserPrompt(documents: PrivacyDocument[]): string {
  const targetSlugs = slugsForPolicyDocuments(documents);
  const docsBlock = documents
    .map((d, i) => {
      const body = documentBodyText(d);
      return [
        `### Document ${i + 1}`,
        `id: ${d.id}`,
        `label: ${d.label}`,
        `sourceUrl: ${d.sourceUrl || '(none)'}`,
        '--- BEGIN TEXT ---',
        body,
        '--- END TEXT ---',
      ].join('\n');
    })
    .join('\n\n');

  const slugBlock = targetSlugs.map((slug) => {
    const spec = SLUG_SPECS[slug];
    return [
      `## ${slug}`,
      `Question: ${spec.question}`,
      `Allowed: ${spec.options}`,
      `Notes: ${spec.notes}`,
    ].join('\n');
  }).join('\n\n');

  return `Analyze the following policy documents for one product review session.

Return JSON:
{
  "answers": [
    {
      "slug": "<one of the slugs listed below>",
      "status": "filled" | "needs_review" | "not_found" | "conflicting" | "not_applicable",
      "confidence": "high" | "medium" | "low",
      "raw": { ... } OR omit when not_found,
      "rationale": "1-4 plain sentences for the tester explaining what you found",
      "evidence": [
        {
          "sourceDocumentId": "...",
          "sourceLabel": "...",
          "sourceUrl": "...",
          "section": "...",
          "excerpt": "...",
          "findText": "..."
        }
      ]
    }
  ]
}

Include exactly one answer object for each of these slugs: ${targetSlugs.join(', ')}.

${slugBlock}

# Documents

${docsBlock}`;
}
