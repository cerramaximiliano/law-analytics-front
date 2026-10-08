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
 * Escritura (Etapa F, ESCRITURA.md §2.1): `mcp:write` llega solo por step-up.
 * Si `requested_scope` lo incluye se muestra un bloque propio y la aceptación de
 * la política vigente se pide de nuevo (F-D4: el consent de escritura registra la
 * aceptación de la versión vigente). Si el hub manda `write.allowed === false`, se
 * muestra su mensaje y `mcp:write` no se manda en `granted_scopes`.
 *
 * Tracking: oauth_consent_view (mount), oauth_consent_accept, oauth_consent_reject
 * (los tres con `scope_write`).
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
import { PRIVACY_CONNECTORS_URL, aiProviderLabel, deriveAiProvider } from "utils/mcpLegal";
import { MCP_WRITE_RESOURCES_TEXT, MCP_WRITE_SCOPE, describeConsentScope, includesWriteScope } from "utils/mcpScopes";

import { Edit2, TickCircle } from "iconsax-react";

interface AcceptResponse {
	redirect_to: string;
}

/**
 * Mapping scope canónico → texto humano: utils/mcpScopes (compartido con la
 * tarjeta de apps conectadas). Para scopes desconocidos cae al ID.
 */
const describeScope = describeConsentScope;

/**
 * Plan ID interno (standard/premium/free) → nombre display.
 * Mantener alineado con la-subscriptions/config/stripe.js SUBSCRIPTION_PLANS.
 */
const PLAN_DISPLAY_NAMES: Record<string, string> = {
	standard: "Estándar",
	pro: "Pro",
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

	// Escritura (step-up): pedida = requested_scope incluye mcp:write; ofrecida = el
	// hub no la bloqueó (sin bloque `write` → se ofrece y el hub filtra al aceptar).
	const writeRequested = contextState.status === "ready" && includesWriteScope(contextState.context.requested_scope);
	const writeBlocked = writeRequested && contextState.status === "ready" && contextState.context.write?.allowed === false;
	const writeOffered = writeRequested && !writeBlocked;

	// Con escritura ofrecida la casilla no se pre-marca: el user confirma la política
	// vigente para este permiso nuevo (F-D4).
	const previouslyAccepted = !!privacyVersion && legal?.previously_accepted_version === privacyVersion && !writeOffered;
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
			// Con grant beta el plan_check.plan es "manual_grant": mostrar el plan real de la suscripción.
			const plan = contextState.context.user?.subscription_plan || contextState.context.plan_check.plan || "";
			const subscriptionStatus = contextState.context.plan_check.subscription_status;
			navigate(
				`/oauth/upgrade-required?reason=${encodeURIComponent(reason)}&plan=${encodeURIComponent(plan)}${
					subscriptionStatus ? `&subscription_status=${encodeURIComponent(subscriptionStatus)}` : ""
				}&consent_challenge=${encodeURIComponent(challenge || "")}`,
				{ replace: true },
			);
		}
	}, [contextState, navigate, challenge]);

	// Track view una vez que el context está ready Y el plan está OK
	// (si plan no OK redirigimos sin trackear consent_view, en su lugar trackeará oauth_upgrade_view).
	useEffect(() => {
		if (contextState.status === "ready" && contextState.context.plan_check.allowed) {
			trackOauthConsentView(clientId || undefined, clientName || undefined, verified || false, writeOffered);
		}
	}, [contextState, clientId, clientName, verified, writeOffered]);

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
	// Granted = lo pedido; si el hub bloqueó la escritura, no la mandamos (el hub igual la filtra).
	const grantedScopes = writeBlocked ? ctx.requested_scope.filter((s) => s !== MCP_WRITE_SCOPE) : ctx.requested_scope;
	const listedScopes = writeBlocked ? grantedScopes : ctx.requested_scope;
	const writeBlockedMessage =
		ctx.write?.message || "Por ahora tu cuenta no tiene habilitado el permiso de escritura para asistentes de IA.";

	const handleAccept = async () => {
		if (acceptBlocked) return;
		setGlobalError(null);
		setPolicyOutdated(false);
		setIsSubmitting(true);
		try {
			const res = await axiosInstance.post<AcceptResponse>("/api/oauth/consent/accept", {
				consent_challenge: challenge,
				granted_scopes: grantedScopes,
				remember,
				...(privacyVersion ? { accepted_policy_version: privacyVersion } : {}),
			});
			trackOauthConsentAccept(clientId || undefined, grantedScopes, writeOffered);
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
			trackOauthConsentReject(clientId || undefined, "user_declined", writeOffered);
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
						providerHints={[ctx.client.provider, ...(ctx.client.redirect_uris || []), ctx.client.vendor]}
						action={`quiere conectarse a tu cuenta de lawanalytics`}
					/>
				</Grid>

				<Grid item xs={12}>
					<Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
							Ingresaste como
						</Typography>
						<Typography variant="subtitle2">{userDisplay}</Typography>
						{ctx.user?.email && ctx.user.email !== userDisplay && (
							<Typography variant="body2" color="text.secondary" sx={{ display: "block" }}>
								{ctx.user.email}
							</Typography>
						)}
						{(ctx.user?.subscription_plan || planCheck.plan) && (
							<Typography variant="caption" color="text.secondary">
								Plan: {describePlan(ctx.user?.subscription_plan || planCheck.plan)}
								{ctx.user?.access_via === "beta_grant"
									? " · Acceso beta a conectores de IA"
									: planCheck.addon_status === "active"
										? " · Conector de IA activo"
										: ""}
							</Typography>
						)}
					</Box>
				</Grid>

				<Grid item xs={12}>
					<Typography variant="subtitle2" sx={{ mb: 1 }}>
						{clientName || "La aplicación"} podrá:
					</Typography>
					<List dense disablePadding>
						{listedScopes.map((scope) => (
							<ListItem key={scope} sx={{ py: 0.5 }}>
								<ListItemIcon sx={{ minWidth: 28 }}>
									<TickCircle size={18} variant="Bold" color="#2e7d32" />
								</ListItemIcon>
								<ListItemText primary={describeScope(scope)} primaryTypographyProps={{ variant: "body2" }} />
							</ListItem>
						))}
					</List>
				</Grid>

				{writeOffered && (
					<Grid item xs={12}>
						<Alert severity="warning" icon={<Edit2 size={22} />} data-testid="consent-write-block">
							<Typography variant="subtitle2" sx={{ mb: 0.5 }}>
								Permiso de escritura
							</Typography>
							<Typography variant="body2" sx={{ mb: 0.5 }}>
								{clientLabel} pide permiso para crear y modificar {MCP_WRITE_RESOURCES_TEXT} en tu cuenta.
							</Typography>
							<Typography variant="body2">
								No puede borrar ni archivar. Lo que cree queda marcado como creado por el asistente.
							</Typography>
						</Alert>
					</Grid>
				)}

				{writeBlocked && (
					<Grid item xs={12}>
						<Alert severity="info" data-testid="consent-write-blocked">
							<Typography variant="body2" sx={{ mb: 0.5 }}>
								{writeBlockedMessage}
							</Typography>
							<Typography variant="body2">
								Si continuás, {clientLabel} va a poder consultar tu cuenta pero no crear ni modificar nada.
							</Typography>
						</Alert>
					</Grid>
				)}

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
									y consiento que la información que {clientLabel} consulte sea transferida a {providerLabel} y procesada según sus propias
									políticas, incluso fuera de la Argentina.
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
							{isSubmitting ? "Procesando..." : writeOffered ? "Permitir" : "Autorizar"}
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
