import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
	Document, 
	DocumentTemplate, 
	DocumentsState, 
	DocumentType,
	DocumentStatus,
	DocumentCategory
} from 'types/documents';

const initialState: DocumentsState = {
	documents: [],
	templates: [],
	currentDocument: null,
	currentTemplate: null,
	isLoading: false,
	error: null,
	filters: {},
	pagination: {
		page: 1,
		limit: 10,
		total: 0
	}
};

const documentsSlice = createSlice({
	name: 'documents',
	initialState,
	reducers: {
		// Document actions
		setDocuments: (state, action: PayloadAction<Document[]>) => {
			state.documents = action.payload;
			state.error = null;
		},
		
		addDocument: (state, action: PayloadAction<Document>) => {
			state.documents.unshift(action.payload);
			state.currentDocument = action.payload;
			state.error = null;
		},
		
		updateDocument: (state, action: PayloadAction<Document>) => {
			const index = state.documents.findIndex(doc => doc.id === action.payload.id);
			if (index !== -1) {
				state.documents[index] = action.payload;
				if (state.currentDocument?.id === action.payload.id) {
					state.currentDocument = action.payload;
				}
			}
			state.error = null;
		},
		
		deleteDocument: (state, action: PayloadAction<string>) => {
			state.documents = state.documents.filter(doc => doc.id !== action.payload);
			if (state.currentDocument?.id === action.payload) {
				state.currentDocument = null;
			}
			state.error = null;
		},
		
		setCurrentDocument: (state, action: PayloadAction<Document | null>) => {
			state.currentDocument = action.payload;
		},
		
		// Template actions
		setTemplates: (state, action: PayloadAction<DocumentTemplate[]>) => {
			state.templates = action.payload;
			state.error = null;
		},
		
		addTemplate: (state, action: PayloadAction<DocumentTemplate>) => {
			state.templates.unshift(action.payload);
			state.error = null;
		},
		
		updateTemplate: (state, action: PayloadAction<DocumentTemplate>) => {
			const index = state.templates.findIndex(template => template.id === action.payload.id);
			if (index !== -1) {
				state.templates[index] = action.payload;
				if (state.currentTemplate?.id === action.payload.id) {
					state.currentTemplate = action.payload;
				}
			}
			state.error = null;
		},
		
		deleteTemplate: (state, action: PayloadAction<string>) => {
			state.templates = state.templates.filter(template => template.id !== action.payload);
			if (state.currentTemplate?.id === action.payload) {
				state.currentTemplate = null;
			}
			state.error = null;
		},
		
		setCurrentTemplate: (state, action: PayloadAction<DocumentTemplate | null>) => {
			state.currentTemplate = action.payload;
		},
		
		// Filter actions
		setTypeFilter: (state, action: PayloadAction<DocumentType | undefined>) => {
			state.filters.type = action.payload;
		},
		
		setStatusFilter: (state, action: PayloadAction<DocumentStatus | undefined>) => {
			state.filters.status = action.payload;
		},
		
		setCategoryFilter: (state, action: PayloadAction<DocumentCategory | undefined>) => {
			state.filters.category = action.payload;
		},
		
		setSearchTerm: (state, action: PayloadAction<string>) => {
			state.filters.searchTerm = action.payload;
		},
		
		clearFilters: (state) => {
			state.filters = {};
		},
		
		// Pagination actions
		setPagination: (state, action: PayloadAction<{ page?: number; limit?: number; total?: number }>) => {
			state.pagination = { ...state.pagination, ...action.payload };
		},
		
		// Loading and error states
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
			state.isLoading = false;
		},
		
		// Batch operations
		updateDocumentsBatch: (state, action: PayloadAction<Document[]>) => {
			action.payload.forEach(updatedDoc => {
				const index = state.documents.findIndex(doc => doc.id === updatedDoc.id);
				if (index !== -1) {
					state.documents[index] = updatedDoc;
				}
			});
			state.error = null;
		},
		
		// Clear state
		clearDocumentsState: (state) => {
			return initialState;
		},
		
		// Auto-save
		updateDocumentContent: (state, action: PayloadAction<{ id: string; content: string }>) => {
			const doc = state.documents.find(d => d.id === action.payload.id);
			if (doc) {
				doc.content = action.payload.content;
				doc.updatedAt = new Date();
			}
			if (state.currentDocument?.id === action.payload.id) {
				state.currentDocument.content = action.payload.content;
				state.currentDocument.updatedAt = new Date();
			}
		}
	}
});

export const {
	// Document actions
	setDocuments,
	addDocument,
	updateDocument,
	deleteDocument,
	setCurrentDocument,
	// Template actions
	setTemplates,
	addTemplate,
	updateTemplate,
	deleteTemplate,
	setCurrentTemplate,
	// Filter actions
	setTypeFilter,
	setStatusFilter,
	setCategoryFilter,
	setSearchTerm,
	clearFilters,
	// Pagination
	setPagination,
	// Loading/Error
	setLoading,
	setError,
	// Batch operations
	updateDocumentsBatch,
	// Clear state
	clearDocumentsState,
	// Auto-save
	updateDocumentContent
} = documentsSlice.actions;

export default documentsSlice.reducer;