export interface CombinedActivity {
	_id: string;
	type: "movement" | "notification" | "event";
	title: string;
	description?: string;
	date: string;
	folderId: string;
	userId: string;
	createdAt: string;
	updatedAt: string;

	// Campos específicos de Movement
	movement?: string;
	time?: string;
	dateExpiration?: string;
	link?: string;
	source?: "pjn" | "manual";

	// Campos específicos de Notification
	notification?: string;
	user?: string;
	status?: string;

	// Campos específicos de Event
	eventType?: string;
	start?: string;
	end?: string;
	allDay?: boolean;
	location?: string;

	// Metadatos para UI
	icon?: string;
	color?: string;
	priority?: "high" | "medium" | "low";
}

export interface ActivityStats {
	totalByType: {
		movements: number;
		notifications: number;
		events: number;
	};
	totalWithLinks: number;
	totalWithExpiration: number;
	upcomingExpirations: number;
	todayCount: number;
	thisWeekCount: number;
}

export interface DocumentsInfo {
	totalWithLinks: number;
	documentsBeforeThisPage: number;
	documentsInThisPage: number;
}

export interface PaginationInfo {
	total: number;
	page: number;
	limit: number;
	pages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface CombinedActivitiesResponse {
	success: boolean;
	data?: {
		activities: CombinedActivity[];
		pagination: PaginationInfo;
		stats?: ActivityStats;
		documentsInfo?: DocumentsInfo;
	};
	message?: string;
}

export interface CombinedActivitiesState {
	activities: CombinedActivity[];
	pagination?: PaginationInfo;
	stats?: ActivityStats;
	documentsInfo?: DocumentsInfo;
	isLoading: boolean;
	error?: string;
}

export interface ActivityQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	sort?: string;
	filter?: {
		types?: string[];
		dateRange?: string;
		hasExpiration?: boolean;
		hasLink?: boolean;
		sources?: string[];
		movements?: string[];
		notifications?: string[];
		eventTypes?: string[];
	};
}