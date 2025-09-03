// Utilidad para manejo de caché específico en dispositivos móviles
import { isMobile } from "react-device-detect";

// Detectar si es iOS o Android
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/.test(navigator.userAgent);

// Función para detectar si el navegador es PWA
const isPWA = (): boolean => {
	return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
};

// Limpiar caché del navegador en móviles
export const clearMobileCache = async (): Promise<void> => {
	try {
		// Limpiar todos los cachés del Service Worker
		if ("caches" in window) {
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map((name) => caches.delete(name)));
			console.log("Caché del navegador limpiado");
		}

		// Desregistrar todos los Service Workers
		if ("serviceWorker" in navigator) {
			const registrations = await navigator.serviceWorker.getRegistrations();
			await Promise.all(registrations.map((reg) => reg.unregister()));
			console.log("Service Workers desregistrados");
		}

		// Limpiar localStorage y sessionStorage
		localStorage.clear();
		sessionStorage.clear();
		console.log("Almacenamiento local limpiado");

		// En iOS, forzar recarga completa
		if (isIOS) {
			// iOS requiere un enfoque especial para limpiar caché
			window.location.href = window.location.href + "?t=" + Date.now();
		} else {
			// En Android y otros, recargar normalmente
			window.location.reload();
		}
	} catch (error) {
		console.error("Error limpiando caché móvil:", error);
		// Fallback: recargar página con timestamp
		window.location.href = window.location.href + "?t=" + Date.now();
	}
};

// Función para detectar versión obsoleta en móviles
export const checkMobileVersion = async (): Promise<boolean> => {
	if (!isMobile) return false;

	try {
		// Verificar versión del manifest
		const response = await fetch("/manifest.json?t=" + Date.now(), {
			cache: "no-cache",
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
			},
		});

		if (response.ok) {
			const manifest = await response.json();
			const storedVersion = localStorage.getItem("app_version");

			if (manifest.version && storedVersion && manifest.version !== storedVersion) {
				console.log(`Nueva versión detectada en móvil: ${manifest.version}`);
				localStorage.setItem("app_version", manifest.version);
				return true;
			}

			// Guardar versión inicial si no existe
			if (manifest.version && !storedVersion) {
				localStorage.setItem("app_version", manifest.version);
			}
		}
	} catch (error) {
		console.error("Error verificando versión móvil:", error);
	}

	return false;
};

// Auto-actualización para móviles
export const initMobileAutoUpdate = (): void => {
	if (!isMobile) return;

	// Verificar actualizaciones cada 5 minutos en móviles
	setInterval(async () => {
		const needsUpdate = await checkMobileVersion();
		if (needsUpdate) {
			console.log("Actualizando aplicación móvil...");
			await clearMobileCache();
		}
	}, 5 * 60 * 1000);

	// En PWAs, escuchar eventos de actualización
	if (isPWA()) {
		window.addEventListener("focus", async () => {
			// Cuando la app vuelve al foco, verificar actualizaciones
			const needsUpdate = await checkMobileVersion();
			if (needsUpdate) {
				await clearMobileCache();
			}
		});
	}

	// Manejar el evento beforeinstallprompt para PWAs
	window.addEventListener("beforeinstallprompt", (e: any) => {
		console.log("PWA puede ser instalada");
		// Guardar el evento para usarlo después si es necesario
		localStorage.setItem("pwa_installable", "true");
	});
};

// Función para forzar actualización manual en móviles
export const forceMobileUpdate = async (): Promise<void> => {
	if (isMobile) {
		console.log("Forzando actualización en dispositivo móvil");
		await clearMobileCache();
	} else {
		// En desktop, solo recargar
		window.location.reload();
	}
};
