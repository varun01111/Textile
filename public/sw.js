const CACHE_NAME = "textile-client-intelligence-v1";
const PRECACHE = ["/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/api") ||
    requestUrl.pathname.startsWith("/_next/") ||
    ["script", "style", "worker", "font"].includes(event.request.destination) ||
    event.request.destination === "document"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || !networkResponse.ok) {
            return networkResponse;
          }

          const responseCopy = networkResponse.clone();
          void caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy).catch(() => {});
          });

          return networkResponse;
        })
        .catch(() => cachedResponse);
    }),
  );
});
