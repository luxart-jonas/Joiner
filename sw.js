// Joiner — minimal service worker.
// Caches the app shell so it opens even offline; always tries the network
// first for the HTML itself so you get updates, falls back to cache offline.
const CACHE_NAME = 'joiner-shell-v1';
const SHELL_FILES = [
  './joiner.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // never intercept POST/PUT etc.

  event.respondWith(
    fetch(req)
      .then(res => {
        // keep the shell fresh in the background
        if (res && res.ok && SHELL_FILES.some(f => req.url.endsWith(f.replace('./','')))){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
