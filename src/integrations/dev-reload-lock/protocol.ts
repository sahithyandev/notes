// Shared between the server (index.ts, Node-only) and the browser
// (src/scripts/live-update.ts) - kept in its own file with zero Node
// imports so the client script can import just this constant without
// pulling node:path/vite server types into the browser bundle.
export const CONTENT_CHANGED_EVENT = "sn:content-changed";

export interface ContentChangedData {
  files: string[];
}
