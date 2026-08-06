// Reference URLs attached to an evidence result (policy pages, settings links, etc.).

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { dataApi } from '../api';
import { Button, Icon, TextInput } from '../ui';
import { parseProofLinks, type ProofLink } from './proofLinks';

export type EvidenceLinksHandle = {
  /** Save URL/label draft fields if the user did not click Add link. */
  flushPending: () => Promise<void>;
};

export const EvidenceLinks = forwardRef<
  EvidenceLinksHandle,
  {
    resultId: string | null;
    proofLinks: ProofLink[];
    ensureResultId: () => Promise<string>;
    disabled?: boolean;
    onChanged?: () => void;
  }
>(function EvidenceLinks(
  { resultId, proofLinks, ensureResultId, disabled, onChanged },
  ref,
) {
  const [links, setLinks] = useState<ProofLink[]>(proofLinks);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftLabel, setDraftLabel] = useState('');
  const [resolvedResultId, setResolvedResultId] = useState<string | null>(resultId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (resultId) setResolvedResultId(resultId);
  }, [resultId]);

  useEffect(() => {
    setLinks(proofLinks);
  }, [proofLinks]);

  async function resolveResultId(): Promise<string> {
    if (resolvedResultId) return resolvedResultId;
    const id = await ensureResultId();
    setResolvedResultId(id);
    return id;
  }

  async function persist(next: ProofLink[]) {
    setError(null);
    setSaving(true);
    try {
      const id = await resolveResultId();
      await dataApi.update('evidenceResults', id, {
        proofLinks: next.length > 0 ? next : undefined,
      });
      setLinks(next);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save link');
    } finally {
      setSaving(false);
    }
  }

  async function addLink(urlRaw?: string, labelRaw?: string) {
    const url = (urlRaw ?? draftUrl).trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setError('Enter a valid URL (include https://).');
      return;
    }
    const label = (labelRaw ?? draftLabel).trim();
    const next = [...links, { url, ...(label ? { label } : {}) }];
    await persist(next);
    if (urlRaw == null) {
      setDraftUrl('');
      setDraftLabel('');
    }
  }

  useImperativeHandle(ref, () => ({
    flushPending: async () => {
      if (!draftUrl.trim() || disabled || saving) return;
      await addLink();
    },
  }));

  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reference links</p>
      <p className="text-[11px] text-slate-500">
        Add URLs to the policy page, settings screen, or other source you screenshot.
      </p>

      {links.length > 0 && (
        <ul className="space-y-1.5">
          {links.map((link, idx) => (
            <li
              key={`${link.url}-${idx}`}
              className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60"
            >
              <Icon name="link" className="!text-[15px] shrink-0 text-pink-500" />
              <div className="min-w-0 flex-1">
                {link.label && (
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{link.label}</p>
                )}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-[11px] text-pink-600 hover:underline"
                >
                  {link.url}
                </a>
              </div>
              {!disabled && (
                <button
                  type="button"
                  aria-label="Remove link"
                  disabled={saving}
                  onClick={() => void persist(links.filter((_, i) => i !== idx))}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-700"
                >
                  <Icon name="close" className="!text-[16px]" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="space-y-1.5">
          <TextInput
            type="url"
            value={draftUrl}
            disabled={saving}
            placeholder="https://example.com/privacy"
            className="!py-1.5 text-xs"
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void addLink();
              }
            }}
          />
          <TextInput
            value={draftLabel}
            disabled={saving}
            placeholder="Optional label (e.g. Privacy policy §4)"
            className="!py-1.5 text-xs"
            onChange={(e) => setDraftLabel(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            className="!py-1 text-xs"
            disabled={saving || !draftUrl.trim()}
            onClick={() => void addLink()}
          >
            <Icon name="add_link" className="!text-[15px]" /> Add link
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
