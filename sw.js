const CACHE_NAME = "checklist-cdc-v2";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const ehPagina = event.request.mode === "navigate" || event.request.destination === "document";

  if (ehPagina) {
    // HTML: sempre busca a versão mais nova primeiro (evita ficar preso em cache antigo)
    event.respondWith(
      fetch(event.request)
        .then((networkResp) => {
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // demais arquivos (ícones, manifest): cache primeiro, com atualização em segundo plano
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return (
        resp ||
        fetch(event.request)
          .then((networkResp) => {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return networkResp;
          })
          .catch(() => resp)
      );
    })
  );
});
