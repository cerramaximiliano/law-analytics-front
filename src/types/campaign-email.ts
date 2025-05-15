// Interfaces for Campaign Email functionality

export interface EmailContent {
	html?: string;
	text?: string;
}

export interface EmailSender {
	name: string;
	email: string;
}

export interface SendingRestrictions {
	daysOfWeek?: number[];
	timeStart?: string;
	timeEnd?: string;
	timezone?: string;
}

export interface EmailTracking {
	opens?: boolean;
	clicks?: boolean;
	customTracking?: Record<string, any>;
}

export interface ABTestingConfig {
	enabled: boolean;
	variants?: {
		id: string;
		name: string;
		subject?: string;
		content?: EmailContent;
		weight: number;
	}[];
	testDuration?: {
		value: number;
		unit: string;
	};
	winnerCriteria?: string;
}

export type EmailStatus = "draft" | "active" | "paused" | "completed";

export interface EmailMetrics {
	opens?: number;
	sent?: number;
	clicks?: number;
	bounces?: number;
	unsubscribes?: number;
	complaints?: number;
}

export interface CampaignEmail {
	_id?: string;
	campaignId: string;
	name: string;
	sequenceIndex: number;
	subject: string;
	templateId?: string;
	content?: EmailContent;
	sender?: EmailSender;
	replyTo?: string;
	conditions?: Record<string, any>;
	sendingRestrictions?: SendingRestrictions;
	variables?: Record<string, any>;
	isFinal?: boolean;
	tracking?: EmailTracking;
	abTesting?: ABTestingConfig;
	status?: EmailStatus;
	metrics?: EmailMetrics;
	createdAt?: Date | string;
	updatedAt?: Date | string;
}

// Interface for API responses
export interface CampaignEmailResponse {
	success: boolean;
	data: CampaignEmail[];
	total?: number;
	page?: number;
	limit?: number;
	message?: string;
}

// Interface for single email response
export interface SingleCampaignEmailResponse {
	success: boolean;
	data: CampaignEmail;
	message?: string;
}

// Interface for campaign email creation/update
export interface CampaignEmailInput {
	campaignId: string;
	name: string;
	sequenceIndex: number;
	subject: string;
	templateId?: string;
	content?: EmailContent;
	sender?: EmailSender;
	replyTo?: string;
	conditions?: Record<string, any>;
	sendingRestrictions?: SendingRestrictions;
	variables?: Record<string, any>;
	isFinal?: boolean;
	tracking?: EmailTracking;
	abTesting?: ABTestingConfig;
	status?: EmailStatus;
}
