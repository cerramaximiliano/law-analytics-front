// Service Worker de limpieza - Des-registra y limpia inmediatamente
// Este SW reemplaza cualquier SW anterior y se auto-elimina

self.addEventListener("install", (event) => {
	// Saltar la espera y activarse inmediatamente
	self.skipWaiting();

	// Limpiar todos los caches
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					console.log("SW: Eliminando cache:", cacheName);
					return caches.delete(cacheName);
				}),
			);
		}),
	);
});

self.addEventListener("activate", (event) => {
	console.log("SW: Activando y des-registrando...");

	// Tomar control de todos los clientes inmediatamente
	event.waitUntil(
		Promise.all([
			// Limpiar todos los caches nuevamente
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => caches.delete(cacheName)),
				);
			}),
			// Tomar control de todos los clientes
			self.clients.claim(),
		]).then(() => {
			// Des-registrarse
			return self.registration.unregister();
		}).then(() => {
			console.log("SW: Des-registrado exitosamente");
			// Recargar todos los clientes para que obtengan la versión sin SW
			return self.clients.matchAll({ type: "window" });
		}).then((clients) => {
			clients.forEach((client) => {
				console.log("SW: Recargando cliente:", client.url);
				client.navigate(client.url);
			});
		}),
	);
});

// No cachear nada - pasar todas las peticiones directamente a la red
self.addEventListener("fetch", (event) => {
	// Simplemente devolver la petición de red sin cachear
	event.respondWith(fetch(event.request));
});
