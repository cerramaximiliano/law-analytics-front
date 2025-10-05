// Service Worker deshabilitado
// Este archivo des-registra el Service Worker si estaba previamente registrado

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					return caches.delete(cacheName);
				}),
			);
		}),
	);
	self.registration.unregister().then(() => {
		console.log("Service Worker des-registrado");
	});
});
