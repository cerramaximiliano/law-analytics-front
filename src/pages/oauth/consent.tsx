/**
 * /oauth/consent — pantalla donde el user autoriza (o rechaza) que un cliente
 * OAuth externo (Claude.ai, ChatGPT, etc.) acceda a su cuenta lawanalytics.
 *
 * Flow:
 *  1. Hydra redirige acá con ?consent_challenge=X (después del login exitoso).
 *  2. Cargamos GET /api/oauth/consent/context para obtener:
 *     - Info enriquecida del cliente (incluyendo flag `verified` vs allowlist)
 *     - Info del user (email + nombre)
 *     - Scopes pedidos por el cliente
 *     - Plan check (si plan/addon habilitan MCP)
 *  3. Si plan_check.allowed === false → redirect a /oauth/upgrade-required con el
 *     reason para que el front muestre CTA correcto (upgrade plan / activar add-on).
 *  4. Si OK, renderizamos consent UI: identidad cliente, identidad user, scopes,
 *     2 botones (Rechazar/Autorizar).
 *  5. Submit → POST a /api/oauth/consent/{accept,reject} → window.location.href
 *     al redirect_to devuelto por Hydra.
 *
 * Tracking: oauth_consent_view (mount), oauth_consent_accept, oauth_consent_reject.
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Divider,
	FormControlLabel,
	Grid,
	Link,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";

import AuthWrapper from "sections/auth/AuthWrapper";
import Logo from "components/logo";
import OauthClientBanner from "sections/oauth/OauthClientBanner";
import axiosInstance from "utils/axios";
import { useOauthConsentContext } from "hooks/useOauthConsentContext";
import { trackOauthConsentAccept, trackOauthConsentReject, trackOauthConsentView } from "utils/gtm";
import { MCP_SHARED_DATA_TEXT, PRIVACY_CONNECTORS_URL, aiProviderLabel, deriveAiProvider } from "utils/mcpLegal";

import { TickCircle } from "iconsax-react";

interface AcceptResponse {
	redirect_to: string;
}

/**
 * Mapping scope canónico → texto humano. Para scopes desconocidos cae al ID.
 * Mantener sincronizado con services/oauthAuthService.js del hub si se agregan
 * scopes nuevos.
 */
const SCOPE_LABELS: Record<string, string> = {
	openid: "Saber tu identidad básica (email, nombre)",
	offline_access: "Mantener la sesión activa entre conversaciones (sin pedirte autorización cada vez)",
	"mcp:access": `Consultar la información de tu cuenta: ${MCP_SHARED_DATA_TEXT}`,
};

function describeScope(scope: string): string {
	return SCOPE_LABELS[scope] || scope;
}

/**
 * Plan ID interno (standard/premium/free) → nombre display.
 * Mantener alineado con la-subscriptions/config/stripe.js SUBSCRIPTION_PLANS.
 */
const PLAN_DISPLAY_NAMES: Record<string, string> = {
	standard: "Estándar",
	premium: "Premium",
	free: "Gratis",
};

function describePlan(plan?: string | null): string | null {
	if (!plan) return null;
	return PLAN_DISPLAY_NAMES[plan] || plan;
}

const OauthConsentPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const challenge = searchParams.get("consent_challenge");
	const contextState = useOauthConsentContext(challenge);

	const [globalError, setGlobalError] = useState<string | null>(null);
	const [remember, setRemember] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [policyAccepted, setPolicyAccepted] = useState(false);
	const [policyOutdated, setPolicyOutdated] = useState(false);

	// C-LEGAL-API: si hay política activa, la aceptación es obligatoria. Pre-marcada
	// si el user ya aceptó exactamente esta versión.
	const legal = contextState.status === "ready" ? contextState.context.legal ?? null : null;
	const privacyVersion = legal?.privacy_version || null;
	const previouslyAccepted = !!privacyVersion && legal?.previously_accepted_version === privacyVersion;
	useEffect(() => {
		if (previouslyAccepted) setPolicyAccepted(true);
	}, [previouslyAccepted]);

	const clientId = contextState.status === "ready" ? contextState.context.client.client_id : null;
	const clientName = contextState.status === "ready" ? contextState.context.client.name : null;
	const verified = contextState.status === "ready" ? contextState.context.client.verified : undefined;
	const logoUrl = contextState.status === "ready" ? contextState.context.client.logo_url : null;
	const planCheck = contextState.status === "ready" ? contextState.context.plan_check : null;

	// Si el plan no califica → redirigir a upgrade page con el reason.
	useEffect(() => {
		if (contextState.status === "ready" && !contextState.context.plan_check.allowed) {
			const reason = contextState.context.plan_check.reason || "unknown";
			const plan = contextState.context.plan_check.plan || "";
			navigate(
				`/oauth/upgrade-required?reason=${encodeURIComponent(reason)}&plan=${encodeURIComponent(
					plan,
				)}&consent_challenge=${encodeURIComponent(challenge || "")}`,
				{ replace: true },
			);
		}
	}, [contextState, navigate, challenge]);

	// Track view una vez que el context está ready Y el plan está OK
	// (si plan no OK redirigimos sin trackear consent_view, en su lugar trackeará oauth_upgrade_view).
	useEffect(() => {
		if (contextState.status === "ready" && contextState.context.plan_check.allowed) {
			trackOauthConsentView(clientId || undefined, clientName || undefined, verified || false);
		}
	}, [contextState, clientId, clientName, verified]);

	if (contextState.status === "loading") {
		return (
			<AuthWrapper>
				<Box sx={{ textAlign: "center", py: 4 }}>
					<CircularProgress />
					<Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
						Cargando solicitud de autorización...
					</Typography>
				</Box>
			</AuthWrapper>
		);
	}

	if (contextState.status === "error") {
		// 403 provider_disabled (C-TOGGLES): el admin apagó la integración de este
		// proveedor. No es un error del user → aviso, no error.
		const providerDisabled = contextState.code === "provider_disabled";
		return (
			<AuthWrapper>
				<Grid container spacing={3}>
					<Grid item xs={12} sx={{ textAlign: "center" }}>
						<Logo to="/" />
					</Grid>
					<Grid item xs={12}>
						<Alert severity={providerDisabled ? "warning" : "error"}>
							<Typography variant="subtitle2" sx={{ mb: 0.5 }}>
								{providerDisabled ? "Integración no disponible para tu cuenta" : "No se puede continuar"}
							</Typography>
							<Typography variant="body2">{contextState.message}</Typography>
						</Alert>
					</Grid>
				</Grid>
			</AuthWrapper>
		);
	}

	// status === "ready" pero plan_check NO allowed → en useEffect redirigimos.
	// Mientras tanto mostrar loading para no flashear UI antes del redirect.
	if (!planCheck?.allowed) {
		return (
			<AuthWrapper>
				<Box sx={{ textAlign: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			</AuthWrapper>
		);
	}

	const ctx = contextState.context;
	const userDisplay = ctx.user?.name || ctx.user?.email || "Tu cuenta";

	// Proveedor del asistente para el texto de aceptación (Anthropic / OpenAI / genérico).
	const providerLabel = aiProviderLabel(
		deriveAiProvider(ctx.client.provider, ...(ctx.client.redirect_uris || []), ctx.client.vendor, ctx.client.vendor_url, ctx.client.name),
	);
	const clientLabel = clientName || "la aplicación";
	const privacyUrl = legal?.privacy_url || PRIVACY_CONNECTORS_URL;
	const acceptBlocked = !!privacyVersion && !policyAccepted;

	const handleAccept = async () => {
		if (acceptBlocked) return;
		setGlobalError(null);
		setPolicyOutdated(false);
		setIsSubmitting(true);
		try {
			const res = await axiosInstance.post<AcceptResponse>("/api/oauth/consent/accept", {
				consent_challenge: challenge,
				granted_scopes: ctx.requested_scope,
				remember,
				...(privacyVersion ? { accepted_policy_version: privacyVersion } : {}),
			});
			trackOauthConsentAccept(clientId || undefined, ctx.requested_scope);
			window.location.href = res.data.redirect_to;
		} catch (err: any) {
			// 400 policy_acceptance_required: la versión aceptada no coincide con la
			// vigente (se publicó una nueva mientras tanto). El challenge NO se rechazó:
			// recargar trae la versión nueva y el user puede aceptar de nuevo.
			if (err.response?.status === 400 && err.response?.data?.error === "policy_acceptance_required") {
				setPolicyAccepted(false);
				setPolicyOutdated(true);
				setGlobalError(
					"La Política de Privacidad se actualizó mientras autorizabas. Recargá la página para ver la versión vigente y volvé a aceptarla.",
				);
				setIsSubmitting(false);
				return;
			}
			const msg = err.response?.data?.error_description || "No se pudo completar la autorización. Intentá de nuevo.";
			setGlobalError(msg);
			setIsSubmitting(false);
		}
	};

	const handleReject = async () => {
		setGlobalError(null);
		setIsSubmitting(true);
		try {
			const res = await axiosInstance.post<AcceptResponse>("/api/oauth/consent/reject", {
				consent_challenge: challenge,
				reason: "user_declined",
			});
			trackOauthConsentReject(clientId || undefined, "user_declined");
			window.location.href = res.data.redirect_to;
		} catch (err: any) {
			const msg = err.response?.data?.error_description || "No se pudo cancelar la solicitud. Intentá de nuevo.";
			setGlobalError(msg);
			setIsSubmitting(false);
		}
	};

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12} sx={{ textAlign: "center" }}>
					<Logo to="/" animation="letters" />
				</Grid>

				<Grid item xs={12}>
					<OauthClientBanner
						clientId={clientId}
						clientName={clientName}
						logoUrl={logoUrl}
						verified={verified}
						action={`quiere conectarse a tu cuenta de lawanalytics`}
					/>
				</Grid>

				<Grid item xs={12}>
					<Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
							Ingresaste como
						</Typography>
						<Typography variant="subtitle2">{userDisplay}</Typography>
						{planCheck.plan && (
							<Typography variant="caption" color="text.secondary">
								Plan: {describePlan(planCheck.plan)}
								{planCheck.addon_status === "active" && " · MCP Access activo"}
							</Typography>
						)}
					</Box>
				</Grid>

				<Grid item xs={12}>
					<Typography variant="subtitle2" sx={{ mb: 1 }}>
						{clientName || "La aplicación"} podrá:
					</Typography>
					<List dense disablePadding>
						{ctx.requested_scope.map((scope) => (
							<ListItem key={scope} sx={{ py: 0.5 }}>
								<ListItemIcon sx={{ minWidth: 28 }}>
									<TickCircle size={18} variant="Bold" color="#2e7d32" />
								</ListItemIcon>
								<ListItemText primary={describeScope(scope)} primaryTypographyProps={{ variant: "body2" }} />
							</ListItem>
						))}
					</List>
				</Grid>

				<Grid item xs={12}>
					<FormControlLabel
						control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={isSubmitting} />}
						label={
							<Typography variant="body2">
								Recordar esta autorización por 30 días (no te volveré a preguntar para esta aplicación)
							</Typography>
						}
					/>
				</Grid>

				{privacyVersion && (
					<Grid item xs={12}>
						<FormControlLabel
							sx={{ alignItems: "flex-start" }}
							control={
								<Checkbox
									checked={policyAccepted}
									onChange={(e) => setPolicyAccepted(e.target.checked)}
									disabled={isSubmitting}
									sx={{ pt: 0.5 }}
									inputProps={{ "aria-required": true }}
								/>
							}
							label={
								<Typography variant="body2">
									Leí y acepto la{" "}
									<Link href={privacyUrl} target="_blank" rel="noopener noreferrer">
										Política de Privacidad (sección Conectores de IA)
									</Link>{" "}
									y entiendo que la información que {clientLabel} consulte será procesada por {providerLabel} según sus propias políticas.
								</Typography>
							}
						/>
					</Grid>
				)}

				{globalError && (
					<Grid item xs={12}>
						<Alert
							severity="error"
							action={
								policyOutdated ? (
									<Button color="inherit" size="small" onClick={() => window.location.reload()}>
										Recargar
									</Button>
								) : undefined
							}
						>
							{globalError}
						</Alert>
					</Grid>
				)}

				<Grid item xs={12}>
					<Divider />
				</Grid>

				<Grid item xs={12}>
					<Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} justifyContent="flex-end">
						<Button variant="outlined" color="secondary" onClick={handleReject} disabled={isSubmitting} size="large">
							Rechazar
						</Button>
						<Button variant="contained" color="primary" onClick={handleAccept} disabled={isSubmitting || acceptBlocked} size="large">
							{isSubmitting ? "Procesando..." : "Autorizar"}
						</Button>
					</Stack>
				</Grid>

				<Grid item xs={12}>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
						Podés revocar este acceso en cualquier momento desde Perfil → Integraciones → Asistentes de IA.
					</Typography>
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default OauthConsentPage;
