import type { ReactNode } from 'react';

export function ProductFormSection({
  num,
  title,
  children,
  divider = false,
}: {
  num: number;
  title: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <section className={divider ? 'border-t border-slate-100 pt-6 dark:border-slate-800' : ''}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-700 dark:bg-pink-950 dark:text-pink-300">
          {num}
        </span>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      {children}
    </section>
  );
}
