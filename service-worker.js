// Service worker mínimo — existe só pra permitir que o Chrome/Android
// ofereça "Instalar app". Não faz cache agressivo pra nunca travar
// o usuário numa versão antiga do site.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // apenas repassa a requisição direto pra rede (sem cache offline por enquanto)
  event.respondWith(fetch(event.request));
});
