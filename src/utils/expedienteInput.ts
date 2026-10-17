/**
 * Normaliza lo que el usuario tipea o pega en el campo "Número de expediente".
 *
 * Motivo (2026-10-16): en el celular el teclado numérico no tiene barra, así que el
 * abogado pega el expediente tal como lo tiene en un mail o WhatsApp: "69520/15",
 * "CNT 40791/2026", "EXP 959839/26". Los campos descartaban la barra sin avisar y
 * mandaban "6952015" o "407914998" como número (recortado a 9 dígitos). El servidor
 * los aceptaba y la causa quedaba inválida. Acá, si el texto trae una barra (o guion),
 * se separa en número y año; el año de 2 cifras se expande.
 *
 * Si NO hay separador no se recorta nada (2026-10-17): "6952015" recortado a "695201" pasaba
 * la validación y creaba una causa equivocada. Se deja el número largo para que falle la
 * validación y `suggestExpedienteSplits` proponga las lecturas plausibles (695/2015, 69520/2015).
 */

export const PJN_NUMBER_MAX_DIGITS = 6;
// EJE/IOL: 8 = ancho del bloque numérico del CUIJ (J-01-00003201-4). La numeración es corrida y
// crece (EJE ya tiene 7 dígitos), así que el tope es estructural, no el máximo observado.
// Alineado con utils/expedienteValidation.js del hub (2026-10-16).
export const OTHER_NUMBER_MAX_DIGITS = 8;
export const EXPEDIENTE_MIN_YEAR = 1980;

export interface ParsedExpediente {
	/** Solo dígitos. Recortado a `maxDigits` solo cuando venía con separador; si no, entero. */
	number: string;
	/** Año de 4 cifras si venía en el texto (tras la barra), si no null. */
	year: string | null;
	/** true si el texto traía separador número/año (barra o guion). */
	split: boolean;
	/** true si hubo que descartar caracteres (o recortar tras la barra): lo escrito no era solo dígitos. */
	altered: boolean;
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** "15" → "2015", "98" → "1998", "2026" → "2026". */
export const expandYear = (raw: string, now: number = new Date().getFullYear()): string | null => {
	const d = onlyDigits(raw);
	if (d.length === 4) return d;
	if (d.length === 2) {
		const n = Number(d);
		const century = n <= now % 100 ? 2000 : 1900;
		return String(century + n);
	}
	return null;
};

export const parseExpedienteInput = (raw: string, maxDigits: number = PJN_NUMBER_MAX_DIGITS): ParsedExpediente => {
	const text = raw ?? "";
	// Tomamos el primer "dígitos / dígitos" del texto: cubre "69520/15", "CNT 40791/2026",
	// "Expte. 959839/26 - JUZGADO 3" y variantes con guion o espacios alrededor.
	const m = text.match(/(\d+)\s*[/-]\s*(\d{2}|\d{4})(?!\d)/);
	if (m) {
		const number = m[1].slice(0, maxDigits);
		return { number, year: expandYear(m[2]), split: true, altered: true };
	}
	// Sin separador no recortamos: un número largo debe fallar la validación, no disfrazarse.
	const digits = onlyDigits(text);
	return { number: digits, year: null, split: false, altered: digits !== text };
};

export const isValidExpedienteNumber = (value: string, maxDigits: number = PJN_NUMBER_MAX_DIGITS): boolean =>
	new RegExp(`^\\d{1,${maxDigits}}$`).test(value);

export const isValidExpedienteYear = (value: string, now: number = new Date().getFullYear()): boolean =>
	/^\d{4}$/.test(value) && Number(value) >= EXPEDIENTE_MIN_YEAR && Number(value) <= now;

export interface ExpedienteSplitSuggestion {
	number: string;
	year: string;
}

/**
 * Para un número que excede el tope ("6952015"), propone hasta 2 lecturas "número + año pegados":
 * (a) las últimas 4 cifras como año, (b) las últimas 2 expandidas. Solo si el año queda en rango,
 * el resto tiene entre 1 y `maxDigits` cifras y no empieza con cero. Sin duplicados.
 */
export const suggestExpedienteSplits = (
	digits: string,
	maxDigits: number = PJN_NUMBER_MAX_DIGITS,
	now: number = new Date().getFullYear(),
): ExpedienteSplitSuggestion[] => {
	const d = digits ?? "";
	if (!/^\d+$/.test(d) || d.length <= maxDigits) return [];
	const out: ExpedienteSplitSuggestion[] = [];
	const consider = (number: string, year: string | null) => {
		if (!year || !isValidExpedienteYear(year, now)) return;
		if (!number || number.length > maxDigits || number.startsWith("0")) return;
		if (out.some((s) => s.number === number && s.year === year)) return;
		out.push({ number, year });
	};
	consider(d.slice(0, -4), d.slice(-4));
	consider(d.slice(0, -2), expandYear(d.slice(-2), now));
	return out;
};
