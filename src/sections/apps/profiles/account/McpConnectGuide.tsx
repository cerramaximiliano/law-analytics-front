/**
 * Cómo conectar un asistente de IA (Claude.ai / ChatGPT) a la cuenta.
 *
 * Usa el estado de `useMcpAccess` (switch + grant beta + mantenimiento + plan),
 * así un usuario con acceso beta ve las instrucciones aunque la integración no
 * esté abierta al público.
 */

import { useState } from "react";

import { Alert, Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Copy, TickCircle } from "iconsax-react";

import ClaudeAiLogo from "components/icons/ClaudeAiLogo";
import ChatGptLogo from "components/icons/ChatGptLogo";
import type { McpAccess } from "hooks/useMcpAccess";
import { MCP_ADDON_PLANS_URL } from "utils/mcpAddonState";

interface Props {
	access: McpAccess | null;
	loading?: boolean;
	/** No mostrar el aviso de plan/add-on (la pantalla ya muestra la tarjeta del add-on con su CTA). */
	hidePlanNotice?: boolean;
}

const CopyableUrl = ({ url }: { url: string }) => {
	const [copied, setCopied] = useState(false);
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};
	return (
		<Stack
			direction="row"
			alignItems="center"
			spacing={1}
			sx={{ px: 1.25, py: 0.75, borderRadius: 1, border: (theme) => `1px solid ${theme.palette.divider}`, bgcolor: "background.default" }}
		>
			<Typography sx={{ fontFamily: "monospace", fontSize: "0.85rem", flex: 1, wordBreak: "break-all" }}>{url}</Typography>
			<Tooltip title={copied ? "Copiada" : "Copiar URL"}>
				<IconButton size="small" onClick={handleCopy} aria-label="Copiar URL del conector">
					{copied ? <TickCircle size={18} variant="Bold" color="#2e7d32" /> : <Copy size={18} />}
				</IconButton>
			</Tooltip>
		</Stack>
	);
};

const McpConnectGuide = ({ access, loading, hidePlanNotice = false }: Props) => {
	if (loading || !access) return null;

	const { claude, chatgpt } = access.providers;
	const anyAvailable = claude.available || chatgpt.available;

	if (!anyAvailable) {
		const message = claude.message || chatgpt.message || "La conexión con asistentes de IA no está disponible para tu cuenta por el momento.";
		return <Alert severity="info">{message}</Alert>;
	}

	if (!access.plan.allowed) {
		if (hidePlanNotice) return null;
		return (
			<Alert
				severity="warning"
				action={
					<Button color="inherit" size="small" href={access.plan.upgradeUrl} sx={{ textTransform: "none" }}>
						Ver planes
					</Button>
				}
			>
				Para conectar un asistente de IA necesitás un plan Estándar o Premium con el add-on de conectores.
			</Alert>
		);
	}

	return (
		<Box sx={{ p: 1.5, borderRadius: 1.25, border: (theme) => `1px solid ${theme.palette.divider}` }}>
			<Stack spacing={1.25}>
				<Stack direction="row" spacing={1} alignItems="center">
					{claude.available && <ClaudeAiLogo size={18} />}
					{chatgpt.available && <ChatGptLogo size={18} />}
					<Typography sx={{ fontWeight: 600 }}>
						Cómo conectar {claude.available && chatgpt.available ? "Claude.ai o ChatGPT" : claude.available ? "Claude.ai" : "ChatGPT"}
					</Typography>
					{!(claude.publicEnabled || chatgpt.publicEnabled) && (
						<Typography variant="caption" sx={{ px: 0.75, py: 0.125, borderRadius: 0.75, bgcolor: "warning.lighter", color: "warning.darker" }}>
							Acceso beta
						</Typography>
					)}
				</Stack>
				{claude.available && (
					<Typography variant="body2" color="text.secondary">
						En Claude.ai: Configuración → Conectores → <b>Agregar conector personalizado</b>, pegá esta URL y autorizá el acceso con tu
						cuenta de Law||Analytics.
					</Typography>
				)}
				{chatgpt.available && (
					<Typography variant="body2" color="text.secondary">
						En ChatGPT: Configuración → Apps y conectores → <b>Crear</b>, pegá esta URL y autorizá el acceso con tu cuenta de
						Law||Analytics.
					</Typography>
				)}
				<CopyableUrl url={access.mcpUrl} />
			</Stack>
		</Box>
	);
};

export default McpConnectGuide;
