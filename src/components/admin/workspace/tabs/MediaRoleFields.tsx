import { Field, Toggle } from '../../ui';
import type { MediaRoleState } from '../../../../lib/media/catalog';

export function MediaRoleFields({
  value,
  onChange,
  showHero = true,
  radioName = 'media-context',
}: {
  value: MediaRoleState;
  onChange: (next: MediaRoleState) => void;
  /** Hide hero toggle on review/pricing upload forms. */
  showHero?: boolean;
  radioName?: string;
}) {
  function patch(partial: Partial<MediaRoleState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div className={`grid gap-3 ${showHero ? 'sm:grid-cols-2' : ''}`}>
        <Toggle
          checked={value.character}
          onChange={(character) => patch({ character })}
          label="Character"
        />
        {showHero && (
          <Toggle checked={value.hero} onChange={(hero) => patch({ hero })} label="Hero" />
        )}
      </div>

      <Field label="Context (optional)">
        <div className="flex flex-wrap gap-4">
          {(
            [
              { id: '', label: 'None' },
              { id: 'chat', label: 'Chat' },
            ] as const
          ).map((opt) => (
            <label key={opt.id || 'none'} className="inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name={radioName}
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
