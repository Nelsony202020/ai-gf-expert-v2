// Compact table for multi-question sessions: question, answer, status, proof.

import type { EntityRow } from '../api';
import { Icon } from '../ui';
import { EvidenceInput, type RawValue } from './EvidenceInput';
import {
  formatAnswerSummary,
  rowState,
  statusDotClass,
  type RowState,
} from './sessionUi';
import { QuestionLabel } from './QuestionLabel';
import { testerQuestion } from './presentation';
import type { SessionItem } from './sessionUi';
import './testing-ui.css';

interface Draft {
  raw: RawValue | undefined;
  na: boolean;
  dirty: boolean;
}

export function SessionAnswerTable({
  items,
  categorySlug,
  drafts,
  resultByDef,
  proofCounts,
  activeDefId,
  busy,
  onPatch,
  onOpenProof,
  onFocusRow,
}: {
  items: SessionItem[];
  categorySlug?: string;
  drafts: Record<string, Draft>;
  resultByDef: Map<string, EntityRow>;
  proofCounts: Map<string, number>;
  activeDefId: string | null;
  busy?: boolean;
  onPatch: (defId: string, patch: Partial<Draft>) => void;
  onOpenProof: (defId: string) => void;
  onFocusRow: (defId: string | null) => void;
}) {
  return (
    <div className="testing-table rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-8" />
          <col style={{ width: '34%' }} />
          <col style={{ width: 'auto' }} />
          <col className="w-11" />
          <col className="w-14" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-800/50">
            <th className="px-2 py-2" aria-label="Status" />
            <th className="px-3 py-2 text-left">Question</th>
            <th className="px-3 py-2 text-left">Answer</th>
            <th className="px-1 py-2 text-center">N/A</th>
            <th className="px-1 py-2 text-center">Proof</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ def }) => {
            const draft = drafts[def.id] ?? { raw: undefined, na: false, dirty: false };
            const result = resultByDef.get(def.id);
            const state = rowState(def, draft, result);
            const summary = formatAnswerSummary(def, draft.raw, draft.na);
            const isActive = activeDefId === def.id;
            const proofN = result?.id ? (proofCounts.get(result.id) ?? 0) : 0;

            return (
              <tr
                key={def.id}
                className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${isActive ? 'is-active' : ''}`}
                onClick={() => onFocusRow(def.id)}
              >
                <td className="px-2 py-2 align-top">
                  <span className={statusDotClass(state)} title={stateLabel(state)} />
                </td>
                <td className="px-3 py-2 align-top">
                  <QuestionLabel def={def} categorySlug={categorySlug} required={Boolean(def.required)} />
                </td>
                <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
                  {isActive && !draft.na ? (
                    <EvidenceInput
                      def={def}
                      compact
                      value={
                        draft.raw && 'status' in draft.raw && draft.raw.status === 'na'
                          ? undefined
                          : draft.raw
                      }
                      onChange={(v) => onPatch(def.id, { raw: v })}
                      disabled={busy}
                    />
                  ) : (
                    <span
                      className={`block text-sm ${state === 'todo' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {summary}
                    </span>
                  )}
                </td>
                <td className="px-1 py-2 text-center align-top" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="testing-checkbox h-3.5 w-3.5 rounded border-slate-300"
                    checked={draft.na}
                    disabled={busy}
                    aria-label={`Not applicable: ${testerQuestion(def, categorySlug)}`}
                    onChange={(e) => onPatch(def.id, { na: e.target.checked })}
                  />
                </td>
                <td className="px-1 py-2 text-center align-top" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-0.5 rounded-md px-1 py-1 text-xs font-medium ${
                      proofN > 0
                        ? 'testing-link hover:bg-[var(--testing-accent-soft)]'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-pink-500 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => onOpenProof(def.id)}
                    title="Proof & notes"
                  >
                    <Icon name="attach_file" className="!text-[15px]" />
                    {proofN > 0 ? proofN : ''}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function stateLabel(state: RowState): string {
  if (state === 'unsaved') return 'Unsaved changes';
  if (state === 'done') return 'Done';
  if (state === 'na') return 'Not applicable';
  return 'Not answered';
}
