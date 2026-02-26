import { Dispatch } from "redux";
import {
	RagState,
	RagConversation,
	RagMessage,
	RagIndexStatus,
	RagStreamEvent,
	SendMessageRequest,
	ConversationListParams,
	IndexCausaRequest,
} from "types/rag";
import * as ragApi from "api/ragService";

// ==============================|| RAG REDUCER CONSTANTS ||============================== //

export const RAG_SET_LOADING = "rag/SET_LOADING";
export const RAG_SET_ERROR = "rag/SET_ERROR";
export const RAG_CLEAR_ERROR = "rag/CLEAR_ERROR";

// Conversations
export const RAG_SET_CONVERSATIONS = "rag/SET_CONVERSATIONS";
export const RAG_SET_ACTIVE_CONVERSATION = "rag/SET_ACTIVE_CONVERSATION";
export const RAG_CLEAR_ACTIVE_CONVERSATION = "rag/CLEAR_ACTIVE_CONVERSATION";
export const RAG_ARCHIVE_CONVERSATION = "rag/ARCHIVE_CONVERSATION";

// Messages
export const RAG_SET_MESSAGES = "rag/SET_MESSAGES";
export const RAG_ADD_MESSAGE = "rag/ADD_MESSAGE";
export const RAG_UPDATE_MESSAGE = "rag/UPDATE_MESSAGE";

// Streaming
export const RAG_STREAM_START = "rag/STREAM_START";
export const RAG_STREAM_CHUNK = "rag/STREAM_CHUNK";
export const RAG_STREAM_DONE = "rag/STREAM_DONE";
export const RAG_STREAM_ERROR = "rag/STREAM_ERROR";

// Indexation
export const RAG_SET_INDEX_STATUS = "rag/SET_INDEX_STATUS";
export const RAG_SET_INDEXING = "rag/SET_INDEXING";

// ==============================|| INITIAL STATE ||============================== //

const initialState: RagState = {
	conversations: [],
	activeConversation: null,
	messages: [],
	isStreaming: false,
	streamingContent: "",
	indexStatus: null,
	isLoadingConversations: false,
	isLoadingMessages: false,
	isLoadingIndex: false,
	isSendingMessage: false,
	isIndexing: false,
	error: null,
};

// ==============================|| RAG REDUCER ||============================== //

const rag = (state = initialState, action: any): RagState => {
	switch (action.type) {
		// Loading states
		case RAG_SET_LOADING:
			return { ...state, [action.payload.key]: action.payload.value };

		case RAG_SET_ERROR:
			return { ...state, error: action.payload, isSendingMessage: false, isStreaming: false };

		case RAG_CLEAR_ERROR:
			return { ...state, error: null };

		// Conversations
		case RAG_SET_CONVERSATIONS:
			return { ...state, conversations: action.payload, isLoadingConversations: false };

		case RAG_SET_ACTIVE_CONVERSATION:
			return { ...state, activeConversation: action.payload };

		case RAG_CLEAR_ACTIVE_CONVERSATION:
			return { ...state, activeConversation: null, messages: [], streamingContent: "" };

		case RAG_ARCHIVE_CONVERSATION:
			return {
				...state,
				conversations: state.conversations.filter((c) => c._id !== action.payload),
				activeConversation: state.activeConversation?._id === action.payload ? null : state.activeConversation,
				messages: state.activeConversation?._id === action.payload ? [] : state.messages,
			};

		// Messages
		case RAG_SET_MESSAGES:
			return { ...state, messages: action.payload, isLoadingMessages: false };

		case RAG_ADD_MESSAGE:
			return { ...state, messages: [...state.messages, action.payload] };

		case RAG_UPDATE_MESSAGE:
			return {
				...state,
				messages: state.messages.map((m) => (m._id === action.payload._id ? { ...m, ...action.payload } : m)),
			};

		// Streaming
		case RAG_STREAM_START:
			return {
				...state,
				isStreaming: true,
				isSendingMessage: true,
				streamingContent: "",
			};

		case RAG_STREAM_CHUNK:
			return {
				...state,
				streamingContent: state.streamingContent + action.payload,
			};

		case RAG_STREAM_DONE:
			return {
				...state,
				isStreaming: false,
				isSendingMessage: false,
				streamingContent: "",
			};

		case RAG_STREAM_ERROR:
			return {
				...state,
				isStreaming: false,
				isSendingMessage: false,
				streamingContent: "",
				error: action.payload,
			};

		// Indexation
		case RAG_SET_INDEX_STATUS:
			return { ...state, indexStatus: action.payload, isLoadingIndex: false, isIndexing: false };

		case RAG_SET_INDEXING:
			return { ...state, isIndexing: action.payload };

		default:
			return state;
	}
};

export default rag;

// ==============================|| ACTION CREATORS ||============================== //

/**
 * Fetch conversations for a causa
 */
export const fetchConversations =
	(params: ConversationListParams) =>
	async (dispatch: Dispatch): Promise<void> => {
		dispatch({ type: RAG_SET_LOADING, payload: { key: "isLoadingConversations", value: true } });

		const result = await ragApi.getConversations(params);
		if (result.success && result.data) {
			dispatch({ type: RAG_SET_CONVERSATIONS, payload: result.data });
		} else {
			dispatch({ type: RAG_SET_ERROR, payload: result.error });
		}
	};

/**
 * Load a conversation with its messages
 */
export const loadConversation =
	(conversationId: string) =>
	async (dispatch: Dispatch): Promise<void> => {
		dispatch({ type: RAG_SET_LOADING, payload: { key: "isLoadingMessages", value: true } });

		const result = await ragApi.getConversationWithMessages(conversationId);
		if (result.success && result.data) {
			dispatch({ type: RAG_SET_ACTIVE_CONVERSATION, payload: result.data.conversation });
			dispatch({ type: RAG_SET_MESSAGES, payload: result.data.messages });
		} else {
			dispatch({ type: RAG_SET_ERROR, payload: result.error });
		}
	};

/**
 * Send a message with SSE streaming
 */
export const sendMessageStreaming =
	(data: SendMessageRequest) =>
	async (dispatch: Dispatch): Promise<void> => {
		dispatch({ type: RAG_STREAM_START });

		// Add optimistic user message
		const tempUserMessage: RagMessage = {
			_id: `temp-${Date.now()}`,
			conversationId: data.conversationId || "",
			role: "user",
			content: data.message,
			createdAt: new Date().toISOString(),
		};
		dispatch({ type: RAG_ADD_MESSAGE, payload: tempUserMessage });

		let assistantMessageId: string | null = null;
		let conversationId: string | null = data.conversationId || null;

		await ragApi.sendMessageStreaming(
			data,
			// onEvent
			(event: RagStreamEvent) => {
				switch (event.type) {
					case "start":
						conversationId = event.conversationId || null;
						// Update temp user message with real ID
						if (event.userMessageId) {
							dispatch({
								type: RAG_UPDATE_MESSAGE,
								payload: { _id: tempUserMessage._id, _id_new: event.userMessageId },
							});
						}
						if (event.conversationId && !data.conversationId) {
							// New conversation created - update active
							dispatch({
								type: RAG_SET_ACTIVE_CONVERSATION,
								payload: {
									_id: event.conversationId,
									causaId: data.causaId,
									causaType: data.causaType,
									folderId: data.folderId,
									title: data.message.substring(0, 80),
									status: "active",
									messagesCount: 1,
									lastMessageAt: new Date().toISOString(),
									createdAt: new Date().toISOString(),
								} as RagConversation,
							});
						}
						break;

					case "chunk":
						if (event.text) {
							dispatch({ type: RAG_STREAM_CHUNK, payload: event.text });
						}
						break;

					case "done":
						assistantMessageId = event.assistantMessageId || null;
						// Add the complete assistant message
						const assistantMessage: RagMessage = {
							_id: event.assistantMessageId || `assistant-${Date.now()}`,
							conversationId: conversationId || "",
							role: "assistant",
							content: "", // Will be filled from streamingContent in component
							citations: event.citations || [],
							metadata: event.metadata,
							streamCompleted: true,
							createdAt: new Date().toISOString(),
						};
						dispatch({ type: RAG_ADD_MESSAGE, payload: assistantMessage });
						dispatch({ type: RAG_STREAM_DONE });
						break;

					case "error":
						dispatch({ type: RAG_STREAM_ERROR, payload: event.error || "Error desconocido" });
						break;
				}
			},
			// onError
			(error: string) => {
				dispatch({ type: RAG_STREAM_ERROR, payload: error });
			},
		);
	};

/**
 * Archive a conversation
 */
export const archiveConversation =
	(conversationId: string) =>
	async (dispatch: Dispatch): Promise<{ success: boolean }> => {
		const result = await ragApi.archiveConversation(conversationId);
		if (result.success) {
			dispatch({ type: RAG_ARCHIVE_CONVERSATION, payload: conversationId });
		}
		return { success: result.success };
	};

/**
 * Start new conversation (clear active)
 */
export const startNewConversation = () => (dispatch: Dispatch) => {
	dispatch({ type: RAG_CLEAR_ACTIVE_CONVERSATION });
};

/**
 * Fetch index status for a causa
 */
export const fetchIndexStatus =
	(causaId: string) =>
	async (dispatch: Dispatch): Promise<RagIndexStatus | null> => {
		dispatch({ type: RAG_SET_LOADING, payload: { key: "isLoadingIndex", value: true } });

		const result = await ragApi.getIndexStatus(causaId);
		if (result.success) {
			dispatch({ type: RAG_SET_INDEX_STATUS, payload: result.data || null });
			return result.data || null;
		} else {
			dispatch({ type: RAG_SET_ERROR, payload: result.error });
			return null;
		}
	};

/**
 * Trigger causa indexation
 */
export const triggerIndexation =
	(causaId: string, data: IndexCausaRequest) =>
	async (dispatch: Dispatch): Promise<{ success: boolean; message?: string }> => {
		dispatch({ type: RAG_SET_INDEXING, payload: true });

		const result = await ragApi.indexCausa(causaId, data);
		if (result.success && result.data) {
			dispatch({ type: RAG_SET_INDEX_STATUS, payload: result.data });
			return { success: true, message: result.message };
		} else {
			dispatch({ type: RAG_SET_INDEXING, payload: false });
			dispatch({ type: RAG_SET_ERROR, payload: result.error });
			return { success: false };
		}
	};

/**
 * Clear RAG error
 */
export const clearRagError = () => (dispatch: Dispatch) => {
	dispatch({ type: RAG_CLEAR_ERROR });
};
