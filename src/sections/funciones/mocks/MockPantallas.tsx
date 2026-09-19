// Maquetas de la interfaz para /funciones.
//
// Por qué dibujadas y no capturadas: las capturas mostraban causas reales con
// nombre y apellido de las partes. Además, dibujarlas permite que acompañen el
// tema claro y oscuro, animarlas y cambiar el texto sin volver a fotografiar la
// app. Todo el contenido sale de `datosFicticios.ts` (2026-09-19).
//
// Son ilustraciones de la interfaz, no capturas: se parecen al producto sin
// pretender ser una foto de una pantalla concreta.

import { ComponentType, ReactNode } from "react";

import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, DocumentText, TickCircle } from "iconsax-react";

import { CARATULA, CONTACTO, EVENTOS_MES, MOVIMIENTOS, RUBROS, TAREAS, TOTAL_LIQUIDACION, TRAMOS } from "./datosFicticios";

const AZUL = "#3A7BFF";
const VERDE = "#2E9E6B";
const AMBAR = "#D98324";

/** Marco tipo ventana. No imita un navegador: es el borde de la app. */
export const MockVentana = ({ titulo, children }: { titulo: string; children: ReactNode }) => {
	const theme = useTheme();
	const oscuro = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				borderRadius: 3,
				overflow: "hidden",
				border: `1px solid ${alpha(AZUL, oscuro ? 0.22 : 0.14)}`,
				boxShadow: `0 24px 60px -30px ${alpha(AZUL, oscuro ? 0.5 : 0.35)}`,
				bgcolor: oscuro ? alpha("#0d1220", 0.78) : "#fff",
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				spacing={1}
				sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: oscuro ? alpha("#0b101c", 0.6) : alpha("#f7f9fc", 0.9) }}
			>
				{["#E5564E", "#E9B44C", "#4CAF7D"].map((c) => (
					<Box key={c} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: alpha(c, 0.7) }} />
				))}
				<Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: 500 }}>
					{titulo}
				</Typography>
			</Stack>
			<Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
		</Box>
	);
};

/** Entrada escalonada de las filas. */
const fila = (i: number) => ({
	initial: { opacity: 0, x: -10 },
	whileInView: { opacity: 1, x: 0 },
	// Umbral bajo a propósito: con 0.4 las filas de abajo quedaban invisibles
	// mientras se scrolleaba y la maqueta parecía cortada.
	viewport: { once: true, amount: 0.05 },
	transition: { duration: 0.35, delay: 0.06 * i, ease: [0.22, 0.61, 0.36, 1] as const },
});

const Etiqueta = ({ texto, tono = "neutro" }: { texto: string; tono?: "acento" | "alerta" | "ok" | "neutro" }) => {
	const theme = useTheme();
	const color = tono === "acento" ? AZUL : tono === "alerta" ? AMBAR : tono === "ok" ? VERDE : theme.palette.text.secondary;
	return (
		<Box
			component="span"
			sx={{
				display: "inline-block",
				px: 0.9,
				py: 0.25,
				borderRadius: 1,
				fontSize: "0.68rem",
				fontWeight: 600,
				lineHeight: 1.5,
				color,
				bgcolor: alpha(color, 0.12),
				whiteSpace: "nowrap",
			}}
		>
			{texto}
		</Box>
	);
};

// ---------------------------------------------------------------- expedientes
/** `filas` recorta la lista: el encabezado muestra una versión corta para no
 *  repetir la misma ventana que el primer bloque, que va unos píxeles más abajo. */
const MockExpedientes = ({ filas }: { filas?: number }) => {
	const theme = useTheme();
	return (
		<MockVentana titulo={CARATULA}>
			<Stack spacing={1.25}>
				{(filas ? MOVIMIENTOS.slice(0, filas) : MOVIMIENTOS).map((m, i) => (
					<Stack
						key={m.titulo}
						component={motion.div}
						{...fila(i)}
						direction="row"
						alignItems="center"
						spacing={1.5}
						sx={{
							py: 1,
							px: 1.25,
							borderRadius: 1.5,
							bgcolor: m.nuevo ? alpha(AZUL, 0.06) : "transparent",
							border: `1px solid ${m.nuevo ? alpha(AZUL, 0.16) : theme.palette.divider}`,
						}}
					>
						<Typography variant="caption" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", width: 38, flex: "none" }}>
							{m.fecha}
						</Typography>
						<DocumentText size={16} color={m.nuevo ? AZUL : theme.palette.text.disabled} variant="Bold" style={{ flex: "none" }} />
						<Typography variant="body2" sx={{ flex: 1, fontWeight: m.nuevo ? 600 : 400, lineHeight: 1.3 }} noWrap>
							{m.titulo}
						</Typography>
						<Etiqueta texto={m.tipo} tono={m.nuevo ? "acento" : "neutro"} />
					</Stack>
				))}
			</Stack>
		</MockVentana>
	);
};

// ---------------------------------------------------------------- calendario
const MockCalendario = () => {
	const theme = useTheme();
	const dias = Array.from({ length: 30 }, (_, i) => i + 1);
	const tono = { acento: AZUL, alerta: AMBAR, neutro: theme.palette.text.secondary };
	return (
		<MockVentana titulo="Vencimientos · septiembre">
			<Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
				{["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
					<Typography key={i} variant="caption" sx={{ textAlign: "center", color: "text.secondary", fontWeight: 600, mb: 0.5 }}>
						{d}
					</Typography>
				))}
				{dias.map((d, i) => {
					const evs = EVENTOS_MES.filter((e) => e.dia === d);
					return (
						<Box
							key={d}
							component={motion.div}
							{...fila(Math.floor(i / 7))}
							sx={{
								minHeight: 42,
								borderRadius: 1,
								p: 0.5,
								border: `1px solid ${evs.length ? alpha(AZUL, 0.18) : theme.palette.divider}`,
								bgcolor: evs.length ? alpha(AZUL, 0.05) : "transparent",
							}}
						>
							<Typography sx={{ fontSize: "0.62rem", color: "text.secondary", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{d}</Typography>
							{evs.slice(0, 1).map((e) => (
								<Box
									key={e.texto}
									sx={{
										mt: 0.25,
										px: 0.4,
										borderRadius: 0.5,
										bgcolor: alpha(tono[e.tono], 0.16),
										fontSize: "0.55rem",
										fontWeight: 600,
										color: tono[e.tono],
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{e.texto}
								</Box>
							))}
						</Box>
					);
				})}
			</Box>
		</MockVentana>
	);
};

// ------------------------------------------------------------------- cálculos
const MockCalculos = () => {
	const theme = useTheme();
	return (
		<MockVentana titulo="Liquidación por despido">
			<Stack spacing={0.75}>
				{RUBROS.map((r, i) => (
					<Stack key={r.rubro} component={motion.div} {...fila(i)} direction="row" justifyContent="space-between" alignItems="baseline" sx={{ py: 0.6 }}>
						<Typography variant="body2" color="text.secondary" sx={{ pr: 2 }}>
							{r.rubro}
						</Typography>
						<Typography variant="body2" sx={{ fontWeight: 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
							$ {r.monto}
						</Typography>
					</Stack>
				))}
				<Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 1, pt: 1.25 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="baseline">
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							Total
						</Typography>
						<Typography sx={{ fontSize: "1.35rem", fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: AZUL }}>
							$ {TOTAL_LIQUIDACION}
						</Typography>
					</Stack>
					<Etiqueta texto="Ley 27.742 · topes de convenio al día" tono="ok" />
				</Box>
			</Stack>
		</MockVentana>
	);
};

// ------------------------------------------------------------------ intereses
const MockIntereses = () => (
	<MockVentana titulo="Intereses por tramo">
		<Stack spacing={1}>
			{TRAMOS.map((t, i) => (
				<Box
					key={t.periodo}
					component={motion.div}
					{...fila(i)}
					sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0.5, py: 1, px: 1.25, borderRadius: 1.5, bgcolor: alpha(AZUL, 0.05) }}
				>
					<Typography variant="body2" sx={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
						{t.periodo}
					</Typography>
					<Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
						$ {t.aporte}
					</Typography>
					<Etiqueta texto={t.tasa} tono="acento" />
				</Box>
			))}
		</Stack>
	</MockVentana>
);

// --------------------------------------------------------------------- tareas
const MockTareas = () => {
	const theme = useTheme();
	return (
		<MockVentana titulo="Tareas del estudio">
			<Stack spacing={1}>
				{TAREAS.map((t, i) => (
					<Stack
						key={t.tarea}
						component={motion.div}
						{...fila(i)}
						direction="row"
						alignItems="center"
						spacing={1.25}
						sx={{ py: 1, px: 1.25, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}
					>
						{t.estado === "listo" ? (
							<TickCircle size={18} color={VERDE} variant="Bold" style={{ flex: "none" }} />
						) : (
							<Box sx={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${alpha(AZUL, 0.4)}`, flex: "none" }} />
						)}
						<Typography
							variant="body2"
							sx={{ flex: 1, lineHeight: 1.3, textDecoration: t.estado === "listo" ? "line-through" : "none", color: t.estado === "listo" ? "text.disabled" : "text.primary" }}
							noWrap
						>
							{t.tarea}
						</Typography>
						<Box
							sx={{
								width: 26,
								height: 26,
								borderRadius: 1,
								flex: "none",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(AZUL, 0.12),
								fontSize: "0.65rem",
								fontWeight: 700,
								color: AZUL,
							}}
						>
							{t.quien}
						</Box>
						<Etiqueta texto={t.vence} tono={t.estado === "listo" ? "ok" : "alerta"} />
					</Stack>
				))}
			</Stack>
		</MockVentana>
	);
};

// ------------------------------------------------------------------ contactos
const MockContactos = () => {
	const theme = useTheme();
	return (
		<MockVentana titulo="Ficha de contacto">
			<Stack spacing={2}>
				<Stack direction="row" spacing={1.75} alignItems="center">
					<Box
						sx={{
							width: 48,
							height: 48,
							borderRadius: 2,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(AZUL, 0.14),
							color: AZUL,
							fontWeight: 700,
						}}
					>
						{CONTACTO.iniciales}
					</Box>
					<Box>
						<Typography sx={{ fontWeight: 600, lineHeight: 1.2 }}>{CONTACTO.nombre}</Typography>
						<Etiqueta texto={CONTACTO.rol} tono="acento" />
					</Box>
				</Stack>
				{CONTACTO.datos.map((d, i) => (
					<Stack key={d.etiqueta} component={motion.div} {...fila(i)} direction="row" justifyContent="space-between">
						<Typography variant="body2" color="text.secondary">
							{d.etiqueta}
						</Typography>
						<Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
							{d.valor}
						</Typography>
					</Stack>
				))}
				<Stack
					direction="row"
					alignItems="center"
					spacing={1}
					sx={{ pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}
				>
					<Calendar size={16} color={AZUL} variant="Bold" />
					<Typography variant="body2" sx={{ flex: 1 }}>
						{CONTACTO.causas} causas vinculadas
					</Typography>
					<ArrowRight size={15} color={theme.palette.text.secondary} />
				</Stack>
			</Stack>
		</MockVentana>
	);
};

/** Maqueta por id de función. Sin maqueta, el bloque cae en su lista de datos. */
export const MOCKS: Record<string, ComponentType<{ filas?: number }>> = {
	expedientes: MockExpedientes,
	calendario: MockCalendario,
	calculos: MockCalculos,
	intereses: MockIntereses,
	tareas: MockTareas,
	contactos: MockContactos,
};
