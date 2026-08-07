import React, { useId } from "react";

import { Stack, Typography } from "@mui/material";
import { keyframes, styled, useTheme } from "@mui/material/styles";

import {
	COLUMN_OFFSETS,
	COLUMN_PATH,
	FULL_VIEWBOX,
	ICON_PATH,
	ICON_SCALE,
	ICON_SIZE,
	LOGO_COLOR_DARK,
	LOGO_COLOR_LIGHT,
	WORD_PATHS,
} from "./logoPaths";
import { ThemeMode } from "types/config";

// ==============================|| LOGO DRAW LOADER ||============================== //
// Lockup completo con el efecto trazo en loop: el contorno se dibuja, se rellena,
// se desvanece y vuelve a empezar. Para esperas bloqueantes con protagonismo
// (post-submit de login, transiciones largas). Para esperas chicas usar LogoLoader.

const CYCLE = "3.2s";

const drawLoop = keyframes`
	0% { stroke-dashoffset: 1; opacity: 1; }
	40% { stroke-dashoffset: 0; opacity: 1; }
	72% { stroke-dashoffset: 0; opacity: 1; }
	84% { stroke-dashoffset: 0; opacity: 0; }
	100% { stroke-dashoffset: 1; opacity: 0; }
`;
const fillLoop = keyframes`
	0%, 36% { opacity: 0; }
	50% { opacity: 1; }
	74% { opacity: 1; }
	86%, 100% { opacity: 0; }
`;

const LoopSvg = styled("svg")({
	display: "block",
	"& .la-draw path": {
		strokeDasharray: 1,
		animation: `${drawLoop} ${CYCLE} ease-in-out infinite`,
	},
	"& .la-sq, & .la-lt": {
		animation: `${fillLoop} ${CYCLE} ease-in-out infinite`,
	},
	"@media (prefers-reduced-motion: reduce)": {
		"& .la-draw": { display: "none" },
		"& .la-sq, & .la-lt": { animation: "none" },
	},
});

interface Props {
	/** Ancho en px del lockup. */
	width?: number;
	/** Texto opcional debajo del logo (ej: "Iniciando sesión..."). */
	caption?: string;
}

const LogoDrawLoader = ({ width = 220, caption }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const fill = isDark ? LOGO_COLOR_DARK : LOGO_COLOR_LIGHT;
	const maskId = `la-drawloader-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

	return (
		<Stack spacing={2} alignItems="center">
			<LoopSvg width={width} height={Math.round((width * 122) / 420)} viewBox={FULL_VIEWBOX} aria-label="Cargando">
				<g fill={fill}>
					<g transform={`scale(${ICON_SCALE})`}>
						<mask id={maskId}>
							<rect width={ICON_SIZE.width} height={ICON_SIZE.height} fill="#fff" />
							{COLUMN_OFFSETS.map((x) => (
								<g key={x} transform={`translate(${x},77)`}>
									<path d={COLUMN_PATH} fill="#000" />
								</g>
							))}
						</mask>
						<rect className="la-sq" width={ICON_SIZE.width} height={ICON_SIZE.height} rx={ICON_SIZE.radius} mask={`url(#${maskId})`} />
						<g className="la-draw" fill="none" stroke={fill} strokeWidth={8}>
							<path pathLength={1} d={ICON_PATH} />
						</g>
					</g>
					{WORD_PATHS.map((d, i) => (
						<path key={i} className="la-lt" fillRule="evenodd" style={{ animationDelay: `${(i * 0.045).toFixed(3)}s` }} d={d} />
					))}
				</g>
			</LoopSvg>
			{caption && (
				<Typography variant="body2" color="text.secondary">
					{caption}
				</Typography>
			)}
		</Stack>
	);
};

export default LogoDrawLoader;
