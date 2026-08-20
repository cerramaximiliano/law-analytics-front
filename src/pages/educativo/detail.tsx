// Detalle PÚBLICO de un artículo educativo (/educativo/:slug).
//
// Muestra el cuerpo markdown del artículo y la sección "Jurisprudencia sobre el
// tema" con una card por fallo — enlazable a /jurisprudencia/:id cuando el
// fallo está publicado en la sección pública.
//
// Diseño: lenguaje visual de la landing (BRAND_BLUE, atmósfera suave, motion
// spring de entrada, panel tintado, sombras azules). Espejo de
// jurisprudencia/detail.tsx.

import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Button, Card, CardActionArea, Container, Skeleton, Stack, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { ArrowLeft, ArrowRight } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import PageBackground from "components/PageBackground";
import SEO from "components/SEO/SEO";
import { getPublicEducativoArticulo } from "services/publicEducativoService";
import { fueroLabel } from "services/publicSentenciasService";
import type { PublicEducativoDetail, PublicEducativoJurisprudenciaItem } from "types/publicEducativo";
import ArticleContent, { articleExcerpt } from "./ArticleContent";

// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";
// Firma "Apuntes" de la serie educativa (misma que los posts de IG y que
// ArticleContent): resaltador amarillo con tinta oscura.
const EDU_RESALTADOR = "#FDE047";
const EDU_TINTA = "#16203A";

function formatFecha(fecha: string | null): string {
	if (!fecha) return "";
	return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// Pill de metadata (mismo trazo que SectionEyebrow, en gris neutro o azul)
const MetaPill = ({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				px: 1,
				py: 0.35,
				borderRadius: 1,
				bgcolor: accent ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) : alpha(theme.palette.text.primary, isDark ? 0.08 : 0.045),
				border: `1px solid ${accent ? alpha(BRAND_BLUE, isDark ? 0.28 : 0.18) : alpha(theme.palette.divider, 0.8)}`,
			}}
		>
			<Typography
				sx={{
					fontSize: "0.65rem",
					fontWeight: 600,
					letterSpacing: "0.12em",
					textTransform: "uppercase",
					lineHeight: 1.2,
					color: accent ? BRAND_BLUE : theme.palette.text.secondary,
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{children}
			</Typography>
		</Box>
	);
};

// Card de un fallo relacionado: enlazable navega al detalle público de la
// sentencia; sin enlace muestra el caption de conversión.
const FalloCard = ({ fallo }: { fallo: PublicEducativoJurisprudenciaItem }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const enlazable = fallo.enlazable && fallo.sentenciaId;

	const contenido = (
		<Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1, height: "100%" }}>
			<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
				{fallo.fuero && <MetaPill accent>{fueroLabel(fallo.fuero)}</MetaPill>}
				{fallo.fecha && <MetaPill>{formatFecha(fallo.fecha)}</MetaPill>}
			</Stack>
			<Typography
				sx={{
					fontSize: "0.95rem",
					fontWeight: 600,
					letterSpacing: "-0.01em",
					lineHeight: 1.35,
					color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
				}}
			>
				{fallo.caratula}
			</Typography>
			{fallo.tribunal && (
				<Typography
					sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, textTransform: "capitalize", letterSpacing: "0.01em" }}
				>
					{fallo.tribunal.toLowerCase()}
				</Typography>
			)}
			{fallo.comentario && (
				<Typography sx={{ fontSize: "0.88rem", color: theme.palette.text.secondary, lineHeight: 1.55, flex: 1 }}>
					{fallo.comentario}
				</Typography>
			)}
			{enlazable ? (
				<Box
					className="fallo-cta"
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
					Leer el fallo
					<Box className="fallo-arrow" component="span" sx={{ display: "inline-flex", transition: "all 0.25s ease" }}>
						<ArrowRight size={14} />
					</Box>
				</Box>
			) : (
				<Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, fontStyle: "italic" }}>
					Buscá este fallo y 80.000 más desde tu cuenta
				</Typography>
			)}
		</Box>
	);

	return (
		<Card
			elevation={0}
			sx={{
				borderRadius: 2,
				border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
				bgcolor: "transparent",
				transition: "all 0.25s ease",
				...(enlazable && {
					"&:hover": {
						transform: { md: "translateY(-3px)" },
						borderColor: alpha(BRAND_BLUE, 0.4),
						boxShadow: `0 12px 28px ${alpha(BRAND_BLUE, 0.1)}, 0 4px 10px ${alpha(BRAND_BLUE, 0.06)}`,
						"& .fallo-arrow": { transform: "translateX(4px)", color: BRAND_BLUE },
						"& .fallo-cta": { color: BRAND_BLUE },
					},
				}),
			}}
		>
			{enlazable ? (
				<CardActionArea
					component={RouterLink}
					to={`/jurisprudencia/${fallo.sentenciaId}`}
					sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", borderRadius: "inherit" }}
				>
					{contenido}
				</CardActionArea>
			) : (
				contenido
			)}
		</Card>
	);
};

const EducativoDetailPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { slug } = useParams<{ slug: string }>();

	const [articulo, setArticulo] = useState<PublicEducativoDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		if (!slug) return;
		let cancelled = false;
		setLoading(true);
		setNotFound(false);
		setArticulo(null);
		getPublicEducativoArticulo(slug)
			.then((response) => {
				if (cancelled) return;
				if (response.success && response.data) setArticulo(response.data);
				else setNotFound(true);
			})
			.catch(() => {
				if (!cancelled) setNotFound(true);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [slug]);

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 13 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
			<SEO
				path={`/educativo/${slug || ""}`}
				title={articulo?.seo?.title || (articulo ? `${articulo.titulo} | Blog educativo | Law Analytics` : "Blog educativo | Law Analytics")}
				description={
					articulo?.seo?.description ||
					(articulo
						? articulo.resumen || articleExcerpt(articulo.cuerpo, 160)
						: "Artículos educativos sobre derecho argentino con jurisprudencia aplicada.")
				}
			/>
			<PageBackground variant="light" />

			{/* Atmósfera: blob suave superior */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: { xs: "-10%", md: "-18%" },
					left: "50%",
					transform: "translateX(-50%)",
					width: { xs: 600, md: 1000 },
					height: { xs: 380, md: 560 },
					borderRadius: "50%",
					background: `radial-gradient(ellipse at center, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)} 0%, transparent 65%)`,
					filter: "blur(90px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
				<motion.div
					initial={{ opacity: 0, translateY: 16 }}
					animate={{ opacity: 1, translateY: 0 }}
					transition={{ type: "spring", stiffness: 150, damping: 30 }}
				>
					<Button
						component={RouterLink}
						to="/educativo"
						startIcon={<ArrowLeft size={16} />}
						sx={{
							mb: 3,
							fontSize: "0.875rem",
							fontWeight: 500,
							textTransform: "none",
							color: theme.palette.text.secondary,
							"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, 0.06) },
						}}
					>
						Volver al blog
					</Button>
				</motion.div>

				{loading ? (
					<Stack spacing={2}>
						<Skeleton variant="text" height={60} />
						<Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
						<Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
					</Stack>
				) : notFound || !articulo ? (
					<Box sx={{ textAlign: "center", py: 8 }}>
						<Typography
							variant="h2"
							sx={{ fontSize: { xs: "1.5rem", md: "1.875rem" }, letterSpacing: "-0.02em", textWrap: "balance", mb: 1.5 }}
						>
							Artículo no encontrado
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, mb: 3, textWrap: "pretty" }}>
							Puede que el enlace sea incorrecto o que el artículo ya no esté disponible.
						</Typography>
						<Button
							component={RouterLink}
							to="/educativo"
							variant="contained"
							color="primary"
							sx={{
								fontSize: "0.92rem",
								fontWeight: 600,
								textTransform: "none",
								borderRadius: 2,
								px: 3,
								height: 44,
								boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.25)}`,
								"&:hover": { boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.35)}`, transform: "translateY(-2px)" },
							}}
						>
							Ver todos los artículos
						</Button>
					</Box>
				) : (
					<>
						{/* Encabezado */}
						<motion.div
							initial={{ opacity: 0, translateY: 24 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.05 }}
						>
							<Stack spacing={1.5} sx={{ mb: { xs: 3, md: 4 } }}>
								<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
									{/* Banda de la serie: "Apuntes" resaltado, como en los posts */}
									<Box sx={{ display: "inline-flex", alignItems: "center", px: 1, py: 0.35, backgroundColor: EDU_RESALTADOR }}>
										<Typography
											sx={{
												fontSize: "0.65rem",
												fontWeight: 700,
												letterSpacing: "0.16em",
												textTransform: "uppercase",
												lineHeight: 1.2,
												color: EDU_TINTA,
											}}
										>
											Apuntes
										</Typography>
									</Box>
									<MetaPill accent>Serie educativa</MetaPill>
									{articulo.publicadoEn && <MetaPill>{formatFecha(articulo.publicadoEn)}</MetaPill>}
								</Stack>
								<Typography
									variant="h1"
									sx={{
										fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" },
										lineHeight: 1.35,
										letterSpacing: "-0.025em",
										textWrap: "balance",
									}}
								>
									{/* Título con el resaltador de la serie, como la portada del carrusel */}
									<Box
										component="span"
										sx={{
											backgroundColor: EDU_RESALTADOR,
											color: EDU_TINTA,
											boxDecorationBreak: "clone",
											WebkitBoxDecorationBreak: "clone",
											padding: "0.08em 0.3em",
										}}
									>
										{articulo.titulo}
									</Box>
								</Typography>
								{articulo.resumen && (
									<Typography sx={{ fontSize: "1rem", color: theme.palette.text.secondary, lineHeight: 1.55, textWrap: "pretty" }}>
										{articulo.resumen}
									</Typography>
								)}
							</Stack>
						</motion.div>

						{/* Cuerpo del artículo */}
						<motion.div
							initial={{ opacity: 0, translateY: 24 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
						>
							<Box sx={{ mb: { xs: 5, md: 6 } }}>
								<ArticleContent content={articulo.cuerpo} />
							</Box>
						</motion.div>

						{/* Jurisprudencia sobre el tema */}
						{articulo.jurisprudencia.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 24 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-60px" }}
								transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
							>
								<Box sx={{ mb: { xs: 5, md: 6 } }}>
									<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
										{/* La firma § de la serie de jurisprudencia: conecta esta
										    sección con la identidad de los carruseles de fallos */}
										<Box
											sx={{
												width: 36,
												height: 36,
												borderRadius: 1.5,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.07),
												color: BRAND_BLUE,
												flexShrink: 0,
											}}
										>
											<Typography sx={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1 }}>§</Typography>
										</Box>
										<Typography variant="h3" sx={{ fontSize: { xs: "1.15rem", md: "1.3rem" }, letterSpacing: "-0.015em" }}>
											Jurisprudencia sobre el tema
										</Typography>
									</Stack>
									<Stack spacing={2}>
										{articulo.jurisprudencia.map((fallo, i) => (
											<FalloCard key={fallo.sentenciaId || `${fallo.caratula}-${i}`} fallo={fallo} />
										))}
									</Stack>
								</Box>
							</motion.div>
						)}

						{/* CTA final — panel tintado (patrón guides/Technologies) */}
						<motion.div
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						>
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
											{/* Contexto máximo: el lector acaba de leer fallos de esta base */}
											Estos fallos salen de una base de{" "}
											<Box
												component="span"
												sx={{
													backgroundColor: EDU_RESALTADOR,
													color: EDU_TINTA,
													boxDecorationBreak: "clone",
													WebkitBoxDecorationBreak: "clone",
													padding: "0.06em 0.25em",
												}}
											>
												80.000
											</Box>
										</Typography>
										<Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.secondary, lineHeight: 1.55, maxWidth: 480 }}>
											Buscalos gratis por situación procesal — no solo por palabras — y seguí tus expedientes con alertas de cada
											movimiento.
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
						</motion.div>
					</>
				)}
			</Container>
		</Box>
	);
};

export default EducativoDetailPage;
