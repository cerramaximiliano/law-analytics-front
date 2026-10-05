/**
 * Diálogo de confirmación de compra del add-on `mcp_access` (Etapa P — P4).
 *
 * Solo se abre cuando el hub informa una política de privacidad activa
 * (`GET /api/legal/versions` → `privacy` != null). Muestra el precio, un
 * resumen de qué hace el conector, el link a la sección "Conectores de IA" de
 * la política y un checkbox obligatorio. Al confirmar, el caller envía
 * `acceptedPolicyVersion` al checkout.
 */

import { useEffect, useState } from "react";

import {
	Alert,
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Link,
	Stack,
	Typography,
} from "@mui/material";

import { MCP_SHARED_DATA_TEXT, PRIVACY_CONNECTORS_URL } from "utils/mcpLegal";

export interface McpAddonLegalDialogProps {
	open: boolean;
	/** Versión vigente de la política que se está aceptando. */
	policyVersion: string;
	/** "US$ 10/mes" — null si el precio no está disponible. */
	priceLabel: string | null;
	privacyUrl?: string;
	busy?: boolean;
	/** Error a mostrar dentro del diálogo (p. ej. la política cambió). */
	error?: string | null;
	onCancel: () => void;
	onConfirm: (acceptedPolicyVersion: string) => void;
}

const McpAddonLegalDialog = ({
	open,
	policyVersion,
	priceLabel,
	privacyUrl = PRIVACY_CONNECTORS_URL,
	busy = false,
	error = null,
	onCancel,
	onConfirm,
}: McpAddonLegalDialogProps) => {
	const [accepted, setAccepted] = useState(false);

	// Cada apertura (o cambio de versión) arranca sin aceptar.
	useEffect(() => {
		if (open) setAccepted(false);
	}, [open, policyVersion]);

	return (
		<Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="sm" fullWidth aria-labelledby="mcp-addon-legal-title">
			<DialogTitle id="mcp-addon-legal-title" sx={{ fontWeight: 600 }}>
				Agregar el conector de IA (MCP)
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					{priceLabel && (
						<Box>
							<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
								Precio del add-on
							</Typography>
							<Typography variant="h5" sx={{ fontWeight: 700 }}>
								{priceLabel}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								Se suma a tu suscripción actual: hoy se cobra la parte proporcional al período en curso. Podés quitarlo cuando quieras.
							</Typography>
						</Box>
					)}

					<Typography variant="body2">
						El conector permite que asistentes de IA como Claude.ai o ChatGPT consulten, en modo de solo lectura y solo después de que vos
						lo autorices desde cada asistente, la información de tu cuenta: {MCP_SHARED_DATA_TEXT}.
					</Typography>
					<Typography variant="body2">
						Lo que el asistente consulte se envía a su proveedor (Anthropic u OpenAI), que lo procesa según sus propias políticas. Podés
						revocar el acceso en cualquier momento desde Perfil → Integraciones → Asistentes de IA.
					</Typography>

					<FormControlLabel
						sx={{ alignItems: "flex-start" }}
						control={
							<Checkbox
								checked={accepted}
								onChange={(e) => setAccepted(e.target.checked)}
								disabled={busy}
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
								y entiendo que la información que el asistente consulte será procesada por su proveedor según sus propias políticas.
							</Typography>
						}
					/>

					{error && <Alert severity="warning">{error}</Alert>}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onCancel} disabled={busy} color="secondary" sx={{ textTransform: "none" }}>
					Cancelar
				</Button>
				<Button variant="contained" onClick={() => onConfirm(policyVersion)} disabled={!accepted || busy} sx={{ textTransform: "none" }}>
					{busy ? "Procesando…" : priceLabel ? `Agregar por ${priceLabel}` : "Agregar conector"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default McpAddonLegalDialog;
