import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Movement } from "types/movements";
import { NotificationType } from "types/notifications";
import { UnifiedActivity } from "../tables/CombinedTable";

// Helper function to convert data to CSV
function convertToCSV(data: any[], headers: string[]): string {
	const csvHeaders = headers.join(",");
	const csvRows = data.map((row) => {
		return headers
			.map((header) => {
				const value = row[header] || "";
				// Escape commas and quotes in CSV
				return `"${String(value).replace(/"/g, '""')}"`;
			})
			.join(",");
	});
	return [csvHeaders, ...csvRows].join("\n");
}

// Helper function to download CSV
function downloadCSV(csv: string, filename: string) {
	const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);
	link.setAttribute("href", url);
	link.setAttribute("download", filename);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

// Export movements
export function exportMovements(movements: Movement[], filename: string = "movimientos.csv") {
	const data = movements.map((movement) => ({
		Fecha: movement.time,
		Título: movement.title,
		Tipo: movement.movement,
		Descripción: movement.description || "",
		Vencimiento: movement.dateExpiration || "",
		Enlace: movement.link || "",
	}));

	const headers = ["Fecha", "Título", "Tipo", "Descripción", "Vencimiento", "Enlace"];
	const csv = convertToCSV(data, headers);
	downloadCSV(csv, filename);
}

// Export notifications
export function exportNotifications(notifications: NotificationType[], filename: string = "notificaciones.csv") {
	const data = notifications.map((notification) => ({
		Fecha: notification.time,
		Título: notification.title,
		Tipo: notification.notification,
		Usuario: notification.user || "",
		Descripción: notification.description || "",
		Vencimiento: notification.dateExpiration || "",
	}));

	const headers = ["Fecha", "Título", "Tipo", "Usuario", "Descripción", "Vencimiento"];
	const csv = convertToCSV(data, headers);
	downloadCSV(csv, filename);
}

// Export calendar events
export function exportEvents(events: any[], filename: string = "eventos.csv") {
	const data = events.map((event) => ({
		Fecha: event.start ? format(parseISO(event.start), "dd/MM/yyyy HH:mm", { locale: es }) : "",
		Título: event.title,
		Tipo: event.type || "General",
		Descripción: event.description || "",
		"Fecha Fin": event.end ? format(parseISO(event.end), "dd/MM/yyyy HH:mm", { locale: es }) : "",
		"Todo el día": event.allDay ? "Sí" : "No",
	}));

	const headers = ["Fecha", "Título", "Tipo", "Descripción", "Fecha Fin", "Todo el día"];
	const csv = convertToCSV(data, headers);
	downloadCSV(csv, filename);
}

// Export combined activities
export function exportCombinedActivities(activities: UnifiedActivity[], filename: string = "actividades_completas.csv") {
	const data = activities.map((activity) => ({
		Fecha: activity.dateString,
		Título: activity.title,
		Origen: activity.type === "movement" ? "Movimiento" : activity.type === "notification" ? "Notificación" : "Calendario",
		Tipo: activity.subType,
		Descripción: activity.description || "",
		Vencimiento: activity.expirationDate || "",
		Usuario: activity.user || "",
	}));

	const headers = ["Fecha", "Título", "Origen", "Tipo", "Descripción", "Vencimiento", "Usuario"];
	const csv = convertToCSV(data, headers);
	downloadCSV(csv, filename);
}

// Export filtered data based on active tab
export function exportActivityData(
	activeTab: string,
	data: {
		movements: Movement[];
		notifications: NotificationType[];
		events: any[];
		combined: UnifiedActivity[];
	},
	folderName?: string,
) {
	const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm");
	const prefix = folderName ? `${folderName.replace(/[^a-z0-9]/gi, "_")}_` : "";

	switch (activeTab) {
		case "movements":
			exportMovements(data.movements, `${prefix}movimientos_${timestamp}.csv`);
			break;
		case "notifications":
			exportNotifications(data.notifications, `${prefix}notificaciones_${timestamp}.csv`);
			break;
		case "calendar":
			exportEvents(data.events, `${prefix}eventos_${timestamp}.csv`);
			break;
		case "combined":
			exportCombinedActivities(data.combined, `${prefix}actividades_completas_${timestamp}.csv`);
			break;
	}
}
