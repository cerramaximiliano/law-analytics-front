import { Box, Link, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import dayjs from "utils/dayjs-config";
import { BRAND_BLUE } from "themes/dashboardTokens";
import AyudaActosPjn from "sections/actividad-propia/AyudaActosPjn";
import DiasActividadChip from "sections/actividad-propia/DiasActividadChip";
import type { UltimaActividadLetrado } from "types/folder";
import { TIPO_ACTO_LABEL, ESTADO_ACTO_LABEL, AMBAR_TEXTO } from "services/actividadPropiaService";

interface Props {
	resumen: UltimaActividadLetrado | null | undefined;
	/** undefined mientras no se sabe (sin respuesta del hub). */
	habilitado?: boolean;
	loading?: boolean;
	onVerTodas?: () => void;
}

const sep = (
	<Typography component="span" variant="caption" color="text.disabled">
		·
	</Typography>
);

/**
 * Línea «Última presentación» arriba de los movimientos del expediente PJN: días desde la última presentación
 * del letrado que ya figura en el expediente, cuál fue, y lo presentado después que todavía no tiene movimiento.
 */
const ActividadPropiaLinea = ({ resumen, habilitado, loading, onVerTodas }: Props) => {
	const theme = useTheme();
	const ambar = theme.palette.mode === "dark" ? AMBAR_TEXTO.dark : AMBAR_TEXTO.light;

	if (loading && !resumen) return null;

	const verTodas = onVerTodas && (
		<Link component="button" variant="caption" onClick={onVerTodas} underline="hover" sx={{ fontWeight: 500, color: BRAND_BLUE }}>
			Ver todas
		</Link>
	);

	let contenido: React.ReactNode;
	if (!resumen) {
		contenido = (
			<Typography variant="caption" color="text.secondary">
				{habilitado === false ? "La credencial PJN vinculada no tiene bandeja de escritos" : "Sin presentaciones con esta credencial"}
			</Typography>
		);
	} else {
		const sinConfirmar = resumen.ultimoSinConfirmar;
		const tituloSinConfirmar = sinConfirmar
			? `${TIPO_ACTO_LABEL[sinConfirmar.tipo] ?? sinConfirmar.tipo}${sinConfirmar.titulo ? ` «${sinConfirmar.titulo}»` : ""} del ${dayjs(
					sinConfirmar.fecha,
			  ).format("DD/MM/YYYY")}: todavía sin movimiento en el expediente, no corre el contador.`
			: "";
		const pendientes = resumen.pendientes || 0;
		contenido = (
			<>
				{resumen.fecha ? (
					<>
						<DiasActividadChip fecha={resumen.fecha} />
						<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
							{resumen.tipo ? TIPO_ACTO_LABEL[resumen.tipo] ?? resumen.tipo : "Presentación"} del{" "}
							{dayjs(resumen.fecha).format("DD/MM/YYYY")}
						</Typography>
						{resumen.titulo && (
							<Tooltip title={`${resumen.titulo}${resumen.estado ? ` · ${ESTADO_ACTO_LABEL[resumen.estado] ?? resumen.estado}` : ""}`}>
								<Typography
									variant="caption"
									sx={{
										fontWeight: 600,
										color: "text.primary",
										minWidth: 0,
										maxWidth: 360,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									«{resumen.titulo}»
								</Typography>
							</Tooltip>
						)}
					</>
				) : (
					<Typography variant="caption" color="text.secondary">
						Ninguna figura todavía en el expediente
					</Typography>
				)}
				{sinConfirmar && (
					<>
						{sep}
						<Tooltip title={tituloSinConfirmar}>
							<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
								1 posterior sin movimiento
							</Typography>
						</Tooltip>
					</>
				)}
				{pendientes > 0 && (
					<>
						{sep}
						<Typography variant="caption" sx={{ color: ambar, fontWeight: 600, whiteSpace: "nowrap" }}>
							{pendientes === 1 ? "1 escrito sin proveer" : `${pendientes} escritos sin proveer`}
						</Typography>
					</>
				)}
			</>
		);
	}

	return (
		<Stack
			direction="row"
			alignItems="center"
			flexWrap="wrap"
			columnGap={1}
			rowGap={0.5}
			sx={(t) => ({ px: 2, py: 0.75, borderBottom: `1px solid ${t.palette.divider}` })}
		>
			<Stack direction="row" spacing={0.5} alignItems="center">
				<Typography
					sx={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
				>
					Última presentación
				</Typography>
				<AyudaActosPjn size={12} />
			</Stack>
			{contenido}
			{verTodas && (
				<>
					<Box sx={{ flexGrow: 1 }} />
					{verTodas}
				</>
			)}
		</Stack>
	);
};

export default ActividadPropiaLinea;
