// Past security incidents — Yes/No gate, then optional incident links.

import type { RawValue } from '../scoring/engine';

export type SecurityIncidentEntry = { url: string; note: string };

export function emptySecurityIncident(): SecurityIncidentEntry {
  return { url: '', note: '' };
}

export function parseSecurityIncidents(raw: RawValue | undefined): {
  foundIncidents: 'yes' | 'no' | '';
  incidents: SecurityIncidentEntry[];
} {
  if (!raw || typeof raw !== 'object') {
    return { foundIncidents: '', incidents: [emptySecurityIncident()] };
  }

  if ('value' in raw && typeof raw.value === 'number') {
    const detail =
      'detail' in raw && raw.detail && typeof raw.detail === 'object'
        ? (raw.detail as Record<string, unknown>)
        : undefined;
    if (raw.value === 0 && detail?.foundIncidents === false) {
      return { foundIncidents: 'no', incidents: [emptySecurityIncident()] };
    }
    if (raw.value >= 0 && detail?.foundIncidents === true) {
      return {
        foundIncidents: 'yes',
        incidents: parseIncidentEntries(detail.incidents),
      };
    }
    if (raw.value > 0) {
      return {
        foundIncidents: 'yes',
        incidents: parseIncidentEntries(detail?.incidents),
      };
    }
  }

  // Legacy single link + note saves.
  const detail =
    'detail' in raw && raw.detail && typeof raw.detail === 'object'
      ? (raw.detail as Record<string, unknown>)
      : undefined;
  const legacyUrl =
    typeof detail?.url === 'string'
      ? detail.url
      : 'text' in raw && typeof raw.text === 'string'
        ? raw.text
        : '';
  const legacyNote = typeof detail?.note === 'string' ? detail.note : '';
  if (legacyUrl.trim()) {
    return {
      foundIncidents: 'yes',
      incidents: [{ url: legacyUrl.trim(), note: legacyNote.trim() }],
    };
  }

  return { foundIncidents: '', incidents: [emptySecurityIncident()] };
}

function parseIncidentEntries(value: unknown): SecurityIncidentEntry[] {
  if (!Array.isArray(value) || value.length === 0) return [emptySecurityIncident()];
  const entries = value
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const url = typeof (row as { url?: unknown }).url === 'string' ? (row as { url: string }).url : '';
      const note = typeof (row as { note?: unknown }).note === 'string' ? (row as { note: string }).note : '';
      if (!url.trim() && !note.trim()) return null;
      return { url, note };
    })
    .filter((row): row is SecurityIncidentEntry => row !== null);
  return entries.length > 0 ? entries : [emptySecurityIncident()];
}

export function securityIncidentsToRaw(parsed: {
  foundIncidents: 'yes' | 'no' | '';
  incidents: SecurityIncidentEntry[];
}): RawValue | undefined {
  if (parsed.foundIncidents === 'no') {
    return { value: 0, detail: { foundIncidents: false } };
  }
  if (parsed.foundIncidents === 'yes') {
    const filled = parsed.incidents
      .map((row) => ({ url: row.url.trim(), note: row.note.trim() }))
      .filter((row) => row.url);
    if (filled.length === 0) return undefined;
    return {
      value: filled.length,
      detail: { foundIncidents: true, incidents: filled },
    };
  }
  return undefined;
}

export function isSecurityIncidentsComplete(raw: RawValue | undefined): boolean {
  const parsed = parseSecurityIncidents(raw);
  if (parsed.foundIncidents === 'no') return true;
  if (parsed.foundIncidents === 'yes') {
    return parsed.incidents.some((row) => row.url.trim());
  }
  return false;
}

export function formatSecurityIncidentsSummary(raw: RawValue | undefined): string {
  const parsed = parseSecurityIncidents(raw);
  if (parsed.foundIncidents === 'no') return 'None found';
  if (parsed.foundIncidents === 'yes') {
    const n = parsed.incidents.filter((row) => row.url.trim()).length;
    return n > 0 ? `${n} incident${n === 1 ? '' : 's'}` : 'Yes';
  }
  return '—';
}
