import { readFile } from "node:fs/promises";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve, relative, basename } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { isMdCodeNode, type MdNode, type MdJsxAttribute } from "./types";
import type { PacketField } from "../../src/utils/types";

const CONNECTOR_WORDS = new Set([
  "and",
  "or",
  "of",
  "the",
  "in",
  "for",
  "to",
  "a",
  "an",
  "at",
  "by",
  "with",
]);

export function groupTitleWords(title: string): string[] {
  const words = title.split(" ");
  const groups: string[] = [];
  let current: string[] = [];
  for (const word of words) {
    if (CONNECTOR_WORDS.has(word.toLowerCase())) {
      if (current.length) {
        groups.push(current.join(" "));
        current = [];
      }
      groups.push(word);
    } else {
      current.push(word);
    }
  }
  if (current.length) groups.push(current.join(" "));
  return groups;
}

const mdxParser = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkMdx);

const IMAGE_EXTS = /\.(svg|png|jpe?g|gif|webp|pdf)$/i;

function convertSvgToPdf(svgPath: string, cacheDir: string): string {
  const pdfName = relative(process.cwd(), svgPath)
    .replace(/[/\\]/g, "-")
    .replace(/\.svg$/i, ".pdf");
  const outDir = resolve(cacheDir, "svg");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, pdfName);
  if (!existsSync(outPath)) {
    const raw = readFileSync(svgPath, "utf8");
    const cleaned = raw.replace(/&nbsp;/g, " ");
    const result = spawnSync("rsvg-convert", ["-f", "pdf", "-o", outPath], {
      input: cleaned,
    });
    if (result.status !== 0) {
      throw new Error(
        `rsvg-convert failed for ${svgPath}: ${result.stderr?.toString()}`,
      );
    }
  }
  return outPath;
}

interface RenderCtx {
  baseDir: string;
  importedImages: Map<string, string>;
  svgCacheDir?: string;
  inTableCell?: boolean;
  inHeading?: boolean;
}

function slugifyLabel(text: string): string {
  return text
    .toLowerCase()
    .replace(/\\[a-z]+\{([^}]*)\}/g, "$1") // strip latex commands, keep content
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function children(node: MdNode, ctx: RenderCtx): string[] {
  return (node.children ?? []).map((c) => mdNodetoLatex(c, ctx));
}

export function escapeTextForLatex(text: string): string {
  return text
    .replace(/—/g, "---")
    .replace(/–/g, "--")
    .replace(/[&%$#_{}~^\\]/g, (c) => {
      if (c === "\\") return "\\textbackslash{}";
      if (c === "~") return "\\textasciitilde{}";
      if (c === "^") return "\\textasciicircum{}";
      return `\\${c}`;
    });
}

function evalJsxAttr(attrs: MdJsxAttribute[], name: string): unknown {
  const attr = attrs.find((a) => a.name === name);
  if (!attr) return undefined;
  const val = attr.value;
  if (typeof val === "string") return val;
  if (val?.type === "mdxJsxAttributeValueExpression") {
    try {
      return new Function(`return (${val.value})`)();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function packetToLatex(node: MdNode): string {
  const attrs = node.attributes ?? [];
  const fields = evalJsxAttr(attrs, "fields") as PacketField[] | undefined;
  const rowWidth = evalJsxAttr(attrs, "width") as number | undefined;
  const unit = (evalJsxAttr(attrs, "unit") as string | undefined) ?? "bits";

  if (!fields || !Array.isArray(fields)) {
    return `% <Packet /> [could not parse fields]`;
  }

  const totalPerRow = rowWidth ?? fields.reduce((s, f) => s + f.size, 0);

  const rows: Array<Array<PacketField & { displaySize: number }>> = [];
  let currentRow: Array<PacketField & { displaySize: number }> = [];
  let posInRow = 0;
  for (const field of fields) {
    let remaining = field.size;
    while (remaining > 0) {
      const used = Math.min(remaining, totalPerRow - posInRow);
      currentRow.push({ ...field, displaySize: used });
      posInRow += used;
      remaining -= used;
      if (posInRow >= totalPerRow) {
        rows.push(currentRow);
        currentRow = [];
        posInRow = 0;
      }
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const lines = [
    `\\begin{center}`,
    `\\begin{bytefield}[`,
    `    bitwidth=\\dimexpr\\linewidth/${totalPerRow}\\relax,`,
    `    bitheight=4\\baselineskip,`,
    `    boxformatting={\\centering}`,
    `]{${totalPerRow}}`,
  ];
  for (const row of rows) {
    const rowStr = row
      .map((f) => {
        const label = f.label ?? `${f.size} ${unit}`;
        return `  \\bitbox{${f.displaySize}}{\\textbf{${escapeTextForLatex(f.name)}}\\\\[4pt]{\\small ${escapeTextForLatex(label)}}}`;
      })
      .join("\n");
    lines.push(rowStr + " \\\\");
  }
  lines.push(`\\end{bytefield}`, `\\end{center}`);
  return lines.join("\n");
}

function mdNodetoLatex(node: MdNode, ctx: RenderCtx): string {
  const { baseDir } = ctx;
  switch (node.type) {
    case "root":
      return children(node, ctx).join("\n\n");

    case "heading": {
      const cmds = ["", "\\subsection", "\\subsubsection"];
      const cmd = cmds[Math.min((node.depth ?? 1) - 1, cmds.length - 1)];
      const headingCtx: RenderCtx = { ...ctx, inHeading: true };
      const headingText = children(node, headingCtx).join("");
      const label = slugifyLabel(headingText);
      if (node.depth === 1) {
        throw new Error(`h1 heading found in ${ctx.baseDir}: "${headingText}"`);
      }
      return `${cmd}{${headingText}}\\label{${label}}`;
    }

    case "paragraph":
      return children(node, ctx).join("");

    case "text":
      return escapeTextForLatex(node.value ?? "");

    case "inlineMath":
      return `$${(node.value ?? "").replace(/(?<!\\)%/g, "\\%")}$`;

    case "math": {
      const escaped = (node.value ?? "").replace(/(?<!\\)%/g, "\\%");
      const val = escaped.trimStart();
      const standaloneEnvs =
        /^\\begin\{(equation|align|gather|multline|flalign|alignat)\*?\}/;
      if (standaloneEnvs.test(val)) return val;
      return `\\[\n${escaped}\n\\]`;
    }

    case "strong":
      return `\\textbf{${children(node, ctx).join("")}}`;

    case "emphasis":
      return `\\textit{${children(node, ctx).join("")}}`;

    case "list": {
      const env = node.ordered ? "enumerate" : "itemize";
      const items = children(node, ctx).join("\n");
      return `\\begin{${env}}[noitemsep, topsep=4pt, partopsep=0pt]\n${items}\n\\end{${env}}`;
    }

    case "listItem":
      return `  \\item ${children(node, ctx).join("").trim()}`;

    case "link": {
      const url = node.url ?? "";
      const linkText = children(node, ctx).join("");
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return `\\href{${url}}{${linkText}}`;
      }
      // Internal site link: resolve label from last path segment or fragment
      const hashIdx = url.indexOf("#");
      const fragment = hashIdx !== -1 ? url.slice(hashIdx + 1) : null;
      const pathPart = hashIdx !== -1 ? url.slice(0, hashIdx) : url;
      const lastSegment = pathPart.replace(/\/$/, "").split("/").at(-1) ?? "";
      const label = fragment ?? lastSegment;
      if (!label) return linkText;
      return `\\hyperref[${label}]{${linkText}}`;
    }

    case "image": {
      const imgPath = node.url?.startsWith(".")
        ? resolve(baseDir, node.url)
        : (node.url ?? "");
      const alt = escapeTextForLatex(node.alt ?? "");
      const graphic = `\\includegraphics[max width=\\linewidth]{${imgPath}}`;
      if (ctx.inTableCell) return graphic;
      if (!alt) return `\\begin{center}\n${graphic}\n\\end{center}`;
      return `\\begin{figure}[H]\n  \\centering\n  ${graphic}\n  \\caption{${alt}}\n\\end{figure}`;
    }

    case "blockquote":
      return `\\begin{quote}\n${children(node, ctx).join("\n\n")}\n\\end{quote}`;

    case "inlineCode":
      if (ctx.inHeading) {
        return `\\texttt{${escapeTextForLatex(node.value ?? "")}}`;
      }
      return `\\lstinline|${node.value ?? ""}|`;

    case "code": {
      if (!isMdCodeNode(node)) {
        console.error(node);
        throw new Error(`'code' block but not MdCodeNode`);
      }
      const LANG_MAP: Record<string, string> = {
        python: "Python",
        py: "Python",
        javascript: "Java",
        js: "Java",
        typescript: "Java",
        ts: "Java",
        java: "Java",
        c: "C",
        cpp: "C++",
        "c++": "C++",
        csharp: "[Sharp]C",
        "c#": "[Sharp]C",
        bash: "bash",
        sh: "bash",
        sql: "SQL",
        html: "HTML",
        xml: "XML",
        php: "PHP",
        ruby: "Ruby",
        perl: "Perl",
        matlab: "Matlab",
        r: "R",
      };
      const normalized = node.lang
        ? (LANG_MAP[node.lang.toLowerCase()] ?? null)
        : null;
      const lang = normalized ? `[language=${normalized}]` : "";
      return `\\begin{lstlisting}${lang}\n${node.value}\n\\end{lstlisting}`;
    }

    case "yaml":
      return "";

    case "mdxjsEsm": {
      const raw = node.value ?? "";
      const match = raw.match(/^import\s+(\w+)\s+from\s+["']([^"']+)["']/m);
      if (match && IMAGE_EXTS.test(match[2])) {
        const absPath = resolve(baseDir, match[2]);
        const isSvg = /\.svg$/i.test(match[2]);
        const finalPath =
          isSvg && ctx.svgCacheDir
            ? convertSvgToPdf(absPath, ctx.svgCacheDir)
            : absPath;
        ctx.importedImages.set(match[1], finalPath);
      } else {
        console.warn(`[render] skipping mdxjsEsm: ${raw}`);
      }
      return "";
    }

    case "mdxTextExpression":
    case "mdxFlowExpression":
      console.warn(`[render] skipping ${node.type}: ${node.value}`);
      return "";

    case "break":
      return "\\\\";

    case "thematicBreak":
      return "\\hrule";

    case "table": {
      const rows = (node.children ?? []) as MdNode[];
      const headerRow = rows[0];
      const bodyRows = rows.slice(1);
      const colCount = (headerRow?.children ?? []).length;
      const colWidth = `\\dimexpr(\\linewidth - ${colCount + 1}\\tabcolsep * 2 - ${colCount - 1}\\arrayrulewidth) / ${colCount}\\relax`;
      const colSpec = Array(colCount).fill(`p{${colWidth}}`).join(" | ");
      const cellCtx: RenderCtx = { ...ctx, inTableCell: true };

      const renderRow = (row: MdNode) =>
        (row.children ?? [])
          .map((cell) => children(cell, cellCtx).join(""))
          .join(" & ") + " \\\\";

      const header = headerRow ? renderRow(headerRow) : "";
      const body = bodyRows.map(renderRow).join("\n");

      return [
        `\\begin{center}`,
        `\\begin{tabular}{| ${colSpec} |}`,
        `\\hline`,
        header,
        `\\hline`,
        body,
        `\\hline`,
        `\\end{tabular}`,
        `\\end{center}`,
      ].join("\n");
    }

    case "tableRow":
    case "tableCell":
      return children(node, ctx).join("");

    case "html":
      return `% [raw html omitted]`;

    // MDX JSX elements — block elements get a comment marker; inline elements
    // return empty string to avoid breaking table-cell alignment (% comments
    // out the rest of the line, swallowing subsequent & separators).
    case "mdxJsxFlowElement": {
      if (node.name === "Packet") return packetToLatex(node);
      const imgPath = ctx.importedImages.get(node.name ?? "");
      if (imgPath) {
        return `\\begin{center}\n\\includegraphics[max width=\\linewidth]{${imgPath}}\n\\end{center}`;
      }
      const inner = children(node, ctx).join("\n\n");
      return inner
        ? `% <${node.name}>\n${inner}\n% </${node.name}>`
        : `% <${node.name} />`;
    }
    case "mdxJsxTextElement": {
      const imgPath = ctx.importedImages.get(node.name ?? "");
      if (imgPath) {
        return `\\includegraphics[max width=\\linewidth]{${imgPath}}`;
      }
      return children(node, ctx).join("");
    }

    default:
      console.error("default", node);
      process.exit(1);
  }
}

export async function compileMdxFile(filePath: string, svgCacheDir?: string) {
  const content = await readFile(filePath);
  const tree = mdxParser.parse(content) as MdNode;
  const yamlNode = (tree.children ?? []).find((n) => n.type === "yaml");
  const title = yamlNode?.value?.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  return {
    latex: mdNodetoLatex(tree, {
      baseDir: dirname(filePath),
      importedImages: new Map(),
      svgCacheDir,
    }),
    title,
  };
}
