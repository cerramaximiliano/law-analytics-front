// Sección PÚBLICA del blog educativo (/educativo).
//
// Artículos educativos de derecho argentino con jurisprudencia asociada.
// Sin auth: consume los endpoints públicos de law-analytics-server.
//
// Diseño: sigue el lenguaje visual de la landing (sections/landing/*) — tokens
// BRAND_BLUE, eyebrow, atmósfera con blob + dot grid, motion spring de entrada,
// stagger de cards y sombras tintadas. Mantener en sync con jurisprudencia/index.tsx.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import {
	Box,
	Button,
	Card,
	CardActionArea,
	Chip,
	Collapse,
	Container,
	Grid,
	InputAdornment,
	Link,
	Pagination,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { ArrowDown2, ArrowRight, ArrowUp2, SearchNormal1 } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import PageBackground from "components/PageBackground";
import SEO from "components/SEO/SEO";
import SectionEyebrow from "sections/landing/SectionEyebrow";
import { getPublicEducativoArticulos, getPublicEducativoTitulos } from "services/publicEducativoService";
import { fueroLabel } from "services/publicSentenciasService";
import type { PublicEducativoListItem, PublicEducativoCategoriaCount, PublicEducativoTituloItem } from "types/publicEducativo";

// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";

const PAGE_SIZE = 12;

function formatFecha(fecha: string | null): string {
	if (!fecha) return "";
	return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const EducativoPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [searchParams, setSearchParams] = useSearchParams();

	const [items, setItems] = useState<PublicEducativoListItem[]>([]);
	const [categorias, setCategorias] = useState<PublicEducativoCategoriaCount[]>([]);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

	// Glosario ("Ver todos los temas"): se carga una sola vez, colapsado por defecto.
	const [titulos, setTitulos] = useState<PublicEducativoTituloItem[]>([]);
	const [glosarioOpen, setGlosarioOpen] = useState(false);

	const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
	const search = searchParams.get("q") || "";
	const categoria = searchParams.get("cat") || "";

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
		getPublicEducativoArticulos({ page, limit: PAGE_SIZE, search: search || undefined, categoria: categoria || undefined })
			.then((response) => {
				if (cancelled) return;
				setItems(response.data.items);
				setCategorias(response.data.categorias || []);
				setTotalPages(Math.max(response.data.pages, 1));
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
	}, [page, search, categoria]);

	// Títulos del glosario: una sola carga, best-effort (si falla no rompe la página).
	useEffect(() => {
		let cancelled = false;
		getPublicEducativoTitulos()
			.then((response) => {
				if (!cancelled) setTitulos(response.data || []);
			})
			.catch(() => {
				// El glosario es secundario: sin datos, simplemente no se muestra.
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Agrupar títulos por categoría preservando el orden del backend (categoría + título).
	const titulosPorCategoria = useMemo(() => {
		const grupos: Array<{ categoria: string; items: PublicEducativoTituloItem[] }> = [];
		titulos.forEach((titulo) => {
			const key = titulo.categoria || "Otros temas";
			const grupo = grupos.find((g) => g.categoria === key);
			if (grupo) grupo.items.push(titulo);
			else grupos.push({ categoria: key, items: [titulo] });
		});
		return grupos;
	}, [titulos]);

	const handleSearchSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		updateParams({ q: searchInput.trim() || null, page: null });
	};

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
			<SEO path="/educativo" />
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
						<SectionEyebrow label="Apuntes · Serie educativa" align="center" mb={2.5} />
						<Typography
							variant="h1"
							sx={{
								fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
								lineHeight: 1.2,
								letterSpacing: "-0.025em",
								textWrap: "balance",
								mb: 2,
								color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
							}}
						>
							Aprendé lo que se aplica{" "}
							{/* Resaltador de la serie Apuntes: la misma marca amarilla de los posts */}
							<Box
								component="span"
								sx={{
									backgroundColor: "#FDE047",
									color: "#16203A",
									boxDecorationBreak: "clone",
									WebkitBoxDecorationBreak: "clone",
									padding: "0.06em 0.25em",
								}}
							>
								en tribunales
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
							Artículos claros sobre derecho argentino, respaldados con la jurisprudencia que los tribunales aplican hoy.
						</Typography>
					</motion.div>
				</Box>

				{/* Filtros: buscador + chips de categoría (patrón jurisprudencia/index.tsx) */}
				<motion.div
					initial={{ opacity: 0, translateY: 16 }}
					animate={{ opacity: 1, translateY: 0 }}
					transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.2 }}
				>
					<Stack spacing={2} sx={{ mb: { xs: 4, md: 5 } }}>
						<Box component="form" onSubmit={handleSearchSubmit} sx={{ maxWidth: 560, mx: "auto", width: "100%" }}>
							<TextField
								fullWidth
								size="small"
								placeholder="Buscar por tema (ej. despido, prescripción...)"
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
						{categorias.length > 0 && (
							<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center", rowGap: 1 }}>
								{[{ categoria: "", total: 0, label: "Todas" }, ...categorias.map((c) => ({ ...c, label: "" }))].map((c) => {
									const selected = categoria === c.categoria;
									return (
										<Chip
											key={c.categoria || "todas"}
											label={c.label || `${c.categoria} (${c.total})`}
											onClick={() => updateParams({ cat: c.categoria || null, page: null })}
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
						)}
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
							No pudimos cargar los artículos
						</Typography>
						<Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
							Puede ser un problema momentáneo de conexión. Probá de nuevo en unos minutos.
						</Typography>
					</Box>
				) : items.length === 0 ? (
					search || categoria ? (
						<Box sx={{ textAlign: "center", py: 8 }}>
							<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", mb: 1 }}>
								No encontramos artículos para esa búsqueda
							</Typography>
							<Typography color="text.secondary" sx={{ fontSize: "0.9rem", mb: 2.5 }}>
								Probá con otra palabra, o mirá todos los artículos.
							</Typography>
							<Button
								variant="text"
								color="primary"
								onClick={() => {
									setSearchInput("");
									updateParams({ q: null, cat: null, page: null });
								}}
								sx={{ fontSize: "0.95rem", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) } }}
							>
								Ver todos los artículos
							</Button>
						</Box>
					) : (
						<Box sx={{ textAlign: "center", py: 8 }}>
							<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", mb: 1 }}>
								Todavía no hay artículos publicados
							</Typography>
							<Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
								Estamos preparando el primer contenido. Volvé a visitarnos pronto.
							</Typography>
						</Box>
					)
				) : (
					<Grid container spacing={3} alignItems="stretch">
						{items.map((item, idx) => (
							<Grid item xs={12} md={6} key={item.slug} sx={{ display: "flex" }}>
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
												"& .articulo-arrow": { transform: "translateX(4px)", color: BRAND_BLUE },
												"& .articulo-cta": { color: BRAND_BLUE },
											},
										}}
									>
										<CardActionArea
											component={RouterLink}
											to={`/educativo/${item.slug}`}
											sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", borderRadius: "inherit" }}
										>
											<Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.25, height: "100%" }}>
												<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.75, mb: 0.25 }}>
													{/* Pill de categoría: variante neutra para distinguirla de los fueros */}
													{item.categoria && (
														<Box
															sx={{
																display: "inline-flex",
																alignItems: "center",
																px: 1,
																py: 0.35,
																borderRadius: 1,
																bgcolor: alpha(theme.palette.text.primary, isDark ? 0.08 : 0.045),
																border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
															}}
														>
															<Typography
																sx={{
																	fontSize: "0.65rem",
																	fontWeight: 600,
																	letterSpacing: "0.12em",
																	textTransform: "uppercase",
																	color: theme.palette.text.secondary,
																	lineHeight: 1.2,
																}}
															>
																{item.categoria}
															</Typography>
														</Box>
													)}
													{item.fueros.map((fuero) => (
														<Box
															key={fuero}
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
																{fueroLabel(fuero)}
															</Typography>
														</Box>
													))}
													{item.publicadoEn && (
														<Typography
															sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" }}
														>
															{formatFecha(item.publicadoEn)}
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
													{item.titulo}
												</Typography>
												<Typography sx={{ fontSize: "0.88rem", color: theme.palette.text.secondary, lineHeight: 1.55, flex: 1 }}>
													{item.resumen}
												</Typography>
												<Box
													className="articulo-cta"
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
													Leer artículo
													<Box className="articulo-arrow" component="span" sx={{ display: "inline-flex", transition: "all 0.25s ease" }}>
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

				{/* Glosario: todos los temas publicados, agrupados por categoría. Colapsado
				    por defecto para no competir con las cards; útil para SEO interno y para
				    quien busca un tema puntual. Solo se muestra si hay artículos publicados. */}
				{titulos.length > 0 && (
					<Box sx={{ mt: { xs: 5, md: 7 } }}>
						<Stack alignItems="center">
							<Button
								variant="text"
								onClick={() => setGlosarioOpen((open) => !open)}
								endIcon={glosarioOpen ? <ArrowUp2 size={16} /> : <ArrowDown2 size={16} />}
								sx={{
									fontSize: "0.9rem",
									fontWeight: 600,
									textTransform: "none",
									color: theme.palette.text.secondary,
									"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06), color: BRAND_BLUE },
								}}
							>
								Ver todos los temas ({titulos.length})
							</Button>
						</Stack>
						<Collapse in={glosarioOpen} timeout="auto" unmountOnExit>
							<Box
								sx={{
									mt: 2,
									p: { xs: 2.5, md: 3.5 },
									borderRadius: 2,
									border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
									bgcolor: alpha(theme.palette.background.paper, isDark ? 0.3 : 0.55),
								}}
							>
								<Grid container spacing={{ xs: 2.5, md: 3 }}>
									{titulosPorCategoria.map((grupo) => (
										<Grid item xs={12} sm={6} md={4} key={grupo.categoria}>
											<Typography
												sx={{
													fontSize: "0.7rem",
													fontWeight: 700,
													letterSpacing: "0.12em",
													textTransform: "uppercase",
													color: BRAND_BLUE,
													mb: 1,
												}}
											>
												{grupo.categoria}
											</Typography>
											<Stack component="ul" spacing={0.5} sx={{ listStyle: "none", m: 0, p: 0 }}>
												{grupo.items.map((titulo) => (
													<Box component="li" key={titulo.slug}>
														<Link
															component={RouterLink}
															to={`/educativo/${titulo.slug}`}
															underline="hover"
															sx={{
																fontSize: "0.85rem",
																lineHeight: 1.45,
																color: theme.palette.text.secondary,
																transition: "color 0.2s ease",
																"&:hover": { color: BRAND_BLUE },
															}}
														>
															{titulo.titulo}
														</Link>
													</Box>
												))}
											</Stack>
										</Grid>
									))}
								</Grid>
							</Box>
						</Collapse>
					</Box>
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
									<Typography variant="h4" sx={{ letterSpacing: "-0.01em", mb: 0.75, textWrap: "balance", lineHeight: 1.4 }}>
										{/* El número es el lead magnet: el corpus propio, con la firma de la serie */}
										<Box
											component="span"
											sx={{
												backgroundColor: "#FDE047",
												color: "#16203A",
												boxDecorationBreak: "clone",
												WebkitBoxDecorationBreak: "clone",
												padding: "0.06em 0.25em",
											}}
										>
											80.000 fallos
										</Box>{" "}
										a un buscador de distancia
									</Typography>
									<Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.secondary, lineHeight: 1.55, maxWidth: 520 }}>
										La jurisprudencia de estos artículos sale de nuestra base. Con tu cuenta gratis la buscás por situación procesal
										— no solo por palabras — y además seguís tus expedientes con alertas de cada movimiento.
									</Typography>
								</Box>
								<Box sx={{ textAlign: { xs: "left", sm: "center" }, flexShrink: 0 }}>
									<Button
										component={RouterLink}
										to="/register?source=educativo"
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
										Crear mi cuenta gratis
									</Button>
									<Typography sx={{ mt: 0.75, fontSize: "0.8125rem", color: "#6E6E6E", letterSpacing: "0.02em" }}>
										Sin tarjeta · Lista en 1 minuto
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

export default EducativoPage;
