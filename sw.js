// Ryan Golf Log — 오프라인용 서비스 워커
const CACHE = 'rgl-v8.10';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './qr.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // 새 버전이 있으면 받아오고, 와이파이가 없거나 느리면(4초) 저장된 앱을 바로 연다
    e.respondWith((async () => {
      const cached = await caches.match('./index.html');
      const net = fetch(req).then(r => {
        if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); }
        return r;
      });
      if (!cached) return net;
      const timeout = new Promise(res => setTimeout(() => res(cached), 4000));
      return Promise.race([net.catch(() => cached), timeout]);
    })());
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return res;
  })));
});
