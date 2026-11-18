/**
 * Los 28 fueros del PJN que admite el alta por número y año (portal scw.pjn.gov.ar).
 * Espejo de `config/pjnFueros.js` del hub: `code` es el `pjnCode` que recibe el backend
 * (value del select del portal) y `causaType` el discriminador de la carpeta.
 *
 * `folderFuero`: valor del catálogo `data/folder.json → fuero`. Queda en null cuando el
 * código no identifica una materia: la Corte y las sedes federales del interior tramitan
 * causas civiles, penales y previsionales (mismo criterio que la sincronización de Mis Causas).
 */
export interface PjnFuero {
	code: string;
	sigla: string;
	causaType: string;
	/** Nombre completo, para los selectores. */
	nombre: string;
	/** Nombre corto, para etiquetas. */
	corto: string;
	folderFuero: string | null;
}

const f = (code: string, sigla: string, causaType: string, nombre: string, corto: string, folderFuero: string | null): PjnFuero => ({
	code,
	sigla,
	causaType,
	nombre: `${sigla} - ${nombre}`,
	corto,
	folderFuero,
});
const sede = (code: string, sigla: string, ciudad: string): PjnFuero =>
	f(code, sigla, `Causas${sigla}`, `Justicia Federal de ${ciudad}`, `Federal de ${ciudad}`, null);

export const PJN_FUEROS: PjnFuero[] = [
	f("0", "CSJ", "CausasCSJ", "Corte Suprema de Justicia de la Nación", "Corte Suprema", null),
	f("1", "CIV", "CausasCivil", "Cámara Nacional de Apelaciones en lo Civil", "Civil", "Civil"),
	f(
		"2",
		"CAF",
		"CausasCAF",
		"Cámara Nacional de Apelaciones en lo Contencioso Administrativo Federal",
		"Contencioso Administrativo Federal",
		"Contencioso Administrativo Federal",
	),
	f(
		"3",
		"CCF",
		"CausasCCF",
		"Cámara Nacional de Apelaciones en lo Civil y Comercial Federal",
		"Civil y Comercial Federal",
		"Civil y Comercial Federal",
	),
	f("4", "CNE", "CausasCNE", "Cámara Nacional Electoral", "Electoral", "Electoral"),
	f("5", "CSS", "CausasSegSocial", "Cámara Federal de la Seguridad Social", "Seguridad Social", "Seguridad Social"),
	f("6", "CPE", "CausasCPE", "Cámara Nacional de Apelaciones en lo Penal Económico", "Penal Económico", "Penal Económico"),
	f("7", "CNT", "CausasTrabajo", "Cámara Nacional de Apelaciones del Trabajo", "Trabajo", "Laboral"),
	f(
		"8",
		"CFP",
		"CausasCFP",
		"Cámara Criminal y Correccional Federal",
		"Criminal y Correccional Federal",
		"Criminal y Correccional Federal",
	),
	f(
		"9",
		"CCC",
		"CausasCCC",
		"Cámara Nacional de Apelaciones en lo Criminal y Correccional",
		"Criminal y Correccional",
		"Criminal y Correccional",
	),
	f("10", "COM", "CausasComercial", "Cámara Nacional de Apelaciones en lo Comercial", "Comercial", "Comercial"),
	f("11", "CPF", "CausasCPF", "Cámara Federal de Casación Penal", "Casación Penal Federal", "Penal"),
	f("12", "CPN", "CausasCPN", "Cámara Nacional de Casación Penal", "Casación Penal Nacional", "Penal"),
	sede("13", "FBB", "Bahía Blanca"),
	sede("14", "FCR", "Comodoro Rivadavia"),
	sede("15", "FCB", "Córdoba"),
	sede("16", "FCT", "Corrientes"),
	sede("17", "FGR", "General Roca"),
	sede("18", "FLP", "La Plata"),
	sede("19", "FMP", "Mar del Plata"),
	sede("20", "FMZ", "Mendoza"),
	sede("21", "FPO", "Posadas"),
	sede("22", "FPA", "Paraná"),
	sede("23", "FRE", "Resistencia"),
	sede("24", "FSA", "Salta"),
	sede("25", "FRO", "Rosario"),
	sede("26", "FSM", "San Martín"),
	sede("27", "FTU", "Tucumán"),
];

const POR_CODIGO = new Map(PJN_FUEROS.map((x) => [x.code, x]));
const POR_TIPO = new Map(PJN_FUEROS.map((x) => [x.causaType, x]));
// Alias histórico del enum de la carpeta.
POR_TIPO.set("CausasSegSoc", POR_CODIGO.get("5") as PjnFuero);

export const pjnFueroPorCodigo = (code: string | null | undefined): PjnFuero | undefined => POR_CODIGO.get(String(code ?? ""));
export const pjnFueroPorCausaType = (causaType: string | null | undefined): PjnFuero | undefined => POR_TIPO.get(String(causaType ?? ""));

/** Opciones `{ value, nombre }` para los selectores de fuero del alta y de la vinculación. */
export const PJN_FUERO_OPCIONES: { value: string; nombre: string }[] = PJN_FUEROS.map((x) => ({ value: x.code, nombre: x.nombre }));

/** causaType → nombre corto del fuero ("Civil", "Federal de Mendoza"…). */
export const PJN_FUERO_ETIQUETAS: Record<string, string> = Object.fromEntries([...POR_TIPO].map(([tipo, x]) => [tipo, x.corto]));

/** causaType → pjnCode (inverso de causaService.getCausaTypeByPjnCode del hub). */
export const PJN_CODIGO_POR_CAUSA_TYPE: Record<string, string> = Object.fromEntries([...POR_TIPO].map(([tipo, x]) => [tipo, x.code]));
