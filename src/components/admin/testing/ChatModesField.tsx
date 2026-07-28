// Combined chat-modes + mode-types tester flow:
// Yes/No → count → name & rate two modes (3-level rubric).

import { TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';

export type ModeRating = 'good' | 'partial' | 'poor';

const RATING_OPTS: { value: ModeRating; label: string; hint: string }[] = [
  { value: 'good', label: 'Works well', hint: 'Mode behaves as expected' },
  { value: 'partial', label: 'Partially works', hint: 'Some issues or limited effect' },
  { value: 'poor', label: "Doesn't work", hint: 'Broken or no real difference' },
];

export function parseChatModesDraft(
  chatRaw: RawValue | undefined,
  modeRaw: RawValue | undefined,
): {
  hasModes: 'yes' | 'no' | '';
  count: string;
  modes: [{ name: string; rating: ModeRating | '' }, { name: string; rating: ModeRating | '' }];
} {
  let hasModes: 'yes' | 'no' | '' = '';
  if (chatRaw && 'status' in chatRaw) {
    if (chatRaw.status === 'yes') hasModes = 'yes';
    if (chatRaw.status === 'no') hasModes = 'no';
  }
  const detail =
    chatRaw && 'detail' in chatRaw ? (chatRaw.detail as Record<string, unknown> | undefined) : undefined;
  const count =
    typeof detail?.count === 'number'
      ? String(detail.count)
      : chatRaw && 'value' in chatRaw
        ? String(chatRaw.value)
        : '';

  const structured =
    modeRaw && 'structured' in modeRaw ? (modeRaw.structured as Record<string, unknown>) : undefined;
  const saved = Array.isArray(structured?.modes)
    ? (structured.modes as Array<{ name?: string; rating?: string }>)
    : [];
  return {
    hasModes,
    count,
    modes: [
      { name: saved[0]?.name ?? '', rating: (saved[0]?.rating as ModeRating) ?? '' },
      { name: saved[1]?.name ?? '', rating: (saved[1]?.rating as ModeRating) ?? '' },
    ],
  };
}

export function chatModesToRaw(
  hasModes: 'yes' | 'no' | '',
  count: string,
): RawValue | undefined {
  if (hasModes === 'no') return { status: 'no' };
  if (hasModes !== 'yes') return undefined;
  const n = count.trim() === '' ? undefined : Math.max(0, Number(count));
  if (n === undefined || Number.isNaN(n)) return undefined;
  return { status: 'yes', detail: { count: n } };
}

export function modeTypesToRaw(
  hasModes: 'yes' | 'no' | '',
  modes: [{ name: string; rating: ModeRating | '' }, { name: string; rating: ModeRating | '' }],
): RawValue | undefined {
  if (hasModes === 'no') return { structured: { modes: [] } };
  if (hasModes !== 'yes') return undefined;
  const filled = modes
    .map((m) => ({
      name: m.name.trim(),
      rating: m.rating,
    }))
    .filter((m) => m.name || m.rating);
  if (filled.length === 0) return undefined;
  return {
    structured: {
      modes: filled.map((m) => ({ name: m.name, rating: m.rating || 'partial' })),
    },
  };
}

export function ChatModesField({
  disabled,
  chatRaw,
  modeRaw,
  onChatChange,
  onModeChange,
}: {
  disabled?: boolean;
  chatRaw: RawValue | undefined;
  modeRaw: RawValue | undefined;
  onChatChange: (v: RawValue | undefined) => void;
  onModeChange: (v: RawValue | undefined) => void;
}) {
  const parsed = parseChatModesDraft(chatRaw, modeRaw);

  function sync(
    hasModes: 'yes' | 'no' | '',
    count: string,
    modes: typeof parsed.modes,
  ) {
    onChatChange(chatModesToRaw(hasModes, count));
    onModeChange(modeTypesToRaw(hasModes, modes));
  }

  return (
    <div className="space-y-4 testing-input-wide w-full min-w-[14rem]">
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Does the app offer different chat modes?
        </legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: 'yes' as const, label: 'Yes' },
              { v: 'no' as const, label: 'No' },
            ] as const
          ).map(({ v, label }) => (
            <label
              key={v}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                parsed.hasModes === v
                  ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <input
                type="radio"
                name="chat-modes-has"
                className="sr-only"
                disabled={disabled}
                checked={parsed.hasModes === v}
                onChange={() => sync(v, parsed.count, parsed.modes)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {parsed.hasModes === 'yes' && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              How many chat modes are available?
            </label>
            <TextInput
              type="number"
              min={0}
              disabled={disabled}
              className="!w-28"
              value={parsed.count}
              onChange={(e) => sync('yes', e.target.value, parsed.modes)}
            />
          </div>

          {Number(parsed.count) > 1 && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/30">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Test two modes — rate how well each one works
            </p>
            {parsed.modes.map((mode, idx) => (
              <div key={idx} className="space-y-2 border-t border-slate-200 pt-3 first:border-0 first:pt-0 dark:border-slate-700">
                <TextInput
                  disabled={disabled}
                  placeholder={`Mode ${idx + 1} name (e.g. Romantic, Roleplay)`}
                  value={mode.name}
                  onChange={(e) => {
                    const next = [...parsed.modes] as typeof parsed.modes;
                    next[idx] = { ...next[idx], name: e.target.value };
                    sync('yes', parsed.count, next);
                  }}
                />
                <div className="flex flex-col gap-1.5">
                  {RATING_OPTS.map(({ value, label, hint }) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors ${
                        mode.rating === value
                          ? 'border-pink-400 bg-pink-50 dark:border-pink-600 dark:bg-pink-950/30'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`mode-rating-${idx}`}
                        className="mt-0.5"
                        disabled={disabled}
                        checked={mode.rating === value}
                        onChange={() => {
                          const next = [...parsed.modes] as typeof parsed.modes;
                          next[idx] = { ...next[idx], rating: value };
                          sync('yes', parsed.count, next);
                        }}
                      />
                      <span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
                        <span className="mt-0.5 block text-slate-500">{hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </>
      )}
    </div>
  );
}
