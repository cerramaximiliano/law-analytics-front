import { useEffect, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { getSituacionesByFolder, SituacionCambio } from "services/pjnMovementsService";
import { situacionLabel } from "utils/controlCarpetas";

// Situación del expediente con su fecha y los cambios anteriores (13/11/2026). El portal cambia la situación (EN LETRA →
// EN DESPACHO) sin publicar una actuación; pjn-mis-causas registra cada cambio. Solo carpetas PJN; sin cambios
// registrados no muestra nada.
const fecha = (iso: string | null) =>
	iso
		? new Date(iso).toLocaleDateString("es-AR", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				timeZone: "America/Argentina/Buenos_Aires",
		  })
		: "";

const SituacionHistorial = ({ folderId }: { folderId: string }) => {
	const [cambios, setCambios] = useState<SituacionCambio[]>([]);
	useEffect(() => {
		let vivo = true;
		getSituacionesByFolder(folderId)
			.then((r) => vivo && setCambios(r?.data || []))
			.catch(() => vivo && setCambios([]));
		return () => {
			vivo = false;
		};
	}, [folderId]);
	if (!cambios.length) return null;
	const [actual, ...anteriores] = cambios;
	return (
		<Stack spacing={0.25}>
			<Typography
				sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
			>
				Situación
			</Typography>
			<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary" }}>
				{situacionLabel(actual.situacion)} · desde {fecha(actual.desde)}
			</Typography>
			{anteriores.slice(0, 5).map((c, i) => (
				<Typography key={i} variant="caption" color="text.secondary">
					{fecha(c.desde)} · {situacionLabel(c.situacion)}
					{c.anterior ? ` (antes: ${situacionLabel(c.anterior)})` : ""}
				</Typography>
			))}
		</Stack>
	);
};

export default SituacionHistorial;
