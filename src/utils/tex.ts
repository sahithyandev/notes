import katex from "katex";

export const tex = (v: string) =>
  katex.renderToString(v, { throwOnError: false, strict: false });
