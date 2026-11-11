import { useMemo, useState } from "react";
import {
	Box,
	Stack,
	Typography,
	Chip,
	FormControlLabel,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TableContainer,
	Skeleton,
	IconButton,
	alpha,
	useTheme,
} from "@mui/material";
import { Menu } from "iconsax-react";
import dayjs from "utils/dayjs-config";
import { BRAND_BLUE } from "themes/dashboardTokens";
import AyudaActosPjn, { NOMBRE_ACTOS_PJN } from "sections/actividad-propia/AyudaActosPjn";
import { ESTADO_ACTO_LABEL, TIPO_ACTO_LABEL, type ActosPropiosCarpeta } from "services/actividadPropiaService";
import type { TipoActoPropio } from "types/folder";

interface Props {
	data: ActosPropiosCarpeta | null;
	loading: boolean;
	error: boolean;
	/** Móvil: abre el menú lateral de Actividad. */
	onOpenMenu?: () => void;
}

type FiltroTipo = "todos" | TipoActoPropio;

const ESTADO_COLOR: Record<string, string> = {
	en_expediente: "success.main",
	gestionado: "primary.main",
	presentado: "warning.main",
	enviado: "text.secondary",
	no_agregado: "text.disabled",
};

/** Sub-vista «Actos PJN» de Actividad: historial de escritos, cédulas y DEOX presentados con la credencial. */
const ActosPropiosPanel = ({ data, loading, error, onOpenMenu }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const borde = alpha(BRAND_BLUE, isDark ? 0.16 : 0.1);
	const [tipo, setTipo] = useState<FiltroTipo>("todos");
	const [verNoCuentan, setVerNoCuentan] = useState(true);

	const actos = data?.actos ?? [];
	const ultimoQueCuentaId = useMemo(() => actos.find((a) => a.valido && a.estado === "en_expediente")?._id, [actos]);
	const visibles = useMemo(
		() => actos.filter((a) => (tipo === "todos" || a.tipo === tipo) && (verNoCuentan || a.valido)),
		[actos, tipo, verNoCuentan],
	);
	const c = data?.conteo;
	const totalValidos = c ? c.escrito + c.cedula + c.deox : 0;

	const chips: { key: FiltroTipo; label: string }[] = [
		{ key: "todos", label: `Todos · ${totalValidos}` },
		{ key: "escrito", label: `Escritos · ${c?.escrito ?? 0}` },
		{ key: "cedula", label: `Cédulas · ${c?.cedula ?? 0}` },
		{ key: "deox", label: `DEOX · ${c?.deox ?? 0}` },
	];

	return (
		<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
			<Box sx={{ p: 1.5, borderBottom: `1px solid ${borde}`, bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02) }}>
				<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap rowGap={1}>
					{onOpenMenu && (
						<IconButton
							onClick={onOpenMenu}
							size="small"
							aria-label="Menú de actividad"
							sx={{ border: `1px solid ${borde}`, color: BRAND_BLUE }}
						>
							<Menu size={16} variant="Bulk" />
						</IconButton>
					)}
					<Stack spacing={0}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Typography sx={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.005em" }}>{NOMBRE_ACTOS_PJN}</Typography>
							<AyudaActosPjn />
						</Stack>
						<Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
							Escritos, cédulas y DEOX presentados con la credencial PJN vinculada
						</Typography>
					</Stack>
					<Box sx={{ flex: 1 }} />
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap rowGap={0.75}>
						{chips.map((ch) => (
							<Chip
								key={ch.key}
								label={ch.label}
								size="small"
								onClick={() => setTipo(ch.key)}
								color={tipo === ch.key ? "primary" : "default"}
								variant={tipo === ch.key ? "filled" : "outlined"}
							/>
						))}
					</Stack>
					{(c?.noCuentan ?? 0) > 0 && (
						<FormControlLabel
							control={<Switch size="small" checked={verNoCuentan} onChange={(e) => setVerNoCuentan(e.target.checked)} />}
							label={<Typography sx={{ fontSize: "0.72rem" }}>Mostrar las que no cuentan ({c?.noCuentan})</Typography>}
							sx={{ ml: 0.5 }}
						/>
					)}
				</Stack>
			</Box>

			<Box sx={{ flex: 1, overflow: "auto" }}>
				{loading && !data ? (
					<Stack spacing={1} p={2}>
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 0.75 }} />
						))}
					</Stack>
				) : error ? (
					<Typography sx={{ p: 3, fontSize: "0.8rem", color: "text.secondary" }}>
						No pudimos cargar las presentaciones. Probá de nuevo en un rato.
					</Typography>
				) : data?.habilitado === false && actos.length === 0 ? (
					<Typography sx={{ p: 3, fontSize: "0.8rem", color: "text.secondary" }}>
						Tu credencial PJN no tiene bandeja de escritos: el portal no nos da tus escritos, cédulas ni DEOX.
					</Typography>
				) : visibles.length === 0 ? (
					<Typography sx={{ p: 3, fontSize: "0.8rem", color: "text.secondary" }}>
						{actos.length === 0
							? "Sin escritos, cédulas ni DEOX presentados con la credencial PJN en esta causa."
							: "No hay presentaciones con este filtro."}
					</Typography>
				) : (
					<TableContainer>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}>Fecha</TableCell>
									<TableCell sx={{ fontSize: "0.72rem", fontWeight: 600 }}>Presentación</TableCell>
									<TableCell sx={{ fontSize: "0.72rem", fontWeight: 600 }}>Estado</TableCell>
									<TableCell sx={{ fontSize: "0.72rem", fontWeight: 600 }}>Movimiento en el expediente</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{visibles.map((a) => {
									const esUltimo = a._id === ultimoQueCuentaId;
									const apagado = !a.valido;
									return (
										<TableRow
											key={a._id}
											sx={{
												bgcolor: esUltimo
													? alpha(BRAND_BLUE, isDark ? 0.08 : 0.04)
													: apagado
													? alpha(theme.palette.text.primary, 0.02)
													: undefined,
											}}
										>
											<TableCell
												sx={{
													fontSize: "0.75rem",
													whiteSpace: "nowrap",
													fontVariantNumeric: "tabular-nums",
													color: apagado ? "text.disabled" : "text.primary",
												}}
											>
												{dayjs(a.fecha).format("DD/MM/YYYY HH:mm")}
											</TableCell>
											<TableCell sx={{ fontSize: "0.75rem" }}>
												<Stack spacing={0.25}>
													<Stack direction="row" spacing={0.75} alignItems="center">
														<Box
															component="span"
															sx={{
																fontSize: "0.64rem",
																fontWeight: 600,
																border: `1px solid ${theme.palette.divider}`,
																borderRadius: 0.5,
																px: 0.75,
																py: 0.1,
																color: "text.secondary",
																flexShrink: 0,
															}}
														>
															{TIPO_ACTO_LABEL[a.tipo] ?? a.tipo}
														</Box>
														<Typography
															component="span"
															sx={{
																fontSize: "0.75rem",
																color: apagado ? "text.disabled" : "text.primary",
																textDecoration: apagado ? "line-through" : "none",
																wordBreak: "break-word",
															}}
														>
															{a.titulo || (a.numeroCedula ? `Cédula N° ${a.numeroCedula}` : TIPO_ACTO_LABEL[a.tipo])}
														</Typography>
													</Stack>
													{a.destinatarios.length > 0 && (
														<Typography sx={{ fontSize: "0.66rem", color: "text.secondary" }}>A {a.destinatarios.join(", ")}</Typography>
													)}
													{esUltimo && (
														<Typography sx={{ fontSize: "0.66rem", fontWeight: 700, color: BRAND_BLUE }}>
															Última presentación que cuenta
														</Typography>
													)}
												</Stack>
											</TableCell>
											<TableCell
												sx={{
													fontSize: "0.75rem",
													whiteSpace: "nowrap",
													fontWeight: 500,
													color: ESTADO_COLOR[a.estado] ?? "text.secondary",
												}}
											>
												{ESTADO_ACTO_LABEL[a.estado] ?? a.estado}
											</TableCell>
											<TableCell sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
												{a.movimiento
													? `${a.movimiento.tipo || "Movimiento"} · ${dayjs.utc(a.movimiento.fecha).format("DD/MM/YYYY")}`
													: apagado
													? "No cuenta como actividad"
													: "—"}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Box>
			<Box sx={{ px: 1.5, py: 1, borderTop: `1px solid ${borde}` }}>
				<Typography sx={{ fontSize: "0.66rem", color: "text.secondary" }}>
					Fuente: bandeja de escritos, cédulas enviadas y DEOX enviados del portal PJN. Cuenta la última presentación que ya figura como
					movimiento en el expediente; lo presentado y todavía sin movimiento no corre el contador.
					{data?.truncado ? " Se muestran los 1.000 más recientes." : ""}
				</Typography>
			</Box>
		</Box>
	);
};

export default ActosPropiosPanel;
