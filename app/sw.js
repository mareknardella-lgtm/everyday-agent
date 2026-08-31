const CACHE_NAME = "everyday-agent-shell-v2";
const SHELL = ["/", "/app/", "/app/index.html", "/app/styles.css", "/app/ops-overrides.css", "/app/simulation.css", "/app/app.js", "/app/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("/app/"))));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SCHEDULE_LOCAL_REMINDER") return;
  const { title = "Everyday Agent", body = "Hai una scadenza da controllare.", delayMs = 0, tag = "everyday-agent-reminder" } = event.data;
  const delay = Math.max(0, Math.min(Number(delayMs) || 0, 2147483647));
  setTimeout(() => self.registration.showNotification(title, { body, tag, icon: "/favicon.svg", badge: "/favicon.svg", silent: false }), delay);
});
