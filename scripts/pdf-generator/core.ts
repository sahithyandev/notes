import { readdir, stat, readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { exec } from "node:child_process";
import type { MdNode, Parent } from "./types";
import { titleize } from "../../src/utils";

const mdxParser = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkMdx);

function children(node: MdNode, baseDir: string): string[] {
  return (node.children ?? []).map((c) => mdNodetoLatex(c, baseDir));
}

function mdNodetoLatex(node: MdNode, baseDir: string): string {
  switch (node.type) {
    case "root":
      return children(node, baseDir).join("\n\n");

    case "heading": {
      const cmds = ["", "\\subsection", "\\subsubsection"];
      const cmd = cmds[Math.min((node.depth ?? 1) - 1, cmds.length - 1)];
      return `${cmd}{${children(node, baseDir).join("")}}`;
    }

    case "paragraph":
      return children(node, baseDir).join("");

    case "text":
      return (node.value ?? "")
        .replace(/—/g, "---")
        .replace(/–/g, "--")
        .replace(/[&%$#_{}~^\\]/g, (c) => {
          if (c === "\\") return "\\textbackslash{}";
          if (c === "~") return "\\textasciitilde{}";
          if (c === "^") return "\\textasciicircum{}";
          return `\\${c}`;
        });

    case "inlineMath":
      return `$${node.value}$`;

    case "math":
      return `\\[\n${node.value}\n\\]`;

    case "strong":
      return `\\textbf{${children(node, baseDir).join("")}}`;

    case "emphasis":
      return `\\textit{${children(node, baseDir).join("")}}`;

    case "list": {
      const env = node.ordered ? "enumerate" : "itemize";
      const items = children(node, baseDir).join("\n");
      return `\\begin{${env}}\n${items}\n\\end{${env}}`;
    }

    case "listItem":
      return `  \\item ${children(node, baseDir).join("").trim()}`;

    case "link":
      return `\\href{${node.url}}{${children(node, baseDir).join("")}}`;

    case "image": {
      const imgPath = node.url?.startsWith(".")
        ? resolve(baseDir, node.url)
        : (node.url ?? "");
      return `\\begin{figure}[h]\n  \\centering\n  \\includegraphics[max width=\\linewidth]{${imgPath}}\n  \\caption{${node.alt ?? ""}}\n\\end{figure}`;
    }

    case "blockquote":
      return `\\begin{quote}\n${children(node, baseDir).join("\n\n")}\n\\end{quote}`;

    case "inlineCode":
      return `\\texttt{${node.value}}`;

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

      const renderRow = (row: MdNode) =>
        (row.children ?? [])
          .map((cell) => children(cell, baseDir).join(""))
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
      return children(node, baseDir).join("");

    case "html":
      return `% [raw html omitted]`;

    // MDX JSX elements — treat as a labeled block
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement": {
      const n = node as MdNode & { name?: string };
      const inner = children(node, baseDir).join("\n\n");
      return inner
        ? `% <${n.name}>\n${inner}\n% </${n.name}>`
        : `% <${n.name} />`;
    }

    default:
      console.error("default", node);
      process.exit(1);
  }
}

async function compileMdxFile(filePath: string) {
  const content = await readFile(filePath);
  const tree = mdxParser.parse(content) as MdNode;
  return mdNodetoLatex(tree, dirname(filePath));
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

  const moduleIdParts = moduleId.split("/")
  const moduleName = titleize(moduleIdParts[1]);
  const semesterNumber = moduleIdParts[0].charAt(1);

  docLines.push("\\begin{document}");
  docLines.push(
    "\\begin{titlepage}",
    "\\begin{tikzpicture}[remember picture,overlay]",
    "",
    "\\fill[black!85]",
    "    (current page.north west) rectangle ([yshift=-2.4in]current page.north east);",
    "",
    "\\fill[black!85]",
    "    (current page.south west) rectangle ([yshift=1in]current page.south east);",
    "",
    "\\node[",
    "    align=center,",
    "    text=white,",
    "    font=\\bfseries\\fontsize{38}{44}\\selectfont,",
    "    text width=0.9\\paperwidth",
    `] at ([yshift=-1.3in]current page.north) {${moduleName.replaceAll(" ", "\\\\[0.2em]")}};`,
    "",
    "\\node[",
    "    align=center,",
    "    text=black!70,",
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

  // CONTENT
  for (const file of sortedFiles) {
    const parts = file.split("/");
    const hasSections = parts.length > 1;
    if (hasSections) {
      if (lastChapter !== parts[0]) {
        const sectionName = titleize(parts[0]);
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
    `tectonic --outdir .tmp/pdf ${texOutputPath}`,
    (error, stdout, stderr) => {
      console.log(error, stdout, stderr);
    },
  );
}
