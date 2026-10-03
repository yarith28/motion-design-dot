const VERSION = "kitchen-cats-20261003-r33-original-cats";
const PREFIX = "kitchen-cats-";
const CACHE = VERSION + "-precache";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./assets/ui-3d/ui-theme.css",
  "./app.js",
  "./presentation-animation.js",
  "./game-core.js",
  "./multiplayer-session.js",
  "./webrtc-transport.js",
  "./qr-pairing.js",
  "./vendor/qrcode-generator.js",
  "./vendor/jsqr.js",
  "./vendor/qr-scanner.min.js",
  "./vendor/qr-scanner-worker.min.js",
  "./vendor/THIRD-PARTY-LICENSES.txt",
  "./manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/cat-cream.png",
  "./assets/cat-tabby.png",
  "./assets/cat-gray.png",
  "./assets/cat-tuxedo.png",
  "./assets/chef2d-manifest.json",
  "./assets/chef2d-cream-atlas.webp",
  "./assets/chef2d-tabby-atlas.webp",
  "./assets/chef2d-gray-atlas.webp",
  "./assets/chef2d-tuxedo-atlas.webp",
  "./assets/world-3d/manifest.json",
  "./assets/world-3d/room-1000x470@2x.png",
  "./assets/world-3d/station-atlas.png",
  "./assets/world-3d/food-atlas.png",
  "./assets/world-3d/local-marker.png",
  "./assets/ui-3d/action-disc-pressed.png",
  "./assets/ui-3d/action-disc.png",
  "./assets/ui-3d/avatar-plate-selected.png",
  "./assets/ui-3d/avatar-plate.png",
  "./assets/ui-3d/button-coral-pressed.png",
  "./assets/ui-3d/button-coral.png",
  "./assets/ui-3d/button-cream-pressed.png",
  "./assets/ui-3d/button-cream.png",
  "./assets/ui-3d/button-disabled.png",
  "./assets/ui-3d/button-icon-tile.png",
  "./assets/ui-3d/button-sage-pressed.png",
  "./assets/ui-3d/button-sage.png",
  "./assets/ui-3d/effect-bubble.png",
  "./assets/ui-3d/effect-sparkle.png",
  "./assets/ui-3d/effect-station-halo.png",
  "./assets/ui-3d/effect-steam.png",
  "./assets/ui-3d/help-pick.png",
  "./assets/ui-3d/help-prep.png",
  "./assets/ui-3d/help-serve.png",
  "./assets/ui-3d/help-simmer.png",
  "./assets/ui-3d/hero-kitchen.png",
  "./assets/ui-3d/hud-ribbon.png",
  "./assets/ui-3d/icon-camera.png",
  "./assets/ui-3d/icon-carrot.png",
  "./assets/ui-3d/icon-clock.png",
  "./assets/ui-3d/icon-fullscreen-exit.png",
  "./assets/ui-3d/icon-fullscreen.png",
  "./assets/ui-3d/icon-help.png",
  "./assets/ui-3d/icon-leave.png",
  "./assets/ui-3d/icon-motion-off.png",
  "./assets/ui-3d/icon-motion.png",
  "./assets/ui-3d/icon-paw.png",
  "./assets/ui-3d/icon-qr.png",
  "./assets/ui-3d/icon-ready.png",
  "./assets/ui-3d/icon-score.png",
  "./assets/ui-3d/icon-sound-off.png",
  "./assets/ui-3d/icon-sound.png",
  "./assets/ui-3d/icon-tomato.png",
  "./assets/ui-3d/icon-urgent.png",
  "./assets/ui-3d/joystick-base.png",
  "./assets/ui-3d/joystick-knob.png",
  "./assets/ui-3d/order-card-urgent.png",
  "./assets/ui-3d/order-card.png",
  "./assets/ui-3d/panel-cream.png",
  "./assets/ui-3d/panel-sage.png",
  "./assets/ui-3d/progress-fill-coral.png",
  "./assets/ui-3d/progress-fill-gold.png",
  "./assets/ui-3d/progress-fill-sage.png",
  "./assets/ui-3d/progress-track.png",
  "./assets/ui-3d/result-soup-trophy.png",
  "./assets/ui-3d/status-badge.png",
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
