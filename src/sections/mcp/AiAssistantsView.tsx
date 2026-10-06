/**
 * Integraciones → Asistentes de IA (`/apps/profiles/account/pjn?view=ia`).
 *
 *  - Sin acceso (Free, pago sin add-on, suscripción impaga…): la tarjeta del add-on va
 *    primero con su CTA (activar / mejorar plan / actualizar pago) y la guía no repite el aviso.
 *  - Con acceso (add-on o grant beta): guía de conexión + asistentes conectados, y al costado
 *    el estado del add-on (activo / pago pendiente / se cancela el X / acceso beta).
 *  - Beta cerrada sin grant: aviso de beta (mensaje del hub) en la guía y estado "Beta cerrada".
 */

import { Grid } from "@mui/material";

import AiSparklesIcon from "components/icons/AiSparklesIcon";
import useMcpAddon from "hooks/useMcpAddon";
import useAuth from "hooks/useAuth";
import ConnectedAiApps from "sections/apps/profiles/account/ConnectedAiApps";
import McpAddonCard from "sections/mcp/McpAddonCard";
import McpSectionShell from "sections/mcp/McpSectionShell";
import { resolveMcpCta } from "utils/mcpAddonState";

const sparkles = <AiSparklesIcon size={18} animated={false} sx={{ stroke: "currentColor" }} />;

const AiAssistantsView = () => {
	const { isLoggedIn } = useAuth();
	const { addon, loading } = useMcpAddon();
	const cta = resolveMcpCta(addon, isLoggedIn);
	const hasAccess = cta === "connect";
	// Mientras carga no sabemos si mostrar el CTA arriba: se asume acceso (el caso de los testers beta).
	const addonFirst = !loading && !hasAccess && cta !== "beta_request";

	const addonSection = (
		<McpSectionShell
			eyebrow="Add-on"
			title="Conectores de IA"
			subtitle={addonFirst ? "Activalo para usar tus datos desde Claude.ai o ChatGPT" : "Estado de tu add-on"}
			icon={sparkles}
		>
			<McpAddonCard variant="panel" location="integrations_ia" />
		</McpSectionShell>
	);

	const appsSection = (
		<McpSectionShell
			eyebrow="Integración · Asistentes de IA"
			title="Asistentes conectados"
			subtitle="Asistentes de IA (Claude.ai, ChatGPT) que autorizaste a consultar tu cuenta en modo solo lectura. Podés desconectarlos cuando quieras."
			icon={sparkles}
		>
			<ConnectedAiApps hidePlanNotice={addonFirst} />
		</McpSectionShell>
	);

	if (addonFirst) {
		return (
			<Grid container spacing={2.5}>
				<Grid item xs={12} md={8}>
					{addonSection}
				</Grid>
				<Grid item xs={12} md={8}>
					{appsSection}
				</Grid>
			</Grid>
		);
	}

	return (
		<Grid container spacing={2.5}>
			<Grid item xs={12} md={8}>
				{appsSection}
			</Grid>
			<Grid item xs={12} md={4}>
				{addonSection}
			</Grid>
		</Grid>
	);
};

export default AiAssistantsView;
