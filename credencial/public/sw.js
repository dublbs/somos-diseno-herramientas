// Service worker de la credencial: recibe los avisos (Web Push) y abre la app al tocarlos (plan 007).
// No guarda archivos en caché a propósito: el hub publica dist/ versionado y una caché vieja mostraría una app vieja.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let datos = { titulo: 'Somos Diseño', cuerpo: '', url: undefined };
  try { datos = { ...datos, ...e.data.json() }; } catch { datos.cuerpo = e.data ? e.data.text() : ''; }
  e.waitUntil(self.registration.showNotification(datos.titulo, {
    body: datos.cuerpo,
    icon: './icono.svg',
    badge: './icono.svg',
    data: { url: datos.url || './' },
    tag: 'somos-diseno',
    renotify: true,
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
    const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
    if (abierta) { abierta.navigate(destino); return abierta.focus(); }
    return self.clients.openWindow(destino);
  }));
});
