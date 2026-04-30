export interface PdfTemplateField {
	pdfFieldName?: string;
	name: string;
	label: string;
	type: "text" | "multiline" | "date" | "radio" | "checkbox" | "flow-section";
	group: string;
	required: boolean;
	placeholder?: string;
	options?: string[];
	order: number;
	// Overlay positioning (fillMethod: 'overlay')
	x?: number;
	y?: number;
	maxWidth?: number;
	minY?: number;
	overflowPage?: boolean;
	fontSize?: number;
	// Flow section
	inFlowSection?: boolean;
	wrapX?: number;
	wrapMaxWidth?: number;
	whiteOut?: { x: number; y: number; w: number; h: number };
	segments?: Array<{ text?: string; field?: string; newLine?: boolean; concat?: any[] }>;
}

export interface PdfTemplate {
	_id: string;
	name: string;
	slug: string;
	description: string;
	category: string;
	s3Key: string;
	fields: PdfTemplateField[];
	isActive: boolean;
	isPublic: boolean;
	source?: "system" | "user";
	modelType?: "static" | "dynamic";
	supportsTracking?: boolean;
	fillMethod?: "acroform" | "overlay";
	userId?: string;
	fillConfig: { flatten: boolean };
	previewUrl?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface PostalDocumentType {
	_id: string;
	userId: string;
	pdfTemplateId: string;
	templateSlug: string;
	templateName: string;
	templateCategory: string;
	supportsTracking?: boolean;
	title: string;
	description?: string;
	formData: Record<string, string>;
	s3Key?: string | null;
	status: "draft" | "generated" | "sent" | "archived";
	generatedAt?: string | null;
	linkedTrackingId?: string | null;
	linkedFolderId?: string | null;
	linkedContactId?: string | null;
	tags?: string[];
	sentAt?: string | null;
	sentVia?: string | null;
	documentUrl?: string;
	createdAt?: string;
	updatedAt?: string;
}
