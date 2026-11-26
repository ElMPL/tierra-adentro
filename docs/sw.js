// Guarda Tierra Adentro en el celular para jugar sin internet y lo actualiza solo.
// La versión (4b92272d1f) cambia en cada compilación: eso hace que el navegador baje la nueva.
const V = '4b92272d1f', C = 'ta-' + V, FILES = ['./game.js?v=' + V, './app.js?v=' + V];
const FONTS = /(^|\.)fonts\.(googleapis|gstatic)\.com$/;

self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(C);
  // index.html con ?v= para no recibir una copia vieja de la caché de GitHub
  const idx = await fetch('./index.html?v=' + V, {cache: 'reload'});
  if (!idx.ok || !(await idx.clone().text()).includes('v=' + V)) throw new Error('index.html todavía no está actualizado');
  await c.put('./index.html', idx.clone());
  await c.put('./', idx);
  await c.addAll(FILES.map(u => new Request(u, {cache: 'reload'})));
  // conservar las tipografías ya bajadas
  for (const k of await caches.keys()) {
    if (!k.startsWith('ta-') || k === C) continue;
    const o = await caches.open(k);
    for (const q of await o.keys()) if (FONTS.test(new URL(q.url).hostname)) { const m = await o.match(q); if (m) await c.put(q, m); }
  }
  await self.skipWaiting();
})()));

self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('ta-') && k !== C) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url), mine = u.origin === location.origin;
  if (mine && u.pathname.endsWith('/version.json')) return;
  if (!mine && !FONTS.test(u.hostname)) return;
  e.respondWith((async () => {
    const c = await caches.open(C);
    if (r.mode === 'navigate') { const hit = await c.match('./index.html'); if (hit) return hit; return fetch(r); }
    const hit = await c.match(r);
    if (hit) return hit;
    const res = await fetch(r);
    if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()).catch(() => {});
    return res;
  })());
});
