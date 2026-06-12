import { readdir, stat, readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { exec } from "node:child_process";
import { isMdCodeNode, type MdNode, type MdJsxAttribute } from "./types";
import { titleize } from "../../src/utils";
import type { PacketField } from "../../src/utils/types";

const SEMESTER_COLORS: Record<string, string> = {
  "1": "3348c8",
  "2": "b83060",
  "3": "1a7a4a",
  "4": "962030",
  "5": "4f3ac0",
  "6": "a0245a",
  "7": "0e7a96",
  "8": "944018",
};

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

function groupTitleWords(title: string): string[] {
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

interface RenderCtx {
  baseDir: string;
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
      if (node.depth === 1) {
        console.warn(
          `${c.yellow}warning:${c.reset} h1 found in ${ctx.baseDir}`,
        );
      }
      const cmds = ["", "\\subsection", "\\subsubsection"];
      const cmd = cmds[Math.min((node.depth ?? 1) - 1, cmds.length - 1)];
      const headingCtx: RenderCtx = { ...ctx, inHeading: true };
      const headingText = children(node, headingCtx).join("");
      const label = slugifyLabel(headingText);
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
      const colWidth = `\\dimexpr(\\linewidth - ${colCount + 1}\\tabcolsep * 2 - ${colCount - 1}\\arrayrulewidth) / ${colCount}\\relax`;
      const colSpec = Array(colCount).fill(`p{${colWidth}}`).join(" | ");
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
      if (node.name === "Packet") return packetToLatex(node);
      const inner = children(node, ctx).join("\n\n");
      return inner
        ? `% <${node.name}>\n${inner}\n% </${node.name}>`
        : `% <${node.name} />`;
    }
    case "mdxJsxTextElement":
      return children(node, ctx).join("");

    default:
      console.error("default", node);
      process.exit(1);
  }
}

async function compileMdxFile(filePath: string) {
  const content = await readFile(filePath);
  const tree = mdxParser.parse(content) as MdNode;
  const yamlNode = (tree.children ?? []).find((n) => n.type === "yaml");
  const title = yamlNode?.value?.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  return { latex: mdNodetoLatex(tree, { baseDir: dirname(filePath) }), title };
}

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  yellow: "\x1b[33m",
};
const fmt = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
const step = (label: string, ms?: number) =>
  console.log(
    `  ${c.dim}›${c.reset}  ${label.padEnd(30)}` +
      (ms !== undefined ? `  ${c.gray}${fmt(ms)}${c.reset}` : ""),
  );

const TEX_OUT_DIR = ".tmp";
const PDF_OUT_DIR = "pdf-exports";

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

  console.log(`${c.bold}${c.cyan}${moduleId}${c.reset}`);

  const t0 = performance.now();
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

  step(`found ${sortedFiles.length} files`);

  const docLines = [
    "\\documentclass{book}",
    "\\usepackage[paperwidth=6in,paperheight=9in,top=0.5in,bottom=0.5in,left=0.55in,right=0.55in]{geometry}",
    "\\usepackage{amsmath, amssymb}",
    "\\usepackage[colorlinks=true]{hyperref}",
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
    "\\usepackage{bytefield}",
    "\\usepackage{float}",
    "\\usepackage{enumitem}",
    "\\usepackage{listings}",
    "\\usepackage{inconsolata}",
    "\\usepackage{titlesec}",
    "\\usepackage{tocloft}",
    "\\setlength{\\cftbeforechapskip}{4pt}",
    "\\setlength{\\cftbeforesecskip}{1pt}",
    "\\setlength{\\cftbeforesubsecskip}{0pt}",
    "\\titlespacing*{\\subsection}{0pt}{1.8ex plus .2ex}{0.8ex plus .1ex}",
    "\\titlespacing*{\\subsubsection}{0pt}{1.4ex plus .2ex}{0.6ex plus .1ex}",
    "",
    "\\setlength{\\parindent}{0pt}",
    "\\setlength{\\parskip}{0.6em}",
    "",
    "\\newcommand{\\set}[1]{\\left\\{ #1 \\right\\}}",
    "\\newcommand{\\lt}{<}",
    "\\newcommand{\\gt}{>}",
    "\\newcommand{\\degree}{\\ensuremath{^\\circ}}",
    "",
    "\\lstset{",
    "  basicstyle=\\small\\ttfamily,",
    "  breaklines=true,",
    "  breakatwhitespace=false,",
    "  columns=flexible,",
    "  keepspaces=true,",
    "  showstringspaces=false,",
    "  frame=single,",
    "  framesep=4pt,",
    "  xleftmargin=6pt,",
    "  xrightmargin=6pt,",
    "  keywordstyle=\\bfseries,",
    "  commentstyle=\\itshape,",
    "  aboveskip=8pt,",
    "  belowskip=4pt,",
    "}",
    "",
    "\\pretocmd{\\section}{\\Needspace*{0.40\\textheight}}{}{}",
    "\\pretocmd{\\subsection}{\\Needspace*{0.25\\textheight}}{}{}",
    "\\pretocmd{\\subsubsection}{\\Needspace*{0.15\\textheight}}{}{}",
  ];

  const moduleIdParts = moduleId.split("/");
  const moduleName = titleize(moduleIdParts[1]);
  const semesterNumber = moduleIdParts[0].charAt(1);
  const semColor = SEMESTER_COLORS[semesterNumber] ?? "3348c8";

  const maxGroupLen = Math.max(
    ...groupTitleWords(moduleName).map((g) => g.length),
  );
  const titleFontSize =
    maxGroupLen <= 12
      ? 32
      : maxGroupLen <= 18
        ? 26
        : maxGroupLen <= 24
          ? 22
          : 18;
  const titleLineHeight = Math.round(titleFontSize * 1.15);

  docLines.push(`\\definecolor{semaccent}{HTML}{${semColor}}`);
  docLines.push(
    "\\hypersetup{linkcolor=semaccent,urlcolor=semaccent,citecolor=semaccent}",
  );
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
    "    text=semaccent!80!black,",
    "    font=\\normalfont\\large,",
    "    text width=0.75\\paperwidth",
    "] at (current page.center) {%",
    "    An attempt to distill a semester's worth of\\\\[0.2cm]",
    "    learning into a concise and practical companion.",
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
    "\\thispagestyle{empty}",
    "\\vspace*{2cm}",
    "{\\Large\\bfseries About the Author}\\\\[0.5cm]",
    "\\noindent I am Sahithyan Kandathasan, a Computer Science \\& Engineering student at the University of Moratuwa, Sri Lanka. Alongside my studies, I build software and write, driven by a belief that understanding something well enough to explain it clearly is the deepest form of learning. More of my work can be found at \\href{https://sahithyan.dev}{sahithyan.dev}.",
    "\\\\[0.5cm]",
    "\\noindent These notes began as a personal study tool and grew into a structured resource I share publicly at \\texttt{notes.sahithyan.dev}. Each module is distilled from lectures, textbooks, and problem sets into a form that is direct and exam-ready, written to be the companion I wished I had when sitting down to revise.",
    "\\newpage",
    "",
    "\\tableofcontents",
    "",
  );

  let lastChapter = null;
  let lastNote = null;

  const hasSubdirectories = sortedFiles.some((f) => f.includes("/"));
  if (!hasSubdirectories) {
    docLines.push("\\renewcommand{\\thesection}{\\arabic{section}}");
  }

  // CONTENT
  const tCompile = performance.now();
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

    const { latex, title } = await compileMdxFile(resolve(modulePath, file));

    if (lastNote !== noteName) {
      const rawName = title ?? titleize(noteName);
      const shortenedName = rawName.replace(
        /^Introduction to .+$/i,
        "Introduction",
      );
      const noteDisplayName = escapeTextForLatex(shortenedName);
      // Label uses the URL slug: last path segment of the file without numeric prefix
      const noteSlug = parts.at(-1)!.replace(".mdx", "").replace(/^\d+-/, "");
      docLines.push(`\\section{${noteDisplayName}}\\label{${noteSlug}}`);
      lastNote = noteName;
    }

    docLines.push(latex);
  }
  step("compile mdx", performance.now() - tCompile);

  docLines.push("", "\\end{document}");

  const texOutputPath = resolve(
    TEX_OUT_DIR,
    moduleId.replace("/", "-").concat(".tex"),
  );
  const latexOutputFile = Bun.file(texOutputPath);
  const tTex = performance.now();
  await latexOutputFile.write(docLines.join("\n"));
  step(`write ${texOutputPath}`, performance.now() - tTex);

  await mkdir(PDF_OUT_DIR, { recursive: true });

  const tTectonic = performance.now();
  await new Promise<void>((res, rej) => {
    exec(
      `tectonic --chatter minimal --outdir ${PDF_OUT_DIR} ${texOutputPath}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(
            `${c.yellow}tectonic failed:${c.reset}`,
            stderr || stdout,
          );
          rej(error);
        } else {
          step("tectonic", performance.now() - tTectonic);
          step(`total`, performance.now() - t0);
          res();
        }
      },
    );
  });
}
