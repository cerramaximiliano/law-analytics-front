// Service de anotaciones de movimientos PJN (Item 6).
// Wrappea los 5 endpoints del backend (folderAnnotationsController).

import axios from "axios";
import type {
	AnnotationsListResponse,
	AnnotationResponse,
	AnnotationUpdate,
	MarkReadResponse,
} from "types/annotation";

function getBaseUrl(): string {
	if (
		process.env.NODE_ENV === "production" &&
		typeof window !== "undefined" &&
		window.location.hostname === "lawanalytics.app"
	) {
		return "https://server.lawanalytics.app";
	}
	return "";
}

const cfg = { withCredentials: true };

// movementId tiene ":" — siempre encodear
const enc = (s: string) => encodeURIComponent(s);

export async function listAnnotations(folderId: string): Promise<AnnotationsListResponse> {
	const url = `${getBaseUrl()}/api/folders/${folderId}/annotations`;
	const r = await axios.get<AnnotationsListResponse>(url, cfg);
	return r.data;
}

export async function upsertAnnotation(
	folderId: string,
	movementId: string,
	updates: AnnotationUpdate,
): Promise<AnnotationResponse> {
	const url = `${getBaseUrl()}/api/folders/${folderId}/annotations/${enc(movementId)}`;
	const r = await axios.put<AnnotationResponse>(url, updates, cfg);
	return r.data;
}

export async function deleteAnnotation(folderId: string, movementId: string): Promise<{ success: boolean }> {
	const url = `${getBaseUrl()}/api/folders/${folderId}/annotations/${enc(movementId)}`;
	const r = await axios.delete<{ success: boolean }>(url, cfg);
	return r.data;
}

// Bulk mark-as-read. Si movementIds está vacío, marca TODAS las que ya existen.
export async function markRead(folderId: string, movementIds?: string[]): Promise<MarkReadResponse> {
	const url = `${getBaseUrl()}/api/folders/${folderId}/annotations/mark-read`;
	const body = movementIds && movementIds.length > 0 ? { movementIds } : {};
	const r = await axios.post<MarkReadResponse>(url, body, cfg);
	return r.data;
}
