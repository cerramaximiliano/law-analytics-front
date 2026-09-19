// Datos de la vista /funciones. Cada bloque es una función real del producto con
// su captura (cuando existe) o una composición de datos concretos.
//
// Se mantiene aparte del componente para que agregar una función sea editar una
// entrada y no tocar layout.

import { ElementType } from "react";
import {
	Calculator,
	Calendar,
	CalendarTick,
	Chart,
	DocumentText,
	FolderOpen,
	Profile2User,
	SearchNormal1,
	Send2,
	TaskSquare,
} from "iconsax-react";

import { FeatureNames } from "utils/gtm";

// Capturas reales del producto.
import capExpedientes from "assets/images/folders_movements_view.png";
import capCalendario from "assets/images/calendar_view.png";
import capCalculos from "assets/images/calculators_labor.png";
import capIntereses from "assets/images/calculator_interest_steps.png";
import capTareas from "assets/images/tasks_view.png";
import capContactos from "assets/images/folders_details.png";

export interface DatoBloque {
	valor: string;
	etiqueta: string;
}

export interface Funcion {
	id: string;
	/** Clave de tracking (`FeatureNames`), para reusar los eventos existentes. */
	featureKey?: string;
	eyebrow: string;
	titulo: string;
	bajada: string;
	icono: ElementType;
	puntos: string[];
	/** Captura del producto. Sin imagen, el bloque usa la lista de datos. */
	imagen?: string;
	imagenAlt?: string;
	/** Datos duros que acompañan al bloque cuando no hay captura. */
	datos?: DatoBloque[];
	/** Destino del enlace secundario, si la función tiene página propia. */
	enlace?: { texto: string; a: string; externo?: boolean };
}

export const FUNCIONES: Funcion[] = [
	{
		id: "expedientes",
		featureKey: FeatureNames.CARPETAS,
		eyebrow: "Expedientes",
		titulo: "Tus causas se actualizan solas",
		bajada:
			"Vinculás el expediente una vez y la app consulta el portal todos los días. Cada movimiento nuevo llega a la carpeta de esa causa, con el documento adjunto cuando el juzgado lo publica.",
		icono: FolderOpen,
		puntos: [
			"PJN, MEV y EJE, más Salta, Catamarca y Mendoza",
			"Aviso por email y en la app apenas aparece el movimiento",
			"El escrito y la cédula quedan guardados en la carpeta",
		],
		imagen: capExpedientes,
		imagenAlt: "Listado de movimientos de un expediente dentro de Law Analytics",
	},
	{
		id: "calendario",
		featureKey: FeatureNames.CALENDARIO,
		eyebrow: "Vencimientos",
		titulo: "Los plazos dejan de depender de tu memoria",
		bajada:
			"Cada causa proyecta sus vencimientos y los vuelca en un calendario que podés sincronizar con el de Google. Los feriados judiciales y las ferias ya están contemplados.",
		icono: Calendar,
		puntos: [
			"Sincronización con Google Calendar en los dos sentidos",
			"Recordatorios configurables por tipo de plazo",
			"Vista por causa, por responsable o por semana",
		],
		imagen: capCalendario,
		imagenAlt: "Calendario de vencimientos con eventos de varias causas",
	},
	{
		id: "calculos",
		featureKey: FeatureNames.CALCULOS,
		eyebrow: "Cálculos laborales",
		titulo: "Liquidaciones con los topes del mes en curso",
		bajada:
			"Indemnización por despido, preaviso, integración, vacaciones y multas, con la Ley 27.742 aplicada y los topes de convenio actualizados. El resultado sale con el detalle rubro por rubro para pegar en la demanda.",
		icono: Calculator,
		puntos: [
			"Ley 27.742 y topes por convenio al día",
			"Detalle exportable, no solo el número final",
			"Se guarda dentro de la causa con su fecha de cálculo",
		],
		imagen: capCalculos,
		imagenAlt: "Calculadora de indemnización laboral con el detalle por rubro",
	},
	{
		id: "intereses",
		featureKey: FeatureNames.INTERESES,
		eyebrow: "Intereses",
		titulo: "Tasas oficiales, tramo por tramo",
		bajada:
			"Actualización por CER, tasa activa, pasiva y las combinaciones que piden los distintos fueros. El cálculo parte cada período con su tasa y muestra cómo se llegó al total.",
		icono: Chart,
		puntos: [
			"CER aplicado por tramo, no como promedio",
			"Series oficiales actualizadas todos los días",
			"Comparación entre dos criterios en la misma pantalla",
		],
		imagen: capIntereses,
		imagenAlt: "Cálculo de intereses con los tramos y las tasas aplicadas",
	},
	{
		id: "tareas",
		featureKey: FeatureNames.TAREAS,
		eyebrow: "Tareas",
		titulo: "El trabajo del estudio, repartido y a la vista",
		bajada:
			"Tareas con responsable, prioridad y fecha, colgadas de la causa que corresponde. Sirve para saber qué falta antes de una audiencia sin preguntar por el grupo.",
		icono: TaskSquare,
		puntos: [
			"Cada tarea vive dentro de su expediente",
			"Vista propia por persona del estudio",
			"Se convierten en vencimientos del calendario",
		],
		imagen: capTareas,
		imagenAlt: "Tablero de tareas del estudio con responsables y prioridades",
	},
	{
		id: "contactos",
		featureKey: FeatureNames.CONTACTOS,
		eyebrow: "Contactos",
		titulo: "Quién es quién en cada causa",
		bajada:
			"Clientes, contrapartes, peritos y juzgados con sus datos y el historial de lo que pasó con cada uno. Desde el contacto se llega a todas sus causas.",
		icono: Profile2User,
		puntos: [
			"Un contacto puede estar en varias causas",
			"Historial de movimientos y documentos compartidos",
			"Datos de contacto verificados contra el expediente",
		],
		imagen: capContactos,
		imagenAlt: "Ficha de una causa con sus contactos asociados",
	},
	{
		id: "escritos",
		featureKey: FeatureNames.ESCRITOS,
		eyebrow: "Escritos",
		titulo: "Borradores con la causa ya cargada",
		bajada:
			"Plantillas de escritos que se completan con los datos del expediente y un asistente que propone el texto a partir de los movimientos. El borrador sale con la carátula, el juzgado y las partes puestos.",
		icono: DocumentText,
		puntos: [
			"Plantillas por fuero y tipo de presentación",
			"El asistente lee los movimientos de la causa",
			"El borrador queda versionado dentro del expediente",
		],
		datos: [
			{ valor: "1 clic", etiqueta: "de la causa al borrador" },
			{ valor: "0", etiqueta: "datos que recargás a mano" },
		],
	},
	{
		id: "postal",
		featureKey: FeatureNames.POSTAL_TRACKING,
		eyebrow: "Seguimiento postal",
		titulo: "Telegramas y cartas documento, sin entrar al Correo",
		bajada:
			"Cargás el número de envío y la app consulta el estado por vos. Cada cambio queda registrado con su fecha y con la captura que sirve como constancia.",
		icono: Send2,
		puntos: [
			"Telegramas laborales y cartas documento",
			"Historial completo de cada movimiento del envío",
			"Captura de pantalla guardada como constancia",
		],
		datos: [
			{ valor: "Diario", etiqueta: "chequeo automático del estado" },
			{ valor: "Vinculado", etiqueta: "al expediente que corresponde" },
		],
	},
	{
		id: "citas",
		featureKey: FeatureNames.SISTEMA_CITAS,
		eyebrow: "Reservas",
		titulo: "Que el cliente elija el horario solo",
		bajada:
			"Publicás tu disponibilidad y el cliente reserva desde un enlace. La reunión entra en tu calendario y el contacto queda creado, sin ida y vuelta por WhatsApp.",
		icono: CalendarTick,
		puntos: [
			"Enlace propio para compartir o poner en tu firma",
			"Toma la disponibilidad real de tu calendario",
			"Recordatorio automático antes de la reunión",
		],
		datos: [
			{ valor: "24/7", etiqueta: "la agenda queda abierta" },
			{ valor: "Automático", etiqueta: "alta del contacto y del evento" },
		],
	},
	{
		id: "jurisprudencia",
		eyebrow: "Jurisprudencia",
		titulo: "Buscá fallos por el sentido, no por la palabra exacta",
		bajada:
			"Describís el caso y la búsqueda trae los fallos parecidos, con la cita verificable y un resumen de qué resolvió cada uno. Podés vincular el fallo a tu causa.",
		icono: SearchNormal1,
		puntos: [
			"Búsqueda semántica sobre sentencias publicadas",
			"Justicia Nacional y Corte Suprema",
			"Cita completa para citar en el escrito",
		],
		datos: [
			{ valor: "+15.000", etiqueta: "sentencias publicadas" },
			{ valor: "Nacional · CSJN", etiqueta: "jurisdicciones cubiertas" },
		],
		enlace: { texto: "Probar la búsqueda sin cuenta", a: "/jurisprudencia" },
	},
];

/** Cifras del encabezado. Se mantienen conservadoras y verificables. */
export const CIFRAS: DatoBloque[] = [
	{ valor: "6", etiqueta: "jurisdicciones sincronizadas" },
	{ valor: "+15.000", etiqueta: "sentencias publicadas" },
	{ valor: "2 min", etiqueta: "de la cuenta nueva a la primera causa" },
];
