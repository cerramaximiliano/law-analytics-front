import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { enqueueSnackbar } from "notistack";
import { enviarFeedbackPlazo } from "api/plazosAutomaticos";
import { STALE_AMBER } from "themes/dashboardTokens";

// Aviso + feedback sobre una sugerencia automática de vencimiento (plazos automáticos, beta).
// Se usa en el evento del calendario (eventId) y en el aviso de la carpeta (notificationId).
interface Props {
	eventId?: string;
	notificationId?: string;
	onIncorrecto?: () => void;
}

const SugerenciaPlazoFeedback = ({ eventId, notificationId, onIncorrecto }: Props) => {
	const [estado, setEstado] = useState<"inicial" | "explicar" | "enviado">("inicial");
	const [comentario, setComentario] = useState("");
	const [enviando, setEnviando] = useState(false);

	const enviar = async (correcto: boolean) => {
		setEnviando(true);
		try {
			const r = await enviarFeedbackPlazo({ eventId, notificationId, correcto, comentario: comentario || undefined });
			setEstado("enviado");
			enqueueSnackbar(correcto ? "Gracias, nos ayuda a mejorar los cálculos" : "Gracias. Lo sacamos de tu calendario.", {
				variant: "success",
			});
			if (!correcto && r.eventoArchivado && onIncorrecto) onIncorrecto();
		} catch {
			enqueueSnackbar("No se pudo enviar", { variant: "error" });
		} finally {
			setEnviando(false);
		}
	};

	return (
		<Box sx={{ p: 1.5, borderRadius: 1.25, bgcolor: alpha(STALE_AMBER, 0.08), border: `1px solid ${alpha(STALE_AMBER, 0.3)}` }}>
			<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary" }}>Sugerencia automática</Typography>
			<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1 }}>
				Calculamos este vencimiento a partir de la cédula. Verificalo antes de confiar en él. ¿Es correcto?
			</Typography>
			{estado === "enviado" ? (
				<Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Gracias por tu respuesta.</Typography>
			) : estado === "explicar" ? (
				<Stack spacing={1}>
					<TextField
						size="small"
						multiline
						minRows={2}
						placeholder="¿Qué está mal? (plazo, fecha, no era para mí…)"
						value={comentario}
						onChange={(e) => setComentario(e.target.value)}
					/>
					<Stack direction="row" spacing={1}>
						<Button size="small" variant="contained" color="error" disabled={enviando} onClick={() => enviar(false)}>
							Enviar y quitar del calendario
						</Button>
						<Button size="small" disabled={enviando} onClick={() => setEstado("inicial")}>
							Volver
						</Button>
					</Stack>
				</Stack>
			) : (
				<Stack direction="row" spacing={1}>
					<Button size="small" variant="outlined" color="success" disabled={enviando} onClick={() => enviar(true)}>
						Sí, es correcto
					</Button>
					<Button size="small" variant="outlined" color="error" disabled={enviando} onClick={() => setEstado("explicar")}>
						No es correcto
					</Button>
				</Stack>
			)}
		</Box>
	);
};

export default SugerenciaPlazoFeedback;
