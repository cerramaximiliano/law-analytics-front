import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import { Refresh2, DocumentText, Edit2, LinkCircle, ShieldTick } from "iconsax-react";
import type { SyncTarget } from "./OverwriteNotice";

/**
 * "Qué va a pasar con esta carpeta": aviso previo a vincular una carpeta EXISTENTE
 * con un expediente. Reemplaza el `Alert warning` genérico ("se descargará y
 * actualizará automáticamente…") que repetía cada modal de vinculación y que no
 * decía nada sobre lo que el usuario realmente necesita saber antes de confirmar:
 * que la carpeta pasa a actualizarse sola, que van a entrar movimientos nuevos,
 * qué pasa con sus datos propios (depende del checkbox de `OverwriteNotice`) y
 * si después puede volver atrás.
 *
 * Complementa —no reemplaza— a `OverwriteNotice`, que sigue mostrando el detalle
 * de los valores que se pisan.
 */

const ORIGEN: Record<SyncTarget, string> = {
	pjn: "el Poder Judicial de la Nación",
	mev: "la Mesa de Entradas Virtual",
	eje: "el sistema EJE",
	iol: "el portal judicial",
};

interface LinkChangesNoticeProps {
	target: SyncTarget;
	/** Estado actual del checkbox "Reemplazar los datos" (OverwriteNotice). */
	overwrite: boolean;
	/** Nombre del origen para los portales IOL ("PJ Salta", "PJ Catamarca"…). */
	origenNombre?: string;
	accent?: string;
}

const LinkChangesNotice = ({ target, overwrite, origenNombre, accent }: LinkChangesNoticeProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const color = accent || theme.palette.primary.main;
	const origen = origenNombre || ORIGEN[target];

	const items: { icon: React.ReactNode; text: React.ReactNode }[] = [
		{
			icon: <Refresh2 size={15} variant="Bulk" />,
			text:
				target === "mev" ? (
					<>
						Queda vinculada a {origen} y se actualiza sola, consultando el portal <b>con tu cuenta MEV</b>.
					</>
				) : (
					<>Queda vinculada a {origen} y se actualiza sola.</>
				),
		},
		{
			icon: <DocumentText size={15} variant="Bulk" />,
			text: <>Los movimientos nuevos del expediente aparecen en la carpeta a medida que se publican.</>,
		},
		{
			icon: <Edit2 size={15} variant="Bulk" />,
			text: overwrite ? (
				<>
					Sus datos (carátula, juzgado, materia…) se reemplazan por los del expediente.{" "}
					<b>Destildá “Reemplazar” si preferís conservarlos.</b>
				</>
			) : (
				<>Tus datos propios se conservan: solo se agregan los movimientos del expediente.</>
			),
		},
		// PJN no tiene desvinculación por carpeta (se administra por credenciales);
		// no prometer una salida que hoy no existe.
		...(target === "pjn"
			? []
			: [
					{
						icon: <LinkCircle size={15} variant="Bulk" />,
						text: <>Podés desvincularla cuando quieras desde la carpeta: se conservan tareas, notas, eventos, cálculos y documentos.</>,
					},
			  ]),
	];

	return (
		<Box
			sx={{
				p: 1.5,
				borderRadius: 1.25,
				bgcolor: alpha(color, isDark ? 0.08 : 0.04),
				border: `1px solid ${alpha(color, isDark ? 0.28 : 0.18)}`,
			}}
		>
			<Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
				<ShieldTick size={16} variant="Bulk" color={color} />
				<Typography
					sx={{
						fontSize: "0.66rem",
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "text.secondary",
					}}
				>
					Qué va a pasar con esta carpeta
				</Typography>
			</Stack>
			<Stack spacing={0.75}>
				{items.map((it, i) => (
					<Stack key={i} direction="row" spacing={1} alignItems="flex-start">
						<Box sx={{ color, display: "flex", pt: "2px", flexShrink: 0 }}>{it.icon}</Box>
						<Typography sx={{ fontSize: "0.76rem", color: "text.primary", lineHeight: 1.5 }}>{it.text}</Typography>
					</Stack>
				))}
			</Stack>
		</Box>
	);
};

export default LinkChangesNotice;
