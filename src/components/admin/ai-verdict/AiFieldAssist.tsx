// Inline per-field AI assist: a small magic-wand button rendered at the
// bottom of a field. One click generates a suggestion for exactly that field
// (from published test-run evidence) and writes it straight into the input.

import { useState } from 'react';
import { api } from '../api';
import { Button, Icon } from '../ui';
import type { KeyFinding } from '../../../lib/ai-verdict/suggestionSchema';
import type { AiSuggestionDto } from './useAiVerdict';
import {
  applyListInsert,
  applyTextInsert,
  confirmInsertConflict,
  copyToClipboard,
} from './insertHelpers';
import { normalizeListField } from '../../../lib/ai-verdict/notesSchema';
import {
  enforceProsConsLines,
  isProsConsListField,
} from '../../../lib/ai-verdict/fieldPromptHelpers';

type FieldMode = 'write' | 'rewrite' | 'shorten' | 'specific' | 'another';

const MODE_LABELS: Record<FieldMode, string> = {
  write: 'Write fresh',
  rewrite: 'Easier to read',
  shorten: 'Make shorter',
  specific: 'More detail',
  another: 'Another try',
};

export function AiFieldAssist({
  productId,
  testRunId,
  targetField,
  categorySlug,
  currentText = '',
  notesContext,
  hasText,
  list,
  onText,
  onItems,
}: {
  productId: string;
  testRunId?: string;
  targetField: string;
  categorySlug?: string;
  currentText?: string;
  notesContext?: KeyFinding[];
  hasText: boolean;
  list?: boolean;
  onText?: (text: string) => void;
  onItems?: (items: string[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<FieldMode>('write');
  const [preview, setPreview] = useState<string | null>(null);

  const isListField = Boolean(list || (onItems && !onText));

  async function runSuggest(nextMode: FieldMode = mode) {
    setError(null);
    setLoading(true);
    setPreview(null);
    try {
      const res = await api.post<{ suggestion: AiSuggestionDto }>('/api/admin/ai-verdict/generate', {
        productId,
        testRunId,
        scope: 'field',
        categorySlug,
        targetField: isListField ? `${targetField} (return one item per line, no bullets)` : targetField,
        regenerate: true,
        currentText: currentText.trim() || undefined,
        fieldMode: nextMode,
        notesContext: notesContext?.length ? notesContext : undefined,
      });
      let text = res.suggestion.structuredOutput.field_suggestion?.text?.trim();
      if (!text) {
        const out = res.suggestion.structuredOutput;
        const hint =
          out.insufficient_evidence_fields?.length
            ? `Not enough evidence: ${out.insufficient_evidence_fields.join(', ')}`
            : out.warnings?.[0];
        setError(hint ?? 'No suggestion returned — try again.');
        return;
      }
      if (isListField && isProsConsListField(targetField)) {
        text = enforceProsConsLines(text);
      }
      setPreview(text);
      setOpen(true);
      void api.post(`/api/admin/ai-verdict/suggestions/${res.suggestion.id}/insert`, {}).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI suggestion failed');
    } finally {
      setLoading(false);
    }
  }

  function applyPreview(choice: 'insert' | 'replace') {
    if (!preview) return;
    if (isListField) {
      const items = preview
        .split('\n')
        .map((s) => s.replace(/^\s*[-*•]\s*/, '').trim())
        .filter(Boolean);
      if (hasText && choice === 'insert') {
        const existing = normalizeListField(
          currentText
            .split('\n')
            .map((s) => s.replace(/^\s*[-*•]\s*/, '').trim())
            .filter(Boolean),
        );
        const conflict = confirmInsertConflict('This field');
        const next = applyListInsert(existing, items, conflict === 'replace' ? 'replace' : conflict);
        if (next) onItems?.(next);
      } else {
        onItems?.(items);
      }
    } else if (hasText && choice === 'insert') {
      const conflict = confirmInsertConflict('This field');
      const next = applyTextInsert(currentText, preview, conflict);
      if (next) onText?.(next);
    } else {
      onText?.(preview);
    }
    setPreview(null);
    setOpen(false);
  }

  return (
    <span className="inline-flex w-full flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          disabled={loading}
          title="Write with AI"
          aria-label="Write with AI"
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-pink-500 transition-colors hover:bg-pink-50 hover:text-pink-700 disabled:opacity-60 dark:hover:bg-pink-950/40 dark:hover:text-pink-300"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon
            name={loading ? 'progress_activity' : 'auto_awesome'}
            className={`!text-[14px] ${loading ? 'animate-spin' : ''}`}
          />
          {loading ? 'Writing…' : 'Write with AI'}
        </button>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
      </span>

      {open && (
        <div className="rounded-lg border border-pink-100 bg-pink-50/50 p-2.5 dark:border-pink-900/40 dark:bg-pink-950/20">
          {!preview && !loading && (
            <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
              Pick what you want AI to do:
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {(Object.keys(MODE_LABELS) as FieldMode[]).map((m) => (
              <button
                key={m}
                type="button"
                disabled={loading}
                className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                  mode === m
                    ? 'bg-pink-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-pink-100 dark:bg-slate-900 dark:text-slate-300'
                }`}
                onClick={() => {
                  setMode(m);
                  void runSuggest(m);
                }}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {preview && (
            <div className="mt-2 space-y-2">
              <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{preview}</p>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="secondary" className="!py-1 text-xs" onClick={() => applyPreview('replace')}>
                  Use this
                </Button>
                {hasText && (
                  <Button variant="ghost" className="!py-1 text-xs" onClick={() => applyPreview('insert')}>
                    Add below
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="!py-1 text-xs"
                  onClick={() => void copyToClipboard(preview)}
                >
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1 text-xs"
                  onClick={() => void runSuggest('another')}
                >
                  Try again
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1 text-xs"
                  onClick={() => {
                    setPreview(null);
                    setOpen(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

/** @deprecated Section-level bulk assist — use AI notes & suggestions drawer instead. */
export function AiSectionAssist() {
  return null;
}
