import React from "react";

import { keyframes, styled, useTheme } from "@mui/material/styles";

import { ICON_PATH, ICON_VIEWBOX, LOGO_COLOR_DARK, LOGO_COLOR_LIGHT } from "./logoPaths";
import { ThemeMode } from "types/config";

// ==============================|| LOGO LOADER ||============================== //
// Isotipo con latido suave para estados de carga largos (sync de causas,
// generación de documentos). Reemplaza al spinner genérico con identidad propia.

const pulse = keyframes`
	0%, 100% { transform: scale(1); opacity: 1; }
	50% { transform: scale(0.94); opacity: 0.7; }
`;

const PulsingSvg = styled("svg")({
	display: "block",
	transformOrigin: "center",
	animation: `${pulse} 1.9s ease-in-out infinite`,
	"@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

interface Props {
	/** Ancho en px; el alto se calcula con la proporción del isotipo. */
	size?: number;
	/** Color de relleno; por defecto el color de marca según el tema. */
	color?: string;
}

const LogoLoader = ({ size = 32, color }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	return (
		<PulsingSvg width={size} height={Math.round((size * 474) / 486)} viewBox={ICON_VIEWBOX} aria-label="Cargando">
			<path d={ICON_PATH} fill={color ?? (isDark ? LOGO_COLOR_DARK : LOGO_COLOR_LIGHT)} fillRule="evenodd" />
		</PulsingSvg>
	);
};

export default LogoLoader;
