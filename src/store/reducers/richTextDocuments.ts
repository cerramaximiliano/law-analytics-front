import { Dispatch } from "redux";
import axios from "axios";
import { AxiosError } from "axios";
import {
	RichTextTemplate,
	RichTextDocument,
	CreateRichTextTemplatePayload,
	UpdateRichTextTemplatePayload,
	RichTextTemplatesQueryParams,
	CreateRichTextDocumentPayload,
	UpdateRichTextDocumentPayload,
	RichTextDocumentsQueryParams,
	ResolveFieldsPayload,
	ResolvedFields,
} from "types/rich-text-document";

const TEMPLATES_URL = `${import.meta.env.VITE_BASE_URL || ""}/api/rich-text-templates`;
const DOCUMENTS_URL = `${import.meta.env.VITE_BASE_URL || ""}/api/rich-text-documents`;

// ── Action types ────────────────────────────────────────────────────────────────

const SET_LOADING = "richTextDocuments/SET_LOADING";
const SET_TEMPLATES = "richTextDocuments/SET_TEMPLATES";
const SET_TEMPLATE = "richTextDocuments/SET_TEMPLATE";
const ADD_TEMPLATE = "richTextDocuments/ADD_TEMPLATE";
const UPDATE_TEMPLATE = "richTextDocuments/UPDATE_TEMPLATE";
const DELETE_TEMPLATE = "richTextDocuments/DELETE_TEMPLATE";
const SET_DOCUMENTS = "richTextDocuments/SET_DOCUMENTS";
const SET_DOCUMENT = "richTextDocuments/SET_DOCUMENT";
const ADD_DOCUMENT = "richTextDocuments/ADD_DOCUMENT";
const UPDATE_DOCUMENT = "richTextDocuments/UPDATE_DOCUMENT";
const DELETE_DOCUMENT = "richTextDocuments/DELETE_DOCUMENT";
const CLEAR_DOCUMENT = "richTextDocuments/CLEAR_DOCUMENT";
const SET_FOLDER_DOCS = "richTextDocuments/SET_FOLDER_DOCS";
const DELETE_FOLDER_DOC = "richTextDocuments/DELETE_FOLDER_DOC";
const UPDATE_FOLDER_DOC = "richTextDocuments/UPDATE_FOLDER_DOC";

// ── State ───────────────────────────────────────────────────────────────────────

interface State {
	templates: RichTextTemplate[];
	template: RichTextTemplate | null;
	templatesTotal: number;
	documents: RichTextDocument[];
	document: RichTextDocument | null;
	documentsTotal: number;
	isLoader: boolean;
	folderDocuments: RichTextDocument[];
	folderDocumentsTotal: number;
}

const initialState: State = {
	templates: [],
	template: null,
	templatesTotal: 0,
	documents: [],
	document: null,
	documentsTotal: 0,
	isLoader: false,
	folderDocuments: [],
	folderDocumentsTotal: 0,
};

// ── Reducer ─────────────────────────────────────────────────────────────────────

const richTextDocumentsReducer = (state = initialState, action: any): State => {
	switch (action.type) {
		case SET_LOADING:
			return { ...state, isLoader: true };
		case SET_TEMPLATES:
			return {
				...state,
				templates: Array.isArray(action.payload.templates) ? action.payload.templates : [],
				templatesTotal: action.payload.total ?? 0,
				isLoader: false,
			};
		case SET_TEMPLATE:
			return { ...state, template: action.payload, isLoader: false };
		case ADD_TEMPLATE:
			return { ...state, templates: [action.payload, ...state.templates], isLoader: false };
		case UPDATE_TEMPLATE:
			return {
				...state,
				templates: state.templates.map((t) => (t._id === action.payload._id ? action.payload : t)),
				template: action.payload,
				isLoader: false,
			};
		case DELETE_TEMPLATE:
			return { ...state, templates: state.templates.filter((t) => t._id !== action.payload) };
		case SET_DOCUMENTS:
			return {
				...state,
				documents: Array.isArray(action.payload.documents) ? action.payload.documents : [],
				documentsTotal: action.payload.total ?? 0,
				isLoader: false,
			};
		case SET_DOCUMENT:
			return { ...state, document: action.payload, isLoader: false };
		case ADD_DOCUMENT:
			return { ...state, documents: [action.payload, ...state.documents], isLoader: false };
		case UPDATE_DOCUMENT:
			return {
				...state,
				documents: state.documents.map((d) => (d._id === action.payload._id ? action.payload : d)),
				document: action.payload,
				isLoader: false,
			};
		case DELETE_DOCUMENT:
			return { ...state, documents: state.documents.filter((d) => d._id !== action.payload) };
		case CLEAR_DOCUMENT:
			return { ...state, document: null };
		case SET_FOLDER_DOCS:
			return {
				...state,
				folderDocuments: Array.isArray(action.payload.documents) ? action.payload.documents : [],
				folderDocumentsTotal: action.payload.total ?? 0,
			};
		case DELETE_FOLDER_DOC:
			return { ...state, folderDocuments: state.folderDocuments.filter((d) => d._id !== action.payload) };
		case UPDATE_FOLDER_DOC:
			return { ...state, folderDocuments: state.folderDocuments.map((d) => (d._id === action.payload._id ? action.payload : d)) };
		default:
			return state;
	}
};

export default richTextDocumentsReducer;

// ── Helpers ─────────────────────────────────────────────────────────────────────

const getErrorMsg = (error: unknown, fallback: string): string =>
	error instanceof AxiosError ? error.response?.data?.error || error.response?.data?.message || fallback : fallback;

// ── Template thunks ─────────────────────────────────────────────────────────────

export const fetchRichTextTemplates =
	(params: RichTextTemplatesQueryParams = {}) =>
	async (dispatch: Dispatch) => {
		dispatch({ type: SET_LOADING });
		try {
			const res = await axios.get(TEMPLATES_URL, { params });
			dispatch({ type: SET_TEMPLATES, payload: { templates: res.data.templates, total: res.data.total } });
			return { success: true, templates: res.data.templates as RichTextTemplate[] };
		} catch (error) {
			dispatch({ type: SET_TEMPLATES, payload: { templates: [], total: 0 } });
			return { success: false, error: getErrorMsg(error, "Error al obtener plantillas") };
		}
	};

export const getRichTextTemplate = (id: string) => async (dispatch: Dispatch) => {
	try {
		const res = await axios.get(`${TEMPLATES_URL}/${id}`);
		dispatch({ type: SET_TEMPLATE, payload: res.data.template });
		return { success: true, template: res.data.template as RichTextTemplate };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al obtener plantilla") };
	}
};

export const createRichTextTemplate = (data: CreateRichTextTemplatePayload) => async (dispatch: Dispatch) => {
	try {
		const res = await axios.post(TEMPLATES_URL, data);
		dispatch({ type: ADD_TEMPLATE, payload: res.data.template });
		return { success: true, template: res.data.template as RichTextTemplate };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al crear plantilla") };
	}
};

export const updateRichTextTemplate = (id: string, data: UpdateRichTextTemplatePayload) => async (dispatch: Dispatch) => {
	try {
		const res = await axios.patch(`${TEMPLATES_URL}/${id}`, data);
		dispatch({ type: UPDATE_TEMPLATE, payload: res.data.template });
		return { success: true, template: res.data.template as RichTextTemplate };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al actualizar plantilla") };
	}
};

export const deleteRichTextTemplate = (id: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`${TEMPLATES_URL}/${id}`);
		dispatch({ type: DELETE_TEMPLATE, payload: id });
		return { success: true };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al eliminar plantilla") };
	}
};

// ── Document thunks ─────────────────────────────────────────────────────────────

export const fetchRichTextDocuments =
	(params: RichTextDocumentsQueryParams = {}) =>
	async (dispatch: Dispatch) => {
		dispatch({ type: SET_LOADING });
		try {
			const res = await axios.get(DOCUMENTS_URL, { params });
			dispatch({ type: SET_DOCUMENTS, payload: { documents: res.data.documents, total: res.data.total } });
			return { success: true };
		} catch (error) {
			dispatch({ type: SET_DOCUMENTS, payload: { documents: [], total: 0 } });
			return { success: false };
		}
	};

export const getRichTextDocument = (id: string) => async (dispatch: Dispatch) => {
	try {
		const res = await axios.get(`${DOCUMENTS_URL}/${id}`);
		dispatch({ type: SET_DOCUMENT, payload: res.data.document });
		return { success: true, document: res.data.document as RichTextDocument };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al obtener documento") };
	}
};

export const createRichTextDocument = (data: CreateRichTextDocumentPayload) => async (dispatch: Dispatch) => {
	try {
		const res = await axios.post(DOCUMENTS_URL, data);
		dispatch({ type: ADD_DOCUMENT, payload: res.data.document });
		return { success: true, document: res.data.document as RichTextDocument };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al crear documento") };
	}
};

export const updateRichTextDocument = (id: string, data: UpdateRichTextDocumentPayload) => async (dispatch: Dispatch) => {
	try {
		const res = await axios.patch(`${DOCUMENTS_URL}/${id}`, data);
		dispatch({ type: UPDATE_DOCUMENT, payload: res.data.document });
		return { success: true, document: res.data.document as RichTextDocument };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al actualizar documento") };
	}
};

export const deleteRichTextDocument = (id: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`${DOCUMENTS_URL}/${id}`);
		dispatch({ type: DELETE_DOCUMENT, payload: id });
		return { success: true };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al eliminar documento") };
	}
};

export const clearRichTextDocument = () => (dispatch: Dispatch) => {
	dispatch({ type: CLEAR_DOCUMENT });
};

export const fetchRichTextDocumentsByFolder = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		const res = await axios.get(DOCUMENTS_URL, { params: { folderId, limit: 100 } });
		dispatch({ type: SET_FOLDER_DOCS, payload: { documents: res.data.documents, total: res.data.total } });
		return { success: true, documents: res.data.documents as RichTextDocument[] };
	} catch (error) {
		dispatch({ type: SET_FOLDER_DOCS, payload: { documents: [], total: 0 } });
		return { success: false };
	}
};

export const deleteRichTextFolderDocument = (id: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`${DOCUMENTS_URL}/${id}`);
		dispatch({ type: DELETE_FOLDER_DOC, payload: id });
		return { success: true };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al eliminar documento") };
	}
};

// ── Merge field resolution ──────────────────────────────────────────────────────

export const resolveRichTextFields = (payload: ResolveFieldsPayload) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.post(`${DOCUMENTS_URL}/resolve-fields`, payload);
		return { success: true, resolvedFields: res.data.resolvedFields as ResolvedFields };
	} catch (error) {
		return { success: false, error: getErrorMsg(error, "Error al resolver campos") };
	}
};
