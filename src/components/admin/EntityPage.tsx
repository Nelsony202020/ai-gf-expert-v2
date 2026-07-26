// Generic list + create/edit UI for a registered entity, driven by a
// ModuleConfig. Custom modules (products, test runs, roundups) build their
// own screens; everything else reuses this.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataApi, type EntityRow } from './api';
import { useCan } from './context';
import {
  Button,
  Badge,
  statusTone,
  Card,
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  Spinner,
  ErrorNote,
  EmptyState,
  Modal,
  useAsync,
  fmtDate,
  Icon,
} from './ui';

export interface FieldDef {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'select'
    | 'slug'
    | 'date'
    | 'tags'
    | 'json'
    | 'url';
  options?: { value: string | number; label: string }[];
  required?: boolean;
  help?: string;
  section?: string;
  placeholder?: string;
}

export interface LinkPicker {
  name: string; // link label in the registry
  label: string;
  entity: string; // entity to pick from
  labelKey: string; // row key used as display label
  required?: boolean;
}

export interface ModuleConfig {
  entity: string;
  title: string;
  description?: string;
  columns: { key: string; label: string; render?: (row: EntityRow) => ReactNode }[];
  fields: FieldDef[];
  linkPickers?: LinkPicker[];
  searchKeys?: string[];
  writePermission?: string; // defaults to content.edit
  readonly?: boolean;
}

function coerceForInput(value: unknown, def: FieldDef): string {
  if (value === undefined || value === null) return '';
  if (def.type === 'tags' && Array.isArray(value)) return value.join(', ');
  if (def.type === 'json') return JSON.stringify(value, null, 2);
  if (def.type === 'date' && typeof value === 'number') {
    return new Date(value).toISOString().slice(0, 10);
  }
  return String(value);
}

function coerceFromInput(raw: string | boolean, def: FieldDef): unknown {
  if (def.type === 'boolean') return Boolean(raw);
  const value = String(raw).trim();
  if (value === '') return undefined;
  switch (def.type) {
    case 'number':
      return Number(value);
    case 'tags':
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    case 'json':
      return JSON.parse(value);
    case 'date':
      return new Date(value).getTime();
    default:
      return value;
  }
}

export function EntityForm({
  config,
  initial,
  onSaved,
  onCancel,
}: {
  config: ModuleConfig;
  initial: EntityRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    for (const f of config.fields) v[f.name] = initial?.[f.name];
    return v;
  });
  const [links, setLinks] = useState<Record<string, string | null>>(() => {
    const l: Record<string, string | null> = {};
    for (const p of config.linkPickers ?? []) l[p.name] = initial?.[p.name]?.id ?? null;
    return l;
  });
  const [linkOptions, setLinkOptions] = useState<Record<string, EntityRow[]>>({});
  const { busy, error, setError, run } = useAsync();

  useEffect(() => {
    for (const picker of config.linkPickers ?? []) {
      dataApi
        .list(picker.entity)
        .then((r) => setLinkOptions((prev) => ({ ...prev, [picker.name]: r.rows })))
        .catch(() => {});
    }
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, FieldDef[]>();
    for (const f of config.fields) {
      const key = f.section ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return [...map.entries()];
  }, [config.fields]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fields: Record<string, unknown> = {};
    try {
      for (const def of config.fields) {
        const coerced =
          def.type === 'boolean'
            ? Boolean(values[def.name])
            : coerceFromInput(coerceForInput(values[def.name], def), def);
        if (coerced !== undefined) fields[def.name] = coerced;
      }
    } catch {
      setError('Invalid JSON in one of the fields');
      return;
    }
    const result = await run(async () => {
      if (initial) await dataApi.update(config.entity, initial.id, fields, links);
      else await dataApi.create(config.entity, fields, links);
      return true;
    });
    if (result) onSaved();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {error && <ErrorNote message={error} />}

      {(config.linkPickers ?? []).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {(config.linkPickers ?? []).map((picker) => (
            <Field key={picker.name} label={picker.label} required={picker.required}>
              <Select
                value={links[picker.name] ?? ''}
                onChange={(e) =>
                  setLinks((prev) => ({ ...prev, [picker.name]: e.target.value || null }))
                }
              >
                <option value="">— none —</option>
                {(linkOptions[picker.name] ?? []).map((row) => (
                  <option key={row.id} value={row.id}>
                    {row[picker.labelKey] ?? row.id}
                  </option>
                ))}
              </Select>
            </Field>
          ))}
        </div>
      )}

      {sections.map(([sectionName, fields]) => (
        <div key={sectionName}>
          {sectionName && (
            <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {sectionName}
            </h4>
          )}
          <div className="grid grid-cols-2 gap-3">
            {fields.map((def) => (
              <div key={def.name} className={def.type === 'textarea' || def.type === 'json' ? 'col-span-2' : ''}>
                {def.type === 'boolean' ? (
                  <Field label={def.label} help={def.help}>
                    <Toggle
                      checked={Boolean(values[def.name])}
                      onChange={(v) => setValues((prev) => ({ ...prev, [def.name]: v }))}
                    />
                  </Field>
                ) : def.type === 'select' ? (
                  <Field label={def.label} help={def.help} required={def.required}>
                    <Select
                      value={coerceForInput(values[def.name], def)}
                      onChange={(e) => setValues((prev) => ({ ...prev, [def.name]: e.target.value }))}
                    >
                      {!def.required && <option value="">—</option>}
                      {(def.options ?? []).map((o) => (
                        <option key={String(o.value)} value={String(o.value)}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : def.type === 'textarea' || def.type === 'json' ? (
                  <Field label={def.label} help={def.help} required={def.required}>
                    <TextArea
                      value={coerceForInput(values[def.name], def)}
                      placeholder={def.placeholder}
                      onChange={(e) => setValues((prev) => ({ ...prev, [def.name]: e.target.value }))}
                    />
                  </Field>
                ) : (
                  <Field label={def.label} help={def.help} required={def.required}>
                    <TextInput
                      type={def.type === 'number' ? 'number' : def.type === 'date' ? 'date' : 'text'}
                      step={def.type === 'number' ? 'any' : undefined}
                      required={def.required}
                      placeholder={def.placeholder}
                      value={coerceForInput(values[def.name], def)}
                      onChange={(e) => setValues((prev) => ({ ...prev, [def.name]: e.target.value }))}
                    />
                  </Field>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export function EntityPage({ config }: { config: ModuleConfig }) {
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EntityRow | null | 'new'>(null);
  const [error, setError] = useState<string | null>(null);
  const can = useCan();
  const canWrite = !config.readonly && can(config.writePermission ?? 'content.edit');

  function reload() {
    setError(null);
    dataApi
      .list(config.entity)
      .then((r) => setRows(r.rows))
      .catch((e) => setError(e.message));
  }
  useEffect(reload, [config.entity]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    if (!search) return rows;
    const q = search.toLowerCase();
    const keys = config.searchKeys ?? config.columns.map((c) => c.key);
    return rows.filter((row) =>
      keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
    );
  }, [rows, search, config]);

  async function remove(row: EntityRow) {
    if (!confirm(`Delete this ${config.entity} record?`)) return;
    try {
      await dataApi.remove(config.entity, row.id);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{config.title}</h2>
          {config.description && <p className="text-sm text-slate-500">{config.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <TextInput
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          {canWrite && (
            <Button onClick={() => setEditing('new')}>
              <Icon name="add" /> Add
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      <Card>
        {!filtered ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState message="No records yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  {config.columns.map((col) => (
                    <th key={col.key} className="px-2 py-2 font-medium">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    {config.columns.map((col) => (
                      <td key={col.key} className="px-2 py-2">
                        {col.render ? (
                          col.render(row)
                        ) : col.key === 'status' ? (
                          <Badge tone={statusTone(String(row.status))}>{String(row.status ?? '—')}</Badge>
                        ) : col.key.endsWith('At') || col.key.endsWith('Date') ? (
                          fmtDate(row[col.key])
                        ) : typeof row[col.key] === 'boolean' ? (
                          row[col.key] ? (
                            <Icon name="check" className="text-green-600" />
                          ) : (
                            <Icon name="close" className="text-slate-300" />
                          )
                        ) : (
                          String(row[col.key] ?? '—')
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      {canWrite && (
                        <>
                          <button
                            className="mr-2 text-slate-400 hover:text-pink-600"
                            onClick={() => setEditing(row)}
                            title="Edit"
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            className="text-slate-400 hover:text-red-600"
                            onClick={() => remove(row)}
                            title="Delete"
                          >
                            <Icon name="delete" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing !== null && (
        <Modal
          title={editing === 'new' ? `New ${config.title}` : `Edit ${config.title}`}
          onClose={() => setEditing(null)}
          wide
        >
          <EntityForm
            config={config}
            initial={editing === 'new' ? null : editing}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
