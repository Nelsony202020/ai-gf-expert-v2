import { useEffect, useState } from 'react';
import { dataApi } from '../api';
import { Field, Icon, TextInput } from '../ui';
import { MediaRoleFields } from '../workspace/tabs/MediaRoleFields';
import {
  readMediaRoleState,
  writeMediaRoleState,
  type MediaRoleState,
} from '../../../lib/media/catalog';
import type { ImageInspectorTarget } from './reviewEditorContext';

const WIDTH_PRESETS = [30, 40, 50, 60, 70, 80, 90, 100] as const;
const RADIUS_PRESETS = [0, 4, 8, 12, 16, 24, 50] as const;

export function ImageInspectorPanel({
  target,
  onClose,
  openImagePicker,
  productId,
}: {
  target: ImageInspectorTarget;
  onClose: () => void;
  openImagePicker: (onPick: (media: { url: string; altText?: string; id: string; caption?: string }) => void) => void;
  productId: string;
}) {
  const initial = readTargetAttrs(target);
  const [alt, setAlt] = useState(initial.alt);
  const [caption, setCaption] = useState(initial.caption);
  const [widthPercent, setWidthPercent] = useState(initial.widthPercent);
  const [borderRadiusPercent, setBorderRadiusPercent] = useState(initial.borderRadiusPercent);
  const [roleState, setRoleState] = useState<MediaRoleState>({
    character: false,
    contextTag: '',
    hero: false,
  });
  const mediaId = String(target.attrs.mediaId ?? '');

  useEffect(() => {
    applyTargetPatch(target, { alt, caption, widthPercent, borderRadiusPercent });
  }, [target, alt, caption, widthPercent, borderRadiusPercent]);

  useEffect(() => {
    if (!mediaId) return;
    let cancelled = false;
    dataApi
      .get('media', mediaId)
      .then(({ row }) => {
        if (cancelled) return;
        setRoleState(readMediaRoleState(row));
        if (row.altText) setAlt(String(row.altText));
        if (row.caption) setCaption(String(row.caption));
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  useEffect(() => {
    if (!mediaId) return;
    const timer = window.setTimeout(() => {
      const { role, mediaTags } = writeMediaRoleState(roleState, { placement: 'gallery' });
      void dataApi.update(
        'media',
        mediaId,
        {
          role,
          mediaTags,
          altText: alt.trim() || undefined,
          caption: caption.trim() || undefined,
          approved: true,
        },
        { product: productId },
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [mediaId, roleState, alt, caption, productId]);

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Image settings</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Replace image"
            aria-label="Replace image"
            onClick={() => {
              openImagePicker((m) => {
                applyTargetPatch(target, { src: m.url, alt: m.altText, mediaId: m.id, caption: m.caption ?? caption });
                if (m.altText) setAlt(m.altText);
                if (m.caption) setCaption(m.caption);
              });
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon name="image" className="!text-[18px]" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image settings"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon name="close" className="!text-[18px]" />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <Field label="Alt text">
          <TextInput value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
        </Field>
        <Field label="Caption">
          <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional caption" />
        </Field>
        {mediaId && (
          <MediaRoleFields
            value={roleState}
            onChange={setRoleState}
            showHero={false}
            radioName="inspector-media-context"
          />
        )}
        <Field label="Display width">
          <PercentPicker
            value={widthPercent}
            presets={WIDTH_PRESETS}
            suffix="%"
            onChange={setWidthPercent}
          />
        </Field>
        {target.kind === 'image' && target.pairWithNext && (
          <button
            type="button"
            onClick={target.pairWithNext}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:border-pink-400 hover:text-pink-700 dark:border-slate-700 dark:text-slate-200"
          >
            Place side by side with next image
          </button>
        )}
        <Field label="Border rounding">
          <PercentPicker
            value={borderRadiusPercent}
            presets={RADIUS_PRESETS}
            suffix="%"
            onChange={setBorderRadiusPercent}
          />
        </Field>
      </div>
    </aside>
  );
}

function readTargetAttrs(target: ImageInspectorTarget) {
  const attrs = target.attrs;
  return {
    alt: String(attrs.alt ?? ''),
    caption: String(attrs.caption ?? ''),
    widthPercent: Math.min(100, Math.max(30, Number(attrs.widthPercent ?? 100))),
    borderRadiusPercent: Math.min(50, Math.max(0, Number(attrs.borderRadiusPercent ?? 0))),
  };
}

function applyTargetPatch(target: ImageInspectorTarget, patch: Record<string, unknown>) {
  target.updateAttributes(patch);
}

function PercentPicker({
  value,
  presets,
  suffix,
  onChange,
}: {
  value: number;
  presets: readonly number[];
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          className={`rounded-md border px-2 py-1 text-xs font-medium ${
            value === preset
              ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
              : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
          }`}
        >
          {preset}
          {suffix}
        </button>
      ))}
    </div>
  );
}
