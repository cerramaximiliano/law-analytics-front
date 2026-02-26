// ==============================|| RAG AI TYPES ||============================== //

// Citation from a RAG response
export interface RagCitation {
	documentId: string;
	sourceType: string;
	page: number;
	chunkIndex: number;
	chunkText: string;
	relevanceScore: number;
	docDate?: string;
	docType?: string;
}

// Chat message
export interface RagMessage {
	_id: string;
	conversationId: string;
	role: "user" | "assistant" | "system";
	content: string;
	citations?: RagCitation[];
	metadata?: {
		model?: string;
		tokensUsed?: { prompt: number; completion: number; total: number };
		latencyMs?: number;
		cost?: number;
		chunksRetrieved?: number;
		chunksUsed?: number;
	};
	streamCompleted?: boolean;
	createdAt: string;
}

// Chat conversation
export interface RagConversation {
	_id: string;
	userId: string;
	folderId?: string;
	causaId: string;
	causaType: string;
	title: string;
	status: "active" | "archived";
	messagesCount: number;
	lastMessageAt: string;
	context?: {
		mode: "chat" | "summary" | "document_gen" | "strategy";
		selectedDocIds?: string[];
	};
	createdAt: string;
}

// RAG index (indexation) status
export interface RagIndexStatus {
	_id: string;
	causaId: string;
	causaType: string;
	userId: string;
	status: "pending" | "indexing" | "indexed" | "error" | "outdated" | "deleting";
	documentsTotal: number;
	documentsProcessed: number;
	documentsWithError: number;
	chunksTotal: number;
	pagesTotal: number;
	lastIndexedAt?: string;
	error?: { message: string; timestamp: string };
	documentStats?: Array<{ _id: string; count: number }>;
}

// SSE streaming events
export interface RagStreamEvent {
	type: "start" | "chunk" | "done" | "error";
	conversationId?: string;
	userMessageId?: string;
	assistantMessageId?: string;
	text?: string;
	citations?: RagCitation[];
	metadata?: {
		model: string;
		tokensUsed: { prompt: number; completion: number; total: number };
		latencyMs: number;
		cost?: number;
		chunksRetrieved: number;
		chunksUsed: number;
	};
	error?: string;
}

// Redux state
export interface RagState {
	// Conversations
	conversations: RagConversation[];
	activeConversation: RagConversation | null;
	messages: RagMessage[];

	// Streaming state
	isStreaming: boolean;
	streamingContent: string;

	// Indexation
	indexStatus: RagIndexStatus | null;

	// Loading states
	isLoadingConversations: boolean;
	isLoadingMessages: boolean;
	isLoadingIndex: boolean;
	isSendingMessage: boolean;
	isIndexing: boolean;

	// Errors
	error: string | null;
}

// API request/response types
export interface SendMessageRequest {
	message: string;
	causaId: string;
	causaType?: string;
	folderId?: string;
	conversationId?: string;
	stream?: boolean;
}

export interface IndexCausaRequest {
	causaType: string;
	folderId?: string;
}

export interface ConversationListParams {
	causaId?: string;
	folderId?: string;
	status?: "active" | "archived";
	page?: number;
	limit?: number;
}
