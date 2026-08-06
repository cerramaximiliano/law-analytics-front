// Sección PÚBLICA de jurisprudencia (/jurisprudencia).
//
// Novedades de sentencias importadas de SAIJ con resumen propio generado por IA.
// Es la landing a la que apuntan los posts de Instagram y el email de novedades.
// Sin auth: consume los endpoints públicos de law-analytics-server.
//
// Diseño: sigue el lenguaje visual de la landing (sections/landing/*) — tokens
// BRAND_BLUE, eyebrow, atmósfera con blob + dot grid, motion spring de entrada,
// stagger de cards y sombras tintadas. Mantener en sync con guides/index.tsx.

import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import {
	Box,
	Button,
	Card,
	CardActionArea,
	Chip,
	Container,
	Grid,
	InputAdornment,
	Pagination,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { ArrowRight, SearchNormal1 } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import PageBackground from "components/PageBackground";
import SEO from "components/SEO/SEO";
import SectionEyebrow from "sections/landing/SectionEyebrow";
import { getPublicSentencias, fueroLabel } from "services/publicSentenciasService";
import type { PublicSentenciaListItem, PublicSentenciasFueroCount, PublicSentenciasJurisdiccionCount } from "types/publicSentencia";
import { summaryExcerpt } from "./SummaryContent";

// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";

const PAGE_SIZE = 12;

function formatFecha(fecha: string | null): string {
	if (!fecha) return "";
	return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const JurisprudenciaPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [searchParams, setSearchParams] = useSearchParams();

	const [items, setItems] = useState<PublicSentenciaListItem[]>([]);
	const [byFuero, setByFuero] = useState<PublicSentenciasFueroCount[]>([]);
	const [byJurisdiccion, setByJurisdiccion] = useState<PublicSentenciasJurisdiccionCount[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

	const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
	const fuero = searchParams.get("fuero") || "";
	const jurisdiccion = searchParams.get("jurisdiccion") || "";
	const search = searchParams.get("q") || "";

	const updateParams = useCallback(
		(updates: Record<string, string | null>) => {
			const next = new URLSearchParams(searchParams);
			Object.entries(updates).forEach(([key, value]) => {
				if (value) next.set(key, value);
				else next.delete(key);
			});
			setSearchParams(next, { preventScrollReset: false });
		},
		[searchParams, setSearchParams],
	);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(false);
		getPublicSentencias({
			page,
			limit: PAGE_SIZE,
			fuero: fuero || undefined,
			jurisdiccion: jurisdiccion || undefined,
			search: search || undefined,
		})
			.then((response) => {
				if (cancelled) return;
				setItems(response.data.items);
				setByFuero(response.data.byFuero);
				setByJurisdiccion(response.data.byJurisdiccion || []);
				setTotal(response.data.total);
			})
			.catch(() => {
				if (!cancelled) setError(true);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [page, fuero, jurisdiccion, search]);

	const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

	const handleSearchSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		updateParams({ q: searchInput.trim() || null, page: null });
	};

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
			<SEO path="/jurisprudencia" />
			<PageBackground variant="light" />

			{/* Atmósfera: spotlight superior + dot grid faded (patrón Hero/Faq) */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "18%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: { xs: 520, md: 880 },
					height: { xs: 520, md: 880 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)} 0%, ${alpha(
						BRAND_BLUE,
						isDark ? 0.04 : 0.02,
					)} 40%, transparent 70%)`,
					filter: "blur(70px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.045 : 0.035)} 1px, transparent 1px)`,
					backgroundSize: "32px 32px",
					maskImage: "radial-gradient(ellipse 70% 45% at 50% 18%, #000 0%, transparent 75%)",
					WebkitMaskImage: "radial-gradient(ellipse 70% 45% at 50% 18%, #000 0%, transparent 75%)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container sx={{ position: "relative", zIndex: 1 }}>
				{/* Hero */}
				<Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
					<motion.div
						initial={{ opacity: 0, translateY: 24 }}
						animate={{ opacity: 1, translateY: 0 }}
						transition={{ type: "spring", stiffness: 150, damping: 30 }}
					>
						<SectionEyebrow label="Novedades jurisprudenciales" align="center" mb={2.5} />
						<Typography
							variant="h1"
							sx={{
								fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
								lineHeight: 1.08,
								letterSpacing: "-0.025em",
								textWrap: "balance",
								mb: 2,
								color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
							}}
						>
							Los fallos que importan,{" "}
							<Box component="span" sx={{ color: BRAND_BLUE }}>
								explicados en claro
							</Box>
						</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, translateY: 16 }}
						animate={{ opacity: 1, translateY: 0 }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.1 }}
					>
						<Typography
							sx={{
								maxWidth: 640,
								mx: "auto",
								fontSize: { xs: "1rem", md: "1.125rem" },
								fontWeight: 400,
								lineHeight: 1.5,
								letterSpacing: "-0.005em",
								color: theme.palette.text.secondary,
								textWrap: "pretty",
							}}
						>
							Sentencias recientes de la Justicia Nacional con un resumen claro generado con inteligencia artificial por Law Analytics.
						</Typography>
						{total > 0 && (
							<Typography
								sx={{
									mt: 1.25,
									fontSize: "0.8125rem",
									color: theme.palette.text.secondary,
									letterSpacing: "0.02em",
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{/* Con una sola jurisdicción se explicita; con varias, el selector manda */}
								{total.toLocaleString("es-AR")} sentencias
								{byJurisdiccion.length === 1 ? ` · Jurisdicción ${byJurisdiccion[0].jurisdiccion}` : ""} · se actualiza todos los días
							</Typography>
						)}
					</motion.div>
				</Box>

				{/* Filtros */}
				<motion.div
					initial={{ opacity: 0, translateY: 16 }}
					animate={{ opacity: 1, translateY: 0 }}
					transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.2 }}
				>
					<Stack spacing={2} sx={{ mb: { xs: 4, md: 5 } }}>
						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={1.5}
							sx={{ maxWidth: 680, mx: "auto", width: "100%", justifyContent: "center" }}
						>
							<Box component="form" onSubmit={handleSearchSubmit} sx={{ flex: 1, minWidth: 0 }}>
								<TextField
									fullWidth
									size="small"
									placeholder="Buscar por carátula (ej. despido, amparo...)"
									value={searchInput}
									onChange={(event) => setSearchInput(event.target.value)}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<SearchNormal1 size={18} color={theme.palette.text.secondary} />
											</InputAdornment>
										),
									}}
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 2.5,
											bgcolor: alpha(theme.palette.background.paper, isDark ? 0.4 : 0.7),
											transition: "box-shadow 0.25s ease",
											"&.Mui-focused": { boxShadow: `0 6px 18px ${alpha(BRAND_BLUE, 0.12)}` },
										},
									}}
								/>
							</Box>
							<TextField
								select
								size="small"
								value={jurisdiccion}
								onChange={(event) => updateParams({ jurisdiccion: event.target.value || null, page: null })}
								SelectProps={{ native: true }}
								inputProps={{ "aria-label": "Filtrar por jurisdicción" }}
								sx={{
									minWidth: { xs: "100%", sm: 200 },
									"& .MuiOutlinedInput-root": {
										borderRadius: 2.5,
										bgcolor: alpha(theme.palette.background.paper, isDark ? 0.4 : 0.7),
									},
									"& select": { fontSize: "0.875rem" },
								}}
							>
								<option value="">Todas las jurisdicciones</option>
								{byJurisdiccion.map((j) => (
									<option key={j.jurisdiccion} value={j.jurisdiccion}>
										{j.jurisdiccion} ({j.total.toLocaleString("es-AR")})
									</option>
								))}
							</TextField>
						</Stack>
						<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center", rowGap: 1 }}>
							{/* Solo los 8 fueros con más volumen (byFuero viene ordenado desc) —
							    los residuales de 1-2 sentencias ensucian la fila. Si el filtro
							    activo quedó fuera del top, se agrega para que siga visible. */}
							{(() => {
								const top = byFuero.slice(0, 8);
								if (fuero && !top.some((f) => f.fuero === fuero)) {
									const activo = byFuero.find((f) => f.fuero === fuero);
									if (activo) top.push(activo);
								}
								return [{ fuero: "", total: 0, label: "Todos" }, ...top.map((f) => ({ ...f, label: "" }))];
							})().map((f) => {
								const selected = fuero === f.fuero;
								return (
									<Chip
										key={f.fuero || "todos"}
										label={f.label || `${fueroLabel(f.fuero)} (${f.total})`}
										onClick={() => updateParams({ fuero: f.fuero || null, page: null })}
										sx={{
											borderRadius: 1,
											height: 30,
											fontSize: "0.8125rem",
											fontWeight: selected ? 600 : 500,
											letterSpacing: "0.01em",
											fontVariantNumeric: "tabular-nums",
											transition: "all 0.25s ease",
											color: selected ? BRAND_BLUE : theme.palette.text.secondary,
											bgcolor: selected ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) : "transparent",
											border: `1px solid ${selected ? alpha(BRAND_BLUE, isDark ? 0.28 : 0.18) : alpha(theme.palette.divider, 0.7)}`,
											"&:hover": {
												bgcolor: selected ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.12) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.05),
												borderColor: alpha(BRAND_BLUE, 0.3),
												color: selected ? BRAND_BLUE : theme.palette.text.primary,
											},
										}}
									/>
								);
							})}
						</Stack>
					</Stack>
				</motion.div>

				{/* Lista */}
				{loading ? (
					<Grid container spacing={3}>
						{Array.from({ length: 6 }).map((_, i) => (
							<Grid item xs={12} md={6} key={i}>
								<Skeleton variant="rounded" height={208} sx={{ borderRadius: 2 }} />
							</Grid>
						))}
					</Grid>
				) : error ? (
					<Box sx={{ textAlign: "center", py: 8 }}>
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", mb: 1 }}>
							No pudimos cargar las sentencias
						</Typography>
						<Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
							Puede ser un problema momentáneo de conexión. Probá de nuevo en unos minutos.
						</Typography>
					</Box>
				) : items.length === 0 ? (
					<Box sx={{ textAlign: "center", py: 8 }}>
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", mb: 1 }}>
							No encontramos sentencias para esa búsqueda
						</Typography>
						<Typography color="text.secondary" sx={{ fontSize: "0.9rem", mb: 2.5 }}>
							Probá con otra palabra de la carátula, o mirá todas las novedades.
						</Typography>
						<Button
							variant="text"
							color="primary"
							onClick={() => {
								setSearchInput("");
								updateParams({ q: null, fuero: null, page: null });
							}}
							sx={{ fontSize: "0.95rem", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) } }}
						>
							Ver todas las sentencias
						</Button>
					</Box>
				) : (
					<Grid container spacing={3} alignItems="stretch">
						{items.map((item, idx) => (
							<Grid item xs={12} md={6} key={item.id} sx={{ display: "flex" }}>
								<motion.div
									initial={{ opacity: 0, y: 24 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true, margin: "-60px" }}
									transition={{ duration: 0.5, delay: (idx % 2) * 0.06, ease: [0.22, 1, 0.36, 1] }}
									style={{ width: "100%", display: "flex" }}
								>
									<Card
										elevation={0}
										sx={{
											width: "100%",
											borderRadius: 2,
											border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
											bgcolor: "transparent",
											position: "relative",
											transition: "all 0.25s ease",
											"&:hover": {
												transform: { md: "translateY(-4px)" },
												borderColor: alpha(BRAND_BLUE, 0.4),
												boxShadow: `0 12px 28px ${alpha(BRAND_BLUE, 0.1)}, 0 4px 10px ${alpha(BRAND_BLUE, 0.06)}`,
												"& .sentencia-arrow": { transform: "translateX(4px)", color: BRAND_BLUE },
												"& .sentencia-cta": { color: BRAND_BLUE },
											},
										}}
									>
										<CardActionArea
											component={RouterLink}
											to={`/jurisprudencia/${item.id}`}
											sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", borderRadius: "inherit" }}
										>
											<Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.25, height: "100%" }}>
												<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.75, mb: 0.25 }}>
													{item.fuero && (
														<Box
															sx={{
																display: "inline-flex",
																alignItems: "center",
																px: 1,
																py: 0.35,
																borderRadius: 1,
																bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
																border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
															}}
														>
															<Typography
																sx={{
																	fontSize: "0.65rem",
																	fontWeight: 600,
																	letterSpacing: "0.12em",
																	textTransform: "uppercase",
																	color: BRAND_BLUE,
																	lineHeight: 1.2,
																}}
															>
																{fueroLabel(item.fuero)}
															</Typography>
														</Box>
													)}
													{item.fecha && (
														<Typography
															sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" }}
														>
															{formatFecha(item.fecha)}
														</Typography>
													)}
												</Stack>
												<Typography
													sx={{
														fontSize: "1.05rem",
														fontWeight: 600,
														letterSpacing: "-0.01em",
														lineHeight: 1.3,
														color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
													}}
												>
													{item.caratula}
												</Typography>
												{item.saij?.tribunal && (
													<Typography
														sx={{
															fontSize: "0.78rem",
															color: theme.palette.text.secondary,
															textTransform: "capitalize",
															letterSpacing: "0.01em",
														}}
													>
														{item.saij.tribunal.toLowerCase()}
													</Typography>
												)}
												<Typography sx={{ fontSize: "0.88rem", color: theme.palette.text.secondary, lineHeight: 1.55, flex: 1 }}>
													{summaryExcerpt(item.resumen)}
												</Typography>
												<Box
													className="sentencia-cta"
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
														color: theme.palette.text.secondary,
														fontSize: "0.85rem",
														fontWeight: 500,
														transition: "color 0.25s ease",
													}}
												>
													Leer resumen
													<Box className="sentencia-arrow" component="span" sx={{ display: "inline-flex", transition: "all 0.25s ease" }}>
														<ArrowRight size={14} />
													</Box>
												</Box>
											</Box>
										</CardActionArea>
									</Card>
								</motion.div>
							</Grid>
						))}
					</Grid>
				)}

				{/* Paginación */}
				{!loading && !error && totalPages > 1 && (
					<Stack alignItems="center" sx={{ mt: { xs: 4, md: 5 } }}>
						<Pagination
							count={totalPages}
							page={page}
							color="primary"
							shape="rounded"
							onChange={(_event, value) => {
								updateParams({ page: value > 1 ? String(value) : null });
								// Subir al inicio del listado mientras cargan los skeletons.
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						/>
					</Stack>
				)}

				{/* CTA final — panel tintado (patrón guides/Technologies) */}
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				>
					<Box sx={{ mt: { xs: 6, md: 8 } }}>
						<MainCard
							sx={{
								borderRadius: 2,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
								border: `1px solid ${alpha(BRAND_BLUE, 0.18)}`,
							}}
						>
							<Stack
								direction={{ xs: "column", sm: "row" }}
								spacing={{ xs: 2, sm: 4 }}
								alignItems={{ xs: "flex-start", sm: "center" }}
								justifyContent="space-between"
							>
								<Box>
									<Typography variant="h4" sx={{ letterSpacing: "-0.01em", mb: 0.75, textWrap: "balance" }}>
										¿Querés seguir tus propias causas así de fácil?
									</Typography>
									<Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.secondary, lineHeight: 1.55, maxWidth: 520 }}>
										Law Analytics sincroniza tus expedientes con el Poder Judicial y te avisa de cada movimiento, con resúmenes y
										herramientas para tu estudio.
									</Typography>
								</Box>
								<Box sx={{ textAlign: { xs: "left", sm: "center" }, flexShrink: 0 }}>
									<Button
										component={RouterLink}
										to="/register?source=jurisprudencia"
										variant="contained"
										color="primary"
										size="large"
										endIcon={<ArrowRight size={18} color="#fff" />}
										sx={{
											fontSize: "0.92rem",
											fontWeight: 600,
											textTransform: "none",
											borderRadius: 2,
											px: 3,
											height: 44,
											boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.25)}`,
											transition: "all 0.25s ease",
											"&:hover": { boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.35)}`, transform: "translateY(-2px)" },
										}}
									>
										Probar gratis
									</Button>
									<Typography sx={{ mt: 0.75, fontSize: "0.8125rem", color: "#6E6E6E", letterSpacing: "0.02em" }}>
										Sin tarjeta · Registro en 1 minuto
									</Typography>
								</Box>
							</Stack>
						</MainCard>
					</Box>
				</motion.div>
			</Container>
		</Box>
	);
};

export default JurisprudenciaPage;
