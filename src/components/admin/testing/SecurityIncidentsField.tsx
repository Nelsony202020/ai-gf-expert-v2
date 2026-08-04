// Past security incidents — Yes/No first, then link fields when Yes.

import { Button, Field, Icon, Select, TextArea, TextInput } from '../ui';
import type { RawValue } from './EvidenceInput';
import { TestingHint } from './TestingHint';
import {
  emptySecurityIncident,
  formatSecurityIncidentsSummary,
  parseSecurityIncidents,
  securityIncidentsToRaw,
  type SecurityIncidentEntry,
} from '../../../lib/testing/securityIncidents';

const LINK_CLASS =
  'font-mono text-[13px] leading-normal selection:bg-pink-200 dark:selection:bg-pink-900/50';

export function SecurityIncidentsField({
  disabled,
  raw,
  onChange,
}: {
  disabled?: boolean;
  raw: RawValue | undefined;
  onChange: (v: RawValue | undefined) => void;
}) {
  const parsed = parseSecurityIncidents(raw);

  function sync(foundIncidents: 'yes' | 'no' | '', incidents: SecurityIncidentEntry[]) {
    onChange(securityIncidentsToRaw({ foundIncidents, incidents }));
  }

  function setFoundIncidents(foundIncidents: 'yes' | 'no' | '') {
    if (foundIncidents === 'no') {
      onChange(securityIncidentsToRaw({ foundIncidents: 'no', incidents: [emptySecurityIncident()] }));
      return;
    }
    if (foundIncidents === 'yes') {
      sync('yes', parsed.incidents.length > 0 ? parsed.incidents : [emptySecurityIncident()]);
      return;
    }
    onChange(undefined);
  }

  function patchIncident(index: number, patch: Partial<SecurityIncidentEntry>) {
    const next = parsed.incidents.map((row, i) => (i === index ? { ...row, ...patch } : row));
    sync('yes', next);
  }

  function addIncident() {
    sync('yes', [...parsed.incidents, emptySecurityIncident()]);
  }

  function removeIncident(index: number) {
    const next = parsed.incidents.filter((_, i) => i !== index);
    sync('yes', next.length > 0 ? next : [emptySecurityIncident()]);
  }

  return (
    <div className="testing-input-wide w-full min-w-0 max-w-xl space-y-4">
      <Field
        label={
          <span className="inline-flex items-center gap-1">
            Any confirmed security incidents in the past 5 years?
            <TestingHint text="Search news, company statements, regulator filings, or reliable security reports. Choose No if you found none." />
          </span>
        }
      >
        <Select
          value={parsed.foundIncidents}
          disabled={disabled}
          className="!py-2 text-sm"
          onChange={(e) => setFoundIncidents(e.target.value as 'yes' | 'no' | '')}
        >
          <option value="">Choose…</option>
          <option value="no">No — none found</option>
          <option value="yes">Yes — incidents found</option>
        </Select>
      </Field>

      {parsed.foundIncidents === 'no' && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Scored as 0 confirmed incidents — full points for this test.
        </p>
      )}

      {parsed.foundIncidents === 'yes' && (
        <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add a link for each confirmed incident — news article, official statement, or court/regulator
            filing.
          </p>

          {parsed.incidents.map((row, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Incident {index + 1}
                </p>
                {parsed.incidents.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-pink-500"
                    disabled={disabled}
                    onClick={() => removeIncident(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <TextInput
                type="url"
                value={row.url}
                disabled={disabled}
                placeholder="https://…"
                className={LINK_CLASS}
                onChange={(e) => patchIncident(index, { url: e.target.value })}
              />
              <TextArea
                rows={2}
                value={row.note}
                disabled={disabled}
                placeholder="Optional note — what happened, when, what data was affected"
                onChange={(e) => patchIncident(index, { note: e.target.value })}
              />
            </div>
          ))}

          <Button type="button" variant="secondary" disabled={disabled} onClick={addIncident}>
            <Icon name="add" className="!text-[16px]" />
            Add another incident
          </Button>
        </div>
      )}
    </div>
  );
}

export { formatSecurityIncidentsSummary, parseSecurityIncidents };
