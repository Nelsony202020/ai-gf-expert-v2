import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? '';
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';
const siteUrl = process.env.SANITY_STUDIO_SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  name: 'aigf-guides',
  title: 'AI Girlfriend Expert — Guides',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('guide').title('Guides'),
            S.documentTypeListItem('guideAuthor').title('Guide authors'),
          ]),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
  document: {
    // Live preview: opens the draft on the site's server-rendered preview route.
    productionUrl: async (prev, { document }) => {
      if (document._type !== 'guide') return prev;
      const slug = (document as any).slug?.current;
      if (!slug) return prev;
      const secret = process.env.SANITY_STUDIO_PREVIEW_SECRET ?? '';
      return `${siteUrl}/guides/preview?slug=${encodeURIComponent(slug)}&secret=${encodeURIComponent(secret)}`;
    },
  },
});
