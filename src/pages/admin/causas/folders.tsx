import React, { useState, useEffect, useCallback, Fragment } from "react";
import causasAxios from "utils/causasAxios";

// material-ui
import {
	Box,
	Chip,
	Grid,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
	Alert,
	Button,
	Tabs,
	Tab,
	Badge,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import { Refresh, FolderOpen } from "iconsax-react";
import TableSkeleton from "components/UI/TableSkeleton";
import { VerifiedCausa } from "types/causas";
import { useSnackbar } from "notistack";

// ==============================|| ADMIN - CAUSAS CON CARPETAS ||============================== //

const CausasFolders = () => {
	const { enqueueSnackbar } = useSnackbar();

	// State for tabs
	const [activeTab, setActiveTab] = useState<number>(0);

	// State for folder-linked cases
	const [folderCausas, setFolderCausas] = useState<{ [key: string]: VerifiedCausa[] }>({ CIV: [], CNT: [], CSS: [] });
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [count, setCount] = useState<{ [key: string]: number }>({ CIV: 0, CNT: 0, CSS: 0 });
	const [page, setPage] = useState<{ [key: string]: number }>({ CIV: 0, CNT: 0, CSS: 0 });
	const [rowsPerPage, setRowsPerPage] = useState<{ [key: string]: number }>({ CIV: 20, CNT: 20, CSS: 20 });
	const [totalPages, setTotalPages] = useState<{ [key: string]: number }>({ CIV: 0, CNT: 0, CSS: 0 });

	// Fetch folder-linked cases
	const fetchFolderCausas = useCallback(
		async (fuero: string) => {
			try {
				setLoading(true);
				setError(null);

				const currentPage = page[fuero] + 1; // API uses 1-based pagination
				const limit = rowsPerPage[fuero];

				const response = await causasAxios.get(`/api/causas/${fuero}/folders`, {
					params: {
						page: currentPage,
						limit: limit,
						light: true,
					},
				});

				if (response.data.success) {
					setFolderCausas((prev) => ({
						...prev,
						[fuero]: response.data.data || [],
					}));
					setCount((prev) => ({
						...prev,
						[fuero]: response.data.count || 0,
					}));
					setTotalPages((prev) => ({
						...prev,
						[fuero]: response.data.pagination?.totalPages || 0,
					}));
				}
			} catch (error: any) {
				setError(error.message || `Error al cargar causas con carpetas para ${fuero}`);
				enqueueSnackbar(error.message || `Error al cargar causas con carpetas para ${fuero}`, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" }
			});
			} finally {
				setLoading(false);
			}
		},
		[page, rowsPerPage, enqueueSnackbar],
	);

	// Tab handler
	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	// Fetch data when tab or pagination changes
	useEffect(() => {
		const fueros = ["CIV", "CNT", "CSS"];
		const currentFuero = fueros[activeTab];
		if (currentFuero) {
			fetchFolderCausas(currentFuero);
		}
	}, [activeTab, page, rowsPerPage, fetchFolderCausas]);

	// Pagination handlers
	const handleChangePage = (_event: unknown, newPage: number) => {
		const fueros = ["CIV", "CNT", "CSS"];
		const currentFuero = fueros[activeTab];
		setPage((prev) => ({ ...prev, [currentFuero]: newPage }));
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		const fueros = ["CIV", "CNT", "CSS"];
		const currentFuero = fueros[activeTab];
		const newRowsPerPage = parseInt(event.target.value, 10);
		setRowsPerPage((prev) => ({ ...prev, [currentFuero]: newRowsPerPage }));
		setPage((prev) => ({ ...prev, [currentFuero]: 0 }));
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

	// Refresh data
	const handleRefresh = () => {
		const fueros = ["CIV", "CNT", "CSS"];
		const currentFuero = fueros[activeTab];
		fetchFolderCausas(currentFuero);
	};

	return (
		<MainCard>
			<Box sx={{ mb: 2 }}>
				<Grid container alignItems="center" justifyContent="space-between">
					<Grid item>
						<Typography variant="h3">Causas con Carpetas Vinculadas</Typography>
					</Grid>
					<Grid item>
						<Button variant="contained" color="primary" startIcon={<Refresh />} sx={{ textTransform: "none" }} onClick={handleRefresh}>
							Actualizar
						</Button>
					</Grid>
				</Grid>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* Summary Cards */}
			<Grid container spacing={3} sx={{ mb: 3 }}>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 3, textAlign: "center", height: 180, display: "flex", flexDirection: "column", justifyContent: "center" }}>
						<FolderOpen size={32} color="#1890ff" />
						<Typography variant="h4" sx={{ mt: 2 }}>
							{count.CIV + count.CNT + count.CSS}
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Total de causas con carpetas
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 3, textAlign: "center", height: 180, display: "flex", flexDirection: "column", justifyContent: "center" }}>
						<Typography variant="h6" gutterBottom>
							Civil
						</Typography>
						<Typography variant="h4">{count.CIV}</Typography>
						<Typography variant="body2" color="textSecondary">
							Causas con carpetas
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 3, textAlign: "center", height: 180, display: "flex", flexDirection: "column", justifyContent: "center" }}>
						<Typography variant="h6" gutterBottom>
							Trabajo + Seg. Social
						</Typography>
						<Typography variant="h4">{count.CNT + count.CSS}</Typography>
						<Typography variant="body2" color="textSecondary">
							Causas con carpetas
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<MainCard content={false}>
				{/* Tabs por Fuero */}
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
						<Tab
							label={
								<Badge badgeContent={count["CIV"]} color="secondary">
									Civil
								</Badge>
							}
						/>
						<Tab
							label={
								<Badge badgeContent={count["CNT"]} color="primary">
									Trabajo
								</Badge>
							}
						/>
						<Tab
							label={
								<Badge badgeContent={count["CSS"]} color="info">
									Seguridad Social
								</Badge>
							}
						/>
					</Tabs>
				</Box>

				{/* Tab Panels for Folder-linked Cases */}
				{["CIV", "CNT", "CSS"].map((fuero, index) => {
					const currentFolderCausas = folderCausas[fuero] || [];
					const currentPage = page[fuero] || 0;
					const currentRowsPerPage = rowsPerPage[fuero] || 20;
					const currentCount = count[fuero] || 0;

					return (
						<TabPanel key={fuero} value={activeTab} index={index}>
							<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
								<Table sx={{ minWidth: 750 }} aria-labelledby="folderTableTitle">
									<TableHead>
										<TableRow>
											<TableCell>Carátula</TableCell>
											<TableCell>Juzgado</TableCell>
											<TableCell>Objeto</TableCell>
											<TableCell align="center">Verificado</TableCell>
											<TableCell align="center">Válido</TableCell>
											<TableCell align="center">
												<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
													<FolderOpen size={16} />
													Carpetas
												</Box>
											</TableCell>
											<TableCell align="center">Usuarios</TableCell>
											<TableCell align="center">Movimientos</TableCell>
											<TableCell>Última actualización</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{loading ? (
											<TableSkeleton columns={9} rows={10} />
										) : currentFolderCausas.length === 0 ? (
											<TableRow>
												<TableCell colSpan={9} align="center" sx={{ py: 3 }}>
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
															<Typography variant="body2">Juzgado {causa.juzgado}</Typography>
														</TableCell>
														<TableCell>
															<Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={causa.objeto}>
																{causa.objeto}
															</Typography>
														</TableCell>
														<TableCell align="center">
															<Chip label={causa.verified ? "Sí" : "No"} color={causa.verified ? "success" : "default"} size="small" />
														</TableCell>
														<TableCell align="center">
															<Chip label={causa.isValid ? "Sí" : "No"} color={causa.isValid ? "success" : "error"} size="small" />
														</TableCell>
														<TableCell align="center">
															<Typography variant="body2">{causa.folderIds?.length || 0}</Typography>
														</TableCell>
														<TableCell align="center">
															<Typography variant="body2">{causa.userCausaIds?.length || 0}</Typography>
														</TableCell>
														<TableCell align="center">
															<Typography variant="subtitle2">{causa.movimientosCount}</Typography>
														</TableCell>
														<TableCell>
															<Typography variant="caption">{new Date(causa.lastUpdate).toLocaleDateString()}</Typography>
														</TableCell>
													</TableRow>
												</Fragment>
											))
										)}
									</TableBody>
								</Table>
							</TableContainer>

							<TablePagination
								rowsPerPageOptions={[10, 20, 50, 100]}
								component="div"
								count={currentCount}
								rowsPerPage={currentRowsPerPage}
								page={currentPage}
								onPageChange={handleChangePage}
								onRowsPerPageChange={handleChangeRowsPerPage}
								labelRowsPerPage="Filas por página:"
								labelDisplayedRows={({ from, to, count, page }) => {
									const currentTotalPages = totalPages[fuero] || Math.ceil(count / currentRowsPerPage);
									const currentPageNum = page + 1;
									return `Página ${currentPageNum} de ${currentTotalPages} (${from}-${to} de ${count})`;
								}}
							/>
						</TabPanel>
					);
				})}
			</MainCard>
		</MainCard>
	);
};

export default CausasFolders;
