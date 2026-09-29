#!/usr/bin/env bun
// Wired into .claude/settings.json's PreToolUse (pause) and Stop (resume)
// hooks. A docs/**/*.{md,mdx} edit already lands on dev-reload-lock's own
// short content-only debounce (src/integrations/dev-reload-lock/index.ts,
// CONTENT_DEBOUNCE_MS = 120ms) and gets soft-patched into the open note
// page by live-update.ts - fast enough on its own that pausing for it and
// force-flushing on resume buys nothing. Only an edit to something else
// (components, scripts, config, ...) still falls back to a real
// full-reload on the long debounce, which is what pause/resume's instant
// flush-on-resume is actually for.
const CONTENT_FILE_RE = /(^|\/)docs\/.+\.(md|mdx)$/;
const ENDPOINT_TIMEOUT_MS = 2000;

async function main(): Promise<void> {
  const action = process.argv[2];
  if (action !== "pause" && action !== "resume") return;

  if (action === "pause") {
    let filePath = "";
    try {
      const raw = await new Response(Bun.stdin.stream()).text();
      filePath = JSON.parse(raw)?.tool_input?.file_path ?? "";
    } catch {
      // Malformed/missing hook input - fall through and pause anyway,
      // since not knowing what changed means it isn't safe to assume the
      // fast content path handles it.
    }
    if (CONTENT_FILE_RE.test(filePath)) return;
  }

  await fetch(`http://localhost:4321/__reload-lock/${action}`, {
    method: "POST",
    signal: AbortSignal.timeout(ENDPOINT_TIMEOUT_MS),
  }).catch(() => {});
}

main();
