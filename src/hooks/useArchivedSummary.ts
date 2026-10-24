import { useCallback, useEffect, useRef, useState } from "react";

import { ArchivedSummary, fetchArchivedSummary } from "services/archivedSummaryService";

// Pide el resumen de archivadas por plan al montar (si `enabled`) y expone
// `refresh` para recalcularlo tras archivar/desarchivar. Falla silencioso:
// summary queda en null y las vistas usan su copy sin números.
const useArchivedSummary = (enabled: boolean = true) => {
	const [summary, setSummary] = useState<ArchivedSummary | null>(null);
	const mountedRef = useRef(true);

	const refresh = useCallback(async () => {
		const result = await fetchArchivedSummary();
		if (mountedRef.current) setSummary(result);
		return result;
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		if (enabled) refresh();
		return () => {
			mountedRef.current = false;
		};
	}, [enabled, refresh]);

	return { summary: enabled ? summary : null, refresh };
};

export default useArchivedSummary;
