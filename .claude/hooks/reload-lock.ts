#!/usr/bin/env bun
// Wired into .claude/settings.json's PreToolUse (pause) and Stop (resume)
// hooks. Pausing on every Edit|Write|MultiEdit and force-flushing on resume
// is never wrong: a body-only docs/**/*.{md,mdx} edit already lands on
// dev-reload-lock's own short content-only debounce
// (src/integrations/dev-reload-lock/index.ts, CONTENT_DEBOUNCE_MS = 120ms),
// so flushing it instantly instead just skips a 120ms wait. What made a
// docs/**/*.{md,mdx} edit special enough to skip pausing for used to be
// that it *always* took that fast path - but a frontmatter-only edit
// (dev-reload-lock's frontmatterCache diff) now falls back to the slow
// full-reload debounce instead, and telling the two apart here would mean
// diffing the edit's old/new content before the tool even runs. Simpler and
// always correct: pause for every edit, unconditionally.
const ENDPOINT_TIMEOUT_MS = 2000;

async function main(): Promise<void> {
  const action = process.argv[2];
  if (action !== "pause" && action !== "resume") return;

  await fetch(`http://localhost:4321/__reload-lock/${action}`, {
    method: "POST",
    signal: AbortSignal.timeout(ENDPOINT_TIMEOUT_MS),
  }).catch(() => {});
}

main();
