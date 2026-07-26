import { defineType, defineField } from 'sanity';

/**
 * Product reference block. Guides may only reference products BY SLUG —
 * the site resolves live name/score/price/affiliate data from InstantDB at
 * build time. No scores, prices, or rankings are ever stored in Sanity.
 */
export const productReference = defineType({
  name: 'productReference',
  title: 'Product reference',
  type: 'object',
  fields: [
    defineField({
      name: 'productSlug',
      title: 'Product slug',
      type: 'string',
      description:
        'The product slug from the main database (e.g. "aura-ai"). Live name, score, and affiliate link are pulled at build time. Dangling slugs produce a build warning.',
      validation: (rule) =>
        rule
          .required()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: 'slug' })
          .error('Lowercase letters, numbers, and hyphens only.'),
    }),
    defineField({
      name: 'display',
      title: 'Display style',
      type: 'string',
      options: {
        list: [
          { title: 'Product card (name, score, link)', value: 'card' },
          { title: 'Inline link', value: 'inline' },
        ],
        layout: 'radio',
      },
      initialValue: 'card',
    }),
  ],
  preview: {
    select: { slug: 'productSlug', display: 'display' },
    prepare: ({ slug, display }) => ({
      title: `Product: ${slug ?? '—'}`,
      subtitle: display === 'inline' ? 'Inline link' : 'Product card',
    }),
  },
});

export const callout = defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({
      name: 'tone',
      title: 'Tone',
      type: 'string',
      options: {
        list: [
          { title: 'Info', value: 'info' },
          { title: 'Tip', value: 'tip' },
          { title: 'Warning', value: 'warning' },
        ],
        layout: 'radio',
      },
      initialValue: 'info',
    }),
    defineField({ name: 'text', title: 'Text', type: 'text', rows: 3, validation: (r) => r.required() }),
  ],
  preview: {
    select: { text: 'text', tone: 'tone' },
    prepare: ({ text, tone }) => ({ title: `${(tone ?? 'info').toUpperCase()}: ${text ?? ''}` }),
  },
});

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ section',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'answer', type: 'text', rows: 3, validation: (r) => r.required() }),
          ],
        },
      ],
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: { items: 'items' },
    prepare: ({ items }) => ({ title: `FAQ (${items?.length ?? 0} questions)` }),
  },
});

export const guideImage = defineType({
  name: 'guideImage',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      validation: (r) => r.required().error('Alt text is required for accessibility and SEO.'),
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
  ],
});
