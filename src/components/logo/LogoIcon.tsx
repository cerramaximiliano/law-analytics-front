import React, { useId } from "react";

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { COLUMN_OFFSETS, COLUMN_PATH, ICON_SIZE, ICON_VIEWBOX, LOGO_COLOR_DARK, LOGO_COLOR_LIGHT } from "./logoPaths";
import { ThemeMode } from "types/config";

// ==============================|| LOGO ICON ||============================== //

const LogoIcon = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const shineColor = isDark ? LOGO_COLOR_LIGHT : "#FFFFFF";
	const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
	const maskId = `la-icon-mask-${uid}`;
	const shineId = `la-icon-shine-${uid}`;
	return (
		<Stack>
			<svg width={45} height={44} viewBox={ICON_VIEWBOX} role="img" aria-label="Law Analytics">
				<linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor={shineColor} stopOpacity="0" />
					<stop offset="0.5" stopColor={shineColor} stopOpacity={isDark ? 0.3 : 0.5} />
					<stop offset="1" stopColor={shineColor} stopOpacity="0" />
				</linearGradient>
				<mask id={maskId}>
					<rect width={ICON_SIZE.width} height={ICON_SIZE.height} fill="#fff" />
					{COLUMN_OFFSETS.map((x, i) => (
						<g key={x} transform={`translate(${x},77)`}>
							<path className={`la-col la-col-${i === 0 ? "a" : "b"}`} d={COLUMN_PATH} fill="#000" />
						</g>
					))}
				</mask>
				<g mask={`url(#${maskId})`}>
					<rect
						width={ICON_SIZE.width}
						height={ICON_SIZE.height}
						rx={ICON_SIZE.radius}
						fill={isDark ? LOGO_COLOR_DARK : LOGO_COLOR_LIGHT}
					/>
					<g transform="skewX(-18)">
						<rect className="la-shine" x={-180} y={-60} width={150} height={600} fill={`url(#${shineId})`} />
					</g>
				</g>
			</svg>
		</Stack>
	);
};

export default LogoIcon;
