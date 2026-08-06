// Compact table for multi-question sessions: question, answer, status, proof.

import { Fragment, useEffect } from 'react';
import type { EntityRow } from '../api';
import { Icon } from '../ui';
import { EvidenceInput, type RawValue } from './EvidenceInput';
import { ChatModesField, parseChatModesDraft } from './ChatModesField';
import { BonusFeaturesField, formatBonusFeaturesSummary } from './BonusExtrasField';
import { SupportContactField, parseSupportContactDraft } from './SupportContactField';
import { SecurityIncidentsField, formatSecurityIncidentsSummary } from './SecurityIncidentsField';
import { AiPrivacyEvidencePanel } from './AiPrivacyEvidencePanel';
import { AiPrivacyRowMeta } from './AiPrivacyRowMeta';
import {
  readAiPrivacyDetails,
} from '../../../lib/ai-privacy/clientHelpers';
import { isAiPrivacySlug } from '../../../lib/ai-privacy/types';
import { RetentionPeriodField, formatRetentionPeriodSummary } from './RetentionPeriodField';
import {
  formatAnswerSummary,
  rowState,
  statusDotClass,
  type RowState,
} from './sessionUi';
import { QuestionLabel } from './QuestionLabel';
import { testerQuestion } from './presentation';
import { allowsNaToggle } from './rubricOptions';
import type { SessionItem } from './sessionUi';
import './testing-ui.css';

interface Draft {
  raw: RawValue | undefined;
  na: boolean;
  dirty: boolean;
  internalNotes: string;
  notesDirty: boolean;
}

export function SessionAnswerTable({
  items,
  categorySlug,
  drafts,
  resultByDef,
  proofCounts,
  activeDefId,
  highlightDefId,
  dropTargetDefId,
  busy,
  onPatch,
  onOpenProof,
  onOpenNote,
  onFocusRow,
  onDragOverRow,
  onDragLeaveTable,
  onDropFiles,
  uploadingProofDefs,
  productFields,
  fixedDenominatorFor,
  modeTypesDef,
  liveCamDef,
  supportChannelsDef,
  productId,
  runId,
  onPatchChatModesChat,
  onPatchChatModesMode,
  onPatchLiveCam,
  onPatchSupportChannels,
  ensureResultForDef,
  onProofUploaded,
  editMemoriesBlocked,
  expandedAiDefId,
  onToggleAiProof,
  onAiReviewChanged,
}: {
  items: SessionItem[];
  categorySlug?: string;
  drafts: Record<string, Draft>;
  resultByDef: Map<string, EntityRow>;
  proofCounts: Map<string, number>;
  activeDefId: string | null;
  highlightDefId?: string | null;
  dropTargetDefId?: string | null;
  busy?: boolean;
  productFields?: Record<string, unknown>;
  fixedDenominatorFor?: (def: EntityRow) => number | undefined;
  modeTypesDef?: EntityRow;
  liveCamDef?: EntityRow;
  supportChannelsDef?: EntityRow;
  productId?: string;
  runId?: string;
  onPatchChatModesChat?: (chatRaw: RawValue | undefined) => void;
  onPatchChatModesMode?: (modeRaw: RawValue | undefined) => void;
  onPatchLiveCam?: (liveRaw: RawValue | undefined) => void;
  onPatchSupportChannels?: (channelsRaw: RawValue | undefined) => void;
  ensureResultForDef?: (defId: string) => Promise<string>;
  onProofUploaded?: () => void;
  editMemoriesBlocked?: boolean;
  onPatch: (defId: string, patch: Partial<Draft>) => void;
  onOpenProof: (defId: string) => void;
  onOpenNote?: (defId: string) => void;
  onFocusRow: (defId: string | null) => void;
  onDragOverRow?: (defId: string) => void;
  onDragLeaveTable?: () => void;
  onDropFiles?: (defId: string, files: FileList) => void;
  uploadingProofDefs?: Set<string>;
  expandedAiDefId?: string | null;
  onToggleAiProof?: (defId: string) => void;
  onAiReviewChanged?: () => void | Promise<void>;
}) {
  useEffect(() => {
    if (!activeDefId) return;
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-session-row="${activeDefId}"]`);
      const active = document.activeElement;
      if (
        active &&
        row?.contains(active) &&
        (active.tagName === 'TEXTAREA' ||
          active.tagName === 'INPUT' ||
          active.tagName === 'SELECT' ||
          active.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }
      const input = row?.querySelector(
        'input, textarea, select, button[role="combobox"]',
      ) as HTMLElement | null;
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
            const draft = drafts[def.id] ?? {
              raw: undefined,
              na: false,
              dirty: false,
              internalNotes: '',
              notesDirty: false,
            };
            const result = resultByDef.get(def.id);
            const state = rowState(def, draft, result);
            const ai = readAiPrivacyDetails(result);
            const hasAnswer = Boolean(draft.raw) || Boolean(result?.rawValue) || draft.na;
            const aiExpanded = expandedAiDefId === def.id;

            const summary = (() => {
              if (
                ai &&
                (ai.fillStatus === 'not_found' || ai.fillStatus === 'not_applicable') &&
                !draft.raw &&
                !draft.na &&
                !result?.rawValue
              ) {
                return 'Not found in uploaded policies';
              }
              if (String(def.slug) === 'chat-modes' && modeTypesDef) {
                const modeDraft = drafts[modeTypesDef.id];
                const p = parseChatModesDraft(draft.raw, modeDraft?.raw);
                if (p.hasModes === 'no') return 'No';
                if (p.hasModes !== 'yes') return '—';
                const rated = p.modes.filter((m) => m.rating).length;
                const total = Number(p.count) || p.modes.length;
                return `${p.count || '?'} modes · ${rated}/${total} rated`;
              }
              if (String(def.slug) === 'platform-extras-list' && liveCamDef) {
                return formatBonusFeaturesSummary(draft.raw, drafts[liveCamDef.id]?.raw);
              }
              if (String(def.slug) === 'support-available' && supportChannelsDef) {
                const channelsDraft = drafts[supportChannelsDef.id];
                const p = parseSupportContactDraft(draft.raw, channelsDraft?.raw);
                if (p.hasSupport === 'no') return 'No support';
                if (p.hasSupport === 'yes') {
                  const n = Object.values(p.channels).filter((v) => v.trim()).length;
                  return n > 0 ? `Yes · ${n} link${n === 1 ? '' : 's'}` : 'Yes';
                }
                return '—';
              }
              if (String(def.slug) === 'security-incidents') {
                return formatSecurityIncidentsSummary(draft.raw);
              }
              if (String(def.slug) === 'retention') {
                return formatRetentionPeriodSummary(draft.raw);
              }
              return formatAnswerSummary(def, draft.raw, draft.na);
            })();

            const isActive = activeDefId === def.id;
            const isHighlighted = highlightDefId === def.id;
            const isDropTarget = dropTargetDefId === def.id;
            const proofN = (() => {
              let n = result?.id ? (proofCounts.get(result.id) ?? 0) : 0;
              if (String(def.slug) === 'platform-extras-list' && liveCamDef) {
                const liveResult = resultByDef.get(liveCamDef.id);
                if (liveResult?.id) n += proofCounts.get(liveResult.id) ?? 0;
              }
              return n;
            })();

            return (
              <Fragment key={def.id}>
                <tr
                  data-session-row={def.id}
                  className={`border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${
                    isActive ? 'is-active' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  } ${isDropTarget ? 'is-drop-target' : ''} ${
                    isHighlighted ? 'bg-amber-50 ring-2 ring-inset ring-amber-400 dark:bg-amber-950/30' : ''
                  }`}
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
                    {String(def.slug) !== 'platform-extras-list' ? (
                      <span className={statusDotClass(state)} title={stateLabel(state)} />
                    ) : (
                      <span className="sr-only">{stateLabel(state)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <QuestionLabel def={def} categorySlug={categorySlug} required={Boolean(def.required)} />
                  </td>
                  <td
                    className="px-3 py-2 align-top"
                    onClick={(e) => {
                      e.stopPropagation();
                      const target = e.target as HTMLElement;
                      if (target.closest('input, textarea, select, button, a, label')) return;
                      onFocusRow(def.id);
                    }}
                  >
                    {isActive && !draft.na ? (
                      <>
                        {String(def.slug) === 'chat-modes' && modeTypesDef && onPatchChatModesChat && onPatchChatModesMode ? (
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
                            return (
                              <BonusFeaturesField
                                disabled={busy}
                                listRaw={listRaw}
                                liveRaw={liveRaw}
                                onListChange={(v) => onPatch(def.id, { raw: v })}
                                onLiveChange={onPatchLiveCam}
                                onOpenProof={() => onOpenProof(def.id)}
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
                        ) : String(def.slug) === 'security-incidents' ? (
                          <SecurityIncidentsField
                            disabled={busy}
                            raw={
                              draft.raw && 'status' in draft.raw && draft.raw.status === 'na'
                                ? undefined
                                : draft.raw
                            }
                            onChange={(v) => onPatch(def.id, { raw: v })}
                          />
                        ) : String(def.slug) === 'retention' ? (
                          <RetentionPeriodField
                            disabled={busy}
                            raw={
                              draft.raw && 'status' in draft.raw && draft.raw.status === 'na'
                                ? undefined
                                : draft.raw
                            }
                            onChange={(v) => onPatch(def.id, { raw: v })}
                          />
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
                        )}
                        {isAiPrivacySlug(String(def.slug)) && ai && (
                          <AiPrivacyRowMeta
                            def={def}
                            result={result ?? null}
                            hasAnswer={hasAnswer}
                            expanded={aiExpanded}
                            onToggleProof={() => onToggleAiProof?.(def.id)}
                            onEnterManually={() => onFocusRow(def.id)}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <span
                          role="button"
                          tabIndex={0}
                          className={`block w-full cursor-text text-sm ${
                            summary === 'Not found in uploaded policies'
                              ? 'text-slate-500 italic dark:text-slate-400'
                              : state === 'todo'
                                ? 'text-slate-300'
                                : 'text-slate-600 dark:text-slate-300'
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onFocusRow(def.id);
                            }
                          }}
                        >
                          {summary}
                        </span>
                        {isAiPrivacySlug(String(def.slug)) && ai && (
                          <AiPrivacyRowMeta
                            def={def}
                            result={result ?? null}
                            hasAnswer={hasAnswer}
                            expanded={aiExpanded}
                            onToggleProof={() => onToggleAiProof?.(def.id)}
                            onEnterManually={() => onFocusRow(def.id)}
                          />
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-1 py-2 text-center align-top" onClick={(e) => e.stopPropagation()}>
                    {allowsNaToggle(def) ? (
                      <input
                        type="checkbox"
                        className="testing-checkbox h-3.5 w-3.5 cursor-pointer rounded border-slate-300"
                        checked={draft.na}
                        disabled={busy}
                        aria-label={`Not applicable: ${testerQuestion(def, categorySlug)}`}
                        onChange={(e) => onPatch(def.id, { na: e.target.checked })}
                      />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-1 py-2 text-center align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center justify-center gap-0.5">
                      {onOpenNote && (
                        <button
                          type="button"
                          className={`inline-flex cursor-pointer items-center rounded-md px-1 py-1 text-xs ${
                            draft.internalNotes.trim() || ai
                              ? 'testing-link hover:bg-[var(--testing-accent-soft)]'
                              : 'text-slate-400 hover:bg-slate-100 hover:text-pink-500 dark:hover:bg-slate-800'
                          }`}
                          onClick={() => onOpenNote(def.id)}
                          title={
                            draft.internalNotes.trim()
                              ? 'Edit internal note'
                              : ai
                                ? 'View AI finding & notes'
                                : 'Add internal note'
                          }
                        >
                          <Icon
                            name="sticky_note_2"
                            className={`!text-[15px] ${draft.internalNotes.trim() || ai ? 'testing-icon-accent' : ''}`}
                          />
                        </button>
                      )}
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
                        {uploadingProofDefs?.has(def.id) ? (
                          <Icon name="progress_activity" className="!text-[15px] animate-spin" />
                        ) : (
                          <Icon name="attach_file" className="!text-[15px]" />
                        )}
                        {proofN > 0 ? proofN : ''}
                      </button>
                    </div>
                  </td>
                </tr>
                {ai && aiExpanded && runId && (
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td colSpan={5} className="px-3 py-3 align-top bg-slate-50/70 dark:bg-slate-900/30">
                      <AiPrivacyEvidencePanel
                        def={def}
                        result={result ?? null}
                        productId={productId}
                        runId={runId}
                        hasAnswer={hasAnswer}
                        rejected={ai.reviewStatus === 'rejected'}
                        onChanged={onAiReviewChanged}
                        onChangeAnswer={() => onFocusRow(def.id)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
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
