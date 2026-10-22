/**
 * Descarga de la app Android desde la web (2026-10-22): aviso en las páginas públicas para
 * visitantes con Android y bloque en el pie con la insignia oficial de Google Play.
 *
 * Los links a Play Store llevan utm_source/utm_medium/utm_campaign: Play Console los muestra en
 * "Adquisición de usuarios" por fuente y campaña. Cada clic también va a GA4 (pushGTMEvent).
 */
import { pushGTMEvent } from "utils/gtm";

const PLAY_PACKAGE = "app.lawanalytics";

/** Dónde se hizo clic: es el `utm_medium` del link y el `placement` del evento de GA4. */
export type AppDownloadPlacement = "banner" | "footer" | "footer_qr" | "login" | "dashboard";

export const playStoreUrl = (placement: AppDownloadPlacement): string =>
	`https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}&utm_source=lawanalytics_web&utm_medium=${placement}&utm_campaign=app_download`;

/** Recursos en public/images/app: insignia oficial es-419 del generador de Google, ícono y QR. */
export const GOOGLE_PLAY_BADGE_SRC = "/images/app/google-play-badge-es-419.png";
export const APP_ICON_SRC = "/images/app/app-icon.png";
export const GOOGLE_PLAY_QR_SRC = "/images/app/google-play-qr.svg";
export const GOOGLE_PLAY_TRADEMARK = "Google Play y el logotipo de Google Play son marcas de Google LLC.";

export type DevicePlatform = "android" | "ios" | "desktop";

export function devicePlatform(): DevicePlatform {
	if (typeof navigator === "undefined") return "desktop";
	const ua = navigator.userAgent || "";
	if (/Android/i.test(ua)) return "android";
	// iPadOS se presenta como Mac: se distingue por la pantalla táctil.
	if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
	return "desktop";
}

// ---- Quién ya tiene la app y quién cerró el aviso (localStorage; si falla, se muestra) ----

const FROM_APP_KEY = "la.app.installedSeen";
const BANNER_DISMISSED_KEY = "la.app.bannerDismissedAt";
const BANNER_DISMISS_MS = 7 * 86_400_000;

const storage = {
	get(key: string): string | null {
		try {
			return window.localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	set(key: string, value: string): void {
		try {
			window.localStorage.setItem(key, value);
		} catch {
			/* modo privado o almacenamiento bloqueado: se ignora */
		}
	},
};

/**
 * La app abrió la web en este navegador (canje del traspaso de sesión, /handoff): quien llega así
 * ya tiene la app instalada, así que no se le ofrece descargarla.
 */
export const markOpenedFromApp = (): void => storage.set(FROM_APP_KEY, String(Date.now()));

/** El aviso de descarga corresponde: Android, sin haber llegado desde la app, sin cerrarlo hace < 7 días. */
export function shouldShowAppBanner(now = Date.now()): boolean {
	if (devicePlatform() !== "android") return false;
	if (storage.get(FROM_APP_KEY)) return false;
	const dismissedAt = Number(storage.get(BANNER_DISMISSED_KEY));
	return !(dismissedAt && now - dismissedAt < BANNER_DISMISS_MS);
}

export const dismissAppBanner = (): void => {
	storage.set(BANNER_DISMISSED_KEY, String(Date.now()));
	pushGTMEvent("app_banner_dismiss", { platform: devicePlatform() });
};

export const trackAppDownloadClick = (placement: AppDownloadPlacement): void =>
	pushGTMEvent("app_download_click", { placement, platform: devicePlatform(), store: "google_play" });

// ---- Tarjeta del panel después del registro (se cierra para siempre en ese navegador) ----

const DASHBOARD_CARD_DISMISSED_KEY = "la.app.dashboardCardDismissedAt";

/** La tarjeta del panel corresponde: Android o computadora, sin haber llegado desde la app ni haberla cerrado. */
export function shouldShowDashboardAppCard(): boolean {
	if (devicePlatform() === "ios") return false;
	return !storage.get(FROM_APP_KEY) && !storage.get(DASHBOARD_CARD_DISMISSED_KEY);
}

export const dismissDashboardAppCard = (): void => {
	storage.set(DASHBOARD_CARD_DISMISSED_KEY, String(Date.now()));
	pushGTMEvent("app_card_dismiss", { platform: devicePlatform() });
};

/** El bloque del login: solo Android y sin haber llegado desde la app. */
export const shouldShowLoginAppHint = (): boolean => devicePlatform() === "android" && !storage.get(FROM_APP_KEY);
