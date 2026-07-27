import { Icon } from '../../ui';
import type { VerdictStepId } from './types';

export function VerdictStepNav({
  steps,
  activeStep,
  onSelect,
}: {
  steps: { id: VerdictStepId; navLabel: string; complete: boolean }[];
  activeStep: VerdictStepId;
  onSelect: (id: VerdictStepId) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      role="tablist"
      aria-label="Verdict sections"
    >
      {steps.map((step) => {
        const active = step.id === activeStep;
        return (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(step.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {step.complete && (
              <Icon
                name="check_circle"
                className={`!text-[14px] ${active ? 'text-green-300 dark:text-green-700' : 'text-green-600 dark:text-green-400'}`}
              />
            )}
            {step.navLabel}
          </button>
        );
      })}
    </div>
  );
}
