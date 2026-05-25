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
 * Los logos mantienen sus colores oficiales: Claude siempre #D97757 (Crail
 * forced), ChatGPT en currentColor (negro/blanco según theme).
 */

import { Stack } from "@mui/material";
import ClaudeAiLogo from "./ClaudeAiLogo";
import ChatGptLogo from "./ChatGptLogo";
import type { PublicIntegrations } from "store/reducers/ApiService";

interface AiClientsLogosProps {
	integrations: PublicIntegrations;
	/** Tamaño aplicado a cada logo individual. */
	size?: number;
	/** Espacio entre logos cuando hay más de uno (default 1.5 → 12px). */
	spacing?: number;
}

const AiClientsLogos = ({ integrations, size = 32, spacing = 1.5 }: AiClientsLogosProps) => {
	const showClaude = integrations.claudeAi.enabled;
	const showChatGpt = integrations.chatGpt.enabled;

	if (!showClaude && !showChatGpt) return null;

	// Cada logo conoce su color: Claude está hardcoded al naranja oficial,
	// ChatGPT elige variante black/white según theme automáticamente.
	return (
		<Stack direction="row" spacing={spacing} alignItems="center">
			{showClaude && <ClaudeAiLogo size={size} />}
			{showChatGpt && <ChatGptLogo size={size} />}
		</Stack>
	);
};

export default AiClientsLogos;
