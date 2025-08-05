import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { Dispatch } from "redux";
import { Document, DocumentTemplate, DocumentsState, DocumentType, DocumentStatus, DocumentCategory } from "types/documents";

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
		total: 0,
	},
};

const documentsSlice = createSlice({
	name: "documents",
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
			const index = state.documents.findIndex((doc) => doc.id === action.payload.id);
			if (index !== -1) {
				state.documents[index] = action.payload;
				if (state.currentDocument?.id === action.payload.id) {
					state.currentDocument = action.payload;
				}
			}
			state.error = null;
		},

		removeDocument: (state, action: PayloadAction<string>) => {
			state.documents = state.documents.filter((doc) => doc.id !== action.payload);
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
			const index = state.templates.findIndex((template) => template.id === action.payload.id);
			if (index !== -1) {
				state.templates[index] = action.payload;
				if (state.currentTemplate?.id === action.payload.id) {
					state.currentTemplate = action.payload;
				}
			}
			state.error = null;
		},

		deleteTemplate: (state, action: PayloadAction<string>) => {
			state.templates = state.templates.filter((template) => template.id !== action.payload);
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
			action.payload.forEach((updatedDoc) => {
				const index = state.documents.findIndex((doc) => doc.id === updatedDoc.id);
				if (index !== -1) {
					state.documents[index] = updatedDoc;
				}
			});
			state.error = null;
		},

		// Clear state
		clearDocumentsState: (_state) => {
			return initialState;
		},

		// Auto-save
		updateDocumentContent: (state, action: PayloadAction<{ id: string; content: string }>) => {
			const doc = state.documents.find((d) => d.id === action.payload.id);
			if (doc) {
				doc.content = action.payload.content;
				doc.updatedAt = new Date().toISOString();
			}
			if (state.currentDocument?.id === action.payload.id) {
				state.currentDocument.content = action.payload.content;
				state.currentDocument.updatedAt = new Date().toISOString();
			}
		},
	},
});

export const {
	// Document actions
	setDocuments,
	addDocument,
	updateDocument,
	removeDocument,
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
	updateDocumentContent,
} = documentsSlice.actions;

export default documentsSlice.reducer;

// ==============================|| ASYNC ACTIONS - DOCUMENTS ||============================== //

// Crear nuevo documento
export const createDocument = (documentData: Partial<Document>) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/documents`, documentData);

		if (response.data.success) {
			dispatch(addDocument(response.data.document));
			return { success: true, document: response.data.document };
		}
		return { success: false, message: response.data.message || "Error al crear el documento" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al crear el documento" : "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, message: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Actualizar documento existente
export const saveDocument = (id: string, documentData: Partial<Document>) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/documents/${id}`, documentData);

		if (response.data.success) {
			dispatch(updateDocument(response.data.document));
			return { success: true, document: response.data.document };
		}
		return { success: false, message: response.data.message || "Error al actualizar el documento" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al actualizar el documento"
			: "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, message: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Obtener documentos del usuario
export const fetchDocuments = (params?: { status?: string; folderId?: string; search?: string }) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/documents`, { params });

		if (response.data.success) {
			dispatch(setDocuments(response.data.documents));
			return { success: true, documents: response.data.documents };
		}
		return { success: false, documents: [] };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al cargar los documentos"
			: "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, documents: [], error: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Obtener documento por ID
export const fetchDocumentById = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/documents/${id}`);

		if (response.data.success) {
			dispatch(setCurrentDocument(response.data.document));
			return { success: true, document: response.data.document };
		}
		return { success: false };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al cargar el documento" : "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, error: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Eliminar documento (soft delete)
export const deleteDocument = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/documents/${id}`);

		if (response.data.success) {
			dispatch(removeDocument(id));
			return { success: true };
		}
		return { success: false };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al eliminar el documento"
			: "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, error: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Cambiar estado del documento
export const changeDocumentStatus = (id: string, newStatus: string) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.patch(`${process.env.REACT_APP_BASE_URL}/api/documents/${id}/status`, { status: newStatus });

		if (response.data.success) {
			dispatch(updateDocument(response.data.document));
			return { success: true, document: response.data.document };
		}
		return { success: false };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al cambiar el estado del documento"
			: "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, error: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// ==============================|| ASYNC ACTIONS - TEMPLATES ||============================== //

// Obtener plantillas desde la API
export const fetchTemplates =
	(params?: { category?: string; includeOwn?: boolean; search?: string; tags?: string[]; page?: number; limit?: number }) =>
	async (dispatch: Dispatch) => {
		try {
			dispatch(setLoading(true));
			const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/document/templates`, { params });

			if (response.data.success) {
				dispatch(setTemplates(response.data.templates));
				if (response.data.pagination) {
					dispatch(setPagination(response.data.pagination));
				}
				return { success: true, templates: response.data.templates };
			}
			return { success: false, templates: [] };
		} catch (error) {
			const errorMessage = axios.isAxiosError(error)
				? error.response?.data?.message || "Error al cargar las plantillas"
				: "Error desconocido";
			dispatch(setError(errorMessage));
			return { success: false, templates: [], error: errorMessage };
		} finally {
			dispatch(setLoading(false));
		}
	};

// Obtener una plantilla específica por ID
export const fetchTemplateById = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/document/templates/${id}`);

		if (response.data.success) {
			dispatch(setCurrentTemplate(response.data.template));
			return { success: true, template: response.data.template };
		}
		return { success: false, message: "No se pudo obtener la plantilla" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al cargar la plantilla" : "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, message: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Crear nueva plantilla
export const createDocumentTemplate = (templateData: Partial<DocumentTemplate>) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/document/templates`, templateData);

		if (response.data.success) {
			dispatch(addTemplate(response.data.template));
			// Recargar plantillas para incluir la nueva
			dispatch(fetchTemplates() as any);
			return { success: true, template: response.data.template };
		}
		return { success: false, message: response.data.message || "Error al crear la plantilla" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al crear la plantilla" : "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, message: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Actualizar plantilla existente
export const updateDocumentTemplate = (id: string, templateData: Partial<DocumentTemplate>) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/document/templates/${id}`, templateData);

		if (response.data.success) {
			dispatch(updateTemplate(response.data.template));
			return { success: true, template: response.data.template };
		}
		return { success: false, message: response.data.message || "Error al actualizar la plantilla" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al actualizar la plantilla"
			: "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, message: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Eliminar plantilla
export const deleteDocumentTemplate = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch(setLoading(true));
		const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/document/templates/${id}`);

		if (response.data.success) {
			dispatch(deleteTemplate(id));
			return { success: true };
		}
		return { success: false, message: response.data.message || "Error al eliminar la plantilla" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al eliminar la plantilla"
			: "Error desconocido";
		dispatch(setError(errorMessage));
		return { success: false, message: errorMessage };
	} finally {
		dispatch(setLoading(false));
	}
};

// Async actions are already exported individually above
