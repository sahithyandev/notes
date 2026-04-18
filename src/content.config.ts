import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const notes = defineCollection({
    loader: glob({ base: `./docs`, pattern: '**/*.{md,mdx}' }),
    schema: z.object({
        title: z.string(),
        slug: z.string(),
        sidebar: z.object({
            label: z.string(),
            order: z.number(),
        }),
        prev: z.boolean().optional(),
        next: z.boolean().optional(),
    }),
});

export const collections = { notes };