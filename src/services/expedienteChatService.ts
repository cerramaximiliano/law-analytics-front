// Service del chat con IA sobre el expediente (feature "expediente_chat").
//
//   Hub        GET  /api/expediente-chat/access      ¿este usuario puede usar el chat?
//   RAG API    GET  /rag/index/status/:causaId       ¿la causa ya está indexada?
//   RAG API    POST /rag/chat/message                mensaje con respuesta en streaming (SSE)
//
// El acceso lo decide el hub (interruptor por entorno + grant beta + plan) y
// la RAG API vuelve a aplicarlo antes de responder: el front solo muestra u
// oculta, no es la barrera.

import axios from "axios";
import ragAxios from "utils/ragAxios";
import secureStorage from "services/secureStorage";

export type ExpedienteChatReason = "grant" | "plan" | "disabled" | "beta_closed" | "plan_required";

export interface ExpedienteChatAccess {
	allowed: boolean;
	reason: ExpedienteChatReason;
	releaseStage: "beta" | "stable";
	maintenanceMessage: string | null;
}

export const NO_CHAT_ACCESS: ExpedienteChatAccess = { allowed: false, reason: "disabled", releaseStage: "beta", maintenanceMessage: null };

function getBaseUrl(): string {
	// Mismo patrón que pjnMovementsService.ts
	if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && window.location.hostname === "lawanalytics.app") {
		return "https://server.lawanalytics.app";
	}
	return "";
}

export async function getExpedienteChatAccess(): Promise<ExpedienteChatAccess> {
	const response = await axios.get<{ success: boolean; access: ExpedienteChatAccess }>(`${getBaseUrl()}/api/expediente-chat/access`, {
		withCredentials: true,
	});
	return response.data?.access ?? NO_CHAT_ACCESS;
}

// Estado del índice de la causa. `indexed` es el único en el que se puede chatear.
export type ExpedienteIndexStatus = "none" | "pending" | "indexing" | "indexed" | "error" | "outdated" | "deleting";

export interface ExpedienteIndexInfo {
	status: ExpedienteIndexStatus;
	documentsTotal: number;
	documentsProcessed: number;
}

export async function getExpedienteIndexStatus(causaId: string): Promise<ExpedienteIndexInfo> {
	const response = await ragAxios.get(`/rag/index/status/${causaId}`);
	const data = response.data?.data;
	if (!data) return { status: "none", documentsTotal: 0, documentsProcessed: 0 };
	return {
		status: data.status || "none",
		documentsTotal: data.documentsTotal || 0,
		documentsProcessed: data.documentsProcessed || 0,
	};
}

export interface ExpedienteChatCitation {
	documentId: string;
	docType?: string;
	docDate?: string;
	page?: number;
	sourceUrl?: string | null;
}

export interface SendMessageParams {
	causaId: string;
	causaType?: string;
	folderId: string;
	conversationId?: string | null;
	message: string;
	signal?: AbortSignal;
	onStart?: (conversationId: string) => void;
	onChunk: (text: string) => void;
}

export interface SendMessageResult {
	conversationId: string | null;
	citations: ExpedienteChatCitation[];
}

export class ExpedienteChatError extends Error {
	code?: string;
	constructor(message: string, code?: string) {
		super(message);
		this.code = code;
	}
}

// Envía un mensaje y va entregando la respuesta por onChunk. La RAG API
// responde con SSE sobre un POST, así que se lee el stream con fetch (axios
// no expone el cuerpo incremental en el browser).
export async function sendExpedienteChatMessage(params: SendMessageParams): Promise<SendMessageResult> {
	const base = String(ragAxios.defaults.baseURL || "").replace(/\/$/, "");
	const token = secureStorage.getAuthToken();
	const response = await fetch(`${base}/rag/chat/message`, {
		method: "POST",
		credentials: "include",
		signal: params.signal,
		headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: JSON.stringify({
			message: params.message,
			causaId: params.causaId,
			causaType: params.causaType,
			folderId: params.folderId,
			conversationId: params.conversationId || undefined,
			stream: true,
		}),
	});

	if (!response.ok || !response.body) {
		let code: string | undefined;
		let message = "No pudimos enviar tu consulta. Intentá de nuevo en unos minutos.";
		try {
			const body = await response.json();
			code = body?.code;
			if (code === "EXPEDIENTE_CHAT_NOT_ALLOWED") message = "El chat con IA no está disponible para tu cuenta.";
			else if (code === "CAUSA_NOT_ALLOWED") message = "Esta causa no está disponible para el chat.";
			else if (response.status === 429) message = "Llegaste al límite de consultas. Probá de nuevo más tarde.";
		} catch (_err) {
			// cuerpo no JSON: queda el mensaje genérico
		}
		throw new ExpedienteChatError(message, code);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let conversationId: string | null = params.conversationId || null;
	let citations: ExpedienteChatCitation[] = [];

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const events = buffer.split("\n\n");
		buffer = events.pop() || "";
		for (const raw of events) {
			const line = raw.split("\n").find((l) => l.startsWith("data:"));
			if (!line) continue;
			let event: any;
			try {
				event = JSON.parse(line.slice(5).trim());
			} catch (_err) {
				continue;
			}
			if (event.type === "start" && event.conversationId) {
				conversationId = event.conversationId;
				params.onStart?.(event.conversationId);
			} else if (event.type === "chunk" && event.text) {
				params.onChunk(event.text);
			} else if (event.type === "done") {
				citations = Array.isArray(event.citations) ? event.citations : [];
			} else if (event.type === "error") {
				throw new ExpedienteChatError("No pudimos generar la respuesta. Intentá de nuevo.");
			}
		}
	}
	return { conversationId, citations };
}
