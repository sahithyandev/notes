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

// Astro's own toolbar bar only auto-hides on mouseleave when no app is
// "active" (astro/dist/runtime/client/dev-toolbar/toolbar.js's
// attachEvents(): the mouseleave handler calls triggerDelayedHide() only if
// !this.getActiveApp()). toggleState() marks *this* app active for as long
// as live-edit stays enabled - the default - so the bar would otherwise
// never dismiss itself again after the first click. AstroDevToolbar's
// setToolbarVisible() isn't part of the public DevToolbarApp API, so this
// reaches it via the DOM: `canvas` is this app's own ShadowRoot, appended
// directly as a child of the toolbar's ShadowRoot, so canvas.host's
// getRootNode() is that toolbar ShadowRoot and its .host is the
// <astro-dev-toolbar> element itself. Defensive: silently no-ops if a
// future Astro version renames/removes the method.
function collapseToolbar(canvas: ShadowRoot): void {
  try {
    const toolbarRoot = canvas.host.getRootNode();
    const toolbarEl =
      toolbarRoot instanceof ShadowRoot ? toolbarRoot.host : null;
    const setToolbarVisible = (
      toolbarEl as unknown as {
        setToolbarVisible?: (visible: boolean) => void;
      } | null
    )?.setToolbarVisible;
    setToolbarVisible?.call(toolbarEl, false);
  } catch {
    // Best-effort only.
  }
}

export default {
  init(canvas, app) {
    // Reflects the persisted (or default-on) state in the toolbar icon
    // itself - toggleState() sets the button's own on/off appearance, it
    // doesn't open anything, since this app never appends to `canvas`.
    app.toggleState({ state: isEnabled() });

    app.onToggled(({ state }) => {
      setEnabled(state);
      collapseToolbar(canvas);
    });
  },
} satisfies DevToolbarApp;
