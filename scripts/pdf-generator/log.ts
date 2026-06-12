export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

export function fmt(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

export const step = (label: string, ms?: number) =>
  console.log(
    `  ${c.dim}›${c.reset}  ${label.padEnd(30)}` +
      (ms !== undefined ? `  ${c.gray}${fmt(ms)}${c.reset}` : ""),
  );
