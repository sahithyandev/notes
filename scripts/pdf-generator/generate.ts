import { readdir, stat, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { exec } from "node:child_process";
import { titleize } from "../../src/utils";
import { groupTitleWords, compileMdxFile, escapeTextForLatex } from "./render";
import { c, fmt, step } from "./log";

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

const TEX_OUT_DIR = ".tmp";
const PDF_OUT_DIR = "pdf-exports";

const AUTHOR_BIO =
  "Sahithyan Kandathasan is a Computer Science \\& Engineering student at the University of Moratuwa. More at \\href{https://sahithyan.dev}{sahithyan.dev}.";

const NOTES_DESCRIPTION =
  "These notes started as a personal study tool and are now publicly available at \\texttt{notes.sahithyan.dev}. Each module is compiled from lectures, textbooks, and problem sets with the goal of being concise and exam-ready.";

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
    "\\raggedbottom",
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
    "\\renewcommand{\\chaptermark}[1]{\\markboth{#1}{#1}}",
    "\\renewcommand{\\sectionmark}[1]{\\markboth{#1}{#1}}",
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
    "    text=white,",
    "    font=\\normalfont\\large",
    `] at ([yshift=-2.85in]current page.north) {Semester ${semesterNumber.padStart(2, "0")}};`,
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
    "    font=\\normalfont\\large",
    "] at ([yshift=0.5in]current page.south) {Sahithyan K.};",
    "",
    "\\end{tikzpicture}",
    "\\end{titlepage}",
    "",
    "\\thispagestyle{empty}",
    "\\vspace*{2cm}",
    "{\\Large\\bfseries About Me}\\\\[0.5cm]",
    `\\noindent ${AUTHOR_BIO}`,
    "\\\\[0.5cm]",
    `\\noindent ${NOTES_DESCRIPTION}`,
    "\\newpage",
    "",
    "\\tableofcontents",
    "\\clearpage",
    "\\markboth{}{}",
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

    const { latex, title } = await compileMdxFile(
      resolve(modulePath, file),
      TEX_OUT_DIR,
    );

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
