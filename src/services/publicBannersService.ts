// Banners/CTA dinámicos de las vistas públicas dentro de la SPA.
//
// Mismo sistema que la-public-site (src/services/bannersService.ts): el copy
// vive en la colección public-banners y se edita desde la UI admin sin deploy.
// La página declara su slot (key) y un fallback hardcodeado por si la API no
// responde o el slot está deshabilitado.
//
// Tokens en titulo/cuerpo:
//   {fallos}   → cifra dinámica del corpus buscable
//   ==texto==  → segmento resaltado (la página lo estiliza)
//
// Los eventos van marcados con source 'app': acá el visitante ya navega la
// SPA, distinto del tráfico de IG/email que cae en el mini-sitio público.

import axios from "axios";
import { useEffect, useState } from "react";

export type BannerKey = "jurisprudencia-index" | "jurisprudencia-detail" | "educativo-index" | "educativo-detail";

export interface Banner {
	titulo: string;
	cuerpo: string;
	ctaLabel: string;
	ctaHref: string;
}

const SS_KEY = "la_public_banners";
const SS_TTL_MS = 5 * 60 * 1000;

function getBaseUrl(): string {
	if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && window.location.hostname === "lawanalytics.app") {
		return "https://server.lawanalytics.app";
	}
	return "";
}

let promesa: Promise<Partial<Record<BannerKey, Banner>>> | null = null;

function getBanners(): Promise<Partial<Record<BannerKey, Banner>>> {
	if (promesa) return promesa;
	promesa = (async () => {
		try {
			const raw = sessionStorage.getItem(SS_KEY);
			if (raw) {
				const cache = JSON.parse(raw) as { data: Partial<Record<BannerKey, Banner>>; at: number };
				if (cache.data && Date.now() - cache.at < SS_TTL_MS) return cache.data;
			}
		} catch {
			// storage bloqueado: seguir a la red
		}
		try {
			const { data } = await axios.get(`${getBaseUrl()}/api/public/banners`, { timeout: 8000 });
			const banners = (data?.data ?? {}) as Partial<Record<BannerKey, Banner>>;
			try {
				sessionStorage.setItem(SS_KEY, JSON.stringify({ data: banners, at: Date.now() }));
			} catch {
				// sin storage: el cache en memoria alcanza
			}
			return banners;
		} catch {
			return {};
		}
	})();
	return promesa;
}

/** Banner del slot, con fallback local. Arranca con el fallback para no
 *  saltar de layout. */
export function useBanner(key: BannerKey, fallback: Banner): Banner {
	const [banner, setBanner] = useState<Banner>(fallback);
	useEffect(() => {
		let vivo = true;
		getBanners().then((banners) => {
			const b = banners[key];
			if (vivo && b && b.titulo && b.cuerpo && b.ctaLabel && b.ctaHref) setBanner(b);
		});
		return () => {
			vivo = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);
	return banner;
}

// ── Cifra dinámica del corpus buscable ─────────────────────────────────────
// Mismo origen que la-public-site/corpusStatsService: GET /api/public/
// sentencias/stats, derivado del grifo RAG. Redondeo hacia abajo al millar.

const FALLOS_FALLBACK = 10000;
const FALLOS_SS_KEY = "la_corpus_fallos";
const FALLOS_SS_TTL_MS = 60 * 60 * 1000;

export function formatFallos(n: number): string {
	const redondeado = Math.max(1000, Math.floor(n / 1000) * 1000);
	return redondeado.toLocaleString("es-AR");
}

let promesaFallos: Promise<number> | null = null;

function getFallosDisponibles(): Promise<number> {
	if (promesaFallos) return promesaFallos;
	promesaFallos = (async () => {
		try {
			const raw = sessionStorage.getItem(FALLOS_SS_KEY);
			if (raw) {
				const cache = JSON.parse(raw) as { n: number; at: number };
				if (cache.n > 0 && Date.now() - cache.at < FALLOS_SS_TTL_MS) return cache.n;
			}
		} catch {
			// storage bloqueado: seguir a la red
		}
		try {
			const { data } = await axios.get(`${getBaseUrl()}/api/public/sentencias/stats`, { timeout: 8000 });
			const n = Number(data?.data?.fallos);
			if (Number.isFinite(n) && n > 0) {
				try {
					sessionStorage.setItem(FALLOS_SS_KEY, JSON.stringify({ n, at: Date.now() }));
				} catch {
					// sin storage: el cache en memoria alcanza
				}
				return n;
			}
		} catch {
			// API caída: fallback silencioso
		}
		return FALLOS_FALLBACK;
	})();
	return promesaFallos;
}

/** Cifra formateada lista para el copy ("10.000"). */
export function useFallosCount(): string {
	const [txt, setTxt] = useState(formatFallos(FALLOS_FALLBACK));
	useEffect(() => {
		let vivo = true;
		getFallosDisponibles().then((n) => {
			if (vivo) setTxt(formatFallos(n));
		});
		return () => {
			vivo = false;
		};
	}, []);
	return txt;
}

/** Reemplaza {fallos} y parte el texto en segmentos ==resaltados==. */
export function parseBannerText(texto: string, fallos: string): Array<{ t: string; resaltado: boolean }> {
	const conCifra = texto.split("{fallos}").join(fallos);
	const partes = conCifra.split(/==([^=]+)==/g);
	// Los índices impares del split con grupo capturado son los segmentos ==...==.
	const segs: Array<{ t: string; resaltado: boolean }> = [];
	partes.forEach((p: string, i: number) => {
		if (p !== "") segs.push({ t: p, resaltado: i % 2 === 1 });
	});
	return segs;
}

/** Registra view/click (source fijo 'app'). El view se deduplica por sesión
 *  y slot; el click usa sendBeacon para sobrevivir a la navegación. */
export function trackBannerEvent(key: BannerKey, tipo: "view" | "click"): void {
	try {
		if (tipo === "view") {
			const marca = `la_banner_view_${key}`;
			if (sessionStorage.getItem(marca)) return;
			sessionStorage.setItem(marca, "1");
		}
	} catch {
		// sin storage: mejor un view de más que perder la métrica
	}
	const payload = JSON.stringify({
		key,
		tipo,
		source: "app",
		medium: "spa",
		campaign: null,
		path: typeof window !== "undefined" ? window.location.pathname.slice(0, 300) : null,
	});
	const url = `${getBaseUrl()}/api/public/banners/event`;
	try {
		if (typeof navigator !== "undefined" && navigator.sendBeacon && navigator.sendBeacon(url, payload)) return;
	} catch {
		// caer a fetch
	}
	void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
}
