import React from "react";
import { useCallback, useEffect, useMemo, useState, Fragment, MouseEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Chip,
	Dialog,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	useMediaQuery,
	Skeleton,
	Snackbar,
	Alert,
	Typography,
	Collapse,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";

import { useFilters, useExpanded, useGlobalFilter, useRowSelect, useSortBy, useTable, usePagination, Row, HeaderProps } from "react-table";

// project-imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import IconButton from "components/@extended/IconButton";
import { PopupTransition } from "components/@extended/Transitions";
import { IndeterminateCheckbox, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import { CSVLink } from "react-csv";
import { formatFolderName } from "utils/formatFolderName";
import SEO from "components/SEO/SEO";

import AddFolder from "sections/apps/folders/AddFolder";
import FolderView from "sections/apps/folders/FolderView";
import AlertFolderDelete from "sections/apps/folders/AlertFolderDelete";

import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import {
	Add,
	FolderOpen,
	FolderAdd,
	Edit,
	Eye,
	Trash,
	Maximize,
	Archive,
	Box1,
	InfoCircle,
	DocumentDownload,
	TickCircle,
	Refresh,
	CloseCircle,
	More,
} from "iconsax-react";

// types
import { dispatch, useSelector } from "store";
import {
	getFoldersByUserId,
	archiveFolders,
	getArchivedFoldersByUserId,
	unarchiveFolders,
	getFolderById,
	setFolderSort,
} from "store/reducers/folder";
import { Folder, Props } from "types/folders";
import dayjs from "utils/dayjs-config";

// sections
import ArchivedItemsModal from "sections/apps/customer/ArchivedItemsModal";
import { GuideFolders } from "components/guides";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
// ==============================|| REACT TABLE ||============================== //

interface ReactTableProps extends Props {
	expandedRowId?: string | null;
	navigate: ReturnType<typeof useNavigate>;
	hideControls?: boolean;
	simpleSkeleton?: boolean;
	initialPageSize?: number;
	pendingCount?: number;
	invalidCount?: number;
	onScrollToPending?: () => void;
	anchorEl: null | HTMLElement;
	menuRowId: string | null;
	handleMenuOpen: (event: MouseEvent<HTMLElement>, rowId: string) => void;
	handleMenuClose: () => void;
}

function ReactTable({
	columns,
	data,
	renderRowSubComponent,
	handleAdd,
	handleArchiveSelected,
	isLoading,
	handleOpenArchivedModal,
	handleOpenGuide,
	expandedRowId,
	navigate,
	hideControls = false,
	simpleSkeleton = false,
	initialPageSize = 10,
	pendingCount = 0,
	invalidCount = 0,
	onScrollToPending,
	anchorEl,
	menuRowId,
	handleMenuOpen,
	handleMenuClose,
}: ReactTableProps) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [isColumnsReady, setIsColumnsReady] = useState(false);

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "folderName", desc: false };

	const defaultHiddenColumns = useMemo(
		() =>
			matchDownSM
				? [
						"_id",
						"email",
						"status",
						"description",
						"initialDateFolder",
						"lastMovementDate",
						"finalDateFolder",
						"folderJuris.label",
						"folderFuero",
						"createdAt",
						"updatedAt",
				  ]
				: ["email", "_id", "description", "finalDateFolder", "createdAt", "updatedAt"],
		[matchDownSM],
	);

	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		prepareRow,
		setHiddenColumns,
		allColumns,
		visibleColumns,
		rows,
		page,
		gotoPage,
		setPageSize,
		state: { globalFilter, selectedRowIds, pageIndex, pageSize, expanded, sortBy: tableSortBy },
		preGlobalFilteredRows,
		setGlobalFilter,
		setSortBy,
		selectedFlatRows,
	} = useTable<Folder>(
		{
			columns: columns as any,
			data,
			filterTypes,
			initialState: {
				pageIndex: 0,
				pageSize: initialPageSize,
				hiddenColumns: defaultHiddenColumns,
				sortBy: [sortBy],
			},
		},
		useGlobalFilter,
		useFilters,
		useSortBy,
		useExpanded,
		usePagination,
		useRowSelect,
	);

	useEffect(() => {
		setHiddenColumns(defaultHiddenColumns);
		setIsColumnsReady(true);

		return () => {
			setIsColumnsReady(false);
		};
	}, [setHiddenColumns, defaultHiddenColumns]);

	// Sincronizar sortBy con Redux cuando cambie
	useEffect(() => {
		if (tableSortBy && tableSortBy.length > 0) {
			const { id, desc } = tableSortBy[0];
			dispatch(setFolderSort(id, desc || false));
		}
	}, [tableSortBy]);

	if (!isColumnsReady || isLoading) {
		// Skeleton simplificado para tabla secundaria
		if (simpleSkeleton) {
			return (
				<Table>
					<TableHead>
						<TableRow>
							{Array(6)
								.fill(0)
								.map((_, index) => (
									<TableCell key={index}>
										<Skeleton width={100} height={24} />
									</TableCell>
								))}
						</TableRow>
					</TableHead>
					<TableBody>
						{Array(5)
							.fill(0)
							.map((_, rowIndex) => (
								<TableRow key={rowIndex}>
									{Array(6)
										.fill(0)
										.map((_, cellIndex) => (
											<TableCell key={cellIndex}>
												<Skeleton width={100} height={24} />
											</TableCell>
										))}
								</TableRow>
							))}
					</TableBody>
				</Table>
			);
		}

		// Skeleton completo para tabla principal
		return (
			<>
				{/* <TableRowSelection selected={0} /> */}
				<Stack spacing={3}>
					<Box
						sx={{
							p: 3,
							pb: 0,
							display: "flex",
							flexDirection: "column",
							gap: 2,
						}}
					>
						<Skeleton width={200} height={40} />
						<Stack direction={matchDownSM ? "column" : "row"} alignItems="center" spacing={2}>
							<Skeleton width={120} height={40} />
							<Skeleton width={150} height={40} />
							<Skeleton width={100} height={40} />
						</Stack>
					</Box>
					<Table>
						<TableHead>
							<TableRow>
								{Array(6)
									.fill(0)
									.map((_, index) => (
										<TableCell key={index}>
											<Skeleton width={100} height={24} />
										</TableCell>
									))}
							</TableRow>
						</TableHead>
						<TableBody>
							{Array(5)
								.fill(0)
								.map((_, rowIndex) => (
									<TableRow key={rowIndex}>
										{Array(6)
											.fill(0)
											.map((_, cellIndex) => (
												<TableCell key={cellIndex}>
													<Skeleton width={100} height={24} />
												</TableCell>
											))}
									</TableRow>
								))}
						</TableBody>
					</Table>
				</Stack>
			</>
		);
	}

	return (
		<>
			{/* <TableRowSelection selected={Object.keys(selectedRowIds).length} /> */}
			{/* Controles FUERA del ScrollX para que siempre estén visibles */}
			{!hideControls && (
				<Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
					{/* Primera fila: buscador a la izquierda, botones principales a la derecha */}
					<Stack
						direction={matchDownSM ? "column" : "row"}
						spacing={{ xs: 1.5, sm: 2 }}
						justifyContent="space-between"
						alignItems={matchDownSM ? "stretch" : "center"}
					>
						{/* Buscador (izquierda) */}
						<Box sx={{ width: { xs: "100%", sm: "280px" } }}>
							<GlobalFilter
								preGlobalFilteredRows={preGlobalFilteredRows as any}
								globalFilter={globalFilter}
								setGlobalFilter={setGlobalFilter}
							/>
						</Box>

						{/* Botones principales (derecha) */}
						<Stack direction={matchDownSM ? "column" : "row"} spacing={1} sx={{ width: matchDownSM ? "100%" : "auto" }}>
							<Button variant="contained" size="small" startIcon={<FolderAdd />} onClick={handleAdd} fullWidth={matchDownSM}>
								Agregar Carpeta
							</Button>
							<Button
								variant="outlined"
								color="secondary"
								size="small"
								startIcon={<Box1 />}
								onClick={handleOpenArchivedModal}
								fullWidth={matchDownSM}
							>
								Ver Archivados
							</Button>
							{handleArchiveSelected && (
								<Tooltip title={Object.keys(selectedRowIds).length === 0 ? "Selecciona causas para archivar" : ""} placement="top">
									<span style={{ width: matchDownSM ? "100%" : "auto" }}>
										<Button
											variant="outlined"
											color="primary"
											size="small"
											startIcon={<Archive />}
											onClick={() => handleArchiveSelected(selectedFlatRows)}
											disabled={Object.keys(selectedRowIds).length === 0}
											fullWidth={matchDownSM}
										>
											Archivar{" "}
											{Object.keys(selectedRowIds).length > 0
												? `${selectedFlatRows.length} ${selectedFlatRows.length === 1 ? "causa" : "causas"}`
												: "causas"}
										</Button>
									</span>
								</Tooltip>
							)}
						</Stack>
					</Stack>

					{/* Segunda fila: selector de ordenamiento a la izquierda, botones secundarios a la derecha */}
					<Stack
						direction={matchDownSM ? "column" : "row"}
						spacing={{ xs: 1.5, sm: 2 }}
						justifyContent="space-between"
						alignItems={matchDownSM ? "stretch" : "center"}
					>
						{/* Selector de ordenamiento (izquierda) */}
						<Box sx={{ width: { xs: "100%", sm: "280px" } }}>
							<SortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns as any} />
						</Box>

						{/* Botones secundarios (derecha) */}
						<Stack direction="row" spacing={1} alignItems="center" justifyContent={matchDownSM ? "flex-start" : "flex-end"}>
							<Tooltip title="Exportar a CSV">
								<IconButton color="primary" size="medium">
									<CSVLink
										data={selectedFlatRows.length > 0 ? selectedFlatRows.map((d: any) => d.original) : data}
										filename={"causas.csv"}
										style={{
											color: "inherit",
											display: "flex",
											alignItems: "center",
											textDecoration: "none",
										}}
									>
										<DocumentDownload variant="Bulk" size={22} />
									</CSVLink>
								</IconButton>
							</Tooltip>
							<Tooltip title="Ver Guía">
								<IconButton color="success" onClick={handleOpenGuide}>
									<InfoCircle variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>

					{/* Banner de alertas - movido después de los controles */}
					{(pendingCount > 0 || invalidCount > 0) && onScrollToPending && (
						<Alert
							severity="warning"
							icon={<InfoCircle variant="Bold" />}
							onClick={onScrollToPending}
							sx={{
								cursor: "pointer",
								"&:hover": {
									backgroundColor: "warning.lighter",
								},
							}}
						>
							<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
								<Typography variant="body2" fontWeight={500}>
									Tienes causas no sincronizadas:
								</Typography>
								{pendingCount > 0 && (
									<Chip
										label={`${pendingCount} Pendiente${pendingCount > 1 ? "s" : ""}`}
										color="warning"
										size="small"
										sx={{
											color: "text.primary",
											fontWeight: 500,
										}}
									/>
								)}
								{invalidCount > 0 && <Chip label={`${invalidCount} Inválida${invalidCount > 1 ? "s" : ""}`} color="error" size="small" />}
								<Typography variant="body2" color="text.secondary">
									(Click para ver)
								</Typography>
							</Stack>
						</Alert>
					)}
				</Stack>
			)}

			{/* Tabla con ScrollX */}
			<ScrollX>
				<Table {...getTableProps()}>
					<TableHead>
						{headerGroups.map((headerGroup) => (
							<TableRow {...headerGroup.getHeaderGroupProps()} sx={{ "& > th:first-of-type": { width: "40px" } }}>
								{headerGroup.headers.map((column: any) => (
									<TableCell {...column.getHeaderProps([{ className: column.className }])}>
										<HeaderSort column={column} sort />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody {...getTableBodyProps()}>
						{page.map((row, i) => {
							prepareRow(row);
							const rowProps = row.getRowProps();
							return (
								<Fragment key={i}>
									<TableRow
										{...row.getRowProps()}
										onClick={() => {
											row.toggleRowSelected();
										}}
										onDoubleClick={() => {
											navigate(`../details/${row.original._id}`);
										}}
										sx={{
											cursor: "pointer",
											bgcolor: row.isSelected ? alpha(theme.palette.primary.lighter, 0.35) : "inherit",
										}}
									>
										{row.cells.map((cell) => (
											<TableCell {...cell.getCellProps([{ className: cell.column.className }])}>{cell.render("Cell")}</TableCell>
										))}
									</TableRow>
									<TableRow>
										<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={visibleColumns.length}>
											<Collapse in={expandedRowId === row.id} timeout="auto" unmountOnExit>
												<Box sx={{ margin: 1 }}>{renderRowSubComponent({ row, rowProps, visibleColumns, expanded })}</Box>
											</Collapse>
										</TableCell>
									</TableRow>
								</Fragment>
							);
						})}
					</TableBody>
				</Table>
			</ScrollX>
			{page.length > 0 && (
				<Box sx={{ p: 2, py: 3 }}>
					<TablePagination gotoPage={gotoPage} rows={rows as any} setPageSize={setPageSize} pageSize={pageSize} pageIndex={pageIndex} />
				</Box>
			)}

			{page.length === 0 && (
				<Box
					sx={{
						width: "100%",
						py: 6,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{/* Ícono de Iconsax */}
					<FolderOpen
						variant="Bulk"
						size={64}
						style={{
							marginBottom: "16px",
							color: theme.palette.primary.main,
							opacity: 0.7,
						}}
					/>
					<Typography variant="h5" gutterBottom align="center">
						No hay causas creadas. Puedes crear una usando el botón 'Agregar Carpeta'.
					</Typography>
					<Typography variant="body2" color="textSecondary" align="center">
						Las causas que guardes aparecerán aquí
					</Typography>
				</Box>
			)}
		</>
	);
}

// ==============================|| FOLDER - LIST ||============================== //

const FoldersLayout = () => {
	const theme = useTheme();
	const mode = theme.palette.mode;
	const navigate = useNavigate();

	// Estados
	const [open, setOpen] = useState(false);
	const [folder, setFolder] = useState(null);
	const [folderDeleteId, setFolderDeleteId] = useState("");
	const [folderId, setFolderId] = useState("");
	const [add, setAdd] = useState(false);
	const [addFolderMode, setAddFolderMode] = useState<"add" | "edit">("add");
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");
	const [archivedModalOpen, setArchivedModalOpen] = useState(false);
	const [loadingUnarchive, setLoadingUnarchive] = useState(false);
	const [guideOpen, setGuideOpen] = useState(false);
	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [menuRowId, setMenuRowId] = useState<string | null>(null);

	// Referencias
	const mountedRef = useRef(false);
	const loadingRef = useRef(false);
	const pendingTableRef = useRef<HTMLDivElement>(null);

	// Selectores
	const user = useSelector((state) => state.auth.user);
	const { folders, archivedFolders, isLoader } = useSelector((state) => state.folder);
	const subscription = useSelector((state) => state.auth.subscription);

	// Separar folders en categorías
	const { pendingOrInvalidFolders, verifiedFolders, pendingCount, invalidCount } = useMemo(() => {
		// Filtrar folders que necesitan verificación o son inválidos
		// SOLO para carpetas de source "auto"
		const pending = folders.filter(
			(folder: any) =>
				folder.source === "auto" &&
				// Pendientes de verificación
				(folder.causaVerified === false ||
					// Inválidos (verificados pero no válidos)
					(folder.causaVerified === true && folder.causaIsValid === false)),
		);

		// Contar pendientes e inválidas por separado
		const pendingVerification = folders.filter((folder: any) => folder.source === "auto" && folder.causaVerified === false).length;

		const invalid = folders.filter(
			(folder: any) => folder.source === "auto" && folder.causaVerified === true && folder.causaIsValid === false,
		).length;

		// Folders verificados y válidos (incluye todos los que NO están en pending)
		const verified = folders.filter(
			(folder: any) =>
				// Carpetas que NO son de source "auto" (siempre van a la tabla principal)
				folder.source !== "auto" ||
				// O carpetas de source "auto" que están verificadas y válidas
				(folder.source === "auto" && folder.causaVerified === true && folder.causaIsValid === true),
		);

		return {
			pendingOrInvalidFolders: pending,
			verifiedFolders: verified,
			pendingCount: pendingVerification,
			invalidCount: invalid,
		};
	}, [folders]);

	// Efecto para la carga inicial
	useEffect(() => {
		// Solo ejecutar en el primer montaje
		if (!mountedRef.current) {
			mountedRef.current = true;

			const initialLoad = async () => {
				// Si no hay usuario, establecer isInitialLoad a false para mostrar la UI vacía
				if (!user?._id) {
					setIsInitialLoad(false);
					return;
				}

				if (loadingRef.current) return;

				try {
					// Garantizar que user._id es un string
					const userId = user._id;
					if (!userId) {
						return;
					}

					loadingRef.current = true;
					await dispatch(getFoldersByUserId(userId)); // No forzar recarga en la carga inicial
				} catch (error) {
				} finally {
					loadingRef.current = false;
					setIsInitialLoad(false);
				}
			};

			initialLoad();
		}

		// Este efecto también debe ejecutarse cuando cambia el usuario después del login
		if (user?._id && !loadingRef.current && mountedRef.current) {
			const reloadFolders = async () => {
				try {
					// Garantizar que user._id es un string antes de pasar a la función
					const userId = user._id;
					if (!userId) return; // Verificación adicional

					loadingRef.current = true;
					await dispatch(getFoldersByUserId(userId)); // No forzar recarga, usar cache si está disponible
				} catch (error) {
				} finally {
					loadingRef.current = false;
					setIsInitialLoad(false);
				}
			};

			reloadFolders();
		}

		return () => {
			mountedRef.current = false;
			loadingRef.current = false;
		};
	}, [user?._id]);

	// Estados para el modal de límite de recursos
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [limitErrorMessage, setLimitErrorMessage] = useState("");

	// Handlers
	const handleCloseDialog = useCallback(() => {
		setAdd(false);
	}, []);

	const handleCloseLimitErrorModal = useCallback(() => {
		setLimitErrorOpen(false);
	}, []);

	const handleAddFolder = useCallback(() => {
		// Si no hay suscripción, permitir crear la carpeta (esto no debería ocurrir normalmente)
		if (!subscription) {
			setAdd(true);
			setAddFolderMode("add");
			setFolder(null);
			return;
		}

		// Obtener el límite de carpetas y verificar si se ha alcanzado
		const maxFolders = subscription.limits.maxFolders;
		const currentFolderCount = folders.length;

		// Verificar si se ha alcanzado el límite
		if (maxFolders !== undefined && currentFolderCount >= maxFolders) {
			// Si se ha alcanzado el límite, mostrar el modal de error
			setLimitErrorInfo({
				resourceType: "Carpetas/Causas",
				plan: subscription.plan,
				currentCount: `${currentFolderCount}`,
				limit: maxFolders,
			});
			setLimitErrorMessage("Has alcanzado el límite de causas disponibles en tu plan actual.");
			setLimitErrorOpen(true);
		} else {
			// Si no se ha alcanzado el límite, mostrar el modal para agregar carpeta
			setAdd(true);
			setAddFolderMode("add");
			setFolder(null);
		}
	}, [folders, subscription]);

	const handleEditContact = useCallback((folderData: any) => {
		setAdd(true);
		setAddFolderMode("edit");
		setFolder(folderData);
	}, []);

	const handleClose = useCallback(() => {
		setOpen((prev) => !prev);
	}, []);

	const handleRowAction = useCallback((e: MouseEvent<HTMLButtonElement>, action: () => void) => {
		e.stopPropagation();
		action();
	}, []);

	const handleSnackbarClose = useCallback(() => {
		setSnackbarOpen(false);
	}, []);

	const handleArchiveSelected = useCallback(
		async (selectedRows: Row<any>[]) => {
			if (!user?._id || selectedRows.length === 0 || loadingRef.current) return;

			const folderIds = selectedRows.map((row) => row.original._id);

			try {
				loadingRef.current = true;
				const result = await dispatch(archiveFolders(user._id, folderIds));

				if (result.success) {
					setSnackbarMessage(`${folderIds.length} ${folderIds.length === 1 ? "causa archivada" : "causas archivadas"} correctamente`);
					setSnackbarSeverity("success");
				} else {
					setSnackbarMessage(result.message || "Error al archivar causas");
					setSnackbarSeverity("error");
				}

				setSnackbarOpen(true);
			} catch (error) {
				setSnackbarMessage("Error al archivar causas");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			} finally {
				loadingRef.current = false;
			}
		},
		[user?._id],
	);

	// Manejadores para elementos archivados
	const handleOpenArchivedModal = useCallback(async () => {
		if (!user?._id || loadingRef.current) return;

		try {
			loadingRef.current = true;
			await dispatch(getArchivedFoldersByUserId(user._id));
			setArchivedModalOpen(true);
		} catch (error) {
			setSnackbarMessage("Error al obtener causas archivadas");
			setSnackbarSeverity("error");
			setSnackbarOpen(true);
		} finally {
			loadingRef.current = false;
		}
	}, [user?._id]);

	const handleCloseArchivedModal = useCallback(() => {
		setArchivedModalOpen(false);
	}, []);

	const handleOpenGuide = useCallback(() => {
		setGuideOpen(true);
	}, []);

	const handleUnarchiveSelected = useCallback(
		async (folderIds: string[]) => {
			if (!user?._id || folderIds.length === 0 || loadingRef.current) return;

			try {
				setLoadingUnarchive(true);
				const result = await dispatch(unarchiveFolders(user._id, folderIds));

				if (result.success) {
					setSnackbarMessage(`${folderIds.length} ${folderIds.length === 1 ? "causa desarchivada" : "causas desarchivadas"} correctamente`);
					setSnackbarSeverity("success");
					setArchivedModalOpen(false);
					// En este caso SÍ necesitamos forzar recarga porque unarchiveFolders podría no tener todos los datos
					await dispatch(getFoldersByUserId(user._id, true));
				} else {
					setSnackbarMessage(result.message || "Error al desarchivar causas");
					setSnackbarSeverity("error");
				}

				setSnackbarOpen(true);
			} catch (error) {
				setSnackbarMessage("Error al desarchivar causas");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			} finally {
				setLoadingUnarchive(false);
			}
		},
		[user?._id],
	);

	// Función para manejar el toggle de filas expandidas
	const handleToggleExpanded = useCallback((rowId: string) => {
		setExpandedRowId((prev) => (prev === rowId ? null : rowId));
	}, []);

	// Handlers del menú overflow
	const handleMenuOpen = useCallback((event: MouseEvent<HTMLElement>, rowId: string) => {
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
		setMenuRowId(rowId);
	}, []);

	const handleMenuClose = useCallback(() => {
		setAnchorEl(null);
		setMenuRowId(null);
	}, []);

	// Función para hacer scroll a la tabla de pendientes
	const handleScrollToPending = useCallback(() => {
		if (pendingTableRef.current) {
			pendingTableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, []);

	// Columnas memoizadas
	const columns = useMemo(
		() => [
			{
				title: "Row Selection",
				Header: ({ getToggleAllPageRowsSelectedProps }: HeaderProps<Folder>) => (
					<IndeterminateCheckbox indeterminate {...getToggleAllPageRowsSelectedProps()} />
				),
				accessor: "selection" as any,
				Cell: ({ row }: any) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />,
				disableSortBy: true,
			},
			{
				Header: "Id",
				accessor: "_id",
				className: "cell-center" as any,
				disableSortBy: true,
			},
			{
				Header: "Carátula",
				accessor: "folderName",
				Cell: ({ row }: { row: any }) => {
					const folder = row.original;
					const value = folder.folderName;

					// Solo mostrar indicadores visuales si pjn === true o mev === true
					const showStatusIndicators = folder.pjn === true || folder.mev === true;
					// Si no se deben mostrar indicadores, solo mostrar el nombre
					if (!showStatusIndicators) {
						return <span>{formatFolderName(value, 50)}</span>;
					}

					// Si causaVerified es false, mostrar chip de pendiente con botón de actualización
					if (folder.causaVerified === false) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Chip color="warning" label="Pendiente de verificación" size="small" variant="light" />
								<Tooltip title="Actualizar estado de verificación">
									<IconButton
										size="small"
										onClick={async (e) => {
											e.stopPropagation();
											await dispatch(getFolderById(folder._id, true));
										}}
										sx={{
											padding: 0.5,
											"&:hover": {
												backgroundColor: "warning.lighter",
											},
										}}
									>
										<Refresh size={16} />
									</IconButton>
								</Tooltip>
							</Stack>
						);
					}

					// Si causaVerified es true pero causaIsValid es false, mostrar chip de causa inválida
					if (folder.causaVerified === true && folder.causaIsValid === false) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Chip color="error" label="Causa inválida" size="small" variant="light" />
								<Tooltip title="Causa inválida - No se pudo verificar en el Poder Judicial">
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											justifyContent: "center",
											width: 18,
											height: 18,
										}}
									>
										<CloseCircle size={16} variant="Bold" color="#EF4444" />
									</Box>
								</Tooltip>
							</Stack>
						);
					}

					// Mantener compatibilidad con el valor "Pendiente" anterior
					if (value === "Pendiente") {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Chip color="warning" label="Pendiente de verificación" size="small" variant="light" />
								<Tooltip title="Actualizar estado de verificación">
									<IconButton
										size="small"
										onClick={async (e) => {
											e.stopPropagation();
											await dispatch(getFolderById(folder._id, true));
										}}
										sx={{
											padding: 0.5,
											"&:hover": {
												backgroundColor: "warning.lighter",
											},
										}}
									>
										<Refresh size={16} />
									</IconButton>
								</Tooltip>
							</Stack>
						);
					}

					// Si causaVerified es true y causaIsValid es true, mostrar nombre con badge verde
					if (folder.causaVerified === true && folder.causaIsValid === true) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<span>{formatFolderName(value, 50)}</span>
								<Tooltip
									title={folder.pjn === true ? "Causa vinculada a PJN" : folder.mev === true ? "Causa vinculada a MEV" : "Causa vinculada"}
								>
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											justifyContent: "center",
											width: 18,
											height: 18,
										}}
									>
										<TickCircle size={16} variant="Bold" color="#22C55E" />
									</Box>
								</Tooltip>
							</Stack>
						);
					}

					// En todos los demás casos, mostrar solo el nombre del folder
					return <span>{formatFolderName(value, 50)}</span>;
				},
			},
			{
				Header: "Materia",
				accessor: "materia",
				Cell: ({ value }: { value: any }) => {
					if (!value) return null;

					return <span>{formatFolderName(value)}</span>;
				},
			},
			{
				Header: "Parte",
				accessor: "orderStatus",
			},
			{
				Header: "Descripción",
				accessor: "description",
			},
			{
				Header: "Fecha de Inicio",
				accessor: "initialDateFolder",
				Cell: ({ row }: { row: any }) => {
					const folder = row.original;

					// Obtener todas las fechas posibles
					const dates = [
						folder.initialDateFolder,
						folder.judFolder?.initialDateJudFolder,
						folder.preFolder?.initialDatePreFolder,
						folder.createdAt,
					].filter((date) => date != null && date !== undefined && date !== "");

					// Si no hay fechas, devolver null
					if (dates.length === 0) return <span>-</span>;

					// Encontrar la fecha más antigua
					let oldestDate = null;
					try {
						const dayjsDates = dates
							.map((date) => {
								// Parsear sin zona horaria para evitar cambios
								const parsed = dayjs(date);
								return parsed.isValid() ? parsed : null;
							})
							.filter((date): date is dayjs.Dayjs => date !== null);

						if (dayjsDates.length > 0) {
							// Ordenar por fecha ascendente (más antigua primero)
							dayjsDates.sort((a, b) => a.valueOf() - b.valueOf());
							oldestDate = dayjsDates[0];
						}
					} catch (error) {
						console.error("Error procesando fechas:", error);
					}

					// Formatear la fecha más antigua
					if (oldestDate && oldestDate.isValid()) {
						return <span>{oldestDate.format("DD/MM/YYYY")}</span>;
					}

					return <span>-</span>;
				},
			},
			{
				Header: "Último Movimiento",
				accessor: "lastMovementDate",
				Cell: ({ value }: { value: any }) => {
					if (!value) return <span>-</span>;

					// Formatear la fecha de formato ISO a DD/MM/YYYY
					try {
						const parsedDate = dayjs(value);
						if (parsedDate.isValid()) {
							return <span>{parsedDate.format("DD/MM/YYYY")}</span>;
						} else {
							return <span>-</span>;
						}
					} catch (error) {
						return <span>-</span>;
					}
				},
			},
			{
				Header: "Fecha Final",
				accessor: "finalDateFolder",
				Cell: ({ value }: { value: any }) => {
					if (!value) return null;

					// Formatear a DD/MM/YYYY
					let formattedDate;
					try {
						// Si ya es un string con formato DD/MM/YYYY, lo mantenemos
						if (typeof value === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
							formattedDate = value;
						}
						// Cualquier otro formato de fecha incluyendo ISO "2022-08-31T00:00:00.000+00:00"
						else {
							const parsedDate = dayjs(value);
							if (parsedDate.isValid()) {
								formattedDate = parsedDate.format("DD/MM/YYYY");
							} else {
								formattedDate = "Fecha inválida";
							}
						}
					} catch (error) {
						formattedDate = "Fecha inválida";
					}

					return <span>{formattedDate}</span>;
				},
			},
			{
				Header: "Jurisdicción",
				accessor: "folderJuris.label" as any,
			},
			{
				Header: "Fuero",
				accessor: "folderFuero",
			},
			{
				Header: "Estado",
				accessor: "status",
				Cell: ({ value }: { value: string }) => {
					switch (value) {
						case "Cerrada":
							return <Chip color="error" label="Cerrada" size="small" variant="light" />;
						case "Nueva":
							return <Chip color="success" label="Nueva" size="small" variant="light" />;
						case "En Proceso":
							return <Chip color="info" label="En Proceso" size="small" variant="light" />;
						case "Pendiente":
							return <Chip color="warning" label="Pendiente" size="small" variant="light" />;
						default:
							return <Chip color="default" label={value} size="small" variant="light" />;
					}
				},
			},
			{
				Header: "Fecha de Creación",
				accessor: "createdAt",
				Cell: ({ value }: { value: any }) => {
					if (!value) return null;
					const parsedDate = dayjs(value);
					return parsedDate.isValid() ? <span>{parsedDate.format("DD/MM/YYYY HH:mm")}</span> : null;
				},
			},
			{
				Header: "Última Actualización",
				accessor: "updatedAt",
				Cell: ({ value }: { value: any }) => {
					if (!value) return null;
					const parsedDate = dayjs(value);
					return parsedDate.isValid() ? <span>{parsedDate.format("DD/MM/YYYY HH:mm")}</span> : null;
				},
			},
			{
				Header: "Acciones",
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: any) => {
					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
							<Tooltip title="Abrir">
								<IconButton color="success" onClick={(e) => handleRowAction(e, () => navigate(`../details/${row.values._id}`))}>
									<Maximize variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Editar">
								<IconButton color="primary" onClick={(e) => handleRowAction(e, () => handleEditContact(row.original))}>
									<Edit variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Eliminar">
								<IconButton
									color="error"
									onClick={(e) =>
										handleRowAction(e, () => {
											handleClose();
											setFolderDeleteId(row.values.folderName);
											setFolderId(row.values._id);
										})
									}
								>
									<Trash variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Más acciones">
								<IconButton color="secondary" onClick={(e) => handleMenuOpen(e, row.id)}>
									<More variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		[theme, mode, handleEditContact, handleClose, navigate, handleRowAction, handleMenuOpen],
	);

	// Row sub component memoizado
	const renderRowSubComponent = useCallback(
		({ row }: { row: Row<Folder> }) => {
			const folderData = folders.find((f: any) => f._id === row.original._id);
			return folderData ? <FolderView data={folderData} /> : null;
		},
		[folders],
	);

	// Renderizar un loader o un componente vacío durante la carga inicial
	if (isInitialLoad) {
		return (
			<MainCard content={false}>
				<ScrollX>
					<Stack spacing={3} sx={{ p: 3 }}>
						<Skeleton variant="rectangular" height={50} />
						<Skeleton variant="rectangular" height={300} />
					</Stack>
				</ScrollX>
			</MainCard>
		);
	}

	return (
		<>
			<SEO path="/apps/folders" />
			<MainCard content={false}>
				<DowngradeGracePeriodAlert />

				{/* Tabla principal de causas verificadas */}
				<Box>
					<ScrollX>
						<ReactTable
							columns={columns as any}
							data={verifiedFolders}
							handleAdd={handleAddFolder}
							handleArchiveSelected={handleArchiveSelected}
							handleOpenGuide={handleOpenGuide}
							handleOpenArchivedModal={handleOpenArchivedModal}
							renderRowSubComponent={renderRowSubComponent}
							isLoading={isLoader}
							expandedRowId={expandedRowId}
							navigate={navigate}
							pendingCount={pendingCount}
							invalidCount={invalidCount}
							onScrollToPending={handleScrollToPending}
							anchorEl={anchorEl}
							menuRowId={menuRowId}
							handleMenuOpen={handleMenuOpen}
							handleMenuClose={handleMenuClose}
						/>
					</ScrollX>
				</Box>

				{/* Tabla secundaria: causas pendientes o inválidas */}
				{pendingOrInvalidFolders.length > 0 && (
					<Box
						ref={pendingTableRef}
						sx={{
							mt: 4,
							borderTop: 2,
							borderColor: "divider",
						}}
					>
						<Box
							sx={{
								px: 3,
								pt: 3,
								pb: 1,
								bgcolor: "warning.lighter",
								borderBottom: 2,
								borderColor: "warning.main",
							}}
						>
							<Stack direction="row" alignItems="center" spacing={1}>
								<InfoCircle size={20} variant="Bold" color={theme.palette.warning.main} />
								<Typography variant="h6" color="warning.dark">
									Causas Pendientes de Verificación o Inválidas ({pendingOrInvalidFolders.length})
								</Typography>
							</Stack>
							<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
								Estas causas importadas automáticamente requieren verificación o presentan problemas de validación
							</Typography>
						</Box>
						<ScrollX>
							<ReactTable
								columns={columns as any}
								data={pendingOrInvalidFolders}
								handleAdd={handleAddFolder}
								handleArchiveSelected={handleArchiveSelected}
								handleOpenGuide={handleOpenGuide}
								handleOpenArchivedModal={handleOpenArchivedModal}
								renderRowSubComponent={renderRowSubComponent}
								isLoading={isLoader}
								expandedRowId={expandedRowId}
								navigate={navigate}
								hideControls={true}
								simpleSkeleton={true}
								initialPageSize={5}
								anchorEl={anchorEl}
								menuRowId={menuRowId}
								handleMenuOpen={handleMenuOpen}
								handleMenuClose={handleMenuClose}
							/>
						</ScrollX>
					</Box>
				)}

				{/* Menu de acciones (compartido por todas las filas) */}
				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl && menuRowId)}
					onClose={handleMenuClose}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "center",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "center",
					}}
					slotProps={{
						paper: {
							sx: {
								minWidth: 180,
							},
						},
					}}
				>
					<MenuItem
						onClick={(e) => {
							e.stopPropagation();
							handleMenuClose();
							if (menuRowId) {
								handleToggleExpanded(menuRowId);
							}
						}}
					>
						<ListItemIcon>
							{expandedRowId === menuRowId ? (
								<Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} size={18} />
							) : (
								<Eye variant="Bulk" size={18} />
							)}
						</ListItemIcon>
						<ListItemText>{expandedRowId === menuRowId ? "Cerrar detalles" : "Ver detalles"}</ListItemText>
					</MenuItem>
				</Menu>

				<AlertFolderDelete title={folderDeleteId} open={open} handleClose={handleClose} id={folderId} onDelete={async () => {}} />
				{add && (
					<Dialog
						maxWidth="sm"
						TransitionComponent={PopupTransition}
						keepMounted
						fullWidth
						open={add}
						sx={{
							"& .MuiDialog-paper": {
								p: 0,
								height: { xs: "90vh", sm: "85vh", md: "80vh" },
								maxHeight: { xs: "90vh", sm: "85vh", md: "80vh" },
								display: "flex",
								flexDirection: "column",
								overflow: "hidden",
							},
						}}
					>
						<AddFolder open={add} folder={folder} mode={addFolderMode} onCancel={handleCloseDialog} onAddFolder={handleCloseDialog} />
					</Dialog>
				)}

				{/* El componente AddFolder manejará el LimitErrorModal independientemente */}

				{/* Modal para elementos archivados */}
				<ArchivedItemsModal
					open={archivedModalOpen}
					onClose={handleCloseArchivedModal}
					title="Causas Archivadas"
					items={archivedFolders || []}
					onUnarchive={handleUnarchiveSelected}
					loading={loadingUnarchive}
					itemType="folders"
				/>

				{/* Guía de causas */}
				<GuideFolders open={guideOpen} onClose={() => setGuideOpen(false)} />

				{/* Modal de límite de recursos */}
				<LimitErrorModal
					open={limitErrorOpen}
					onClose={handleCloseLimitErrorModal}
					message={limitErrorMessage}
					limitInfo={limitErrorInfo}
					upgradeRequired={true}
				/>

				<Snackbar
					open={snackbarOpen}
					autoHideDuration={6000}
					onClose={handleSnackbarClose}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				>
					<Alert
						onClose={handleSnackbarClose}
						severity={snackbarSeverity}
						variant="filled"
						sx={{
							width: "100%",
							fontWeight: 500,
						}}
					>
						{snackbarMessage}
					</Alert>
				</Snackbar>
			</MainCard>
		</>
	);
};

export default FoldersLayout;
