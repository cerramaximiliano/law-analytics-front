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
	/** Opcional (C-TOGGLES): proveedor derivado por el hub — "claude" | "chatgpt" | "other". */
	provider?: string | null;
	/** Opcional: redirect URIs del cliente, si el hub las expone. */
	redirect_uris?: string[] | null;
}

/** Bloque legal del context (C-LEGAL-API). `privacy_version: null` = no se exige aceptación. */
export interface OauthConsentLegal {
	privacy_version: string | null;
	privacy_url?: string | null;
	previously_accepted_version: string | null;
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
	/** Ausente en hubs previos a la Etapa P → se trata como "sin exigencia". */
	legal?: OauthConsentLegal | null;
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
					code === "provider_disabled"
						? "Esta integración está deshabilitada temporalmente. Podés seguir usando Law||Analytics normalmente; volvé a intentar la conexión más tarde."
						: err.response?.data?.error_description ||
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
