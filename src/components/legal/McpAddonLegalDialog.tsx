/**
 * Diálogo de confirmación del alta del add-on "Conectores de IA" (`mcp_access`) — Etapa P4.
 *
 * Se abre SIEMPRE antes de cobrar: muestra precio, qué permite, cómo se cobra y a
 * quién se envía la información. El checkbox de la Política de Privacidad aparece
 * solo cuando el hub informa una política activa (`GET /api/legal/versions` →
 * `privacy` != null, C-LEGAL-API); en ese caso es obligatorio y su versión viaja
 * como `acceptedPolicyVersion` al checkout.
 */

import { useEffect, useState } from "react";

import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Link,
	Stack,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { TickCircle } from "iconsax-react";

import ClaudeAiLogo from "components/icons/ClaudeAiLogo";
import ChatGptLogo from "components/icons/ChatGptLogo";
import { MCP_SHARED_DATA_TEXT, PRIVACY_CONNECTORS_URL } from "utils/mcpLegal";
import { MCP_ADDON_BENEFITS, MCP_ADDON_NAME, planLabel } from "utils/mcpAddonState";

const BRAND_BLUE = "#3A7BFF";

export interface McpAddonDialogError {
	message: string;
	severity?: "error" | "warning" | "info";
	/** Acción opcional dentro del aviso (p. ej. "Actualizar el pago", "Ya pagué, actualizar"). */
	action?: { label: string; onClick: () => void };
}

export interface McpAddonLegalDialogProps {
	open: boolean;
	/** Versión vigente de la política a aceptar. null = no hay política activa → sin checkbox. */
	policyVersion: string | null;
	/** "US$ 10/mes" — null si el precio no está disponible. */
	priceLabel: string | null;
	/** Plan actual, para el texto "Se suma a tu plan Estándar". */
	currentPlan?: string | null;
	privacyUrl?: string;
	busy?: boolean;
	/** Error a mostrar dentro del diálogo (política actualizada, tarjeta rechazada, SCA…). */
	error?: McpAddonDialogError | string | null;
	onCancel: () => void;
	onConfirm: (acceptedPolicyVersion: string | null) => void;
}

const McpAddonLegalDialog = ({
	open,
	policyVersion,
	priceLabel,
	currentPlan = null,
	privacyUrl = PRIVACY_CONNECTORS_URL,
	busy = false,
	error = null,
	onCancel,
	onConfirm,
}: McpAddonLegalDialogProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
	const [accepted, setAccepted] = useState(false);
	const needsPolicy = !!policyVersion;
	const err: McpAddonDialogError | null = typeof error === "string" ? { message: error, severity: "warning" } : error;

	// Cada apertura (o cambio de versión) arranca sin aceptar.
	useEffect(() => {
		if (open) setAccepted(false);
	}, [open, policyVersion]);

	return (
		<Dialog
			open={open}
			onClose={busy ? undefined : onCancel}
			maxWidth="sm"
			fullWidth
			fullScreen={fullScreen}
			aria-labelledby="mcp-addon-legal-title"
		>
			<DialogTitle id="mcp-addon-legal-title" sx={{ pb: 1.5 }}>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Stack direction="row" spacing={-0.75} sx={{ flexShrink: 0 }}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: "50%",
								display: "grid",
								placeItems: "center",
								bgcolor: "background.paper",
								border: `1px solid ${theme.palette.divider}`,
								zIndex: 1,
							}}
						>
							<ClaudeAiLogo size={20} />
						</Box>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: "50%",
								display: "grid",
								placeItems: "center",
								bgcolor: "background.paper",
								border: `1px solid ${theme.palette.divider}`,
							}}
						>
							<ChatGptLogo size={20} />
						</Box>
					</Stack>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="h5" component="span" sx={{ fontWeight: 600, display: "block" }}>
							Activar {MCP_ADDON_NAME}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Claude.ai y ChatGPT con tus datos de Law||Analytics
						</Typography>
					</Box>
				</Stack>
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2.25}>
					{priceLabel && (
						<Box
							sx={{
								p: 1.75,
								borderRadius: 1.5,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							}}
						>
							<Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexWrap: "wrap" }}>
								<Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
									{priceLabel}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{currentPlan ? `se suma a tu plan ${planLabel(currentPlan)}` : "se suma a tu plan"}
								</Typography>
							</Stack>
							<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
								Hoy se cobra la parte proporcional al período en curso con tu medio de pago guardado; después, junto con tu plan. Podés
								quitarlo cuando quieras.
							</Typography>
						</Box>
					)}

					<Stack spacing={0.75} component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
						{MCP_ADDON_BENEFITS.map((b) => (
							<Stack key={b} component="li" direction="row" spacing={1} alignItems="flex-start">
								<TickCircle size={18} variant="Bulk" color={BRAND_BLUE} style={{ flexShrink: 0, marginTop: 1 }} />
								<Typography variant="body2">{b}</Typography>
							</Stack>
						))}
					</Stack>

					<Typography variant="body2" color="text.secondary">
						Cada asistente accede solo después de que lo autorices desde él, y únicamente a tu cuenta y tus equipos: {MCP_SHARED_DATA_TEXT}.
						Lo que el asistente consulte lo procesa su proveedor (Anthropic u OpenAI) según sus propias políticas, incluso fuera de la
						Argentina. Podés desconectarlo en cualquier momento desde Perfil → Integraciones → Asistentes de IA.
					</Typography>

					<Typography variant="caption" color="text.secondary">
						Para usarlo necesitás además un plan de Claude.ai o ChatGPT que permita conectores personalizados.
					</Typography>

					{needsPolicy && (
						<FormControlLabel
							sx={{ alignItems: "flex-start", mx: 0 }}
							control={
								<Checkbox
									checked={accepted}
									onChange={(e) => setAccepted(e.target.checked)}
									disabled={busy}
									sx={{ pt: 0.25, pl: 0 }}
									inputProps={{ "aria-required": true }}
								/>
							}
							label={
								<Typography variant="body2">
									Leí y acepto la{" "}
									<Link href={privacyUrl} target="_blank" rel="noopener noreferrer">
										Política de Privacidad (sección Conectores de IA)
									</Link>{" "}
									y entiendo que la información que el asistente consulte será procesada por su proveedor según sus propias políticas,
									incluso fuera de la Argentina.
								</Typography>
							}
						/>
					)}

					{err && (
						<Alert
							severity={err.severity || "error"}
							action={
								err.action ? (
									<Button color="inherit" size="small" onClick={err.action.onClick} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
										{err.action.label}
									</Button>
								) : undefined
							}
						>
							{err.message}
						</Alert>
					)}
				</Stack>
			</DialogContent>
			<DialogActions
				sx={{
					px: 3,
					py: 2,
					gap: 1,
					flexDirection: { xs: "column-reverse", sm: "row" },
					"& > :not(style) ~ :not(style)": { ml: { xs: 0, sm: 1 } },
				}}
			>
				<Button onClick={onCancel} disabled={busy} color="secondary" sx={{ textTransform: "none", width: { xs: "100%", sm: "auto" } }}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={() => onConfirm(policyVersion)}
					disabled={(needsPolicy && !accepted) || busy}
					startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
					sx={{ textTransform: "none", width: { xs: "100%", sm: "auto" } }}
				>
					{busy ? "Procesando…" : priceLabel ? `Activar por ${priceLabel}` : `Activar ${MCP_ADDON_NAME}`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default McpAddonLegalDialog;
