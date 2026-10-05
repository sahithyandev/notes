// Every illustration that renders a <figure> must also render a <figcaption>,
// which is the figure's accessible description. The figure primitives (Panel,
// AxesFigure) take their props as `CaptionProps`, so leaving the caption out is
// a type error under `astro check`: pass plain text as `caption`, or pass
// `captionSlot` and fill `<Fragment slot="caption">` for a caption with markup.
export type CaptionProps =
  | { caption: string; captionSlot?: never }
  | { caption?: never; captionSlot: true };

// Type checking cannot see slot contents, so this backs `captionSlot` at render
// time: declaring a slot caption and then leaving it empty fails the build.
export function assertCaption(
  component: string,
  caption: string | undefined,
  hasSlot: boolean,
) {
  if (!caption && !hasSlot) {
    throw new Error(
      `${component} needs a caption: pass \`caption\`, or \`captionSlot\` with <Fragment slot="caption">.`,
    );
  }
}
