/**
 * Tarjeta del add-on "Conectores de IA" (mcp_access). Una sola pieza para todas las
 * superficies, así el valor, el precio, el estado y los CTA dicen lo mismo en todos lados:
 *
 *  - variant="plans"  → /plans, debajo de las tarjetas de planes (también para anónimos), y
 *                       /suscripciones/tables (location="pricing_tables": suma baja/reactivación).
 *  - variant="panel"  → dentro de una SectionCard: Cuenta → Suscripción e
 *                       Integraciones → Asistentes de IA.
 *
 * Estado: useMcpAddon (endpoint consolidado o fallback). Acciones: useMcpAddonActions.
 */

import { Box, Button, Chip, CircularProgress, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import { ArrowRight2, Card as CardIcon, Crown, InfoCircle, Lock1, TickCircle, Warning2 } from "iconsax-react";
import { useNavigate } from "react-router-dom";

import ClaudeAiLogo from "components/icons/ClaudeAiLogo";
import ChatGptLogo from "components/icons/ChatGptLogo";
import useAuth from "hooks/useAuth";
import useMcpAddon from "hooks/useMcpAddon";
import useMcpAddonActions, { MCP_INTEGRATIONS_PATH, MCP_SUBSCRIPTION_PATH } from "hooks/useMcpAddonActions";
import { usePublicAddons } from "hooks/usePublicAddons";
import { pushGTMEvent, trackMcpAddonCtaClick, type McpAddonCtaLocation } from "utils/gtm";
import {
	MCP_ADDON_BENEFITS,
	MCP_ADDON_NAME,
	MCP_CTA_LABELS,
	formatAddonDate,
	mcpUserState,
	planLabel,
	resolveMcpCta,
	type McpCtaKind,
} from "utils/mcpAddonState";
import { formatMonthlyPrice } from "utils/mcpBannerCopy";
import type { McpAddonStatus } from "types/mcpAddon";

const BRAND_BLUE = "#3A7BFF";
const LIVE_GREEN = "#22C55E";
const STALE_AMBER = "#F59E0B";

interface Props {
	variant: "plans" | "panel";
	location: McpAddonCtaLocation;
	/** /plans con plan gratuito: en vez de navegar, subir al grid de planes. */
	onUpgradeClick?: () => void;
	/** Beta cerrada sin grant: acción "Solicitar acceso beta". Sin esto, solo se muestra el aviso. */
	onBetaRequest?: () => void;
}

type Tone = { color: string; label: string };

function statusTone(addon: McpAddonStatus | null, theme: Theme): Tone | null {
	if (!addon) return null;
	if (addon.status === "active") return { color: LIVE_GREEN, label: "Activo" };
	if (addon.status === "past_due") return { color: STALE_AMBER, label: "Pago pendiente" };
	if (addon.status === "incomplete") return { color: STALE_AMBER, label: "Cobro incompleto" };
	if (addon.status === "canceling") {
		const d = formatAddonDate(addon.endsAt);
		if (addon.cancellationSource === "addon") return { color: STALE_AMBER, label: d ? `Activo hasta el ${d}` : "Baja programada" };
		// Se va con la suscripción: no es reactivable por separado (canReactivate false).
		return {
			color: theme.palette.text.secondary,
			label: d ? `Se cancela el ${d} junto con tu suscripción` : "Se cancela junto con tu suscripción",
		};
	}
	if (addon.access.via === "beta_grant") return { color: BRAND_BLUE, label: "Acceso beta" };
	if (addon.availabilityReason === "maintenance") return { color: STALE_AMBER, label: "En mantenimiento" };
	if (!addon.publicAvailable)
		return { color: theme.palette.text.secondary, label: addon.adminBypass ? "Venta cerrada · admin" : "Beta cerrada" };
	return null;
}

/** Línea de contexto debajo del precio / estado. */
function statusDetail(addon: McpAddonStatus | null, cta: McpCtaKind): { icon: JSX.Element; text: string; color?: string } | null {
	if (!addon) return null;
	const next = formatAddonDate(addon.nextBillingDate);
	if (addon.status === "past_due")
		return {
			icon: <Warning2 size={16} variant="Bulk" />,
			text: "No pudimos cobrar el último pago. Seguís con acceso mientras se reintenta el cobro; actualizá tu medio de pago para no perderlo.",
			color: STALE_AMBER,
		};
	if (addon.status === "incomplete")
		return {
			icon: <Warning2 size={16} variant="Bulk" />,
			text: "El primer cobro del add-on no se completó. Actualizá tu medio de pago para activarlo.",
			color: STALE_AMBER,
		};
	if (addon.status === "canceling") {
		const d = formatAddonDate(addon.endsAt);
		if (addon.cancellationSource === "addon")
			return {
				icon: <InfoCircle size={16} variant="Bulk" />,
				text: d
					? `Diste de baja el add-on: seguís con acceso hasta el ${d} y no se cobra el próximo período. Podés reactivarlo antes sin costo.`
					: "Diste de baja el add-on: seguís con acceso hasta el fin del período y no se cobra el próximo. Podés reactivarlo antes sin costo.",
			};
		return {
			icon: <InfoCircle size={16} variant="Bulk" />,
			text: `${
				d
					? `Tu suscripción se cancela el ${d} y el add-on se va con ella. Hasta entonces seguís con acceso.`
					: "Tu suscripción se cancela al final del período y el add-on se va con ella."
			} Para conservarlo, primero reactivá tu suscripción: el add-on vuelve con ella.`,
		};
	}
	if (addon.status === "active")
		return next
			? { icon: <TickCircle size={16} variant="Bulk" />, text: `Próximo cobro: ${next}, junto con tu plan.`, color: LIVE_GREEN }
			: null;
	if (addon.access.via === "beta_grant")
		return {
			icon: <TickCircle size={16} variant="Bulk" />,
			text: "Tu cuenta tiene acceso beta: ya podés conectar tu asistente sin costo.",
		};
	switch (cta) {
		case "upgrade":
			return {
				icon: <Lock1 size={16} variant="Bulk" />,
				text: `Disponible con los planes Estándar, Pro y Premium. Tu plan actual: ${planLabel(addon.plan)}.`,
			};
		case "fix_payment":
			return {
				icon: <Warning2 size={16} variant="Bulk" />,
				text: "Tu suscripción tiene un pago pendiente o no está activa. Actualizá el pago para poder activar el add-on.",
				color: STALE_AMBER,
			};
		case "reactivate":
			return {
				icon: <InfoCircle size={16} variant="Bulk" />,
				text: "Tu suscripción está programada para cancelarse. Reactivala para poder sumar el add-on.",
			};
		case "team":
			return {
				icon: <InfoCircle size={16} variant="Bulk" />,
				text: "Usás el plan de un equipo: el add-on lo activa el titular de la suscripción desde su cuenta.",
			};
		case "beta_request":
			return {
				icon: <InfoCircle size={16} variant="Bulk" />,
				text: "Estamos en beta cerrada con un grupo de estudios. Muy pronto vas a poder activarlo desde acá.",
			};
		case "unavailable":
			if (addon.availabilityReason === "maintenance")
				return {
					icon: <Warning2 size={16} variant="Bulk" />,
					text: addon.maintenanceMessage || "La conexión con asistentes está en mantenimiento. Volvé a intentar en un rato.",
					color: STALE_AMBER,
				};
			if (addon.status === "none" && addon.eligible && addon.price.amount == null)
				return { icon: <InfoCircle size={16} variant="Bulk" />, text: "No pudimos obtener el precio. Probá de nuevo en unos minutos." };
			return null;
		default:
			if (addon.adminBypass && addon.status === "none")
				return {
					icon: <InfoCircle size={16} variant="Bulk" />,
					text: "La venta está cerrada al público; como admin podés contratarlo igual.",
				};
			return null;
	}
}

const AiLogosPair = ({ size }: { size: number }) => {
	const theme = useTheme();
	const frame = {
		width: size + 16,
		height: size + 16,
		borderRadius: "50%",
		display: "grid",
		placeItems: "center",
		bgcolor: "background.paper",
		border: `1px solid ${theme.palette.divider}`,
	};
	return (
		<Stack direction="row" sx={{ flexShrink: 0 }}>
			<Box sx={{ ...frame, zIndex: 1 }}>
				<ClaudeAiLogo size={size} />
			</Box>
			<Box sx={{ ...frame, ml: -1.25 }}>
				<ChatGptLogo size={size} />
			</Box>
		</Stack>
	);
};

const McpAddonCard = ({ variant, location, onUpgradeClick, onBetaRequest }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const navigate = useNavigate();
	const { isLoggedIn } = useAuth();
	const { addon, loading } = useMcpAddon();
	const { addons: publicAddons } = usePublicAddons();
	const { startPurchase, startCancel, reactivate, openBillingPortal, busy, dialogs } = useMcpAddonActions({ location });

	const publicAddon = publicAddons.find((a) => a.key === "mcp_access") || null;
	const price =
		addon?.price.amount != null ? addon.price : publicAddon ? { amount: publicAddon.priceMonthly, currency: publicAddon.currency } : null;
	const priceLabel = price ? formatMonthlyPrice(price.amount, price.currency) : null;
	const cta = resolveMcpCta(addon, isLoggedIn);
	const tone = statusTone(addon, theme);
	const detail = statusDetail(addon, cta);
	const hasAddon = !!addon && addon.status !== "none";
	const showPrice = !!priceLabel && !hasAddon && addon?.access.via !== "beta_grant";

	const handlePrimary = () => {
		const userState = mcpUserState(addon, isLoggedIn);
		if (location === "plans_page") {
			// Evento ya mapeado en la-ads (tracking-map § Conector MCP): mismo nombre y user_state.
			pushGTMEvent("mcp_plans_cta_click", { cta_location: "plans_page", user_state: userState });
		} else {
			trackMcpAddonCtaClick(location, cta, userState);
		}
		switch (cta) {
			case "register":
				navigate(`/register?source=mcp_addon&plan=standard`);
				return;
			case "upgrade":
				if (onUpgradeClick) onUpgradeClick();
				else navigate("/plans");
				return;
			case "activate":
				startPurchase();
				return;
			case "fix_payment":
				openBillingPortal();
				return;
			case "reactivate":
				navigate(MCP_SUBSCRIPTION_PATH);
				return;
			case "connect":
			case "unavailable":
				navigate(MCP_INTEGRATIONS_PATH);
				return;
			case "beta_request":
				onBetaRequest?.();
				return;
			default:
				return;
		}
	};

	if (isLoggedIn && loading) {
		return variant === "plans" ? (
			<Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
		) : (
			<Stack spacing={1}>
				<Skeleton variant="text" width="60%" />
				<Skeleton variant="rounded" height={72} />
			</Stack>
		);
	}

	const primaryDisabled = busy;
	const primaryLabel = busy
		? "Procesando…"
		: cta === "connect" && location === "integrations_ia"
		? "Ver cómo conectar"
		: MCP_CTA_LABELS[cta];
	const primaryIcon =
		cta === "upgrade" ? (
			<Crown size={16} variant="Bulk" />
		) : cta === "fix_payment" ? (
			<CardIcon size={16} variant="Bulk" />
		) : (
			<ArrowRight2 size={16} />
		);

	// En Integraciones con acceso, la guía de conexión ya está debajo: no repetir el botón.
	// Con pago pendiente el principal es "Actualizar el pago" y conectar queda como secundario.
	const pastDue = addon?.status === "past_due";
	const showPrimary =
		pastDue ||
		(!(variant === "panel" && location === "integrations_ia" && cta === "connect") &&
			cta !== "team" &&
			// En Suscripción el botón "Reactivar" ya está en la tarjeta del plan.
			!(cta === "reactivate" && location === "account_subscription") &&
			(cta !== "beta_request" || !!onBetaRequest));
	const canCancel = !!addon?.canRemove;
	const canReactivate = !!addon?.canReactivate;

	const primaryButton = showPrimary && (
		<Button
			variant={cta === "connect" && variant === "plans" ? "outlined" : "contained"}
			color={pastDue ? "warning" : "primary"}
			onClick={pastDue ? openBillingPortal : handlePrimary}
			disabled={primaryDisabled}
			startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
			endIcon={busy ? undefined : pastDue ? <CardIcon size={16} variant="Bulk" /> : primaryIcon}
			fullWidth={variant === "plans"}
			sx={{ textTransform: "none", fontWeight: 600, boxShadow: "none" }}
		>
			{pastDue ? MCP_CTA_LABELS.fix_payment : primaryLabel}
		</Button>
	);

	const secondaryButtons = (
		<>
			{pastDue && location !== "integrations_ia" && (
				<Button onClick={() => navigate(MCP_INTEGRATIONS_PATH)} sx={{ textTransform: "none", fontWeight: 600 }}>
					Conectar mi asistente
				</Button>
			)}
			{hasAddon && variant === "panel" && location === "integrations_ia" && (
				<Button onClick={() => navigate(MCP_SUBSCRIPTION_PATH)} sx={{ textTransform: "none", fontWeight: 600 }}>
					Gestionar en Suscripción
				</Button>
			)}
			{canCancel && ((variant === "panel" && location === "account_subscription") || location === "pricing_tables") && (
				<Button color="error" onClick={startCancel} disabled={busy} sx={{ textTransform: "none", fontWeight: 600 }}>
					Quitar add-on
				</Button>
			)}
			{canReactivate && (variant === "panel" || location === "pricing_tables") && (
				<Button
					variant="outlined"
					onClick={reactivate}
					disabled={busy}
					startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
					sx={{ textTransform: "none", fontWeight: 600 }}
				>
					Reactivar add-on
				</Button>
			)}
		</>
	);

	const statusRow = (tone || detail) && (
		<Stack spacing={0.75}>
			{tone && (
				<Box
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.75,
						alignSelf: "flex-start",
						px: 1,
						py: 0.25,
						borderRadius: 10,
						bgcolor: alpha(tone.color, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(tone.color, isDark ? 0.4 : 0.28)}`,
					}}
				>
					<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: tone.color }} />
					<Typography
						sx={{
							fontSize: "0.72rem",
							fontWeight: 600,
							color: tone.color === theme.palette.text.secondary ? "text.secondary" : tone.color,
							lineHeight: 1.6,
						}}
					>
						{tone.label}
					</Typography>
				</Box>
			)}
			{detail && (
				<Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ color: detail.color || "text.secondary" }}>
					<Box sx={{ flexShrink: 0, mt: "1px", display: "flex" }}>{detail.icon}</Box>
					<Typography variant="body2" sx={{ color: "text.secondary" }}>
						{detail.text}
					</Typography>
				</Stack>
			)}
		</Stack>
	);

	if (variant === "panel") {
		return (
			<>
				<Stack spacing={1.75}>
					<Stack direction="row" spacing={1.5} alignItems="center">
						<AiLogosPair size={18} />
						<Box sx={{ minWidth: 0, flex: 1 }}>
							{/* El nombre del add-on ya está en el encabezado de la sección que lo contiene. */}
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								Claude.ai y ChatGPT con tus datos
							</Typography>
							<Typography variant="caption" color="text.secondary">
								Solo lectura · lo desconectás cuando quieras
							</Typography>
						</Box>
						{showPrice && <Typography sx={{ fontWeight: 700, color: BRAND_BLUE, whiteSpace: "nowrap" }}>{priceLabel}</Typography>}
					</Stack>
					{!hasAddon && addon?.access.via !== "beta_grant" && (
						<Box
							component="ul"
							sx={{
								m: 0,
								p: 0,
								listStyle: "none",
								display: "grid",
								gap: 0.75,
								columnGap: 2,
								gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
							}}
						>
							{MCP_ADDON_BENEFITS.map((b) => (
								<Stack key={b} component="li" direction="row" spacing={0.75} alignItems="flex-start">
									<TickCircle size={15} variant="Bulk" color={BRAND_BLUE} style={{ flexShrink: 0, marginTop: 2 }} />
									<Typography variant="body2" color="text.secondary">
										{b}
									</Typography>
								</Stack>
							))}
						</Box>
					)}
					{statusRow}
					{(showPrimary || hasAddon) && (
						<Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
							{primaryButton}
							{secondaryButtons}
						</Stack>
					)}
				</Stack>
				{dialogs}
			</>
		);
	}

	// ── variant="plans" ──
	return (
		<>
			<Box
				sx={{
					p: { xs: 2.5, md: 4 },
					borderRadius: 3,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.3 : 0.2)}`,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.07 : 0.04),
				}}
			>
				<Grid container spacing={{ xs: 2.5, md: 4 }} alignItems="center">
					<Grid item xs={12} md={7}>
						<Stack spacing={2}>
							<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 1 }}>
								<AiLogosPair size={24} />
								<Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
									{MCP_ADDON_NAME}
								</Typography>
								<Chip
									label="Add-on"
									size="small"
									sx={{ fontWeight: 600, letterSpacing: 0.5, bgcolor: alpha(BRAND_BLUE, 0.12), color: BRAND_BLUE }}
								/>
							</Stack>
							<Typography variant="body1" color="text.secondary">
								Conectá Claude.ai o ChatGPT a tu cuenta y preguntales por tus causas desde el chat, con tus datos reales.
							</Typography>
							<Stack spacing={0.75} component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
								{MCP_ADDON_BENEFITS.map((b) => (
									<Stack key={b} component="li" direction="row" spacing={1} alignItems="flex-start">
										<TickCircle size={18} variant="Bulk" color={BRAND_BLUE} style={{ flexShrink: 0, marginTop: 1 }} />
										<Typography variant="body2">{b}</Typography>
									</Stack>
								))}
							</Stack>
						</Stack>
					</Grid>
					<Grid item xs={12} md={5}>
						<Stack
							spacing={1.5}
							sx={{
								p: { xs: 2, md: 2.5 },
								borderRadius: 2,
								bgcolor: "background.paper",
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.14)}`,
							}}
						>
							{showPrice && (
								<Box>
									<Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
										{priceLabel}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Se suma a tu plan Estándar, Pro o Premium. Cancelás cuando quieras.
									</Typography>
								</Box>
							)}
							{statusRow}
							{primaryButton}
							{secondaryButtons}
							{!isLoggedIn && (
								<Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
									¿Ya tenés cuenta?{" "}
									<Box component="a" href="/login?source=mcp_addon" sx={{ color: BRAND_BLUE, fontWeight: 600, textDecoration: "none" }}>
										Iniciá sesión
									</Box>
								</Typography>
							)}
						</Stack>
					</Grid>
				</Grid>
			</Box>
			{dialogs}
		</>
	);
};

export default McpAddonCard;
