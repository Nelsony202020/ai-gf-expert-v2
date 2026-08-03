// Lists required answers still blocking publish — each row jumps to the field.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui';

export interface MissingRequiredRow {
  defId?: string;
  label: string;
  sessionIndex?: number;
  sessionTitle?: string;
  categoryName?: string;
  source: 'session' | 'pricing';
}

export function TestingMissingRequiredPanel({
  items,
  onJumpToSession,
  pricingTabHref,
}: {
  items: MissingRequiredRow[];
  onJumpToSession: (sessionIndex: number, defId: string) => void;
  pricingTabHref?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/25">
      <button
        type="button"
        className="flex w-full items-center gap-1.5 text-left text-xs font-semibold text-amber-900 dark:text-amber-200"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <Icon name="error_outline" className="!text-[16px] shrink-0" />
        <span className="flex-1">
          {items.length} required answer{items.length === 1 ? '' : 's'} still needed
        </span>
        <Icon
          name={expanded ? 'expand_less' : 'expand_more'}
          className="!text-[18px] shrink-0 text-amber-700 dark:text-amber-300"
        />
      </button>
      {expanded && (
        <ul className="mt-2 space-y-1">
        {items.map((item) => {
          const key = item.defId ?? item.label;
          if (item.source === 'pricing' && pricingTabHref) {
            return (
              <li key={key}>
                <Link
                  to={pricingTabHref}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs text-amber-900 hover:bg-amber-100/80 dark:text-amber-100 dark:hover:bg-amber-950/50"
                >
                  <Icon name="payments" className="mt-0.5 !text-[14px] shrink-0" />
                  <span>
                    <span className="font-medium">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] text-amber-700 dark:text-amber-300">
                      Auto-filled from Pricing tab — open Pricing to add plan data
                    </span>
                  </span>
                </Link>
              </li>
            );
          }
          if (item.sessionIndex != null && item.defId) {
            return (
              <li key={key}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs text-amber-900 hover:bg-amber-100/80 dark:text-amber-100 dark:hover:bg-amber-950/50"
                  onClick={() => onJumpToSession(item.sessionIndex!, item.defId!)}
                >
                  <Icon name="arrow_forward" className="mt-0.5 !text-[14px] shrink-0" />
                  <span>
                    <span className="font-medium">{item.label}</span>
                    {item.sessionTitle && (
                      <span className="mt-0.5 block text-[10px] text-amber-700 dark:text-amber-300">
                        {item.categoryName ? `${item.categoryName} · ` : ''}
                        {item.sessionTitle}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          }
          return (
            <li key={key} className="px-2 py-1 text-xs text-amber-800 dark:text-amber-200">
              • {item.label}
            </li>
          );
        })}
        </ul>
      )}
    </div>
  );
}
