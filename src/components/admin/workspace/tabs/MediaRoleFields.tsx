import { Field, Toggle } from '../../ui';
import type { MediaRoleState } from '../../../../lib/media/catalog';

export function MediaRoleFields({
  value,
  onChange,
}: {
  value: MediaRoleState;
  onChange: (next: MediaRoleState) => void;
}) {
  function patch(partial: Partial<MediaRoleState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <Field label="Placement" help="Gallery appears in Photos & Videos. Proof appears in the proof filter.">
        <div className="flex flex-wrap gap-4">
          {(
            [
              { id: 'gallery', label: 'Gallery' },
              { id: 'proof', label: 'Proof' },
            ] as const
          ).map((opt) => (
            <label key={opt.id} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="radio"
                name="media-placement"
                checked={value.placement === opt.id}
                onChange={() => patch({ placement: opt.id })}
                className="h-4 w-4 border-slate-300 text-pink-600 focus:ring-pink-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          checked={value.character}
          onChange={(character) => patch({ character })}
          label="Character"
        />
        <Toggle checked={value.hero} onChange={(hero) => patch({ hero })} label="Hero" />
      </div>

      <Field label="Context (optional)" help="Pick one — tags the media for Chat or Image generator filters.">
        <div className="flex flex-wrap gap-4">
          {(
            [
              { id: '', label: 'None' },
              { id: 'chat', label: 'Chat' },
              { id: 'image_generator', label: 'Image generator' },
            ] as const
          ).map((opt) => (
            <label key={opt.id || 'none'} className="inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="media-context"
                checked={value.contextTag === opt.id}
                onChange={() => patch({ contextTag: opt.id })}
                className="h-4 w-4 border-slate-300 text-pink-600 focus:ring-pink-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}
