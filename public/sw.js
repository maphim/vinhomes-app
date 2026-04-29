// Service Worker for Vinhomes PWA
const CACHE_NAME = "vinhomes-cache-v1";
const urlsToCache = [
  "/",
  "/login",
  "/offline",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache first, fallback to network, offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        return caches.match("/offline");
      });
    })
  );
});
