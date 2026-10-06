/**
 * Banner que se muestra arriba del login form y del consent screen, identificando
 * al cliente OAuth (Claude.ai, ChatGPT, etc.) que está pidiendo acceso.
 *
 * Si el cliente NO está en la allowlist verificada (config/trustedOAuthClients.json
 * del hub), muestra warning anti-phishing.
 *
 * Reutilizado por:
 *  - pages/oauth/login.tsx
 *  - pages/oauth/consent.tsx
 */

import { Alert, Avatar, Box, Stack, Typography } from "@mui/material";
import { ShieldTick, Warning2 } from "iconsax-react";

import ClaudeAiLogo from "components/icons/ClaudeAiLogo";
import ChatGptLogo from "components/icons/ChatGptLogo";
import { deriveAiProvider } from "utils/mcpLegal";

export interface OauthClientBannerProps {
	clientId?: string | null;
	clientName?: string | null;
	logoUrl?: string | null;
	/**
	 * Estado de verificación del cliente OAuth contra la allowlist del hub.
	 * - `true` → muestra checkmark verde "verificado"
	 * - `false` → muestra warning amber "no verificado"
	 * - `undefined` → no muestra ni check ni warning (estado desconocido,
	 *   ej. en /oauth/login antes de que el user autentique)
	 */
	verified?: boolean;
	/** Acción específica del banner: "te está pidiendo conectarse", "quiere acceso a tu cuenta", etc. */
	action?: string;
	/** Pistas para el logo de marca (provider del hub, hosts de redirect). Claude/ChatGPT no envían logo_uri al registrarse. */
	providerHints?: Array<string | null | undefined>;
}

const OauthClientBanner = ({
	clientName,
	logoUrl,
	verified,
	action = "quiere conectarse a tu cuenta",
	providerHints = [],
}: OauthClientBannerProps) => {
	const displayName = clientName || "Una aplicación";
	const provider = deriveAiProvider(...providerHints, clientName);
	const brandLogo = !logoUrl && provider === "anthropic" ? <ClaudeAiLogo size={26} /> : !logoUrl && provider === "openai" ? <ChatGptLogo size={26} /> : null;

	return (
		<Stack spacing={1.5} sx={{ mb: 2 }}>
			<Stack direction="row" spacing={2} alignItems="center">
				{brandLogo ? (
					<Box
						sx={{
							width: 44,
							height: 44,
							borderRadius: "50%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: "background.paper",
							border: (theme) => `1px solid ${theme.palette.divider}`,
							flexShrink: 0,
						}}
					>
						{brandLogo}
					</Box>
				) : (
					<Avatar src={logoUrl || undefined} alt={displayName} sx={{ width: 44, height: 44, bgcolor: "primary.lighter" }}>
						{!logoUrl && (displayName.charAt(0) || "?")}
					</Avatar>
				)}
				<Box sx={{ flex: 1 }}>
					<Stack direction="row" spacing={0.5} alignItems="center">
						<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
							{displayName}
						</Typography>
						{verified === true && <ShieldTick size={16} color="#2e7d32" variant="Bold" />}
					</Stack>
					<Typography variant="body2" color="text.secondary">
						{action}
					</Typography>
				</Box>
			</Stack>

			{verified === false && (
				<Alert severity="warning" icon={<Warning2 size={20} />} sx={{ py: 0.5 }}>
					<Typography variant="caption">
						Esta aplicación <strong>no está verificada</strong> por lawanalytics. Asegurate de conocerla antes de autorizar.
					</Typography>
				</Alert>
			)}
		</Stack>
	);
};

export default OauthClientBanner;
