import React, { useEffect, useId, useState } from "react";

import { Stack } from "@mui/material";
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

// ==============================|| LOGO ||============================== //

export type LogoAnimation = "build" | "letters" | "draw";

const sqIn = keyframes`
	from { opacity: 0; transform: scale(0.92); }
	to { opacity: 1; transform: scale(1); }
`;
const colRise = keyframes`
	from { transform: scaleY(0); }
	to { transform: scaleY(1); }
`;
const letterIn = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: translateY(0); }
`;
const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;
const drawStroke = keyframes`
	from { stroke-dashoffset: 1; }
	to { stroke-dashoffset: 0; }
`;
const fadeOut = keyframes`
	from { opacity: 1; }
	to { opacity: 0; }
`;

// animationFillMode "backwards": oculta durante el delay y suelta el estilo al terminar,
// para que la animación no pise el transform del hover (fill "forwards" lo bloquearía).
const AnimatedSvg = styled("svg", { shouldForwardProp: (prop) => prop !== "play" })<{ play?: LogoAnimation }>(({ play }) => ({
	"& .la-sq, & .la-col, & .la-lt": { transformBox: "fill-box" },
	...(play === "build" && {
		"& .la-sq": {
			transformOrigin: "center",
			animation: `${sqIn} 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.15) backwards`,
		},
		"& .la-col": {
			transformOrigin: "50% 100%",
			animation: `${colRise} 0.65s cubic-bezier(0.22, 1, 0.36, 1) backwards`,
		},
		"& .la-col-a": { animationDelay: "0.05s" },
		"& .la-col-b": { animationDelay: "0.18s" },
		"& .la-lt": { animation: `${letterIn} 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards` },
	}),
	...(play === "letters" && {
		"& .la-lt": { animation: `${letterIn} 0.45s cubic-bezier(0.22, 1, 0.36, 1) backwards` },
	}),
	...(play === "draw" && {
		// El contorno se dibuja (cuadrado y columnas en secuencia, un solo path),
		// luego se desvanece mientras aparece el relleno y caen las letras.
		"& .la-draw path": {
			strokeDasharray: 1,
			animation: `${drawStroke} 1.05s ease-in-out backwards`,
		},
		"& .la-draw": { animation: `${fadeOut} 0.4s ease-out 1s forwards` },
		"& .la-sq": { animation: `${fadeIn} 0.45s ease-out 0.95s backwards` },
		"& .la-lt": { animation: `${letterIn} 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards` },
	}),
	"@media (prefers-reduced-motion: reduce)": {
		"& .la-sq, & .la-col, & .la-lt, & .la-draw, & .la-draw path": { animation: "none" },
		"& .la-draw": { display: "none" },
	},
}));

interface Props {
	reverse?: boolean;
	/** Animación de entrada. Se reproduce una sola vez por sesión (sessionStorage). */
	animation?: LogoAnimation;
}

const letterDelay = (animation: LogoAnimation, index: number) => {
	if (animation === "build") return 0.35 + index * 0.055;
	if (animation === "draw") return 1.05 + index * 0.05;
	return 0.05 + index * 0.05;
};

const LogoMain = ({ reverse, animation, ...others }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const fill = isDark ? LOGO_COLOR_DARK : LOGO_COLOR_LIGHT;
	const maskId = `la-logo-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

	const [play] = useState<LogoAnimation | undefined>(() => {
		if (!animation || typeof window === "undefined") return undefined;
		return window.sessionStorage.getItem(`la-logo-anim-${animation}`) ? undefined : animation;
	});
	useEffect(() => {
		if (play) window.sessionStorage.setItem(`la-logo-anim-${play}`, "1");
	}, [play]);

	return (
		<Stack>
			<AnimatedSvg play={play} width={172} height={50} viewBox={FULL_VIEWBOX} role="img" aria-label="Law Analytics">
				<g fill={fill}>
					<g transform={`scale(${ICON_SCALE})`}>
						<mask id={maskId}>
							<rect width={ICON_SIZE.width} height={ICON_SIZE.height} fill="#fff" />
							{COLUMN_OFFSETS.map((x, i) => (
								<g key={x} transform={`translate(${x},77)`}>
									<path className={`la-col la-col-${i === 0 ? "a" : "b"}`} d={COLUMN_PATH} fill="#000" />
								</g>
							))}
						</mask>
						<rect className="la-sq" width={ICON_SIZE.width} height={ICON_SIZE.height} rx={ICON_SIZE.radius} mask={`url(#${maskId})`} />
						{play === "draw" && (
							<g className="la-draw" fill="none" stroke={fill} strokeWidth={8}>
								<path pathLength={1} d={ICON_PATH} />
							</g>
						)}
					</g>
					{WORD_PATHS.map((d, i) => (
						<path
							key={i}
							className="la-lt"
							fillRule="evenodd"
							style={play ? { animationDelay: `${letterDelay(play, i).toFixed(3)}s` } : undefined}
							d={d}
						/>
					))}
				</g>
			</AnimatedSvg>
		</Stack>
	);
};

export default LogoMain;
