// PjnMovementsViewerSection — listado paginado del expediente PJN leído desde
// pjn-movements + viewer del PDF embebido (Fase 7a MVP).
//
// Es una sección nueva que coexiste con el MovementsTable clásico. No reemplaza
// nada existente. Si el folder no es PJN, no se renderiza.

import { useCallback, useEffect, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	CircularProgress,
	IconButton,
	InputAdornment,
	MenuItem,
	Pagination,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
	useTheme,
	Alert,
} from "@mui/material";
import { DocumentText, Eye, ExportSquare, SearchNormal1 } from "iconsax-react";
import PjnPdfViewer from "components/PjnPdfViewer";
import { getPjnMovementsByFolder } from "services/pjnMovementsService";
import type {
	PjnMovement,
	PjnMovementPdfStatus,
	PjnMovementsListResponse,
} from "types/pjnMovement";

interface Props {
	folderId: string;
}

const PDF_STATUS_OPTIONS: { value: PjnMovementPdfStatus | "all"; label: string }[] = [
	{ value: "all", label: "Todos" },
	{ value: "downloaded", label: "PDF disponible" },
	{ value: "pending", label: "PDF pendiente" },
	{ value: "expired", label: "PDF expirado" },
	{ value: "not_applicable", label: "Sin PDF" },
];

function formatDate(iso: string | null): string {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
	} catch {
		return iso;
	}
}

function pdfStatusChip(status: PjnMovementPdfStatus) {
	switch (status) {
		case "downloaded":
			return <Chip size="small" label="PDF" color="success" variant="outlined" />;
		case "pending":
			return <Chip size="small" label="Pendiente" color="info" variant="outlined" />;
		case "expired":
			return <Chip size="small" label="Expirado" color="error" variant="outlined" />;
		case "failed":
			return <Chip size="small" label="Falló" color="warning" variant="outlined" />;
		default:
			return <Chip size="small" label="—" variant="outlined" />;
	}
}

const PjnMovementsViewerSection = ({ folderId }: Props) => {
	const theme = useTheme();
	const [page, setPage] = useState(1);
	const [limit] = useState(20);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [pdfStatusFilter, setPdfStatusFilter] = useState<PjnMovementPdfStatus | "all">("all");

	const [data, setData] = useState<PjnMovementsListResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [viewerOpen, setViewerOpen] = useState(false);
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await getPjnMovementsByFolder(folderId, {
				page,
				limit,
				search: search || undefined,
				pdfStatus: pdfStatusFilter !== "all" ? pdfStatusFilter : undefined,
			});
			setData(res);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? "Error al cargar movimientos");
		} finally {
			setLoading(false);
		}
	}, [folderId, page, limit, search, pdfStatusFilter]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Debounce simple del search input (350ms)
	useEffect(() => {
		const t = setTimeout(() => {
			if (searchInput !== search) {
				setPage(1);
				setSearch(searchInput);
			}
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput, search]);

	const movements = data?.data ?? [];
	const total = data?.count ?? 0;
	const totalPages = data?.pagination?.totalPages ?? 0;

	// Si el folder no tiene causa PJN, el endpoint devuelve count=0 con mensaje
	if (data && total === 0 && !search && pdfStatusFilter === "all" && data.message?.includes("no tiene causa PJN")) {
		return null; // No renderizar nada — mejor UX para folders no-PJN
	}

	const handleOpenViewer = (idx: number) => {
		setSelectedIdx(idx);
		setViewerOpen(true);
	};

	// Prev/next solo navegan entre movimientos con PDF descargado.
	// Movs sin PDF (not_applicable/expired/pending/failed) no son útiles para el viewer.
	const handlePrev = () => {
		if (selectedIdx === null) return;
		for (let i = selectedIdx - 1; i >= 0; i--) {
			if (movements[i].hasPdf) {
				setSelectedIdx(i);
				return;
			}
		}
	};

	const handleNext = () => {
		if (selectedIdx === null) return;
		for (let i = selectedIdx + 1; i < movements.length; i++) {
			if (movements[i].hasPdf) {
				setSelectedIdx(i);
				return;
			}
		}
	};

	const selected = selectedIdx !== null ? movements[selectedIdx] : null;
	// hasPrev/hasNext: ¿existe algún mov anterior/posterior con PDF?
	const hasPrev =
		selectedIdx !== null && movements.slice(0, selectedIdx).some((m) => m.hasPdf);
	const hasNext =
		selectedIdx !== null && movements.slice(selectedIdx + 1).some((m) => m.hasPdf);

	return (
		<Card>
			<CardHeader
				title="Expediente PJN"
				subheader={
					data ? (
						<Typography variant="caption" color="text.secondary">
							{total} movimientos · {data.causa?.causaType}
						</Typography>
					) : null
				}
			/>
			<CardContent>
				{/* Filtros */}
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
					<TextField
						size="small"
						placeholder="Buscar en tipo o detalle..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size="18" />
								</InputAdornment>
							),
						}}
						sx={{ flex: 1, maxWidth: 360 }}
					/>
					<TextField
						select
						size="small"
						label="Estado del PDF"
						value={pdfStatusFilter}
						onChange={(e) => {
							setPage(1);
							setPdfStatusFilter(e.target.value as PjnMovementPdfStatus | "all");
						}}
						sx={{ minWidth: 180 }}
					>
						{PDF_STATUS_OPTIONS.map((opt) => (
							<MenuItem key={opt.value} value={opt.value}>
								{opt.label}
							</MenuItem>
						))}
					</TextField>
				</Stack>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{loading && (
					<Stack alignItems="center" sx={{ py: 4 }}>
						<CircularProgress size={28} />
					</Stack>
				)}

				{!loading && movements.length === 0 && !error && (
					<Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
						{search || pdfStatusFilter !== "all"
							? "No hay movimientos que coincidan con los filtros."
							: "No hay movimientos para este expediente."}
					</Typography>
				)}

				{!loading && movements.length > 0 && (
					<>
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell sx={{ width: 110 }}>Fecha</TableCell>
										<TableCell sx={{ width: 200 }}>Tipo</TableCell>
										<TableCell>Detalle</TableCell>
										<TableCell sx={{ width: 100 }} align="center">PDF</TableCell>
										<TableCell sx={{ width: 80 }} align="right">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{movements.map((m, idx) => (
										<TableRow
											key={m._id}
											hover
											sx={{ cursor: m.hasPdf ? "pointer" : "default" }}
											onClick={() => m.hasPdf && handleOpenViewer(idx)}
										>
											<TableCell>{formatDate(m.fecha)}</TableCell>
											<TableCell>
												<Typography variant="body2" sx={{ fontWeight: 500 }}>
													{m.tipo || "—"}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{
														display: "-webkit-box",
														WebkitLineClamp: 2,
														WebkitBoxOrient: "vertical",
														overflow: "hidden",
													}}
												>
													{m.detalle || "—"}
												</Typography>
											</TableCell>
											<TableCell align="center">{pdfStatusChip(m.pdfStatus)}</TableCell>
											<TableCell align="right">
												<Stack direction="row" spacing={0.5} justifyContent="flex-end">
													{m.hasPdf && (
														<Tooltip title="Ver PDF">
															<IconButton
																size="small"
																color="primary"
																onClick={(e) => {
																	e.stopPropagation();
																	handleOpenViewer(idx);
																}}
															>
																<DocumentText size={18} />
															</IconButton>
														</Tooltip>
													)}
													{!m.hasPdf && m.url && (
														<Tooltip title="Abrir en PJN">
															<IconButton
																size="small"
																href={m.url}
																target="_blank"
																rel="noopener noreferrer"
																onClick={(e) => e.stopPropagation()}
															>
																<ExportSquare size={18} />
															</IconButton>
														</Tooltip>
													)}
												</Stack>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>

						{totalPages > 1 && (
							<Stack alignItems="center" sx={{ mt: 2 }}>
								<Pagination
									count={totalPages}
									page={page}
									onChange={(_, p) => setPage(p)}
									color="primary"
									size="small"
								/>
							</Stack>
						)}
					</>
				)}
			</CardContent>

			<PjnPdfViewer
				open={viewerOpen}
				onClose={() => setViewerOpen(false)}
				folderId={folderId}
				movement={selected}
				onPrev={handlePrev}
				onNext={handleNext}
				hasPrev={hasPrev}
				hasNext={hasNext}
			/>
		</Card>
	);
};

export default PjnMovementsViewerSection;
