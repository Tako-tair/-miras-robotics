/* Miras 2.8: offline support. Change VERSION after every update of the site. */
const VERSION = 'miras28-v19';
const CORE = ['./', './index.html', './team.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './og-image.jpg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('open-meteo.com') || url.hostname.endsWith('formspree.io')) return; /* live data: always from the network */
  if (req.mode === 'navigate') { /* pages: fresh copy when online, saved copy of the same page when offline */
    e.respondWith(fetch(req).then(res => {
      if (res.ok && url.origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  const cacheable = url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (!cacheable) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
