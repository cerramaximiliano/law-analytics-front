export interface PostalTrackingHistoryEvent {
	eventDate?: string;
	status: string;
	deliveryStatus?: string;
	location?: string;
}

export interface PostalTrackingType {
	_id: string;
	codeId: string;
	numberId: string;
	label?: string | null;
	tags: string[];
	userId: string;
	folderId?: string | null;
	movementId?: string | null;
	notificationId?: string | null;
	documentId?: string | null;
	attachment?: string | null;
	notificationDate?: string | null;
	deadlineDays?: number | null;
	processingStatus: "pending" | "active" | "completed" | "paused" | "error" | "not_found";
	screenshotEnabled?: boolean;
	trackingStatus?: string | null;
	deliveryStatus?: string | null;
	isFinalStatus: boolean;
	history: PostalTrackingHistoryEvent[];
	startDate?: string | null;
	lastCheckedAt?: string | null;
	lastChangedAt?: string | null;
	nextCheckAt?: string | null;
	checkCount: number;
	manuallyCompleted?: boolean | null;
	autoCompletedReason?: string | null;
	screenshotKey?: string | null;
	screenshotUrl?: string | null;
	screenshotUpdatedAt?: string | null;
	attachmentKey?: string | null;
	attachmentUrl?: string | null;
	attachmentUpdatedAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PostalTrackingState {
	trackings: PostalTrackingType[];
	tracking: PostalTrackingType | null;
	isLoader: boolean;
	error: string | null;
	total: number;
	page: number;
	totalPages: number;
	// Cache plano para autocompletes — no se sobreescribe con llamadas paginadas
	allTrackings: PostalTrackingType[];
	allTrackingsCachedAt: number; // timestamp ms, 0 = nunca cargado
}

export interface PostalTrackingFilters {
	page?: number;
	limit?: number;
	processingStatus?: string;
	isFinalStatus?: boolean;
	search?: string;
	sortBy?: "label" | "createdAt";
	sortOrder?: "asc" | "desc";
}

export interface CreatePostalTrackingData {
	codeId: string;
	numberId: string;
	label?: string;
	tags?: string[];
	folderId?: string;
	movementId?: string;
	notificationId?: string;
	documentId?: string;
	screenshotEnabled?: boolean;
}

export interface UpdatePostalTrackingData {
	label?: string | null;
	tags?: string[];
	folderId?: string | null;
	documentId?: string | null;
}
