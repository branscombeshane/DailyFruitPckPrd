// Minimal service worker whose ONLY job is making the app installable and
// giving it a shell to open into when the device is briefly offline. It
// deliberately does NOT cache anything from the Apps Script API (a different
// origin entirely, and the whole point of this app is showing live order
// data - caching that would mean packers seeing stale orders, which is far
// worse than the install feature being missing). Same approach already used
// on the Dispatch system's own PWA setup.
//
// Bump CACHE_NAME any time the list of shell files below changes so old
// installs pick up the new set instead of serving a stale mix forever.
const CACHE_NAME = 'df-packing-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only ever handle GETs for this app's own shell files. Everything else -
  // every Apps Script API call (a different origin), any POST, any request
  // this list doesn't know about - is left completely untouched and goes
  // straight to the network exactly as if this service worker didn't exist.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network-first: always try to fetch the real, current file first (so a
  // deployed update shows up on the very next load, not "eventually"), and
  // only fall back to whatever's cached if the network is genuinely
  // unreachable (offline, or the device just lost signal).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
