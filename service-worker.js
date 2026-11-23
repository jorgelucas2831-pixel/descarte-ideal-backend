/* Descarte Ideal PWA
   Network-only by design: no pages, API responses, user records or documents
   are cached on the device. This preserves live authentication and data access.
*/
const PWA_CACHE_PREFIX = 'descarte-ideal-';
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PWA_CACHE_PREFIX)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Always use the network. Do not cache authenticated application content.
  event.respondWith(fetch(request));
});