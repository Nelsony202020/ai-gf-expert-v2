import { defineType, defineField } from 'sanity';

/** Guide byline authors (VA writers, editors). Site review authors live in InstantDB. */
export const guideAuthor = defineType({
  name: 'guideAuthor',
  title: 'Guide author',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'bio', type: 'text', rows: 3 }),
    defineField({ name: 'avatar', type: 'image', options: { hotspot: true } }),
  ],
});
