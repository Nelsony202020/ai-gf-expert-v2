import { useEffect, useState } from 'react';
import { dataApi } from '../api';
import { Field, Icon, TextInput } from '../ui';
import type { ImageInspectorTarget } from './reviewEditorContext';

const WIDTH_PRESETS = [30, 40, 50, 60, 70, 80, 90, 100] as const;
const RADIUS_PRESETS = [0, 4, 8, 12, 16, 24, 50, 100] as const;

export function ImageInspectorPanel({
  target,
  onClose,
  openImagePicker,
}: {
  target: ImageInspectorTarget;
  onClose: () => void;
  openImagePicker: (onPick: (media: { url: string; altText?: string; id: string; caption?: string }) => void) => void;
}) {
  const initial = readTargetAttrs(target);
  const [alt, setAlt] = useState(initial.alt);
  const [caption, setCaption] = useState(initial.caption);
  const [widthPercent, setWidthPercent] = useState(initial.widthPercent);
  const [borderRadiusPercent, setBorderRadiusPercent] = useState(initial.borderRadiusPercent);
  const [nsfw, setNsfw] = useState(initial.nsfw);

  // Re-sync local fields when a different image is selected.
  useEffect(() => {
    const next = readTargetAttrs(target);
    setAlt(next.alt);
    setCaption(next.caption);
    setWidthPercent(next.widthPercent);
    setBorderRadiusPercent(next.borderRadiusPercent);
    setNsfw(next.nsfw);
  }, [target]);

  useEffect(() => {
    applyTargetPatch(target, { alt, caption, widthPercent, borderRadiusPercent, nsfw });
  }, [target, alt, caption, widthPercent, borderRadiusPercent, nsfw]);

  async function onNsfwChange(checked: boolean) {
    setNsfw(checked);
    const mediaId = target.attrs.mediaId ? String(target.attrs.mediaId) : '';
    if (!mediaId) return;
    try {
      await dataApi.update('media', mediaId, { adult: checked, ageGated: checked });
    } catch {
      /* block attr still updates; media sync is best-effort */
    }
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between gap-1">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Image settings</p>
        <div className="flex items-center gap-0.5">
          {target.kind === 'image' && target.pairWithNext && (
            <button
              type="button"
              title="Place side by side with next image"
              aria-label="Place side by side with next image"
              onClick={target.pairWithNext}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-pink-600 dark:hover:bg-slate-800 dark:hover:text-pink-400"
            >
              <Icon name="view_column" className="!text-[16px]" />
            </button>
          )}
          {target.kind === 'imageRow' && target.splitRow && (
            <button
              type="button"
              title="Stack images vertically"
              aria-label="Stack images vertically"
              onClick={target.splitRow}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-pink-600 dark:hover:bg-slate-800 dark:hover:text-pink-400"
            >
              <Icon name="view_agenda" className="!text-[16px]" />
            </button>
          )}
          <button
            type="button"
            title="Replace image"
            aria-label="Replace image"
            onClick={() => {
              openImagePicker((m) => {
                applyTargetPatch(target, { src: m.url, mediaId: m.id });
              });
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon name="image" className="!text-[16px]" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image settings"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon name="close" className="!text-[16px]" />
          </button>
        </div>
      </div>
      <div className="space-y-2.5 [&_label]:text-[11px] [&_label]:font-medium">
        <Field label="Alt text">
          <TextInput
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image"
            className="!py-1.5 text-xs"
          />
        </Field>
        <Field label="Caption">
          <TextInput
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="!py-1.5 text-xs"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={nsfw}
            onChange={(e) => void onNsfwChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-pink-600 focus:ring-pink-500 dark:border-slate-600"
          />
          <span className="font-medium">NSFW</span>
        </label>
        <Field label="Width">
          <PercentPicker value={widthPercent} presets={WIDTH_PRESETS} suffix="%" onChange={setWidthPercent} />
        </Field>
        <Field label="Rounding">
          <PercentPicker
            value={borderRadiusPercent}
            presets={RADIUS_PRESETS}
            suffix="px"
            onChange={setBorderRadiusPercent}
          />
          {borderRadiusPercent >= 100 && (
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              Circle crop — double-click the image in the editor, then drag to move the focal point.
              (100 = full circle; lower values are pixel corner radius.)
            </p>
          )}
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
    borderRadiusPercent: Math.min(100, Math.max(0, Number(attrs.borderRadiusPercent ?? 0))),
    nsfw: Boolean(attrs.nsfw),
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
    <div className="flex flex-wrap gap-1">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
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
