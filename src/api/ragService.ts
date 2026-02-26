import axios from "axios";
import {
	RagConversation,
	RagMessage,
	RagIndexStatus,
	SendMessageRequest,
	IndexCausaRequest,
	ConversationListParams,
	RagStreamEvent,
} from "types/rag";

const BASE_URL = import.meta.env.VITE_APP_RAG_URL || import.meta.env.VITE_BASE_URL;

// ==============================|| RAG API SERVICE ||============================== //

/**
 * Send a message via SSE streaming
 * Returns an EventSource-like reader for processing stream events
 */
export async function sendMessageStreaming(
	data: SendMessageRequest,
	onEvent: (event: RagStreamEvent) => void,
	onError: (error: string) => void,
): Promise<void> {
	try {
		const response = await fetch(`${BASE_URL}/rag/chat/message`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ ...data, stream: true }),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `HTTP ${response.status}`);
		}

		const reader = response.body?.getReader();
		if (!reader) throw new Error("No response body");

		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });

			// Process complete SSE events
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					try {
						const event: RagStreamEvent = JSON.parse(line.slice(6));
						onEvent(event);
					} catch {
						// skip malformed events
					}
				}
			}
		}
	} catch (error: any) {
		onError(error.message || "Error en la conexión con el servidor");
	}
}

/**
 * Send a message without streaming (JSON response)
 */
export async function sendMessage(data: SendMessageRequest): Promise<{
	success: boolean;
	data?: {
		conversationId: string;
		userMessage: RagMessage;
		assistantMessage: RagMessage;
	};
	error?: string;
}> {
	try {
		const response = await axios.post(`${BASE_URL}/rag/chat/message`, { ...data, stream: false }, { withCredentials: true });
		return response.data;
	} catch (error: any) {
		return {
			success: false,
			error: error.response?.data?.error || "Error al enviar mensaje",
		};
	}
}

/**
 * Get conversations list
 */
export async function getConversations(
	params: ConversationListParams = {},
): Promise<{ success: boolean; data?: RagConversation[]; pagination?: any; error?: string }> {
	try {
		const response = await axios.get(`${BASE_URL}/rag/chat/conversations`, {
			params,
			withCredentials: true,
		});
		return response.data;
	} catch (error: any) {
		return {
			success: false,
			error: error.response?.data?.error || "Error al obtener conversaciones",
		};
	}
}

/**
 * Get a conversation with its messages
 */
export async function getConversationWithMessages(conversationId: string): Promise<{
	success: boolean;
	data?: { conversation: RagConversation; messages: RagMessage[] };
	error?: string;
}> {
	try {
		const response = await axios.get(`${BASE_URL}/rag/chat/conversations/${conversationId}`, {
			withCredentials: true,
		});
		return response.data;
	} catch (error: any) {
		return {
			success: false,
			error: error.response?.data?.error || "Error al obtener conversación",
		};
	}
}

/**
 * Archive a conversation
 */
export async function archiveConversation(conversationId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await axios.delete(`${BASE_URL}/rag/chat/conversations/${conversationId}`, {
			withCredentials: true,
		});
		return response.data;
	} catch (error: any) {
		return {
			success: false,
			error: error.response?.data?.error || "Error al archivar conversación",
		};
	}
}

/**
 * Trigger causa indexation
 */
export async function indexCausa(
	causaId: string,
	data: IndexCausaRequest,
): Promise<{ success: boolean; data?: RagIndexStatus; message?: string; error?: string }> {
	try {
		const response = await axios.post(`${BASE_URL}/rag/index/causa/${causaId}`, data, {
			withCredentials: true,
		});
		return response.data;
	} catch (error: any) {
		return {
			success: false,
			error: error.response?.data?.error || "Error al iniciar indexación",
		};
	}
}

/**
 * Get indexation status for a causa
 */
export async function getIndexStatus(causaId: string): Promise<{ success: boolean; data?: RagIndexStatus | null; error?: string }> {
	try {
		const response = await axios.get(`${BASE_URL}/rag/index/status/${causaId}`, {
			withCredentials: true,
		});
		return response.data;
	} catch (error: any) {
		return {
			success: false,
			error: error.response?.data?.error || "Error al obtener estado de indexación",
		};
	}
}

/**
 * Delete index for a causa
 */
export async function deleteIndex(causaId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await axios.delete(`${BASE_URL}/rag/index/causa/${causaId}`, {
			withCredentials: true,
		});
		return response.data;
	} catch (error: any) {
		return {
			success: false,
			error: error.response?.data?.error || "Error al eliminar índice",
		};
	}
}
