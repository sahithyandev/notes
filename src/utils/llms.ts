import { titleize } from ".";

export interface LlmsNote {
  id: string;
  title: string;
  description?: string;
}

function moduleId(id: string): string {
  return id.split("/").slice(0, 2).join("/");
}

function moduleLabel(id: string): string {
  const [semester, module = "general"] = id.split("/");
  const semesterNumber = semester.match(/^s(\d+)$/)?.[1];
  const semesterLabel = semesterNumber
    ? `Semester ${semesterNumber}`
    : semester;
  return `${semesterLabel} — ${titleize(module)}`;
}

/** Builds the compact, entry-point manifest served from /llms.txt. */
export function renderLlmsTxt(
  notes: LlmsNote[],
  siteName: string,
  siteUrl: string,
): string {
  const modules = new Map<string, number>();

  for (const note of [...notes].sort((a, b) => a.id.localeCompare(b.id))) {
    const id = moduleId(note.id);
    modules.set(id, (modules.get(id) ?? 0) + 1);
  }

  const catalogue = [...modules]
    .map(([id, count]) => ({ id, count, semester: id.split("/")[0] }))
    .sort((a, b) => a.id.localeCompare(b.id))
    .reduce<Array<{ semester: string; lines: string[] }>>((groups, module) => {
      const previous = groups.at(-1);
      if (!previous || previous.semester !== module.semester) {
        groups.push({ semester: module.semester, lines: [] });
      }
      groups
        .at(-1)!
        .lines.push(
          `- [${moduleLabel(module.id).split(" — ")[1]}](${siteUrl}/${module.id}): ${module.count} notes`,
        );
      return groups;
    }, [])
    .map((group) => {
      const number = group.semester.match(/^s(\d+)$/)?.[1] ?? group.semester;
      return `### Semester ${number}\n\n${group.lines.join("\n")}`;
    })
    .join("\n\n");

  return `# ${siteName}

> Engineering study notes arranged by semester, module, and topic.

## Using these notes

- Prefer the canonical note URLs below when citing or discussing the material.
- Attribute material to ${siteName} and link to the source page.
- Note content is available under [CC BY-NC-ND 4.0](${siteUrl}/license). This catalogue does not grant rights beyond that license.

## Key pages

- [Home](${siteUrl}/): semester and module overview
- [Glossary](${siteUrl}/glossary): terms and abbreviations
- [Sitemap](${siteUrl}/sitemap-index.xml): complete crawlable URL index
- [License](${siteUrl}/license): content-use terms
- [Full note catalogue](${siteUrl}/llms-full.txt): every canonical note URL with a short description

## Subjects

${catalogue}
`;
}

/** Builds the optional detailed catalogue linked from /llms.txt. */
export function renderLlmsFullTxt(
  notes: LlmsNote[],
  siteName: string,
  siteUrl: string,
): string {
  const grouped = new Map<string, LlmsNote[]>();

  for (const note of [...notes].sort((a, b) => a.id.localeCompare(b.id))) {
    const label = moduleLabel(note.id);
    grouped.set(label, [...(grouped.get(label) ?? []), note]);
  }

  const catalogue = [...grouped]
    .map(([label, entries]) => {
      const lines = entries.map((note) => {
        const description = note.description?.trim().replace(/\s+/g, " ");
        return `- [${note.title}](${siteUrl}/${note.id})${description ? `: ${description}` : ""}`;
      });
      return `### ${label}\n\n${lines.join("\n")}`;
    })
    .join("\n\n");

  return `# ${siteName}: Full Note Catalogue

> The detailed companion to [${siteUrl}/llms.txt](${siteUrl}/llms.txt).

${catalogue}
`;
}
