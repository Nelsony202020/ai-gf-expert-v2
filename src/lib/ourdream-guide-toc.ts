export interface OurDreamTocSection {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
}

const headingRe = /<h([23])\s+[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Build sidebar TOC from h2/h3 ids in guide HTML (h3 nest under preceding h2). */
export function extractOurDreamGuideToc(bodyHtml: string): OurDreamTocSection[] {
  const sections: OurDreamTocSection[] = [];
  let current: OurDreamTocSection | null = null;

  for (const match of bodyHtml.matchAll(headingRe)) {
    const level = Number(match[1]);
    const id = match[2];
    const label = stripTags(match[3]);
    if (!id || !label) continue;

    if (level === 2) {
      current = { id, label, children: [] };
      sections.push(current);
    } else if (level === 3 && current) {
      current.children!.push({ id, label });
    }
  }

  for (const section of sections) {
    if (section.children?.length === 0) delete section.children;
  }

  return sections;
}

export function estimateGuideReadMinutes(bodyHtml: string): number {
  const text = stripTags(bodyHtml);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
