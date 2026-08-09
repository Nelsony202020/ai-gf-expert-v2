export type JsonLdNode = Record<string, unknown>;

/** Drop null/undefined/empty string/empty arrays; recurse into plain objects. */
export function omitEmpty<T extends JsonLdNode>(node: T): T {
  const out: JsonLdNode = {};
  for (const [key, value] of Object.entries(node)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      out[key] = value.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? omitEmpty(item as JsonLdNode)
          : item,
      );
      continue;
    }
    if (typeof value === 'object') {
      out[key] = omitEmpty(value as JsonLdNode);
      continue;
    }
    out[key] = value;
  }
  return out as T;
}
