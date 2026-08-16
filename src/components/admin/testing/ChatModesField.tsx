// Combined chat-modes + mode-types tester flow:
// Yes/No dropdown → count → name & rate N modes (3-level rubric).

import { Select, TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';

export type ModeRating = 'good' | 'partial' | 'poor';

export type ModeDraft = { name: string; rating: ModeRating | '' };

const RATING_OPTS: { value: ModeRating; label: string; hint: string }[] = [
  { value: 'good', label: 'Works well', hint: 'Mode behaves as expected' },
  { value: 'partial', label: 'Partially works', hint: 'Some issues or limited effect' },
  { value: 'poor', label: "Doesn't work", hint: 'Broken or no real difference' },
];

function parseCount(chatRaw: RawValue | undefined): string {
  const detail =
    chatRaw && 'detail' in chatRaw ? (chatRaw.detail as Record<string, unknown> | undefined) : undefined;
  if (typeof detail?.count === 'number') return String(detail.count);
  if (chatRaw && 'value' in chatRaw) return String(chatRaw.value);
  return '';
}

function savedModes(modeRaw: RawValue | undefined): ModeDraft[] {
  const structured =
    modeRaw && 'structured' in modeRaw ? (modeRaw.structured as Record<string, unknown>) : undefined;
  const saved = Array.isArray(structured?.modes)
    ? (structured.modes as Array<{ name?: string; rating?: string }>)
    : [];
  return saved.map((m) => ({
    name: m.name ?? '',
    rating: (m.rating as ModeRating) ?? '',
  }));
}

/** Resize mode rows to match count — preserve existing entries where possible. */
export function resizeModes(
  modes: ModeDraft[],
  count: number,
): ModeDraft[] {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return [];
  const next: ModeDraft[] = [];
  for (let i = 0; i < n; i++) {
    next.push(modes[i] ?? { name: '', rating: '' });
  }
  return next;
}

export function parseChatModesDraft(
  chatRaw: RawValue | undefined,
  modeRaw: RawValue | undefined,
): {
  hasModes: 'yes' | 'no' | '';
  count: string;
  modes: ModeDraft[];
} {
  let hasModes: 'yes' | 'no' | '' = '';
  if (chatRaw && 'status' in chatRaw) {
    if (chatRaw.status === 'yes') hasModes = 'yes';
    if (chatRaw.status === 'no') hasModes = 'no';
  }
  const count = parseCount(chatRaw);
  const saved = savedModes(modeRaw);
  const countNum = Number(count);
  const targetLen =
    hasModes === 'yes' && count.trim() !== '' && !Number.isNaN(countNum) && countNum > 0
      ? countNum
      : saved.length;
  return {
    hasModes,
    count,
    modes: targetLen > 0 ? resizeModes(saved, targetLen) : saved,
  };
}

export function chatModesToRaw(
  hasModes: 'yes' | 'no' | '',
  count: string,
): RawValue | undefined {
  if (hasModes === 'no') return { status: 'no' };
  if (hasModes !== 'yes') return undefined;
  const trimmed = count.trim();
  if (trimmed === '') return { status: 'yes' };
  const n = Math.max(0, Number(trimmed));
  if (Number.isNaN(n)) return { status: 'yes' };
  return { status: 'yes', detail: { count: n } };
}

export function modeTypesToRaw(
  hasModes: 'yes' | 'no' | '',
  modes: ModeDraft[],
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
  const countNum = Number(parsed.count);
  const showModeFields =
    parsed.hasModes === 'yes' &&
    parsed.count.trim() !== '' &&
    !Number.isNaN(countNum) &&
    countNum > 0;

  function sync(
    hasModes: 'yes' | 'no' | '',
    count: string,
    modes: ModeDraft[],
  ) {
    const n = Number(count);
    const sized =
      hasModes === 'yes' && count.trim() !== '' && !Number.isNaN(n) && n > 0
        ? resizeModes(modes, n)
        : modes;
    onChatChange(chatModesToRaw(hasModes, count));
    onModeChange(modeTypesToRaw(hasModes, sized));
  }

  return (
    <div className="space-y-4 testing-input-wide w-full min-w-[14rem]">
      <div>
        <Select
          value={parsed.hasModes}
          disabled={disabled}
          className="!py-2 text-sm"
          onChange={(e) => {
            const v = e.target.value as 'yes' | 'no' | '';
            sync(v, v === 'yes' ? parsed.count : '', parsed.modes);
          }}
        >
          <option value="">Choose…</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </Select>
      </div>

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
              onChange={(e) => {
                const nextCount = e.target.value;
                const n = Number(nextCount);
                const nextModes =
                  nextCount.trim() !== '' && !Number.isNaN(n) && n > 0
                    ? resizeModes(parsed.modes, n)
                    : parsed.modes;
                sync('yes', nextCount, nextModes);
              }}
            />
          </div>

          {showModeFields && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/30">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Test {countNum} mode{countNum === 1 ? '' : 's'} — rate how well each one works
            </p>
            {parsed.modes.map((mode, idx) => (
              <div key={idx} className="space-y-2 border-t border-slate-200 pt-3 first:border-0 first:pt-0 dark:border-slate-700">
                <TextInput
                  disabled={disabled}
                  placeholder={`Mode ${idx + 1} name (e.g. Romantic, Roleplay)`}
                  value={mode.name}
                  onChange={(e) => {
                    const next = [...parsed.modes];
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
                          const next = [...parsed.modes];
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
