import { useEffect, useState } from "react";
import { fetchActosPropiosCarpeta, type ActosPropiosCarpeta } from "services/actividadPropiaService";

/** Historial de actos propios de la carpeta. Una sola lectura por carpeta; la comparten la tarjeta y la sub-vista. */
export const useActosPropios = (folderId?: string, enabled = true) => {
	const [data, setData] = useState<ActosPropiosCarpeta | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!folderId || !enabled) return;
		let vivo = true;
		setLoading(true);
		setError(false);
		fetchActosPropiosCarpeta(folderId).then((r) => {
			if (!vivo) return;
			setData(r);
			setError(r === null);
			setLoading(false);
		});
		return () => {
			vivo = false;
		};
	}, [folderId, enabled]);

	return { data, loading, error };
};
