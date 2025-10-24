import { lazy, ComponentType, LazyExoticComponent } from "react";
import { Box, Button, Stack, Typography, Alert, AlertTitle } from "@mui/material";
import { Refresh, Global } from "iconsax-react";

// Sistema robusto de lazy loading con reintentos para móviles
// Resuelve el problema de chunks que fallan después de actualizaciones

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 1000;

// Cache de módulos ya cargados para evitar recargas innecesarias
const loadedModules = new Set<string>();

export function lazyRetry<T extends ComponentType<any>>(
	componentImport: () => Promise<{ default: T }>,
	componentName?: string,
): LazyExoticComponent<T> {
	return lazy(async () => {
		const moduleName = componentName || componentImport.toString();

		// Si ya se cargó este módulo, intentar cargarlo directamente
		if (loadedModules.has(moduleName)) {
			try {
				const module = await componentImport();
				return module;
			} catch (error) {
				// Si falla, eliminar del cache y continuar con reintentos
				loadedModules.delete(moduleName);
			}
		}

		let retryCount = 0;

		const tryImport = async (): Promise<{ default: T }> => {
			try {
				const module = await componentImport();

				// Marcar como cargado exitosamente
				loadedModules.add(moduleName);

				// Limpiar flag de recarga si existe
				const refreshKey = "page_refresh_" + moduleName;
				sessionStorage.removeItem(refreshKey);

				return module;
			} catch (error: any) {
				const isChunkError =
					error?.message?.includes("Failed to fetch dynamically imported module") ||
					error?.message?.includes("Loading chunk") ||
					error?.message?.includes("ChunkLoadError") ||
					error?.message?.includes("Failed to import") ||
					error?.name === "ChunkLoadError";

				if (isChunkError && retryCount < MAX_RETRY_COUNT) {
					retryCount++;
					console.log(`[LazyRetry] Intento ${retryCount}/${MAX_RETRY_COUNT} para ${componentName || "componente"}`);

					// En móviles, dar más tiempo entre reintentos
					const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
					const delay = isMobile ? RETRY_DELAY * 2 : RETRY_DELAY;

					// Esperar antes de reintentar
					await new Promise((resolve) => setTimeout(resolve, delay));

					// Si es el último intento, limpiar caché
					if (retryCount === MAX_RETRY_COUNT) {
						const refreshKey = "page_refresh_" + moduleName;
						const hasRefreshed = sessionStorage.getItem(refreshKey) === "true";

						if (!hasRefreshed && isMobile) {
							console.log("[LazyRetry] Último intento - limpiando caché y recargando...");
							sessionStorage.setItem(refreshKey, "true");

							// Limpiar caché del Service Worker
							if ("caches" in window) {
								const cacheNames = await caches.keys();
								await Promise.all(cacheNames.map((name) => caches.delete(name)));
							}

							// Forzar recarga completa
							const url = new URL(window.location.href);
							url.searchParams.set("_retry", Date.now().toString());
							window.location.href = url.toString();

							// Retornar componente vacío mientras recarga
							return { default: (() => null) as unknown as T };
						}
					}

					// Reintentar
					return tryImport();
				}

				// Si no es error de chunk o se acabaron los reintentos
				console.error(`[LazyRetry] Error cargando ${componentName || "componente"}:`, error);

				// Retornar componente de error con botón de recarga
				const ErrorComponent = (() => {
					const handleReload = () => {
						// Limpiar cache y recargar
						if ("caches" in window) {
							caches.keys().then((names) => {
								Promise.all(names.map((name) => caches.delete(name))).then(() => {
									(window as Window).location.reload();
								});
							});
						} else {
							(window as Window).location.reload();
						}
					};

					return (
						<Box
							sx={{
								py: { xs: 3, md: 5 },
								px: { xs: 2, md: 3 },
								minHeight: "300px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Stack spacing={{ xs: 2, sm: 3 }} alignItems="center" sx={{ maxWidth: { xs: 600, md: 800 }, width: "100%" }}>
								<Box sx={{ opacity: 0.5 }}>
									<Global size={48} color="#d32f2f" />
								</Box>

								<Alert severity="error" sx={{ width: "100%" }}>
									<AlertTitle sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>Error al cargar el contenido</AlertTitle>
									<Typography variant="body2" sx={{ fontSize: { xs: "0.875rem", md: "1rem" } }}>
										No pudimos cargar esta página. Puede deberse a un problema temporal de conexión o a que el contenido fue actualizado
										recientemente. Por favor, intenta recargar la página.
									</Typography>
								</Alert>

								<Button variant="contained" color="primary" startIcon={<Refresh />} onClick={handleReload} size="large">
									Recargar página
								</Button>
							</Stack>
						</Box>
					);
				}) as unknown as T;

				return { default: ErrorComponent };
			}
		};

		return tryImport();
	});
}

// Función para prelanzar módulos críticos en segundo plano
export const preloadCriticalRoutes = () => {
	// Lista de rutas críticas que se usan frecuentemente
	const criticalRoutes = [
		() => import("pages/dashboard/default"),
		() => import("pages/apps/folders/folders"),
		() => import("pages/calculator/all/index"),
	];

	// Precargar en segundo plano después de que la app principal cargue
	setTimeout(() => {
		criticalRoutes.forEach((route) => {
			route().catch(() => {
				// Ignorar errores de precarga
			});
		});
	}, 5000);
};
