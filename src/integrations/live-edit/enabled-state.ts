// Whether the live-edit widgets (the floating whole-note bar and the
// per-note selection button) are currently active on the page. Toggled via
// the "Live Edit" entry in the Astro dev toolbar (toolbar-app.ts), which
// owns no UI of its own beyond that toggle - the actual input lives in
// src/components/dev/live-edit-bar.astro and live-edit.astro, detached
// from the toolbar's own canvas, both importing this module to read the
// current state and react to it changing.
//
// Plain client-side TS (no Astro-specific syntax) so it can be imported
// from an Astro component's <script> block and from the toolbar app module
// alike. Persisted per-browser via localStorage, not server state - this is
// a personal dev-session preference, not something that needs to sync
// across tabs/devices or survive a server restart.
const STORAGE_KEY = "live-edit-enabled";
export const ENABLED_EVENT = "le-enabled-changed";

// Enabled by default: absence of a stored value (first visit, or
// localStorage unavailable) means on, not off.
export function isEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Best-effort only: the in-page toggle event below still fires for any
    // listener already on this page, just won't be remembered next load.
  }
  document.dispatchEvent(
    new CustomEvent(ENABLED_EVENT, { detail: { enabled } }),
  );
}

export function onEnabledChange(callback: (enabled: boolean) => void): void {
  document.addEventListener(ENABLED_EVENT, (e) => {
    callback((e as CustomEvent<{ enabled: boolean }>).detail.enabled);
  });
}
