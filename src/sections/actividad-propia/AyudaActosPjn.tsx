import { Box, Tooltip, Typography } from "@mui/material";
import { InfoCircle } from "iconsax-react";

/** Nombre visible de la función. Solo PJN: las demás jurisdicciones no tienen bandeja de escritos que leer. */
export const NOMBRE_ACTOS_PJN = "Presentaciones del letrado en PJN";

const AYUDA = (
	<Box sx={{ p: 0.5, maxWidth: 300 }}>
		<Typography sx={{ fontSize: "0.75rem", fontWeight: 600, mb: 0.5 }}>{NOMBRE_ACTOS_PJN}</Typography>
		<Typography sx={{ fontSize: "0.72rem", lineHeight: 1.45 }}>
			Escritos, cédulas y oficios DEOX presentados con la credencial PJN vinculada, leídos de la bandeja del portal del Poder Judicial de la
			Nación.
		</Typography>
	</Box>
);

/** Ícono de ayuda con la explicación de qué son los actos del letrado en PJN y para qué sirven. */
const AyudaActosPjn = ({ size = 14, texto }: { size?: number; texto?: React.ReactNode }) => (
	<Tooltip title={texto ?? AYUDA} arrow placement="top" enterTouchDelay={0}>
		<Box
			component="span"
			tabIndex={0}
			aria-label={`Qué son las ${NOMBRE_ACTOS_PJN.toLowerCase()}`}
			sx={{ display: "inline-flex", alignItems: "center", color: "text.secondary", verticalAlign: "middle" }}
			onClick={(e) => e.stopPropagation()}
		>
			<InfoCircle size={size} />
		</Box>
	</Tooltip>
);

export default AyudaActosPjn;
