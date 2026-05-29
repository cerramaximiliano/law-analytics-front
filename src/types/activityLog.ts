// Types for Activity Log (Audit Trail) system

export type ActivityResourceType =
	| "folder"
	| "contact"
	| "note"
	| "event"
	| "task"
	| "calculator"
	| "document"
	| "movement"
	| "expense"
	| "availability";

export type ActivityAction =
	| "created"
	| "updated"
	| "archived"
	| "restored"
	| "deleted"
	| "viewed"
	| "exported"
	| "shared"
	| "unshared"
	| "commented"
	| "attached"
	| "detached";

export interface ActivityChange {
	field: string;
	oldValue: any;
	newValue: any;
}

export interface PerformedByInfo {
	firstName?: string;
	lastName?: string;
	email?: string;
}

export interface ActivityLogEntry {
	_id: string;
	resourceType: ActivityResourceType;
	resourceId: string;
	resourceName?: string;
	action: ActivityAction;
	performedBy: string;
	performedByInfo?: PerformedByInfo;
	resourceOwner?: string;
	groupId?: string;
	folderId?: string;
	changes?: ActivityChange[];
	metadata?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	createdAt: string;
}

export interface ActivityLogPagination {
	total: number;
	page: number;
	limit: number;
	pages: number;
	hasNext?: boolean;
	hasPrev?: boolean;
}

export interface ActivityLogStats {
	total: number;
	byAction: Record<ActivityAction, number>;
	byResourceType: Record<ActivityResourceType, number>;
	byUser?: Array<{
		userId: string;
		name: string;
		count: number;
	}>;
}

export interface ActivityLogResponse {
	success: boolean;
	activity?: ActivityLogEntry[];
	pagination?: ActivityLogPagination;
	stats?: ActivityLogStats;
	message?: string;
}

export interface ActivityLogState {
	logs: ActivityLogEntry[];
	pagination?: ActivityLogPagination;
	stats?: ActivityLogStats;
	isLoading: boolean;
	error?: string;
	// Cache tracking fields
	lastFetchedFolderId?: string;
	lastFetchParams?: string; // JSON serialized params for comparison
}

export interface ActivityLogQueryParams {
	page?: number;
	limit?: number;
	resourceType?: ActivityResourceType;
	action?: ActivityAction;
	startDate?: string;
	endDate?: string;
}

// UI Display helpers
export const RESOURCE_TYPE_LABELS: Record<ActivityResourceType, string> = {
	folder: "Causa",
	contact: "Contacto",
	note: "Nota",
	event: "Evento",
	task: "Tarea",
	calculator: "Cálculo",
	document: "Documento",
	movement: "Movimiento",
	expense: "Gasto",
	availability: "Disponibilidad",
};

export const ACTION_LABELS: Record<ActivityAction, string> = {
	created: "creó",
	updated: "actualizó",
	archived: "archivó",
	restored: "restauró",
	deleted: "eliminó",
	viewed: "visualizó",
	exported: "exportó",
	shared: "compartió",
	unshared: "dejó de compartir",
	commented: "comentó en",
	attached: "adjuntó a",
	detached: "desadjuntó de",
};

export const ACTION_COLORS: Record<ActivityAction, "success" | "info" | "warning" | "error" | "default"> = {
	created: "success",
	updated: "info",
	archived: "warning",
	restored: "success",
	deleted: "error",
	viewed: "default",
	exported: "info",
	shared: "success",
	unshared: "warning",
	commented: "info",
	attached: "info",
	detached: "warning",
};

// Helper function to format user name
export const formatPerformedBy = (info?: PerformedByInfo): string => {
	if (!info) return "Usuario desconocido";
	if (info.firstName && info.lastName) {
		return `${info.firstName} ${info.lastName}`;
	}
	if (info.firstName) return info.firstName;
	if (info.email) return info.email;
	return "Usuario desconocido";
};

// Helper function to format activity message
export const formatActivityMessage = (entry: ActivityLogEntry): string => {
	const userName = formatPerformedBy(entry.performedByInfo);
	const action = ACTION_LABELS[entry.action] || entry.action;
	const resourceType = RESOURCE_TYPE_LABELS[entry.resourceType] || entry.resourceType;
	const resourceName = entry.resourceName ? `"${entry.resourceName}"` : "";

	return `${userName} ${action} ${resourceType} ${resourceName}`.trim();
};
