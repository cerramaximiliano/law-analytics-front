/**
 * AiClientsLogos — renderiza los logos de los clientes AI activos del MCP
 * (Claude.ai, ChatGPT) según los flags de IntegrationsConfig.
 *
 * Centraliza la lógica de cuáles logos mostrar para que banners, hero de
 * páginas y cards admin no dupliquen la condicional. El componente decide:
 *   - Solo Claude enabled       → 1 logo Claude
 *   - Solo ChatGPT enabled      → 1 logo ChatGPT
 *   - Ambos enabled             → 2 logos (Claude + ChatGPT) lado a lado
 *   - Ninguno enabled           → render vacío (caller debe esconder el banner)
 *
 * Cuando `framed=true` (default), cada logo se envuelve en un círculo con
 * borde + fondo paper — visualmente los logos quedan claramente separados
 * como dos entidades distintas en vez de pegados sobre el mismo fondo.
 * Pasá `framed={false}` para el logo desnudo (sin contenedor).
 *
 * Los logos mantienen sus colores oficiales: Claude siempre #D97757 (Crail
 * forced), ChatGPT en currentColor (negro/blanco según theme).
 */

import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ClaudeAiLogo from "./ClaudeAiLogo";
import ChatGptLogo from "./ChatGptLogo";
import type { PublicIntegrations } from "store/reducers/ApiService";

interface AiClientsLogosProps {
	integrations: PublicIntegrations;
	/** Tamaño aplicado a cada logo individual. */
	size?: number;
	/** Espacio entre logos cuando hay más de uno (default 2 → 16px). */
	spacing?: number;
	/**
	 * Si true (default), cada logo se envuelve en un círculo con borde y fondo
	 * — los logos quedan visualmente separados como entidades distintas.
	 * Si false, render desnudo (logos directos en el Stack).
	 */
	framed?: boolean;
}

const AiClientsLogos = ({ integrations, size = 32, spacing = 2, framed = false }: AiClientsLogosProps) => {
	const theme = useTheme();
	const showClaude = integrations.claudeAi.enabled;
	const showChatGpt = integrations.chatGpt.enabled;

	if (!showClaude && !showChatGpt) return null;

	// Padding proporcional al size del logo — el círculo queda ~28% más grande
	// que el logo en sí, dejando aire suficiente para que respire.
	const padding = Math.round(size * 0.28);
	const frameDiameter = size + padding * 2;

	const renderLogo = (logo: JSX.Element, key: string) => {
		if (!framed) return logo;
		return (
			<Box
				key={key}
				sx={{
					width: frameDiameter,
					height: frameDiameter,
					borderRadius: "50%",
					border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
					bgcolor: theme.palette.background.paper,
					boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.06)}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				{logo}
			</Box>
		);
	};

	return (
		<Stack direction="row" spacing={spacing} alignItems="center">
			{showClaude && renderLogo(<ClaudeAiLogo size={size} />, "claude")}
			{showChatGpt && renderLogo(<ChatGptLogo size={size} />, "chatgpt")}
		</Stack>
	);
};

export default AiClientsLogos;
