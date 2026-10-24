import { readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { slugFromDocsPath } from "./utils/note-path";

const authors = defineCollection({
  loader: file("src/data/authors.json"),
  schema: z
    .object({
      slug: z.string(),
      name: z.string(),
      url: z.url().optional(),
      color: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i, "color must be a 6-digit hex code"),
      github_id: z.string().optional(),
    })
    .strict(),
});

// Wolfram notebooks (.nb) anywhere under docs/, one entry per file. The id is
// the basename without the extension, matching the `notebooks` note frontmatter.
const notebooks = defineCollection({
  loader: {
    name: "notebooks-loader",
    load: async ({ store, parseData, generateDigest }) => {
      const docsDir = fileURLToPath(new URL("../docs/", import.meta.url));
      const paths = (await readdir(docsDir, { recursive: true }))
        .filter((path) => path.endsWith(".nb"))
        .sort();

      store.clear();
      const seen = new Set<string>();
      for (const path of paths) {
        const id = basename(path, ".nb");
        if (seen.has(id)) {
          throw new Error(
            `Duplicate notebook "${id}.nb" under docs/ (${path})`,
          );
        }
        seen.add(id);

        const { size, mtimeMs } = await stat(join(docsDir, path));
        const data = await parseData({
          id,
          data: { url: `/notebooks/${id}.nb`, bytes: size, path },
        });
        store.set({ id, data, digest: generateDigest({ id, size, mtimeMs }) });
      }
    },
  },
  schema: z
    .object({
      // Public URL the download link points at, served by src/pages/notebooks/.
      url: z.string(),
      bytes: z.number().int().nonnegative(),
      // Path relative to docs/, read when the file is served.
      path: z.string(),
    })
    .strict(),
});

const notes = defineCollection({
  loader: glob({
    base: `./docs`,
    pattern: "**/*.{md,mdx}",
    generateId: ({ entry }) => slugFromDocsPath(entry),
  }),
  schema: z
    .object({
      title: z.string(),
      // Optional override for the <meta> description; otherwise derived from the body.
      description: z.string().optional(),
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
      dateCreated: z.date(),
      lastUpdatedOn: z.date(),
      keywords: z.optional(z.array(z.string())),
      prereqs: z.optional(z.array(z.string())),
      // Wolfram notebooks (.nb) offered as downloads at the end of the note.
      // Each entry is a basename without the extension, resolving to a
      // notebooks entry (the .nb file sits under docs/).
      notebooks: z.optional(z.array(reference("notebooks"))),
      authors: z
        .array(reference("authors"))
        .default([{ collection: "authors", id: "sahithyan" }]),
    })
    .strict(),
});

export const collections = { notes, authors, notebooks };
