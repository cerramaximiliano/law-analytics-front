import { Box, Divider, Link, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import dayjs from "utils/dayjs-config";
import { BRAND_BLUE } from "themes/dashboardTokens";
import AyudaActosPjn from "sections/actividad-propia/AyudaActosPjn";
import DiasActividadChip from "sections/actividad-propia/DiasActividadChip";
import type { UltimaActividadLetrado } from "types/folder";
import AvisoEscritosDetenidos from "sections/actividad-propia/AvisoEscritosDetenidos";
import { TIPO_ACTO_LABEL, ESTADO_ACTO_LABEL, AMBAR_TEXTO, type SincronizacionEscritos } from "services/actividadPropiaService";

interface Props {
	resumen: UltimaActividadLetrado | null | undefined;
	/** undefined mientras no se sabe (sin respuesta del hub). */
	habilitado?: boolean;
	/** false: el usuario apagó los escritos en Integraciones → PJN; no se muestra la línea. */
	activo?: boolean;
	sincronizacion?: SincronizacionEscritos | null;
	loading?: boolean;
	onVerTodas?: () => void;
}

const rotuloSx = { fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" } as const;

const Titulo = ({ texto, tooltip }: { texto: string; tooltip?: string }) => (
	<Tooltip title={tooltip ?? texto}>
		<Typography
			variant="caption"
			sx={{ fontWeight: 600, color: "text.primary", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
		>
			«{texto}»
		</Typography>
	</Tooltip>
);

const Detalle = ({ children }: { children: React.ReactNode }) => (
	<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
		{children}
	</Typography>
);

/**
 * Cabecera «Último escrito PJN» arriba de los movimientos del expediente PJN, en dos bloques separados:
 * el último escrito que ya figura en el expediente (el que cuenta los días) y lo presentado
 * después que todavía no tiene movimiento (sin proveer). Sin escritos: una sola línea.
 */
const ActividadPropiaLinea = ({ resumen, habilitado, activo, sincronizacion, loading, onVerTodas }: Props) => {
	const theme = useTheme();
	const ambar = theme.palette.mode === "dark" ? AMBAR_TEXTO.dark : AMBAR_TEXTO.light;

	if (activo !== true || (loading && !resumen)) return null;

	const tipoLabel = (t?: string | null) => (t ? TIPO_ACTO_LABEL[t as keyof typeof TIPO_ACTO_LABEL] ?? t : "Escrito");

	// Sin ningún escrito con la credencial: una sola línea baja, sin «Ver todas» (llevaría a una lista vacía).
	if (!resumen) {
		return (
			<Stack
				direction="row"
				spacing={1}
				alignItems="center"
				flexWrap="wrap"
				useFlexGap
				sx={(t) => ({ px: 2, py: 0.5, borderBottom: `1px solid ${t.palette.divider}` })}
			>
				<Typography sx={{ ...rotuloSx, color: "text.secondary" }}>Último escrito PJN</Typography>
				<Detalle>
					{habilitado === false ? "La credencial PJN vinculada no tiene bandeja de escritos" : "Sin escritos con esta credencial"}
				</Detalle>
				<AvisoEscritosDetenidos sincronizacion={sincronizacion} compacto />
			</Stack>
		);
	}

	// Bloque 1: el último escrito que el expediente registra.
	let ultima: React.ReactNode;
	if (!resumen.fecha) {
		ultima = <Detalle>Ninguna figura todavía en el expediente</Detalle>;
	} else {
		ultima = (
			<>
				<DiasActividadChip fecha={resumen.fecha} />
				{resumen.titulo && (
					<Titulo
						texto={resumen.titulo}
						tooltip={`${resumen.titulo}${resumen.estado ? ` · ${ESTADO_ACTO_LABEL[resumen.estado] ?? resumen.estado}` : ""}`}
					/>
				)}
				<Detalle>
					{tipoLabel(resumen.tipo)} · {dayjs(resumen.fecha).format("DD/MM/YYYY")}
				</Detalle>
			</>
		);
	}

	// Bloque 2: lo presentado después, todavía sin movimiento en el expediente.
	const sinConfirmar = resumen.ultimoSinConfirmar ?? null;
	const pendientes = resumen.pendientes || 0;
	const hayPendiente = !!sinConfirmar || pendientes > 0;
	const rotuloPendiente = pendientes > 0 ? "Presentado, sin proveer" : "Presentado, sin movimiento todavía";
	const otros = sinConfirmar ? pendientes - (sinConfirmar.tipo === "escrito" && sinConfirmar.estado === "presentado" ? 1 : 0) : pendientes;

	return (
		<Stack
			direction={{ xs: "column", sm: "row" }}
			alignItems={{ xs: "stretch", sm: "center" }}
			columnGap={2}
			rowGap={1}
			sx={(t) => ({ px: 2, py: 1, borderBottom: `1px solid ${t.palette.divider}` })}
		>
			<Stack spacing={0.25} sx={{ minWidth: 0 }}>
				<Stack direction="row" spacing={0.5} alignItems="center">
					<Typography sx={{ ...rotuloSx, color: "text.secondary" }}>Último escrito PJN en el expediente</Typography>
					<AyudaActosPjn size={12} />
				</Stack>
				<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
					{ultima}
				</Stack>
				<AvisoEscritosDetenidos sincronizacion={sincronizacion} compacto />
			</Stack>

			{hayPendiente && (
				<>
					<Divider
						orientation="vertical"
						flexItem
						sx={{ display: { xs: "none", sm: "block" }, borderColor: (t) => alpha(t.palette.text.primary, 0.25), my: 0.25 }}
					/>
					<Divider sx={{ display: { xs: "block", sm: "none" }, borderColor: (t) => alpha(t.palette.text.primary, 0.25) }} />
					<Tooltip title="No corre el contador hasta que figure como movimiento en el expediente.">
						<Stack spacing={0.25} sx={{ minWidth: 0 }}>
							<Stack direction="row" spacing={0.5} alignItems="center">
								<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: ambar, flexShrink: 0 }} />
								<Typography sx={{ ...rotuloSx, color: ambar }}>{rotuloPendiente}</Typography>
							</Stack>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
								{sinConfirmar ? (
									<>
										{sinConfirmar.titulo && <Titulo texto={sinConfirmar.titulo} />}
										<Detalle>
											{tipoLabel(sinConfirmar.tipo)} · {dayjs(sinConfirmar.fecha).format("DD/MM/YYYY")}
										</Detalle>
									</>
								) : (
									<Detalle>{pendientes === 1 ? "1 escrito" : `${pendientes} escritos`}</Detalle>
								)}
								{sinConfirmar && otros > 0 && <Detalle>{otros === 1 ? "y 1 escrito más" : `y ${otros} escritos más`}</Detalle>}
							</Stack>
						</Stack>
					</Tooltip>
				</>
			)}

			{onVerTodas && (
				<>
					<Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />
					<Link
						component="button"
						variant="caption"
						onClick={onVerTodas}
						underline="hover"
						sx={{ fontWeight: 500, color: BRAND_BLUE, alignSelf: { xs: "flex-start", sm: "center" }, whiteSpace: "nowrap" }}
					>
						Ver todas
					</Link>
				</>
			)}
		</Stack>
	);
};

export default ActividadPropiaLinea;
