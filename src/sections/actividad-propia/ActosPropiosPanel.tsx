import { useEffect, useMemo, useState } from "react";
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
	Link,
	Pagination,
	Tooltip,
	alpha,
	useTheme,
} from "@mui/material";
import { ArrowDown2, ArrowRight2, Menu } from "iconsax-react";

import dayjs from "utils/dayjs-config";
import { BRAND_BLUE } from "themes/dashboardTokens";
import AyudaActosPjn, { NOMBRE_ACTOS_PJN } from "sections/actividad-propia/AyudaActosPjn";
import AvisoEscritosDetenidos from "sections/actividad-propia/AvisoEscritosDetenidos";
import {
	AMBAR_TEXTO,
	ESTADO_ACTO_LABEL,
	TIPO_ACTO_LABEL,
	avisoEscritosDetenidos,
	type ActosPropiosCarpeta,
} from "services/actividadPropiaService";
import type { TipoActoPropio } from "types/folder";
import type { ActoPropio } from "services/actividadPropiaService";

/** Mismo tamaño de página que la tabla de movimientos del expediente. */
const POR_PAGINA = 20;
/** Desde cuántas presentaciones iguales seguidas se muestran en una sola fila (p. ej. muchas «ACOMPAÑA COPIAS DIGITALES»). */
const AGRUPAR_DESDE = 3;

type Fila = { key: string; actos: ActoPropio[] };

/** Iguales presentadas dentro de esta ventana van juntas (una tanda de adjuntos cruza a veces el minuto). */
const VENTANA_MS = 5 * 60 * 1000;

// Iguales = mismo tipo, título, estado, movimiento y credencial: el portal registra un escrito por adjunto.
const claveDeAgrupado = (a: ActoPropio) =>
	[a.tipo, a.titulo, a.estado, a.valido, a.movimiento ? `${a.movimiento.tipo}|${a.movimiento.fecha}` : "", a.presento ?? ""].join("¦");

function agrupar(actos: ActoPropio[]): Fila[] {
	const grupos: ActoPropio[][] = [];
	for (const a of actos) {
		const ultimo = grupos[grupos.length - 1];
		const cerca = ultimo && Math.abs(new Date(ultimo[0].fecha).getTime() - new Date(a.fecha).getTime()) <= VENTANA_MS;
		if (ultimo && cerca && claveDeAgrupado(ultimo[0]) === claveDeAgrupado(a)) ultimo.push(a);
		else grupos.push([a]);
	}
	return grupos.flatMap((g) => (g.length >= AGRUPAR_DESDE ? [{ key: g[0]._id, actos: g }] : g.map((a) => ({ key: a._id, actos: [a] }))));
}

interface Props {
	data: ActosPropiosCarpeta | null;
	loading: boolean;
	error: boolean;
	/** Móvil: abre el menú lateral de Actividad. */
	onOpenMenu?: () => void;
	/** Abre el movimiento en la tabla del expediente (Movimientos), resaltado. */
	onVerMovimiento?: (movementId: string) => void;
}

type FiltroTipo = "todos" | TipoActoPropio;

const ESTADO_COLOR: Record<string, string> = {
	en_expediente: "success.main",
	gestionado: "primary.main",
	presentado: "ambar",
	enviado: "text.secondary",
	no_agregado: "text.disabled",
};

/** Sub-vista «Actos PJN» de Actividad: historial de escritos, cédulas y DEOX presentados con la credencial. */
const ActosPropiosPanel = ({ data, loading, error, onOpenMenu, onVerMovimiento }: Props) => {
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
	const filas = useMemo(() => agrupar(visibles), [visibles]);
	const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
	const alternar = (key: string) =>
		setAbiertos((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	const [page, setPage] = useState(1);
	useEffect(() => setPage(1), [tipo, verNoCuentan, data]);
	const totalPages = Math.ceil(filas.length / POR_PAGINA);
	const pagina = useMemo(() => filas.slice((page - 1) * POR_PAGINA, page * POR_PAGINA), [filas, page]);
	const verPresento = !!data?.variasCredenciales;
	const c = data?.conteo;
	const totalValidos = c ? c.escrito + c.cedula + c.deox : 0;

	const chips: { key: FiltroTipo; label: string }[] = [
		{ key: "todos", label: `Todas · ${totalValidos}` },
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

			{avisoEscritosDetenidos(data?.sincronizacion) && (
				<Box sx={{ px: 2, py: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
					<AvisoEscritosDetenidos sincronizacion={data?.sincronizacion} />
				</Box>
			)}

			<Box sx={{ flex: 1, overflow: "auto" }}>
				{loading && !data ? (
					<Stack spacing={1} p={2}>
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 0.75 }} />
						))}
					</Stack>
				) : error ? (
					<Typography sx={{ p: 3, fontSize: "0.8rem", color: "text.secondary" }}>
						No pudimos cargar los escritos. Probá de nuevo en un rato.
					</Typography>
				) : data?.habilitado === false && actos.length === 0 ? (
					<Typography sx={{ p: 3, fontSize: "0.8rem", color: "text.secondary" }}>
						Tu credencial PJN no tiene bandeja de escritos: el portal no nos da tus escritos, cédulas ni DEOX.
					</Typography>
				) : visibles.length === 0 ? (
					<Typography sx={{ p: 3, fontSize: "0.8rem", color: "text.secondary" }}>
						{actos.length === 0
							? "Sin escritos, cédulas ni DEOX presentados con la credencial PJN en esta causa."
							: "No hay escritos con este filtro."}
					</Typography>
				) : (
					<TableContainer>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}>Fecha</TableCell>
									<TableCell sx={{ fontSize: "0.72rem", fontWeight: 600 }}>Presentación</TableCell>
									{verPresento && <TableCell sx={{ fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}>Presentó</TableCell>}
									<TableCell sx={{ fontSize: "0.72rem", fontWeight: 600 }}>Estado</TableCell>
									<TableCell sx={{ fontSize: "0.72rem", fontWeight: 600 }}>Movimiento en el expediente</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{pagina.flatMap((fila) => {
									const a = fila.actos[0];
									const n = fila.actos.length;
									const abierto = abiertos.has(fila.key);
									const esUltimo = fila.actos.some((x) => x._id === ultimoQueCuentaId);
									const apagado = !a.valido;
									return [
										<TableRow
											key={fila.key}
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
														{n > 1 && (
															<Chip
																label={`×${n}`}
																size="small"
																variant="outlined"
																onClick={() => alternar(fila.key)}
																onDelete={() => alternar(fila.key)}
																deleteIcon={abierto ? <ArrowDown2 size={12} /> : <ArrowRight2 size={12} />}
																title={abierto ? "Ocultar las presentaciones" : `Ver las ${n} presentaciones`}
																sx={{ height: 20, fontSize: "0.66rem", fontWeight: 600, flexShrink: 0 }}
															/>
														)}
													</Stack>
													{a.destinatarios.length > 0 && (
														<Typography sx={{ fontSize: "0.66rem", color: "text.secondary" }}>A {a.destinatarios.join(", ")}</Typography>
													)}
													{esUltimo && (
														<Tooltip
															arrow
															title="Desde esta fecha se cuentan los días sin escritos. Los escritos sin proveer no cuentan hasta que figuren en el expediente."
														>
															<Typography
																sx={{ fontSize: "0.66rem", fontWeight: 700, color: BRAND_BLUE, cursor: "help", alignSelf: "flex-start" }}
															>
																Último en el expediente
															</Typography>
														</Tooltip>
													)}
												</Stack>
											</TableCell>
											{verPresento && (
												<TableCell sx={{ fontSize: "0.72rem", color: "text.secondary", whiteSpace: "nowrap" }}>
													{a.presento ?? "—"}
												</TableCell>
											)}
											<TableCell
												sx={{
													fontSize: "0.75rem",
													whiteSpace: "nowrap",
													fontWeight: 500,
													color:
														ESTADO_COLOR[a.estado] === "ambar"
															? AMBAR_TEXTO[isDark ? "dark" : "light"]
															: ESTADO_COLOR[a.estado] ?? "text.secondary",
												}}
											>
												{ESTADO_ACTO_LABEL[a.estado] ?? a.estado}
											</TableCell>
											<TableCell sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
												{a.movimiento ? (
													a.movimiento.id && onVerMovimiento ? (
														<Link
															component="button"
															underline="hover"
															onClick={() => onVerMovimiento(a.movimiento!.id!)}
															title="Ver el movimiento en el expediente"
															sx={{
																fontSize: "0.72rem",
																color: "text.secondary",
																textAlign: "left",
																textDecorationColor: "currentColor",
																"&:hover, &:focus-visible": { color: BRAND_BLUE },
															}}
														>
															{`${a.movimiento.tipo || "Movimiento"} · ${dayjs.utc(a.movimiento.fecha).format("DD/MM/YYYY")}`}
														</Link>
													) : (
														`${a.movimiento.tipo || "Movimiento"} · ${dayjs.utc(a.movimiento.fecha).format("DD/MM/YYYY")}`
													)
												) : apagado ? (
													"No cuenta como actividad"
												) : (
													"—"
												)}
											</TableCell>
										</TableRow>,
										...(n > 1 && abierto
											? fila.actos.map((x) => (
													<TableRow key={`${fila.key}-${x._id}`} sx={{ bgcolor: alpha(theme.palette.text.primary, 0.015) }}>
														<TableCell
															sx={{
																fontSize: "0.7rem",
																whiteSpace: "nowrap",
																fontVariantNumeric: "tabular-nums",
																color: "text.secondary",
																pl: 3,
															}}
														>
															{dayjs(x.fecha).format("DD/MM/YYYY HH:mm:ss")}
														</TableCell>
														<TableCell colSpan={verPresento ? 4 : 3} sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
															{x.titulo || TIPO_ACTO_LABEL[x.tipo]}
														</TableCell>
													</TableRow>
											  ))
											: []),
									];
								})}
							</TableBody>
						</Table>
						{totalPages > 1 && (
							<Stack alignItems="center" sx={{ my: 2 }}>
								<Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
							</Stack>
						)}
					</TableContainer>
				)}
			</Box>
			<Box sx={{ px: 1.5, py: 1, borderTop: `1px solid ${borde}` }}>
				<Typography sx={{ fontSize: "0.66rem", color: "text.secondary" }}>
					Fuente: bandeja de escritos, cédulas enviadas y DEOX enviados del portal PJN. Cuenta el último escrito que ya figura como
					movimiento en el expediente; lo presentado y todavía sin movimiento no corre el contador.
					{data?.truncado ? " Se muestran los 1.000 más recientes." : ""}
				</Typography>
			</Box>
		</Box>
	);
};

export default ActosPropiosPanel;
