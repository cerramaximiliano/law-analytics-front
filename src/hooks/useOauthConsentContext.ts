/**
 * Hook que carga el contexto de un consent_challenge desde el hub:
 * GET /api/oauth/consent/context?consent_challenge=X
 *
 * El hub responde con metadata enriquecida del cliente (verified vs no), info
 * del user, scopes pedidos, audiences, y el resultado del plan_check.
 */

import { useEffect, useState } from "react";
import axiosInstance from "utils/axios";

export interface EnrichedClient {
	client_id: string;
	name: string;
	vendor: string | null;
	verified: boolean;
	logo_url: string | null;
	vendor_url: string | null;
}

export interface OauthUserInfo {
	email: string;
	name: string;
}

export interface PlanCheckResult {
	allowed: boolean;
	reason: string;
	plan?: string;
	addon_status?: string;
	upgrade_url?: string;
	addon_subscribe_url?: string;
	current_period_end?: string;
}

export interface OauthConsentContext {
	client: EnrichedClient;
	user: OauthUserInfo | null;
	requested_scope: string[];
	requested_access_token_audience: string[];
	plan_check: PlanCheckResult;
	skip: boolean;
}

export type OauthConsentContextState =
	| { status: "loading" }
	| { status: "error"; code: string; message: string }
	| { status: "ready"; context: OauthConsentContext };

export function useOauthConsentContext(challenge: string | null): OauthConsentContextState {
	const [state, setState] = useState<OauthConsentContextState>({ status: "loading" });

	useEffect(() => {
		if (!challenge) {
			setState({
				status: "error",
				code: "missing_consent_challenge",
				message: "No se proporcionó un challenge de autorización.",
			});
			return;
		}

		let cancelled = false;
		setState({ status: "loading" });

		axiosInstance
			.get<OauthConsentContext>("/api/oauth/consent/context", {
				params: { consent_challenge: challenge },
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
