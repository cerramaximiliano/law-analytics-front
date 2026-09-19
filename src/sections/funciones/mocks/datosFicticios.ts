// Datos inventados para las maquetas de /funciones.
//
// Regla: **nada de acá sale de la base**. Las carátulas, los nombres y los
// números son ficticios y están elegidos para que se lean como reales sin
// corresponder a ninguna causa. Antes de esto la vista usaba capturas de la app
// con causas de personas identificables (2026-09-19).
//
// Si hace falta un dato nuevo, inventarlo acá y no copiarlo de una pantalla.

export const CARATULA = "Gutiérrez, Marta c/ Transportes del Litoral SA";
export const CARATULA_LARGA = `${CARATULA} s/ despido`;

export const MOVIMIENTOS = [
	{ fecha: "12/09", titulo: "Traslado de la demanda", tipo: "Cédula", nuevo: true },
	{ fecha: "09/09", titulo: "Agréguese la prueba documental", tipo: "Despacho", nuevo: true },
	{ fecha: "02/09", titulo: "Se provee la prueba pericial", tipo: "Despacho", nuevo: false },
	{ fecha: "28/08", titulo: "Contesta demanda", tipo: "Escrito", nuevo: false },
	{ fecha: "21/08", titulo: "Intímase a acompañar el poder", tipo: "Despacho", nuevo: false },
	{ fecha: "14/08", titulo: "Inicio de demanda", tipo: "Escrito", nuevo: false },
];

export const EVENTOS_MES = [
	{ dia: 3, texto: "Contesta traslado", tono: "alerta" as const },
	{ dia: 9, texto: "Audiencia", tono: "acento" as const },
	{ dia: 9, texto: "Ofrece prueba", tono: "neutro" as const },
	{ dia: 17, texto: "Vence pericia", tono: "alerta" as const },
	{ dia: 22, texto: "Alegatos", tono: "neutro" as const },
	{ dia: 24, texto: "Audiencia", tono: "acento" as const },
];

export const RUBROS = [
	{ rubro: "Indemnización por antigüedad", monto: "4.812.600" },
	{ rubro: "Preaviso", monto: "1.604.200" },
	{ rubro: "Integración mes de despido", monto: "802.100" },
	{ rubro: "Vacaciones proporcionales", monto: "374.980" },
	{ rubro: "SAC proporcional", monto: "267.366" },
];
export const TOTAL_LIQUIDACION = "7.861.246";

export const TRAMOS = [
	{ periodo: "03/2024 – 12/2024", tasa: "CER + 3 %", aporte: "1.284.900" },
	{ periodo: "01/2025 – 06/2025", tasa: "Activa BNA", aporte: "962.140" },
	{ periodo: "07/2025 – 09/2026", tasa: "Acta 2764", aporte: "1.517.380" },
];

export const TAREAS = [
	{ tarea: "Preparar contestación de pericia", quien: "MG", vence: "en 2 días", estado: "pendiente" as const },
	{ tarea: "Pedir informe al Correo", quien: "JL", vence: "el viernes", estado: "pendiente" as const },
	{ tarea: "Cargar liquidación actualizada", quien: "MG", vence: "hecho", estado: "listo" as const },
];

export const CONTACTO = {
	nombre: "Marta Gutiérrez",
	rol: "Cliente",
	iniciales: "MG",
	causas: 3,
	datos: [
		{ etiqueta: "Teléfono", valor: "+54 341 555 0148" },
		{ etiqueta: "Correo", valor: "m.gutierrez@ejemplo.com" },
	],
};
