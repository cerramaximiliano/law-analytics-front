// Servicio del widget "Próximos vencimientos": trae los eventos futuros del
// usuario (o del equipo activo) que están vinculados a un movimiento judicial
// (movementRef presente). Jurisdicción-agnóstico — hoy solo hay datos PJN, pero
// cuando se habilite el vínculo en EJE/SCBA/MEV/manual aparecen sin tocar esto.
import axios from "axios";
import { Event } from "types/events";

export interface UpcomingMovementEvent extends Event {
	folderName?: string;
}

const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

export const getUpcomingMovementEvents = async (params?: { limit?: number; groupId?: string }): Promise<UpcomingMovementEvent[]> => {
	const response = await axios.get(`${baseUrl}/api/events/upcoming`, {
		params: {
			...(params?.limit ? { limit: params.limit } : {}),
			...(params?.groupId ? { groupId: params.groupId } : {}),
		},
	});
	if (response.data?.success && Array.isArray(response.data.events)) {
		return response.data.events as UpcomingMovementEvent[];
	}
	return [];
};
