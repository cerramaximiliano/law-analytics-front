// GET /api/folders/:folderId/vinculados — incidentes del principal PJN según la
// pestaña "Vinculados" del portal público (la captura pjn-workers en app-update).
// Solo filas de la pestaña + estado por fila para este usuario; sin contenido de docs.

export type PjnVinculadoState = "seguida" | "reservada" | "retirada" | "disponible";

export interface PjnVinculadoRow {
	incidente: string; // sufijo canónico ("1", "42/2")
	expediente: string | null; // celda cruda ("COM 023063/2015/1")
	caratula: string | null; // carátula de la fila (puede venir cortada)
	dependencia: string | null;
	situacion: string | null;
	ultAct: string | null; // ISO, solo día
	goneAt: string | null; // dejó de figurar en la pestaña
	state: PjnVinculadoState;
	folderId: string | null; // carpeta del usuario sobre ese incidente (state 'seguida')
	folderArchived: boolean | null;
	folderSource: string | null;
}

export interface PjnVinculadosMeta {
	capturedAt: string | null;
	total: number | null; // total que declara el portal
	pages: number | null;
	pagesRead: number | null;
	portalMsg: string | null; // "El expediente no posee vinculados…"
}

export interface PjnVinculadosResponse {
	success: boolean;
	data: {
		principal: {
			number: number;
			year: number;
			fuero: string;
			caratula?: string | null;
			incidente?: string;
			folderId?: string | null; // carpeta del usuario sobre el principal (breadcrumb, reason es_incidente)
			folderArchived?: boolean | null;
		} | null;
		alta?: { pjnCode: string | null; folderFuero: string | null }; // datos para "Seguir"
		meta: PjnVinculadosMeta | null;
		vinculados: PjnVinculadoRow[];
		reason?: "sin_causa_pjn" | "fuero_sin_vinculados" | "causa_no_encontrada" | "es_incidente";
	};
}
