// Chip indicador "vinculada a un movimiento" para notas/tareas/eventos que
// tienen movementRef (creados desde el viewer de un movimiento judicial).
// El movementRef es "{causaId}:{sourceId}" (PJN) — no tenemos el título del
// movimiento en estas listas, así que el chip indica el vínculo genéricamente.
//
// Si se le pasa folderId, el chip es clickeable y lleva al expediente con
// ?movement=<ref>, que abre la pestaña Actividad y resalta la fila del
// movimiento (deep-link de Fase 4). stopPropagation evita disparar el
// onClick de la fila contenedora (abrir nota/tarea).

import { useNavigate } from "react-router-dom";
import { Chip, Tooltip } from "@mui/material";
import { DocumentText } from "iconsax-react";

interface Props {
	movementRef?: string | null;
	movementSource?: "pjn" | "mev" | null;
	folderId?: string | null;
}

const MovementLinkChip = ({ movementRef, folderId }: Props) => {
	const navigate = useNavigate();
	if (!movementRef) return null;

	const clickable = Boolean(folderId);
	const handleClick = (e: React.MouseEvent) => {
		if (!clickable) return;
		e.stopPropagation();
		navigate(`/apps/folders/details/${folderId}?movement=${encodeURIComponent(movementRef)}`);
	};

	return (
		<Tooltip title={clickable ? "Ir al movimiento del expediente" : "Vinculada a un movimiento del expediente"}>
			<Chip
				size="small"
				variant="outlined"
				color="info"
				icon={<DocumentText size={12} />}
				label="Movimiento"
				clickable={clickable}
				onClick={clickable ? handleClick : undefined}
				sx={{
					height: 20,
					cursor: clickable ? "pointer" : "default",
					"& .MuiChip-label": { px: 0.75, fontSize: "0.65rem", fontWeight: 600 },
				}}
			/>
		</Tooltip>
	);
};

export default MovementLinkChip;
