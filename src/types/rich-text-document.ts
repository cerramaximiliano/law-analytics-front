// ==============================|| RICH TEXT TEMPLATES & DOCUMENTS ||============================== //

export type RichTextTemplateCategory = "laboral" | "civil" | "penal" | "societario" | "familia" | "otro";
export type RichTextTemplateSource = "system" | "user";
export type RichTextDocumentStatus = "draft" | "final";

// ── Templates ──────────────────────────────────────────────────────────────────

export interface RichTextTemplate {
	_id: string;
	userId: string;
	groupId?: string | null;
	name: string;
	description: string;
	category: RichTextTemplateCategory;
	content: Record<string, unknown>; // TipTap JSON
	mergeFields: string[];            // keys used: ['cliente.nombre', ...]
	isPublic: boolean;
	isActive: boolean;
	source: RichTextTemplateSource;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateRichTextTemplatePayload {
	name: string;
	description?: string;
	category?: RichTextTemplateCategory;
	content?: Record<string, unknown>;
	mergeFields?: string[];
	isPublic?: boolean;
}

export interface UpdateRichTextTemplatePayload extends Partial<CreateRichTextTemplatePayload> {}

export interface RichTextTemplatesQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	category?: RichTextTemplateCategory;
	source?: "system" | "user" | "all";
}

// ── Documents ──────────────────────────────────────────────────────────────────

export interface RichTextDocument {
	_id: string;
	userId: string;
	groupId?: string | null;
	templateId?: string | null;
	templateName: string;
	templateCategory: string;
	title: string;
	content: Record<string, unknown>; // TipTap JSON (resolved)
	formData: Record<string, string>; // merge field values used
	status: RichTextDocumentStatus;
	linkedFolderId?: string | null;
	linkedContactId?: string | null;
	tags?: string[];
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateRichTextDocumentPayload {
	templateId?: string;
	title: string;
	content: Record<string, unknown>;
	formData?: Record<string, string>;
	status?: RichTextDocumentStatus;
	linkedFolderId?: string;
	linkedContactId?: string;
	tags?: string[];
}

export interface UpdateRichTextDocumentPayload extends Partial<CreateRichTextDocumentPayload> {}

export interface RichTextDocumentsQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: RichTextDocumentStatus;
	templateId?: string;
}

// ── Merge field resolution ────────────────────────────────────────────────────

export interface ResolveFieldsPayload {
	folderId?: string;
	contactId?: string;    // cliente
	contraparteId?: string;
}

export type ResolvedFields = Record<string, string>;
