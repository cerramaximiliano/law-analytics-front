import { Dispatch } from "redux";
import axios from "axios";
import { AxiosError } from "axios";
import { PdfTemplate, PostalDocumentType } from "types/postal-document";

const BASE_URL = `${import.meta.env.VITE_BASE_URL || ""}/api/postal-documents`;

// Action types
const SET_LOADING = "postalDocuments/SET_LOADING";
const SET_TEMPLATES = "postalDocuments/SET_TEMPLATES";
const SET_DOCUMENTS = "postalDocuments/SET_DOCUMENTS";
const SET_DOCUMENT = "postalDocuments/SET_DOCUMENT";
const DELETE_DOCUMENT = "postalDocuments/DELETE_DOCUMENT";
const CLEAR_DOCUMENT = "postalDocuments/CLEAR_DOCUMENT";
const SET_FOLDER_DOCS = "postalDocuments/SET_FOLDER_DOCS";
const DELETE_FOLDER_DOC = "postalDocuments/DELETE_FOLDER_DOC";
const UPDATE_FOLDER_DOC = "postalDocuments/UPDATE_FOLDER_DOC";

interface State {
	templates: PdfTemplate[];
	documents: PostalDocumentType[];
	document: PostalDocumentType | null;
	isLoader: boolean;
	total: number;
	folderDocuments: PostalDocumentType[];
	folderDocumentsTotal: number;
	folderDocumentsLoading: boolean;
}

const initialState: State = {
	templates: [],
	documents: [],
	document: null,
	isLoader: false,
	total: 0,
	folderDocuments: [],
	folderDocumentsTotal: 0,
	folderDocumentsLoading: false,
};

// Reducer
const postalDocumentsReducer = (state = initialState, action: any): State => {
	switch (action.type) {
		case SET_LOADING:
			return { ...state, isLoader: true };
		case SET_TEMPLATES:
			return { ...state, templates: action.payload, isLoader: false };
		case SET_DOCUMENTS:
			return {
				...state,
				documents: Array.isArray(action.payload.documents) ? action.payload.documents : [],
				total: action.payload.total ?? 0,
				isLoader: false,
			};
		case SET_DOCUMENT:
			return { ...state, document: action.payload, isLoader: false };
		case DELETE_DOCUMENT:
			return { ...state, documents: state.documents.filter((d) => d._id !== action.payload) };
		case CLEAR_DOCUMENT:
			return { ...state, document: null };
		case SET_FOLDER_DOCS:
			return {
				...state,
				folderDocuments: Array.isArray(action.payload.documents) ? action.payload.documents : [],
				folderDocumentsTotal: action.payload.total ?? 0,
				folderDocumentsLoading: false,
			};
		case DELETE_FOLDER_DOC:
			return { ...state, folderDocuments: state.folderDocuments.filter((d) => d._id !== action.payload) };
		case UPDATE_FOLDER_DOC:
			return { ...state, folderDocuments: state.folderDocuments.map((d) => (d._id === action.payload._id ? action.payload : d)) };
		default:
			return state;
	}
};

export default postalDocumentsReducer;

// Thunks

export const fetchPdfTemplates = () => async (dispatch: Dispatch) => {
	try {
		const res = await axios.get(`${BASE_URL}/templates`);
		dispatch({ type: SET_TEMPLATES, payload: res.data.templates });
		return { success: true, templates: res.data.templates };
	} catch (error: unknown) {
		const msg =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener plantillas" : "Error al obtener plantillas";
		dispatch({ type: SET_TEMPLATES, payload: [] });
		return { success: false, error: msg };
	}
};

export const getPdfTemplate = (slug: string) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.get(`${BASE_URL}/templates/${slug}`);
		return { success: true, template: res.data.template };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al obtener plantilla" : "Error al obtener plantilla";
		return { success: false, error: msg };
	}
};

// Vista previa (PDF) de un escrito .docx vinculado a un formulario (entrada de `generates`).
export const previewGeneratedEscrito = (slug: string, genSlug: string) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.get(`${BASE_URL}/templates/${slug}/generates/${genSlug}/preview`);
		return { success: true, url: res.data.url as string, name: res.data.name as string };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al obtener la vista previa" : "Error al obtener la vista previa";
		return { success: false, error: msg };
	}
};

// ── Constructor self-service de modelos docx-merge ──────────────────────────────

// Sube un .docx y devuelve sus placeholders detectados + el s3Key donde quedó guardado.
export const parseDocxTemplate = (file: File) => async (_dispatch: Dispatch) => {
	try {
		const form = new FormData();
		form.append("docx", file);
		const res = await axios.post(`${BASE_URL}/templates/parse-docx`, form, { headers: { "Content-Type": "multipart/form-data" } });
		return { success: true, placeholders: (res.data.placeholders || []) as string[], s3Key: res.data.s3Key as string };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al procesar el documento" : "Error al procesar el documento";
		return { success: false, error: msg };
	}
};

export interface UserTemplatePayload {
	name: string;
	description?: string;
	category?: string;
	s3Key?: string;
	docxName?: string;
	docxPlaceholders?: string[];
	fields: Array<Record<string, unknown>>;
}

// Crea un modelo propio (formulario docx-merge). El documento (s3Key) es opcional.
export const createUserTemplate = (payload: UserTemplatePayload) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.post(`${BASE_URL}/templates`, payload);
		return { success: true, template: res.data.template as PdfTemplate };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al crear el modelo" : "Error al crear el modelo";
		return { success: false, error: msg };
	}
};

// Elimina un modelo propio (formulario). No borra los documentos ya generados.
export const deleteUserTemplate = (id: string) => async (_dispatch: Dispatch) => {
	try {
		await axios.delete(`${BASE_URL}/templates/${id}`);
		return { success: true };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar el modelo" : "Error al eliminar el modelo";
		return { success: false, error: msg };
	}
};

// Placeholders del .docx ya vinculado a un modelo propio (para re-mapear al editar).
export const getTemplatePlaceholders = (id: string) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.get(`${BASE_URL}/templates/${id}/placeholders`);
		return { success: true, placeholders: (res.data.placeholders || []) as string[] };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al leer el documento" : "Error al leer el documento";
		return { success: false, error: msg };
	}
};

// Edita un modelo propio (vincular el .docx después, actualizar campos/mapeo).
export const updateUserTemplate = (id: string, payload: Partial<UserTemplatePayload>) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.patch(`${BASE_URL}/templates/${id}`, payload);
		return { success: true, template: res.data.template as PdfTemplate };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al actualizar el modelo" : "Error al actualizar el modelo";
		return { success: false, error: msg };
	}
};

export const createPostalDocument =
	(data: {
		pdfTemplateId: string;
		title: string;
		description?: string;
		formData: Record<string, string>;
		linkedTrackingId?: string | null;
		linkedFolderId?: string | null;
		tags?: string[];
	}) =>
	async (_dispatch: Dispatch) => {
		try {
			const res = await axios.post(BASE_URL, data);
			return { success: true, document: res.data.document };
		} catch (error: unknown) {
			if (error instanceof AxiosError) {
				const data = error.response?.data;
				const msg = data?.message || "Error al generar el documento";
				if (error.response?.status === 403 && data?.limitInfo) {
					return { success: false, error: msg, limitInfo: data.limitInfo };
				}
				return { success: false, error: msg };
			}
			return { success: false, error: "Error al generar el documento" };
		}
	};

// Genera la demanda (.docx) a partir de un documento del formulario civil.
export const generateDemanda = (id: string) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.post(`${BASE_URL}/${id}/generate-demanda`);
		return { success: true, url: res.data?.data?.url as string, missing: (res.data?.data?.missing || []) as string[] };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al generar la demanda" : "Error al generar la demanda";
		return { success: false, error: msg };
	}
};

// Genera "el documento" (.docx merged) desde un FORMULARIO self-service. Puede tocar el límite de IA (403).
export const generateDocument = (id: string) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.post(`${BASE_URL}/${id}/generate-document`);
		return { success: true, url: res.data?.data?.url as string, documentId: res.data?.data?.documentId as string };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al generar el documento" : "Error al generar el documento";
		return { success: false, error: msg };
	}
};

export const fetchPostalDocuments =
	(params: { page?: number; limit?: number; search?: string; templateSlug?: string; status?: string; folderId?: string }) =>
	async (dispatch: Dispatch) => {
		dispatch({ type: SET_LOADING });
		try {
			const res = await axios.get(BASE_URL, { params });
			dispatch({ type: SET_DOCUMENTS, payload: { documents: res.data.documents, total: res.data.total } });
			return { success: true };
		} catch (error: unknown) {
			dispatch({ type: SET_DOCUMENTS, payload: { documents: [], total: 0 } });
			return { success: false };
		}
	};

export const getPostalDocumentById = (id: string) => async (dispatch: Dispatch) => {
	try {
		const res = await axios.get(`${BASE_URL}/${id}`);
		dispatch({ type: SET_DOCUMENT, payload: res.data.document });
		return { success: true, document: res.data.document };
	} catch (error: unknown) {
		const msg =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener el documento" : "Error al obtener el documento";
		return { success: false, error: msg };
	}
};

// Vista previa (PDF) de un documento: si es .docx lo convierte a PDF en el server. Devuelve url (preview) + downloadUrl (original).
export const previewPostalDocument = (id: string) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.get(`${BASE_URL}/${id}/preview`);
		return { success: true, url: res.data.url as string, downloadUrl: res.data.downloadUrl as string, isDocx: Boolean(res.data.isDocx) };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al obtener la vista previa" : "Error al obtener la vista previa";
		return { success: false, error: msg };
	}
};

export const updatePostalDocument = (id: string, data: Partial<PostalDocumentType>) => async (_dispatch: Dispatch) => {
	try {
		const res = await axios.patch(`${BASE_URL}/${id}`, data);
		return { success: true, document: res.data.document };
	} catch (error: unknown) {
		const msg =
			error instanceof AxiosError
				? error.response?.data?.message || "Error al actualizar el documento"
				: "Error al actualizar el documento";
		return { success: false, error: msg };
	}
};

export const deletePostalDocument = (id: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`${BASE_URL}/${id}`);
		dispatch({ type: DELETE_DOCUMENT, payload: id });
		return { success: true };
	} catch (error: unknown) {
		const msg =
			error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar el documento" : "Error al eliminar el documento";
		return { success: false, error: msg };
	}
};

export const clearPostalDocument = () => (dispatch: Dispatch) => {
	dispatch({ type: CLEAR_DOCUMENT });
};

export const fetchPostalDocumentsByFolder = (folderId: string) => async (dispatch: Dispatch) => {
	dispatch({ type: SET_LOADING });
	try {
		const res = await axios.get(BASE_URL, { params: { folderId, limit: 100 } });
		dispatch({ type: SET_FOLDER_DOCS, payload: { documents: res.data.documents, total: res.data.total } });
		return { success: true, documents: res.data.documents as PostalDocumentType[] };
	} catch (error: unknown) {
		dispatch({ type: SET_FOLDER_DOCS, payload: { documents: [], total: 0 } });
		return { success: false };
	}
};

export const deletePostalFolderDocument = (id: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`${BASE_URL}/${id}`);
		dispatch({ type: DELETE_FOLDER_DOC, payload: id });
		return { success: true };
	} catch (error: unknown) {
		const msg = error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar" : "Error al eliminar";
		return { success: false, error: msg };
	}
};
