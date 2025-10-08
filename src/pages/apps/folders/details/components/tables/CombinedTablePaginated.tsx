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
	Avatar,
	Box,
	Typography,
	Skeleton,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import {
	Edit,
	Trash,
	Eye,
	NotificationStatus,
	Calendar,
	DocumentText,
	Judge,
	SmsNotification,
	Notification1,
	Clock,
	Link2,
	Status,
} from "iconsax-react";
import { visuallyHidden } from "@mui/utils";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { useParams } from "react-router";
import { useDispatch } from "store";
import { getCombinedActivities } from "store/reducers/activities";
import { CombinedActivity, PjnAccess } from "types/activities";
import PaginationWithJump from "components/shared/PaginationWithJump";
import PjnAccessAlert from "components/shared/PjnAccessAlert";

interface CombinedTablePaginatedProps {
	activities: CombinedActivity[];
	searchQuery: string;
	onEdit: (activity: CombinedActivity) => void;
	onDelete: (activity: CombinedActivity) => void;
	onView: (activity: CombinedActivity) => void;
	filters?: any;
	pagination?: any;
	isLoading?: boolean;
	stats?: any;
	pjnAccess?: PjnAccess;
}

type Order = "asc" | "desc";

interface HeadCell {
	id: keyof CombinedActivity | "actions";
	label: string;
	numeric: boolean;
	width?: string | number;
}

const headCells: HeadCell[] = [
	{ id: "date", label: "Fecha", numeric: false, width: "120px" },
	{ id: "type", label: "Tipo", numeric: false, width: "120px" },
	{ id: "title", label: "Título", numeric: false, width: "35%" },
	{ id: "description", label: "Descripción", numeric: false },
	{ id: "dateExpiration", label: "Vencimiento", numeric: false, width: "120px" },
	{ id: "actions", label: "Acciones", numeric: false, width: "120px" },
];

// Función para obtener el icono según el tipo y subtipo
const getActivityIcon = (activity: CombinedActivity) => {
	if (activity.type === "movement") {
		switch (activity.movement) {
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
	} else if (activity.type === "notification") {
		switch (activity.notification) {
			case "SMS":
				return <SmsNotification size={16} />;
			case "Email":
				return <Notification1 size={16} />;
			default:
				return <NotificationStatus size={16} />;
		}
	} else {
		return <Calendar size={16} />;
	}
};

// Función para formatear fechas
const formatDate = (dateString?: string) => {
	if (!dateString) return "-";
	try {
		const date = parseISO(dateString);
		if (isValid(date)) {
			// Usar componentes de fecha UTC para evitar conversión de zona horaria
			const year = date.getUTCFullYear();
			const month = date.getUTCMonth();
			const day = date.getUTCDate();
			const normalized = new Date(year, month, day);
			return format(normalized, "dd/MM/yyyy", { locale: es });
		}
		return "-";
	} catch {
		return "-";
	}
};

const CombinedTablePaginated: React.FC<CombinedTablePaginatedProps> = ({
	activities = [],
	searchQuery = "",
	onEdit,
	onDelete,
	onView,
	filters = {},
	pagination,
	isLoading = false,
	stats,
	pjnAccess,
}) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const dispatch = useDispatch();

	const [order, setOrder] = useState<Order>("desc");
	const [orderBy, setOrderBy] = useState<keyof CombinedActivity>("date");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
	const [localFilters, setLocalFilters] = useState(filters);

	// Determinar qué tipos mostrar basándose en el filtro source
	const getFilterTypes = () => {
		const source = localFilters.source || filters.source || "all";
		switch (source) {
			case "movements":
				return ["movement"];
			case "notifications":
				return ["notification"];
			case "events":
				return ["event"];
			default:
				return ["movement", "notification", "event"];
		}
	};

	// Actualizar valores locales cuando cambien las props
	useEffect(() => {
		setLocalSearchQuery(searchQuery);
	}, [searchQuery]);

	useEffect(() => {
		setLocalFilters(filters);
	}, [filters]);

	// Efecto para recargar datos cuando cambien los filtros o búsqueda
	useEffect(() => {
		if (id && (localSearchQuery !== searchQuery || JSON.stringify(localFilters) !== JSON.stringify(filters))) {
			const timer = setTimeout(() => {
				dispatch(
					getCombinedActivities(id, {
						page: 1,
						limit: rowsPerPage,
						search: localSearchQuery,
						sort: order === "desc" ? `-${orderBy}` : orderBy,
						filter: {
							types: getFilterTypes(),
							...localFilters,
						},
					}),
				);
			}, 300);

			return () => clearTimeout(timer);
		}
	}, [id, localSearchQuery, localFilters, order, orderBy, rowsPerPage, dispatch]);

	// Sincronizar página con paginación del servidor
	useEffect(() => {
		if (pagination && pagination.page - 1 !== page) {
			setPage(pagination.page - 1);
		}
	}, [pagination, page]);

	const handleRequestSort = (property: keyof CombinedActivity) => {
		const isAsc = orderBy === property && order === "asc";
		const newOrder = isAsc ? "desc" : "asc";
		setOrder(newOrder);
		setOrderBy(property);

		// Llamar al servidor con el ordenamiento
		if (id) {
			const sortParam = newOrder === "desc" ? `-${property}` : property;
			dispatch(
				getCombinedActivities(id, {
					page: page + 1,
					limit: rowsPerPage,
					search: localSearchQuery,
					sort: sortParam,
					filter: {
						types: getFilterTypes(),
						...localFilters,
					},
				}),
			);
		}
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
		if (id) {
			const sortParam = order === "desc" ? `-${orderBy}` : orderBy;
			dispatch(
				getCombinedActivities(id, {
					page: newPage + 1,
					limit: rowsPerPage,
					search: localSearchQuery,
					sort: sortParam,
					filter: {
						types: getFilterTypes(),
						...localFilters,
					},
				}),
			);
		}
	};

	const handlePageChange = (newPage: number) => {
		handleChangePage(null, newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newRowsPerPage = parseInt(event.target.value, 10);
		setRowsPerPage(newRowsPerPage);
		setPage(0);
		if (id) {
			const sortParam = order === "desc" ? `-${orderBy}` : orderBy;
			dispatch(
				getCombinedActivities(id, {
					page: 1,
					limit: newRowsPerPage,
					search: localSearchQuery,
					sort: sortParam,
					filter: {
						types: getFilterTypes(),
						...localFilters,
					},
				}),
			);
		}
	};

	// Función para obtener el subtipo de la actividad
	const getActivitySubtype = (activity: CombinedActivity) => {
		switch (activity.type) {
			case "movement":
				return activity.movement || "";
			case "notification":
				return activity.notification || "";
			case "event":
				return activity.eventType || "General";
			default:
				return "";
		}
	};

	// Función para obtener el label del tipo
	const getTypeLabel = (type: string) => {
		switch (type) {
			case "movement":
				return "Movimiento";
			case "notification":
				return "Notificación";
			case "event":
				return "Evento";
			default:
				return type;
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
									{headCell.id !== "actions" && headCell.id !== "type" ? (
										<TableSortLabel
											active={orderBy === headCell.id}
											direction={orderBy === headCell.id ? order : "asc"}
											onClick={() => handleRequestSort(headCell.id as keyof CombinedActivity)}
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
										<Stack direction="row" spacing={1} alignItems="center">
											<Skeleton variant="circular" width={30} height={30} />
											<Box>
												<Skeleton variant="text" width={60} height={16} />
												<Skeleton variant="text" width={100} height={20} />
											</Box>
										</Stack>
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width="90%" />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width="80%" />
									</TableCell>
									<TableCell>
										<Skeleton variant="rectangular" width={100} height={24} />
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
						) : activities.length === 0 ? (
							<TableRow key="no-data-row">
								<TableCell colSpan={headCells.length} align="center">
									<Typography variant="subtitle1" color="textSecondary" sx={{ py: 3 }}>
										No se encontraron actividades
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							activities.map((activity: CombinedActivity) => (
								<TableRow hover tabIndex={-1} key={activity._id}>
									<TableCell>{formatDate(activity.date)}</TableCell>
									<TableCell>
										<Stack direction="row" spacing={1} alignItems="center">
											<Avatar
												sx={{
													width: 30,
													height: 30,
													bgcolor:
														activity.type === "movement"
															? "success.lighter"
															: activity.type === "notification"
															? "warning.lighter"
															: "primary.lighter",
													color:
														activity.type === "movement"
															? "success.main"
															: activity.type === "notification"
															? "warning.main"
															: "primary.main",
												}}
											>
												{getActivityIcon(activity)}
											</Avatar>
											<Box>
												<Typography variant="caption" color="textSecondary">
													{getTypeLabel(activity.type)}
												</Typography>
												<Typography variant="subtitle2">{getActivitySubtype(activity)}</Typography>
											</Box>
										</Stack>
									</TableCell>
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
												{activity.title}
											</Typography>
											{activity.source === "pjn" && (
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
										<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300 }} noWrap>
											{activity.description || "-"}
										</Typography>
									</TableCell>
									<TableCell>
										{activity.dateExpiration ? (
											<Chip
												label={formatDate(activity.dateExpiration)}
												size="small"
												variant="outlined"
												color="warning"
												icon={<Clock size={14} />}
											/>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell>
										<Stack direction="row" spacing={0.5}>
											{activity.link && (
												<Tooltip title="Ver documento">
													<IconButton
														size="small"
														color="primary"
														onClick={(e) => {
															e.stopPropagation();
															window.open(activity.link, "_blank");
														}}
													>
														<Link2 size={18} />
													</IconButton>
												</Tooltip>
											)}
											<Tooltip title="Ver detalles">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														onView(activity);
													}}
												>
													<Eye size={18} />
												</IconButton>
											</Tooltip>
											{activity.source !== "pjn" && (
												<React.Fragment key={`actions-${activity._id}`}>
													<Tooltip title="Editar">
														<IconButton
															size="small"
															color="primary"
															onClick={(e) => {
																e.stopPropagation();
																onEdit(activity);
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
																onDelete(activity);
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
							))
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

			{/* Estadísticas adicionales */}
			{stats && (
				<Box sx={{ p: 2, borderTop: 1, borderColor: "divider", bgcolor: "grey.50" }}>
					<Stack direction="row" spacing={2} flexWrap="wrap">
						<Typography variant="caption" color="textSecondary">
							Total con documentos: <strong>{stats.totalWithLinks || 0}</strong>
						</Typography>
						<Typography variant="caption" color="textSecondary">
							Con vencimiento: <strong>{stats.totalWithExpiration || 0}</strong>
						</Typography>
						<Typography variant="caption" color="textSecondary">
							Próximos vencimientos: <strong>{stats.upcomingExpirations || 0}</strong>
						</Typography>
						<Typography variant="caption" color="textSecondary">
							Actividades hoy: <strong>{stats.todayCount || 0}</strong>
						</Typography>
					</Stack>
				</Box>
			)}
		</Box>
	);
};

export default CombinedTablePaginated;
