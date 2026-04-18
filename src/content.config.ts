import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

function createSemesterCollection(directory: string) {
    return defineCollection({
        loader: glob({ base: `./docs/${directory}`, pattern: '**/*.{md,mdx}' }),
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
}

const s1 = createSemesterCollection("s1");

export const collections = { s1 };