import { DocumentText, Judge, NotificationStatus, Status } from "iconsax-react";
import { createElement } from "react";
import dayjs from "utils/dayjs-config";

export const getMovementIcon = (movement?: string) => {
	switch (movement) {
		case "Escrito-Actor":
		case "Escrito-Demandado":
			return createElement(DocumentText, { size: 16 });
		case "Despacho":
			return createElement(Judge, { size: 16 });
		case "Cédula":
		case "Oficio":
			return createElement(NotificationStatus, { size: 16 });
		case "Evento":
			return createElement(Status, { size: 16 });
		default:
			return createElement(DocumentText, { size: 16 });
	}
};

export const getMovementColor = (movement?: string): "success" | "error" | "secondary" | "primary" | "warning" | "default" => {
	switch (movement) {
		case "Escrito-Actor":
			return "success";
		case "Escrito-Demandado":
			return "error";
		case "Despacho":
			return "secondary";
		case "Cédula":
		case "Oficio":
			return "primary";
		case "Evento":
			return "warning";
		default:
			return "default";
	}
};

export const parseDate = (dateString: string) => {
	try {
		// Try to parse as ISO date first
		if (dateString.includes("T") || dateString.includes("-")) {
			const parsed = dayjs(dateString);
			if (parsed.isValid()) {
				// Normalizar a medianoche en zona horaria local para evitar cambios de fecha
				return dayjs(parsed.format("YYYY-MM-DD")).toDate();
			}
		}

		// Try to parse as DD/MM/YYYY format
		const parsed = dayjs(dateString, "DD/MM/YYYY");
		if (parsed.isValid()) {
			return parsed.toDate();
		}

		return new Date(0);
	} catch {
		return new Date(0);
	}
};

export const formatDate = (dateString: string) => {
	if (!dateString || dateString.trim() === "") {
		return "";
	}

	try {
		// Try to parse as ISO date first
		if (dateString.includes("T") || dateString.includes("-")) {
			const parsed = dayjs.utc(dateString);
			if (parsed.isValid()) {
				// Usar componentes de fecha UTC para evitar conversión de zona horaria
				return parsed.format("DD/MM/YYYY");
			}
		}

		// Try to parse as DD/MM/YYYY format
		const parsed = dayjs(dateString, "DD/MM/YYYY");
		if (parsed.isValid()) {
			return parsed.format("DD/MM/YYYY");
		}

		return "";
	} catch {
		return "";
	}
};
