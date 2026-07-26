import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Guide document. The body uses a RESTRICTED block set — writers cannot embed
 * arbitrary HTML, scores, prices, or rankings. Product facts are referenced
 * by slug only and resolved from InstantDB at build time.
 */
export const guide = defineType({
  name: 'guide',
  title: 'Guide',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      description:
        'URL: /guides/[slug]. Changing the slug of a published guide automatically creates a 301 redirect on the site (editor approval required in Sanity roles).',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'excerpt', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'heroImage', type: 'guideImage', group: 'content' }),
    defineField({
      name: 'author',
      type: 'reference',
      to: [{ type: 'guideAuthor' }],
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    validation: (r) =>
                      r.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }),
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({ type: 'productReference' }),
        defineArrayMember({ type: 'callout' }),
        defineArrayMember({ type: 'faqSection' }),
        defineArrayMember({ type: 'guideImage' }),
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({ name: 'publishedAt', type: 'datetime', group: 'content' }),
    // SEO
    defineField({ name: 'seoTitle', type: 'string', group: 'seo', validation: (r) => r.max(70) }),
    defineField({ name: 'seoDescription', type: 'text', rows: 2, group: 'seo', validation: (r) => r.max(170) }),
    defineField({
      name: 'noindex',
      type: 'boolean',
      group: 'seo',
      initialValue: false,
      description: 'Exclude from search engines and the sitemap.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current', media: 'heroImage' },
  },
});
