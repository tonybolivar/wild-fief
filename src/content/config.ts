import { defineCollection, z } from 'astro:content';

const entries = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    category: z.string(),
    categoryLabel: z.string().optional().default(''),
    entrySlug: z.string(),
    tags: z.array(z.string()).optional().default([]),
    image: z.string().optional().default(''),
    references: z.string().optional().default('[]'),
  }),
});

export const collections = { entries };
