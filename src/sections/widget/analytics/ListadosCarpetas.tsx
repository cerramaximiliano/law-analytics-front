import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Chip,
	IconButton,
	Menu,
	MenuItem,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DocumentDownload, Trash, Refresh2 } from "iconsax-react";
import { Link as RouterLink } from "react-router-dom";
import MainCard from "components/MainCard";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import useEffectiveUser from "hooks/useEffectiveUser";
import useEtiquetasExpediente, { nombresDeEtiquetas } from "hooks/useEtiquetasExpediente";
import { EtiquetasCell } from "sections/apps/folders/EtiquetasExpediente";
import { buildCsv, buildPdf } from "sections/apps/folders/ExportFoldersDialog";
import { BRAND_BLUE } from "themes/dashboardTokens";

// ==============================|| LISTADOS DE CARPETAS ||============================== //
// El usuario elige el alcance (etiquetas, responsables, fuero…), con una o más opciones, y el
// sistema devuelve el listado: en pantalla, en PDF o en planilla. Cada listado generado queda
// guardado para volver a sacarlo. En cuentas sin equipo no aparece el criterio de responsables.

type Archivadas = "no" | "incluir" | "solo";

interface Filtros {
	etiquetas: string[];
	responsables: string[];
	fueros: string[];
	jurisdicciones: string[];
	juzgados: string[];
	estados: string[];
	archivadas: Archivadas;
}

interface ListadoGuardado {
	_id: string;
	nombre: string;
	filtros: Partial<Filtros>;
	total: number;
	createdAt: string;
}

const API = import.meta.env.VITE_BASE_URL;
const FIELDS =
	"_id,folderName,status,materia,folderJuris,folderFuero,judFolder,lastMovementDate,responsables,estados,archived,createdBy,initialDateFolder";
const VACIO: Filtros = { etiquetas: [], responsables: [], fueros: [], jurisdicciones: [], juzgados: [], estados: [], archivadas: "no" };
const SIN = "__none";

const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const juzgadoDe = (f: any) => texto(f.judFolder?.courtNumber) || texto(f.judFolder?.juzgado);
const expedienteDe = (f: any) => texto(f.judFolder?.numberJudFolder) || texto(f.judFolder?.cuij);
const jurisdiccionDe = (f: any) => texto(f.folderJuris?.label);
const fecha = (v: unknown) => {
	const d = v ? new Date(String(v)) : null;
	if (!d || Number.isNaN(d.getTime())) return "";
	const p = (n: number) => String(n).padStart(2, "0");
	return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
};

const aviso = (message: string, color: "success" | "error" = "error") =>
	dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

interface Opcion {
	value: string;
	label: string;
}

const Criterio = ({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: Opcion[];
	value: string[];
	onChange: (v: string[]) => void;
}) => (
	<Autocomplete
		multiple
		size="small"
		options={options}
		value={options.filter((o) => value.includes(o.value))}
		onChange={(_e, sel) => onChange(sel.map((o) => o.value))}
		getOptionLabel={(o) => o.label}
		isOptionEqualToValue={(a, b) => a.value === b.value}
		disableCloseOnSelect
		limitTags={3}
		noOptionsText="Sin opciones"
		renderTags={(sel, getTagProps) =>
			sel.map((o, i) => (
				<Chip {...getTagProps({ index: i })} key={o.value} size="small" label={o.label} sx={{ height: 22, fontSize: "0.72rem" }} />
			))
		}
		renderInput={(params) => <TextField {...params} label={label} placeholder={value.length ? "" : "Todos"} />}
		sx={{ minWidth: 220, flex: "1 1 220px" }}
	/>
);

const ListadosCarpetas = ({ enabled }: { enabled: boolean }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { activeTeam, getRequestHeaders } = useTeam();
	const { effectiveUserId, isReady } = useEffectiveUser();
	const { etiquetas } = useEtiquetasExpediente();

	const [activas, setActivas] = useState<any[] | null>(null);
	const [archivadas, setArchivadas] = useState<any[] | null>(null);
	const [cargando, setCargando] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [filtros, setFiltros] = useState<Filtros>(VACIO);
	const [resultado, setResultado] = useState<{ filas: any[]; titulo: string } | null>(null);
	const [guardados, setGuardados] = useState<ListadoGuardado[]>([]);
	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState(10);
	const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);

	const teamId = activeTeam?._id || null;
	const headers = useMemo(() => getRequestHeaders(), [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

	// Integrantes (solo en equipo): para el criterio de responsables y para mostrar sus nombres.
	const integrantes = useMemo<Opcion[]>(() => {
		if (!activeTeam) return [];
		// El titular y cada integrante pueden venir como id o ya con sus datos (firstName, email…).
		const persona = (ref: any, extra?: any): Opcion | null => {
			const datos = ref && typeof ref === "object" ? ref : extra || {};
			const id = ref && typeof ref === "object" ? ref._id : ref;
			if (!id) return null;
			const nombre = [datos.firstName, datos.lastName].filter(Boolean).join(" ").trim() || datos.email || "";
			return { value: String(id), label: nombre || "Integrante" };
		};
		const lista: Opcion[] = [];
		const titular = persona(activeTeam.owner, activeTeam.ownerInfo);
		if (titular) lista.push(titular);
		for (const m of activeTeam.members || []) {
			const p = m.status === "active" ? persona(m.userId, m) : null;
			if (p && !lista.some((x) => x.value === p.value)) lista.push(p);
		}
		return lista;
	}, [activeTeam]);
	const nombreDe = useMemo(() => new Map(integrantes.map((i) => [i.value, i.label])), [integrantes]);

	const cargarActivas = useCallback(async () => {
		const url = teamId ? `${API}/api/folders/group/${teamId}` : `${API}/api/folders/user/${effectiveUserId}`;
		const res = await axios.get(url, { params: { fields: FIELDS }, headers });
		return (res.data?.folders || []).filter((f: any) => f.archived !== true);
	}, [teamId, effectiveUserId, headers]);

	const cargarArchivadas = useCallback(async () => {
		const res = await axios.get(`${API}/api/folders/user/${effectiveUserId}`, {
			params: { archived: true, fields: FIELDS, page: 1, limit: 2000, sort: "lastMovement" },
			headers,
		});
		return res.data?.folders || [];
	}, [effectiveUserId, headers]);

	// Carpetas activas (para armar las opciones) y listados guardados, al entrar.
	useEffect(() => {
		if (!enabled || !isReady || !effectiveUserId) return;
		let cancelled = false;
		setCargando(true);
		setActivas(null);
		setArchivadas(null);
		setResultado(null);
		Promise.all([cargarActivas(), axios.get(`${API}/api/seguimiento/listados`, { headers }).catch(() => null)])
			.then(([folders, listados]) => {
				if (cancelled) return;
				setActivas(folders);
				setGuardados(listados?.data?.listados || []);
				setError(null);
			})
			.catch(() => !cancelled && setError("No se pudieron cargar las carpetas."))
			.finally(() => !cancelled && setCargando(false));
		return () => {
			cancelled = true;
		};
	}, [enabled, isReady, effectiveUserId, teamId, cargarActivas, headers]);

	const opciones = useMemo(() => {
		const unicos = (fn: (f: any) => string) =>
			[...new Set((activas || []).map(fn).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")).map((v) => ({ value: v, label: v }));
		return {
			etiquetas: [...etiquetas.map((e) => ({ value: String(e._id), label: e.nombre })), { value: SIN, label: "Sin etiquetas" }],
			responsables: [...integrantes, { value: SIN, label: "Sin responsable" }],
			fueros: unicos((f) => texto(f.folderFuero)),
			jurisdicciones: unicos(jurisdiccionDe),
			juzgados: unicos(juzgadoDe),
			estados: unicos((f) => texto(f.status)),
		};
	}, [activas, etiquetas, integrantes]);

	const etiquetaIds = useMemo(() => new Set(etiquetas.map((e) => String(e._id))), [etiquetas]);

	const cumple = useCallback(
		(f: any, fl: Filtros) => {
			const enLista = (sel: string[], valores: string[]) =>
				!sel.length || sel.some((s) => (s === SIN ? valores.length === 0 : valores.includes(s)));
			return (
				enLista(
					fl.etiquetas,
					(f.estados || []).map(String).filter((id: string) => etiquetaIds.has(id)),
				) &&
				enLista(fl.responsables, (f.responsables || []).map(String)) &&
				enLista(fl.fueros, [texto(f.folderFuero)].filter(Boolean)) &&
				enLista(fl.jurisdicciones, [jurisdiccionDe(f)].filter(Boolean)) &&
				enLista(fl.juzgados, [juzgadoDe(f)].filter(Boolean)) &&
				enLista(fl.estados, [texto(f.status)].filter(Boolean))
			);
		},
		[etiquetaIds],
	);

	const hayCriterio = (fl: Filtros) =>
		fl.etiquetas.length + fl.responsables.length + fl.fueros.length + fl.jurisdicciones.length + fl.juzgados.length + fl.estados.length >
			0 || fl.archivadas !== "no";

	// «Etiqueta: Embargo · Fuero: Civil» — sirve de título y de nombre del listado guardado.
	const tituloDe = useCallback(
		(fl: Filtros) => {
			const nombres = (sel: string[], ops: Opcion[]) => sel.map((v) => ops.find((o) => o.value === v)?.label || v).join(", ");
			const partes = [
				fl.etiquetas.length && `Etiqueta: ${nombres(fl.etiquetas, opciones.etiquetas)}`,
				fl.responsables.length && `Responsable: ${nombres(fl.responsables, opciones.responsables)}`,
				fl.fueros.length && `Fuero: ${fl.fueros.join(", ")}`,
				fl.jurisdicciones.length && `Jurisdicción: ${fl.jurisdicciones.join(", ")}`,
				fl.juzgados.length && `Juzgado: ${fl.juzgados.join(", ")}`,
				fl.estados.length && `Estado: ${fl.estados.join(", ")}`,
				fl.archivadas === "solo" && "Archivadas",
				fl.archivadas === "incluir" && "Con archivadas",
			].filter(Boolean);
			return partes.join(" · ").slice(0, 80);
		},
		[opciones],
	);

	const generar = async (fl: Filtros, guardar: boolean) => {
		if (!hayCriterio(fl) || !activas) return;
		setCargando(true);
		try {
			let arch = archivadas;
			if (fl.archivadas !== "no" && !arch) {
				arch = await cargarArchivadas();
				setArchivadas(arch);
			}
			const universo = fl.archivadas === "solo" ? arch || [] : fl.archivadas === "incluir" ? [...activas, ...(arch || [])] : activas;
			const filas = universo.filter((f) => cumple(f, fl)).sort((a, b) => texto(a.folderName).localeCompare(texto(b.folderName), "es"));
			const titulo = tituloDe(fl);
			setResultado({ filas, titulo });
			setPage(0);
			if (guardar) {
				// Cada listado generado queda guardado; si ya existe uno igual, se actualiza su total.
				const igual = guardados.find((g) => g.nombre === titulo);
				if (igual) await axios.delete(`${API}/api/seguimiento/listados/${igual._id}`, { headers }).catch(() => null);
				const res = await axios.post(`${API}/api/seguimiento/listados`, { nombre: titulo, filtros: fl, total: filas.length }, { headers });
				const nuevo = res.data?.listado;
				if (nuevo) setGuardados((g) => [nuevo, ...g.filter((x) => x._id !== igual?._id)]);
			}
		} catch {
			aviso("No se pudo generar el listado.");
		} finally {
			setCargando(false);
		}
	};

	const abrirGuardado = (g: ListadoGuardado) => {
		const fl: Filtros = { ...VACIO, ...g.filtros, archivadas: (g.filtros.archivadas as Archivadas) || "no" };
		setFiltros(fl);
		generar(fl, false);
	};

	const borrarGuardado = async (g: ListadoGuardado) => {
		try {
			await axios.delete(`${API}/api/seguimiento/listados/${g._id}`, { headers });
			setGuardados((lista) => lista.filter((x) => x._id !== g._id));
		} catch (e: any) {
			aviso(e?.response?.status === 404 ? "Solo puede borrarlo quien lo guardó o un administrador." : "No se pudo eliminar el listado.");
		}
	};

	const columnas = useMemo(
		() => [
			{ id: "folderName", label: "Carátula" },
			{ id: "expediente", label: "Expediente" },
			{ id: "fuero", label: "Fuero" },
			{ id: "juzgado", label: "Juzgado" },
			...(activeTeam ? [{ id: "responsables", label: "Responsable" }] : []),
			{ id: "etiquetas", label: "Etiquetas" },
			{ id: "estado", label: "Estado" },
			{ id: "ultimo", label: "Último mov." },
		],
		[activeTeam],
	);
	const valores = (f: any): Record<string, string> => ({
		folderName: texto(f.folderName),
		expediente: expedienteDe(f),
		fuero: texto(f.folderFuero),
		juzgado: juzgadoDe(f),
		responsables: (f.responsables || [])
			.map((id: string) => nombreDe.get(String(id)) || "")
			.filter(Boolean)
			.join(", "),
		etiquetas: nombresDeEtiquetas(f.estados, etiquetas).join(", "),
		estado: `${texto(f.status)}${f.archived ? " (archivada)" : ""}`,
		ultimo: fecha(f.lastMovementDate),
	});

	const exportar = async (formato: "pdf" | "csv") => {
		setExportAnchor(null);
		if (!resultado) return;
		try {
			const rows = resultado.filas.map(valores);
			const hoy = new Date();
			const p = (n: number) => String(n).padStart(2, "0");
			const stamp = `${hoy.getFullYear()}-${p(hoy.getMonth() + 1)}-${p(hoy.getDate())}`;
			const blob =
				formato === "csv"
					? new Blob([buildCsv(columnas, rows)], { type: "text/csv;charset=utf-8" })
					: await buildPdf(
							columnas,
							rows,
							`${resultado.titulo} · ${rows.length} carpetas · ${p(hoy.getDate())}/${p(hoy.getMonth() + 1)}/${hoy.getFullYear()}`,
							{
								title: "Listado de carpetas",
								weights: {
									folderName: 3.4,
									expediente: 1.3,
									fuero: 1.1,
									juzgado: 1.8,
									responsables: 1.6,
									etiquetas: 1.8,
									estado: 1.1,
									ultimo: 1,
								},
							},
					  );
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `listado-carpetas-${stamp}.${formato}`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch {
			aviso("No se pudo generar el archivo.");
		}
	};

	const set = (k: keyof Filtros) => (v: string[]) => setFiltros((f) => ({ ...f, [k]: v }));
	const filasPagina = resultado ? resultado.filas.slice(page * pageSize, page * pageSize + pageSize) : [];
	const borde = alpha(BRAND_BLUE, isDark ? 0.18 : 0.1);

	return (
		<MainCard
			title="Listados de carpetas"
			data-testid="listados-carpetas"
			secondary={
				<Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
					Elegí el alcance con una o más opciones y generá el listado en pantalla, PDF o planilla.
				</Typography>
			}
		>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* Alcance */}
			<Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
				{etiquetas.length > 0 && (
					<Criterio label="Etiquetas" options={opciones.etiquetas} value={filtros.etiquetas} onChange={set("etiquetas")} />
				)}
				{activeTeam && (
					<Criterio label="Responsables" options={opciones.responsables} value={filtros.responsables} onChange={set("responsables")} />
				)}
				<Criterio label="Fuero" options={opciones.fueros} value={filtros.fueros} onChange={set("fueros")} />
				<Criterio label="Jurisdicción" options={opciones.jurisdicciones} value={filtros.jurisdicciones} onChange={set("jurisdicciones")} />
				<Criterio label="Juzgado" options={opciones.juzgados} value={filtros.juzgados} onChange={set("juzgados")} />
				<Criterio label="Estado" options={opciones.estados} value={filtros.estados} onChange={set("estados")} />
				<TextField
					select
					size="small"
					label="Archivadas"
					value={filtros.archivadas}
					onChange={(e) => setFiltros((f) => ({ ...f, archivadas: e.target.value as Archivadas }))}
					sx={{ minWidth: 170 }}
				>
					<MenuItem value="no">No incluir</MenuItem>
					<MenuItem value="incluir">Incluir</MenuItem>
					<MenuItem value="solo">Solo archivadas</MenuItem>
				</TextField>
			</Stack>
			<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
				<Button
					variant="contained"
					size="small"
					onClick={() => generar(filtros, true)}
					disabled={!enabled || cargando || !activas || !hayCriterio(filtros)}
					data-testid="listados-generar"
				>
					{cargando ? "Generando…" : "Generar listado"}
				</Button>
				<Button size="small" color="secondary" onClick={() => setFiltros(VACIO)} disabled={!hayCriterio(filtros)}>
					Limpiar
				</Button>
				{!hayCriterio(filtros) && (
					<Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>Elegí al menos una opción para generar el listado.</Typography>
				)}
			</Stack>

			{/* Listados guardados */}
			{guardados.length > 0 && (
				<Box sx={{ mb: 2, p: 1.25, border: `1px solid ${borde}`, borderRadius: 1.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025) }}>
					<Typography
						sx={{
							fontSize: "0.66rem",
							fontWeight: 600,
							color: "text.secondary",
							letterSpacing: "0.06em",
							textTransform: "uppercase",
							mb: 0.75,
						}}
					>
						Listados guardados
					</Typography>
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
						{guardados.map((g) => (
							<Chip
								key={g._id}
								size="small"
								clickable
								data-testid="listado-guardado"
								icon={<Refresh2 size={13} />}
								label={`${g.nombre} (${g.total})`}
								onClick={() => abrirGuardado(g)}
								onDelete={() => borrarGuardado(g)}
								deleteIcon={
									<Tooltip title="Eliminar listado guardado">
										<Trash size={13} />
									</Tooltip>
								}
								sx={{ maxWidth: 420, height: 26, fontSize: "0.74rem", bgcolor: "background.paper", border: `1px solid ${borde}` }}
							/>
						))}
					</Stack>
				</Box>
			)}

			{/* Resultado */}
			{cargando && !resultado && <Skeleton variant="rounded" height={120} />}
			{resultado && (
				<Box data-testid="listados-resultado">
					<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
						<Typography sx={{ fontSize: "0.9rem", fontWeight: 600, mr: "auto" }}>
							{resultado.titulo} · {resultado.filas.length} {resultado.filas.length === 1 ? "carpeta" : "carpetas"}
						</Typography>
						<Tooltip title="Imprimir o exportar">
							<span>
								<IconButton
									size="small"
									onClick={(e) => setExportAnchor(e.currentTarget)}
									disabled={!resultado.filas.length}
									aria-label="Imprimir o exportar"
								>
									<DocumentDownload size={18} />
								</IconButton>
							</span>
						</Tooltip>
						<Menu anchorEl={exportAnchor} open={!!exportAnchor} onClose={() => setExportAnchor(null)}>
							<MenuItem onClick={() => exportar("pdf")}>PDF, para imprimir</MenuItem>
							<MenuItem onClick={() => exportar("csv")}>Planilla (CSV)</MenuItem>
						</Menu>
					</Stack>
					{resultado.filas.length === 0 ? (
						<Typography sx={{ fontSize: "0.84rem", color: "text.secondary", py: 3, textAlign: "center" }}>
							Ninguna carpeta cumple con el alcance elegido.
						</Typography>
					) : (
						<>
							<TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											{columnas.map((c) => (
												<TableCell key={c.id} sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
													{c.label}
												</TableCell>
											))}
										</TableRow>
									</TableHead>
									<TableBody>
										{filasPagina.map((f) => {
											const v = valores(f);
											return (
												<TableRow key={f._id} hover>
													{columnas.map((c) => (
														<TableCell key={c.id} sx={{ fontSize: "0.8rem", py: 0.75 }}>
															{c.id === "folderName" ? (
																<Typography
																	component={RouterLink}
																	to={`/apps/folders/details/${f._id}`}
																	sx={{
																		fontSize: "0.8rem",
																		fontWeight: 600,
																		color: "text.primary",
																		textDecoration: "none",
																		"&:hover": { color: BRAND_BLUE },
																	}}
																>
																	{v.folderName || "—"}
																</Typography>
															) : c.id === "etiquetas" ? (
																<EtiquetasCell ids={f.estados} />
															) : (
																v[c.id] || "—"
															)}
														</TableCell>
													))}
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</TableContainer>
							<TablePagination
								component="div"
								rowsPerPageOptions={[10, 25, 50, 100]}
								count={resultado.filas.length}
								rowsPerPage={pageSize}
								page={page}
								onPageChange={(_e, p) => setPage(p)}
								onRowsPerPageChange={(e) => {
									setPageSize(parseInt(e.target.value, 10));
									setPage(0);
								}}
								labelRowsPerPage="Filas por página"
								labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
							/>
						</>
					)}
				</Box>
			)}
		</MainCard>
	);
};

export default ListadosCarpetas;
