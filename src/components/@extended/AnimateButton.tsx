import React, { ReactNode } from "react";

// material-ui
import { Box } from "@mui/material";

// ==============================|| ANIMATION BUTTON ||============================== //
//
// En CSS desde el 2026-10-23 (antes framer-motion). Lo usan el encabezado público y las
// pantallas de autenticación: con framer-motion, la librería entera bajaba en /funciones
// y en el registro solo para agrandar un botón al pasar el mouse
// (la-ads/analysis/2026-10-23-primera-causa-medicion-y-siguiente-iteracion.md §10).
// Misma interfaz: scale (hover/tap), slide (corre `offset` px en `direction`) y rotate.

export type ScaleProps = {
	hover: number | string | undefined;
	tap: number | string | undefined;
};

export interface Props {
	children?: ReactNode;
	type?: "slide" | "scale" | "rotate";
	direction?: "up" | "down" | "left" | "right";
	offset?: number;
	scale?: ScaleProps;
}

const SIN_MOVIMIENTO = {
	"@media (prefers-reduced-motion: reduce)": { transition: "none", animation: "none", transform: "none !important" },
};

export default function AnimateButton({
	children,
	type = "scale",
	direction = "right",
	offset = 10,
	scale = { hover: 1.05, tap: 0.954 },
}: Props) {
	if (type === "rotate") {
		return (
			<Box
				sx={{
					"@keyframes la-girar": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
					animation: "la-girar 2s linear infinite",
					...SIN_MOVIMIENTO,
				}}
			>
				{children}
			</Box>
		);
	}

	if (type === "slide") {
		// Igual que el ciclo de framer: up/left arrancan corridos `offset` y vuelven a 0 al
		// pasar el mouse; right/down arrancan en 0 y se corren `offset`.
		const eje = direction === "up" || direction === "down" ? "Y" : "X";
		const [desde, hacia] = direction === "up" || direction === "left" ? [offset, 0] : [0, offset];
		return (
			<Box
				sx={{
					transform: `translate${eje}(${desde}px)`,
					transition: "transform .25s ease",
					"@media (hover: hover)": { "&:hover": { transform: `translate${eje}(${hacia}px)` } },
					...SIN_MOVIMIENTO,
				}}
			>
				{children}
			</Box>
		);
	}

	const s = typeof scale === "number" ? { hover: scale, tap: scale } : scale;
	return (
		<Box
			sx={{
				transition: "transform .15s ease",
				"@media (hover: hover)": { "&:hover": { transform: `scale(${s?.hover ?? 1})` } },
				"&:active": { transform: `scale(${s?.tap ?? 1})` },
				...SIN_MOVIMIENTO,
			}}
		>
			{children}
		</Box>
	);
}
