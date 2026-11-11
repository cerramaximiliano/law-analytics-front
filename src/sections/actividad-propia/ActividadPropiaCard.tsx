import { Box, Stack, Typography, Skeleton, alpha, useTheme, Link } from "@mui/material";
import dayjs from "utils/dayjs-config";
import { BRAND_BLUE } from "themes/dashboardTokens";
import AyudaActosPjn, { NOMBRE_ACTOS_PJN } from "sections/actividad-propia/AyudaActosPjn";
import type { UltimaActividadLetrado } from "types/folder";
import { diasDesde, tramoDe, tramoInfo, TIPO_ACTO_LABEL, ESTADO_ACTO_LABEL } from "services/actividadPropiaService";

interface Props {
	resumen: UltimaActividadLetrado | null | undefined;
	/** undefined mientras no se sabe (sin respuesta del hub). */
	habilitado?: boolean;
	loading?: boolean;
	onVerActos?: () => void;
}

/**
 * Tarjeta «Actos del letrado en PJN» de la columna lateral de Actividad: días desde el último acto
 * propio que cuenta, cuál fue.
 */
const ActividadPropiaCard = ({ resumen, habilitado, loading, onVerActos }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const borde = alpha(BRAND_BLUE, isDark ? 0.16 : 0.1);

	const titulo = (
		<Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
			<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
			<Typography
				sx={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
			>
				{NOMBRE_ACTOS_PJN}
			</Typography>
			<AyudaActosPjn size={12} />
		</Stack>
	);

	if (loading && !resumen) {
		return (
			<Box sx={{ p: 1.75, borderTop: `1px solid ${borde}` }}>
				{titulo}
				<Skeleton variant="rectangular" height={88} sx={{ borderRadius: 1 }} />
			</Box>
		);
	}

	if (!resumen) {
		return (
			<Box sx={{ p: 1.75, borderTop: `1px solid ${borde}` }}>
				{titulo}
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.45 }}>
					{habilitado === false
						? "La credencial PJN vinculada no tiene bandeja de escritos: el portal no da las presentaciones del letrado."
						: "Sin presentaciones con esta credencial: ningún escrito, cédula ni DEOX presentado con la credencial PJN vinculada. Puede llevarla otro letrado."}
				</Typography>
			</Box>
		);
	}

	const sinConfirmar = resumen.ultimoSinConfirmar;
	const lineaSinConfirmar = sinConfirmar && (
		<Typography sx={{ mt: 0.75, fontSize: "0.68rem", color: "text.secondary", lineHeight: 1.4 }}>
			Después: {TIPO_ACTO_LABEL[sinConfirmar.tipo] ?? sinConfirmar.tipo}
			{sinConfirmar.titulo ? ` «${sinConfirmar.titulo}»` : ""} del {dayjs(sinConfirmar.fecha).format("DD/MM/YYYY")}, todavía sin movimiento
			en el expediente: no corre el contador.
		</Typography>
	);

	if (!resumen.fecha) {
		return (
			<Box sx={{ p: 1.75, borderTop: `1px solid ${borde}` }}>
				{titulo}
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.45 }}>
					Ninguna presentación de esta credencial figura todavía como movimiento en el expediente.
				</Typography>
				{lineaSinConfirmar}
				{onVerActos && (
					<Link
						component="button"
						onClick={onVerActos}
						underline="hover"
						sx={{ mt: 1, fontSize: "0.7rem", fontWeight: 500, color: BRAND_BLUE }}
					>
						Ver todas las presentaciones
					</Link>
				)}
			</Box>
		);
	}

	const dias = diasDesde(resumen.fecha) ?? 0;
	const t = tramoInfo(tramoDe(dias));

	return (
		<Box sx={{ p: 1.75, borderTop: `1px solid ${borde}` }}>
			{titulo}
			<Stack direction="row" spacing={0.75} alignItems="baseline">
				<Typography
					sx={{
						fontSize: "1.6rem",
						fontWeight: 700,
						lineHeight: 1,
						fontVariantNumeric: "tabular-nums",
						color: t ? (isDark ? t.color : t.fg) : "text.primary",
					}}
				>
					{dias}
				</Typography>
				<Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
					{dias === 1 ? "día desde la última presentación" : "días desde la última presentación"}
				</Typography>
			</Stack>

			<Box sx={{ mt: 1, p: 1, borderRadius: 0.75, bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03), border: `1px solid ${borde}` }}>
				<Typography sx={{ fontSize: "0.64rem", color: "text.secondary" }}>
					Última presentación en el expediente · {resumen.tipo ? TIPO_ACTO_LABEL[resumen.tipo] ?? resumen.tipo : ""}
				</Typography>
				{resumen.titulo && (
					<Typography sx={{ fontSize: "0.72rem", fontWeight: 600, lineHeight: 1.3, wordBreak: "break-word" }}>{resumen.titulo}</Typography>
				)}
				<Typography sx={{ fontSize: "0.68rem", color: "text.secondary" }}>
					{dayjs(resumen.fecha).format("DD/MM/YYYY HH:mm")} · {resumen.estado ? ESTADO_ACTO_LABEL[resumen.estado] ?? resumen.estado : ""}
				</Typography>
			</Box>

			{lineaSinConfirmar}

			{(resumen.pendientes || 0) > 0 && (
				<Typography sx={{ mt: 0.75, fontSize: "0.68rem", color: isDark ? "warning.light" : "warning.dark", fontWeight: 500 }}>
					{resumen.pendientes === 1 ? "1 escrito presentado sin proveer" : `${resumen.pendientes} escritos presentados sin proveer`}
				</Typography>
			)}

			{onVerActos && (
				<Link
					component="button"
					onClick={onVerActos}
					underline="hover"
					sx={{ mt: 1, fontSize: "0.7rem", fontWeight: 500, color: BRAND_BLUE }}
				>
					Ver todas las presentaciones
				</Link>
			)}
		</Box>
	);
};

export default ActividadPropiaCard;
