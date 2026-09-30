import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Post URLs come from the front-matter `slug` (the glob loader uses it as the entry id),
// so renaming a file never changes its URL.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['tech', 'personal']),
    crosspost: z.array(z.enum(['devto', 'medium'])).optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
