import { assigneeTag, TeamAssignee } from "./teamAssignees";

// Vista por responsable en el listado de carpetas y en el modal de archivadas de un equipo
// (6/11/2026). Las tres vistas fijas son «Mis carpetas», «Todas» y «Sin responsable»; cualquier
// otro valor es el id de un integrante, previsto o invitado («De…»). El filtro lo resuelve el
// hub con `?responsable=me|ninguno|<id>`.

export const RESPONSABLE_VISTAS_FIJAS = ["todas", "mias", "sin"] as const;
export type ResponsableVistaFija = (typeof RESPONSABLE_VISTAS_FIJAS)[number];

export function isResponsableVistaFija(vista: string | null | undefined): vista is ResponsableVistaFija {
	return (RESPONSABLE_VISTAS_FIJAS as readonly string[]).includes(vista || "");
}

/** Valor del parámetro `responsable` del hub para la vista; `null` cuando no hay filtro. */
export function responsableQueryValue(vista: string | null | undefined): string | null {
	if (!vista || vista === "todas") return null;
	if (vista === "mias") return "me";
	if (vista === "sin") return "ninguno";
	return vista;
}

export interface ResponsableOption {
	id: string;
	name: string;
}

/**
 * Opciones del selector «De…»: todos los asignables (integrantes, previstos e invitados) con su
 * etiqueta, sin el usuario actual cuando `excludeUserId` viene (ya lo cubre «Mis carpetas»).
 */
export function responsableOptions(assignees: TeamAssignee[], excludeUserId?: string): ResponsableOption[] {
	return assignees
		.filter((a) => !excludeUserId || a.id !== excludeUserId)
		.map((a) => {
			const tag = assigneeTag(a);
			return { id: a.id, name: tag ? `${a.name} (${tag})` : a.name };
		});
}
