import { readdir, stat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import { exec } from "node:child_process";
import type { MdNode, Parent } from "./types";
import { titleize } from "../../src/utils";

const mdxParser = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkFrontmatter)
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
      return (node.value ?? "").replace(/[&%$#_{}~^\\]/g, (c) => {
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

    case "inlineCode":
      return `\\texttt{${node.value}}`;

    case "code":
      return `\\begin{verbatim}\n${node.value}\n\\end{verbatim}`;

    case "yaml":
      return ""; // frontmatter — skip

    case "thematicBreak":
      return "\\hrule";

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
      console.log("default", node);
      // fallback: recurse if possible
      if ((node as Parent).children)
        return children(node, baseDir).join("\n\n");
      return node.value ? `% [${node.type}] ${node.value}` : `% [${node.type}]`;
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
    "",
    "\\newcommand{\\set}[1]{\\left\\{ #1 \\right\\}}",
    "\\newcommand{\\lt}{<}",
    "\\newcommand{\\gt}{>}",
  ];

  const moduleName = titleize(moduleId.split("/")[1]);

  const semesterName = titleize(moduleId.split("/")[0]);

  const noteCount = sortedFiles.length;

  docLines.push("\\begin{document}");
  docLines.push(
    "\\begin{titlepage}",
    "  \\begin{tikzpicture}[remember picture, overlay]",
    "    \\fill[black!85] (current page.north west) rectangle ([yshift=-2.2in]current page.north east);",
    "    \\fill[black!85] (current page.south west) rectangle ([yshift=0.6in]current page.south east);",
    "  \\end{tikzpicture}",
    "  \\centering",
    "  \\vspace*{0.6in}",
    `  {\\fontsize{36}{44}\\bfseries\\color{white} ${moduleName}\\par}`,
    "  \\vspace{1.6in}",
    "  \\begin{minipage}{0.75\\linewidth}",
    "    \\centering",
    "    {\\color{black!40}\\rule{\\linewidth}{0.4pt}}\\par",
    "    \\vspace{0.25in}",
    "    {\\Large\\itshape Prepared for examination reference\\par}",
    "    \\vspace{0.2in}",
    "    {\\normalsize Sahithyan K.\\par}",
    "    \\vspace{0.15in}",
    "    {\\color{black!40}\\rule{\\linewidth}{0.4pt}}\\par",
    "  \\end{minipage}",
    "  \\vfill",
    `  {\\large\\color{white} ${semesterName}\\par}`,
    "  \\vspace{0.15in}",
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

  const outputDirectory = ".tmp";
  const latexOutputPath = resolve(
    outputDirectory,
    moduleId.replace("/", "-").concat(".tex"),
  );
  const latexOutputFile = Bun.file(latexOutputPath);
  await latexOutputFile.write(docLines.join("\n"));

  exec(`tectonic ${latexOutputPath}`, (error, stdout, stderr) => {
    console.log(error, stdout, stderr);
  });
}
