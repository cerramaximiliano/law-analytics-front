import axios from "utils/axios";
import { Survey } from "./surveys";
import { FeedbackAnswer, FeedbackConsent } from "./feedback";

export interface PublicInvite {
	token: string;
	type: "comment" | "survey";
	message?: string | null;
	recipientName?: string | null;
	expiresAt: string;
	survey: Pick<Survey, "_id" | "title" | "slug" | "description" | "questions"> | null;
}

export interface SubmitInvitePayload {
	title?: string | null;
	content?: string;
	rating?: number | null;
	answers?: FeedbackAnswer[];
	consent?: FeedbackConsent;
	submittedAs?: { name?: string; email?: string };
}

export interface ValidateInviteError {
	success: false;
	message: string;
	reason?: "revoked" | "used" | "expired" | "survey_unavailable";
}

class FeedbackInviteService {
	static async validate(token: string) {
		const { data } = await axios.get(`/api/public/feedback/invite/${encodeURIComponent(token)}`);
		return data as { success: true; invite: PublicInvite };
	}

	static async submit(token: string, payload: SubmitInvitePayload) {
		const { data } = await axios.post(`/api/public/feedback/invite/${encodeURIComponent(token)}`, payload);
		return data as { success: true; message: string; feedbackId: string };
	}
}

export default FeedbackInviteService;
