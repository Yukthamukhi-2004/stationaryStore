/* ── Stationery Store Image Cache Service Worker ──
 * Caches product images from picsum.photos so they load
 * instantly on repeat visits and work offline.
 */

const CACHE_NAME = "stationery-images-v1";

// Only cache picsum.photos images — nothing else
const IMAGE_ORIGIN = "https://picsum.photos";

self.addEventListener("install", () => {
  // Activate immediately — don't wait for old SW to close
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clean up any old caches from previous versions
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  // Take control of all pages immediately
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle picsum.photos image requests
  if (
    !request.url.startsWith(IMAGE_ORIGIN) ||
    request.method !== "GET" ||
    !request.destination.startsWith("image")
  ) {
    return;
  }

  console.log("SW intercepting:", request.url);
  event.respondWith(cacheFirst(request));
});

/**
 * Cache-first strategy:
 * 1. Try to serve from cache (instant on repeat visits)
 * 2. If not cached, fetch from network and cache for next time
 * 3. If network fails (offline), serve stale cache as fallback
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    console.log("SW cache HIT:", request.url);
    return cached;
  }

  console.log("SW cache MISS, fetching:", request.url);
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    // Cache successful same-origin (status 200) or cross-origin
    // <img> requests (opaque — status 0) alike
    if (response.status === 200 || response.type === "opaque") {
      cache.put(request, response.clone());
      console.log("SW cached:", request.url);
    } else {
      console.log("SW skip cache (not ok/opaque):", request.url, response.status, response.type);
    }
    return response;
  } catch (err) {
    // Network failed — try cache one more time as last resort
    const fallback = await caches.match(request);
    if (fallback) {
      console.log("SW fallback to cache:", request.url);
      return fallback;
    }
    console.log("SW network failed, no cache:", request.url);
    throw err;
  }
}
