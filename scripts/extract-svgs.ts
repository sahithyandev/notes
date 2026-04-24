#!/usr/bin/env node

/**
 * Extract inline SVG elements from MDX files and convert them to separate SVG files.
 * Updates MDX files to import and use the extracted SVGs as components.
 *
 * Usage: bun run scripts/extract-svgs.ts <directory>
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import parser from "@babel/parser";
import generate from "@babel/generator";

interface Heading {
  level: number;
  text: string;
  position: number;
}

interface Svg {
  code: string;
  start: number;
  end: number;
  headingLabel: string;
}

/**
 * Recursively find all .mdx files in a directory
 */
function findMdxFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findMdxFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract all headings from content with their positions
 */
function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  // Match markdown headings: #, ##, ###, etc.
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      position: match.index,
    });
  }

  return headings;
}

/**
 * Convert string to dasherized case
 */
function dasherize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}

/**
 * Find the last heading before a given position
 */
function findHeadingBeforePosition(
  headings: Heading[],
  position: number,
): Heading | null {
  let lastHeading: Heading | null = null;

  for (const heading of headings) {
    if (heading.position < position) {
      lastHeading = heading;
    } else {
      break;
    }
  }

  return lastHeading;
}

/**
 * Extract SVG elements from content using regex, then validate with Babel
 */
function extractSvgsFromMdx(content: string): Svg[] {
  const svgs: Svg[] = [];
  const headings = extractHeadings(content);

  // Use regex to find SVG blocks (handles multiline, nested elements)
  const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = svgRegex.exec(content)) !== null) {
    const svgContent = match[0];
    const start = match.index;
    const end = match.index + match[0].length;

    // Find the last heading before this SVG
    const heading = findHeadingBeforePosition(headings, start);
    const headingLabel = heading ? dasherize(heading.text) : "untitled";

    try {
      // Validate and clean the SVG using Babel
      const ast = parser.parse(svgContent, {
        sourceType: "module",
        plugins: ["jsx"],
      });

      // Generate clean SVG code
      const { code } = generate(ast, {
        compact: false,
      });

      svgs.push({
        code: code.trim(),
        start: start,
        end: end,
        headingLabel: headingLabel,
      });
    } catch (error) {
      console.warn(
        `  Warning: Failed to parse SVG at position ${start}: ${(error as Error).message}`,
      );
      console.warn(`  SVG content preview: ${svgContent.substring(0, 100)}...`);
    }
  }

  return svgs;
}

/**
 * Extract existing import statements from MDX content using regex
 */
function extractExistingImports(content: string): string[] {
  const imports: string[] = [];

  // Use regex to find import statements
  const importRegex = /^import\s+.+\s+from\s+['"].+['"];?$/gm;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[0].trim());
  }

  return imports;
}

/**
 * Generate import statement for an SVG
 */
function generateImportStatement(
  componentName: string,
  filename: string,
): string {
  return `import ${componentName} from './images/${filename}';`;
}

/**
 * Replace inline SVG with component usage
 */
function replaceSvgWithComponent(
  content: string,
  svg: Svg,
  componentName: string,
): string {
  const componentUsage = `<${componentName} />`;

  // Replace the SVG code with component usage
  const before = content.substring(0, svg.start);
  const after = content.substring(svg.end);

  return before + componentUsage + after;
}

/**
 * Process a single MDX file
 */
function processMdxFile(filePath: string, dryRun: boolean = false): void {
  console.log(`Processing: ${filePath}`);

  const content = fs.readFileSync(filePath, "utf-8");

  // Strip frontmatter using gray-matter
  const { content: contentWithoutFrontmatter, data: frontmatterData } =
    matter(content);
  const frontmatterString = matter.stringify("", frontmatterData).trim();
  const frontmatterLength = content.indexOf(contentWithoutFrontmatter);

  const svgs = extractSvgsFromMdx(contentWithoutFrontmatter);

  if (svgs.length === 0) {
    console.log(`  No inline SVGs found`);
    return;
  }

  console.log(`  Found ${svgs.length} inline SVG(s)`);

  // Create images directory relative to the MDX file
  const fileDir = path.dirname(filePath);
  const imagesDir = path.join(fileDir, "images");

  if (!dryRun && !fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`  Created directory: ${imagesDir}`);
  } else if (dryRun && !fs.existsSync(imagesDir)) {
    console.log(`  [DRY RUN] Would create directory: ${imagesDir}`);
  }

  // Extract existing imports
  const existingImports = extractExistingImports(contentWithoutFrontmatter);
  const importSet = new Set(existingImports);

  // Track the new imports to add
  const newImports: string[] = [];

  // Track used filenames to avoid collisions
  const usedFilenames = new Set<string>();

  // Process each SVG (in reverse order to maintain correct positions)
  let modifiedContent = contentWithoutFrontmatter;

  for (let i = svgs.length - 1; i >= 0; i--) {
    const svg = svgs[i];

    // Generate base filename from heading label
    let baseFilename = svg.headingLabel || "untitled";
    let svgFilename = `${baseFilename}.svg`;
    let suffix = 1;

    // Handle duplicate filenames
    while (
      usedFilenames.has(svgFilename) ||
      (!dryRun && fs.existsSync(path.join(imagesDir, svgFilename)))
    ) {
      svgFilename = `${baseFilename}-${suffix}.svg`;
      suffix++;
    }

    usedFilenames.add(svgFilename);

    // Generate component name (PascalCase)
    const componentName = svgFilename
      .replace(".svg", "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    const svgPath = path.join(imagesDir, svgFilename);

    // Check if file already exists
    if (fs.existsSync(svgPath)) {
      console.log(`  Skipping ${svgFilename} (already exists)`);
    } else if (dryRun) {
      console.log(`  [DRY RUN] Would create: ${svgPath}`);
    } else {
      fs.writeFileSync(svgPath, svg.code, "utf-8");
      console.log(`  Created: ${svgPath}`);
    }

    // Generate import statement
    const importStatement = generateImportStatement(componentName, svgFilename);

    if (!importSet.has(importStatement)) {
      importSet.add(importStatement);
      newImports.push(importStatement);
    }

    // Replace inline SVG with component usage
    modifiedContent = replaceSvgWithComponent(
      modifiedContent,
      svg,
      componentName,
    );
  }

  // Add new imports at the top of the file
  if (newImports.length > 0) {
    console.log(`  [DRY RUN] Would add imports: ${newImports.join(", ")}`);

    // Find the position to insert imports (after existing imports or at the start)
    const lines = modifiedContent.split("\n");
    let insertIndex = 0;

    // Skip existing import statements
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine.startsWith("import ")) {
        insertIndex = i + 1;
      } else if (trimmedLine && !trimmedLine.startsWith("import ")) {
        break;
      }
    }

    // Insert new imports
    lines.splice(insertIndex, 0, ...newImports);
    modifiedContent = lines.join("\n");
  }

  // Write modified content back to file
  if (dryRun) {
    console.log(`  [DRY RUN] Would update: ${filePath}`);
  } else {
    // Reconstruct with frontmatter
    const finalContent = frontmatterString + "\n\n" + modifiedContent.trim();
    fs.writeFileSync(filePath, finalContent, "utf-8");
    console.log(`  Updated: ${filePath}`);
  }
}

/**
 * Main function
 */
function main(): void {
  const args = process.argv.slice(2);

  // Check for --dry-run flag
  const dryRunIndex = args.indexOf("--dry-run");
  const dryRun = dryRunIndex !== -1;

  // Remove --dry-run from args if present
  const targetDir = dryRun ? (dryRunIndex === 0 ? args[1] : args[0]) : args[0];

  if (!targetDir) {
    console.error("Error: Please provide a directory path");
    console.error(
      "Usage: bun run scripts/extract-svgs.ts <directory> [--dry-run]",
    );
    process.exit(1);
  }

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  if (!fs.statSync(targetDir).isDirectory()) {
    console.error(`Error: Path is not a directory: ${targetDir}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log("DRY RUN MODE - No files will be modified\n");
  }

  console.log(`Scanning directory: ${targetDir}`);

  const mdxFiles = findMdxFiles(targetDir);

  if (mdxFiles.length === 0) {
    console.log("No .mdx files found");
    return;
  }

  console.log(`Found ${mdxFiles.length} .mdx file(s)\n`);

  for (const mdxFile of mdxFiles) {
    processMdxFile(mdxFile, dryRun);
    console.log();
  }

  console.log(dryRun ? "Dry run complete!" : "Done!");
}

main();
