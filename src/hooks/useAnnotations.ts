// Hook para gestionar anotaciones de movimientos del folder (Item 6).
//
// Estrategia: cargar todas las anotaciones del folder UNA VEZ al montar
// y mantener un Map<movementId, MovementAnnotation> en estado local.
// Updates son optimistic: la UI se actualiza inmediatamente y el server
// sync sucede en background. Si falla, se hace revert.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	deleteAnnotation as apiDelete,
	listAnnotations,
	markRead as apiMarkRead,
	upsertAnnotation as apiUpsert,
} from "services/annotationsService";
import type { AnnotationUpdate, MovementAnnotation } from "types/annotation";

export interface UseAnnotationsResult {
	annotations: Map<string, MovementAnnotation>;
	loading: boolean;
	error: string | null;
	getAnnotation: (movementId: string) => MovementAnnotation | undefined;
	upsert: (movementId: string, updates: AnnotationUpdate) => Promise<void>;
	remove: (movementId: string) => Promise<void>;
	markAllRead: (movementIds?: string[]) => Promise<{ updated: number; created: number }>;
	refetch: () => Promise<void>;
}

function buildEmpty(movementId: string): MovementAnnotation {
	const now = new Date().toISOString();
	return {
		movementId,
		isRead: false,
		isImportant: false,
		notes: "",
		tags: [],
		customDueDate: null,
		createdAt: now,
		updatedAt: now,
	};
}

export function useAnnotations(folderId: string | null | undefined): UseAnnotationsResult {
	const [map, setMap] = useState<Map<string, MovementAnnotation>>(new Map());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Para evitar fetch duplicado si folderId cambia rápido
	const lastFolderIdRef = useRef<string | null>(null);

	const fetchAll = useCallback(async () => {
		if (!folderId) {
			setMap(new Map());
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const res = await listAnnotations(folderId);
			const next = new Map<string, MovementAnnotation>();
			for (const a of res.data) next.set(a.movementId, a);
			setMap(next);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? "Error al cargar anotaciones");
		} finally {
			setLoading(false);
		}
	}, [folderId]);

	useEffect(() => {
		if (folderId === lastFolderIdRef.current) return;
		lastFolderIdRef.current = folderId ?? null;
		fetchAll();
	}, [folderId, fetchAll]);

	const getAnnotation = useCallback(
		(movementId: string) => map.get(movementId),
		[map],
	);

	const upsert = useCallback(
		async (movementId: string, updates: AnnotationUpdate) => {
			if (!folderId) return;
			// Optimistic update
			const prev = map.get(movementId);
			const optimistic: MovementAnnotation = {
				...(prev ?? buildEmpty(movementId)),
				...updates,
				movementId,
				updatedAt: new Date().toISOString(),
			};
			setMap((m) => new Map(m).set(movementId, optimistic));

			try {
				const res = await apiUpsert(folderId, movementId, updates);
				setMap((m) => new Map(m).set(movementId, res.data));
			} catch (err) {
				// Revert si falla
				setMap((m) => {
					const n = new Map(m);
					if (prev) n.set(movementId, prev);
					else n.delete(movementId);
					return n;
				});
				throw err;
			}
		},
		[folderId, map],
	);

	const remove = useCallback(
		async (movementId: string) => {
			if (!folderId) return;
			const prev = map.get(movementId);
			// Optimistic
			setMap((m) => {
				const n = new Map(m);
				n.delete(movementId);
				return n;
			});
			try {
				await apiDelete(folderId, movementId);
			} catch (err) {
				if (prev) setMap((m) => new Map(m).set(movementId, prev));
				throw err;
			}
		},
		[folderId, map],
	);

	const markAllRead = useCallback(
		async (movementIds?: string[]) => {
			if (!folderId) return { updated: 0, created: 0 };
			// Optimistic: marcar todos los del Map como isRead.
			// Si vienen movementIds específicos, también esos (creando si no existen).
			const targets = movementIds && movementIds.length > 0 ? new Set(movementIds) : null;
			setMap((m) => {
				const n = new Map(m);
				for (const [id, a] of n) {
					if (!targets || targets.has(id)) {
						n.set(id, { ...a, isRead: true, updatedAt: new Date().toISOString() });
					}
				}
				if (targets) {
					for (const id of targets) {
						if (!n.has(id)) {
							n.set(id, { ...buildEmpty(id), isRead: true });
						}
					}
				}
				return n;
			});
			try {
				const res = await apiMarkRead(folderId, movementIds);
				return { updated: res.updated, created: res.created };
			} catch (err) {
				// En error, refetch para resincronizar
				await fetchAll();
				throw err;
			}
		},
		[folderId, fetchAll],
	);

	return useMemo(
		() => ({
			annotations: map,
			loading,
			error,
			getAnnotation,
			upsert,
			remove,
			markAllRead,
			refetch: fetchAll,
		}),
		[map, loading, error, getAnnotation, upsert, remove, markAllRead, fetchAll],
	);
}
