import type { ZodError } from 'zod';

const FIELD_LABELS: Record<string, string> = {
  name: 'Product name',
  slug: 'Slug',
  pros: 'Pros',
  cons: 'Cons',
  bestFor: 'Best for',
  notIdealFor: 'Not ideal for',
  headline: 'Category verdict headline',
  verdict: 'Verdict',
  mainStrength: 'Primary strength',
  mainWeakness: 'Primary limitation',
  mainLimitation: 'Primary limitation',
  oneLineVerdict: 'One-line verdict',
  ourTake: 'Our take',
  expertOpinion: 'Expert opinion',
};

function labelForPath(path: (string | number)[]): string {
  const parts = path.map(String);
  if (parts[0] === 'categoryVerdicts' && parts.length >= 2) {
    const category = parts[1];
    const field = parts[2];
    const fieldLabel = field ? FIELD_LABELS[field] ?? field : 'field';
    if (parts.length >= 4 && (parts[2] === 'pros' || parts[2] === 'cons')) {
      const index = Number(parts[3]) + 1;
      const kind = parts[2] === 'pros' ? 'pro' : 'con';
      return `${category} verdict — ${kind} ${index}`;
    }
    return `${category} verdict — ${fieldLabel}`;
  }
  if (parts.length >= 2 && (parts[0] === 'pros' || parts[0] === 'cons')) {
    const index = Number(parts[1]) + 1;
    const kind = parts[0] === 'pros' ? 'pro' : 'con';
    return `${FIELD_LABELS[parts[0]] ?? parts[0]} item ${index}`;
  }
  return FIELD_LABELS[parts[0]] ?? parts.join(' → ');
}

function messageForIssue(issue: ZodError['issues'][number]): string {
  const label = labelForPath(issue.path);
  const kind = 'origin' in issue ? String(issue.origin) : 'type' in issue ? String((issue as { type?: string }).type) : '';
  if (issue.code === 'too_small' && kind === 'string') {
    return `${label} cannot be empty. Remove blank rows or fill them in.`;
  }
  if (issue.code === 'too_big' && kind === 'string') {
    return `${label} is too long.`;
  }
  return `${label}: ${issue.message}`;
}

/** Turn Zod validation output into a short, editor-friendly sentence. */
export function formatValidationError(error: ZodError): string {
  const messages = error.issues.slice(0, 3).map(messageForIssue);
  if (messages.length === 0) return 'Validation failed. Check required fields and try again.';
  if (messages.length === 1) return messages[0];
  return messages.join(' ');
}
