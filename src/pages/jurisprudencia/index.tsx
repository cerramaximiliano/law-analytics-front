// Sección PÚBLICA de jurisprudencia (/jurisprudencia).
//
// Novedades de sentencias importadas de SAIJ con resumen propio generado por IA.
// Es la landing a la que apuntan los posts de Instagram de jurisprudencia.
// Sin auth: consume los endpoints públicos de law-analytics-server.

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

// icons
import { ArrowRight, Judge, SearchNormal1 } from "iconsax-react";

// project-imports
import SEO from "components/SEO/SEO";
import { getPublicSentencias, fueroLabel } from "services/publicSentenciasService";
import type { PublicSentenciaListItem, PublicSentenciasFueroCount } from "types/publicSentencia";
import { summaryExcerpt } from "./SummaryContent";

const PAGE_SIZE = 12;

function formatFecha(fecha: string | null): string {
	if (!fecha) return "";
	return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const JurisprudenciaPage = () => {
	const theme = useTheme();
	const [searchParams, setSearchParams] = useSearchParams();

	const [items, setItems] = useState<PublicSentenciaListItem[]>([]);
	const [byFuero, setByFuero] = useState<PublicSentenciasFueroCount[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

	const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
	const fuero = searchParams.get("fuero") || "";
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
		getPublicSentencias({ page, limit: PAGE_SIZE, fuero: fuero || undefined, search: search || undefined })
			.then((response) => {
				if (cancelled) return;
				setItems(response.data.items);
				setByFuero(response.data.byFuero);
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
	}, [page, fuero, search]);

	const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

	const handleSearchSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		updateParams({ q: searchInput.trim() || null, page: null });
	};

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 } }}>
			<SEO path="/jurisprudencia" />
			<Container>
				{/* Header */}
				<Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
					<Typography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, mb: 1.5 }}>
						Jurisprudencia
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: "auto" }}>
						Sentencias recientes de la justicia argentina, con un resumen claro generado con inteligencia artificial por Law Analytics.
					</Typography>
				</Box>

				{/* Filtros */}
				<Stack spacing={2} sx={{ mb: 4 }}>
					<Box component="form" onSubmit={handleSearchSubmit} sx={{ maxWidth: 480, mx: "auto", width: "100%" }}>
						<TextField
							fullWidth
							size="small"
							placeholder="Buscar por carátula (ej. despido, amparo...)"
							value={searchInput}
							onChange={(event) => setSearchInput(event.target.value)}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchNormal1 size={18} />
									</InputAdornment>
								),
							}}
						/>
					</Box>
					<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center", rowGap: 1 }}>
						<Chip
							label="Todos"
							color={!fuero ? "primary" : "default"}
							variant={!fuero ? "filled" : "outlined"}
							onClick={() => updateParams({ fuero: null, page: null })}
						/>
						{byFuero.map((f) => (
							<Chip
								key={f.fuero}
								label={`${fueroLabel(f.fuero)} (${f.total})`}
								color={fuero === f.fuero ? "primary" : "default"}
								variant={fuero === f.fuero ? "filled" : "outlined"}
								onClick={() => updateParams({ fuero: f.fuero, page: null })}
							/>
						))}
					</Stack>
				</Stack>

				{/* Lista */}
				{loading ? (
					<Grid container spacing={3}>
						{Array.from({ length: 6 }).map((_, i) => (
							<Grid item xs={12} md={6} key={i}>
								<Skeleton variant="rounded" height={190} />
							</Grid>
						))}
					</Grid>
				) : error ? (
					<Typography align="center" color="text.secondary" sx={{ py: 8 }}>
						No pudimos cargar las sentencias. Intentá de nuevo en unos minutos.
					</Typography>
				) : items.length === 0 ? (
					<Typography align="center" color="text.secondary" sx={{ py: 8 }}>
						No encontramos sentencias para esa búsqueda.
					</Typography>
				) : (
					<Grid container spacing={3}>
						{items.map((item) => (
							<Grid item xs={12} md={6} key={item.id} sx={{ display: "flex" }}>
								<Card
									variant="outlined"
									sx={{
										display: "flex",
										width: "100%",
										borderRadius: 2,
										transition: "box-shadow 0.2s ease, transform 0.2s ease",
										"&:hover": { boxShadow: theme.customShadows?.z1 || 4, transform: "translateY(-2px)" },
									}}
								>
									<CardActionArea component={RouterLink} to={`/jurisprudencia/${item.id}`} sx={{ alignItems: "stretch", height: "100%" }}>
										<Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
											<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
												{item.fuero && <Chip size="small" color="primary" variant="outlined" label={fueroLabel(item.fuero)} />}
												{item.fecha && <Chip size="small" variant="outlined" label={formatFecha(item.fecha)} />}
											</Stack>
											<Typography variant="h5" sx={{ lineHeight: 1.35 }}>
												{item.caratula}
											</Typography>
											{item.saij?.tribunal && (
												<Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
													{item.saij.tribunal.toLowerCase()}
												</Typography>
											)}
											<Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
												{summaryExcerpt(item.resumen)}
											</Typography>
											<Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "primary.main" }}>
												<Typography variant="body2" sx={{ fontWeight: 600 }}>
													Leer resumen
												</Typography>
												<ArrowRight size={16} />
											</Stack>
										</Box>
									</CardActionArea>
								</Card>
							</Grid>
						))}
					</Grid>
				)}

				{/* Paginación */}
				{!loading && !error && totalPages > 1 && (
					<Stack alignItems="center" sx={{ mt: 5 }}>
						<Pagination
							count={totalPages}
							page={page}
							color="primary"
							onChange={(_event, value) => updateParams({ page: value > 1 ? String(value) : null })}
						/>
					</Stack>
				)}

				{/* CTA */}
				<Box
					sx={{
						mt: { xs: 6, md: 10 },
						p: { xs: 3, md: 5 },
						borderRadius: 3,
						textAlign: "center",
						bgcolor: alpha(theme.palette.primary.main, 0.06),
					}}
				>
					<Stack spacing={2} alignItems="center">
						<Judge size={40} color={theme.palette.primary.main} variant="Bulk" />
						<Typography variant="h3">¿Querés seguir tus propias causas así de fácil?</Typography>
						<Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
							Law Analytics sincroniza tus expedientes con el Poder Judicial y te avisa de cada movimiento, con resúmenes y herramientas
							para tu estudio.
						</Typography>
						<Button
							component={RouterLink}
							to="/register?source=jurisprudencia"
							variant="contained"
							size="large"
							endIcon={<ArrowRight size={18} />}
						>
							Probar gratis
						</Button>
					</Stack>
				</Box>
			</Container>
		</Box>
	);
};

export default JurisprudenciaPage;
