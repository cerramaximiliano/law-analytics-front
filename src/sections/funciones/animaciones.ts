// Animaciones de /funciones en CSS (antes framer-motion, 2026-10-23).
//
// framer-motion costaba ~300 ms de hilo principal en el teléfono (Lighthouse móvil,
// la-ads/analysis/2026-10-23-primera-causa-medicion-y-siguiente-iteracion.md §10) para
// tres efectos: el bloque que sube al entrar en pantalla y las filas escalonadas de
// las maquetas. El encabezado ya no se anima: se dibuja desde el HTML pre-renderizado
// y animarlo al montar React lo haría saltar.

import { createContext, RefObject, useContext, useEffect, useState } from "react";

const CURVA = "cubic-bezier(.22,.61,.36,1)";
const SIN_MOVIMIENTO = { "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 1, transform: "none" } };

/** true una sola vez, cuando el elemento entra en pantalla (como useInView con once). */
export const useEnVista = (ref: RefObject<Element>, margen = "-80px"): boolean => {
	const [visto, setVisto] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el || visto) return;
		if (typeof IntersectionObserver === "undefined") {
			setVisto(true);
			return;
		}
		const obs = new IntersectionObserver(
			(entradas) => {
				if (entradas.some((e) => e.isIntersecting)) {
					setVisto(true);
					obs.disconnect();
				}
			},
			{ rootMargin: margen },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, [ref, margen, visto]);
	return visto;
};

/** Sube y aparece al entrar en pantalla. Antes de verse queda oculto y corrido. */
export const aparecer = (visible: boolean, retraso = 0) => ({
	"@keyframes la-aparecer": { from: { opacity: 0, transform: "translateY(24px)" }, to: { opacity: 1, transform: "none" } },
	...(visible ? { animation: `la-aparecer .5s ${CURVA} ${retraso}s both` } : { opacity: 0, transform: "translateY(24px)" }),
	...SIN_MOVIMIENTO,
});

// Las filas de las maquetas se animan salvo dentro del encabezado (pre-renderizado).
export const AnimarFilas = createContext(true);

/**
 * Entrada escalonada de una fila. Si un ancestro marca data-en-vista="no" (el bloque
 * todavía no se ve), la animación espera en pausa, en su primer cuadro.
 */
export const useFila = () => {
	const animar = useContext(AnimarFilas);
	return (i: number) =>
		animar
			? {
					"@keyframes la-fila": { from: { opacity: 0, transform: "translateX(-10px)" }, to: { opacity: 1, transform: "none" } },
					animation: `la-fila .35s ${CURVA} ${0.06 * i}s both`,
					"[data-en-vista='no'] &": { animationPlayState: "paused" },
					...SIN_MOVIMIENTO,
			  }
			: {};
};
