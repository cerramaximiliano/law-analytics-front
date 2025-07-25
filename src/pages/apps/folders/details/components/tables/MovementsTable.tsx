import React, { useState, useEffect } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	TablePagination,
	Chip,
	Stack,
	IconButton,
	Tooltip,
	Box,
	Typography,
	Skeleton,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { Edit, Trash, Eye, Link2, DocumentText, Judge, NotificationStatus, Status, Clock, TickCircle } from "iconsax-react";
import { Movement, PaginationInfo, PjnAccess } from "types/movements";
import { format, parse, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { visuallyHidden } from "@mui/utils";
import { dispatch } from "store";
import { getMovementsByFolderId, toggleMovementComplete } from "store/reducers/movements";
import { useParams } from "react-router";
import PDFViewer from "components/shared/PDFViewer";
import PaginationWithJump from "components/shared/PaginationWithJump";
import PjnAccessAlert from "components/shared/PjnAccessAlert";

interface MovementsTableProps {
	movements: Movement[];
	searchQuery: string;
	onEdit: (movement: Movement) => void;
	onDelete: (id: string) => void;
	onView: (movement: Movement) => void;
	filters?: any;
	pagination?: PaginationInfo;
	isLoading?: boolean;
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	documentsInThisPage?: number;
	pjnAccess?: PjnAccess;
}

type Order = "asc" | "desc";

interface HeadCell {
	id: keyof Movement | "actions";
	label: string;
	numeric: boolean;
	width?: string | number;
}

const headCells: HeadCell[] = [
	{ id: "time", label: "Fecha", numeric: false, width: "100px" },
	{ id: "title", label: "Título", numeric: false, width: "30%" },
	{ id: "movement", label: "Tipo", numeric: false, width: "130px" },
	{ id: "description", label: "Descripción", numeric: false },
	{ id: "dateExpiration", label: "Vencimiento", numeric: false, width: "120px" },
	{ id: "link", label: "Documento", numeric: false, width: "80px" },
	{ id: "actions", label: "Acciones", numeric: false, width: "140px" },
];

const getMovementIcon = (movement?: string) => {
	switch (movement) {
		case "Escrito-Actor":
		case "Escrito-Demandado":
			return <DocumentText size={16} />;
		case "Despacho":
			return <Judge size={16} />;
		case "Cédula":
		case "Oficio":
			return <NotificationStatus size={16} />;
		case "Evento":
			return <Status size={16} />;
		default:
			return <DocumentText size={16} />;
	}
};

const getMovementColor = (movement?: string): "success" | "error" | "secondary" | "primary" | "warning" | "default" => {
	switch (movement) {
		case "Escrito-Actor":
			return "success";
		case "Escrito-Demandado":
			return "error";
		case "Despacho":
			return "secondary";
		case "Cédula":
		case "Oficio":
			return "primary";
		case "Evento":
			return "warning";
		default:
			return "default";
	}
};

const parseDate = (dateString: string) => {
	try {
		// Try to parse as ISO date first
		if (dateString.includes("T") || dateString.includes("-")) {
			const parsedDate = parseISO(dateString);
			if (isValid(parsedDate)) {
				return parsedDate;
			}
		}

		// Try to parse as DD/MM/YYYY format
		const parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
		if (isValid(parsedDate)) {
			return parsedDate;
		}

		return new Date(0);
	} catch {
		return new Date(0);
	}
};

const formatDate = (dateString: string) => {
	if (!dateString || dateString.trim() === "") {
		return "";
	}

	try {
		let parsedDate: Date;

		// Try to parse as ISO date first
		if (dateString.includes("T") || dateString.includes("-")) {
			parsedDate = parseISO(dateString);
			if (isValid(parsedDate)) {
				return format(parsedDate, "dd/MM/yyyy", { locale: es });
			}
		}

		// Try to parse as DD/MM/YYYY format
		parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
		if (isValid(parsedDate)) {
			return format(parsedDate, "dd/MM/yyyy", { locale: es });
		}

		return "";
	} catch {
		return "";
	}
};

const MovementsTable: React.FC<MovementsTableProps> = ({
	movements,
	searchQuery,
	onEdit,
	onDelete,
	onView,
	filters = {},
	pagination,
	isLoading,
	totalWithLinks,
	documentsBeforeThisPage,
	documentsInThisPage,
	pjnAccess,
}) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [order, setOrder] = useState<Order>("desc");
	const [orderBy, setOrderBy] = useState<keyof Movement>("time");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
	const [localFilters, setLocalFilters] = useState(filters);

	// Estados para el visor de PDF
	const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
	const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>("");
	const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>("");
	const [selectedMovementId, setSelectedMovementId] = useState<string>("");
	const [isLoadingMoreForPdf, setIsLoadingMoreForPdf] = useState(false);

	// Actualizar valores locales cuando cambien las props
	useEffect(() => {
		setLocalSearchQuery(searchQuery);
	}, [searchQuery]);

	useEffect(() => {
		setLocalFilters(filters);
	}, [filters]);

	const handleRequestSort = (property: keyof Movement) => {
		const isAsc = orderBy === property && order === "asc";
		const newOrder = isAsc ? "desc" : "asc";
		setOrder(newOrder);
		setOrderBy(property);

		// Llamar al servidor con el ordenamiento
		if (id) {
			// Formato del sort: campo para ascendente, -campo para descendente
			const sortParam = newOrder === "desc" ? `-${property}` : property;

			dispatch(
				getMovementsByFolderId(id, {
					page: page + 1,
					limit: rowsPerPage,
					search: localSearchQuery,
					sort: sortParam,
					filter: {
						movement: localFilters.type,
						dateRange:
							localFilters.startDate && localFilters.endDate
								? `${format(localFilters.startDate, "yyyy-MM-dd")},${format(localFilters.endDate, "yyyy-MM-dd")}`
								: undefined,
					},
				}),
			);
		}
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
		// Llamar al servidor con nueva página
		if (id) {
			const sortParam = order === "desc" ? `-${orderBy}` : orderBy;
			dispatch(
				getMovementsByFolderId(id, {
					page: newPage + 1, // La API usa base 1, MUI usa base 0
					limit: rowsPerPage,
					search: localSearchQuery,
					sort: sortParam,
					filter: {
						movement: localFilters.type,
						dateRange:
							localFilters.startDate && localFilters.endDate
								? `${format(localFilters.startDate, "yyyy-MM-dd")},${format(localFilters.endDate, "yyyy-MM-dd")}`
								: undefined,
					},
				}),
			);
		}
	};

	// Wrapper para la paginación personalizada
	const handlePageChange = (newPage: number) => {
		handleChangePage(null, newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newRowsPerPage = parseInt(event.target.value, 10);
		setRowsPerPage(newRowsPerPage);
		setPage(0);
		// Llamar al servidor con nuevo límite
		if (id) {
			const sortParam = order === "desc" ? `-${orderBy}` : orderBy;
			dispatch(
				getMovementsByFolderId(id, {
					page: 1,
					limit: newRowsPerPage,
					search: localSearchQuery,
					sort: sortParam,
					filter: {
						movement: localFilters.type,
						dateRange:
							localFilters.startDate && localFilters.endDate
								? `${format(localFilters.startDate, "yyyy-MM-dd")},${format(localFilters.endDate, "yyyy-MM-dd")}`
								: undefined,
					},
				}),
			);
		}
	};

	// Efecto para recargar datos cuando cambien los filtros o búsqueda
	useEffect(() => {
		if (id && (searchQuery !== localSearchQuery || JSON.stringify(filters) !== JSON.stringify(localFilters))) {
			setPage(0); // Reset a primera página
			const sortParam = order === "desc" ? `-${orderBy}` : orderBy;
			dispatch(
				getMovementsByFolderId(id, {
					page: 1,
					limit: rowsPerPage,
					search: searchQuery,
					sort: sortParam,
					filter: {
						movement: filters.type,
						dateRange:
							filters.startDate && filters.endDate
								? `${format(filters.startDate, "yyyy-MM-dd")},${format(filters.endDate, "yyyy-MM-dd")}`
								: undefined,
					},
				}),
			);
		}
	}, [id, searchQuery, filters, rowsPerPage, order, orderBy]);

	// Sincronizar página con paginación del servidor
	useEffect(() => {
		if (pagination && pagination.page - 1 !== page) {
			setPage(pagination.page - 1);
		}
	}, [pagination]);

	// Detectar cuando el movimiento seleccionado ya no está en la lista actual
	useEffect(() => {
		if (pdfViewerOpen && selectedMovementId) {
			const currentMovementExists = movements.some((m) => m._id === selectedMovementId);
			if (!currentMovementExists && movements.length > 0) {
				// Si el movimiento seleccionado no está en la lista actual,
				// pero hay movimientos disponibles, seleccionar el primero con link
				const firstWithLink = movements.find((m) => m.link);
				if (firstWithLink) {
					handlePdfNavigate(firstWithLink);
				}
			}
		}
	}, [movements, selectedMovementId, pdfViewerOpen]);

	// Manejar navegación en el PDF viewer
	const handlePdfNavigate = (movement: Movement) => {
		setSelectedPdfUrl(movement.link || "");
		setSelectedPdfTitle(movement.title || "Documento");
		setSelectedMovementId(movement._id || "");
	};

	// Cargar más movimientos para el PDF viewer (página siguiente)
	const handleRequestNextPageForPdf = async () => {
		if (id && pagination?.hasNext && !isLoadingMoreForPdf) {
			setIsLoadingMoreForPdf(true);
			const sortParam = order === "desc" ? `-${orderBy}` : orderBy;

			const result = await dispatch(
				getMovementsByFolderId(id, {
					page: (pagination.page || 1) + 1,
					limit: rowsPerPage,
					search: localSearchQuery,
					sort: sortParam,
					filter: {
						movement: localFilters.type,
						dateRange:
							localFilters.startDate && localFilters.endDate
								? `${format(localFilters.startDate, "yyyy-MM-dd")},${format(localFilters.endDate, "yyyy-MM-dd")}`
								: undefined,
					},
				}),
			);

			setIsLoadingMoreForPdf(false);

			// Si se cargó exitosamente, navegar al primer documento con link de la nueva página
			if (result.success && result.movements) {
				const movementsWithLinks = result.movements.filter((m: Movement) => m.link);
				if (movementsWithLinks.length > 0) {
					const firstMovement = movementsWithLinks[0];
					// Pequeño delay para asegurar que el state se actualice
					setTimeout(() => {
						handlePdfNavigate(firstMovement);
					}, 100);
				}
			}
		}
	};

	// Cargar página anterior para el PDF viewer
	const handleRequestPreviousPageForPdf = async () => {
		if (id && pagination?.hasPrev && !isLoadingMoreForPdf) {
			setIsLoadingMoreForPdf(true);
			const sortParam = order === "desc" ? `-${orderBy}` : orderBy;

			const result = await dispatch(
				getMovementsByFolderId(id, {
					page: (pagination.page || 1) - 1,
					limit: rowsPerPage,
					search: localSearchQuery,
					sort: sortParam,
					filter: {
						movement: localFilters.type,
						dateRange:
							localFilters.startDate && localFilters.endDate
								? `${format(localFilters.startDate, "yyyy-MM-dd")},${format(localFilters.endDate, "yyyy-MM-dd")}`
								: undefined,
					},
				}),
			);

			setIsLoadingMoreForPdf(false);

			// Si se cargó exitosamente, navegar al último documento con link de la página
			if (result.success && result.movements) {
				const movementsWithLinks = result.movements.filter((m: Movement) => m.link);
				if (movementsWithLinks.length > 0) {
					const lastMovement = movementsWithLinks[movementsWithLinks.length - 1];
					handlePdfNavigate(lastMovement);
				}
			}
		}
	};

	// Manejar el toggle de completitud
	const handleToggleComplete = async (movementId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const result = await dispatch(toggleMovementComplete(movementId));
		if (!result.success) {
			console.error("Error al cambiar el estado del movimiento:", result.error);
		}
	};

	return (
		<Box>
			<PjnAccessAlert pjnAccess={pjnAccess} />
			<TableContainer>
				<Table sx={{ minWidth: 750 }} size="medium">
					<TableHead>
						<TableRow key="header-row">
							{headCells.map((headCell) => (
								<TableCell
									key={headCell.id}
									align={headCell.numeric ? "right" : "left"}
									sortDirection={orderBy === headCell.id ? order : false}
									sx={{ width: headCell.width }}
								>
									{headCell.id !== "actions" ? (
										<TableSortLabel
											active={orderBy === headCell.id}
											direction={orderBy === headCell.id ? order : "asc"}
											onClick={() => handleRequestSort(headCell.id as keyof Movement)}
										>
											{headCell.label}
											{orderBy === headCell.id ? (
												<Box component="span" sx={visuallyHidden}>
													{order === "desc" ? "sorted descending" : "sorted ascending"}
												</Box>
											) : null}
										</TableSortLabel>
									) : (
										headCell.label
									)}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{isLoading ? (
							[...Array(rowsPerPage)].map((_, index) => (
								<TableRow key={`skeleton-${index}`}>
									<TableCell>
										<Skeleton variant="text" width={80} />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width="90%" />
									</TableCell>
									<TableCell>
										<Skeleton variant="rectangular" width={100} height={24} />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width="80%" />
									</TableCell>
									<TableCell>
										<Skeleton variant="rectangular" width={100} height={24} />
									</TableCell>
									<TableCell>
										<Skeleton variant="circular" width={30} height={30} />
									</TableCell>
									<TableCell>
										<Stack direction="row" spacing={0.5}>
											<Skeleton variant="circular" width={32} height={32} />
											<Skeleton variant="circular" width={32} height={32} />
											<Skeleton variant="circular" width={32} height={32} />
										</Stack>
									</TableCell>
								</TableRow>
							))
						) : movements.length === 0 ? (
							<TableRow key="no-data-row">
								<TableCell colSpan={headCells.length} align="center">
									<Typography variant="subtitle1" color="textSecondary" sx={{ py: 3 }}>
										No se encontraron movimientos
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							movements.map((movement) => {
								return (
									<TableRow hover tabIndex={-1} key={movement._id} sx={{ cursor: "pointer" }}>
										<TableCell>{formatDate(movement.time)}</TableCell>
										<TableCell>
											<Box sx={{ maxWidth: 400 }}>
												<Typography
													variant="subtitle2"
													sx={{
														display: "-webkit-box",
														WebkitLineClamp: 2,
														WebkitBoxOrient: "vertical",
														overflow: "hidden",
														textOverflow: "ellipsis",
														lineHeight: 1.4,
														wordBreak: "break-word",
													}}
												>
													{movement.title}
												</Typography>
												{movement.source === "pjn" && (
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{
															fontStyle: "italic",
															fontSize: "0.7rem",
															mt: 0.5,
															display: "block",
														}}
													>
														Sincronizado • PJN
													</Typography>
												)}
											</Box>
										</TableCell>
										<TableCell>
											<Chip
												icon={getMovementIcon(movement.movement)}
												label={movement.movement}
												color={getMovementColor(movement.movement)}
												size="small"
												variant="outlined"
											/>
										</TableCell>
										<TableCell>
											<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300 }} noWrap>
												{movement.description || "-"}
											</Typography>
										</TableCell>
										<TableCell>
											{movement.dateExpiration
												? (() => {
														const expirationDate = parseDate(movement.dateExpiration);
														const today = new Date();
														today.setHours(0, 0, 0, 0);
														const isExpired = !movement.completed && expirationDate < today;
														const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
														const isNearExpiration = !movement.completed && daysUntilExpiration >= 0 && daysUntilExpiration <= 7;

														return (
															<Stack direction="row" spacing={0.5} alignItems="center">
																<Chip
																	label={formatDate(movement.dateExpiration)}
																	color={movement.completed ? "default" : isExpired ? "error" : isNearExpiration ? "warning" : "success"}
																	size="small"
																	variant={isExpired ? "filled" : "outlined"}
																	icon={
																		isExpired ? (
																			<Clock size={14} style={{ color: "inherit" }} />
																		) : isNearExpiration ? (
																			<Clock size={14} style={{ color: "inherit" }} />
																		) : undefined
																	}
																	sx={{
																		fontWeight: isExpired ? 600 : 500,
																		"& .MuiChip-icon": {
																			marginLeft: "4px",
																			marginRight: "-2px",
																		},
																	}}
																/>
																{movement.completed && (
																	<Typography variant="caption" color="text.secondary" fontWeight={500}>
																		Completado
																	</Typography>
																)}
																{isExpired && (
																	<Typography variant="caption" color="error" fontWeight={600}>
																		Vencido
																	</Typography>
																)}
																{isNearExpiration && !isExpired && (
																	<Typography variant="caption" color="warning.main" fontWeight={500}>
																		{daysUntilExpiration === 0 ? "Hoy" : `${daysUntilExpiration}d`}
																	</Typography>
																)}
															</Stack>
														);
												  })()
												: "-"}
										</TableCell>
										<TableCell>
											{movement.link ? (
												<Tooltip title="Ver documento">
													<IconButton
														size="small"
														color="primary"
														onClick={(e) => {
															e.stopPropagation();
															setSelectedPdfUrl(movement.link || "");
															setSelectedPdfTitle(movement.title || "Documento");
															setSelectedMovementId(movement._id || "");
															setPdfViewerOpen(true);
														}}
													>
														<Link2 size={18} />
													</IconButton>
												</Tooltip>
											) : (
												"-"
											)}
										</TableCell>
										<TableCell>
											<Stack direction="row" spacing={0.5}>
												<Tooltip title={movement.completed ? "Marcar como pendiente" : "Marcar como completado"}>
													<IconButton
														size="small"
														color={movement.completed ? "success" : "default"}
														onClick={(e) => handleToggleComplete(movement._id!, e)}
														sx={{
															backgroundColor: movement.completed ? "success.lighter" : "transparent",
															"&:hover": {
																backgroundColor: movement.completed ? "success.light" : "action.hover",
															},
														}}
													>
														{movement.completed ? <TickCircle size={18} variant="Bold" /> : <TickCircle size={18} />}
													</IconButton>
												</Tooltip>
												<Tooltip title="Ver detalles">
													<IconButton
														size="small"
														onClick={(e) => {
															e.stopPropagation();
															onView(movement);
														}}
													>
														<Eye size={18} />
													</IconButton>
												</Tooltip>
												{movement.source !== "pjn" && (
													<React.Fragment key={`actions-${movement._id}`}>
														<Tooltip title="Editar">
															<IconButton
																size="small"
																color="primary"
																onClick={(e) => {
																	e.stopPropagation();
																	onEdit(movement);
																}}
															>
																<Edit size={18} />
															</IconButton>
														</Tooltip>
														<Tooltip title="Eliminar">
															<IconButton
																size="small"
																color="error"
																onClick={(e) => {
																	e.stopPropagation();
																	onDelete(movement._id!);
																}}
															>
																<Trash size={18} />
															</IconButton>
														</Tooltip>
													</React.Fragment>
												)}
											</Stack>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</TableContainer>
			{/* Barra de paginación personalizada */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexDirection: isMobile ? "column" : "row",
					gap: 2,
					p: 2,
					borderTop: 1,
					borderColor: "divider",
				}}
			>
				{/* Controles de filas por página y información */}
				<Stack direction="row" spacing={isMobile ? 2 : 3} alignItems="center" flexWrap="wrap" sx={{ width: isMobile ? "100%" : "auto" }}>
					<TablePagination
						rowsPerPageOptions={[5, 10, 25, 50]}
						component="div"
						count={pagination?.total || 0}
						rowsPerPage={rowsPerPage}
						page={page}
						onPageChange={handleChangePage}
						onRowsPerPageChange={handleChangeRowsPerPage}
						labelRowsPerPage={isMobile ? "Filas:" : "Filas por página:"}
						labelDisplayedRows={({ from, to, count }) =>
							isMobile ? `${from}-${to} / ${count}` : `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
						}
						sx={{
							"& .MuiTablePagination-toolbar": {
								paddingLeft: 0,
								minHeight: isMobile ? 40 : 52,
							},
							"& .MuiTablePagination-actions": {
								display: "none", // Ocultar las flechas predeterminadas
							},
						}}
					/>
				</Stack>

				{/* Paginación con números */}
				{pagination && pagination.pages > 1 && (
					<PaginationWithJump page={page} totalPages={pagination.pages} onPageChange={handlePageChange} disabled={isLoading} />
				)}
			</Box>

			{/* PDF Viewer Dialog con navegación */}
			<PDFViewer
				open={pdfViewerOpen}
				onClose={() => setPdfViewerOpen(false)}
				url={selectedPdfUrl}
				title={selectedPdfTitle}
				movements={movements}
				currentMovementId={selectedMovementId}
				onNavigate={handlePdfNavigate}
				onRequestNextPage={handleRequestNextPageForPdf}
				onRequestPreviousPage={handleRequestPreviousPageForPdf}
				hasNextPage={pagination?.hasNext || false}
				hasPreviousPage={pagination?.hasPrev || false}
				isLoadingMore={isLoadingMoreForPdf}
				totalWithLinks={totalWithLinks}
				documentsBeforeThisPage={documentsBeforeThisPage}
				documentsInThisPage={documentsInThisPage}
			/>
		</Box>
	);
};

export default MovementsTable;
