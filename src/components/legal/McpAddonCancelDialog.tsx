/**
 * Confirmación de la baja del add-on "Conectores de IA". Misma política que la
 * suscripción (hub `removeAddon`): se programa para el fin del período pago, sin
 * reintegro; los asistentes siguen conectados hasta esa fecha (ahí el hub revoca
 * consents y tokens) y se puede reactivar antes sin cargo.
 */

import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { Warning2 } from "iconsax-react";

import { formatAddonDate, MCP_ADDON_NAME } from "utils/mcpAddonState";

interface Props {
	open: boolean;
	busy?: boolean;
	error?: string | null;
	/** Acceso por grant beta: aunque quite el add-on, sigue conectado. */
	keepsBetaAccess?: boolean;
	/** Fin del período pago (ISO): hasta ahí sigue el acceso. Es el próximo cobro del add-on. */
	accessUntil?: string | null;
	onCancel: () => void;
	onConfirm: () => void;
}

const McpAddonCancelDialog = ({
	open,
	busy = false,
	error = null,
	keepsBetaAccess = false,
	accessUntil = null,
	onCancel,
	onConfirm,
}: Props) => {
	const until = formatAddonDate(accessUntil);
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
							{until
								? `Seguís teniendo acceso hasta el ${until}; no se cobra el próximo período.`
								: "Seguís teniendo acceso hasta el final del período que ya pagaste; no se cobra el próximo período."}
						</Typography>
					</Stack>
					<Typography variant="body2" color="text.secondary">
						{keepsBetaAccess
							? "Tu cuenta tiene acceso beta, así que tus asistentes van a seguir conectados también después de esa fecha."
							: "Ese día Claude.ai, ChatGPT y cualquier otro asistente que hayas autorizado se desconectan. No hay reintegro por el período en curso."}{" "}
						Hasta entonces podés reactivarlo sin costo.
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
					{busy ? "Procesando…" : "Dar de baja"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default McpAddonCancelDialog;
