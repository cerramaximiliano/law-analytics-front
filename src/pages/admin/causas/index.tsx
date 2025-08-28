import React, { useState, useEffect, useCallback, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import causasAxios from "utils/causasAxios";

// material-ui
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Grid,
	IconButton,
	InputAdornment,
	MenuItem,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Tooltip,
	Typography,
	useTheme,
	Alert,
	Button,
	Tabs,
	Tab,
	Badge,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// project imports
import MainCard from "components/MainCard";
import { SearchNormal1, Refresh, ArrowRight2, Trash, FolderOpen } from "iconsax-react";
import TableSkeleton from "components/UI/TableSkeleton";
import { fetchVerifiedCausas, clearError, clearMessage, deleteCausa } from "store/reducers/causas";
import { AppDispatch, RootState } from "store";
import CausaDetailsCard from "components/admin/causas/CausaDetailsCard";
import DeleteCausaDialog from "components/admin/causas/DeleteCausaDialog";
import { VerifiedCausa } from "types/causas";
import { useSnackbar } from "notistack";

// types

// Server Status Types
interface ServiceStatus {
	name: string;
	url: string;
	ip: string;
	baseUrl: string;
	status: "online" | "offline" | "checking";
	timestamp?: string;
	message?: string;
}

// Styled components
const StatusIndicator = styled(Box)<{ status: "online" | "offline" | "checking" }>(({ theme, status }) => ({
	width: 12,
	height: 12,
	borderRadius: "50%",
	backgroundColor:
		status === "online" ? theme.palette.success.main : status === "offline" ? theme.palette.error.main : theme.palette.warning.main,
	marginRight: theme.spacing(1),
	animation: status === "checking" ? "pulse 1.5s infinite" : "none",
	"@keyframes pulse": {
		"0%": {
			opacity: 1,
		},
		"50%": {
			opacity: 0.4,
		},
		"100%": {
			opacity: 1,
		},
	},
}));

// ==============================|| ADMIN - CAUSAS VERIFICADAS ||============================== //

const CausasAdmin = () => {
	const theme = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const { enqueueSnackbar } = useSnackbar();

	// Redux state
	const { verifiedCausas, breakdown, count, loading, error, message } = useSelector((state: RootState) => state.causas);

	// State for tabs
	const [activeTab, setActiveTab] = useState<number>(0);

	// State for filtering and pagination
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [filterSource, setFilterSource] = useState<string>("");
	const [sortBy, setSortBy] = useState<string>("createdAt");
	const [sortDir, setSortDir] = useState<string>("desc");

	// State for pagination (one per tab)
	const [page, setPage] = useState<{ [key: string]: number }>({ CIV: 0, CNT: 0, CSS: 0 });
	const [rowsPerPage, setRowsPerPage] = useState<{ [key: string]: number }>({ CIV: 10, CNT: 10, CSS: 10 });

	// State for folder-linked cases
	const [showFolderSection, setShowFolderSection] = useState<boolean>(true);
	const [folderActiveTab, setFolderActiveTab] = useState<number>(0);
	const [folderCausas, setFolderCausas] = useState<{ [key: string]: VerifiedCausa[] }>({ CIV: [], CNT: [], CSS: [] });
	const [folderLoading, setFolderLoading] = useState<boolean>(false);
	const [folderError, setFolderError] = useState<string | null>(null);
	const [folderCount, setFolderCount] = useState<{ [key: string]: number }>({ CIV: 0, CNT: 0, CSS: 0 });
	const [folderPage, setFolderPage] = useState<{ [key: string]: number }>({ CIV: 0, CNT: 0, CSS: 0 });
	const [folderRowsPerPage, setFolderRowsPerPage] = useState<{ [key: string]: number }>({ CIV: 20, CNT: 20, CSS: 20 });
	const [folderTotalPages, setFolderTotalPages] = useState<{ [key: string]: number }>({ CIV: 0, CNT: 0, CSS: 0 });

	// State for selected causa details
	const [selectedCausaForDetails, setSelectedCausaForDetails] = useState<VerifiedCausa | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);

	// State for delete dialog
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [causaToDelete, setCausaToDelete] = useState<VerifiedCausa | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Server status state
	const [serverStatus, setServerStatus] = useState<ServiceStatus>({
		name: "API de Causas",
		url: "https://api.lawanalytics.app",
		ip: "Unknown",
		baseUrl: "https://api.lawanalytics.app",
		status: "checking",
	});
	const [checkingStatus, setCheckingStatus] = useState(false);

	// Fetch folder-linked cases
	const fetchFolderCausas = useCallback(
		async (fuero: string) => {
			try {
				setFolderLoading(true);
				setFolderError(null);

				const currentPage = folderPage[fuero] + 1; // API uses 1-based pagination
				const limit = folderRowsPerPage[fuero];

				const response = await causasAxios.get(`/api/causas/${fuero}/folders`, {
					params: {
						page: currentPage,
						limit: limit,
					},
				});

				if (response.data.success) {
					setFolderCausas((prev) => ({
						...prev,
						[fuero]: response.data.data || [],
					}));
					setFolderCount((prev) => ({
						...prev,
						[fuero]: response.data.count || 0,
					}));
					setFolderTotalPages((prev) => ({
						...prev,
						[fuero]: response.data.pagination?.totalPages || 0,
					}));
				}
			} catch (error: any) {
				setFolderError(error.message || `Error al cargar causas con carpetas para ${fuero}`);
			} finally {
				setFolderLoading(false);
			}
		},
		[folderPage, folderRowsPerPage],
	);

	// Check server status
	const checkServerStatus = useCallback(async () => {
		setCheckingStatus(true);
		setServerStatus((prev) => ({ ...prev, status: "checking" }));

		try {
			// Use causasAxios which already handles auth token
			const response = await causasAxios.get("/api/causas/verified");

			setServerStatus((prev) => ({
				...prev,
				status: "online",
				timestamp: new Date().toISOString(),
				message: response.data?.message || "API funcionando correctamente",
			}));
		} catch (error: any) {
			if (error.response?.status === 401) {
				// Handle 401 specifically without redirecting
				setServerStatus((prev) => ({
					...prev,
					status: "offline",
					timestamp: new Date().toISOString(),
					message: "No autorizado - Verifique su sesión",
				}));
			} else if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
				setServerStatus((prev) => ({
					...prev,
					status: "offline",
					timestamp: new Date().toISOString(),
					message: "Error de red - Verifique su conexión",
				}));
			} else if (error.response) {
				setServerStatus((prev) => ({
					...prev,
					status: "offline",
					timestamp: new Date().toISOString(),
					message: `Error HTTP: ${error.response.status}`,
				}));
			} else {
				setServerStatus((prev) => ({
					...prev,
					status: "offline",
					timestamp: new Date().toISOString(),
					message: error.message || "Error desconocido",
				}));
			}
		} finally {
			setCheckingStatus(false);
		}
	}, []);

	// Initial mount effect
	useEffect(() => {
		dispatch(fetchVerifiedCausas());
		checkServerStatus();

		// Set up periodic server status check
		const interval = setInterval(checkServerStatus, 60000); // Check every minute
		return () => {
			clearInterval(interval);
		};
	}, [dispatch, checkServerStatus]);

	// Fetch folder-linked cases when tab or pagination changes
	useEffect(() => {
		const fueros = ["CIV", "CNT", "CSS"];
		const currentFuero = fueros[folderActiveTab];
		if (currentFuero) {
			fetchFolderCausas(currentFuero);
		}
	}, [folderActiveTab, folderPage, folderRowsPerPage, fetchFolderCausas]);

	// Clear messages after 5 seconds
	useEffect(() => {
		if (message) {
			const timer = setTimeout(() => {
				dispatch(clearMessage());
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [message, dispatch]);

	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				dispatch(clearError());
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, dispatch]);

	// Tab handler
	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	// Folder tab handler
	const handleFolderTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setFolderActiveTab(newValue);
	};

	// Get current fuero based on active tab
	const getCurrentFuero = () => {
		const fueros = ["CIV", "CNT", "CSS"];
		return fueros[activeTab];
	};

	// Pagination handlers
	const handleChangePage = (_event: unknown, newPage: number) => {
		const currentFuero = getCurrentFuero();
		setPage((prev) => ({ ...prev, [currentFuero]: newPage }));
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		const currentFuero = getCurrentFuero();
		const newRowsPerPage = parseInt(event.target.value, 10);
		setRowsPerPage((prev) => ({ ...prev, [currentFuero]: newRowsPerPage }));
		setPage((prev) => ({ ...prev, [currentFuero]: 0 }));
	};

	// Search handler
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	// Filter handlers
	const handleSourceFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setFilterSource(event.target.value);
		const currentFuero = getCurrentFuero();
		setPage((prev) => ({ ...prev, [currentFuero]: 0 }));
	};

	// Sorting handlers
	const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSortBy(event.target.value);
	};

	const handleSortDirChange = () => {
		setSortDir(sortDir === "asc" ? "desc" : "asc");
	};

	// Apply filters and sorting for current tab
	const getFilteredCausasForFuero = (fuero: string) => {
		let filteredCausas = [...verifiedCausas];

		// Fuero filter (based on current tab)
		filteredCausas = filteredCausas.filter((causa) => causa.fuero === fuero);

		// Search filter
		if (searchTerm) {
			filteredCausas = filteredCausas.filter(
				(causa) =>
					causa.caratula.toLowerCase().includes(searchTerm.toLowerCase()) ||
					causa.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
					causa.info.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		}

		// Source filter
		if (filterSource) {
			filteredCausas = filteredCausas.filter((causa) => causa.source === filterSource);
		}

		// Sorting
		filteredCausas.sort((a, b) => {
			let aValue: any;
			let bValue: any;

			switch (sortBy) {
				case "date":
					aValue = new Date(a.date);
					bValue = new Date(b.date);
					break;
				case "movimientosCount":
					aValue = a.movimientosCount;
					bValue = b.movimientosCount;
					break;
				case "lastUpdate":
					aValue = new Date(a.lastUpdate);
					bValue = new Date(b.lastUpdate);
					break;
				case "createdAt":
					aValue = new Date(a.createdAt);
					bValue = new Date(b.createdAt);
					break;
				default:
					aValue = a.createdAt;
					bValue = b.createdAt;
			}

			if (sortDir === "asc") {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});

		return filteredCausas;
	};

	const currentFuero = getCurrentFuero();
	const filteredCausas = getFilteredCausasForFuero(currentFuero);
	const currentPage = page[currentFuero] || 0;
	const currentRowsPerPage = rowsPerPage[currentFuero] || 10;

	// Get current page data
	const paginatedCausas = filteredCausas.slice(currentPage * currentRowsPerPage, currentPage * currentRowsPerPage + currentRowsPerPage);

	// Get counts by fuero for badges
	const getCausasCountByFuero = (fuero: string) => {
		return verifiedCausas.filter((causa) => causa.fuero === fuero).length;
	};

	// Tab Panel Component
	interface TabPanelProps {
		children?: React.ReactNode;
		index: number;
		value: number;
	}

	const TabPanel = (props: TabPanelProps) => {
		const { children, value, index, ...other } = props;

		return (
			<div role="tabpanel" hidden={value !== index} id={`fuero-tabpanel-${index}`} aria-labelledby={`fuero-tab-${index}`} {...other}>
				{value === index && <Box>{children}</Box>}
			</div>
		);
	};

	// Folder pagination handlers
	const handleFolderChangePage = (_event: unknown, newPage: number) => {
		const fueros = ["CIV", "CNT", "CSS"];
		const currentFuero = fueros[folderActiveTab];
		setFolderPage((prev) => ({ ...prev, [currentFuero]: newPage }));
	};

	const handleFolderChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		const fueros = ["CIV", "CNT", "CSS"];
		const currentFuero = fueros[folderActiveTab];
		const newRowsPerPage = parseInt(event.target.value, 10);
		setFolderRowsPerPage((prev) => ({ ...prev, [currentFuero]: newRowsPerPage }));
		setFolderPage((prev) => ({ ...prev, [currentFuero]: 0 }));
	};

	// Get fuero label
	const getFueroLabel = (fuero: string) => {
		switch (fuero) {
			case "CNT":
				return "Trabajo";
			case "CSS":
				return "Seguridad Social";
			case "CIV":
				return "Civil";
			default:
				return fuero;
		}
	};

	// Get fuero color
	const getFueroColor = (fuero: string) => {
		switch (fuero) {
			case "CNT":
				return "primary";
			case "CSS":
				return "info";
			case "CIV":
				return "secondary";
			default:
				return "default";
		}
	};

	// Get source label
	const getSourceLabel = (source: string) => {
		switch (source) {
			case "scraping":
				return "Automático";
			case "manual":
				return "Manual";
			default:
				return source;
		}
	};

	// Refresh data
	const handleRefresh = () => {
		dispatch(fetchVerifiedCausas());
		checkServerStatus();
	};

	// Handle view details
	const handleViewDetails = (causa: VerifiedCausa) => {
		if (selectedCausaForDetails?._id === causa._id && detailsOpen) {
			// If clicking on the same causa that's already open, close it
			setDetailsOpen(false);
			setSelectedCausaForDetails(null);
		} else {
			// Open the details for the clicked causa
			setSelectedCausaForDetails(causa);
			setDetailsOpen(true);
		}
	};

	const handleCloseDetails = () => {
		setDetailsOpen(false);
		setSelectedCausaForDetails(null);
	};

	// Handle delete
	const handleDeleteClick = (causa: VerifiedCausa) => {
		setCausaToDelete(causa);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!causaToDelete) return;

		setDeleteLoading(true);
		try {
			const result = await dispatch(deleteCausa({ fuero: causaToDelete.fuero, causaId: causaToDelete._id })).unwrap();

			if (result.success) {
				enqueueSnackbar(result.message || "Causa eliminada correctamente", {
				variant: "success",
				anchorOrigin: { vertical: "bottom", horizontal: "right" }
			});
				setDeleteDialogOpen(false);
				setCausaToDelete(null);
			} else {
				enqueueSnackbar(result.message || "Error al eliminar la causa", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" }
			});
			}
		} catch (error: any) {
			enqueueSnackbar(error || "Error al eliminar la causa", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" }
			});
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setCausaToDelete(null);
	};

	return (
		<>
			<MainCard>
				<Box sx={{ mb: 2 }}>
					<Grid container alignItems="center" justifyContent="space-between">
						<Grid item>
							<Typography variant="h3">Causas Verificadas</Typography>
						</Grid>
						<Grid item>
							<Stack direction="row" spacing={2}>
								<Button
									variant={showFolderSection ? "outlined" : "contained"}
									color="secondary"
									startIcon={<FolderOpen />}
									sx={{ textTransform: "none" }}
									onClick={() => setShowFolderSection(!showFolderSection)}
								>
									{showFolderSection ? "Ocultar Carpetas" : "Ver Carpetas"}
								</Button>
								<Button variant="contained" color="primary" startIcon={<Refresh />} sx={{ textTransform: "none" }} onClick={handleRefresh}>
									Actualizar
								</Button>
							</Stack>
						</Grid>
					</Grid>
				</Box>

				{/* Server Status Alert */}
				<Box sx={{ mb: 2 }}>
					<Alert
						severity={serverStatus.status === "online" ? "success" : serverStatus.status === "offline" ? "error" : "warning"}
						icon={
							<Box display="flex" alignItems="center">
								<StatusIndicator status={serverStatus.status} />
							</Box>
						}
						action={
							<Tooltip title="Verificar estado">
								<IconButton
									size="small"
									onClick={checkServerStatus}
									disabled={checkingStatus}
									sx={{
										animation: checkingStatus ? "spin 1s linear infinite" : "none",
										"@keyframes spin": {
											"0%": {
												transform: "rotate(0deg)",
											},
											"100%": {
												transform: "rotate(360deg)",
											},
										},
									}}
								>
									<Refresh size={16} />
								</IconButton>
							</Tooltip>
						}
					>
						<Box>
							<Typography variant="subtitle2" fontWeight="bold">
								{serverStatus.name}
							</Typography>
							<Typography variant="body2">
								Estado:{" "}
								{serverStatus.status === "online" ? "En línea" : serverStatus.status === "offline" ? "Fuera de línea" : "Verificando..."}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{serverStatus.baseUrl}
							</Typography>
							{serverStatus.message && (
								<Typography variant="caption" display="block" sx={{ fontStyle: "italic", mt: 0.5 }}>
									{serverStatus.message}
								</Typography>
							)}
						</Box>
					</Alert>
				</Box>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{message && (
					<Alert severity="success" sx={{ mb: 2 }}>
						{message}
					</Alert>
				)}

				<MainCard content={false}>
					<Box sx={{ p: 2 }}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} sm={6} md={4}>
								<TextField
									fullWidth
									label="Buscar causa"
									placeholder="Buscar por carátula, objeto o información"
									size="small"
									value={searchTerm}
									onChange={handleSearch}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton edge="end">
													<SearchNormal1 size={18} />
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={8}>
								<Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
									<TextField select size="small" label="Ordenar por" value={sortBy} onChange={handleSortChange} sx={{ minWidth: 120 }}>
										<MenuItem value="createdAt">Fecha de creación</MenuItem>
										<MenuItem value="date">Fecha de causa</MenuItem>
										<MenuItem value="movimientosCount">Movimientos</MenuItem>
										<MenuItem value="lastUpdate">Última actualización</MenuItem>
									</TextField>
									<Button variant="outlined" size="small" onClick={handleSortDirChange} sx={{ minWidth: 100, height: 40 }}>
										{sortDir === "asc" ? "Ascendente" : "Descendente"}
									</Button>
									<TextField
										select
										size="small"
										label="Origen"
										value={filterSource}
										onChange={handleSourceFilterChange}
										sx={{ minWidth: 120 }}
									>
										<MenuItem value="">Todos</MenuItem>
										<MenuItem value="scraping">Automático</MenuItem>
										<MenuItem value="manual">Manual</MenuItem>
									</TextField>
								</Stack>
							</Grid>
						</Grid>
					</Box>
					<Divider />

					{/* Tabs por Fuero */}
					<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
						<Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
							<Tab
								label={
									<Badge badgeContent={getCausasCountByFuero("CIV")} color="secondary">
										Civil
									</Badge>
								}
							/>
							<Tab
								label={
									<Badge badgeContent={getCausasCountByFuero("CNT")} color="primary">
										Trabajo
									</Badge>
								}
							/>
							<Tab
								label={
									<Badge badgeContent={getCausasCountByFuero("CSS")} color="info">
										Seguridad Social
									</Badge>
								}
							/>
						</Tabs>
					</Box>

					{/* Tab Panels */}
					<TabPanel value={activeTab} index={0}>
						<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
							<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
								<TableHead>
									<TableRow>
										<TableCell>Carátula</TableCell>
										<TableCell>Juzgado/Secretaría</TableCell>
										<TableCell>Objeto</TableCell>
										<TableCell align="center">Movimientos</TableCell>
										<TableCell>Origen</TableCell>
										<TableCell>Última actualización</TableCell>
										<TableCell align="center">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{loading ? (
										<TableSkeleton columns={7} rows={10} />
									) : paginatedCausas.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} align="center" sx={{ py: 3 }}>
												<Typography variant="subtitle1">No hay causas disponibles para Civil</Typography>
											</TableCell>
										</TableRow>
									) : (
										paginatedCausas.map((causa) => (
											<Fragment key={causa._id}>
												<TableRow hover tabIndex={-1}>
													<TableCell>
														<Typography variant="subtitle2">{causa.caratula}</Typography>
														<Typography variant="caption" color="textSecondary">
															{causa.year} - {causa.number}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant="body2">
															Juzgado {causa.juzgado} - Secretaría {causa.secretaria}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={causa.objeto}>
															{causa.objeto}
														</Typography>
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
															<Typography variant="subtitle2">{causa.movimientosCount}</Typography>
															{causa.fechaUltimoMovimiento && (
																<Tooltip title={`Último: ${new Date(causa.fechaUltimoMovimiento).toLocaleDateString()}`}>
																	<ArrowRight2 size={14} />
																</Tooltip>
															)}
														</Stack>
													</TableCell>
													<TableCell>
														<Chip label={getSourceLabel(causa.source)} variant="outlined" size="small" />
													</TableCell>
													<TableCell>
														<Typography variant="caption">{new Date(causa.lastUpdate).toLocaleDateString()}</Typography>
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={1} justifyContent="center">
															<Tooltip title="Ver detalles">
																<IconButton
																	aria-label="detalles"
																	size="small"
																	color="primary"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleViewDetails(causa);
																	}}
																>
																	<SearchNormal1 size={18} />
																</IconButton>
															</Tooltip>
															<Tooltip title="Eliminar">
																<IconButton
																	aria-label="eliminar"
																	size="small"
																	color="error"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleDeleteClick(causa);
																	}}
																>
																	<Trash size={18} />
																</IconButton>
															</Tooltip>
														</Stack>
													</TableCell>
												</TableRow>
												{selectedCausaForDetails?._id === causa._id && (
													<TableRow>
														<TableCell colSpan={7} sx={{ py: 0, px: 2 }}>
															<CausaDetailsCard causa={causa} open={detailsOpen} onClose={handleCloseDetails} />
														</TableCell>
													</TableRow>
												)}
											</Fragment>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>

						<TablePagination
							rowsPerPageOptions={[5, 10, 25, 50, 100]}
							component="div"
							count={filteredCausas.length}
							rowsPerPage={currentRowsPerPage}
							page={currentPage}
							onPageChange={handleChangePage}
							onRowsPerPageChange={handleChangeRowsPerPage}
							labelRowsPerPage="Filas por página:"
							labelDisplayedRows={({ from, to, count, page }) => {
								const totalPages = Math.ceil(count / currentRowsPerPage);
								const currentPageNum = page + 1;
								return `Página ${currentPageNum} de ${totalPages} (${from}-${to} de ${count})`;
							}}
						/>
					</TabPanel>

					<TabPanel value={activeTab} index={1}>
						<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
							<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
								<TableHead>
									<TableRow>
										<TableCell>Carátula</TableCell>
										<TableCell>Fuero</TableCell>
										<TableCell>Juzgado/Secretaría</TableCell>
										<TableCell>Objeto</TableCell>
										<TableCell align="center">Movimientos</TableCell>
										<TableCell>Origen</TableCell>
										<TableCell>Última actualización</TableCell>
										<TableCell align="center">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{loading ? (
										<TableSkeleton columns={8} rows={10} />
									) : paginatedCausas.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8} align="center" sx={{ py: 3 }}>
												<Typography variant="subtitle1">No hay causas disponibles</Typography>
											</TableCell>
										</TableRow>
									) : (
										paginatedCausas.map((causa) => (
											<Fragment key={causa._id}>
												<TableRow hover tabIndex={-1}>
													<TableCell>
														<Typography variant="subtitle2">{causa.caratula}</Typography>
														<Typography variant="caption" color="textSecondary">
															{causa.year} - {causa.number}
														</Typography>
													</TableCell>
													<TableCell>
														<Chip label={getFueroLabel(causa.fuero)} color={getFueroColor(causa.fuero) as any} size="small" />
													</TableCell>
													<TableCell>
														<Typography variant="body2">
															Juzgado {causa.juzgado} - Secretaría {causa.secretaria}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={causa.objeto}>
															{causa.objeto}
														</Typography>
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
															<Typography variant="subtitle2">{causa.movimientosCount}</Typography>
															{causa.fechaUltimoMovimiento && (
																<Tooltip title={`Último: ${new Date(causa.fechaUltimoMovimiento).toLocaleDateString()}`}>
																	<ArrowRight2 size={14} />
																</Tooltip>
															)}
														</Stack>
													</TableCell>
													<TableCell>
														<Chip label={getSourceLabel(causa.source)} variant="outlined" size="small" />
													</TableCell>
													<TableCell>
														<Typography variant="caption">{new Date(causa.lastUpdate).toLocaleDateString()}</Typography>
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={1} justifyContent="center">
															<Tooltip title="Ver detalles">
																<IconButton
																	aria-label="detalles"
																	size="small"
																	color="primary"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleViewDetails(causa);
																	}}
																>
																	<SearchNormal1 size={18} />
																</IconButton>
															</Tooltip>
															<Tooltip title="Eliminar">
																<IconButton
																	aria-label="eliminar"
																	size="small"
																	color="error"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleDeleteClick(causa);
																	}}
																>
																	<Trash size={18} />
																</IconButton>
															</Tooltip>
														</Stack>
													</TableCell>
												</TableRow>
												{selectedCausaForDetails?._id === causa._id && (
													<TableRow>
														<TableCell colSpan={8} sx={{ py: 0, px: 2 }}>
															<CausaDetailsCard causa={causa} open={detailsOpen} onClose={handleCloseDetails} />
														</TableCell>
													</TableRow>
												)}
											</Fragment>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>

						<TablePagination
							rowsPerPageOptions={[5, 10, 25, 50, 100]}
							component="div"
							count={filteredCausas.length}
							rowsPerPage={currentRowsPerPage}
							page={currentPage}
							onPageChange={handleChangePage}
							onRowsPerPageChange={handleChangeRowsPerPage}
							labelRowsPerPage="Filas por página:"
							labelDisplayedRows={({ from, to, count, page }) => {
								const totalPages = Math.ceil(count / currentRowsPerPage);
								const currentPageNum = page + 1;
								return `Página ${currentPageNum} de ${totalPages} (${from}-${to} de ${count})`;
							}}
						/>
					</TabPanel>

					<TabPanel value={activeTab} index={2}>
						<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
							<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
								<TableHead>
									<TableRow>
										<TableCell>Carátula</TableCell>
										<TableCell>Juzgado/Secretaría</TableCell>
										<TableCell>Objeto</TableCell>
										<TableCell align="center">Movimientos</TableCell>
										<TableCell>Origen</TableCell>
										<TableCell>Última actualización</TableCell>
										<TableCell align="center">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{loading ? (
										<TableSkeleton columns={7} rows={10} />
									) : paginatedCausas.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} align="center" sx={{ py: 3 }}>
												<Typography variant="subtitle1">No hay causas disponibles para Seguridad Social</Typography>
											</TableCell>
										</TableRow>
									) : (
										paginatedCausas.map((causa) => (
											<Fragment key={causa._id}>
												<TableRow hover tabIndex={-1}>
													<TableCell>
														<Typography variant="subtitle2">{causa.caratula}</Typography>
														<Typography variant="caption" color="textSecondary">
															{causa.year} - {causa.number}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant="body2">
															Juzgado {causa.juzgado} - Secretaría {causa.secretaria}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={causa.objeto}>
															{causa.objeto}
														</Typography>
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
															<Typography variant="subtitle2">{causa.movimientosCount}</Typography>
															{causa.fechaUltimoMovimiento && (
																<Tooltip title={`Último: ${new Date(causa.fechaUltimoMovimiento).toLocaleDateString()}`}>
																	<ArrowRight2 size={14} />
																</Tooltip>
															)}
														</Stack>
													</TableCell>
													<TableCell>
														<Chip label={getSourceLabel(causa.source)} variant="outlined" size="small" />
													</TableCell>
													<TableCell>
														<Typography variant="caption">{new Date(causa.lastUpdate).toLocaleDateString()}</Typography>
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={1} justifyContent="center">
															<Tooltip title="Ver detalles">
																<IconButton
																	aria-label="detalles"
																	size="small"
																	color="primary"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleViewDetails(causa);
																	}}
																>
																	<SearchNormal1 size={18} />
																</IconButton>
															</Tooltip>
															<Tooltip title="Eliminar">
																<IconButton
																	aria-label="eliminar"
																	size="small"
																	color="error"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleDeleteClick(causa);
																	}}
																>
																	<Trash size={18} />
																</IconButton>
															</Tooltip>
														</Stack>
													</TableCell>
												</TableRow>
												{selectedCausaForDetails?._id === causa._id && (
													<TableRow>
														<TableCell colSpan={7} sx={{ py: 0, px: 2 }}>
															<CausaDetailsCard causa={causa} open={detailsOpen} onClose={handleCloseDetails} />
														</TableCell>
													</TableRow>
												)}
											</Fragment>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>

						<TablePagination
							rowsPerPageOptions={[5, 10, 25, 50, 100]}
							component="div"
							count={filteredCausas.length}
							rowsPerPage={currentRowsPerPage}
							page={currentPage}
							onPageChange={handleChangePage}
							onRowsPerPageChange={handleChangeRowsPerPage}
							labelRowsPerPage="Filas por página:"
							labelDisplayedRows={({ from, to, count, page }) => {
								const totalPages = Math.ceil(count / currentRowsPerPage);
								const currentPageNum = page + 1;
								return `Página ${currentPageNum} de ${totalPages} (${from}-${to} de ${count})`;
							}}
						/>
					</TabPanel>
				</MainCard>

				<Grid container spacing={3} sx={{ mt: 2 }}>
					<Grid item xs={12} md={4}>
						<Card>
							<CardHeader title="Resumen de Causas" />
							<CardContent>
								<Stack spacing={2}>
									<Box>
										<Typography variant="subtitle2" color="textSecondary">
											Total de causas verificadas
										</Typography>
										<Typography variant="h4">{count}</Typography>
									</Box>
									<Box>
										<Typography variant="subtitle2" color="textSecondary">
											Estado del servidor
										</Typography>
										<Typography variant="body1">
											{serverStatus.status === "online"
												? "✓ En línea"
												: serverStatus.status === "offline"
												? "✗ Fuera de línea"
												: "⟳ Verificando"}
										</Typography>
									</Box>
								</Stack>
							</CardContent>
						</Card>
					</Grid>

					<Grid item xs={12} md={8}>
						<Card>
							<CardHeader title="Distribución por Fuero" />
							<CardContent>
								<Grid container spacing={2}>
									<Grid item xs={4}>
										<Box
											sx={{
												p: 2.5,
												bgcolor: theme.palette.mode === "dark" ? theme.palette.dark.main : theme.palette.grey[50],
												borderRadius: 2,
												textAlign: "center",
											}}
										>
											<Typography variant="h4">{breakdown.trabajo}</Typography>
											<Chip label="Trabajo" color="primary" size="small" sx={{ mt: 1 }} />
										</Box>
									</Grid>
									<Grid item xs={4}>
										<Box
											sx={{
												p: 2.5,
												bgcolor: theme.palette.mode === "dark" ? theme.palette.dark.main : theme.palette.grey[50],
												borderRadius: 2,
												textAlign: "center",
											}}
										>
											<Typography variant="h4">{breakdown.seguridad_social}</Typography>
											<Chip label="Seguridad Social" color="info" size="small" sx={{ mt: 1 }} />
										</Box>
									</Grid>
									<Grid item xs={4}>
										<Box
											sx={{
												p: 2.5,
												bgcolor: theme.palette.mode === "dark" ? theme.palette.dark.main : theme.palette.grey[50],
												borderRadius: 2,
												textAlign: "center",
											}}
										>
											<Typography variant="h4">{breakdown.civil}</Typography>
											<Chip label="Civil" color="secondary" size="small" sx={{ mt: 1 }} />
										</Box>
									</Grid>
								</Grid>
							</CardContent>
						</Card>
					</Grid>
				</Grid>

				{/* Delete Confirmation Dialog */}
				<DeleteCausaDialog
					open={deleteDialogOpen}
					causa={causaToDelete}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					loading={deleteLoading}
				/>
			</MainCard>

			{/* Cases with Linked Folders Section */}
			{showFolderSection && (
				<MainCard sx={{ mt: 3 }}>
					<Box sx={{ mb: 2 }}>
						<Grid container alignItems="center" justifyContent="space-between">
							<Grid item>
								<Typography variant="h3">Causas con Carpetas Vinculadas</Typography>
							</Grid>
							<Grid item>
								<Button
									variant="contained"
									color="primary"
									startIcon={<Refresh />}
									sx={{ textTransform: "none" }}
									onClick={() => {
										const fueros = ["CIV", "CNT", "CSS"];
										const currentFuero = fueros[folderActiveTab];
										fetchFolderCausas(currentFuero);
									}}
								>
									Actualizar
								</Button>
							</Grid>
						</Grid>
					</Box>

					{folderError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{folderError}
						</Alert>
					)}

					<MainCard content={false}>
						{/* Tabs por Fuero */}
						<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
							<Tabs value={folderActiveTab} onChange={handleFolderTabChange} variant="fullWidth">
								<Tab
									label={
										<Badge badgeContent={folderCount["CIV"]} color="secondary">
											Civil
										</Badge>
									}
								/>
								<Tab
									label={
										<Badge badgeContent={folderCount["CNT"]} color="primary">
											Trabajo
										</Badge>
									}
								/>
								<Tab
									label={
										<Badge badgeContent={folderCount["CSS"]} color="info">
											Seguridad Social
										</Badge>
									}
								/>
							</Tabs>
						</Box>

						{/* Tab Panels for Folder-linked Cases */}
						{["CIV", "CNT", "CSS"].map((fuero, index) => {
							const currentFolderCausas = folderCausas[fuero] || [];
							const currentFolderPage = folderPage[fuero] || 0;
							const currentFolderRowsPerPage = folderRowsPerPage[fuero] || 20;
							const currentFolderCount = folderCount[fuero] || 0;

							return (
								<TabPanel key={fuero} value={folderActiveTab} index={index}>
									<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
										<Table sx={{ minWidth: 750 }} aria-labelledby="folderTableTitle">
											<TableHead>
												<TableRow>
													<TableCell>Carátula</TableCell>
													<TableCell>Juzgado/Secretaría</TableCell>
													<TableCell>Objeto</TableCell>
													<TableCell align="center">Carpetas</TableCell>
													<TableCell align="center">Movimientos</TableCell>
													<TableCell>Última actualización</TableCell>
													<TableCell align="center">Acciones</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{folderLoading ? (
													<TableSkeleton columns={7} rows={10} />
												) : currentFolderCausas.length === 0 ? (
													<TableRow>
														<TableCell colSpan={7} align="center" sx={{ py: 3 }}>
															<Typography variant="subtitle1">No hay causas con carpetas vinculadas para {getFueroLabel(fuero)}</Typography>
														</TableCell>
													</TableRow>
												) : (
													currentFolderCausas.map((causa) => (
														<Fragment key={causa._id}>
															<TableRow hover tabIndex={-1}>
																<TableCell>
																	<Typography variant="subtitle2">{causa.caratula}</Typography>
																	<Typography variant="caption" color="textSecondary">
																		{causa.year} - {causa.number}
																	</Typography>
																</TableCell>
																<TableCell>
																	<Typography variant="body2">
																		Juzgado {causa.juzgado} - Secretaría {causa.secretaria}
																	</Typography>
																</TableCell>
																<TableCell>
																	<Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={causa.objeto}>
																		{causa.objeto}
																	</Typography>
																</TableCell>
																<TableCell align="center">
																	<Chip label={causa.folderIds?.length || 0} color="primary" size="small" variant="outlined" />
																</TableCell>
																<TableCell align="center">
																	<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
																		<Typography variant="subtitle2">{causa.movimientosCount}</Typography>
																		{causa.fechaUltimoMovimiento && (
																			<Tooltip title={`Último: ${new Date(causa.fechaUltimoMovimiento).toLocaleDateString()}`}>
																				<ArrowRight2 size={14} />
																			</Tooltip>
																		)}
																	</Stack>
																</TableCell>
																<TableCell>
																	<Typography variant="caption">{new Date(causa.lastUpdate).toLocaleDateString()}</Typography>
																</TableCell>
																<TableCell align="center">
																	<Stack direction="row" spacing={1} justifyContent="center">
																		<Tooltip title="Ver detalles">
																			<IconButton
																				aria-label="detalles"
																				size="small"
																				color="primary"
																				onClick={(e) => {
																					e.stopPropagation();
																					handleViewDetails(causa);
																				}}
																			>
																				<SearchNormal1 size={18} />
																			</IconButton>
																		</Tooltip>
																	</Stack>
																</TableCell>
															</TableRow>
															{selectedCausaForDetails?._id === causa._id && (
																<TableRow>
																	<TableCell colSpan={7} sx={{ py: 0, px: 2 }}>
																		<CausaDetailsCard causa={causa} open={detailsOpen} onClose={handleCloseDetails} />
																	</TableCell>
																</TableRow>
															)}
														</Fragment>
													))
												)}
											</TableBody>
										</Table>
									</TableContainer>

									<TablePagination
										rowsPerPageOptions={[10, 20, 50, 100]}
										component="div"
										count={currentFolderCount}
										rowsPerPage={currentFolderRowsPerPage}
										page={currentFolderPage}
										onPageChange={handleFolderChangePage}
										onRowsPerPageChange={handleFolderChangeRowsPerPage}
										labelRowsPerPage="Filas por página:"
										labelDisplayedRows={({ from, to, count, page }) => {
											const totalPages = folderTotalPages[fuero] || Math.ceil(count / currentFolderRowsPerPage);
											const currentPageNum = page + 1;
											return `Página ${currentPageNum} de ${totalPages} (${from}-${to} de ${count})`;
										}}
									/>
								</TabPanel>
							);
						})}
					</MainCard>
				</MainCard>
			)}
		</>
	);
};

export default CausasAdmin;
