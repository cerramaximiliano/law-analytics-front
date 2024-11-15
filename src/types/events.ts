// types/events.ts

// Estado del evento
export interface Event {
	_id?: string;
	allDay: boolean; // Si el evento dura todo el día
	color?: string; // Color del evento (opcional)
	description?: string; // Descripción del evento (opcional)
	start: Date; // Fecha y hora de inicio del evento
	end: Date; // Fecha y hora de finalización del evento
	type: string; // Tipo de evento (ej. 'audience')
	title: string; // Título del evento
	userId?: string; // ID del usuario asociado
	groupId?: string; // ID del grupo asociado (opcional)
	folderId?: string;
}

// Estado del reducer de eventos
export interface EventState {
	events: Event[]; // Lista de eventos
	isLoader: boolean; // Si hay un loader en curso
	error?: string; // Posibles errores
	selectedEventId: string | null;
}

// Tipos de acción para los eventos (para usar en el reducer)
export interface Action {
	type: string; // Tipo de la acción
	payload?: any; // Datos adicionales que acompañan la acción
}
