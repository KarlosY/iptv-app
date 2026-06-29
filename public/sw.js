const CACHE_NAME = "ykar-iptv-v1";
const ASSETS = [
  "/",
  "/manifest.json",
  "/globe.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  // No almacenar flujos de video en caché para evitar llenado de memoria y errores CORS
  if (
    url.includes(".m3u8") || 
    url.includes(".ts") || 
    url.includes(".mp4") || 
    url.includes("/api/proxy") || 
    e.request.method !== "GET"
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => {
        // Fallback offline
        return caches.match("/");
      });
    })
  );
});
