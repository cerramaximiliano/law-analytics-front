import { lazy, ComponentType, LazyExoticComponent } from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Refresh, CloudCross } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

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
					const theme = useTheme();
					const isDark = theme.palette.mode === "dark";
					const errorColor = theme.palette.error.main;

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
								py: { xs: 4, md: 6 },
								px: { xs: 2, md: 3 },
								minHeight: 360,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								position: "relative",
								overflow: "hidden",
							}}
						>
							{/* Atmospheric brand backdrop */}
							<Box
								sx={{
									position: "absolute",
									inset: 0,
									pointerEvents: "none",
									background: `radial-gradient(circle at 50% 30%, ${alpha(errorColor, isDark ? 0.12 : 0.06)} 0%, transparent 60%)`,
								}}
							/>
							<Box
								sx={{
									position: "relative",
									width: "100%",
									maxWidth: 480,
									p: { xs: 3, md: 4 },
									borderRadius: 2,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.025),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
								}}
							>
								<Stack spacing={2.5} alignItems="center">
									{/* Icon ring — destructive sober */}
									<Box
										sx={{
											width: 64,
											height: 64,
											borderRadius: 1.5,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
											border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.2)}`,
											color: errorColor,
										}}
									>
										<CloudCross size={28} variant="Bulk" />
									</Box>

									{/* Eyebrow + title + body */}
									<Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
										<Stack direction="row" spacing={0.625} alignItems="center">
											<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: errorColor }} />
											<Typography
												sx={{
													fontSize: "0.6rem",
													fontWeight: 600,
													letterSpacing: "0.08em",
													textTransform: "uppercase",
													color: "text.secondary",
												}}
											>
												No pudimos cargar
											</Typography>
										</Stack>
										<Typography
											sx={{
												fontSize: { xs: "1.1rem", md: "1.2rem" },
												fontWeight: 600,
												letterSpacing: "-0.015em",
												color: "text.primary",
												textWrap: "balance" as any,
											}}
										>
											Error al cargar el contenido
										</Typography>
										<Typography
											sx={{
												fontSize: "0.85rem",
												color: "text.secondary",
												letterSpacing: "-0.005em",
												lineHeight: 1.5,
												textWrap: "pretty" as any,
												maxWidth: 380,
											}}
										>
											Puede ser un problema temporal de conexión, o que el contenido se haya actualizado hace poco. Recargá la página para
											volver a intentarlo.
										</Typography>
									</Stack>

									{/* Button sober brand */}
									<Button
										onClick={handleReload}
										variant="contained"
										startIcon={<Refresh size={18} variant="Bulk" />}
										sx={{
											mt: 0.5,
											textTransform: "none",
											fontWeight: 600,
											letterSpacing: "-0.005em",
											bgcolor: BRAND_BLUE,
											color: "#fff",
											borderRadius: 1.25,
											px: 2.5,
											py: 1,
											boxShadow: "none",
											"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
										}}
									>
										Recargar página
									</Button>
								</Stack>
							</Box>
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
