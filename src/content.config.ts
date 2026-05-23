import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: ['ja/**/*.{md,mdx}', 'en/**/*.{md,mdx}'],
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    updatedDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    seeAlso: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
