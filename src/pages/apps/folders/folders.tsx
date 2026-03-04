import React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, Fragment, MouseEvent, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogContent,
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
	FormControl,
	Select,
	SelectChangeEvent,
} from "@mui/material";

import { useFilters, useExpanded, useGlobalFilter, useRowSelect, useSortBy, useTable, usePagination, Row, HeaderProps } from "react-table";

// project-imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import IconButton from "components/@extended/IconButton";
import Avatar from "components/@extended/Avatar";
import { PopupTransition } from "components/@extended/Transitions";
import { IndeterminateCheckbox, HeaderSort, SortingSelect, TablePagination } from "components/third-party/ReactTable";
import { CSVLink } from "react-csv";
import { formatFolderName } from "utils/formatFolderName";
import SEO from "components/SEO/SEO";

import AddFolder from "sections/apps/folders/AddFolder";
import FolderView from "sections/apps/folders/FolderView";
import AlertFolderDelete from "sections/apps/folders/AlertFolderDelete";
import SelectCalculatorTypeModal from "sections/apps/folders/SelectCalculatorTypeModal";
import ModalTasks from "pages/apps/folders/details/modals/MoldalTasks";
import ModalCalcData from "pages/apps/folders/details/modals/ModalCalcData";
import ModalNotes from "pages/apps/folders/details/modals/ModalNotes";
import ModalMovements from "pages/apps/folders/details/modals/ModalMovements";
import AddCustomer from "sections/apps/customer/AddCustomer";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import CausaSelector from "sections/apps/folders/CausaSelector";

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
	SearchStatus1,
	Folder2,
	Warning2,
	Filter,
	ArrowUp2,
	ArrowDown2,
} from "iconsax-react";

// types
import { dispatch, useSelector } from "store";
import {
	getFoldersByUserId,
	getFoldersByGroupId,
	archiveFolders,
	getArchivedFoldersByUserId,
	getArchivedFoldersByGroupId,
	unarchiveFolders,
	getFolderById,
	setFolderSort,
	deleteFoldersByIds,
} from "store/reducers/folder";
import { fetchUserStats } from "store/reducers/userStats";
import { useTeam } from "contexts/TeamContext";
import { Folder, Props } from "types/folders";
import dayjs from "utils/dayjs-config";
import { Calculator as CalculatorIcon, TaskSquare, Moneys, DocumentText, Profile2User, TableDocument, Calendar } from "iconsax-react";

// sections
import ArchivedItemsModal from "sections/apps/customer/ArchivedItemsModal";
import { GuideFolders } from "components/guides";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import { ResourceUsageBar } from "sections/widget/chart/ResourceUsageWidget";
// ==============================|| REACT TABLE ||============================== //

interface ReactTableProps extends Props {
	expandedRowId?: string | null;
	navigate: ReturnType<typeof useNavigate>;
	hideControls?: boolean;
	simpleSkeleton?: boolean;
	skeletonRowCount?: number;
	initialPageSize?: number;
	pendingCount?: number;
	invalidCount?: number;
	onScrollToPending?: () => void;
	anchorEl: null | HTMLElement;
	menuRowId: string | null;
	handleMenuOpen: (event: MouseEvent<HTMLElement>, rowId: string, folderData?: any) => void;
	handleMenuClose: () => void;
	/** If true, shows onboarding-specific UI (special empty state, muted controls) */
	isOnboarding?: boolean;
	/** Filtros */
	folderTypeFilter?: 'all' | 'manual' | 'pjn' | 'eje' | 'mev';
	onFolderTypeFilterChange?: (event: SelectChangeEvent<'all' | 'manual' | 'pjn' | 'eje' | 'mev'>) => void;
	statusFilter?: 'all' | 'Nueva' | 'En Proceso' | 'Pendiente' | 'Cerrada';
	onStatusFilterChange?: (event: SelectChangeEvent<string>) => void;
	parteFilter?: string;
	onParteFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniquePartes?: string[];
	movimientosFilter?: 'all' | 'today' | 'week' | 'month' | 'none';
	onMovimientosFilterChange?: (event: SelectChangeEvent<string>) => void;
	jurisdiccionFilter?: string;
	onJurisdiccionFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniqueJurisdicciones?: string[];
	handleDeleteSelected?: (selectedRows: any[]) => void;
}

function ReactTable({
	columns,
	data,
	renderRowSubComponent,
	handleAdd,
	handleArchiveSelected,
	handleDeleteSelected,
	isLoading,
	handleOpenArchivedModal,
	handleOpenGuide,
	expandedRowId,
	navigate,
	hideControls = false,
	simpleSkeleton = false,
	skeletonRowCount = 5,
	initialPageSize = 10,
	pendingCount = 0,
	invalidCount = 0,
	onScrollToPending,
	anchorEl,
	menuRowId,
	handleMenuOpen,
	handleMenuClose,
	isOnboarding = false,
	folderTypeFilter = 'all',
	onFolderTypeFilterChange,
	statusFilter = 'all',
	onStatusFilterChange,
	parteFilter = 'all',
	onParteFilterChange,
	uniquePartes = [],
	movimientosFilter = 'all',
	onMovimientosFilterChange,
	jurisdiccionFilter = 'all',
	onJurisdiccionFilterChange,
	uniqueJurisdicciones = [],
	onBarWidthMeasured,
}: ReactTableProps) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [isColumnsReady, setIsColumnsReady] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const csvLinkRef = useRef<any>(null);
	const g1ButtonRef = useRef<HTMLButtonElement>(null);
	const g2StackRef = useRef<HTMLDivElement>(null);

	// Medir ancho de G1+G2 (botones Agregar carpeta + Archivados + Archivar) para alinear la barra de carpetas
	useLayoutEffect(() => {
		const update = () => {
			if (!g1ButtonRef.current || !g2StackRef.current || matchDownSM || !onBarWidthMeasured) {
				return;
			}
			const left = g1ButtonRef.current.getBoundingClientRect().left;
			const right = g2StackRef.current.getBoundingClientRect().right;
			onBarWidthMeasured(right - left);
		};
		update();
		const ro = new ResizeObserver(update);
		if (g1ButtonRef.current) ro.observe(g1ButtonRef.current);
		if (g2StackRef.current) ro.observe(g2StackRef.current);
		return () => ro.disconnect();
	}, [matchDownSM, onBarWidthMeasured]);

	// Contar filtros activos
	const activeFiltersCount = useMemo(() => {
		let count = 0;
		if (folderTypeFilter !== 'all') count++;
		if (statusFilter !== 'all') count++;
		if (parteFilter !== 'all') count++;
		if (movimientosFilter !== 'all') count++;
		if (jurisdiccionFilter !== 'all') count++;
		return count;
	}, [folderTypeFilter, statusFilter, parteFilter, movimientosFilter, jurisdiccionFilter]);

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

	const csvHeaders = [
		{ label: "Nombre", key: "folderName" },
		{ label: "Materia", key: "materia" },
		{ label: "Estado", key: "status" },
		{ label: "Jurisdicción", key: "jurisdiccion" },
		{ label: "Fuero", key: "folderFuero" },
		{ label: "Fecha inicio", key: "initialDateFolder" },
		{ label: "Fecha cierre", key: "finalDateFolder" },
		{ label: "Monto", key: "amount" },
		{ label: "Descripción", key: "description" },
		{ label: "Nro. Expediente", key: "expedientNumber" },
		{ label: "Año Expediente", key: "expedientYear" },
		{ label: "Origen", key: "source" },
	];

	const csvData = useMemo(() => {
		const sourceRows = selectedFlatRows.length > 0 ? selectedFlatRows.map((d: any) => d.original) : data;
		return sourceRows.map((folder: Folder) => ({
			folderName: folder.folderName || "",
			materia: folder.materia || "",
			status: folder.status || "",
			jurisdiccion: folder.folderJuris?.label || "",
			folderFuero: folder.folderFuero || "",
			initialDateFolder: folder.initialDateFolder || "",
			finalDateFolder: folder.finalDateFolder || "",
			amount: folder.amount ?? "",
			description: folder.description || "",
			expedientNumber: folder.expedientNumber || "",
			expedientYear: folder.expedientYear || "",
			source: folder.source || (folder.pjn ? "PJN" : "manual"),
		}));
	}, [selectedFlatRows, data]);

	if (!isColumnsReady || isLoading) {
		// Skeleton simplificado para tabla secundaria
		if (simpleSkeleton) {
			const rowCount = Math.max(1, skeletonRowCount);
			return (
				<Table>
					<TableHead>
						<TableRow>
							{Array(6)
								.fill(0)
								.map((_, index) => (
									<TableCell key={index}>
										<Skeleton variant="rounded" width={100} height={28} />
									</TableCell>
								))}
						</TableRow>
					</TableHead>
					<TableBody>
						{Array(rowCount)
							.fill(0)
							.map((_, rowIndex) => (
								<TableRow key={rowIndex} sx={{ height: 60 }}>
									{Array(6)
										.fill(0)
										.map((_, cellIndex) => (
											<TableCell key={cellIndex}>
												<Skeleton variant="rounded" width="80%" height={32} />
											</TableCell>
										))}
								</TableRow>
							))}
					</TableBody>
				</Table>
			);
		}

		// Skeleton completo para tabla principal
		const mainRowCount = Math.max(1, Math.min(skeletonRowCount, 10));
		return (
			<>
				{/* <TableRowSelection selected={0} /> */}
				<Stack spacing={3}>
					{/* Skeleton de toolbar - una sola fila */}
					<Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
						<Stack
							direction={matchDownSM ? "column" : "row"}
							spacing={{ xs: 1.5, sm: 2 }}
							alignItems={matchDownSM ? "stretch" : "center"}
							flexWrap="wrap"
							useFlexGap
						>
							{/* Grupo 1: Acción principal */}
							<Skeleton variant="rounded" width={140} height={32} />

							{/* Separador */}
							{!matchDownSM && <Skeleton variant="rounded" width={2} height={28} />}

							{/* Grupo 2: Gestión archivados */}
							<Stack direction="row" spacing={1}>
								<Skeleton variant="rounded" width={100} height={32} />
								<Skeleton variant="rounded" width={85} height={32} />
							</Stack>

							{/* Separador */}
							{!matchDownSM && <Skeleton variant="rounded" width={2} height={28} />}

							{/* Grupo 3: Filtros y ordenamiento */}
							<Stack direction="row" spacing={1}>
								<Skeleton variant="rounded" width={90} height={31} />
								<Skeleton variant="rounded" width={160} height={31} />
							</Stack>

							{/* Separador */}
							{!matchDownSM && <Skeleton variant="rounded" width={2} height={28} />}

							{/* Grupo 4: Búsqueda y utilidades */}
							<Stack
								direction="row"
								spacing={1}
								alignItems="center"
								sx={{ flex: matchDownSM ? "none" : 1, justifyContent: matchDownSM ? "flex-start" : "flex-end" }}
							>
								<Skeleton variant="rounded" width={220} height={32} />
								<Skeleton variant="circular" width={28} height={28} />
								<Skeleton variant="circular" width={28} height={28} />
							</Stack>
						</Stack>
					</Stack>
					<Table>
						<TableHead>
							<TableRow>
								{Array(6)
									.fill(0)
									.map((_, index) => (
										<TableCell key={index}>
											<Skeleton variant="rounded" width={100} height={28} />
										</TableCell>
									))}
							</TableRow>
						</TableHead>
						<TableBody>
							{Array(mainRowCount)
								.fill(0)
								.map((_, rowIndex) => (
									<TableRow key={rowIndex} sx={{ height: 60 }}>
										{Array(6)
											.fill(0)
											.map((_, cellIndex) => (
												<TableCell key={cellIndex}>
													<Skeleton variant="rounded" width="80%" height={32} />
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
					{/* Toolbar principal - una sola fila en desktop, múltiples en mobile */}
					<Stack
						direction={matchDownSM ? "column" : "row"}
						spacing={{ xs: 1.5, sm: 2 }}
						alignItems={matchDownSM ? "stretch" : "center"}
						flexWrap="wrap"
						useFlexGap
					>
						{/* Grupo 1: Acción principal */}
						{handleAdd && (
							<Button
								ref={g1ButtonRef}
								variant="contained"
								size="small"
								startIcon={<FolderAdd />}
								onClick={handleAdd}
								fullWidth={matchDownSM}
								sx={{ textTransform: "none" }}
							>
								{isOnboarding && data.length === 0 ? "Crear mi primera carpeta" : "Agregar carpeta"}
							</Button>
						)}

						{/* Separador */}
						{!matchDownSM && handleAdd && (
							<Box sx={{ width: "2px", height: "28px", bgcolor: "grey.300", borderRadius: 1 }} />
						)}

						{/* Grupo 2: Gestión de archivados */}
						<Stack
							ref={g2StackRef}
							direction="row"
							spacing={1}
							sx={{
								...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }),
							}}
						>
							<Button
								variant="outlined"
								color="secondary"
								size="small"
								startIcon={<Box1 size={18} />}
								onClick={handleOpenArchivedModal}
								sx={{ textTransform: "none" }}
							>
								Archivados
							</Button>
							{handleArchiveSelected && (
								<Tooltip title={Object.keys(selectedRowIds).length === 0 ? "Selecciona causas para archivar" : ""} placement="top">
									<span>
										<Button
											variant="outlined"
											color="secondary"
											size="small"
											startIcon={<Archive size={18} />}
											onClick={() => handleArchiveSelected(selectedFlatRows)}
											disabled={Object.keys(selectedRowIds).length === 0}
											sx={{ textTransform: "none" }}
										>
											{Object.keys(selectedRowIds).length > 0
												? `Archivar (${selectedFlatRows.length})`
												: "Archivar"}
										</Button>
									</span>
								</Tooltip>
							)}
						</Stack>

						{/* Separador */}
						{!matchDownSM && (
							<Box sx={{ width: "2px", height: "28px", bgcolor: "grey.300", borderRadius: 1 }} />
						)}

						{/* Grupo 3: Filtros y ordenamiento */}
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							sx={{
								...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }),
							}}
						>
							{/* Botón de Filtros */}
							{onFolderTypeFilterChange && (
								<Button
									variant={showFilters || activeFiltersCount > 0 ? "contained" : "outlined"}
									color={activeFiltersCount > 0 ? "primary" : "secondary"}
									size="small"
									startIcon={<Filter size={18} />}
									endIcon={showFilters ? <ArrowUp2 size={14} /> : <ArrowDown2 size={14} />}
									onClick={() => setShowFilters(!showFilters)}
									sx={{
										textTransform: "none",
										height: "30.75px",
										minWidth: 100,
									}}
								>
									{activeFiltersCount > 0 ? `Filtros (${activeFiltersCount})` : "Filtros"}
								</Button>
							)}
							{/* Ordenamiento */}
							<Box sx={{ minWidth: 160 }}>
								<SortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns as any} />
							</Box>
						</Stack>

						{/* Separador */}
						{!matchDownSM && (
							<Box sx={{ width: "2px", height: "28px", bgcolor: "grey.300", borderRadius: 1 }} />
						)}

						{/* Grupo 4: Búsqueda y utilidades */}
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							sx={{
								flex: matchDownSM ? "none" : 1,
								justifyContent: matchDownSM ? "flex-start" : "flex-end",
								...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }),
							}}
						>
							<Box sx={{ width: { xs: "100%", sm: "220px" } }}>
								<GlobalFilter
									preGlobalFilteredRows={preGlobalFilteredRows as any}
									globalFilter={globalFilter}
									setGlobalFilter={setGlobalFilter}
									disabled={data.length === 0}
								/>
							</Box>
							<Tooltip title="Exportar a CSV">
								<IconButton
									color="primary"
									size="small"
									onClick={() => csvLinkRef.current?.link?.click()}
								>
									<DocumentDownload variant="Bulk" size={20} />
								</IconButton>
							</Tooltip>
							<CSVLink
								ref={csvLinkRef}
								data={csvData}
								headers={csvHeaders}
								filename={"causas.csv"}
								style={{ display: "none" }}
							/>
							{/* Botón de eliminar seleccionados */}
							{handleDeleteSelected && (
								<Tooltip
									title={
										Object.keys(selectedRowIds).length === 0
											? "Selecciona carpetas para eliminar"
											: `Eliminar ${selectedFlatRows.length} carpeta${selectedFlatRows.length > 1 ? "s" : ""}`
									}
								>
									<span>
										<IconButton
											color="error"
											size="small"
											onClick={() => handleDeleteSelected(selectedFlatRows)}
											disabled={Object.keys(selectedRowIds).length === 0}
											sx={{
												opacity: Object.keys(selectedRowIds).length === 0 ? 0.5 : 1,
												position: "relative",
											}}
										>
											<Trash variant="Bulk" size={20} />
											{Object.keys(selectedRowIds).length > 0 && (
												<Box
													sx={{
														position: "absolute",
														top: -4,
														right: -4,
														bgcolor: "error.main",
														color: "white",
														borderRadius: "50%",
														width: 16,
														height: 16,
														fontSize: "0.65rem",
														fontWeight: "bold",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													{selectedFlatRows.length}
												</Box>
											)}
										</IconButton>
									</span>
								</Tooltip>
							)}
							<Tooltip title="Ver Guía">
								<IconButton color="success" size="small" onClick={handleOpenGuide}>
									<InfoCircle variant="Bulk" size={20} />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>

					{/* Panel de filtros colapsable */}
					{onFolderTypeFilterChange && (
						<Collapse in={showFilters}>
							<Box
								sx={{
									p: 2,
									bgcolor: "action.hover",
									borderRadius: 1,
									border: "1px solid",
									borderColor: "divider",
								}}
							>
								<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
									{/* Filtro por Tipo */}
									<FormControl size="small" sx={{ minWidth: 120 }}>
										<Select
											id="folder-type-filter"
											displayEmpty
											value={folderTypeFilter}
											onChange={onFolderTypeFilterChange}
											sx={{
												maxHeight: "30.75px",
												bgcolor: "background.paper",
												"& .MuiSelect-select": { py: "6px" },
											}}
										>
											<MenuItem value="all"><Typography variant="body2">Tipo: Todos</Typography></MenuItem>
											<MenuItem value="manual"><Typography variant="body2">Manual</Typography></MenuItem>
											<MenuItem value="pjn"><Typography variant="body2">PJN</Typography></MenuItem>
											<MenuItem value="eje"><Typography variant="body2">EJE</Typography></MenuItem>
											<MenuItem value="mev"><Typography variant="body2">MEV</Typography></MenuItem>
										</Select>
									</FormControl>
									{/* Filtro por Estado */}
									{onStatusFilterChange && (
										<FormControl size="small" sx={{ minWidth: 130 }}>
											<Select
												id="status-filter"
												displayEmpty
												value={statusFilter}
												onChange={onStatusFilterChange}
												sx={{
													maxHeight: "30.75px",
													bgcolor: "background.paper",
													"& .MuiSelect-select": { py: "6px" },
												}}
											>
												<MenuItem value="all"><Typography variant="body2">Estado: Todos</Typography></MenuItem>
												<MenuItem value="Nueva"><Typography variant="body2">Nueva</Typography></MenuItem>
												<MenuItem value="En Proceso"><Typography variant="body2">En Proceso</Typography></MenuItem>
												<MenuItem value="Pendiente"><Typography variant="body2">Pendiente</Typography></MenuItem>
												<MenuItem value="Cerrada"><Typography variant="body2">Cerrada</Typography></MenuItem>
											</Select>
										</FormControl>
									)}
									{/* Filtro por Parte */}
									{onParteFilterChange && uniquePartes.length > 0 && (
										<FormControl size="small" sx={{ minWidth: 120 }}>
											<Select
												id="parte-filter"
												displayEmpty
												value={parteFilter}
												onChange={onParteFilterChange}
												sx={{
													maxHeight: "30.75px",
													bgcolor: "background.paper",
													"& .MuiSelect-select": { py: "6px" },
												}}
											>
												<MenuItem value="all"><Typography variant="body2">Parte: Todas</Typography></MenuItem>
												{uniquePartes.map((parte) => (
													<MenuItem key={parte} value={parte}>
														<Typography variant="body2">{parte}</Typography>
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
									{/* Filtro por Movimientos */}
									{onMovimientosFilterChange && (
										<FormControl size="small" sx={{ minWidth: 150 }}>
											<Select
												id="movimientos-filter"
												displayEmpty
												value={movimientosFilter}
												onChange={onMovimientosFilterChange}
												sx={{
													maxHeight: "30.75px",
													bgcolor: "background.paper",
													"& .MuiSelect-select": { py: "6px" },
												}}
											>
												<MenuItem value="all"><Typography variant="body2">Movimientos: Todos</Typography></MenuItem>
												<MenuItem value="today"><Typography variant="body2">Hoy</Typography></MenuItem>
												<MenuItem value="week"><Typography variant="body2">Última semana</Typography></MenuItem>
												<MenuItem value="month"><Typography variant="body2">Último mes</Typography></MenuItem>
												<MenuItem value="none"><Typography variant="body2">Sin movimientos</Typography></MenuItem>
											</Select>
										</FormControl>
									)}
									{/* Filtro por Jurisdicción */}
									{onJurisdiccionFilterChange && uniqueJurisdicciones.length > 0 && (
										<FormControl size="small" sx={{ minWidth: 140 }}>
											<Select
												id="jurisdiccion-filter"
												displayEmpty
												value={jurisdiccionFilter}
												onChange={onJurisdiccionFilterChange}
												sx={{
													maxHeight: "30.75px",
													bgcolor: "background.paper",
													"& .MuiSelect-select": { py: "6px" },
												}}
											>
												<MenuItem value="all"><Typography variant="body2">Jurisdicción: Todas</Typography></MenuItem>
												{uniqueJurisdicciones.map((juris) => (
													<MenuItem key={juris} value={juris}>
														<Typography variant="body2">{juris}</Typography>
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
								</Stack>
							</Box>
						</Collapse>
					)}

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
								{invalidCount > 0 && <Chip label={`${invalidCount} Invalida${invalidCount > 1 ? "s" : ""}`} color="error" size="small" />}
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
						py: { xs: 4, sm: 6 },
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						px: 2,
					}}
				>
					{data.length === 0 ? (
						isOnboarding && handleAdd ? (
							// Empty state especial para onboarding (solo si puede crear)
							<Stack spacing={3} alignItems="center" sx={{ maxWidth: 400, textAlign: "center" }}>
								<Box
									sx={{
										width: 80,
										height: 80,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(theme.palette.primary.main, 0.1),
										color: theme.palette.primary.main,
									}}
								>
									<Folder2 size={40} variant="Bulk" />
								</Box>
								<Stack spacing={1} alignItems="center">
									<Typography variant="h4" color="text.primary">
										Vamos a crear tu primera carpeta
									</Typography>
									<Typography variant="body1" color="text.secondary">
										Las carpetas representan expedientes, causas o clientes. Podes empezar con una y completarla luego.
									</Typography>
								</Stack>
								<Button variant="contained" color="primary" size="large" startIcon={<Add />} onClick={handleAdd} sx={{ mt: 1, textTransform: "none" }}>
									Crear mi primera carpeta
								</Button>
							</Stack>
						) : (
							// Empty state normal
							<>
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
									{handleAdd
										? "No hay causas creadas. Puedes crear una usando el botón 'Agregar Carpeta'."
										: "No hay causas disponibles en este equipo."}
								</Typography>
								<Typography variant="body2" color="textSecondary" align="center">
									{handleAdd
										? "Las causas que guardes aparecerán aquí"
										: "Las causas del equipo aparecerán aquí cuando estén disponibles"}
								</Typography>
							</>
						)
					) : (
						<>
							<SearchStatus1
								variant="Bulk"
								size={64}
								style={{
									marginBottom: "16px",
									color: theme.palette.warning.main,
									opacity: 0.7,
								}}
							/>
							<Typography variant="h5" gutterBottom align="center">
								No se encontraron causas para esta busqueda
							</Typography>
							<Typography variant="body2" color="textSecondary" align="center">
								Intenta con otros terminos de busqueda
							</Typography>
						</>
					)}
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
	const [searchParams] = useSearchParams();

	// Detectar si venimos desde onboarding
	const isOnboarding = searchParams.get("onboarding") === "true";

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
	const [archivedPage, setArchivedPage] = useState(1);
	const [archivedPageSize, setArchivedPageSize] = useState(10);
	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [menuRowId, setMenuRowId] = useState<string | null>(null);
	const [menuFolderData, setMenuFolderData] = useState<any>(null);
	const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);
	const [selectedFolderIdForCalculator, setSelectedFolderIdForCalculator] = useState<string>("");
	const [taskModalOpen, setTaskModalOpen] = useState(false);
	const [calcDataModalOpen, setCalcDataModalOpen] = useState(false);
	const [noteModalOpen, setNoteModalOpen] = useState(false);
	const [contactModalOpen, setContactModalOpen] = useState(false);
	const [movementModalOpen, setMovementModalOpen] = useState(false);
	const [eventModalOpen, setEventModalOpen] = useState(false);
	const [selectedFolderForModal, setSelectedFolderForModal] = useState<{ id: string; name: string }>({ id: "", name: "" });

	// Estado para CausaSelector (selección de múltiples resultados)
	const [causaSelectorOpen, setCausaSelectorOpen] = useState(false);
	const [causaSelectorFolder, setCausaSelectorFolder] = useState<{ id: string; name: string }>({ id: "", name: "" });

	// Estados para filtros de carpetas
	const [folderTypeFilter, setFolderTypeFilter] = useState<'all' | 'manual' | 'pjn' | 'eje' | 'mev'>('all');
	const [statusFilter, setStatusFilter] = useState<'all' | 'Nueva' | 'En Proceso' | 'Pendiente' | 'Cerrada'>('all');
	const [parteFilter, setParteFilter] = useState<string>('all');
	const [movimientosFilter, setMovimientosFilter] = useState<'all' | 'today' | 'week' | 'month' | 'none'>('all');
	const [jurisdiccionFilter, setJurisdiccionFilter] = useState<string>('all');

	// Estado para alinear la barra de carpetas con los botones de la toolbar
	const [barWidth, setBarWidth] = useState<number | undefined>(undefined);
	// Estado para pre-seleccionar paso y valores al abrir AddFolder desde los badges
	const [addFolderInitialStep, setAddFolderInitialStep] = useState<number | undefined>(undefined);
	const [addFolderInitialFormValues, setAddFolderInitialFormValues] = useState<{ entryMethod?: string; judicialPower?: string } | undefined>(undefined);

	// Referencias
	const mountedRef = useRef(false);
	const loadingRef = useRef(false);
	const pendingTableRef = useRef<HTMLDivElement>(null);

	// Selectores
	const user = useSelector((state) => state.auth.user);
	const { folders, archivedFolders, archivedPagination, isLoader } = useSelector((state) => state.folder);
	const subscription = useSelector((state) => state.auth.subscription);

	// Team context - para cargar recursos del equipo si hay uno activo
	const { activeTeam, isTeamMode, canCreate, canUpdate, canDelete, isInitialized: isTeamInitialized, getRequestHeaders } = useTeam();

	// Separar folders en categorías
	const { pendingOrInvalidFolders, verifiedFolders, pendingCount, invalidCount } = useMemo(() => {
		// Helper para determinar si una carpeta es automática (PJN, MEV o EJE)
		const isAutoFolder = (folder: any) => folder.source === "auto" || folder.pjn === true || folder.mev === true || folder.eje === true;

		// Filtrar folders que necesitan verificación o son inválidos
		// Para carpetas automáticas (source "auto", PJN, MEV o EJE)
		const pending = folders.filter(
			(folder: any) =>
				isAutoFolder(folder) &&
				// Pendientes de verificación
				(folder.causaVerified === false ||
					// Inválidos (verificados pero no válidos)
					(folder.causaVerified === true && folder.causaIsValid === false) ||
					// Asociación fallida
					folder.causaAssociationStatus === "failed" ||
					// Selección pendiente de múltiples causas
					folder.causaAssociationStatus === "pending_selection"),
		);

		// Contar pendientes e inválidas por separado
		const pendingVerification = folders.filter(
			(folder: any) => isAutoFolder(folder) && folder.causaVerified === false &&
				folder.causaAssociationStatus !== "failed" && folder.causaAssociationStatus !== "pending_selection"
		).length;

		// Contar folders con selección pendiente
		const pendingSelection = folders.filter(
			(folder: any) => isAutoFolder(folder) && folder.causaAssociationStatus === "pending_selection"
		).length;

		const invalid = folders.filter(
			(folder: any) => isAutoFolder(folder) && (
				(folder.causaVerified === true && folder.causaIsValid === false) ||
				folder.causaAssociationStatus === "failed"
			),
		).length;

		// Folders verificados y válidos (incluye todos los que NO están en pending)
		const verified = folders.filter(
			(folder: any) =>
				// Carpetas que NO son automáticas (siempre van a la tabla principal)
				!isAutoFolder(folder) ||
				// O carpetas automáticas que están verificadas y válidas (y no tienen selección pendiente)
				(isAutoFolder(folder) && folder.causaVerified === true && folder.causaIsValid === true &&
					folder.causaAssociationStatus !== "failed" && folder.causaAssociationStatus !== "pending_selection"),
		);

		return {
			pendingOrInvalidFolders: pending,
			verifiedFolders: verified,
			pendingCount: pendingVerification + pendingSelection,
			invalidCount: invalid,
		};
	}, [folders]);

	// Filtrar carpetas verificadas por tipo
	// Extraer valores únicos para filtros dinámicos
	const uniquePartes = useMemo(() => {
		const partes = new Set<string>();
		verifiedFolders.forEach((folder: any) => {
			if (folder.orderStatus) {
				partes.add(folder.orderStatus);
			}
		});
		return Array.from(partes).sort();
	}, [verifiedFolders]);

	const uniqueJurisdicciones = useMemo(() => {
		const jurisdicciones = new Set<string>();
		verifiedFolders.forEach((folder: any) => {
			if (folder.folderJuris?.label) {
				jurisdicciones.add(folder.folderJuris.label);
			}
		});
		return Array.from(jurisdicciones).sort();
	}, [verifiedFolders]);

	// Filtrar carpetas verificadas por todos los filtros
	const filteredVerifiedFolders = useMemo(() => {
		return verifiedFolders.filter((folder: any) => {
			// Filtro por tipo de carpeta
			if (folderTypeFilter !== 'all') {
				switch (folderTypeFilter) {
					case 'manual':
						if (!(folder.source === 'manual' || (!folder.pjn && !folder.mev && !folder.eje))) return false;
						break;
					case 'pjn':
						if (folder.pjn !== true) return false;
						break;
					case 'mev':
						if (folder.mev !== true) return false;
						break;
					case 'eje':
						if (folder.eje !== true) return false;
						break;
				}
			}

			// Filtro por estado
			if (statusFilter !== 'all' && folder.status !== statusFilter) {
				return false;
			}

			// Filtro por parte
			if (parteFilter !== 'all' && folder.orderStatus !== parteFilter) {
				return false;
			}

			// Filtro por jurisdicción
			if (jurisdiccionFilter !== 'all' && folder.folderJuris?.label !== jurisdiccionFilter) {
				return false;
			}

			// Filtro por movimientos recientes
			if (movimientosFilter !== 'all') {
				const lastMovement = folder.lastMovementDate ? dayjs(folder.lastMovementDate) : null;
				const today = dayjs().startOf('day');

				switch (movimientosFilter) {
					case 'today':
						if (!lastMovement || !lastMovement.isSame(today, 'day')) return false;
						break;
					case 'week':
						if (!lastMovement || !lastMovement.isAfter(today.subtract(7, 'day'))) return false;
						break;
					case 'month':
						if (!lastMovement || !lastMovement.isAfter(today.subtract(30, 'day'))) return false;
						break;
					case 'none':
						if (lastMovement) return false;
						break;
				}
			}

			return true;
		});
	}, [verifiedFolders, folderTypeFilter, statusFilter, parteFilter, jurisdiccionFilter, movimientosFilter]);

	// Efecto para la carga inicial y cuando cambia el equipo activo
	useEffect(() => {
		const loadFolders = async () => {
			// Si no hay usuario, establecer isInitialLoad a false para mostrar la UI vacía
			if (!user?._id) {
				setIsInitialLoad(false);
				return;
			}

			// Esperar a que el TeamContext esté inicializado
			if (!isTeamInitialized) {
				return;
			}

			// Si está en modo equipo pero aún no hay equipo activo seleccionado, esperar
			if (isTeamMode && !activeTeam?._id) {
				return;
			}

			if (loadingRef.current) return;

			try {
				loadingRef.current = true;

				// Si hay equipo activo, cargar folders del grupo
				// Si no, cargar folders del usuario
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getFoldersByGroupId(activeTeam._id));
				} else {
					const userId = user._id;
					if (userId) {
						await dispatch(getFoldersByUserId(userId));
					}
				}
				dispatch(fetchUserStats() as any);
			} catch (error) {
				console.error("Error loading folders:", error);
			} finally {
				loadingRef.current = false;
				setIsInitialLoad(false);
			}
		};

		loadFolders();

		return () => {
			loadingRef.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?._id, activeTeam?._id, isTeamMode, isTeamInitialized]);

	// Estados para el modal de límite de recursos
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [limitErrorMessage, setLimitErrorMessage] = useState("");

	// Handlers
	const handleCloseDialog = useCallback(() => {
		setAdd(false);
		setAddFolderInitialStep(undefined);
		setAddFolderInitialFormValues(undefined);
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

	// Abrir modal AddFolder en el paso de importar causa desde CABA (EJE)
	const handleOpenCabaFolder = useCallback(() => {
		setAddFolderInitialStep(2);
		setAddFolderInitialFormValues({ entryMethod: "automatic", judicialPower: "caba" });
		setAdd(true);
		setAddFolderMode("add");
		setFolder(null);
	}, []);

	// Abrir modal AddFolder en el paso de importar causa desde PJ Buenos Aires (MEV)
	const handleOpenBaFolder = useCallback(() => {
		setAddFolderInitialStep(2);
		setAddFolderInitialFormValues({ entryMethod: "automatic", judicialPower: "buenosaires" });
		setAdd(true);
		setAddFolderMode("add");
		setFolder(null);
	}, []);

	const handleArchiveSelected = useCallback(
		async (selectedRows: Row<any>[]) => {
			if (!user?._id || selectedRows.length === 0 || loadingRef.current) return;

			const folderIds = selectedRows.map((row) => row.original._id);

			try {
				loadingRef.current = true;
				const result = await dispatch(archiveFolders(user._id, folderIds, { headers: getRequestHeaders() }));

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

	// Estado para diálogo de confirmación de eliminación
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [foldersToDelete, setFoldersToDelete] = useState<Row<any>[]>([]);

	// Manejador para eliminar carpetas seleccionadas
	const handleDeleteSelected = useCallback((selectedRows: Row<any>[]) => {
		if (selectedRows.length === 0) return;
		setFoldersToDelete(selectedRows);
		setDeleteDialogOpen(true);
	}, []);

	const handleConfirmDelete = useCallback(async () => {
		if (!user?._id || foldersToDelete.length === 0 || loadingRef.current) return;

		const folderIds = foldersToDelete.map((row) => row.original._id);

		try {
			loadingRef.current = true;
			setDeleteDialogOpen(false);

			const result = await dispatch(deleteFoldersByIds(folderIds, { headers: getRequestHeaders() }));

			if (result.success) {
				setSnackbarMessage(
					`${result.deletedCount} ${result.deletedCount === 1 ? "carpeta eliminada" : "carpetas eliminadas"} correctamente`
				);
				setSnackbarSeverity("success");
			} else {
				setSnackbarMessage(result.message || "Error al eliminar carpetas");
				setSnackbarSeverity("error");
			}

			setSnackbarOpen(true);
		} catch (error) {
			setSnackbarMessage("Error al eliminar carpetas");
			setSnackbarSeverity("error");
			setSnackbarOpen(true);
		} finally {
			loadingRef.current = false;
			setFoldersToDelete([]);
		}
	}, [user?._id, foldersToDelete, getRequestHeaders]);

	const handleCancelDelete = useCallback(() => {
		setDeleteDialogOpen(false);
		setFoldersToDelete([]);
	}, []);

	// Manejadores para elementos archivados
	const handleOpenArchivedModal = useCallback(async () => {
		if (!user?._id || loadingRef.current) return;

		try {
			loadingRef.current = true;
			// Usar la función correcta según el modo equipo
			if (isTeamMode && activeTeam?._id) {
				await dispatch(getArchivedFoldersByGroupId(activeTeam._id, archivedPage, archivedPageSize));
			} else {
				await dispatch(getArchivedFoldersByUserId(user._id, archivedPage, archivedPageSize));
			}
			setArchivedModalOpen(true);
		} catch (error) {
			setSnackbarMessage("Error al obtener causas archivadas");
			setSnackbarSeverity("error");
			setSnackbarOpen(true);
		} finally {
			loadingRef.current = false;
		}
	}, [user?._id, archivedPage, archivedPageSize, isTeamMode, activeTeam?._id]);

	const handleCloseArchivedModal = useCallback(() => {
		setArchivedModalOpen(false);
		setArchivedPage(1); // Resetear a página 1 al cerrar
	}, []);

	const handleArchivedPageChange = useCallback(
		async (page: number) => {
			if (!user?._id || loadingRef.current) return;

			try {
				loadingRef.current = true;
				setArchivedPage(page);
				// Usar la función correcta según el modo equipo
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getArchivedFoldersByGroupId(activeTeam._id, page, archivedPageSize));
				} else {
					await dispatch(getArchivedFoldersByUserId(user._id, page, archivedPageSize));
				}
			} catch (error) {
				setSnackbarMessage("Error al cambiar de página");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			} finally {
				loadingRef.current = false;
			}
		},
		[user?._id, archivedPageSize, isTeamMode, activeTeam?._id],
	);

	const handleArchivedPageSizeChange = useCallback(
		async (pageSize: number) => {
			if (!user?._id || loadingRef.current) return;

			try {
				loadingRef.current = true;
				setArchivedPageSize(pageSize);
				setArchivedPage(1); // Resetear a página 1 cuando cambia el tamaño
				// Usar la función correcta según el modo equipo
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getArchivedFoldersByGroupId(activeTeam._id, 1, pageSize));
				} else {
					await dispatch(getArchivedFoldersByUserId(user._id, 1, pageSize));
				}
			} catch (error) {
				setSnackbarMessage("Error al cambiar tamaño de página");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			} finally {
				loadingRef.current = false;
			}
		},
		[user?._id, isTeamMode, activeTeam?._id],
	);

	const handleOpenGuide = useCallback(() => {
		setGuideOpen(true);
	}, []);

	// Handler para el filtro de tipo de carpeta
	const handleFolderTypeFilterChange = useCallback((event: SelectChangeEvent<'all' | 'manual' | 'pjn' | 'eje' | 'mev'>) => {
		setFolderTypeFilter(event.target.value as 'all' | 'manual' | 'pjn' | 'eje' | 'mev');
	}, []);

	const handleStatusFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setStatusFilter(event.target.value as 'all' | 'Nueva' | 'En Proceso' | 'Pendiente' | 'Cerrada');
	}, []);

	const handleParteFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setParteFilter(event.target.value);
	}, []);

	const handleMovimientosFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setMovimientosFilter(event.target.value as 'all' | 'today' | 'week' | 'month' | 'none');
	}, []);

	const handleJurisdiccionFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setJurisdiccionFilter(event.target.value);
	}, []);

	const handleUnarchiveSelected = useCallback(
		async (folderIds: string[]) => {
			if (!user?._id || folderIds.length === 0 || loadingRef.current) return;

			try {
				setLoadingUnarchive(true);
				const result = await dispatch(unarchiveFolders(user._id, folderIds, { headers: getRequestHeaders() }));

				if (result.success) {
					setSnackbarMessage(`${folderIds.length} ${folderIds.length === 1 ? "causa desarchivada" : "causas desarchivadas"} correctamente`);
					setSnackbarSeverity("success");
					setArchivedModalOpen(false);
					// En este caso SÍ necesitamos forzar recarga porque unarchiveFolders podría no tener todos los datos
					if (isTeamMode && activeTeam?._id) {
						await dispatch(getFoldersByGroupId(activeTeam._id));
					} else {
						await dispatch(getFoldersByUserId(user._id, true));
					}
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
	const handleMenuOpen = useCallback((event: MouseEvent<HTMLElement>, rowId: string, folderData?: any) => {
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
		setMenuRowId(rowId);
		setMenuFolderData(folderData || null);
	}, []);

	const handleMenuClose = useCallback(() => {
		setAnchorEl(null);
		setMenuRowId(null);
		setMenuFolderData(null);
	}, []);

	// Función para hacer scroll a la tabla de pendientes
	const handleScrollToPending = useCallback(() => {
		if (pendingTableRef.current) {
			pendingTableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, []);

	// Handlers para el modal de selección de calculadora
	const handleOpenCalculatorModal = useCallback((folderId: string) => {
		setSelectedFolderIdForCalculator(folderId);
		setCalculatorModalOpen(true);
		handleMenuClose();
	}, []);

	const handleCloseCalculatorModal = useCallback(() => {
		setCalculatorModalOpen(false);
		setSelectedFolderIdForCalculator("");
	}, []);

	// Handlers para el modal de tareas
	const handleOpenTaskModal = useCallback((folderId: string, folderName: string) => {
		setSelectedFolderForModal({ id: folderId, name: folderName });
		setTaskModalOpen(true);
		handleMenuClose();
	}, []);

	// Handlers para el modal de montos de reclamo/ofrecimiento
	const handleOpenCalcDataModal = useCallback((folderId: string, folderName: string) => {
		setSelectedFolderForModal({ id: folderId, name: folderName });
		setCalcDataModalOpen(true);
		handleMenuClose();
	}, []);

	// Handlers para el modal de notas
	const handleOpenNoteModal = useCallback((folderId: string, folderName: string) => {
		setSelectedFolderForModal({ id: folderId, name: folderName });
		setNoteModalOpen(true);
		handleMenuClose();
	}, []);

	// Handlers para el modal de contactos
	const handleOpenContactModal = useCallback((folderId: string, folderName: string) => {
		setSelectedFolderForModal({ id: folderId, name: folderName });
		setContactModalOpen(true);
		handleMenuClose();
	}, []);

	const handleCloseContactModal = useCallback(() => {
		setContactModalOpen(false);
	}, []);

	// Handlers para el modal de movimientos
	const handleOpenMovementModal = useCallback((folderId: string, folderName: string) => {
		setSelectedFolderForModal({ id: folderId, name: folderName });
		setMovementModalOpen(true);
		handleMenuClose();
	}, []);

	// Handlers para el modal de eventos
	const handleOpenEventModal = useCallback((folderId: string, folderName: string) => {
		setSelectedFolderForModal({ id: folderId, name: folderName });
		setEventModalOpen(true);
		handleMenuClose();
	}, []);

	const handleCloseEventModal = useCallback(() => {
		setEventModalOpen(false);
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

					// Solo mostrar indicadores visuales si pjn === true, mev === true o eje === true
					const showStatusIndicators = folder.pjn === true || folder.mev === true || folder.eje === true;
					// Si no se deben mostrar indicadores, solo mostrar el nombre
					if (!showStatusIndicators) {
						return <span>{formatFolderName(value, 50)}</span>;
					}

					// Si la causa no fue encontrada en el portal PJN en el último sync
					if (folder.pjn === true && folder.pjnNotFound === true) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<span>{formatFolderName(value, 50)}</span>
								<Tooltip title="Esta causa no fue encontrada en tu lista de Mis Causas del portal PJN. Puede haber sido archivada o desvinculada por el tribunal.">
									<IconButton
										size="small"
										onClick={(e) => e.stopPropagation()}
										sx={{
											padding: 0.5,
											"&:hover": {
												backgroundColor: "warning.lighter",
											},
										}}
									>
										<Warning2 size={16} variant="Bold" color="#F59E0B" />
									</IconButton>
								</Tooltip>
							</Stack>
						);
					}

					// Si hay selección pendiente de múltiples causas, mostrar chip de seleccionar
					if (folder.causaAssociationStatus === "pending_selection") {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Chip
									icon={<Warning2 size={14} />}
									color="warning"
									label="Seleccionar expediente"
									size="small"
									variant="light"
									onClick={(e) => {
										e.stopPropagation();
										setCausaSelectorFolder({ id: folder._id, name: folder.folderName || folder.searchTerm || "" });
										setCausaSelectorOpen(true);
									}}
									sx={{ cursor: "pointer" }}
								/>
								<Tooltip title="Se encontraron múltiples expedientes - Haz clic para seleccionar">
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											setCausaSelectorFolder({ id: folder._id, name: folder.folderName || folder.searchTerm || "" });
											setCausaSelectorOpen(true);
										}}
										sx={{
											padding: 0.5,
											"&:hover": {
												backgroundColor: "warning.lighter",
											},
										}}
									>
										<Warning2 size={16} variant="Bold" color="#F59E0B" />
									</IconButton>
								</Tooltip>
							</Stack>
						);
					}

					// Si la asociación falló, mostrar chip de error
					if (folder.causaAssociationStatus === "failed") {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Chip color="error" label="Asociación fallida" size="small" variant="light" />
								<Tooltip title="No se pudo vincular la causa - Verifique los datos ingresados">
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

					// Si causaVerified es false o no está verificado (pendiente), mostrar chip de pendiente con botón de actualización
					if (folder.causaVerified === false || (folder.causaVerified !== true && (folder.pjn || folder.mev || folder.eje))) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Chip color="warning" label="Pendiente de verificación" size="small" variant="light" />
								<Tooltip title="Actualizar estado de verificación">
									<IconButton
										size="small"
										onClick={async (e) => {
											e.stopPropagation();
											const result = await dispatch(getFolderById(folder._id, true));

											if (result.success && result.folder) {
												if (result.folder.causaAssociationStatus === "pending_selection") {
													// Múltiples resultados - requiere selección
													setSnackbarMessage("Hay múltiples resultados. Seleccione el expediente correcto.");
													setSnackbarSeverity("info");
													setSnackbarOpen(true);
												} else if (result.folder.causaVerified && result.folder.causaIsValid) {
													setSnackbarMessage("La carpeta fue sincronizada correctamente");
													setSnackbarSeverity("success");
													setSnackbarOpen(true);
												} else if (result.folder.causaVerified && result.folder.causaIsValid === false) {
													// Solo si es explícitamente false (no null)
													setSnackbarMessage("La carpeta no existe o no es pública");
													setSnackbarSeverity("error");
													setSnackbarOpen(true);
												}
											} else if (!result.success) {
												setSnackbarMessage(result.message || "Error al verificar la carpeta. Intente nuevamente");
												setSnackbarSeverity("error");
												setSnackbarOpen(true);
											}
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
											const result = await dispatch(getFolderById(folder._id, true));

											if (result.success && result.folder) {
												if (result.folder.causaAssociationStatus === "pending_selection") {
													// Múltiples resultados - requiere selección
													setSnackbarMessage("Hay múltiples resultados. Seleccione el expediente correcto.");
													setSnackbarSeverity("info");
													setSnackbarOpen(true);
												} else if (result.folder.causaVerified && result.folder.causaIsValid) {
													setSnackbarMessage("La carpeta fue sincronizada correctamente");
													setSnackbarSeverity("success");
													setSnackbarOpen(true);
												} else if (result.folder.causaVerified && result.folder.causaIsValid === false) {
													// Solo si es explícitamente false (no null)
													setSnackbarMessage("La carpeta no existe o no es pública");
													setSnackbarSeverity("error");
													setSnackbarOpen(true);
												}
											} else if (!result.success) {
												setSnackbarMessage(result.message || "Error al verificar la carpeta. Intente nuevamente");
												setSnackbarSeverity("error");
												setSnackbarOpen(true);
											}
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
									title={folder.pjn === true ? "Causa vinculada a PJN" : folder.mev === true ? "Causa vinculada a MEV" : folder.eje === true ? "Causa vinculada a EJE" : "Causa vinculada"}
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
								const parsed = dayjs.utc(date);
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

					// Formatear la fecha de formato ISO a DD/MM/YYYY (conservar UTC)
					try {
						const parsedDate = dayjs.utc(value);
						if (parsedDate.isValid()) {
							const formattedDate = parsedDate.format("DD/MM/YYYY");
							const isToday = parsedDate.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");

							if (isToday) {
								return (
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<Box
											sx={{
												width: 8,
												height: 8,
												borderRadius: "50%",
												bgcolor: "success.main",
												animation: "pulse 2s infinite",
												"@keyframes pulse": {
													"0%": {
														boxShadow: "0 0 0 0 rgba(34, 197, 94, 0.7)",
													},
													"70%": {
														boxShadow: "0 0 0 6px rgba(34, 197, 94, 0)",
													},
													"100%": {
														boxShadow: "0 0 0 0 rgba(34, 197, 94, 0)",
													},
												},
											}}
										/>
										<Tooltip title="Movimiento de hoy">
											<Typography
												variant="body2"
												sx={{
													fontWeight: 600,
													color: "success.main",
												}}
											>
												{formattedDate}
											</Typography>
										</Tooltip>
									</Stack>
								);
							}

							return <span>{formattedDate}</span>;
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
					const folder = row.original;
					const isAutoFolder = folder.pjn || folder.mev || folder.eje;

					// Folders con error: asociación fallida o causa inválida
					const isErrorFolder =
						isAutoFolder &&
						(folder.causaAssociationStatus === "failed" || (folder.causaVerified === true && folder.causaIsValid === false));

					// Folders pendientes de verificación (sin error, esperando al worker)
					const isPendingVerification =
						isAutoFolder &&
						!isErrorFolder &&
						(folder.causaVerified !== true || folder.causaAssociationStatus === "pending_selection");

					// Deshabilitar acciones principales para pendientes y errores
					const disableMainActions = isPendingVerification || isErrorFolder;

					// Tooltip según el estado
					const getTooltipText = (action: string) => {
						if (isPendingVerification) return "Pendiente de verificación";
						if (isErrorFolder) return action === "Eliminar" ? "Eliminar" : "Causa con error";
						return action;
					};

					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
							<Tooltip title={getTooltipText("Abrir")}>
								<span>
									<IconButton
										color="success"
										disabled={disableMainActions}
										onClick={(e) => handleRowAction(e, () => navigate(`../details/${row.values._id}`))}
									>
										<Maximize variant="Bulk" />
									</IconButton>
								</span>
							</Tooltip>
							{canUpdate && (
								<Tooltip title={getTooltipText("Editar")}>
									<span>
										<IconButton
											color="primary"
											disabled={disableMainActions}
											onClick={(e) => handleRowAction(e, () => handleEditContact(row.original))}
										>
											<Edit variant="Bulk" />
										</IconButton>
									</span>
								</Tooltip>
							)}
							{canDelete && (
								<Tooltip title={getTooltipText("Eliminar")}>
									<span>
										<IconButton
											color="error"
											disabled={isPendingVerification}
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
									</span>
								</Tooltip>
							)}
							<Tooltip title={getTooltipText("Más acciones")}>
								<span>
									<IconButton color="secondary" disabled={disableMainActions} onClick={(e) => handleMenuOpen(e, row.id, row.original)}>
										<More variant="Bulk" />
									</IconButton>
								</span>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		[theme, mode, handleEditContact, handleClose, navigate, handleRowAction, handleMenuOpen, canUpdate, canDelete],
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
				<ResourceUsageBar resourceType="folders" compact barWidth={barWidth} onCabaClick={canCreate ? handleOpenCabaFolder : undefined} onBaClick={canCreate ? handleOpenBaFolder : undefined} />

				{/* Microhint de onboarding */}
				{isOnboarding && verifiedFolders.length === 0 && (
					<Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 0 }}>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.75rem",
								letterSpacing: "0.02em",
							}}
						>
							Primeros pasos · Crea tu primera carpeta
						</Typography>
					</Box>
				)}

				{/* Tabla principal de causas verificadas */}
				<Box>
					<ScrollX>
						<ReactTable
							columns={columns as any}
							data={filteredVerifiedFolders}
							handleAdd={canCreate ? handleAddFolder : undefined}
							handleArchiveSelected={canUpdate ? handleArchiveSelected : undefined}
							handleDeleteSelected={canDelete ? handleDeleteSelected : undefined}
							handleOpenGuide={handleOpenGuide}
							handleOpenArchivedModal={handleOpenArchivedModal}
							renderRowSubComponent={renderRowSubComponent}
							isLoading={isLoader}
							expandedRowId={expandedRowId}
							navigate={navigate}
							skeletonRowCount={filteredVerifiedFolders.length}
							pendingCount={pendingCount}
							invalidCount={invalidCount}
							onScrollToPending={handleScrollToPending}
							anchorEl={anchorEl}
							menuRowId={menuRowId}
							handleMenuOpen={handleMenuOpen}
							handleMenuClose={handleMenuClose}
							isOnboarding={isOnboarding}
							folderTypeFilter={folderTypeFilter}
							onFolderTypeFilterChange={handleFolderTypeFilterChange}
							statusFilter={statusFilter}
							onStatusFilterChange={handleStatusFilterChange}
							parteFilter={parteFilter}
							onParteFilterChange={handleParteFilterChange}
							uniquePartes={uniquePartes}
							movimientosFilter={movimientosFilter}
							onMovimientosFilterChange={handleMovimientosFilterChange}
							jurisdiccionFilter={jurisdiccionFilter}
							onJurisdiccionFilterChange={handleJurisdiccionFilterChange}
							uniqueJurisdicciones={uniqueJurisdicciones}
						onBarWidthMeasured={setBarWidth}
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
								handleAdd={canCreate ? handleAddFolder : undefined}
								handleArchiveSelected={canUpdate ? handleArchiveSelected : undefined}
								handleOpenGuide={handleOpenGuide}
								handleOpenArchivedModal={handleOpenArchivedModal}
								renderRowSubComponent={renderRowSubComponent}
								isLoading={isLoader}
								expandedRowId={expandedRowId}
								navigate={navigate}
								hideControls={true}
								simpleSkeleton={true}
								skeletonRowCount={pendingOrInvalidFolders.length}
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
					{canCreate && (
						<>
							<MenuItem
								onClick={(e) => {
									e.stopPropagation();
									if (menuFolderData && menuFolderData._id) {
										handleOpenCalculatorModal(menuFolderData._id);
									}
								}}
							>
								<ListItemIcon>
									<CalculatorIcon variant="Bulk" size={18} />
								</ListItemIcon>
								<ListItemText>Crear Cálculo</ListItemText>
							</MenuItem>
							<MenuItem
								onClick={(e) => {
									e.stopPropagation();
									if (menuFolderData && menuFolderData._id && menuFolderData.folderName) {
										handleOpenTaskModal(menuFolderData._id, menuFolderData.folderName);
									}
								}}
							>
								<ListItemIcon>
									<TaskSquare variant="Bulk" size={18} />
								</ListItemIcon>
								<ListItemText>Crear Tarea</ListItemText>
							</MenuItem>
							<MenuItem
								onClick={(e) => {
									e.stopPropagation();
									if (menuFolderData && menuFolderData._id && menuFolderData.folderName) {
										handleOpenNoteModal(menuFolderData._id, menuFolderData.folderName);
									}
								}}
							>
								<ListItemIcon>
									<DocumentText variant="Bulk" size={18} />
								</ListItemIcon>
								<ListItemText>Crear Nota</ListItemText>
							</MenuItem>
							<MenuItem
								onClick={(e) => {
									e.stopPropagation();
									if (menuFolderData && menuFolderData._id && menuFolderData.folderName) {
										handleOpenContactModal(menuFolderData._id, menuFolderData.folderName);
									}
								}}
							>
								<ListItemIcon>
									<Profile2User variant="Bulk" size={18} />
								</ListItemIcon>
								<ListItemText>Crear Contacto</ListItemText>
							</MenuItem>
							<MenuItem
								onClick={(e) => {
									e.stopPropagation();
									if (menuFolderData && menuFolderData._id && menuFolderData.folderName) {
										handleOpenMovementModal(menuFolderData._id, menuFolderData.folderName);
									}
								}}
							>
								<ListItemIcon>
									<TableDocument variant="Bulk" size={18} />
								</ListItemIcon>
								<ListItemText>Crear Movimiento</ListItemText>
							</MenuItem>
							<MenuItem
								onClick={(e) => {
									e.stopPropagation();
									if (menuFolderData && menuFolderData._id && menuFolderData.folderName) {
										handleOpenEventModal(menuFolderData._id, menuFolderData.folderName);
									}
								}}
							>
								<ListItemIcon>
									<Calendar variant="Bulk" size={18} />
								</ListItemIcon>
								<ListItemText>Crear Evento</ListItemText>
							</MenuItem>
							<MenuItem
								onClick={(e) => {
									e.stopPropagation();
									if (menuFolderData && menuFolderData._id && menuFolderData.folderName) {
										handleOpenCalcDataModal(menuFolderData._id, menuFolderData.folderName);
									}
								}}
							>
								<ListItemIcon>
									<Moneys variant="Bulk" size={18} />
								</ListItemIcon>
								<ListItemText>Crear Oferta/Reclamo</ListItemText>
							</MenuItem>
						</>
					)}
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
						<AddFolder open={add} folder={folder} mode={addFolderMode} onCancel={handleCloseDialog} onAddFolder={handleCloseDialog} initialStep={addFolderInitialStep} initialFormValues={addFolderInitialFormValues} />
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
					pagination={archivedPagination}
					onPageChange={handleArchivedPageChange}
					onPageSizeChange={handleArchivedPageSizeChange}
				/>

				{/* Guía de causas */}
				<GuideFolders open={guideOpen} onClose={() => setGuideOpen(false)} />

				{/* Modal de selección de tipo de calculadora */}
				<SelectCalculatorTypeModal
					open={calculatorModalOpen}
					onClose={handleCloseCalculatorModal}
					folderId={selectedFolderIdForCalculator}
				/>

				{/* Modal de creación de tareas */}
				<ModalTasks
					open={taskModalOpen}
					setOpen={setTaskModalOpen}
					folderId={selectedFolderForModal.id}
					folderName={selectedFolderForModal.name}
					handlerAddress={undefined}
				/>

				{/* Modal de agregar montos de reclamo/ofrecimiento */}
				<ModalCalcData
					open={calcDataModalOpen}
					setOpen={setCalcDataModalOpen}
					folderId={selectedFolderForModal.id}
					folderName={selectedFolderForModal.name}
					handlerAddress={undefined}
				/>

				{/* Modal de creación de notas */}
				<ModalNotes
					open={noteModalOpen}
					setOpen={setNoteModalOpen}
					folderId={selectedFolderForModal.id}
					folderName={selectedFolderForModal.name}
					handlerAddress={undefined}
				/>

				{/* Modal de creación de contactos */}
				{contactModalOpen && (
					<Dialog
						maxWidth="sm"
						TransitionComponent={PopupTransition}
						keepMounted
						fullWidth
						open={contactModalOpen}
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
						<AddCustomer
							open={contactModalOpen}
							customer={null}
							mode="add"
							folderId={selectedFolderForModal.id}
							onCancel={handleCloseContactModal}
							onAddMember={() => {
								// Callback cuando se agrega un contacto exitosamente
								handleCloseContactModal();
							}}
						/>
					</Dialog>
				)}

				{/* Modal de creación de movimientos */}
				<ModalMovements
					open={movementModalOpen}
					setOpen={setMovementModalOpen}
					folderId={selectedFolderForModal.id}
					folderName={selectedFolderForModal.name}
					editMode={false}
					movementData={null}
				/>

				{/* Modal de creación de eventos */}
				{eventModalOpen && (
					<Dialog
						maxWidth="sm"
						TransitionComponent={PopupTransition}
						keepMounted
						fullWidth
						open={eventModalOpen}
						onClose={handleCloseEventModal}
						sx={{
							"& .MuiDialog-paper": {
								p: 0,
							},
						}}
					>
						<AddEventFrom
							event={null}
							range={null}
							onCancel={handleCloseEventModal}
							userId={user?._id}
							folderId={selectedFolderForModal.id}
							folderName={selectedFolderForModal.name}
						/>
					</Dialog>
				)}

				{/* Modal de selección de causa (múltiples resultados) */}
				<CausaSelector
					open={causaSelectorOpen}
					onClose={() => setCausaSelectorOpen(false)}
					folderId={causaSelectorFolder.id}
					folderName={causaSelectorFolder.name}
					onCausaSelected={() => {
						// Refrescar la lista de folders
						if (isTeamMode && activeTeam?._id) {
							dispatch(getFoldersByGroupId(activeTeam._id));
						} else if (user?._id) {
							dispatch(getFoldersByUserId(user._id, true));
						}
					}}
					onSelectionCancelled={() => {
						// Refrescar la lista de folders
						if (isTeamMode && activeTeam?._id) {
							dispatch(getFoldersByGroupId(activeTeam._id));
						} else if (user?._id) {
							dispatch(getFoldersByUserId(user._id, true));
						}
					}}
				/>

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

				{/* Diálogo de confirmación de eliminación */}
				<Dialog
					open={deleteDialogOpen}
					onClose={handleCancelDelete}
					keepMounted
					TransitionComponent={PopupTransition}
					maxWidth="xs"
					aria-labelledby="delete-dialog-title"
					aria-describedby="delete-dialog-description"
				>
					<DialogContent sx={{ mt: 2, my: 1 }}>
						<Stack alignItems="center" spacing={3.5}>
							<Avatar color="error" sx={{ width: 72, height: 72, fontSize: "1.75rem" }}>
								<Trash variant="Bold" />
							</Avatar>
							<Stack spacing={2}>
								<Typography variant="h4" align="center">
									¿Estás seguro que deseas eliminarlo?
								</Typography>
								<Typography align="center">
									Eliminando{" "}
									<Typography variant="subtitle1" component="span">
										{foldersToDelete.length} {foldersToDelete.length === 1 ? "carpeta" : "carpetas"}
									</Typography>{" "}
									no podrás luego recuperar sus datos.
								</Typography>
							</Stack>
							<Stack direction="row" spacing={2} sx={{ width: 1 }}>
								<Button fullWidth onClick={handleCancelDelete} color="secondary" variant="outlined">
									Cancelar
								</Button>
								<Button fullWidth onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
									Eliminar
								</Button>
							</Stack>
						</Stack>
					</DialogContent>
				</Dialog>
			</MainCard>
		</>
	);
};

export default FoldersLayout;
