/** Split trailing unit suffixes like "/day" or " / min" for muted styling. */
export function splitUnitSuffix(value: string): { main: string; unit: string | null } {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return { main: trimmed, unit: null };

  const match = trimmed.match(
    /^(.*?)(\s*\/\s*(?:day|mo|min|sec|secs?|hr|hrs|ea|msg|msgs?|message|messages?|character)s?\b.*)$/i,
  );
  if (match && match[1].trim().length > 0) {
    return {
      main: match[1].trimEnd(),
      unit: match[2].replace(/^\s+/, ''),
    };
  }

  return { main: trimmed, unit: null };
}
