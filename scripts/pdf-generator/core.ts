import { readdir, stat, readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { exec } from "node:child_process";
import type { MdNode } from "./types";
import { titleize } from "../../src/utils";

const SEMESTER_COLORS: Record<string, string> = {
  "1": "3348c8",
  "2": "6b38a0",
  "3": "1a7a4a",
  "4": "8a5a18",
  "5": "4f3ac0",
  "6": "a0245a",
  "7": "0e7a96",
  "8": "944018",
};

const CONNECTOR_WORDS = new Set([
  "and", "or", "of", "the", "in", "for", "to", "a", "an", "at", "by", "with",
]);

function groupTitleWords(title: string): string[] {
  const words = title.split(" ");
  const groups: string[] = [];
  let current: string[] = [];
  for (const word of words) {
    if (CONNECTOR_WORDS.has(word.toLowerCase())) {
      if (current.length) { groups.push(current.join(" ")); current = []; }
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

interface RenderCtx { baseDir: string; inTableCell?: boolean }

function children(node: MdNode, ctx: RenderCtx): string[] {
  return (node.children ?? []).map((c) => mdNodetoLatex(c, ctx));
}

function escapeTextForLatex(text: string): string {
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

function mdNodetoLatex(node: MdNode, ctx: RenderCtx): string {
  const { baseDir } = ctx;
  switch (node.type) {
    case "root":
      return children(node, ctx).join("\n\n");

    case "heading": {
      const cmds = ["", "\\subsection", "\\subsubsection"];
      const cmd = cmds[Math.min((node.depth ?? 1) - 1, cmds.length - 1)];
      return `${cmd}{${children(node, ctx).join("")}}`;
    }

    case "paragraph":
      return children(node, ctx).join("");

    case "text":
      return escapeTextForLatex(node.value ?? "");

    case "inlineMath":
      return `$${(node.value ?? "").replace(/%/g, "\\%")}$`;

    case "math": {
      const escaped = (node.value ?? "").replace(/%/g, "\\%");
      const val = escaped.trimStart();
      const standaloneEnvs = /^\\begin\{(equation|align|gather|multline|flalign|alignat)\*?\}/;
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

    case "link":
      return `\\href{${node.url}}{${children(node, ctx).join("")}}`;

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

    case "inlineCode": {
      const escaped = (node.value ?? "")
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/[%&$#_{}~^]/g, (c) => {
          if (c === "~") return "\\textasciitilde{}";
          if (c === "^") return "\\textasciicircum{}";
          return `\\${c}`;
        });
      return `\\texttt{${escaped}}`;
    }

    case "code":
      return `\\begin{verbatim}\n${node.value}\n\\end{verbatim}`;

    case "yaml":
    case "mdxjsEsm":
    case "mdxTextExpression":
    case "mdxFlowExpression":
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
      const colSpec = Array(colCount).fill("l").join(" | ");
      const cellCtx: RenderCtx = { baseDir, inTableCell: true };

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
      const n = node as MdNode & { name?: string };
      const inner = children(node, ctx).join("\n\n");
      return inner
        ? `% <${n.name}>\n${inner}\n% </${n.name}>`
        : `% <${n.name} />`;
    }
    case "mdxJsxTextElement": {
      const n = node as MdNode & { name?: string };
      return children(node, ctx).join("");
    }

    default:
      console.error("default", node);
      process.exit(1);
  }
}

async function compileMdxFile(filePath: string) {
  const content = await readFile(filePath);
  const tree = mdxParser.parse(content) as MdNode;
  return mdNodetoLatex(tree, { baseDir: dirname(filePath) });
}

export async function generateModulePdf(moduleId: string) {
  const parts = moduleId.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid moduleId "${moduleId}": expected "<semester-dir>/<module-dir>" (e.g. "s1/maths")`,
    );
  }

  const modulePath = resolve("./docs", moduleId);

  try {
    await stat(modulePath);
  } catch (error) {
    // does not exist
    throw new Error(`Non existent module: ${moduleId}`);
  }

  console.log("generating PDF for", moduleId);

  const files = await readdir(modulePath, { recursive: true });

  const sortedFiles: Array<string> = new Array(files.length);
  let i = 0;
  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    sortedFiles[i] = file;
    i++;
  }
  sortedFiles.splice(i);
  sortedFiles.sort();

  const docLines = [
    "\\documentclass{book}",
    "\\usepackage[paperwidth=6in,paperheight=9in,top=0.75in,bottom=0.75in,left=0.75in,right=0.75in]{geometry}",
    "\\usepackage{amsmath, amssymb}",
    "\\usepackage{hyperref}",
    "\\usepackage{graphicx}",
    "\\usepackage[export]{adjustbox}",
    "\\usepackage{centernot}",
    "\\usepackage{amsmath}",
    "\\usepackage{xcolor}",
    "\\usepackage{tikz}",
    "\\usepackage{lmodern}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{needspace}",
    "\\usepackage{etoolbox}",
    "\\usepackage[version=4]{mhchem}",
    "\\usepackage{float}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\titlespacing*{\\subsection}{0pt}{1.8ex plus .2ex}{0.8ex plus .1ex}",
    "\\titlespacing*{\\subsubsection}{0pt}{1.4ex plus .2ex}{0.6ex plus .1ex}",
    "",
    "\\newcommand{\\set}[1]{\\left\\{ #1 \\right\\}}",
    "\\newcommand{\\lt}{<}",
    "\\newcommand{\\gt}{>}",
    "\\newcommand{\\degree}{\\ensuremath{^\\circ}}",
    "",
    "\\pretocmd{\\section}{\\Needspace*{0.40\\textheight}}{}{}",
    "\\pretocmd{\\subsection}{\\Needspace*{0.25\\textheight}}{}{}",
    "\\pretocmd{\\subsubsection}{\\Needspace*{0.15\\textheight}}{}{}",
  ];

  const moduleIdParts = moduleId.split("/");
  const moduleName = titleize(moduleIdParts[1]);
  const semesterNumber = moduleIdParts[0].charAt(1);
  const semColor = SEMESTER_COLORS[semesterNumber] ?? "3348c8";

  const maxGroupLen = Math.max(...groupTitleWords(moduleName).map((g) => g.length));
  const titleFontSize = maxGroupLen <= 12 ? 38 : maxGroupLen <= 18 ? 32 : maxGroupLen <= 24 ? 26 : 22;
  const titleLineHeight = Math.round(titleFontSize * 1.15);

  docLines.push(`\\definecolor{semaccent}{HTML}{${semColor}}`);
  docLines.push("\\begin{document}");
  docLines.push(
    "\\begin{titlepage}",
    "\\begin{tikzpicture}[remember picture,overlay]",
    "",
    "\\fill[semaccent]",
    "    (current page.north west) rectangle ([yshift=-3.2in]current page.north east);",
    "",
    "\\fill[semaccent]",
    "    (current page.south west) rectangle ([yshift=1in]current page.south east);",
    "",
    "\\node[",
    "    align=center,",
    "    text=white,",
    `    font=\\bfseries\\fontsize{${titleFontSize}}{${titleLineHeight}}\\selectfont,`,
    "    text width=0.9\\paperwidth",
    `] at ([yshift=-1.6in]current page.north) {${groupTitleWords(moduleName).join("\\\\[0.2em]")}};`,
    "",
    "\\node[",
    "    align=center,",
    "    text=semaccent!60!black,",
    "    font=\\itshape\\Large,",
    "    text width=0.7\\paperwidth",
    "] at (current page.center) {%",
    "    \\rule{\\linewidth}{0.6pt}\\\\[0.4cm]",
    "    Prepared for Examination Reference\\\\[0.5cm]",
    "    {\\normalsize Sahithyan K.}\\\\[0.4cm]",
    "    \\rule{\\linewidth}{0.6pt}",
    "};",
    "",
    "\\node[",
    "    text=white,",
    "    font=\\large",
    `] at ([yshift=0.5in]current page.south) {Semester ${semesterNumber.padStart(2, "0")}};`,
    "",
    "\\end{tikzpicture}",
    "\\end{titlepage}",
    "",
  );

  let lastChapter = null;
  let lastNote = null;

  const hasSubdirectories = sortedFiles.some((f) => f.includes("/"));
  if (!hasSubdirectories) {
    docLines.push(`\\chapter{${moduleName}}`);
  }

  // CONTENT
  for (const file of sortedFiles) {
    const parts = file.split("/");
    const hasSections = parts.length > 1;
    if (hasSections) {
      if (lastChapter !== parts[0]) {
        // Strip numeric prefix (e.g. "3-statics" → "statics") before titleizing
        const rawSection = parts[0].replace(/^\d+-/, "");
        const sectionName = titleize(rawSection);
        docLines.push(`\\chapter{${sectionName}}`);
        lastChapter = parts[0];
      }
    }
    const noteName = parts
      .at(-1)!
      .replace(".mdx", "")
      .split("-")
      .slice(1)
      .join(" ");

    if (lastNote !== noteName) {
      const noteDisplayName = titleize(noteName);
      docLines.push(`\\section{${noteDisplayName}}`);
      lastNote = noteName;
    }

    const compiled = await compileMdxFile(resolve(modulePath, file));
    docLines.push(compiled);
  }

  docLines.push("", "\\end{document}");

  const texOutputPath = resolve(
    ".tmp/tex",
    moduleId.replace("/", "-").concat(".tex"),
  );
  const latexOutputFile = Bun.file(texOutputPath);
  await latexOutputFile.write(docLines.join("\n"));

  await mkdir(".tmp/pdf", { recursive: true });

  exec(
    `tectonic --chatter minimal --outdir .tmp/pdf ${texOutputPath}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error("tectonic failed:", stderr || stdout);
        process.exit(1);
      }
    },
  );
}
