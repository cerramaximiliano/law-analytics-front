import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	InputAdornment,
	Menu,
	MenuItem,
	Skeleton,
	Stack,
	TablePagination,
	TextField,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
	ArrowDown,
	Calendar1,
	ArrowUp,
	CloseCircle,
	DocumentDownload,
	Edit2,
	Judge,
	DocumentText,
	More,
	NoteText,
	Notification,
	SearchNormal1,
	Setting2,
	TickCircle,
	Trash,
} from "iconsax-react";
import { dispatch } from "store";
import { addNote, deleteNote, updateNote } from "store/reducers/notes";
import { openSnackbar } from "store/reducers/snackbar";
import { useSelector } from "react-redux";
import { useTeam } from "contexts/TeamContext";
import PaginationWithJump from "components/shared/PaginationWithJump";
import PDFViewer from "components/shared/PDFViewer";
import PjnAccessAlert from "components/shared/PjnAccessAlert";
import { PjnAccess } from "types/movements";
import { buildCsv, buildPdf } from "sections/apps/folders/ExportFoldersDialog";
import { FolderEtiquetas } from "sections/apps/folders/EtiquetasExpediente";
import EtiquetasYTiposDialog from "sections/apps/folders/EtiquetasYTiposDialog";
import { BRAND_BLUE } from "themes/dashboardTokens";

// ==============================|| SEGUIMIENTO DE LA CARPETA ||============================== //
// Una sola lista, por fecha y hora, con lo que anota el estudio, los movimientos del expediente
// y las cédulas. Los tipos de anotación (nombre, letra y color) los define cada estudio: acá no
// hay ninguno fijo.

type Fuente = "anotacion" | "movimiento" | "cedula" | "evento";

interface Tipo {
	_id?: string;
	nombre: string;
	letra: string;
	color: string;
}

interface Item {
	id: string;
	fuente: Fuente;
	fecha: string;
	texto: string;
	detalle?: string;
	tipoId?: string | null;
	autor?: string;
	noteId?: string;
	origen?: string;
	vencimiento?: string | null;
	/** Documento del movimiento o de la cédula, si lo hay. */
	link?: string;
	hasPdf?: boolean;
	sourceId?: string;
	descripcion?: string;
	/** Eventos: fin y si es de todo el día. */
	fin?: string | null;
	todoElDia?: boolean;
}

interface Respuesta {
	items: Item[];
	pagination: { total: number; page: number; limit: number; pages: number };
	conteo: Record<Fuente, number>;
	avisos: string[];
	/** Plan sin movimientos judiciales: el mismo dato de acceso que usa Actividad. */
	accesos?: PjnAccess[];
	tipos: Tipo[];
	/** Etiquetas que tiene puestas la carpeta (ids del catálogo del estudio). */
	folderEstados?: string[];
	canConfig: boolean;
	canAnotar: boolean;
	canEditar: boolean;
	canEliminar: boolean;
}

interface SeguimientoTabProps {
	folderId: string;
	folderName?: string;
}

// Mismo paginado que Actividad → Movimientos: filas por página a elección, 10 por defecto.
const PAGE_SIZES = [5, 10, 25, 50];
const PAGE_SIZE_KEY = "la.seguimiento.pageSize.v1";
const pageSizeInicial = () => {
	try {
		const n = Number(localStorage.getItem(PAGE_SIZE_KEY));
		return PAGE_SIZES.includes(n) ? n : 10;
	} catch {
		return 10;
	}
};

const TEXTO_MAX = 2000;
const LOADER_MIN_MS = 300;
const API = import.meta.env.VITE_BASE_URL;

const FUENTE_LABEL: Record<Fuente, string> = { anotacion: "Anotaciones", movimiento: "Movimientos", cedula: "Cédulas", evento: "Eventos" };
const FUENTE_SINGULAR: Record<Fuente, string> = { anotacion: "Anotación", movimiento: "Movimiento", cedula: "Cédula", evento: "Evento" };
const ORIGEN_LABEL: Record<string, string> = {
	pjn: "PJN",
	mev: "MEV",
	scba: "SCBA",
	eje: "EJE",
	pjsalta: "PJ Salta",
	pjcatamarca: "PJ Catamarca",
	pjmendoza: "PJ Mendoza",
	manual: "Cargado a mano",
};

const pad = (n: number) => String(n).padStart(2, "0");
/** Date → valor de <input type="datetime-local"> en hora local. */
const toLocalInput = (d: Date) =>
	`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
// Los movimientos de los portales (y las anotaciones viejas) traen solo el día, guardado como
// medianoche UTC: se muestra ese día, sin hora, en vez de correrlo a la tarde anterior.
const fechaHora = (iso: string) => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return { fecha: "—", hora: "" };
	if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
		return { fecha: `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`, hora: "" };
	}
	return { fecha: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, hora: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

// Un color elegido por el estudio puede no leerse sobre el fondo del tema (negro en modo
// oscuro, un amarillo claro en modo claro). El texto usa el color solo si contrasta.
const luminancia = (hex: string) => {
	const n = parseInt(hex.slice(1), 16);
	const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const colorDeTexto = (hex: string, isDark: boolean, fallback: string) => {
	const l = luminancia(hex);
	return (isDark && l < 0.3) || (!isDark && l > 0.75) ? fallback : hex;
};
const textoSobre = (hex: string) => (luminancia(hex) > 0.6 ? "#1b2533" : "#ffffff");

const aviso = (message: string, color: "success" | "error" = "error") =>
	dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

// ── Botón de tipo (la letra, con el color del estudio) ─────────────────────────

const TipoBoton = ({
	tipo,
	activo,
	onClick,
	disabled,
	size = 24,
}: {
	tipo: Tipo;
	activo: boolean;
	onClick?: () => void;
	disabled?: boolean;
	size?: number;
}) => (
	<Tooltip title={onClick ? `${tipo.nombre}${activo ? " (clic para quitar)" : ""}` : tipo.nombre}>
		<Box
			component={onClick ? "button" : "span"}
			type={onClick ? "button" : undefined}
			onClick={onClick}
			disabled={onClick ? disabled : undefined}
			aria-label={tipo.nombre}
			aria-pressed={onClick ? activo : undefined}
			data-testid="seguimiento-tipo"
			sx={{
				width: size,
				height: size,
				minWidth: size,
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				borderRadius: 0.75,
				fontSize: size <= 20 ? "0.66rem" : "0.72rem",
				fontWeight: 700,
				lineHeight: 1,
				fontFamily: "inherit",
				p: 0,
				cursor: onClick ? "pointer" : "default",
				border: `1.5px solid ${tipo.color}`,
				bgcolor: activo ? tipo.color : "transparent",
				color: activo ? textoSobre(tipo.color) : "text.secondary",
				opacity: disabled ? 0.5 : 1,
				transition: "background-color .12s",
				"&:hover": onClick ? { bgcolor: activo ? tipo.color : alpha(tipo.color, 0.18) } : undefined,
			}}
		>
			{tipo.letra}
		</Box>
	</Tooltip>
);

// ── Solapa ─────────────────────────────────────────────────────────────────────

const SeguimientoTab: React.FC<SeguimientoTabProps> = ({ folderId, folderName }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { getRequestHeaders } = useTeam();
	const userId = useSelector((state: any) => state.auth?.user?._id);

	const [data, setData] = useState<Respuesta | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [showLoader, setShowLoader] = useState(true);
	const [page, setPage] = useState(1);
	const [order, setOrder] = useState<"desc" | "asc">("desc");
	const [fuentes, setFuentes] = useState<Fuente[]>([]);
	const [tipoFiltro, setTipoFiltro] = useState<string>("");
	const [search, setSearch] = useState("");
	const [searchDebounced, setSearchDebounced] = useState("");
	const [reload, setReload] = useState(0);

	// Alta
	const [texto, setTexto] = useState("");
	const [fecha, setFecha] = useState(() => toLocalInput(new Date()));
	const fechaTocada = useRef(false);
	const [tipoNuevo, setTipoNuevo] = useState<string | null>(null);
	const [guardando, setGuardando] = useState(false);

	// Edición y baja
	const [editId, setEditId] = useState<string | null>(null);
	const [editTexto, setEditTexto] = useState("");
	const [editFecha, setEditFecha] = useState("");
	const [ocupado, setOcupado] = useState<string | null>(null);
	const [borrar, setBorrar] = useState<Item | null>(null);
	const [pageSize, setPageSize] = useState<number>(pageSizeInicial);
	// Documento abierto y menús de la fila (acciones de la anotación y tipos).
	const [accionesMenu, setAccionesMenu] = useState<{ anchor: HTMLElement; item: Item } | null>(null);
	const [pdf, setPdf] = useState<{ url: string; title: string } | null>(null);
	const [abriendoPdf, setAbriendoPdf] = useState<string | null>(null);
	const [tipoMenu, setTipoMenu] = useState<{ anchor: HTMLElement; item: Item } | null>(null);

	const [configOpen, setConfigOpen] = useState(false);
	const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
	const [exportando, setExportando] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setPage(1);
	}, [order, fuentes, tipoFiltro, searchDebounced, folderId, pageSize]);

	const params = useMemo(
		() => ({
			order,
			...(fuentes.length ? { fuentes: fuentes.join(",") } : {}),
			...(tipoFiltro ? { tipo: tipoFiltro } : {}),
			...(searchDebounced ? { search: searchDebounced } : {}),
		}),
		[order, fuentes, tipoFiltro, searchDebounced],
	);

	useEffect(() => {
		let cancelled = false;
		const desde = Date.now();
		setLoading(true);
		setShowLoader(true);
		axios
			.get(`${API}/api/folders/${folderId}/seguimiento`, { params: { ...params, page, limit: pageSize } })
			.then((res) => {
				if (cancelled) return;
				setData(res.data);
				setError(null);
			})
			.catch((e) => {
				if (cancelled) return;
				setError(e?.response?.data?.message || "No se pudo cargar el seguimiento.");
			})
			.finally(() => {
				if (cancelled) return;
				setLoading(false);
				// El esqueleto se mantiene un mínimo: una recarga instantánea se ve como un parpadeo.
				setTimeout(() => !cancelled && setShowLoader(false), Math.max(0, LOADER_MIN_MS - (Date.now() - desde)));
			});
		return () => {
			cancelled = true;
		};
	}, [folderId, page, pageSize, params, reload]);

	const tipos = useMemo(() => data?.tipos || [], [data?.tipos]);
	const tipoPorId = useMemo(() => new Map(tipos.map((t) => [t._id as string, t])), [tipos]);
	const refrescar = useCallback(() => setReload((n) => n + 1), []);

	const anotar = async () => {
		const t = texto.trim();
		if (!t || guardando) return;
		setGuardando(true);
		const result = await dispatch(
			addNote(
				{
					title: t,
					content: t,
					userId,
					folderId,
					kind: "anotacion",
					...(tipoNuevo ? { tipoId: tipoNuevo } : {}),
					...(fechaTocada.current && fecha ? { occurredAt: new Date(fecha).toISOString() } : {}),
				},
				{ headers: getRequestHeaders() },
			),
		);
		setGuardando(false);
		if (!result.success) return aviso(result.error || "No se pudo guardar la anotación.");
		setTexto("");
		setFecha(toLocalInput(new Date()));
		fechaTocada.current = false;
		if (page !== 1) setPage(1);
		else refrescar();
	};

	const modificar = async (item: Item, patch: Record<string, unknown>) => {
		if (!item.noteId) return false;
		setOcupado(item.id);
		const result: any = await dispatch(updateNote(item.noteId, patch as any));
		setOcupado(null);
		if (result?.success === false) {
			aviso(result.error || "No se pudo modificar la anotación.");
			return false;
		}
		refrescar();
		return true;
	};

	const cambiarTipo = (item: Item, tipoId: string) => modificar(item, { tipoId: item.tipoId === tipoId ? null : tipoId });

	const empezarEdicion = (item: Item) => {
		setEditId(item.id);
		setEditTexto(item.texto);
		setEditFecha(toLocalInput(new Date(item.fecha)));
	};

	const guardarEdicion = async (item: Item) => {
		const t = editTexto.trim();
		if (!t) return;
		const ok = await modificar(item, { content: t, ...(editFecha ? { occurredAt: new Date(editFecha).toISOString() } : {}) });
		if (ok) setEditId(null);
	};

	const confirmarBorrado = async () => {
		if (!borrar?.noteId) return;
		setOcupado(borrar.id);
		const result: any = await dispatch(deleteNote(borrar.noteId));
		setOcupado(null);
		setBorrar(null);
		if (result?.success === false) return aviso(result.error || "No se pudo eliminar la anotación.");
		refrescar();
	};

	const exportar = async (formato: "pdf" | "csv") => {
		setExportAnchor(null);
		setExportando(true);
		try {
			// Todo lo que cumple los filtros actuales, no solo la página visible.
			const filas: Item[] = [];
			for (let p = 1; p <= 20; p++) {
				const res = await axios.get(`${API}/api/folders/${folderId}/seguimiento`, { params: { ...params, page: p, limit: 500 } });
				filas.push(...(res.data.items || []));
				if (p >= (res.data.pagination?.pages || 1)) break;
			}
			const columns = [
				{ id: "fecha", label: "Fecha" },
				{ id: "hora", label: "Hora" },
				{ id: "tipo", label: "Tipo" },
				{ id: "descripcion", label: "Descripción" },
				{ id: "autor", label: "Anotó" },
			];
			const rows = filas.map((i) => {
				const fh = fechaHora(i.fecha);
				return {
					fecha: fh.fecha,
					hora: fh.hora,
					tipo: i.fuente === "anotacion" ? tipoPorId.get(i.tipoId || "")?.nombre || "Anotación" : FUENTE_SINGULAR[i.fuente],
					descripcion: [i.texto, i.detalle].filter(Boolean).join(" — "),
					autor: i.autor || (i.origen ? ORIGEN_LABEL[i.origen] || i.origen : ""),
				};
			});
			const hoy = new Date();
			const stamp = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
			const blob =
				formato === "csv"
					? new Blob([buildCsv(columns, rows)], { type: "text/csv;charset=utf-8" })
					: await buildPdf(columns, rows, `${folderName || "Carpeta"} · ${rows.length} registros · ${fechaHora(hoy.toISOString()).fecha}`, {
							title: "Seguimiento",
							weights: { fecha: 1, hora: 0.6, tipo: 1.2, descripcion: 6, autor: 1.6 },
					  });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `seguimiento-${stamp}.${formato}`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch {
			aviso("No se pudo generar el archivo.");
		} finally {
			setExportando(false);
		}
	};

	const tieneDocumento = (item: Item) => Boolean(item.link || item.hasPdf);
	// Abre el PDF del movimiento o de la cédula en el mismo visor que Actividad.
	const verDocumento = async (item: Item) => {
		if (item.fuente === "cedula" && item.hasPdf && item.sourceId && !item.link) {
			setAbriendoPdf(item.id);
			try {
				const res = await axios.get(`${API}/api/folders/${folderId}/cedulas/${encodeURIComponent(item.sourceId)}/pdf-url`);
				const url = res.data?.pdfUrl || res.data?.url;
				if (!url) throw new Error("sin url");
				setPdf({ url, title: item.texto });
			} catch {
				aviso("No se pudo abrir el documento de la cédula.");
			} finally {
				setAbriendoPdf(null);
			}
			return;
		}
		if (item.link) setPdf({ url: item.link, title: item.texto });
	};

	const toggleFuente = (f: Fuente) => setFuentes((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

	const panelSx = {
		p: 1.5,
		mb: 2,
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
		borderRadius: 1.5,
	};
	const chipSx = (activo: boolean) => ({
		height: 26,
		fontSize: "0.75rem",
		fontWeight: activo ? 600 : 500,
		bgcolor: activo ? alpha(BRAND_BLUE, isDark ? 0.24 : 0.12) : "transparent",
		border: `1px solid ${alpha(BRAND_BLUE, activo ? 0.45 : 0.2)}`,
		color: activo ? BRAND_BLUE : "text.secondary",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.1) },
	});
	const iconBtnSx = {
		width: 32,
		height: 32,
		borderRadius: 1,
		color: BRAND_BLUE,
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) },
	};

	const hayFiltros = fuentes.length > 0 || !!tipoFiltro || !!searchDebounced;
	// Movimientos del portal que el plan no muestra (solo sin búsqueda ni filtro de tipo, que no los alcanzan).
	const bloqueados = !tipoFiltro && !searchDebounced ? data?.accesos?.[0]?.availableMovements || 0 : 0;
	const total = data?.pagination.total ?? 0;

	const renderItem = (item: Item) => {
		const fh = fechaHora(item.fecha);
		const tipo = item.fuente === "anotacion" ? tipoPorId.get(item.tipoId || "") : undefined;
		const esAnotacion = item.fuente === "anotacion";
		const color = tipo ? colorDeTexto(tipo.color, isDark, theme.palette.text.primary) : theme.palette.text.primary;
		const enEdicion = editId === item.id;
		const puedeTipar = Boolean(data?.canEditar) && tipos.length > 0;
		const Icono =
			item.fuente === "movimiento" ? Judge : item.fuente === "cedula" ? Notification : item.fuente === "evento" ? Calendar1 : NoteText;
		return (
			<Box
				key={item.id}
				data-testid="seguimiento-item"
				data-fuente={item.fuente}
				sx={{
					display: "flex",
					gap: 1.25,
					alignItems: "flex-start",
					px: 1.25,
					py: 0.9,
					borderBottom: `1px solid ${theme.palette.divider}`,
					borderLeft: `3px solid ${tipo ? tipo.color : esAnotacion ? alpha(BRAND_BLUE, 0.5) : "transparent"}`,
					bgcolor: esAnotacion ? "transparent" : alpha(theme.palette.text.primary, isDark ? 0.04 : 0.025),
					opacity: ocupado === item.id ? 0.55 : 1,
				}}
			>
				<Box sx={{ width: 86, flexShrink: 0, pt: 0.1 }}>
					<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>{fh.fecha}</Typography>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.3 }}>{fh.hora}</Typography>
				</Box>
				<Box sx={{ width: 24, flexShrink: 0, display: "flex", justifyContent: "center", pt: 0.1 }}>
					{esAnotacion && puedeTipar ? (
						// El tipo se cambia desde la misma letra: un clic abre los tipos del estudio.
						<Tooltip title={tipo ? `${tipo.nombre}. Clic para cambiar el tipo.` : "Sin tipo. Clic para elegir uno."}>
							<Box
								component="button"
								type="button"
								onClick={(e: React.MouseEvent<HTMLElement>) => setTipoMenu({ anchor: e.currentTarget, item })}
								disabled={ocupado === item.id}
								aria-label="Cambiar el tipo"
								data-testid="seguimiento-tipo-fila"
								sx={{
									width: 22,
									height: 22,
									p: 0,
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									borderRadius: 0.75,
									fontSize: "0.7rem",
									fontWeight: 700,
									fontFamily: "inherit",
									lineHeight: 1,
									cursor: "pointer",
									border: tipo ? `1.5px solid ${tipo.color}` : `1.5px dashed ${alpha(theme.palette.text.secondary, 0.55)}`,
									bgcolor: tipo ? tipo.color : "transparent",
									color: tipo ? textoSobre(tipo.color) : theme.palette.text.secondary,
									"&:hover": { boxShadow: `0 0 0 2px ${alpha(tipo ? tipo.color : BRAND_BLUE, 0.25)}` },
								}}
							>
								{tipo ? tipo.letra : "+"}
							</Box>
						</Tooltip>
					) : tipo ? (
						<TipoBoton tipo={tipo} activo size={22} />
					) : (
						<Tooltip title={FUENTE_SINGULAR[item.fuente]}>
							<Box sx={{ display: "inline-flex", color: "text.secondary" }}>
								<Icono size={16} variant={esAnotacion ? "Linear" : "Bulk"} />
							</Box>
						</Tooltip>
					)}
				</Box>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					{enEdicion ? (
						<Stack spacing={1}>
							<TextField
								value={editTexto}
								onChange={(e) => setEditTexto(e.target.value.slice(0, TEXTO_MAX))}
								size="small"
								fullWidth
								multiline
								maxRows={6}
								autoFocus
								inputProps={{ "aria-label": "Texto de la anotación" }}
							/>
							<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
								<TextField
									type="datetime-local"
									size="small"
									value={editFecha}
									onChange={(e) => setEditFecha(e.target.value)}
									inputProps={{ "aria-label": "Fecha y hora" }}
									sx={{ width: 210 }}
								/>
								<Button
									size="small"
									variant="contained"
									onClick={() => guardarEdicion(item)}
									disabled={!editTexto.trim() || ocupado === item.id}
								>
									Guardar
								</Button>
								<Button size="small" color="secondary" onClick={() => setEditId(null)}>
									Cancelar
								</Button>
							</Stack>
						</Stack>
					) : (
						<>
							<Typography
								data-testid="seguimiento-texto"
								sx={{ fontSize: "0.86rem", color, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.4 }}
							>
								{item.texto || "—"}
							</Typography>
							<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.2, lineHeight: 1.35 }}>
								{esAnotacion
									? [tipo?.nombre, item.autor].filter(Boolean).join(" · ") || "Anotación"
									: [FUENTE_SINGULAR[item.fuente], item.origen ? ORIGEN_LABEL[item.origen] || item.origen : null, item.detalle]
											.filter(Boolean)
											.join(" · ")}
								{item.vencimiento ? ` · Vence ${fechaHora(item.vencimiento).fecha}` : ""}
							</Typography>
						</>
					)}
				</Box>
				{/* Una sola acción por fila, siempre en el mismo lugar: documento (movimientos y cédulas) o menú (anotaciones). */}
				<Box sx={{ width: 30, flexShrink: 0, display: "flex", justifyContent: "center" }}>
					{!enEdicion && esAnotacion && (data?.canEditar || data?.canEliminar) && (
						<Tooltip title="Modificar o eliminar">
							<IconButton
								size="small"
								onClick={(e) => setAccionesMenu({ anchor: e.currentTarget, item })}
								disabled={ocupado === item.id}
								aria-label="Acciones de la anotación"
								data-testid="seguimiento-acciones"
							>
								<More size={16} />
							</IconButton>
						</Tooltip>
					)}
					{!esAnotacion && tieneDocumento(item) && (
						<Tooltip title="Ver documento">
							<span>
								<IconButton size="small" onClick={() => verDocumento(item)} disabled={abriendoPdf === item.id} aria-label="Ver documento">
									<DocumentText size={16} />
								</IconButton>
							</span>
						</Tooltip>
					)}
				</Box>
			</Box>
		);
	};

	return (
		<Box sx={{ p: { xs: 1, sm: 2 } }}>
			{/* Encabezado */}
			<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
				<Box sx={{ mr: "auto" }}>
					<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: BRAND_BLUE, letterSpacing: "0.08em", textTransform: "uppercase" }}>
						• Seguimiento
					</Typography>
					<Stack direction="row" spacing={1} alignItems="center">
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em" }}>Movimientos del expediente</Typography>
						{data && <Chip size="small" label={`${total} ${total === 1 ? "registro" : "registros"}`} sx={chipSx(true)} />}
					</Stack>
				</Box>
				<TextField
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar en el seguimiento…"
					size="small"
					inputProps={{ "aria-label": "Buscar en el seguimiento" }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchNormal1 size={16} />
							</InputAdornment>
						),
						endAdornment: search ? (
							<InputAdornment position="end">
								<IconButton size="small" aria-label="Borrar búsqueda" onClick={() => setSearch("")} edge="end">
									<CloseCircle size={16} />
								</IconButton>
							</InputAdornment>
						) : null,
					}}
					sx={{ flex: "1 1 200px", maxWidth: 320, "& .MuiInputBase-root": { height: 32, fontSize: "0.82rem" } }}
				/>
				<Stack direction="row" spacing={0.75}>
					<Tooltip
						title={
							order === "desc"
								? "Lo más nuevo arriba. Clic para ver lo más viejo arriba."
								: "Lo más viejo arriba. Clic para ver lo más nuevo arriba."
						}
					>
						<IconButton
							size="small"
							onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
							aria-label="Cambiar orden"
							data-testid="seguimiento-orden"
							sx={iconBtnSx}
						>
							{order === "desc" ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
						</IconButton>
					</Tooltip>
					<Tooltip title="Imprimir o exportar">
						<span>
							<IconButton
								size="small"
								onClick={(e) => setExportAnchor(e.currentTarget)}
								disabled={exportando || total === 0}
								aria-label="Imprimir o exportar"
								sx={iconBtnSx}
							>
								<DocumentDownload size={16} />
							</IconButton>
						</span>
					</Tooltip>
					{data?.canConfig && (
						<Tooltip title="Etiquetas y tipos">
							<IconButton size="small" onClick={() => setConfigOpen(true)} aria-label="Etiquetas y tipos" sx={iconBtnSx}>
								<Setting2 size={16} />
							</IconButton>
						</Tooltip>
					)}
				</Stack>
				<Menu anchorEl={exportAnchor} open={!!exportAnchor} onClose={() => setExportAnchor(null)}>
					<MenuItem onClick={() => exportar("pdf")}>PDF, para imprimir</MenuItem>
					<MenuItem onClick={() => exportar("csv")}>Planilla (CSV)</MenuItem>
				</Menu>
			</Box>

			{/* Etiquetas del expediente (los «estados» del estudio) */}
			{data && (
				<Box sx={{ mb: 1.5 }}>
					<FolderEtiquetas
						folderId={folderId}
						value={data.folderEstados || []}
						canEdit={data.canEditar}
						onChange={(ids) => setData((d) => (d ? { ...d, folderEstados: ids } : d))}
						onConfigSaved={({ tipos: nuevos }) => {
							setData((d) => (d ? { ...d, tipos: nuevos as Tipo[] } : d));
							refrescar();
						}}
					/>
				</Box>
			)}

			{/* Alta de anotación */}
			{data?.canAnotar && (
				<Box sx={panelSx} data-testid="seguimiento-anotar">
					<Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "stretch", md: "flex-start" }}>
						<TextField
							value={texto}
							onChange={(e) => setTexto(e.target.value.slice(0, TEXTO_MAX))}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									anotar();
								}
							}}
							placeholder="Anotá un movimiento: llamé al cliente, subí escrito, a despacho…"
							size="small"
							fullWidth
							multiline
							maxRows={5}
							disabled={guardando}
							inputProps={{ "aria-label": "Anotación" }}
							helperText="Enter guarda; Shift + Enter agrega un renglón."
							sx={{ "& .MuiInputBase-root": { bgcolor: "background.paper", fontSize: "0.875rem" } }}
						/>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, flexWrap: "wrap", minHeight: 37 }} useFlexGap>
							{tipos.map((t) => (
								<TipoBoton
									key={t._id}
									tipo={t}
									activo={tipoNuevo === t._id}
									size={28}
									disabled={guardando}
									onClick={() => setTipoNuevo((cur) => (cur === t._id ? null : (t._id as string)))}
								/>
							))}
							<Tooltip title="Fecha y hora del movimiento. Cambiala para anotar algo de otro día o un pendiente futuro.">
								<TextField
									type="datetime-local"
									size="small"
									value={fecha}
									onChange={(e) => {
										fechaTocada.current = true;
										setFecha(e.target.value);
									}}
									disabled={guardando}
									inputProps={{ "aria-label": "Fecha y hora" }}
									sx={{ width: 205, "& .MuiInputBase-root": { bgcolor: "background.paper", fontSize: "0.82rem" } }}
								/>
							</Tooltip>
							<Button variant="contained" size="small" onClick={anotar} disabled={!texto.trim() || guardando} sx={{ height: 37, px: 2.25 }}>
								{guardando ? "Guardando…" : "Anotar"}
							</Button>
						</Stack>
					</Stack>
				</Box>
			)}

			{/* Filtros */}
			<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
				<Chip label="Todo" size="small" clickable onClick={() => setFuentes([])} sx={chipSx(fuentes.length === 0)} />
				{(Object.keys(FUENTE_LABEL) as Fuente[]).map((f) => (
					<Chip
						key={f}
						size="small"
						clickable
						data-testid={`seguimiento-fuente-${f}`}
						label={`${FUENTE_LABEL[f]}${data ? ` (${data.conteo[f] ?? 0})` : ""}`}
						onClick={() => toggleFuente(f)}
						sx={chipSx(fuentes.includes(f))}
					/>
				))}
				{tipos.length > 0 && (
					<>
						<Box sx={{ width: "1px", height: 18, bgcolor: "divider", mx: 0.5 }} />
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Tipo:</Typography>
						{tipos.map((t) => (
							<TipoBoton
								key={t._id}
								tipo={t}
								activo={tipoFiltro === t._id}
								size={24}
								onClick={() => setTipoFiltro((cur) => (cur === t._id ? "" : (t._id as string)))}
							/>
						))}
						<Chip
							label="Sin tipo"
							size="small"
							clickable
							onClick={() => setTipoFiltro((cur) => (cur === "sin" ? "" : "sin"))}
							sx={chipSx(tipoFiltro === "sin")}
						/>
					</>
				)}
			</Stack>

			{/* Plan sin movimientos judiciales: el mismo aviso que Actividad (se ven solo los últimos). */}
			{data?.accesos?.[0] && (
				<Box sx={{ mb: 1.5 }} data-testid="seguimiento-plan">
					<PjnAccessAlert pjnAccess={data.accesos[0]} />
				</Box>
			)}
			{data?.avisos?.map((a) => (
				<Alert key={a} severity="info" sx={{ mb: 1.5, py: 0.25 }}>
					{a}
				</Alert>
			))}
			{error && (
				<Alert severity="error" sx={{ mb: 1.5 }}>
					{error}
				</Alert>
			)}

			{/* Lista */}
			{showLoader ? (
				<Box data-testid="seguimiento-cargando">
					{Array.from({ length: 8 }).map((_, i) => (
						<Box key={i} sx={{ display: "flex", gap: 1.25, px: 1.25, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Skeleton variant="text" width={80} height={20} />
							<Skeleton variant="rounded" width={22} height={22} />
							<Skeleton variant="text" width={`${55 + ((i * 13) % 35)}%`} height={20} />
						</Box>
					))}
				</Box>
			) : total === 0 && !loading ? (
				<Box sx={{ py: 5, textAlign: "center", border: `1px dashed ${theme.palette.divider}`, borderRadius: 1.5 }}>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>{hayFiltros ? "Sin resultados" : "Todavía no hay movimientos"}</Typography>
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.5 }}>
						{hayFiltros
							? "Ningún registro coincide con la búsqueda o los filtros."
							: "Acá vas a ver juntos lo que anote el estudio, los movimientos del expediente y las cédulas."}
					</Typography>
				</Box>
			) : (
				<Box sx={{ border: `1px solid ${theme.palette.divider}`, borderBottom: "none", borderRadius: 1, overflow: "hidden" }}>
					{(data?.items || []).map(renderItem)}
					{/* Al final de la lista, filas borrosas por los movimientos que el plan no muestra (como en Actividad). */}
					{bloqueados > 0 &&
						page >= (data?.pagination.pages || 1) &&
						Array.from({ length: Math.min(3, bloqueados) }).map((_, i) => (
							<Box
								key={`bloqueado-${i}`}
								data-testid="seguimiento-bloqueado"
								aria-hidden
								sx={{
									display: "flex",
									gap: 1.25,
									px: 1.25,
									py: 0.9,
									borderBottom: `1px solid ${theme.palette.divider}`,
									borderLeft: "3px solid transparent",
									filter: "blur(3px)",
									userSelect: "none",
									pointerEvents: "none",
									color: "text.disabled",
								}}
							>
								<Typography sx={{ width: 86, flexShrink: 0, fontSize: "0.78rem", fontWeight: 600 }}>00/00/0000</Typography>
								<Box sx={{ width: 24, flexShrink: 0 }} />
								<Box sx={{ flex: 1 }}>
									<Typography sx={{ fontSize: "0.86rem" }}>
										{["Providencia simple - Téngase presente", "Notificación electrónica", "Pase a despacho"][i]}
									</Typography>
									<Typography sx={{ fontSize: "0.72rem" }}>Movimiento · PJN</Typography>
								</Box>
							</Box>
						))}
				</Box>
			)}

			{/* Paginación: la misma que Actividad → Movimientos */}
			{data && total > 0 && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 1,
						mt: 1.5,
						pt: 1,
						borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
					}}
					data-testid="seguimiento-paginacion"
				>
					<TablePagination
						rowsPerPageOptions={PAGE_SIZES}
						component="div"
						count={total}
						rowsPerPage={pageSize}
						page={Math.min(page - 1, Math.max(0, data.pagination.pages - 1))}
						onPageChange={(_e, p) => setPage(p + 1)}
						onRowsPerPageChange={(e) => {
							const n = parseInt(e.target.value, 10);
							setPageSize(n);
							try {
								localStorage.setItem(PAGE_SIZE_KEY, String(n));
							} catch {
								/* sin almacenamiento local: no se recuerda */
							}
						}}
						labelRowsPerPage="Filas por página"
						labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
						sx={{
							"& .MuiTablePagination-toolbar": { paddingLeft: 0, minHeight: 44 },
							"& .MuiTablePagination-actions": { display: "none" },
							"& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
								fontSize: "0.74rem",
								fontWeight: 500,
								letterSpacing: "-0.005em",
								color: "text.secondary",
								fontVariantNumeric: "tabular-nums",
							},
							"& .MuiTablePagination-select": {
								fontSize: "0.78rem",
								fontWeight: 600,
								color: BRAND_BLUE,
								fontVariantNumeric: "tabular-nums",
								borderRadius: 0.875,
							},
						}}
					/>
					{data.pagination.pages > 1 && (
						<PaginationWithJump
							page={page - 1}
							totalPages={data.pagination.pages}
							onPageChange={(p) => setPage(p + 1)}
							disabled={loading}
						/>
					)}
				</Box>
			)}

			{/* Menú de tipos: se abre desde la letra de la fila */}
			<Menu anchorEl={tipoMenu?.anchor} open={!!tipoMenu} onClose={() => setTipoMenu(null)}>
				{tipos.map((t) => (
					<MenuItem
						key={t._id}
						dense
						selected={tipoMenu?.item.tipoId === t._id}
						onClick={() => {
							if (tipoMenu) cambiarTipo(tipoMenu.item, t._id as string);
							setTipoMenu(null);
						}}
					>
						<Box sx={{ mr: 1, display: "inline-flex" }}>
							<TipoBoton tipo={t} activo size={20} />
						</Box>
						{t.nombre}
					</MenuItem>
				))}
				{tipoMenu?.item.tipoId && (
					<MenuItem
						dense
						onClick={() => {
							if (tipoMenu) modificar(tipoMenu.item, { tipoId: null });
							setTipoMenu(null);
						}}
						sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 0.5, color: "text.secondary" }}
					>
						Sin tipo
					</MenuItem>
				)}
			</Menu>

			{/* Menú de la anotación */}
			<Menu anchorEl={accionesMenu?.anchor} open={!!accionesMenu} onClose={() => setAccionesMenu(null)}>
				{data?.canEditar && (
					<MenuItem
						dense
						onClick={() => {
							if (accionesMenu) empezarEdicion(accionesMenu.item);
							setAccionesMenu(null);
						}}
					>
						<Edit2 size={15} style={{ marginRight: 8 }} />
						Modificar
					</MenuItem>
				)}
				{data?.canEliminar && (
					<MenuItem
						dense
						onClick={() => {
							if (accionesMenu) setBorrar(accionesMenu.item);
							setAccionesMenu(null);
						}}
						sx={{ color: "error.main" }}
					>
						<Trash size={15} style={{ marginRight: 8 }} />
						Eliminar
					</MenuItem>
				)}
			</Menu>

			<PDFViewer open={!!pdf} onClose={() => setPdf(null)} url={pdf?.url || ""} title={pdf?.title || "Documento"} />

			<EtiquetasYTiposDialog
				open={configOpen}
				onClose={() => setConfigOpen(false)}
				onSaved={({ tipos: nuevos }) => {
					setData((d) => (d ? { ...d, tipos: nuevos as Tipo[] } : d));
					if (tipoNuevo && !nuevos.some((t) => t._id === tipoNuevo)) setTipoNuevo(null);
					if (tipoFiltro && tipoFiltro !== "sin" && !nuevos.some((t) => t._id === tipoFiltro)) setTipoFiltro("");
					refrescar();
				}}
			/>

			<Dialog open={!!borrar} onClose={() => setBorrar(null)} maxWidth="xs" fullWidth>
				<DialogTitle>¿Eliminar esta anotación?</DialogTitle>
				<DialogContent>
					<Typography sx={{ fontSize: "0.86rem", color: "text.secondary", whiteSpace: "pre-wrap" }}>{borrar?.texto}</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setBorrar(null)} color="secondary">
						Cancelar
					</Button>
					<Button onClick={confirmarBorrado} color="error" variant="contained" startIcon={<TickCircle size={16} />}>
						Eliminar
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default SeguimientoTab;
