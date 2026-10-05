// Per-instance id for SVG <defs> (markers, clip paths) and DOM hooks, so that
// 2 copies of the same illustration on one page never share an id.
export const makeUid = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
