/** Dynamic tags for SEO title templates (resolved at preview/publish time). */
export const SEO_TEMPLATE_TAGS = [
  { tag: '%currentyear%', label: 'Current year' },
  { tag: '%currentmonth%', label: 'Full month name' },
  { tag: '%currentmonthshort%', label: 'Short month' },
  { tag: '%productname%', label: 'Product name' },
] as const;

export interface SeoTemplateContext {
  productName?: string;
  now?: Date;
}

export function resolveSeoTemplate(template: string, ctx: SeoTemplateContext = {}): string {
  if (!template.trim()) return '';
  const now = ctx.now ?? new Date();
  const year = String(now.getFullYear());
  const monthLong = now.toLocaleString('en-US', { month: 'long' });
  const monthShort = now.toLocaleString('en-US', { month: 'short' });
  const name = ctx.productName ?? '';

  return template
    .replace(/%currentyear%/gi, year)
    .replace(/%year%/gi, year)
    .replace(/%currentmonth%/gi, monthLong)
    .replace(/%currentmonthshort%/gi, monthShort)
    .replace(/%productname%/gi, name)
    .replace(/%product%/gi, name);
}
