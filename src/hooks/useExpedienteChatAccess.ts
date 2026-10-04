import { useEffect, useState } from "react";
import { ExpedienteChatAccess, getExpedienteChatAccess, NO_CHAT_ACCESS } from "services/expedienteChatService";

/**
 * Acceso del usuario al chat con IA sobre el expediente.
 *
 * Cache singleton (mismo patrón que useScbaCredentialError): el menú de cada
 * fila del listado y el detalle de la carpeta comparten UN fetch. Mientras
 * carga, o si el hub falla, el acceso es "no": la entrada del chat no se
 * muestra (fail-closed).
 */
let cache: ExpedienteChatAccess | null = null;
let cacheTs = 0;
let pendingFetch: Promise<ExpedienteChatAccess> | null = null;

const CACHE_TTL_MS = 60000;

async function fetchOnce(): Promise<ExpedienteChatAccess> {
	if (pendingFetch) return pendingFetch;
	pendingFetch = getExpedienteChatAccess()
		.catch(() => NO_CHAT_ACCESS)
		.then((value) => {
			cache = value;
			cacheTs = Date.now();
			pendingFetch = null;
			return value;
		});
	return pendingFetch;
}

export function useExpedienteChatAccess(): ExpedienteChatAccess & { loading: boolean } {
	const fresh = cache !== null && Date.now() - cacheTs < CACHE_TTL_MS;
	const [value, setValue] = useState<ExpedienteChatAccess>(cache ?? NO_CHAT_ACCESS);
	const [loading, setLoading] = useState(!fresh);

	useEffect(() => {
		if (cache !== null && Date.now() - cacheTs < CACHE_TTL_MS) return;
		let cancelled = false;
		fetchOnce().then((v) => {
			if (cancelled) return;
			setValue(v);
			setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	return { ...value, loading };
}
