// Clones a dot button from step-nav's <template data-dot-template>, so it
// carries that component's own scoped-CSS id (".dots .dot" is scoped to
// step-nav.astro; a plain document.createElement button would render
// unstyled). Falls back to a manually-classed button if no template is
// found, so this still degrades gracefully against an older step-nav.
export function createDot(
  dotWrap: HTMLElement,
  dotTemplate: HTMLTemplateElement | null,
  ariaLabel: string,
  onClick: () => void,
): HTMLButtonElement {
  const b = (
    dotTemplate
      ? dotTemplate.content.firstElementChild!.cloneNode(true)
      : document.createElement("button")
  ) as HTMLButtonElement;
  b.type = "button";
  if (!dotTemplate) b.className = "dot";
  b.setAttribute("aria-label", ariaLabel);
  b.addEventListener("click", onClick);
  dotWrap.appendChild(b);
  return b;
}
