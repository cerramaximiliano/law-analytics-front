import { useCallback, useEffect, useRef, useState } from "react";

// material-ui
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogContent,
	FormControl,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Pagination,
	Select,
	Skeleton,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project imports
import MainCard from "components/MainCard";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import jurisprudenciaService from "services/jurisprudenciaService";
import { getPublicSentencias, getPublicSentencia, fueroLabel } from "services/publicSentenciasService";
import { PublicSentenciaListItem, PublicSentenciasFueroCount } from "types/publicSentencia";
import { JurisprudenciaHit, JurisprudenciaQuotaError } from "types/jurisprudencia";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// icons
import { ArrowLeft, Book, CloseSquare, DocumentText, Judge, SearchNormal1 } from "iconsax-react";

// ==============================|| JURISPRUDENCIA — BÚSQUEDA SEMÁNTICA ||============================== //
//
// Vista in-app sobre el corpus SAIJ curado (+10.000 fallos nacionales con
// resumen IA propio — mismo universo que la vista pública /jurisprudencia).
// Dos modos:
//   - Exploración (estado inicial): lista paginada del archivo completo vía el
//     endpoint público (sin costo de cuota), con chips de fuero.
//   - Búsqueda semántica: pjn-rag-api /rag/sentencias/ask (planner LLM), con
//     gating por plan en el backend (free: cuota mensual; pagos: ilimitado).

// Fueros con presencia real en el corpus SAIJ (mismos códigos y labels que la
// vista pública /jurisprudencia).
const FUEROS = [
	{ value: "", label: "Todos los fueros" },
	{ value: "COM", label: "Comercial" },
	{ value: "CNT", label: "Trabajo" },
	{ value: "CCC", label: "Criminal y Correccional" },
	{ value: "CIV", label: "Civil" },
	{ value: "CSS", label: "Seguridad Social" },
];

const EJEMPLOS = [
	"Despido discriminatorio por embarazo con indemnización agravada",
	"Concurso preventivo: verificación de créditos laborales",
	"Daños y perjuicios por accidente de tránsito con incapacidad",
	"Regulación de honorarios y base regulatoria",
];

const SECTION_LABELS: Record<string, string> = {
	encabezado: "Encabezado",
	vistos: "Vistos",
	considerando: "Considerando",
	voto: "Voto",
	resolucion: "Resolución",
};

const BROWSE_PAGE_SIZE = 10;

const formatFecha = (iso?: string | null) => {
	if (!iso) return "—";
	const d = new Date(iso);
	return isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// El texto viene de pdf-parse: cada línea arrastra la indentación del PDF
// original (sangrías enormes que en pantalla se ven como un margen derecho
// gigante). Normalizamos: sin indentación por línea, tabs a espacio, espacios
// múltiples colapsados y máximo un renglón vacío entre párrafos.
const normalizeTexto = (raw: string): string =>
	raw
		.split("\n")
		.map((line) => line.replace(/\t/g, " ").replace(/ {2,}/g, " ").trim())
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

const JurisprudenciaSearchPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	// ── Búsqueda semántica ──────────────────────────────────────────────────
	const [queryInput, setQueryInput] = useState("");
	const [fuero, setFuero] = useState("");
	const [anio, setAnio] = useState("");
	const [searching, setSearching] = useState(false);
	const [results, setResults] = useState<JurisprudenciaHit[] | null>(null);
	const [lastQuery, setLastQuery] = useState("");
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
	const [quotaModal, setQuotaModal] = useState<{ open: boolean; message: string; quota?: JurisprudenciaQuotaError }>({
		open: false,
		message: "",
	});
	// Modo "similares a": guarda la carátula de referencia para el banner
	const [similaresDe, setSimilaresDe] = useState<string | null>(null);
	const searchSeqRef = useRef(0);

	// ── Exploración del archivo (estado sin búsqueda activa) ────────────────
	const [browseItems, setBrowseItems] = useState<PublicSentenciaListItem[] | null>(null);
	const [browseTotal, setBrowseTotal] = useState(0);
	const [browsePage, setBrowsePage] = useState(1);
	const [browseFuero, setBrowseFuero] = useState("");
	const [browseByFuero, setBrowseByFuero] = useState<PublicSentenciasFueroCount[]>([]);
	const [browseLoading, setBrowseLoading] = useState(false);
	const browseSeqRef = useRef(0);

	// ── Dialog de texto completo (compartido por ambos modos) ───────────────
	const [textoDialog, setTextoDialog] = useState<{ open: boolean; caratula: string; texto: string; loading: boolean }>({
		open: false,
		caratula: "",
		texto: "",
		loading: false,
	});

	const loadBrowse = useCallback(async (page: number, fueroFilter: string) => {
		const seq = ++browseSeqRef.current;
		setBrowseLoading(true);
		try {
			const response = await getPublicSentencias({ page, limit: BROWSE_PAGE_SIZE, fuero: fueroFilter || undefined });
			if (seq !== browseSeqRef.current) return;
			setBrowseItems(response.data.items);
			setBrowseTotal(response.data.total);
			if (response.data.byFuero?.length) setBrowseByFuero(response.data.byFuero);
		} catch {
			if (seq === browseSeqRef.current) setBrowseItems([]);
		} finally {
			if (seq === browseSeqRef.current) setBrowseLoading(false);
		}
	}, []);

	useEffect(() => {
		loadBrowse(1, "");
	}, [loadBrowse]);

	const handleBrowsePage = (page: number) => {
		setBrowsePage(page);
		loadBrowse(page, browseFuero);
	};

	const handleBrowseFuero = (value: string) => {
		const next = browseFuero === value ? "" : value;
		setBrowseFuero(next);
		setBrowsePage(1);
		loadBrowse(1, next);
	};

	const runSearch = useCallback(
		async (prompt: string) => {
			const trimmed = prompt.trim();
			if (trimmed.length < 3 || searching) return;

			const seq = ++searchSeqRef.current;
			setSearching(true);
			setErrorMsg(null);
			setSimilaresDe(null);
			try {
				const filters: Record<string, unknown> = {};
				if (fuero) filters.fuero = fuero;
				const anioNum = parseInt(anio, 10);
				if (!isNaN(anioNum) && anioNum > 1990) filters.year = anioNum;

				const response = await jurisprudenciaService.ask(trimmed, { topK: 10, filters });
				if (seq !== searchSeqRef.current) return; // llegó tarde: hay una búsqueda más nueva
				setResults(response.results || []);
				setLastQuery(trimmed);
				if (response.quotaRemaining !== undefined) setQuotaRemaining(response.quotaRemaining);
			} catch (error: any) {
				if (seq !== searchSeqRef.current) return;
				const data = error?.response?.data;
				if (error?.response?.status === 403 && data?.upgrade) {
					setQuotaModal({ open: true, message: data.error, quota: data.quota });
				} else if (error?.response?.status === 429) {
					setErrorMsg("Demasiadas búsquedas seguidas. Esperá unos segundos y volvé a intentar.");
				} else {
					setErrorMsg(data?.error || data?.message || "Error al buscar. Intentá nuevamente.");
				}
			} finally {
				if (seq === searchSeqRef.current) setSearching(false);
			}
		},
		[fuero, anio, searching],
	);

	const clearSearch = () => {
		searchSeqRef.current++;
		setResults(null);
		setQueryInput("");
		setSimilaresDe(null);
		setErrorMsg(null);
		setSearching(false);
	};

	const handleSimilares = useCallback(
		async (sentenciaId: string, caratula?: string) => {
			if (searching) return;
			const seq = ++searchSeqRef.current;
			setSearching(true);
			setErrorMsg(null);
			try {
				const response = await jurisprudenciaService.similares(sentenciaId, 8);
				if (seq !== searchSeqRef.current) return;
				setResults(response.results || []);
				setSimilaresDe(caratula || "la sentencia seleccionada");
			} catch (error: any) {
				if (seq !== searchSeqRef.current) return;
				const data = error?.response?.data;
				if (error?.response?.status === 403 && data?.upgrade) {
					setQuotaModal({ open: true, message: data.error, quota: data.quota });
				} else {
					setErrorMsg(data?.error || data?.message || "Error al buscar sentencias similares.");
				}
			} finally {
				if (seq === searchSeqRef.current) setSearching(false);
			}
		},
		[searching],
	);

	// Texto completo vía el endpoint público de detalle (sin auth ni cuota;
	// mismo contenido que la vista pública, con cache del server).
	const handleVerTexto = useCallback(async (sentenciaId: string, caratula?: string) => {
		setTextoDialog({ open: true, caratula: caratula || "Sentencia", texto: "", loading: true });
		try {
			const detail = await getPublicSentencia(sentenciaId);
			const texto = detail?.data?.texto ? normalizeTexto(detail.data.texto) : "(sin texto disponible)";
			setTextoDialog((prev) => ({ ...prev, texto, loading: false }));
		} catch {
			setTextoDialog((prev) => ({ ...prev, texto: "No se pudo cargar el texto de esta sentencia.", loading: false }));
		}
	}, []);

	const selectSx = {
		borderRadius: 1.25,
		fontSize: "0.85rem",
		"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
		"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
		"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
	};

	const inBrowseMode = results === null && !searching;

	return (
		<Stack spacing={2.5}>
			{/* Hero de búsqueda */}
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, overflow: "hidden" }}>
				<Box sx={{ p: { xs: 2.25, sm: 3 }, bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025) }}>
					<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
						<Box
							sx={{
								width: 42,
								height: 42,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<Judge size={22} variant="Bulk" />
						</Box>
						<Stack spacing={0}>
							<Typography sx={{ fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.018em", color: "text.primary" }}>
								Jurisprudencia
							</Typography>
							<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
								Búsqueda inteligente sobre más de 10.000 fallos nacionales con resumen propio — describí el caso con tus palabras.
							</Typography>
						</Stack>
					</Stack>

					<Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ mt: 2 }}>
						<TextField
							fullWidth
							multiline
							maxRows={3}
							value={queryInput}
							onChange={(e) => setQueryInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									runSearch(queryInput);
								}
							}}
							placeholder='Ej: "despido sin causa de trabajadora embarazada, indemnización del art. 182 LCT"'
							sx={{ "& .MuiOutlinedInput-root": { ...selectSx, bgcolor: "background.paper" } }}
						/>
						<Button
							variant="contained"
							onClick={() => runSearch(queryInput)}
							disabled={searching || queryInput.trim().length < 3}
							startIcon={searching ? <CircularProgress size={15} color="inherit" /> : <SearchNormal1 size={16} />}
							sx={{
								minWidth: 130,
								alignSelf: { xs: "stretch", md: "flex-start" },
								textTransform: "none",
								fontWeight: 600,
								borderRadius: 1.25,
								bgcolor: BRAND_BLUE,
								boxShadow: "none",
								py: 1.5,
								"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
							}}
						>
							{searching ? "Buscando…" : "Buscar"}
						</Button>
					</Stack>

					{/* Filtros opcionales */}
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 1.5 }}>
						<FormControl size="small" sx={{ minWidth: 190 }}>
							<InputLabel sx={{ fontSize: "0.82rem" }}>Fuero</InputLabel>
							<Select value={fuero} label="Fuero" onChange={(e) => setFuero(e.target.value)} sx={selectSx}>
								{FUEROS.map((f) => (
									<MenuItem key={f.value} value={f.value} sx={{ fontSize: "0.85rem" }}>
										{f.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<OutlinedInput
							size="small"
							value={anio}
							onChange={(e) => setAnio(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
							placeholder="Año (ej. 2024)"
							sx={{ ...selectSx, width: 140 }}
						/>
						{quotaRemaining !== null && (
							<Tooltip title="Búsquedas restantes del mes en tu plan actual">
								<Chip
									size="small"
									label={`${quotaRemaining} búsquedas restantes`}
									sx={{
										alignSelf: "center",
										bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
										color: STALE_AMBER,
										fontWeight: 600,
										fontSize: "0.7rem",
									}}
								/>
							</Tooltip>
						)}
					</Stack>

					{/* Ejemplos — solo en modo exploración */}
					{inBrowseMode && (
						<Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.75 }}>
							{EJEMPLOS.map((ej) => (
								<Chip
									key={ej}
									label={ej}
									size="small"
									onClick={() => {
										setQueryInput(ej);
										runSearch(ej);
									}}
									sx={{
										fontSize: "0.72rem",
										color: "text.secondary",
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.07 : 0.04),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
										"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08), color: BRAND_BLUE },
									}}
								/>
							))}
						</Stack>
					)}
				</Box>
			</MainCard>

			{/* Error */}
			{errorMsg && (
				<Box
					sx={{
						p: 1.5,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.error.main, isDark ? 0.08 : 0.04),
						border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.32 : 0.22)}`,
					}}
				>
					<Typography sx={{ fontSize: "0.85rem", color: "text.primary" }}>{errorMsg}</Typography>
				</Box>
			)}

			{/* Banner del modo búsqueda: similares o volver al archivo */}
			{results !== null && !searching && (
				<Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
					<Button
						size="small"
						startIcon={<ArrowLeft size={14} />}
						onClick={similaresDe && lastQuery ? () => runSearch(lastQuery) : clearSearch}
						sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary" }}
					>
						{similaresDe && lastQuery ? "Volver a la búsqueda" : "Volver al archivo"}
					</Button>
					{similaresDe ? (
						<Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
							Sentencias similares a: <strong>{similaresDe.slice(0, 90)}</strong>
						</Typography>
					) : (
						<Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
							Resultados para: <strong>{lastQuery.slice(0, 90)}</strong>
						</Typography>
					)}
				</Stack>
			)}

			{/* Skeletons durante la búsqueda semántica */}
			{searching && (
				<Stack spacing={1.5}>
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: 2 }} />
					))}
				</Stack>
			)}

			{/* ── MODO BÚSQUEDA: resultados semánticos ── */}
			{!searching && results !== null && results.length === 0 && (
				<MainCard sx={{ borderRadius: 2, textAlign: "center", py: 4 }}>
					<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "text.primary" }}>Sin resultados relevantes</Typography>
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.5 }}>
						Probá reformular la consulta con otros términos, o quitá los filtros de fuero/año.
					</Typography>
				</MainCard>
			)}

			{!searching &&
				results?.map((hit) => (
					<MainCard
						key={hit.sentencia._id}
						content={false}
						sx={{
							borderRadius: 2,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
							"&:hover": { borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.24) },
							transition: "border-color 0.15s ease",
						}}
					>
						<Box sx={{ p: { xs: 1.75, sm: 2.25 } }}>
							<Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
								<Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
									<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
										{hit.sentencia.caratula || "(sin carátula)"}
									</Typography>
									<Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
										{hit.sentencia.fuero && (
											<Chip
												size="small"
												label={fueroLabel(hit.sentencia.fuero)}
												sx={{
													fontSize: "0.66rem",
													fontWeight: 600,
													height: 20,
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.09),
													color: BRAND_BLUE,
												}}
											/>
										)}
										<Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
											{formatFecha(hit.sentencia.movimientoFecha)}
											{hit.sentencia.organizacion ? ` · ${hit.sentencia.organizacion}` : ""}
										</Typography>
									</Stack>
								</Stack>
								<Tooltip title="Relevancia semántica respecto de tu consulta">
									<Box sx={{ textAlign: "right", flexShrink: 0 }}>
										<Typography sx={{ fontSize: "1rem", fontWeight: 700, color: hit.score >= 0.65 ? LIVE_GREEN : BRAND_BLUE }}>
											{Math.round(hit.score * 100)}%
										</Typography>
										<Typography sx={{ fontSize: "0.64rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
											relevancia
										</Typography>
									</Box>
								</Tooltip>
							</Stack>

							{/* Resumen IA */}
							{hit.sentencia.aiSummary?.content && (
								<Typography
									sx={{
										mt: 1.25,
										fontSize: "0.8rem",
										color: "text.secondary",
										lineHeight: 1.5,
										display: "-webkit-box",
										WebkitLineClamp: 3,
										WebkitBoxOrient: "vertical",
										overflow: "hidden",
									}}
								>
									{hit.sentencia.aiSummary.content.replace(/^#+\s.*$/gm, "").trim()}
								</Typography>
							)}

							{/* Fragmentos que matchearon */}
							<Stack spacing={0.75} sx={{ mt: 1.25 }}>
								{hit.matchedChunks?.slice(0, 2).map((chunk) => (
									<Box
										key={chunk.index}
										sx={{
											p: 1.125,
											borderRadius: 1.25,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.03),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)}`,
										}}
									>
										<Stack direction="row" spacing={0.75} alignItems="flex-start">
											<Chip
												size="small"
												label={SECTION_LABELS[chunk.sectionType] || chunk.sectionType}
												sx={{
													fontSize: "0.6rem",
													height: 18,
													fontWeight: 600,
													flexShrink: 0,
													bgcolor: alpha(LIVE_GREEN, isDark ? 0.16 : 0.1),
													color: LIVE_GREEN,
												}}
											/>
											<Typography
												sx={{
													fontSize: "0.78rem",
													color: "text.primary",
													lineHeight: 1.5,
													display: "-webkit-box",
													WebkitLineClamp: 3,
													WebkitBoxOrient: "vertical",
													overflow: "hidden",
												}}
											>
												{chunk.text}
											</Typography>
										</Stack>
									</Box>
								))}
							</Stack>

							{/* Acciones */}
							<Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
								<Button
									size="small"
									startIcon={<DocumentText size={14} />}
									onClick={() => handleVerTexto(hit.sentencia._id, hit.sentencia.caratula)}
									sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.76rem", color: BRAND_BLUE }}
								>
									Texto completo
								</Button>
								<Button
									size="small"
									startIcon={<Book size={14} />}
									onClick={() => handleSimilares(hit.sentencia._id, hit.sentencia.caratula)}
									sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.76rem", color: "text.secondary" }}
								>
									Similares
								</Button>
							</Stack>
						</Box>
					</MainCard>
				))}

			{/* ── MODO EXPLORACIÓN: archivo completo paginado ── */}
			{inBrowseMode && (
				<MainCard
					content={false}
					sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`, overflow: "hidden" }}
				>
					<Box sx={{ px: { xs: 1.75, sm: 2.25 }, pt: 2, pb: 1 }}>
						<Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography sx={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
									Últimos fallos publicados
								</Typography>
								{browseTotal > 0 && (
									<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
										{browseTotal.toLocaleString("es-AR")} en el archivo
									</Typography>
								)}
							</Stack>
							{/* Chips por fuero (facet del endpoint público) */}
							<Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
								{browseByFuero.slice(0, 5).map((f) => (
									<Chip
										key={f.fuero}
										size="small"
										label={`${fueroLabel(f.fuero)} ${f.total.toLocaleString("es-AR")}`}
										onClick={() => handleBrowseFuero(f.fuero)}
										sx={{
											fontSize: "0.68rem",
											height: 22,
											fontWeight: 600,
											cursor: "pointer",
											bgcolor: browseFuero === f.fuero ? alpha(BRAND_BLUE, isDark ? 0.24 : 0.14) : alpha(BRAND_BLUE, isDark ? 0.07 : 0.04),
											color: browseFuero === f.fuero ? BRAND_BLUE : "text.secondary",
											border: `1px solid ${alpha(BRAND_BLUE, browseFuero === f.fuero ? 0.4 : isDark ? 0.16 : 0.1)}`,
											"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.09), color: BRAND_BLUE },
										}}
									/>
								))}
							</Stack>
						</Stack>
					</Box>

					{browseLoading || browseItems === null ? (
						<Stack spacing={0} sx={{ px: { xs: 1.75, sm: 2.25 }, pb: 2 }}>
							{Array.from({ length: 6 }, (_, i) => (
								<Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 1.25, mt: 1 }} />
							))}
						</Stack>
					) : browseItems.length === 0 ? (
						<Typography sx={{ px: 2.25, pb: 2.5, fontSize: "0.82rem", color: "text.secondary" }}>
							No hay fallos para el filtro seleccionado.
						</Typography>
					) : (
						<>
							{browseItems.map((item, idx) => (
								<Box
									key={item.id}
									onClick={() => handleVerTexto(item.id, item.caratula)}
									sx={{
										px: { xs: 1.75, sm: 2.25 },
										py: 1.375,
										cursor: "pointer",
										borderTop: idx === 0 ? `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)}` : undefined,
										borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)}`,
										transition: "background-color 0.12s ease",
										"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03) },
									}}
								>
									<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
										<Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
											<Typography
												sx={{
													fontSize: "0.85rem",
													fontWeight: 600,
													letterSpacing: "-0.008em",
													color: "text.primary",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{item.caratula}
											</Typography>
											{item.resumen && (
												<Typography
													sx={{
														fontSize: "0.75rem",
														color: "text.secondary",
														lineHeight: 1.45,
														display: "-webkit-box",
														WebkitLineClamp: 1,
														WebkitBoxOrient: "vertical",
														overflow: "hidden",
													}}
												>
													{item.resumen.replace(/^#+\s.*$/gm, "").trim()}
												</Typography>
											)}
										</Stack>
										<Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
											{item.fuero && (
												<Chip
													size="small"
													label={fueroLabel(item.fuero)}
													sx={{
														fontSize: "0.64rem",
														fontWeight: 600,
														height: 20,
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
														color: BRAND_BLUE,
													}}
												/>
											)}
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
												{formatFecha(item.fecha)}
											</Typography>
										</Stack>
									</Stack>
								</Box>
							))}
							<Stack alignItems="center" sx={{ py: 1.75 }}>
								<Pagination
									size="small"
									count={Math.min(Math.ceil(browseTotal / BROWSE_PAGE_SIZE), 500)}
									page={browsePage}
									onChange={(_e, page) => handleBrowsePage(page)}
									disabled={browseLoading}
								/>
							</Stack>
						</>
					)}
				</MainCard>
			)}

			{/* Dialog de texto completo */}
			<Dialog
				open={textoDialog.open}
				onClose={() => setTextoDialog((prev) => ({ ...prev, open: false }))}
				maxWidth="md"
				fullWidth
				PaperProps={{ sx: { borderRadius: 2, maxHeight: "85vh" } }}
			>
				<Box
					sx={{
						px: 2.5,
						py: 1.75,
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 1,
					}}
				>
					<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em" }}>{textoDialog.caratula}</Typography>
					<Button
						size="small"
						onClick={() => setTextoDialog((prev) => ({ ...prev, open: false }))}
						sx={{ minWidth: 0, color: "text.secondary" }}
					>
						<CloseSquare size={20} />
					</Button>
				</Box>
				<DialogContent sx={{ p: 2.5 }}>
					{textoDialog.loading ? (
						<Stack alignItems="center" py={4}>
							<CircularProgress size={26} sx={{ color: BRAND_BLUE }} />
						</Stack>
					) : (
						<Typography sx={{ fontSize: "0.84rem", lineHeight: 1.65, whiteSpace: "pre-wrap", color: "text.primary" }}>
							{textoDialog.texto}
						</Typography>
					)}
				</DialogContent>
			</Dialog>

			{/* Modal de límite de plan */}
			<LimitErrorModal
				open={quotaModal.open}
				onClose={() => setQuotaModal((prev) => ({ ...prev, open: false }))}
				message={quotaModal.message}
				upgradeRequired
				featureInfo={{
					feature: "Búsqueda semántica de jurisprudencia",
					plan: quotaModal.quota?.plan || "free",
					availableIn: ["standard", "premium"],
				}}
			/>
		</Stack>
	);
};

export default JurisprudenciaSearchPage;
