// Servicio de "Próximos vencimientos": fuente de verdad ÚNICA y EN VIVO de los
// vencimientos del dashboard. Trae los próximos eventos de agenda de tipo
// vencimiento/audiencia del usuario (o del equipo activo), MÁS los conteos por
// ventana (7/15/30 días) calculados sobre el mismo universo. Así el widget
// (lista), la KPI card y la card de Vencimientos 7/15/30 muestran siempre los
// mismos números — antes cada uno calculaba distinto (dos cacheados 24 h con un
// bug que los dejaba en 0, y este en vivo).
//
// Jurisdicción-agnóstico: `movementRef` es metadata opcional (si está, la fila
// del widget hace deep-link al movimiento). No depende de detección automática
// de plazos — son los vencimientos que el usuario carga en la agenda.
import axios from "axios";
import { Event } from "types/events";

export interface UpcomingMovementEvent extends Event {
	folderName?: string;
}

export interface DeadlineCounts {
	next7Days: number;
	next15Days: number;
	next30Days: number;
	// Total de próximos vencimientos/audiencias sin tope de días — coincide con lo
	// que lista el widget. La KPI del dashboard usa este valor.
	total: number;
}

export interface UpcomingDeadlines {
	events: UpcomingMovementEvent[];
	counts: DeadlineCounts;
}

const EMPTY_COUNTS: DeadlineCounts = { next7Days: 0, next15Days: 0, next30Days: 0, total: 0 };

const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

export const getUpcomingDeadlines = async (params?: { limit?: number; groupId?: string }): Promise<UpcomingDeadlines> => {
	const response = await axios.get(`${baseUrl}/api/events/upcoming`, {
		params: {
			...(params?.limit ? { limit: params.limit } : {}),
			...(params?.groupId ? { groupId: params.groupId } : {}),
		},
	});
	if (response.data?.success) {
		return {
			events: Array.isArray(response.data.events) ? (response.data.events as UpcomingMovementEvent[]) : [],
			counts: response.data.counts ?? EMPTY_COUNTS,
		};
	}
	return { events: [], counts: EMPTY_COUNTS };
};
