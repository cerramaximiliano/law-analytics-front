// Interfaces for Marketing Contact schema structure
export interface ContactTag {
	id: string;
	name: string;
	color?: string;
}

export interface ContactCustomField {
	name: string;
	value: any;
}

export type ContactStatus = "active" | "unsubscribed" | "bounced" | "complained";

export interface EmailEngagementMetrics {
	sent: number;
	opens: number;
	clicks: number;
	openRate: number;
	clickRate: number;
}

export interface ContactActivity {
	type: string;
	timestamp: Date | string;
	metadata?: {
		oldStatus?: string;
		newStatus?: string;
		source?: string;
		[key: string]: any;
	};
}

export interface CampaignMembership {
	campaignId: string;
	status: string;
	currentStep?: number;
	joinedAt: Date | string;
	completedAt?: Date | string;
	campaignName?: string;
}

export interface MarketingContact {
	_id?: string;
	email: string;
	firstName?: string;
	lastName?: string;
	status: ContactStatus;
	phone?: string;
	company?: string;
	position?: string;
	tags: ContactTag[];
	customFields: ContactCustomField[];
	lastActivity?: Date | string;
	totalCampaigns?: number;
	campaignCount?: number;
	campaigns?: string[]; // IDs de las campañas asociadas
	campaignMemberships?: CampaignMembership[]; // Detalles de las campañas a las que pertenece
	segments?: string[]; // IDs de los segmentos a los que pertenece el contacto
	metrics?: EmailEngagementMetrics;
	openRate?: number;
	clickRate?: number;
	source?: string; // Origen del contacto (importación, formulario, etc.)
	activities?: ContactActivity[]; // Actividades del contacto
	geolocation?: {
		country?: string;
		region?: string;
		city?: string;
	};
	deviceInfo?: {
		browser?: string;
		os?: string;
		deviceType?: string;
	};
	createdAt?: Date | string;
	updatedAt?: Date | string;
}

// Interface for API responses
export interface ContactResponse {
	success: boolean;
	data: MarketingContact[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
	message?: string;
}

// Interface for single contact response
export interface SingleContactResponse {
	success: boolean;
	data: MarketingContact;
	message?: string;
}

// Interface for contact creation/update
export interface ContactInput {
	email: string;
	firstName?: string;
	lastName?: string;
	status?: ContactStatus;
	phone?: string;
	company?: string;
	position?: string;
	tags?: string[] | ContactTag[];
	customFields?: ContactCustomField[];
}
