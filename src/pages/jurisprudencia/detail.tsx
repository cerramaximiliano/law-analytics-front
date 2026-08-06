// Detalle PÚBLICO de una sentencia (/jurisprudencia/:id).
//
// Muestra el resumen generado por IA (nunca los sumarios oficiales de SAIJ), el
// texto completo del fallo y la descarga del PDF servida por nuestro backend.

import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Chip,
	Container,
	Divider,
	Paper,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";

// icons
import { ArrowDown2, ArrowLeft, ArrowRight, DocumentDownload, DocumentText, InfoCircle } from "iconsax-react";

// project-imports
import SEO from "components/SEO/SEO";
import { getPublicSentencia, getPublicSentenciaPdfUrl, fueroLabel } from "services/publicSentenciasService";
import type { PublicSentenciaDetail } from "types/publicSentencia";
import SummaryContent, { summaryExcerpt } from "./SummaryContent";

function formatFecha(fecha: string | null): string {
	if (!fecha) return "";
	return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const JurisprudenciaDetailPage = () => {
	const theme = useTheme();
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
		<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 } }}>
			<SEO
				path={`/jurisprudencia/${id || ""}`}
				title={sentencia ? `${sentencia.caratula} | Jurisprudencia | Law Analytics` : "Jurisprudencia | Law Analytics"}
				description={
					sentencia ? summaryExcerpt(sentencia.resumen, 160) : "Sentencias de la justicia argentina con resúmenes generados por IA."
				}
			/>
			<Container maxWidth="md">
				<Button component={RouterLink} to="/jurisprudencia" startIcon={<ArrowLeft size={16} />} sx={{ mb: 3 }} color="secondary">
					Volver a jurisprudencia
				</Button>

				{loading ? (
					<Stack spacing={2}>
						<Skeleton variant="text" height={60} />
						<Skeleton variant="rounded" height={120} />
						<Skeleton variant="rounded" height={320} />
					</Stack>
				) : notFound || !sentencia ? (
					<Box sx={{ textAlign: "center", py: 8 }}>
						<Typography variant="h3" sx={{ mb: 1.5 }}>
							Sentencia no encontrada
						</Typography>
						<Typography color="text.secondary" sx={{ mb: 3 }}>
							Puede que el enlace sea incorrecto o que la sentencia ya no esté disponible.
						</Typography>
						<Button component={RouterLink} to="/jurisprudencia" variant="contained">
							Ver todas las sentencias
						</Button>
					</Box>
				) : (
					<>
						{/* Encabezado */}
						<Stack spacing={1.5} sx={{ mb: 4 }}>
							<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
								{sentencia.fuero && <Chip size="small" color="primary" variant="outlined" label={fueroLabel(sentencia.fuero)} />}
								{sentencia.fecha && <Chip size="small" variant="outlined" label={formatFecha(sentencia.fecha)} />}
								{sentencia.saij?.numeroFallo && <Chip size="small" variant="outlined" label={`Fallo N° ${sentencia.saij.numeroFallo}`} />}
							</Stack>
							<Typography variant="h1" sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, lineHeight: 1.3 }}>
								{sentencia.caratula}
							</Typography>
							{sentencia.saij?.tribunal && (
								<Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
									{sentencia.saij.tribunal.toLowerCase()}
									{sentencia.saij.jurisdiccion ? ` — Jurisdicción ${sentencia.saij.jurisdiccion}` : ""}
								</Typography>
							)}
						</Stack>

						{/* Resumen IA */}
						<Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 3 }}>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
								<InfoCircle size={18} color={theme.palette.primary.main} />
								<Typography variant="caption" color="text.secondary">
									Resumen generado con inteligencia artificial por Law Analytics sobre el texto del fallo. No reemplaza la lectura de la
									sentencia completa.
								</Typography>
							</Stack>
							<SummaryContent content={sentencia.resumen} />
						</Paper>

						{/* Texto completo */}
						{sentencia.texto && (
							<Accordion variant="outlined" sx={{ borderRadius: "12px !important", mb: 3, "&:before": { display: "none" } }}>
								<AccordionSummary expandIcon={<ArrowDown2 size={18} />}>
									<Stack direction="row" spacing={1} alignItems="center">
										<DocumentText size={18} color={theme.palette.primary.main} />
										<Typography variant="h6">Ver sentencia completa{sentencia.paginas ? ` (${sentencia.paginas} páginas)` : ""}</Typography>
									</Stack>
								</AccordionSummary>
								<AccordionDetails>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ whiteSpace: "pre-wrap", maxHeight: 480, overflowY: "auto", fontFamily: "monospace", fontSize: "0.8rem" }}
									>
										{sentencia.texto}
									</Typography>
								</AccordionDetails>
							</Accordion>
						)}

						{/* Descarga (PDF servido por nuestro backend) */}
						{sentencia.pdfDisponible && (
							<Stack direction="row" sx={{ mb: 5 }}>
								<Button
									variant="outlined"
									startIcon={<DocumentDownload size={18} />}
									href={getPublicSentenciaPdfUrl(sentencia.id)}
									download
								>
									Descargar sentencia (PDF)
								</Button>
							</Stack>
						)}

						<Divider sx={{ mb: 4 }} />

						{/* CTA */}
						<Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
							<Stack spacing={2} alignItems="center">
								<Typography variant="h4">Seguí tus causas con resúmenes como este</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
									Sincronizá tus expedientes con el Poder Judicial y recibí cada movimiento con herramientas de IA para tu estudio.
								</Typography>
								<Button component={RouterLink} to="/register?source=jurisprudencia" variant="contained" endIcon={<ArrowRight size={18} />}>
									Probar Law Analytics gratis
								</Button>
							</Stack>
						</Box>
					</>
				)}
			</Container>
		</Box>
	);
};

export default JurisprudenciaDetailPage;
