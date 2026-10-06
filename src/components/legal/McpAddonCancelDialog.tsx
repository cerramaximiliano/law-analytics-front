/**
 * Confirmación de la baja del add-on "Conectores de IA". Explica que se desconectan
 * los asistentes (el hub revoca consents y tokens activos al quitarlo).
 */

import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { Warning2 } from "iconsax-react";

import { MCP_ADDON_NAME } from "utils/mcpAddonState";

interface Props {
	open: boolean;
	busy?: boolean;
	error?: string | null;
	/** "immediate": se quita ya (prorrateo). "period_end": sigue hasta `periodEndLabel`. */
	cancelBehavior: "immediate" | "period_end";
	/** "6 de noviembre" — solo con period_end. */
	periodEndLabel?: string | null;
	/** Acceso por grant beta: aunque quite el add-on, sigue conectado. */
	keepsBetaAccess?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

const McpAddonCancelDialog = ({
	open,
	busy = false,
	error = null,
	cancelBehavior,
	periodEndLabel,
	keepsBetaAccess = false,
	onCancel,
	onConfirm,
}: Props) => {
	const atPeriodEnd = cancelBehavior === "period_end" && !!periodEndLabel;
	return (
		<Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="xs" fullWidth aria-labelledby="mcp-addon-cancel-title">
			<DialogTitle id="mcp-addon-cancel-title" sx={{ fontWeight: 600 }}>
				¿Quitar {MCP_ADDON_NAME}?
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={1.5}>
					<Stack direction="row" spacing={1.25} alignItems="flex-start">
						<Box sx={{ color: "warning.main", flexShrink: 0, mt: 0.25 }}>
							<Warning2 size={20} variant="Bulk" />
						</Box>
						<Typography variant="body2">
							{keepsBetaAccess
								? "Tu cuenta tiene acceso beta, así que tus asistentes van a seguir conectados aunque quites el add-on."
								: atPeriodEnd
								? `Claude.ai, ChatGPT y cualquier otro asistente que hayas autorizado se van a desconectar el ${periodEndLabel}, cuando termine el período que ya pagaste.`
								: "Claude.ai, ChatGPT y cualquier otro asistente que hayas autorizado se desconectan en el momento y dejan de poder consultar tu cuenta."}
						</Typography>
					</Stack>
					<Typography variant="body2" color="text.secondary">
						{atPeriodEnd
							? "Hasta esa fecha no se te cobra nada más por el add-on."
							: "Stripe descuenta de tu próxima factura la parte del mes que no usaste."}{" "}
						Si lo volvés a activar, vas a tener que autorizar cada asistente de nuevo.
					</Typography>
					{error && <Alert severity="error">{error}</Alert>}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onCancel} disabled={busy} color="secondary" sx={{ textTransform: "none" }}>
					Mantener
				</Button>
				<Button
					onClick={onConfirm}
					disabled={busy}
					color="error"
					variant="contained"
					startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
					sx={{ textTransform: "none" }}
				>
					{busy ? "Quitando…" : "Quitar add-on"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default McpAddonCancelDialog;
