export interface OurDreamTocSection {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
}

const headingRe = /<h2\s+[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/gi;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Build sidebar TOC from h2 ids — Figma article rail lists H2 sections only. */
export function extractOurDreamGuideToc(bodyHtml: string): OurDreamTocSection[] {
  const sections: OurDreamTocSection[] = [];

  for (const match of bodyHtml.matchAll(headingRe)) {
    const id = match[1];
    const label = stripTags(match[2]);
    if (!id || !label) continue;
    sections.push({ id, label });
  }

  return sections;
}

export function estimateGuideReadMinutes(bodyHtml: string): number {
  const text = stripTags(bodyHtml);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
