import axios from "utils/axios";
import { FeedbackAnswer, FeedbackConsent, FeedbackContext, QuestionType } from "./feedback";

export interface SurveyQuestionOption {
	value: string;
	label: string;
}

export interface SurveyQuestion {
	id: string;
	type: QuestionType;
	question: string;
	description?: string | null;
	required: boolean;
	options?: SurveyQuestionOption[];
	min?: number | null;
	max?: number | null;
	minLabel?: string | null;
	maxLabel?: string | null;
	order?: number;
}

export interface Survey {
	_id: string;
	title: string;
	slug: string;
	description?: string | null;
	type: "nps" | "csat" | "custom" | "poll" | "onboarding" | "churn";
	questions: SurveyQuestion[];
	status: "draft" | "active" | "paused" | "closed";
	startDate?: string | null;
	endDate?: string | null;
	allowMultipleResponses: boolean;
}

export interface RespondSurveyPayload {
	answers: FeedbackAnswer[];
	content?: string;
	rating?: number | null;
	consent?: FeedbackConsent;
	context?: FeedbackContext;
	metadata?: Record<string, any>;
}

class SurveyService {
	static async getActive() {
		const { data } = await axios.get("/api/surveys/active");
		return data as { success: boolean; surveys: Survey[] };
	}

	static async getBySlug(slug: string) {
		const { data } = await axios.get(`/api/surveys/${encodeURIComponent(slug)}`);
		return data as { success: boolean; survey: Survey };
	}

	static async respond(id: string, payload: RespondSurveyPayload) {
		const { data } = await axios.post(`/api/surveys/${id}/respond`, payload);
		return data as { success: boolean; feedback: any };
	}
}

export default SurveyService;
