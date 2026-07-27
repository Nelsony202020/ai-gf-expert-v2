// Compact table for multi-question sessions: question, answer, status, proof.

import { useEffect } from 'react';
import type { EntityRow } from '../api';
import { Icon } from '../ui';
import { EvidenceInput, type RawValue } from './EvidenceInput';
import { ChatModesField, parseChatModesDraft } from './ChatModesField';
import { BonusFeaturesField, formatBonusFeaturesSummary } from './BonusExtrasField';
import { SupportContactField, parseSupportContactDraft } from './SupportContactField';
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
  dropTargetDefId,
  busy,
  onPatch,
  onOpenProof,
  onFocusRow,
  onDragOverRow,
  onDragLeaveTable,
  onDropFiles,
  productFields,
  fixedDenominatorFor,
  modeTypesDef,
  liveCamDef,
  supportChannelsDef,
  productId,
  onPatchChatModesChat,
  onPatchChatModesMode,
  onPatchLiveCam,
  onPatchSupportChannels,
  ensureResultForDef,
  onProofUploaded,
  editMemoriesBlocked,
}: {
  items: SessionItem[];
  categorySlug?: string;
  drafts: Record<string, Draft>;
  resultByDef: Map<string, EntityRow>;
  proofCounts: Map<string, number>;
  activeDefId: string | null;
  dropTargetDefId?: string | null;
  busy?: boolean;
  productFields?: Record<string, unknown>;
  fixedDenominatorFor?: (def: EntityRow) => number | undefined;
  modeTypesDef?: EntityRow;
  liveCamDef?: EntityRow;
  supportChannelsDef?: EntityRow;
  productId?: string;
  onPatchChatModesChat?: (chatRaw: RawValue | undefined) => void;
  onPatchChatModesMode?: (modeRaw: RawValue | undefined) => void;
  onPatchLiveCam?: (liveRaw: RawValue | undefined) => void;
  onPatchSupportChannels?: (channelsRaw: RawValue | undefined) => void;
  ensureResultForDef?: (defId: string) => Promise<string>;
  onProofUploaded?: () => void;
  editMemoriesBlocked?: boolean;
  onPatch: (defId: string, patch: Partial<Draft>) => void;
  onOpenProof: (defId: string) => void;
  onFocusRow: (defId: string | null) => void;
  onDragOverRow?: (defId: string) => void;
  onDragLeaveTable?: () => void;
  onDropFiles?: (defId: string, files: FileList) => void;
}) {
  useEffect(() => {
    if (!activeDefId) return;
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-session-row="${activeDefId}"]`);
      const input = row?.querySelector('input, textarea, select') as HTMLElement | null;
      input?.focus();
    });
  }, [activeDefId]);

  return (
    <div className="testing-table rounded-lg border border-slate-200 dark:border-slate-700" data-session-table>
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
        <tbody
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            onDragLeaveTable?.();
          }}
        >
          {items.map(({ def }) => {
            const draft = drafts[def.id] ?? { raw: undefined, na: false, dirty: false };
            const result = resultByDef.get(def.id);
            const state = rowState(def, draft, result);
            const summary =
              String(def.slug) === 'chat-modes' && modeTypesDef
                ? (() => {
                    const modeDraft = drafts[modeTypesDef.id];
                    const p = parseChatModesDraft(draft.raw, modeDraft?.raw);
                    if (p.hasModes === 'no') return 'No';
                    if (p.hasModes !== 'yes') return '—';
                    const rated = p.modes.filter((m) => m.rating).length;
                    return `${p.count || '?'} modes · ${rated}/2 rated`;
                  })()
                : String(def.slug) === 'platform-extras-list' && liveCamDef
                  ? formatBonusFeaturesSummary(
                      draft.raw,
                      drafts[liveCamDef.id]?.raw,
                    )
                  : String(def.slug) === 'support-available' && supportChannelsDef
                    ? (() => {
                        const channelsDraft = drafts[supportChannelsDef.id];
                        const p = parseSupportContactDraft(draft.raw, channelsDraft?.raw);
                        if (p.hasSupport === 'no') return 'No support';
                        if (p.hasSupport === 'yes') {
                          const n = Object.values(p.channels).filter((v) => v.trim()).length;
                          return n > 0 ? `Yes · ${n} link${n === 1 ? '' : 's'}` : 'Yes';
                        }
                        return '—';
                      })()
                    : formatAnswerSummary(def, draft.raw, draft.na);
            const isActive = activeDefId === def.id;
            const isDropTarget = dropTargetDefId === def.id;
            const proofN = result?.id ? (proofCounts.get(result.id) ?? 0) : 0;

            return (
              <tr
                key={def.id}
                data-session-row={def.id}
                className={`border-b border-slate-100 last:border-0 dark:border-slate-800 cursor-pointer transition-colors ${
                  isActive ? 'is-active' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                } ${isDropTarget ? 'is-drop-target' : ''}`}
                onClick={() => onFocusRow(def.id)}
                onDragEnter={(e) => {
                  if (!e.dataTransfer.types.includes('Files')) return;
                  e.preventDefault();
                  onDragOverRow?.(def.id);
                }}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes('Files')) return;
                  e.preventDefault();
                  onDragOverRow?.(def.id);
                }}
                onDrop={(e) => {
                  if (!e.dataTransfer.files.length) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onDropFiles?.(def.id, e.dataTransfer.files);
                  onDragLeaveTable?.();
                }}
              >
                <td className="px-2 py-2 align-top">
                  <span className={statusDotClass(state)} title={stateLabel(state)} />
                </td>
                <td className="px-3 py-2 align-top">
                  <QuestionLabel def={def} categorySlug={categorySlug} required={Boolean(def.required)} />
                </td>
                <td
                  className="px-3 py-2 align-top"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusRow(def.id);
                  }}
                >
                  {isActive && !draft.na ? (
                    String(def.slug) === 'chat-modes' && modeTypesDef && onPatchChatModesChat && onPatchChatModesMode ? (
                      (() => {
                        const modeDraft = drafts[modeTypesDef.id] ?? {
                          raw: undefined,
                          na: false,
                          dirty: false,
                        };
                        const chatRaw =
                          draft.raw && 'status' in draft.raw && draft.raw.status === 'na'
                            ? undefined
                            : draft.raw;
                        const modeRaw =
                          modeDraft.raw && 'status' in modeDraft.raw && modeDraft.raw.status === 'na'
                            ? undefined
                            : modeDraft.raw;
                        return (
                          <ChatModesField
                            disabled={busy || (String(def.slug) === 'edit-memories' && editMemoriesBlocked)}
                            chatRaw={chatRaw}
                            modeRaw={modeRaw}
                            onChatChange={onPatchChatModesChat}
                            onModeChange={onPatchChatModesMode}
                          />
                        );
                      })()
                    ) : String(def.slug) === 'platform-extras-list' &&
                      liveCamDef &&
                      ensureResultForDef &&
                      onPatchLiveCam ? (
                      (() => {
                        const listRaw =
                          draft.raw && 'status' in draft.raw && draft.raw.status === 'na'
                            ? undefined
                            : draft.raw;
                        const liveDraft = drafts[liveCamDef.id] ?? {
                          raw: undefined,
                          na: false,
                          dirty: false,
                        };
                        const liveRaw =
                          liveDraft.raw && 'status' in liveDraft.raw && liveDraft.raw.status === 'na'
                            ? undefined
                            : liveDraft.raw;
                        const result = resultByDef.get(def.id);
                        const liveCamResult = resultByDef.get(liveCamDef.id);
                        return (
                          <BonusFeaturesField
                            disabled={busy}
                            def={def}
                            liveCamDef={liveCamDef}
                            listRaw={listRaw}
                            liveRaw={liveRaw}
                            listResultId={result?.id}
                            liveCamResultId={liveCamResult?.id}
                            productId={productId}
                            ensureListResultId={() => ensureResultForDef(def.id)}
                            ensureLiveCamResultId={() => ensureResultForDef(liveCamDef.id)}
                            onListChange={(v) => onPatch(def.id, { raw: v })}
                            onLiveChange={onPatchLiveCam}
                            onUploaded={onProofUploaded}
                          />
                        );
                      })()
                    ) : String(def.slug) === 'support-available' &&
                      supportChannelsDef &&
                      onPatchSupportChannels ? (
                      (() => {
                        const channelsDraft = drafts[supportChannelsDef.id] ?? {
                          raw: undefined,
                          na: false,
                          dirty: false,
                        };
                        const availRaw =
                          draft.raw && 'status' in draft.raw && draft.raw.status === 'na'
                            ? undefined
                            : draft.raw;
                        const channelsRaw =
                          channelsDraft.raw && 'status' in channelsDraft.raw &&
                          channelsDraft.raw.status === 'na'
                            ? undefined
                            : channelsDraft.raw;
                        return (
                          <SupportContactField
                            disabled={busy}
                            availRaw={availRaw}
                            channelsRaw={channelsRaw}
                            onAvailChange={(v) => onPatch(def.id, { raw: v })}
                            onChannelsChange={onPatchSupportChannels}
                          />
                        );
                      })()
                    ) : (
                      <EvidenceInput
                        def={def}
                        compact
                        categorySlug={categorySlug}
                        productFields={productFields}
                        fixedDenominator={fixedDenominatorFor?.(def)}
                        value={
                          draft.raw && 'status' in draft.raw && draft.raw.status === 'na'
                            ? undefined
                            : draft.raw
                        }
                        onChange={(v) => onPatch(def.id, { raw: v })}
                        disabled={busy || (String(def.slug) === 'edit-memories' && editMemoriesBlocked)}
                      />
                    )
                  ) : (
                    <span
                      role="button"
                      tabIndex={0}
                      className={`block w-full cursor-text text-sm ${state === 'todo' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onFocusRow(def.id);
                        }
                      }}
                    >
                      {summary}
                    </span>
                  )}
                </td>
                <td className="px-1 py-2 text-center align-top" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="testing-checkbox h-3.5 w-3.5 cursor-pointer rounded border-slate-300"
                    checked={draft.na}
                    disabled={busy}
                    aria-label={`Not applicable: ${testerQuestion(def, categorySlug)}`}
                    onChange={(e) => onPatch(def.id, { na: e.target.checked })}
                  />
                </td>
                <td className="px-1 py-2 text-center align-top" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`inline-flex cursor-pointer items-center gap-0.5 rounded-md px-1 py-1 text-xs font-medium ${
                      proofN > 0
                        ? 'testing-link hover:bg-[var(--testing-accent-soft)]'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-pink-500 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => onOpenProof(def.id)}
                    title="Upload proof"
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
