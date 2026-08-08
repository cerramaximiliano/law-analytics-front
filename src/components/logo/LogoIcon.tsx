import React, { useId } from "react";

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { COLUMN_OFFSETS, COLUMN_PATH, ICON_PATH, ICON_SIZE, ICON_VIEWBOX, LOGO_COLOR_DARK, LOGO_COLOR_LIGHT } from "./logoPaths";
import { ThemeMode } from "types/config";

// ==============================|| LOGO ICON ||============================== //

const LogoIcon = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const maskId = `la-icon-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
	return (
		<Stack>
			<svg width={45} height={44} viewBox={ICON_VIEWBOX} role="img" aria-label="Law Analytics">
				<mask id={maskId}>
					<rect width={ICON_SIZE.width} height={ICON_SIZE.height} fill="#fff" />
					{COLUMN_OFFSETS.map((x, i) => (
						<g key={x} transform={`translate(${x},77)`}>
							<path className={`la-col la-col-${i === 0 ? "a" : "b"}`} d={COLUMN_PATH} fill="#000" />
						</g>
					))}
				</mask>
				<rect
					width={ICON_SIZE.width}
					height={ICON_SIZE.height}
					rx={ICON_SIZE.radius}
					mask={`url(#${maskId})`}
					fill={isDark ? LOGO_COLOR_DARK : LOGO_COLOR_LIGHT}
				/>
				<g fill="none" stroke={theme.palette.primary.main} strokeWidth={18}>
					<path className="la-hover-trace" pathLength={1} d={ICON_PATH} />
				</g>
			</svg>
		</Stack>
	);
};

export default LogoIcon;
