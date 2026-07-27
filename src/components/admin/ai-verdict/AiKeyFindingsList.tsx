import type { KeyFinding } from '../../../lib/ai-verdict/suggestionSchema';

export function AiKeyFindingsList({ findings }: { findings: KeyFinding[] }) {
  if (findings.length === 0) {
    return <p className="text-xs text-slate-500">No key findings derived from evidence.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {findings.map((f, i) => (
        <li key={i} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-slate-800 dark:text-slate-200">{f.text}</p>
          {f.evidence_ids.length > 0 && (
            <p className="mt-1 text-[10px] text-slate-400">
              Evidence: {f.evidence_ids.length} reference{f.evidence_ids.length === 1 ? '' : 's'}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
