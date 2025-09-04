import { useEffect } from "react";

// Componente para manejar errores de chunks globalmente
const ChunkErrorHandler = () => {
	useEffect(() => {
		// Interceptar errores de chunks a nivel global
		const handleError = (event: ErrorEvent) => {
			const error = event.error;
			
			// Detectar errores de chunks faltantes
			if (
				error?.message?.includes("Failed to fetch dynamically imported module") ||
				error?.message?.includes("Failed to import") ||
				error?.message?.includes("Loading chunk") ||
				error?.message?.includes("ChunkLoadError")
			) {
				console.error("Error de chunk detectado:", error.message);
				event.preventDefault(); // Prevenir que se muestre en consola
				
				// Mostrar mensaje y recargar
				const shouldReload = window.confirm(
					"Se detectó una actualización de la aplicación. ¿Deseas recargar ahora?"
				);
				
				if (shouldReload) {
					// Limpiar caché y recargar
					if ("caches" in window) {
						caches.keys().then(names => {
							Promise.all(names.map(name => caches.delete(name))).then(() => {
								window.location.reload();
							});
						});
					} else {
						window.location.reload();
					}
				}
			}
		};

		// Interceptar promesas rechazadas (lazy loading failures)
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const reason = event.reason;
			
			if (
				reason?.message?.includes("Failed to fetch dynamically imported module") ||
				reason?.message?.includes("Loading CSS chunk") ||
				reason?.message?.includes("Loading chunk")
			) {
				console.error("Error de lazy loading:", reason);
				event.preventDefault();
				
				// Auto-recargar sin preguntar en móviles
				const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
				
				if (isMobile) {
					console.log("Dispositivo móvil detectado, recargando automáticamente...");
					setTimeout(() => {
						window.location.reload();
					}, 1500);
				} else {
					// En desktop, preguntar
					const shouldReload = window.confirm(
						"Error al cargar recursos. ¿Deseas recargar la página?"
					);
					if (shouldReload) {
						window.location.reload();
					}
				}
			}
		};

		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handleUnhandledRejection);

		return () => {
			window.removeEventListener("error", handleError);
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
		};
	}, []);

	return null;
};

export default ChunkErrorHandler;