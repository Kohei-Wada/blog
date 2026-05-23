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
    seeAlso: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({
    base: './src/content/projects',
    pattern: '*.md',
  }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    description_en: z.string(),
    repo: z.string().url(),
    stack: z.array(z.string()).default([]),
    status: z.enum(['active', 'maintenance', 'archived']).default('active'),
    /** Sort key. Higher first. Ties broken by name. */
    order: z.number().default(0),
    /** Slugs of related blog posts (same locale as the page, JP by default). */
    relatedPosts: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, projects };
