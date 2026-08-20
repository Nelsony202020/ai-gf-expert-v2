import type { ReactNode } from 'react';
import { Badge } from '../../../ui';

export type PricingSourceBadge =
  | 'MANUAL'
  | 'CALCULATED'
  | 'FROM TESTING'
  | 'FROM PRICING DATA'
  | 'GLOBAL COPY';

const BADGE_TONE: Record<PricingSourceBadge, 'gray' | 'green' | 'amber' | 'blue' | 'pink'> = {
  MANUAL: 'pink',
  CALCULATED: 'blue',
  'FROM TESTING': 'amber',
  'FROM PRICING DATA': 'green',
  'GLOBAL COPY': 'gray',
};

export function PricingSection({
  title,
  badge,
  description,
  children,
  actions,
}: {
  title: string;
  badge: PricingSourceBadge;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <Badge tone={BADGE_TONE[badge]}>
              <span className="text-[10px] font-semibold tracking-wide">{badge}</span>
            </Badge>
          </div>
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
