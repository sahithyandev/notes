// Parses a fetched page for swapping into the live document. DOMParser makes
// documents with scripting disabled, so it turns a <noscript>'s contents into
// real elements, and adopting them into the live document would activate the
// no-JS fallback styles (e.g. an illustration's "show everything" rules).
// Turning each <noscript> body back into text matches what a
// scripting-enabled parse produces.
export function parsePage(html: string): Document {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("noscript").forEach((el) => {
    el.textContent = el.innerHTML;
  });
  return doc;
}
