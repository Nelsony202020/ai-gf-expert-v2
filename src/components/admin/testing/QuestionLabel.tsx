// Short question label + portal tooltip (never clipped by tables/modals).

import type { EntityRow } from '../api';
import { testerHelpTooltip, testerQuestion } from './presentation';
import { TestingHint } from './TestingHint';

function questionSizeClass(text: string): string {
  if (text.length > 40) return 'testing-question-long';
  if (text.length > 24) return 'testing-question-medium';
  return '';
}

export function QuestionLabel({
  def,
  categorySlug,
  required,
  className = '',
}: {
  def: EntityRow;
  categorySlug?: string;
  required?: boolean;
  className?: string;
}) {
  const q = testerQuestion(def, categorySlug);
  const hint = testerHelpTooltip(def, categorySlug);
  const sizeClass = questionSizeClass(q);

  return (
    <span className={`inline-flex items-start gap-0.5 ${sizeClass} ${className}`}>
      <span className="min-w-0 break-words">{q}</span>
      {required && <span className="shrink-0 text-red-400"> *</span>}
      {hint ? <TestingHint text={hint} /> : null}
    </span>
  );
}
