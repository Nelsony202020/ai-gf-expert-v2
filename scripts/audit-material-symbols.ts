/**
 * Regenerates the icon-name list in src/lib/ui/materialSymbols.ts.
 *
 * Scans src/ for every Material Symbols name the public site can render — static
 * span bodies, literals inside dynamic span expressions (ternaries, ?? fallbacks),
 * `icon:`/`symbol:` data properties, `icon=` component props, and the values of any
 * icon-named lookup map — then rewrites the exported array.
 *
 * Run after adding or removing an icon:  npx tsx scripts/audit-material-symbols.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = `${ROOT}/src/lib/ui/materialSymbols.ts`;

// Admin ships its own unsubsetted font request, so its icons are out of scope.
const EXCLUDED = ['src/pages/admin/', 'src/components/admin/'];

const files = execSync(
  `find ${JSON.stringify(ROOT)}/src -type f \\( -name '*.astro' -o -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.json' \\)`,
  { encoding: 'utf8', maxBuffer: 1 << 28 }
)
  .trim()
  .split('\n')
  .filter(Boolean)
  .filter((f) => !EXCLUDED.some((p) => f.replace(`${ROOT}/`, '').startsWith(p)));

const SPAN = /<span\b([^>]*material-symbols-outlined[^>]*)>([\s\S]*?)<\/span>/g;
const PROP = /\b([A-Za-z_]*[Ii]cons?|symbol)\s*:\s*['"`]([a-z0-9_]+)['"`]/g;
const ATTR = /\b([A-Za-z_]*[Ii]cons?)\s*=\s*(?:['"]([a-z0-9_]+)['"]|\{\s*['"]([a-z0-9_]+)['"]\s*\})/g;
const ICONVAR = /\b(?:const|let|var)\s+([A-Za-z_]*[Ii]cons?[A-Za-z_]*)\s*(?::[^=]{0,200})?=/g;
const QUOTED = /['"`]([a-z][a-z0-9_]*)['"`]/g;

/** Slice the balanced `{...}` block that starts at or after `from`. */
function braceBlock(src: string, from: number): string {
  const start = src.indexOf('{', from);
  if (start < 0) return '';
  let depth = 0;
  for (let i = start; i < src.length && i < start + 20_000; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  return '';
}

const names = new Set<string>();
const collect = (text: string) => {
  QUOTED.lastIndex = 0;
  let q: RegExpExecArray | null;
  while ((q = QUOTED.exec(text)) !== null) names.add(q[1]);
};

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  let m: RegExpExecArray | null;
  while ((m = SPAN.exec(src)) !== null) {
    const body = m[2].trim();
    if (/^[a-z0-9_]+$/.test(body)) names.add(body);
    else collect(body);
  }
  while ((m = PROP.exec(src)) !== null) names.add(m[2]);
  while ((m = ATTR.exec(src)) !== null) names.add(m[2] ?? m[3]);
  while ((m = ICONVAR.exec(src)) !== null) collect(braceBlock(src, m.index + m[0].length - 1));
}

// Names are validated against Google's catalogue so stray strings (brand slugs like
// "tiktok", payment ids like "paypal") never reach the font request — one bad name
// there would fail the whole stylesheet and drop every icon on the page.
const meta = await fetch('https://fonts.google.com/metadata/icons?incomplete=1&key=material_symbols')
  .then((r) => r.text())
  .then((t) => JSON.parse(t.replace(/^\)\]\}'/, '')));
const catalogue = new Set<string>(meta.icons.map((i: { name: string }) => i.name));

const resolved = [...names].filter((n) => catalogue.has(n)).sort();
const rejected = [...names].filter((n) => !catalogue.has(n)).sort();

const current = readFileSync(TARGET, 'utf8');
const block = resolved.map((n) => `  '${n}',`).join('\n');
const next = current.replace(
  /(export const MATERIAL_SYMBOL_ICON_NAMES = \[\n)[\s\S]*?(\n\] as const;)/,
  `$1${block}$2`
);
writeFileSync(TARGET, next);

console.log(`${resolved.length} icons written to src/lib/ui/materialSymbols.ts`);
console.log(`ignored (not Material Symbols): ${rejected.join(', ') || 'none'}`);
