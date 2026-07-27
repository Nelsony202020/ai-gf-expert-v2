import { Button } from '../ui';
import type { AiSuggestionOutput } from '../../../lib/ai-verdict/suggestionSchema';

interface FieldBlock {
  text: string;
  evidence_ids?: string[];
}

export function AiSuggestionField({
  label,
  block,
  onInsert,
  onDismiss,
  busy,
}: {
  label: string;
  block: FieldBlock | undefined;
  onInsert: () => void;
  onDismiss: () => void;
  busy?: boolean;
}) {
  if (!block?.text) return null;
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{block.text}</p>
      {block.evidence_ids && block.evidence_ids.length > 0 && (
        <p className="mt-1 text-[10px] text-slate-400">
          {block.evidence_ids.length} evidence reference{block.evidence_ids.length === 1 ? '' : 's'}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" className="!py-1 text-xs" disabled={busy} onClick={onInsert}>
          Insert
        </Button>
        <Button variant="ghost" className="!py-1 text-xs" disabled={busy} onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function AiSuggestionListField({
  label,
  items,
  onInsertAll,
  busy,
}: {
  label: string;
  items: FieldBlock[] | undefined;
  onInsertAll: () => void;
  busy?: boolean;
}) {
  if (!items?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <Button variant="secondary" className="!py-1 text-xs" disabled={busy} onClick={onInsertAll}>
          Insert all
        </Button>
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
            • {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function extractOverallFields(output: AiSuggestionOutput) {
  return {
    oneLineVerdict: output.one_line_verdict?.text,
    ourTake: output.overall_verdict?.text,
    mainStrength: output.primary_strength?.text,
    mainLimitation: output.primary_limitation?.text,
    directoryDescription: output.short_directory_description?.text,
    bestFor: output.best_for?.map((x) => x.text),
    notIdealFor: output.not_ideal_for?.map((x) => x.text),
    pros: output.pros?.map((x) => x.text),
    cons: output.cons?.map((x) => x.text),
  };
}

export function extractCategoryFields(output: AiSuggestionOutput) {
  return {
    headline: output.category_verdict_headline?.text,
    verdict: output.category_verdict?.text,
    mainStrength: output.category_primary_strength?.text,
    mainWeakness: output.category_primary_limitation?.text,
    pros: output.category_pros?.map((x) => x.text),
    cons: output.category_cons?.map((x) => x.text),
  };
}
