/*
 * Kill-switch service worker.
 *
 * Saaj Tradition does NOT use a service worker. However, an older build of this
 * site — or a different app once served from the same origin (e.g. localhost or
 * the production domain) — registered a service worker at /sw.js. Browsers keep
 * that registration and periodically re-fetch this URL to check for updates,
 * which is why the server logs show repeated `GET /sw.js`.
 *
 * This file exists only to clean that up: it unregisters itself, deletes any
 * caches the old worker left behind, and reloads open tabs so they run fully
 * worker-free. Once traffic stops requesting /sw.js, this file can be deleted.
 */
self.addEventListener("install", () => {
  // Activate immediately instead of waiting for existing tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop any caches the previous worker created.
      if (self.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      // Remove this registration so the browser stops polling /sw.js.
      await self.registration.unregister();

      // Reload any open tabs so they run without a service worker.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
