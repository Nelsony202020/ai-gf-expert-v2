import { isLocalUrl } from '../../siteOrigin';
import type { JsonLdNode } from './omitEmpty';
import { omitEmpty } from './omitEmpty';

function collectStrings(value: unknown, acc: string[]): void {
  if (typeof value === 'string') {
    acc.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value as JsonLdNode)) collectStrings(v, acc);
  }
}

/** Fail closed: never emit a graph that contains localhost / loopback URLs. */
export function assertNoLocalhostInGraph(graph: JsonLdNode[]): void {
  const strings: string[] = [];
  for (const node of graph) collectStrings(node, strings);
  for (const s of strings) {
    if (isLocalUrl(s) || /localhost|127\.0\.0\.1/i.test(s)) {
      throw new Error(`[jsonld] Refusing to emit localhost URL in structured data: ${s}`);
    }
  }
}

export function buildJsonLdDocument(graph: JsonLdNode[]): JsonLdNode {
  const cleaned = graph.map((n) => omitEmpty(n)).filter((n) => Object.keys(n).length > 0);
  assertNoLocalhostInGraph(cleaned);
  return {
    '@context': 'https://schema.org',
    '@graph': cleaned,
  };
}

export function serializeJsonLd(graph: JsonLdNode[]): string {
  return JSON.stringify(buildJsonLdDocument(graph));
}
