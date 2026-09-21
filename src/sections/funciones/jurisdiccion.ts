// Variante de /funciones según la provincia del anuncio.
//
// Las campañas de Google Ads del interior llegan con ?jur=salta|catamarca|mendoza
// (la-ads/docs/google-ads-setup.md, campaña "Search - Interior"). El anuncio
// promete la provincia; si la página solo nombra los portales de Buenos Aires,
// el visitante no ve confirmado lo que buscó. Acá solo cambia el texto del
// encabezado: las funciones son las mismas.

export interface VarianteJurisdiccion {
	etiqueta: string;
	portal: string;
}

const VARIANTES: Record<string, VarianteJurisdiccion> = {
	salta: { etiqueta: "Para abogados de Salta", portal: "el Poder Judicial de Salta" },
	catamarca: { etiqueta: "Para abogados de Catamarca", portal: "el Poder Judicial de Catamarca" },
	mendoza: { etiqueta: "Para abogados de Mendoza", portal: "el Poder Judicial de Mendoza" },
};

/** Devuelve la variante para un query string, o null si no hay `jur` válido. */
export const varianteDesdeBusqueda = (busqueda: string): VarianteJurisdiccion | null => {
	const jur = new URLSearchParams(busqueda).get("jur");
	if (!jur) return null;
	return VARIANTES[jur.trim().toLowerCase()] ?? null;
};
