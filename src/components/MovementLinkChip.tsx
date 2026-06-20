// Chip indicador "vinculada a un movimiento" para notas/tareas/eventos que
// tienen movementRef (creados desde el viewer de un movimiento judicial).
// El movementRef es "{causaId}:{sourceId}" (PJN) — no tenemos el título del
// movimiento en estas listas, así que el chip indica el vínculo genéricamente.

import { Chip, Tooltip } from "@mui/material";
import { DocumentText } from "iconsax-react";

interface Props {
	movementRef?: string | null;
	movementSource?: "pjn" | "mev" | null;
}

const MovementLinkChip = ({ movementRef }: Props) => {
	if (!movementRef) return null;
	return (
		<Tooltip title="Vinculada a un movimiento del expediente">
			<Chip
				size="small"
				variant="outlined"
				color="info"
				icon={<DocumentText size={12} />}
				label="Movimiento"
				sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.65rem", fontWeight: 600 } }}
			/>
		</Tooltip>
	);
};

export default MovementLinkChip;
