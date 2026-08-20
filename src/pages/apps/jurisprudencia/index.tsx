import { useCallback, useRef, useState } from "react";

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
import { JurisprudenciaHit, JurisprudenciaQuotaError } from "types/jurisprudencia";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// icons
import { ArrowLeft, Book, CloseSquare, DocumentText, ExportSquare, Judge, SearchNormal1 } from "iconsax-react";

// ==============================|| JURISPRUDENCIA — BÚSQUEDA SEMÁNTICA ||============================== //
//
// Vista in-app de búsqueda semántica sobre el corpus de sentencias nacionales
// (~320k fallos embebidos). Consume pjn-rag-api /rag/sentencias/ask (query
// planner LLM: interpreta lenguaje natural y deriva filtros) con gating por
// plan del lado del backend (free: cuota mensual; pagos: ilimitado).

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

const FUERO_LABELS: Record<string, string> = {
	CNT: "Trabajo",
	CIV: "Civil",
	CSS: "Seg. Social",
	COM: "Comercial",
	CCC: "Crim. y Correccional",
	CSJ: "Corte Suprema",
	CNE: "Electoral",
	CAF: "Cont. Adm. Federal",
	CCF: "Civil y Com. Federal",
	CPE: "Penal Económico",
	CFP: "Crim. y Corr. Federal",
};

const formatFecha = (iso?: string) => {
	if (!iso) return "—";
	const d = new Date(iso);
	return isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const JurisprudenciaSearchPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

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
	const [textoDialog, setTextoDialog] = useState<{ open: boolean; caratula: string; texto: string; loading: boolean }>({
		open: false,
		caratula: "",
		texto: "",
		loading: false,
	});
	const searchSeqRef = useRef(0);

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

	// Nota: la cuota restante viaja en headers de respuesta pero axios normaliza
	// a lowercase — la actualizamos desde el interceptor simple de acá.
	const askWithQuota = useCallback(
		async (prompt: string) => {
			await runSearch(prompt);
		},
		[runSearch],
	);

	const handleSimilares = useCallback(
		async (hit: JurisprudenciaHit) => {
			if (searching) return;
			const seq = ++searchSeqRef.current;
			setSearching(true);
			setErrorMsg(null);
			try {
				const response = await jurisprudenciaService.similares(hit.sentencia._id, 8);
				if (seq !== searchSeqRef.current) return;
				setResults(response.results || []);
				setSimilaresDe(hit.sentencia.caratula || "la sentencia seleccionada");
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

	const handleVerTexto = useCallback(async (hit: JurisprudenciaHit) => {
		setTextoDialog({ open: true, caratula: hit.sentencia.caratula || "Sentencia", texto: "", loading: true });
		try {
			const texto = await jurisprudenciaService.getTexto(hit.sentencia._id);
			setTextoDialog((prev) => ({ ...prev, texto: texto || "(sin texto disponible)", loading: false }));
		} catch (error: any) {
			const msg = error?.response?.data?.message || "No se pudo cargar el texto de esta sentencia.";
			setTextoDialog((prev) => ({ ...prev, texto: msg, loading: false }));
		}
	}, []);

	const selectSx = {
		borderRadius: 1.25,
		fontSize: "0.85rem",
		"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
		"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
		"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
	};

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
									askWithQuota(queryInput);
								}
							}}
							placeholder='Ej: "despido sin causa de trabajadora embarazada, indemnización del art. 182 LCT"'
							sx={{ "& .MuiOutlinedInput-root": { ...selectSx, bgcolor: "background.paper" } }}
						/>
						<Button
							variant="contained"
							onClick={() => askWithQuota(queryInput)}
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

					{/* Ejemplos — solo antes de la primera búsqueda */}
					{results === null && (
						<Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.75 }}>
							{EJEMPLOS.map((ej) => (
								<Chip
									key={ej}
									label={ej}
									size="small"
									onClick={() => {
										setQueryInput(ej);
										askWithQuota(ej);
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

			{/* Banner de modo similares */}
			{similaresDe && (
				<Stack direction="row" spacing={1} alignItems="center">
					<Button
						size="small"
						startIcon={<ArrowLeft size={14} />}
						onClick={() => askWithQuota(lastQuery)}
						disabled={!lastQuery || searching}
						sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary" }}
					>
						Volver a la búsqueda
					</Button>
					<Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
						Sentencias similares a: <strong>{similaresDe.slice(0, 90)}</strong>
					</Typography>
				</Stack>
			)}

			{/* Skeletons durante la búsqueda */}
			{searching && (
				<Stack spacing={1.5}>
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: 2 }} />
					))}
				</Stack>
			)}

			{/* Resultados */}
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
												label={FUERO_LABELS[hit.sentencia.fuero] || hit.sentencia.fuero}
												sx={{
													fontSize: "0.66rem",
													fontWeight: 600,
													height: 20,
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.09),
													color: BRAND_BLUE,
												}}
											/>
										)}
										{hit.sentencia.sentenciaTipo && hit.sentencia.sentenciaTipo !== "otro" && (
											<Chip
												size="small"
												label={hit.sentencia.sentenciaTipo}
												sx={{ fontSize: "0.66rem", height: 20, textTransform: "capitalize" }}
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

							{/* Resumen IA si está aprobado */}
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
									onClick={() => handleVerTexto(hit)}
									sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.76rem", color: BRAND_BLUE }}
								>
									Texto completo
								</Button>
								<Button
									size="small"
									startIcon={<Book size={14} />}
									onClick={() => handleSimilares(hit)}
									sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.76rem", color: "text.secondary" }}
								>
									Similares
								</Button>
								{/* Lectura completa en la página pública (resumen formateado + PDF) */}
								<Button
									size="small"
									component="a"
									href={`/jurisprudencia/${hit.sentencia._id}`}
									target="_blank"
									rel="noopener"
									startIcon={<ExportSquare size={14} />}
									sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.76rem", color: "text.secondary" }}
								>
									Ver en Jurisprudencia
								</Button>
							</Stack>
						</Box>
					</MainCard>
				))}

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
