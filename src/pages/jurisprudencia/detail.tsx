// Detalle PÚBLICO de una sentencia (/jurisprudencia/:id).
//
// Muestra el resumen generado por IA (nunca los sumarios oficiales de SAIJ), el
// texto completo del fallo y la descarga del PDF servida por nuestro backend.
//
// Diseño: lenguaje visual de la landing (BRAND_BLUE, atmósfera suave, motion
// spring de entrada, panel tintado para el resumen, sombras azules).

import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Skeleton, Stack, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { ArrowDown2, ArrowLeft, ArrowRight, DocumentDownload, DocumentText, InfoCircle } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import PageBackground from "components/PageBackground";
import SEO from "components/SEO/SEO";
import { getPublicSentencia, getPublicSentenciaPdfUrl, fueroLabel } from "services/publicSentenciasService";
import type { PublicSentenciaDetail } from "types/publicSentencia";
import SummaryContent, { summaryExcerpt } from "./SummaryContent";

// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";

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

const JurisprudenciaDetailPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { id } = useParams<{ id: string }>();

	const [sentencia, setSentencia] = useState<PublicSentenciaDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		setLoading(true);
		setNotFound(false);
		setSentencia(null);
		getPublicSentencia(id)
			.then((response) => {
				if (cancelled) return;
				if (response.success && response.data) setSentencia(response.data);
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
	}, [id]);

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 13 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
			<SEO
				path={`/jurisprudencia/${id || ""}`}
				title={sentencia ? `${sentencia.caratula} | Jurisprudencia | Law Analytics` : "Jurisprudencia | Law Analytics"}
				description={
					sentencia ? summaryExcerpt(sentencia.resumen, 160) : "Sentencias de la justicia argentina con resúmenes generados por IA."
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
						to="/jurisprudencia"
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
						Volver a jurisprudencia
					</Button>
				</motion.div>

				{loading ? (
					<Stack spacing={2}>
						<Skeleton variant="text" height={60} />
						<Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
						<Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
					</Stack>
				) : notFound || !sentencia ? (
					<Box sx={{ textAlign: "center", py: 8 }}>
						<Typography
							variant="h2"
							sx={{ fontSize: { xs: "1.5rem", md: "1.875rem" }, letterSpacing: "-0.02em", textWrap: "balance", mb: 1.5 }}
						>
							Sentencia no encontrada
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, mb: 3, textWrap: "pretty" }}>
							Puede que el enlace sea incorrecto o que la sentencia ya no esté disponible.
						</Typography>
						<Button
							component={RouterLink}
							to="/jurisprudencia"
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
							Ver todas las sentencias
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
								<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
									{sentencia.fuero && <MetaPill accent>{fueroLabel(sentencia.fuero)}</MetaPill>}
									{sentencia.fecha && <MetaPill>{formatFecha(sentencia.fecha)}</MetaPill>}
									{sentencia.saij?.numeroFallo && <MetaPill>Fallo N° {sentencia.saij.numeroFallo}</MetaPill>}
								</Stack>
								<Typography
									variant="h1"
									sx={{
										fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" },
										lineHeight: 1.15,
										letterSpacing: "-0.025em",
										textWrap: "balance",
										color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
									}}
								>
									{sentencia.caratula}
								</Typography>
								{sentencia.saij?.tribunal && (
									<Typography
										sx={{
											fontSize: "0.9rem",
											color: theme.palette.text.secondary,
											textTransform: "capitalize",
											letterSpacing: "0.01em",
										}}
									>
										{sentencia.saij.tribunal.toLowerCase()}
										{sentencia.saij.jurisdiccion ? ` — Jurisdicción ${sentencia.saij.jurisdiccion}` : ""}
									</Typography>
								)}
							</Stack>
						</motion.div>

						{/* Resumen IA — panel tintado (patrón Planes highlight) */}
						<motion.div
							initial={{ opacity: 0, translateY: 24 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
						>
							<MainCard
								border={false}
								sx={{
									borderRadius: 2,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
									border: `1px solid ${alpha(BRAND_BLUE, 0.18)}`,
									boxShadow: `0 14px 36px ${alpha(BRAND_BLUE, 0.08)}, 0 6px 14px ${alpha(BRAND_BLUE, 0.05)}`,
									mb: 3,
									p: { xs: 0.5, md: 1.5 },
								}}
							>
								<Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2.5 }}>
									<Box sx={{ mt: 0.25, flexShrink: 0, lineHeight: 0 }}>
										<InfoCircle size={16} color={BRAND_BLUE} />
									</Box>
									<Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, lineHeight: 1.5 }}>
										Resumen generado con inteligencia artificial por Law||Analytics sobre el texto del fallo. No reemplaza la lectura de la
										sentencia completa.
									</Typography>
								</Stack>
								<SummaryContent content={sentencia.resumen} />
							</MainCard>
						</motion.div>

						{/* Texto completo + descarga */}
						<motion.div
							initial={{ opacity: 0, translateY: 24 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.25 }}
						>
							{sentencia.texto && (
								<Accordion
									elevation={0}
									disableGutters
									sx={{
										borderRadius: "16px !important",
										border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
										bgcolor: "transparent",
										mb: 2.5,
										transition: "border-color 0.25s ease, box-shadow 0.25s ease",
										"&:before": { display: "none" },
										"&:hover": {
											borderColor: alpha(BRAND_BLUE, 0.35),
											boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.07)}`,
										},
										"&.Mui-expanded": { borderColor: alpha(BRAND_BLUE, 0.35) },
									}}
								>
									<AccordionSummary expandIcon={<ArrowDown2 size={18} color={theme.palette.text.secondary} />} sx={{ px: 3, py: 0.5 }}>
										<Stack direction="row" spacing={1.5} alignItems="center">
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
												<DocumentText size={18} variant="Bulk" color="currentColor" />
											</Box>
											<Box>
												<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
													Ver sentencia completa
												</Typography>
												{sentencia.paginas && (
													<Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" }}>
														{sentencia.paginas} páginas
													</Typography>
												)}
											</Box>
										</Stack>
									</AccordionSummary>
									<AccordionDetails sx={{ px: 3, pb: 3 }}>
										<Typography
											sx={{
												whiteSpace: "pre-wrap",
												maxHeight: 480,
												overflowY: "auto",
												fontFamily: "monospace",
												fontSize: "0.8rem",
												lineHeight: 1.6,
												color: theme.palette.text.secondary,
												borderTop: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
												pt: 2,
											}}
										>
											{sentencia.texto}
										</Typography>
									</AccordionDetails>
								</Accordion>
							)}

							{sentencia.pdfDisponible && (
								<Stack direction="row" sx={{ mb: { xs: 5, md: 6 } }}>
									<Button
										variant="outlined"
										color="primary"
										startIcon={<DocumentDownload size={18} />}
										href={getPublicSentenciaPdfUrl(sentencia.id)}
										download
										sx={{
											fontSize: "0.9rem",
											fontWeight: 600,
											textTransform: "none",
											borderRadius: 2,
											px: 2.5,
											height: 42,
											borderColor: alpha(BRAND_BLUE, 0.35),
											transition: "all 0.25s ease",
											"&:hover": {
												borderColor: BRAND_BLUE,
												bgcolor: alpha(BRAND_BLUE, 0.05),
												boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.12)}`,
											},
										}}
									>
										Descargar sentencia (PDF)
									</Button>
								</Stack>
							)}
						</motion.div>

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
										<Typography variant="h4" sx={{ letterSpacing: "-0.01em", mb: 0.75, textWrap: "balance" }}>
											Seguí tus causas con resúmenes como este
										</Typography>
										<Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.secondary, lineHeight: 1.55, maxWidth: 480 }}>
											Sincronizá tus expedientes con el Poder Judicial y recibí cada movimiento con herramientas de IA para tu estudio.
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
						</motion.div>
					</>
				)}
			</Container>
		</Box>
	);
};

export default JurisprudenciaDetailPage;
