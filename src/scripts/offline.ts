// Page side of public/sw.js: registers the worker, mirrors connectivity into
// `html[data-offline]`, and reflects what the worker has cached (the
// "available offline" badge, the update toast). Keep PAGE_CACHE_PREFIX,
// AT_HEADER and MAX_AGE_MS in sync with the worker.
export const PAGE_CACHE_PREFIX = "sn-pages-";
export const AT_HEADER = "sn-cached-at";
export const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isFresh(response: Response, now = Date.now()): boolean {
  const at = Number(response.headers.get(AT_HEADER));
  return at > 0 && now - at < MAX_AGE_MS;
}

export async function findCachedPage(
  pathname: string,
): Promise<Response | null> {
  if (typeof caches === "undefined") return null;
  const key = location.origin + normalizePath(pathname);
  try {
    for (const name of await caches.keys()) {
      if (!name.startsWith(PAGE_CACHE_PREFIX)) continue;
      const response = await (await caches.open(name)).match(key);
      if (response && isFresh(response)) return response;
    }
  } catch {}
  return null;
}

export function syncOfflineUi(): void {
  const offline = !navigator.onLine;
  document.documentElement.toggleAttribute("data-offline", offline);

  document.querySelectorAll<HTMLElement>(".note-action-btn").forEach((link) => {
    if (offline) {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
    } else {
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
    }
  });

  document
    .querySelectorAll<HTMLButtonElement>(".note-feedback-btn")
    .forEach((button) => {
      button.disabled = offline;
      if (offline) button.title = "Voting needs a connection";
      else button.removeAttribute("title");
    });
}

export function hideUpdateToast(): void {
  document.getElementById("sn-update-toast")?.setAttribute("hidden", "");
}

export function showUpdateToast(): void {
  document.getElementById("sn-update-toast")?.removeAttribute("hidden");
}

// Asks the worker to store the page on screen. A soft navigation never
// reaches the worker as a navigation, so this is how those pages get saved.
async function requestCache(
  registration: ServiceWorkerRegistration,
  message: { page?: string; assets?: string[] },
): Promise<boolean> {
  const worker = registration.active;
  if (!worker) return false;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), 10_000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data === true);
    };
    worker.postMessage({ type: "sn:cache-urls", ...message }, [channel.port2]);
  });
}

// Resolves true when the worker refreshed this page behind the copy that was
// just shown. Also clears the pending update.
async function takeUpdate(): Promise<boolean> {
  const worker = navigator.serviceWorker?.controller;
  if (!worker) return false;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), 2_000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data === true);
    };
    worker.postMessage(
      { type: "sn:take-update", page: normalizePath(location.pathname) },
      [channel.port2],
    );
  });
}

// Runs on load and after every soft navigation.
export async function initOfflineStatus(): Promise<void> {
  syncOfflineUi();

  const badge = document.querySelector<HTMLElement>("[data-offline-badge]");
  if (!badge) return;
  const path = location.pathname;

  if (await findCachedPage(path)) {
    if (location.pathname === path) badge.hidden = false;
    return;
  }
  if (!navigator.onLine || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    if (await requestCache(registration, { page: path })) {
      if (location.pathname === path) badge.hidden = false;
    }
  } catch {}
}

function listenForUpdates(): void {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "sn:updated") return;
    if (normalizePath(location.pathname) === event.data.url) showUpdateToast();
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-update-reload]")) {
      takeUpdate().then(() => location.reload());
    } else if (target?.closest("[data-update-dismiss]")) {
      hideUpdateToast();
      takeUpdate();
    } else if (target?.closest(".note-action-btn[aria-disabled='true']")) {
      event.preventDefault();
    }
  });
}

async function register(): Promise<void> {
  const controlled = Boolean(navigator.serviceWorker.controller);
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  if (!controlled) {
    // Whatever loaded before the worker took control was never seen by it.
    const assets = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name);
    await requestCache(registration, { page: location.pathname, assets });
  } else if (await takeUpdate()) {
    showUpdateToast();
  }
  await initOfflineStatus();
}

export function initOffline(): void {
  syncOfflineUi();
  window.addEventListener("offline", syncOfflineUi);
  window.addEventListener("online", () => {
    syncOfflineUi();
    navigator.serviceWorker?.controller?.postMessage({ type: "sn:online" });
  });

  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  listenForUpdates();
  window.addEventListener("load", () => {
    register().catch(() => {});
  });
}
