const VERSION = "kitchen-cats-20261002-r14-qr";
const PREFIX = "kitchen-cats-";
const CACHE = VERSION + "-precache";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./presentation-animation.js",
  "./game-core.js",
  "./multiplayer-session.js",
  "./webrtc-transport.js",
  "./qr-pairing.js",
  "./vendor/qrcode-generator.js",
  "./vendor/qr-scanner.min.js",
  "./vendor/qr-scanner-worker.min.js",
  "./vendor/THIRD-PARTY-LICENSES.txt",
  "./manifest.json",
  "./assets/cat-tabby.png",
  "./assets/title-illustration.png",
  "./assets/cat-gray.png",
  "./assets/cat-tuxedo.png",
  "./assets/cat-cream.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/cream-chef-pose-atlas.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      // Fetch everything before exposing the new cache. A failed install cannot
      // leave a partial cache that looks like an offline download.
      const entries = await Promise.all(
        ASSETS.map(async (path) => {
          const url = new URL(path, self.registration.scope).href;
          const response = await fetch(new Request(url, { cache: "reload" }));
          if (!response.ok) throw Error("Offline download failed: " + path);
          return [url, response];
        }),
      );
      const cache = await caches.open(CACHE);
      try {
        await Promise.all(
          entries.map(([url, response]) => cache.put(url, response)),
        );
      } catch (e) {
        await caches.delete(CACHE);
        throw e;
      }
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    !url.href.startsWith(self.registration.scope)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        return await fetch(event.request);
      } catch (e) {
        if (event.request.mode === "navigate")
          return await cache.match(new URL("./", self.registration.scope).href);
        throw e;
      }
    })(),
  );
});
