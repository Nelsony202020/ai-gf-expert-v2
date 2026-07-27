import type { ReactNode } from 'react';

export function SectionHeading({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-700 dark:bg-pink-950 dark:text-pink-300">
        {num}
      </span>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
  );
}

export function ProductFormSection({
  num,
  title,
  children,
  divider = false,
  actions,
}: {
  num: number;
  title: string;
  children: ReactNode;
  divider?: boolean;
  /** Right-aligned controls in the section heading row. */
  actions?: ReactNode;
}) {
  return (
    <section className={divider ? 'border-t border-slate-100 pt-6 dark:border-slate-800' : ''}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SectionHeading num={num} title={title} />
        {actions}
      </div>
      {children}
    </section>
  );
}
