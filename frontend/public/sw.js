/* ── Stationery Store Image Cache Service Worker ──
 * Caches product images so they load instantly on repeat
 * visits and work offline. Caches from both the old
 * placeholder service and Supabase Storage.
 */

const CACHE_NAME = "stationery-images-v2";

// Image origins we want to cache
const IMAGE_ORIGINS = [
  "https://picsum.photos",
  "https://placehold.co",
  "https://ukdeegsxgabnbxtctzgk.supabase.co",
];

function shouldCache(url) {
  return IMAGE_ORIGINS.some((origin) => url.startsWith(origin));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (
    !shouldCache(request.url) ||
    request.method !== "GET" ||
    !request.destination.startsWith("image")
  ) {
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    if (response.status === 200 || response.type === "opaque") {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const fallback = await caches.match(request);
    if (fallback) return fallback;
    throw err;
  }
}
