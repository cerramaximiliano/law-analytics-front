import { lazy, ComponentType, LazyExoticComponent } from "react";

// Función mejorada para lazy loading con reintentos
export function lazyWithRetry<T extends ComponentType<any>>(
	componentImport: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
	return lazy(async () => {
		const pageHasAlreadyBeenForceRefreshed = JSON.parse(
			window.sessionStorage.getItem("page_has_been_force_refreshed") || "false"
		);

		try {
			const component = await componentImport();
			window.sessionStorage.setItem("page_has_been_force_refreshed", "false");
			return component;
		} catch (error: any) {
			// Detectar errores de chunks
			const isChunkError = 
				error?.message?.includes("Failed to fetch dynamically imported module") ||
				error?.message?.includes("Loading chunk") ||
				error?.message?.includes("ChunkLoadError") ||
				error?.name === "ChunkLoadError";

			if (!pageHasAlreadyBeenForceRefreshed && isChunkError) {
				// Marcar que ya intentamos recargar
				window.sessionStorage.setItem("page_has_been_force_refreshed", "true");
				
				// En móviles, limpiar caché antes de recargar
				const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
				
				if (isMobile && "caches" in window) {
					// Limpiar caché del Service Worker
					const cacheNames = await caches.keys();
					await Promise.all(cacheNames.map(name => caches.delete(name)));
					console.log("Caché limpiado en dispositivo móvil");
				}
				
				// Forzar recarga con timestamp para evitar caché
				const url = new URL(window.location.href);
				url.searchParams.set("_retry", Date.now().toString());
				window.location.href = url.toString();
				
				// Retornar un componente vacío mientras recarga
				return { default: (() => null) as T };
			}

			// Si ya intentamos recargar o no es error de chunk, mostrar error
			console.error("Error cargando componente:", error);
			
			// Retornar componente de error
			const ErrorComponent = (() => (
				<div style={{ 
					padding: "20px", 
					textAlign: "center",
					minHeight: "200px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center"
				}}>
					<h3>Error al cargar la página</h3>
					<p>Por favor, recarga la página</p>
					<button 
						onClick={() => window.location.reload()}
						style={{
							padding: "10px 20px",
							marginTop: "10px",
							background: "#1976d2",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer"
						}}
					>
						Recargar
					</button>
				</div>
			)) as T;

			return { default: ErrorComponent };
		}
	});
}