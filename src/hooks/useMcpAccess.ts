import { useEffect, useState } from "react";

import useAuth from "hooks/useAuth";
import axiosInstance from "utils/axios";

/**
 * Estado de acceso del usuario a los asistentes de IA (conector MCP).
 *
 * GET /api/connected-apps/access — misma evaluación que el consent OAuth:
 * switch público por proveedor + grant beta + mantenimiento, y plan/add-on.
 * Con los switches apagados (beta cerrada) la landing pública se oculta, pero
 * un usuario con grant beta igual puede conectar: esto se lo dice a la UI.
 */

export interface McpProviderAccess {
	available: boolean;
	reason: null | "maintenance" | "beta_grant_required";
	message: string | null;
	publicEnabled: boolean;
}

export interface McpAccess {
	mcpUrl: string;
	providers: { claude: McpProviderAccess; chatgpt: McpProviderAccess };
	plan: { allowed: boolean; reason: string | null; upgradeUrl: string };
}

const useMcpAccess = () => {
	const { isLoggedIn } = useAuth();
	const [access, setAccess] = useState<McpAccess | null>(null);
	const [loading, setLoading] = useState<boolean>(isLoggedIn);

	useEffect(() => {
		if (!isLoggedIn) {
			setAccess(null);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		axiosInstance
			.get<McpAccess>("/api/connected-apps/access")
			.then((res) => {
				if (!cancelled) setAccess(res.data);
			})
			.catch(() => {
				if (!cancelled) setAccess(null);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [isLoggedIn]);

	return { access, loading };
};

export default useMcpAccess;
