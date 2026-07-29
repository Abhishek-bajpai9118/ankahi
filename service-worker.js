/* ==========================================================================
   ANKAHI — service-worker.js
   Caches the app shell for offline/installable use.
   Bump CACHE_NAME whenever you change core files to force an update.
   ========================================================================== */

const CACHE_NAME = "ankahi-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./css/dark.css",
  "./css/admin.css",
  "./js/firebase.js",
  "./js/theme.js",
  "./js/categories.js",
  "./js/auth.js",
  "./js/stories.js",
  "./js/likes.js",
  "./js/comments.js",
  "./js/search.js",
  "./js/ai.js",
  "./js/admin.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache Firebase/API calls — always go to network for live data.
  if (url.hostname.includes("firebaseio.com") ||
      url.hostname.includes("googleapis.com") ||
      url.hostname.includes("firebasestorage") ||
      url.hostname.includes("gstatic.com") ||
      event.request.method !== "GET"){
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200){
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
