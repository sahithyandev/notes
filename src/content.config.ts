import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { slugFromDocsPath } from "./utils/note-path";

const authors = defineCollection({
  loader: file("src/data/authors.json"),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    url: z.string().url().optional(),
    color: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, "color must be a 6-digit hex code"),
    github_id: z.string().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({
    base: `./docs`,
    pattern: "**/*.{md,mdx}",
    generateId: ({ entry }) => slugFromDocsPath(entry),
  }),
  schema: z.object({
    title: z.string(),
    sidebar: z.optional(
      z.object({
        label: z.optional(z.string()),
      }),
    ),
    // slug, sidebar.order, prev, and next are no longer read: slug and order
    // are derived from the file path (see generateId above and
    // note.filePath usages), and prev/next were dropped outright. All 4 are
    // left undeclared here (zod objects are non-strict by default) rather
    // than kept as optional fields, since notes still carrying them from
    // before this change don't need those values to validate, only to be
    // ignored.
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
