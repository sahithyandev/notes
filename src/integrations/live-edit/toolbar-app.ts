// Astro dev toolbar app for live-edit: a pure on/off switch, not the UI
// itself. Registered via addDevToolbarApp() in index.ts's astro:config:setup
// hook, entrypoint resolved relative to this file, so it only ever loads in
// dev.
//
// The actual input (the floating whole-note/merge bar and its review panel,
// and the per-note selection button) lives detached from the toolbar
// entirely, in src/components/dev/live-edit-bar.astro and
// live-edit.astro, both mounted directly on the page rather than inside
// this app's own canvas. Clicking this icon just flips the shared enabled
// flag (enabled-state.ts) those two widgets read and react to; it doesn't
// open a window. Enabled by default, so the toggle only matters when you
// want to turn live-edit off for a bit.
import type { DevToolbarApp } from "astro";
import { isEnabled, setEnabled } from "./enabled-state.ts";

export default {
  init(_canvas, app) {
    // Reflects the persisted (or default-on) state in the toolbar icon
    // itself - toggleState() sets the button's own on/off appearance, it
    // doesn't open anything, since this app never appends to `canvas`.
    app.toggleState({ state: isEnabled() });

    app.onToggled(({ state }) => setEnabled(state));
  },
} satisfies DevToolbarApp;
