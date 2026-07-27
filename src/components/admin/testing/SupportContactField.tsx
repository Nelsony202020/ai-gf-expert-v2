// Customer support: availability gate + optional channel links (editorial).

import { Field, TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';

export type SupportChannels = {
  email: string;
  contactPage: string;
  discord: string;
  reddit: string;
  telegram: string;
};

const LINK_INPUT_CLASS =
  'font-mono text-[13px] leading-normal selection:bg-pink-200 dark:selection:bg-pink-900/50';

const SUPPORT_FIELDS: {
  key: keyof SupportChannels;
  label: string;
  placeholder: string;
  inputMode?: 'email' | 'url' | 'text';
  type?: 'email' | 'text';
}[] = [
  {
    key: 'email',
    label: 'Support email',
    placeholder: 'support@example.com',
    type: 'email',
    inputMode: 'email',
  },
  {
    key: 'contactPage',
    label: 'Help / contact page',
    placeholder: 'https://example.com/help',
    inputMode: 'url',
  },
  {
    key: 'discord',
    label: 'Discord',
    placeholder: 'https://discord.gg/…',
    inputMode: 'url',
  },
  {
    key: 'reddit',
    label: 'Reddit',
    placeholder: 'https://reddit.com/r/…',
    inputMode: 'url',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    placeholder: 'https://t.me/…',
    inputMode: 'url',
  },
];

export function parseSupportContactDraft(
  availRaw: RawValue | undefined,
  channelsRaw: RawValue | undefined,
): { hasSupport: 'yes' | 'no' | ''; channels: SupportChannels } {
  let hasSupport: 'yes' | 'no' | '' = '';
  if (availRaw && 'status' in availRaw) {
    if (availRaw.status === 'yes') hasSupport = 'yes';
    if (availRaw.status === 'no') hasSupport = 'no';
  }
  const structured =
    channelsRaw && 'structured' in channelsRaw
      ? (channelsRaw.structured as Record<string, unknown>)
      : undefined;
  return {
    hasSupport,
    channels: {
      email: typeof structured?.email === 'string' ? structured.email : '',
      contactPage: typeof structured?.contactPage === 'string' ? structured.contactPage : '',
      discord: typeof structured?.discord === 'string' ? structured.discord : '',
      reddit: typeof structured?.reddit === 'string' ? structured.reddit : '',
      telegram: typeof structured?.telegram === 'string' ? structured.telegram : '',
    },
  };
}

export function supportAvailableToRaw(hasSupport: 'yes' | 'no' | ''): RawValue | undefined {
  if (hasSupport === 'yes') return { status: 'yes' };
  if (hasSupport === 'no') return { status: 'no' };
  return undefined;
}

export function supportChannelsToRaw(channels: SupportChannels): RawValue | undefined {
  const trimmed = {
    email: channels.email.trim(),
    contactPage: channels.contactPage.trim(),
    discord: channels.discord.trim(),
    reddit: channels.reddit.trim(),
    telegram: channels.telegram.trim(),
  };
  const any = Object.values(trimmed).some(Boolean);
  if (!any) return undefined;
  return { structured: trimmed };
}

export function hasCustomerSupport(availRaw: RawValue | undefined): boolean {
  return Boolean(availRaw && 'status' in availRaw && availRaw.status === 'yes');
}

export function SupportContactField({
  disabled,
  availRaw,
  channelsRaw,
  onAvailChange,
  onChannelsChange,
}: {
  disabled?: boolean;
  availRaw: RawValue | undefined;
  channelsRaw: RawValue | undefined;
  onAvailChange: (v: RawValue | undefined) => void;
  onChannelsChange: (v: RawValue | undefined) => void;
}) {
  const parsed = parseSupportContactDraft(availRaw, channelsRaw);

  function sync(hasSupport: 'yes' | 'no' | '', channels: SupportChannels) {
    onAvailChange(supportAvailableToRaw(hasSupport));
    if (hasSupport === 'yes') {
      onChannelsChange(supportChannelsToRaw(channels));
    } else {
      onChannelsChange(undefined);
    }
  }

  function patchChannel(key: keyof SupportChannels, value: string) {
    sync('yes', { ...parsed.channels, [key]: value });
  }

  return (
    <div className="space-y-4 testing-input-wide w-full min-w-0 max-w-xl">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Does the app offer customer support?
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
                parsed.hasSupport === v
                  ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <input
                type="radio"
                name="support-available"
                className="sr-only"
                disabled={disabled}
                checked={parsed.hasSupport === v}
                onChange={() => sync(v, parsed.channels)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {parsed.hasSupport === 'yes' && (
        <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste whatever you find — all optional. Leave blank if the app does not have that channel.
          </p>

          <div className="space-y-3">
            {SUPPORT_FIELDS.map(({ key, label, placeholder, inputMode, type }) => (
              <Field key={key} label={label}>
                <TextInput
                  disabled={disabled}
                  type={type ?? 'text'}
                  inputMode={inputMode}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder={placeholder}
                  value={parsed.channels[key]}
                  className={key === 'email' ? 'text-[13px]' : LINK_INPUT_CLASS}
                  onChange={(e) => patchChannel(key, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </Field>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
