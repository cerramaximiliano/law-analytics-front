// Catálogo de prueba con la forma que devuelve GET /api/previsional/haber-caja/catalogo (recortado). Solo para tests.
import { CatalogoHaberCaja, CategoriaCatalogo } from "services/haberCajaService";

const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const cat = (
	codigo: string,
	etiqueta: string,
	tipo: CategoriaCatalogo["tipo"],
	computo: CategoriaCatalogo["computo"],
): CategoriaCatalogo => ({
	codigo,
	etiqueta,
	tipo,
	computo,
});
const propia = (c: string) => ({ codigo: c, computable: c, equivalencia: false, norma: null });
const equiparada = (c: string, a: string) => ({ codigo: c, computable: a, equivalencia: true, norma: "Dec. 1361/80" });

export const CATALOGO_PRUEBA: CatalogoHaberCaja = {
	datosVersion: "abc123def456",
	monedas: [
		{ clave: "pesosMonedaNacional", etiqueta: "Pesos moneda nacional", simbolo: "m$n", desde: null, hasta: "1969-12" },
		{ clave: "pesosLey", etiqueta: "Pesos ley 18.188", simbolo: "$ley", desde: "1970-01", hasta: "1983-05" },
		{ clave: "pesosArgentinos", etiqueta: "Pesos argentinos", simbolo: "$a", desde: "1983-06", hasta: "1985-05" },
		{ clave: "australes", etiqueta: "Australes", simbolo: "A", desde: "1985-06", hasta: "1991-12" },
		{ clave: "pesos", etiqueta: "Pesos", simbolo: "$", desde: "1992-01", hasta: null },
	],
	tramos: [
		{ desde: null, hasta: "1968-12", categorias: [equiparada("IND", "A")] },
		{
			desde: "1969-01",
			hasta: "1980-06",
			categorias: [
				propia("A"),
				...["B", "C", "D", "E"].map((c) => equiparada(c, "A")),
				...["F", "G"].map((c) => equiparada(c, "B")),
				equiparada("H", "C"),
				equiparada("I", "D"),
				equiparada("J", "D"),
				equiparada("M", "F"),
			],
		},
		{ desde: "1980-07", hasta: "1988-05", categorias: letras.slice(0, 7).map(propia) },
		{ desde: "1988-06", hasta: "1998-09", categorias: letras.map(propia) },
		{ desde: "1998-10", hasta: "2007-02", categorias: [...letras.map(propia), propia("MONOTRI")] },
		{ desde: "2007-03", hasta: null, categorias: [propia("Cat.I"), propia("Cat.II"), propia("MONOTRI")] },
	],
	categorias: [
		cat("IND", "Independiente (hasta 1968)", "autonomo", [
			{ desde: null, hasta: "1968-12", computable: "A" },
			{ desde: "1969-01", hasta: null, computable: "IND" },
		]),
		cat("A", "Categoría A", "autonomo", [
			{ desde: null, hasta: "2007-02", computable: "A" },
			{ desde: "2007-03", hasta: null, computable: "W" },
		]),
		...["B", "C", "D", "E", "F", "G"].map((c) =>
			cat(c, `Categoría ${c}`, "autonomo", [
				{ desde: null, hasta: "1968-12", computable: c },
				{ desde: "1969-01", hasta: "1980-06", computable: ["F", "G"].includes(c) ? "B" : "A" },
				{ desde: "1980-07", hasta: "2007-02", computable: c },
				{ desde: "2007-03", hasta: null, computable: "W" },
			]),
		),
		...["H", "I", "J"].map((c) =>
			cat(c, `Categoría ${c}`, "autonomo", [
				{ desde: null, hasta: "2007-02", computable: c },
				{ desde: "2007-03", hasta: null, computable: "W" },
			]),
		),
		cat("M", "Categoría M", "autonomo", [
			{ desde: null, hasta: "1968-12", computable: "MONOTRI" },
			{ desde: "1969-01", hasta: "1980-06", computable: "F" },
			{ desde: "1980-07", hasta: null, computable: "MONOTRI" },
		]),
		cat("Cat.I", "Categoría I (Dec. 1866/06)", "autonomo", [{ desde: null, hasta: null, computable: "Cat.I" }]),
		cat("Cat.II", "Categoría II (Dec. 1866/06)", "autonomo", [{ desde: null, hasta: null, computable: "Cat.II" }]),
		cat("MONOTRI", "Monotributo", "monotributo", [{ desde: null, hasta: null, computable: "MONOTRI" }]),
		cat("W", "Monotributo social o eventual (W)", "monotributo", [{ desde: null, hasta: null, computable: "W" }]),
	],
	bloqueos: [
		{
			codigos: ["H", "I", "J"],
			desde: "1980-07",
			hasta: "1988-05",
			mensaje: "Entre 7/1980 y 5/1988 las categorías iban de la A a la G: H, I y J vuelven a existir desde 6/1988.",
		},
		{
			codigos: ["M"],
			desde: "1980-07",
			hasta: "1998-09",
			mensaje:
				"La categoría M vale hasta 6/1980 y el monotributo existe desde 10/1998: en este período corresponde una categoría de autónomos de la época.",
		},
		{
			codigos: ["IND"],
			desde: "1969-01",
			hasta: null,
			mensaje: "Independiente, profesional y empresario valen hasta 12/1968: desde 1/1969 corresponde una categoría con letra.",
		},
		{
			codigos: ["MONOTRI"],
			desde: null,
			hasta: "1998-09",
			mensaje: "El monotributo existe desde 10/1998: en este período corresponde una categoría de autónomos.",
		},
	],
	limites: { remuneraciones: 1500, periodosAutonomo: 300, mesesRenglon: 600 },
};
