import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useTeam } from "contexts/TeamContext";

// Etiquetas del expediente: catálogo que define cada estudio (nombre y color) y pone en sus
// carpetas para filtrar el listado. En el servidor se llaman «estados» (SeguimientoConfig).
// Un único pedido por cuenta: lo comparten el listado, las celdas y el detalle de la carpeta.

export interface Etiqueta {
	_id?: string;
	nombre: string;
	color: string;
}

interface Entry {
	etiquetas: Etiqueta[];
	canConfig: boolean;
	loaded: boolean;
	promise?: Promise<void>;
}

const API = import.meta.env.VITE_BASE_URL;
const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const VACIO: Entry = { etiquetas: [], canConfig: false, loaded: false };

const load = (key: string, headers: Record<string, string>, force = false) => {
	const cur = cache.get(key);
	if (cur?.promise && !force) return cur.promise;
	if (cur?.loaded && !force) return Promise.resolve();
	const entry: Entry = cur || { ...VACIO };
	entry.promise = axios
		.get(`${API}/api/seguimiento/estados`, { headers })
		.then((res) => {
			entry.etiquetas = res.data?.estados || [];
			entry.canConfig = !!res.data?.canConfig;
		})
		.catch(() => {
			entry.etiquetas = [];
			entry.canConfig = false;
		})
		.finally(() => {
			entry.loaded = true;
			entry.promise = undefined;
			notify();
		});
	cache.set(key, entry);
	return entry.promise;
};

/** Catálogo ya cargado de la cuenta activa (para exportar sin esperar). */
export const etiquetasEnCache = (teamId?: string | null): Etiqueta[] => cache.get(teamId || "personal")?.etiquetas || [];

export const nombresDeEtiquetas = (ids: unknown, catalogo: Etiqueta[]): string[] => {
	const set = new Set((Array.isArray(ids) ? ids : []).map(String));
	return catalogo.filter((e) => set.has(String(e._id))).map((e) => e.nombre);
};

export default function useEtiquetasExpediente() {
	const { activeTeam, getRequestHeaders } = useTeam();
	const key = activeTeam?._id || "personal";
	const [, setTick] = useState(0);

	useEffect(() => {
		const l = () => setTick((n) => n + 1);
		listeners.add(l);
		load(key, getRequestHeaders());
		return () => {
			listeners.delete(l);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	const guardar = useCallback(
		async (etiquetas: Etiqueta[]) => {
			const res = await axios.put(`${API}/api/seguimiento/estados`, { estados: etiquetas }, { headers: getRequestHeaders() });
			const entry = cache.get(key) || { ...VACIO };
			entry.etiquetas = res.data?.estados || [];
			entry.loaded = true;
			cache.set(key, entry);
			notify();
			return entry.etiquetas;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[key],
	);

	const entry = cache.get(key) || VACIO;
	return { etiquetas: entry.etiquetas, canConfig: entry.canConfig, loaded: entry.loaded, guardar, teamId: activeTeam?._id || null };
}
