/**
 * Hook que carga el contexto de un login_challenge desde el hub:
 * GET /api/oauth/login/context?login_challenge=X
 *
 * Maneja los 3 estados: loading, error (challenge inexistente/expirado, hub caído),
 * y ready (challenge válido + metadata del cliente OAuth).
 */

import { useEffect, useState } from "react";
import axiosInstance from "utils/axios";

export interface OauthClient {
	client_id: string;
	client_name: string;
	logo_uri?: string | null;
}

export interface OauthLoginContext {
	client: OauthClient;
	requested_scope: string[];
	skip: boolean;
	subject: string | null;
}

export type OauthLoginContextState =
	| { status: "loading" }
	| { status: "error"; code: string; message: string }
	| { status: "ready"; context: OauthLoginContext };

export function useOauthLoginContext(challenge: string | null): OauthLoginContextState {
	const [state, setState] = useState<OauthLoginContextState>({ status: "loading" });

	useEffect(() => {
		if (!challenge) {
			setState({
				status: "error",
				code: "missing_login_challenge",
				message: "No se proporcionó un challenge de autorización.",
			});
			return;
		}

		let cancelled = false;
		setState({ status: "loading" });

		axiosInstance
			.get<OauthLoginContext>("/api/oauth/login/context", {
				params: { login_challenge: challenge },
			})
			.then((res) => {
				if (cancelled) return;
				setState({ status: "ready", context: res.data });
			})
			.catch((err) => {
				if (cancelled) return;
				const code = err.response?.data?.error || "request_failed";
				const message =
					err.response?.data?.error_description ||
					(err.response?.status === 410
						? "El enlace de autorización expiró. Reintentá desde la aplicación."
						: err.response?.status === 400
							? "El enlace de autorización es inválido o ya fue usado."
							: "No se pudo cargar la solicitud de autorización. Intentá de nuevo en un momento.");
				setState({ status: "error", code, message });
			});

		return () => {
			cancelled = true;
		};
	}, [challenge]);

	return state;
}
