import { useCallback, useRef, type KeyboardEvent } from 'react';
import { Icon, TextInput } from '../../ui';

type ColumnKind = 'pro' | 'con';

function columnMeta(kind: ColumnKind) {
  return kind === 'pro'
    ? { label: 'Pros', icon: 'add' as const, sign: '+', addLabel: 'Add pro', emptyHint: 'Add strengths users will notice.' }
    : { label: 'Cons', icon: 'remove' as const, sign: '−', addLabel: 'Add con', emptyHint: 'Add limitations worth knowing.' };
}

function ProsConsColumn({
  kind,
  items,
  disabled,
  onChange,
}: {
  kind: ColumnKind;
  items: string[];
  disabled?: boolean;
  onChange: (items: string[]) => void;
}) {
  const meta = columnMeta(kind);
  const dragIndex = useRef<number | null>(null);

  const update = useCallback(
    (index: number, text: string) => {
      const next = [...items];
      next[index] = text;
      onChange(next);
    },
    [items, onChange],
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= items.length || from === to) return;
      const next = [...items];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      onChange(next);
    },
    [items, onChange],
  );

  const remove = useCallback(
    (index: number) => onChange(items.filter((_, i) => i !== index)),
    [items, onChange],
  );

  function onDragStart(index: number) {
    dragIndex.current = index;
  }

  function onDrop(index: number) {
    if (dragIndex.current == null) return;
    move(dragIndex.current, index);
    dragIndex.current = null;
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault();
      move(index, index - 1);
    }
    if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault();
      move(index, index + 1);
    }
  }

  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{meta.label}</h3>
      {items.length === 0 && (
        <p className="mb-2 text-xs text-slate-400">{meta.emptyHint}</p>
      )}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-1 py-1.5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
          >
            <button
              type="button"
              draggable={!disabled}
              disabled={disabled}
              aria-label={`Reorder ${meta.label.toLowerCase()} item ${i + 1}`}
              onDragStart={() => onDragStart(i)}
              className="mt-1.5 shrink-0 cursor-grab rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing disabled:opacity-30 dark:hover:bg-slate-800"
            >
              <Icon name="drag_indicator" className="!text-[18px]" />
            </button>
            <span
              className={`mt-1.5 shrink-0 text-sm font-semibold tabular-nums ${
                kind === 'pro' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}
              aria-hidden
            >
              {meta.sign}
            </span>
            <TextInput
              value={item}
              disabled={disabled}
              placeholder={`${meta.label.slice(0, -1)} ${i + 1}`}
              aria-label={`${meta.label.slice(0, -1)} ${i + 1}`}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="min-w-0 flex-1"
            />
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                aria-label={`Move ${meta.label.toLowerCase()} item ${i + 1} up`}
                disabled={disabled || i === 0}
                onClick={() => move(i, i - 1)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                <Icon name="arrow_upward" className="!text-[15px]" />
              </button>
              <button
                type="button"
                aria-label={`Move ${meta.label.toLowerCase()} item ${i + 1} down`}
                disabled={disabled || i === items.length - 1}
                onClick={() => move(i, i + 1)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                <Icon name="arrow_downward" className="!text-[15px]" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${meta.label.toLowerCase()} item ${i + 1}`}
                disabled={disabled}
                onClick={() => remove(i)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
              >
                <Icon name="close" className="!text-[15px]" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...items, ''])}
        className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500 hover:border-pink-400 hover:text-pink-600 dark:border-slate-600"
      >
        <Icon name={meta.icon} className="!text-[14px]" /> {meta.addLabel}
      </button>
    </div>
  );
}

export function CategoryProsConsEditor({
  pros,
  cons,
  disabled,
  onProsChange,
  onConsChange,
  renderProsAssist,
  renderConsAssist,
}: {
  pros: string[];
  cons: string[];
  disabled?: boolean;
  onProsChange: (items: string[]) => void;
  onConsChange: (items: string[]) => void;
  renderProsAssist?: () => React.ReactNode;
  renderConsAssist?: () => React.ReactNode;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <ProsConsColumn kind="pro" items={pros} disabled={disabled} onChange={onProsChange} />
        {renderProsAssist?.()}
      </div>
      <div>
        <ProsConsColumn kind="con" items={cons} disabled={disabled} onChange={onConsChange} />
        {renderConsAssist?.()}
      </div>
    </div>
  );
}
