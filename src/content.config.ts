import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const authors = defineCollection({
  loader: file("src/data/authors.json"),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    url: z.string().url().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ base: `./docs`, pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    sidebar: z.optional(
      z.object({
        label: z.optional(z.string()),
        order: z.optional(z.number()),
      }),
    ),
    prev: z.boolean().optional(),
    next: z.boolean().optional(),
    dateCreated: z.date().optional(),
    lastUpdatedOn: z.date().optional(),
    keywords: z.optional(z.array(z.string())),
    prereqs: z.optional(z.array(z.string())),
    authors: z
      .array(reference("authors"))
      .default([{ collection: "authors", id: "sahithyan" }]),
  }),
});

export const collections = { notes, authors };
