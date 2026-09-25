import { execFileSync } from "node:child_process";
import { relative } from "node:path";

export class GitAdapter {
  private root: string | undefined;

  getRoot(): string | undefined {
    if (this.root !== undefined) return this.root;
    try {
      this.root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
        encoding: "utf-8",
      }).trim();
    } catch {
      this.root = "";
    }
    return this.root || undefined;
  }

  // Reads a file's content as committed at HEAD, trying each candidate path
  // in order (useful when a file may have been renamed locally before the
  // rename is committed). Returns undefined if none of the candidates exist
  // at HEAD.
  readAtHead(candidatePaths: string[]): string | undefined {
    const root = this.getRoot();
    if (!root) return undefined;

    for (const filePath of candidatePaths) {
      const relPath = relative(root, filePath);
      try {
        return execFileSync("git", ["show", `HEAD:${relPath}`], {
          encoding: "utf-8",
          cwd: root,
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        // not found at this path, try the next candidate
      }
    }
    return undefined;
  }
}
