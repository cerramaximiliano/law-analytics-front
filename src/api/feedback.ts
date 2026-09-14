import axios from "utils/axios";

// Tipos compartidos con server/admin (subset usado en el front user)

export type FeedbackType = "comment" | "survey_response" | "nps" | "rating" | "suggestion" | "bug";
export type FeedbackStatus = "pending" | "approved" | "rejected" | "published" | "archived";
export type QuestionType = "text" | "long_text" | "rating" | "scale" | "single_choice" | "multi_choice" | "boolean";

export interface FeedbackAnswer {
	questionId: string;
	valueType: "text" | "number" | "rating" | "scale" | "single_choice" | "multi_choice" | "boolean";
	valueText?: string | null;
	valueNumber?: number | null;
	valueArray?: string[];
	valueBoolean?: boolean | null;
}

export interface FeedbackConsent {
	allowPublish: boolean;
	allowContact: boolean;
	displayName?: string | null;
}

export interface FeedbackContext {
	page?: string | null;
	feature?: string | null;
	appVersion?: string | null;
}

export interface CreateFeedbackPayload {
	type?: FeedbackType;
	title?: string | null;
	content?: string;
	rating?: number | null;
	tags?: string[];
	consent?: FeedbackConsent;
	context?: FeedbackContext;
	surveyId?: string;
	answers?: FeedbackAnswer[];
	metadata?: Record<string, any>;
}

export interface UserFeedback {
	_id: string;
	type: FeedbackType;
	title?: string | null;
	content: string;
	rating?: number | null;
	tags: string[];
	status: FeedbackStatus;
	consent: FeedbackConsent;
	createdAt: string;
	moderation?: {
		publishedAt?: string | null;
		rejectionReason?: string | null;
	};
}

export interface PublicTestimonial {
	_id: string;
	type: FeedbackType;
	title?: string | null;
	content: string;
	rating?: number | null;
	tags: string[];
	publishedAt?: string | null;
	displayName: string;
}

class FeedbackService {
	// Autenticado
	static async create(payload: CreateFeedbackPayload): Promise<{ success: boolean; feedback: UserFeedback }> {
		const { data } = await axios.post("/api/feedback", payload);
		return data;
	}

	static async getMine(params: { page?: number; limit?: number; type?: FeedbackType; status?: FeedbackStatus } = {}) {
		const qs = new URLSearchParams();
		Object.entries(params).forEach(([k, v]) => v !== undefined && qs.append(k, String(v)));
		const { data } = await axios.get(`/api/feedback/me?${qs.toString()}`);
		return data as { success: boolean; items: UserFeedback[]; total: number; page: number; limit: number };
	}

	static async withdraw(id: string) {
		const { data } = await axios.delete(`/api/feedback/${id}`);
		return data as { success: boolean; message: string };
	}

	// Público (sin auth)
	static async getPublic(params: { limit?: number; type?: FeedbackType; surveyId?: string } = {}) {
		const qs = new URLSearchParams();
		Object.entries(params).forEach(([k, v]) => v !== undefined && qs.append(k, String(v)));
		const { data } = await axios.get(`/api/feedback/public?${qs.toString()}`);
		return data as { success: boolean; items: PublicTestimonial[]; total: number };
	}
}

export default FeedbackService;
