/* Service worker de Versaluz: deja usar la app sin conexión.
 *
 * - Al instalarse lee el index.html publicado y guarda los archivos que usa (JS, CSS, iconos).
 *   Así no hace falta conocer los nombres con hash que genera Vite.
 * - Las páginas se piden primero a la red y, si no hay conexión, salen de la copia guardada.
 * - Archivos y fuentes: se sirve la copia guardada y se actualiza en segundo plano.
 * - El texto de la Biblia no pasa por aquí: la app lo guarda aparte en IndexedDB.
 *
 * Si cambias algo y quieres forzar que todos descarten lo guardado, sube el número de CACHE.
 */
const CACHE = 'versaluz-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const SCOPE = self.registration.scope; // termina en "/"

const cacheable = (res) => res && (res.ok || res.type === 'opaque');

async function precache() {
  const cache = await caches.open(CACHE);
  const urls = new Set([
    new URL('manifest.webmanifest', SCOPE).href,
    new URL('icons/icon-192.png', SCOPE).href,
    new URL('icons/icon-512.png', SCOPE).href,
    new URL('icons/icon.svg', SCOPE).href,
  ]);

  // La página principal, y de ahí los archivos que carga
  try {
    const res = await fetch(SCOPE, { cache: 'reload' });
    if (res.ok) {
      const html = await res.clone().text();
      for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
        let u;
        try { u = new URL(m[1], SCOPE); } catch { continue; }
        if (u.origin === self.location.origin) urls.add(u.href);
      }
      await cache.put(SCOPE, res);
    }
  } catch { /* sin red al instalar: se guardará en la primera visita */ }

  // Se guarda uno por uno: si un archivo falla, los demás igual quedan
  await Promise.all([...urls].map((u) => cache.add(u).catch(() => {})));

  // Quita de versiones anteriores los archivos con hash que ya no usa el index.html
  for (const req of await cache.keys()) {
    const u = new URL(req.url);
    if (u.origin === self.location.origin && u.pathname.includes('/assets/') && !urls.has(u.href)) {
      await cache.delete(req);
    }
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (cacheable(res)) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match(SCOPE)) || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const update = fetch(req).then((res) => {
    if (cacheable(res)) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (cached) { update.catch(() => {}); return cached; }
  return (await update) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return; // GitHub y demás, directo a la red
  if (req.mode === 'navigate') e.respondWith(networkFirst(req));
  else e.respondWith(staleWhileRevalidate(req));
});
