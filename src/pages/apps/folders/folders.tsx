import React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, Fragment, MouseEvent, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
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
	CardActions,
	CircularProgress,
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
	ArrowRight2,
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
import {
	Calculator as CalculatorIcon,
	TaskSquare,
	Moneys,
	DocumentText,
	Profile2User,
	TableDocument,
	Calendar,
	DocumentText1,
	NoteText,
} from "iconsax-react";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";
import PickModelDialog from "sections/apps/rich-text-documents/PickModelDialog";
import { ResponsiveDialog } from "components/@extended/ResponsiveDialog";

// sections
import ArchivedItemsModal from "sections/apps/customer/ArchivedItemsModal";
import { GuideFolders } from "components/guides";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import { ResourceUsageBar } from "sections/widget/chart/ResourceUsageWidget";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER, LIVE_PULSE_KEYFRAMES } from "themes/dashboardTokens";
import { useScbaCredentialError } from "hooks/useScbaCredentialError";
import { usePjnCredentialError } from "hooks/usePjnCredentialError";

// ==============================|| STATUS PILL ||============================== //
// Píldora de estado con dot + label — uniforme para Nueva / En Proceso /
// Pendiente / Cerrada. Replica el patrón de JurisdictionPill: dot indicador
// + texto. Cada estado tiene su hue propio (verde / brand / ámbar / neutro)
// pero la forma y la jerarquía visual son idénticas.

const StatusPill = ({ status }: { status: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const config = (() => {
		switch (status) {
			case "Nueva":
				return { dot: LIVE_GREEN, bgAlpha: isDark ? 0.14 : 0.08, borderAlpha: isDark ? 0.36 : 0.22 };
			case "En Proceso":
				return { dot: BRAND_BLUE, bgAlpha: isDark ? 0.14 : 0.08, borderAlpha: isDark ? 0.36 : 0.22 };
			case "Pendiente":
				return { dot: STALE_AMBER, bgAlpha: isDark ? 0.16 : 0.1, borderAlpha: isDark ? 0.4 : 0.24 };
			case "Cerrada":
				return { dot: theme.palette.text.secondary, bgAlpha: isDark ? 0.1 : 0.06, borderAlpha: isDark ? 0.24 : 0.14 };
			default:
				return { dot: theme.palette.text.disabled, bgAlpha: 0.04, borderAlpha: 0.12 };
		}
	})();

	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.625,
				px: 0.875,
				py: 0.375,
				borderRadius: 0.875,
				bgcolor: alpha(config.dot, config.bgAlpha),
				border: `1px solid ${alpha(config.dot, config.borderAlpha)}`,
			}}
		>
			<Box aria-hidden sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: config.dot, flexShrink: 0 }} />
			<Typography
				sx={{
					fontSize: "0.7rem",
					fontWeight: 600,
					letterSpacing: "0.01em",
					color: "text.primary",
					lineHeight: 1,
					whiteSpace: "nowrap",
				}}
			>
				{status}
			</Typography>
		</Box>
	);
};

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
	/** If true, disables row-level navigation to folder details (desktop double-click + mobile card title click). */
	disableRowNavigation?: boolean;
	/** If true, disables row selection: hides the checkbox column and removes the click-to-toggle on rows/cards. */
	disableRowSelection?: boolean;
	/** Filtros */
	folderTypeFilter?: "all" | "manual" | "pjn" | "eje" | "mev";
	onFolderTypeFilterChange?: (event: SelectChangeEvent<"all" | "manual" | "pjn" | "eje" | "mev">) => void;
	statusFilter?: "all" | "Nueva" | "En Proceso" | "Pendiente" | "Cerrada";
	onStatusFilterChange?: (event: SelectChangeEvent<string>) => void;
	parteFilter?: string;
	onParteFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniquePartes?: string[];
	movimientosFilter?: "all" | "today" | "week" | "month" | "none";
	onMovimientosFilterChange?: (event: SelectChangeEvent<string>) => void;
	jurisdiccionFilter?: string;
	onJurisdiccionFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniqueJurisdicciones?: string[];
	handleDeleteSelected?: (selectedRows: any[]) => void;
	onBarWidthMeasured?: (width: number) => void;
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
	folderTypeFilter = "all",
	onFolderTypeFilterChange,
	statusFilter = "all",
	onStatusFilterChange,
	parteFilter = "all",
	onParteFilterChange,
	uniquePartes = [],
	movimientosFilter = "all",
	onMovimientosFilterChange,
	jurisdiccionFilter = "all",
	onJurisdiccionFilterChange,
	uniqueJurisdicciones = [],
	onBarWidthMeasured,
	disableRowNavigation = false,
	disableRowSelection = false,
}: ReactTableProps) {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [isColumnsReady, setIsColumnsReady] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	// Estilo brand-aware de la tabla — header tintado, hover/selected brand,
	// tabular-nums en numeric content. Scoped a esta tabla, no toca el theme
	// global de MuiTable (que es shared con otras páginas).
	const tableSx = {
		"& .MuiTableHead-root .MuiTableCell-head": {
			fontSize: "0.7rem",
			fontWeight: 600,
			letterSpacing: "0.1em",
			textTransform: "uppercase",
			color: "text.secondary",
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			py: 1.5,
			// Override del vertical divider que viene del theme global
			"&:not(:last-of-type):after": {
				backgroundColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.1),
			},
		},
		"& .MuiTableBody-root .MuiTableCell-root": {
			py: 1.75,
			fontVariantNumeric: "tabular-nums",
			letterSpacing: "-0.005em",
		},
	} as const;

	// Estilo compartido de los Select del filter panel — borde tintado brand,
	// hover y focus coherentes con el lenguaje del header/landing.
	const filterSelectSx = {
		bgcolor: theme.palette.background.paper,
		"& .MuiSelect-select": {
			py: "7px",
			fontSize: "0.8rem",
			fontWeight: 500,
			letterSpacing: "0.005em",
		},
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
			transition: "border-color 0.15s ease",
		},
		"&:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
		},
		"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, 0.55),
			borderWidth: 1,
		},
	} as const;
	const csvLinkRef = useRef<any>(null);
	const g1ButtonRef = useRef<HTMLButtonElement>(null);
	const g2StackRef = useRef<HTMLDivElement>(null);
	// Mobile overflow menu
	const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
	const mobileMenuOpen = Boolean(mobileMenuAnchor);
	const handleMobileMenuOpen = (e: MouseEvent<HTMLElement>) => setMobileMenuAnchor(e.currentTarget);
	const handleMobileMenuClose = () => setMobileMenuAnchor(null);
	// Desktop overflow menu (CSV + Guía)
	const [desktopMenuAnchor, setDesktopMenuAnchor] = useState<null | HTMLElement>(null);
	const desktopMenuOpen = Boolean(desktopMenuAnchor);
	const handleDesktopMenuOpen = (e: MouseEvent<HTMLElement>) => setDesktopMenuAnchor(e.currentTarget);
	const handleDesktopMenuClose = () => setDesktopMenuAnchor(null);

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
		if (folderTypeFilter !== "all") count++;
		if (statusFilter !== "all") count++;
		if (parteFilter !== "all") count++;
		if (movimientosFilter !== "all") count++;
		if (jurisdiccionFilter !== "all") count++;
		return count;
	}, [folderTypeFilter, statusFilter, parteFilter, movimientosFilter, jurisdiccionFilter]);

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "folderName", desc: false };

	const defaultHiddenColumns = useMemo(() => {
		const base = matchDownSM
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
			: ["email", "_id", "description", "finalDateFolder", "createdAt", "updatedAt"];
		return disableRowSelection ? [...base, "selection"] : base;
	}, [matchDownSM, disableRowSelection]);

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
					{/* ── TOOLBAR ──────────────────────────────────────────────────────────
					    Desktop (≥ sm): una sola fila —  Agregar | sep | Archivados+Archivar | sep | Filtros+Orden | sep | [Buscador · CSV · Eliminar · Guía]
					    Mobile (< sm):  fila 1 = Buscador full-width
					                   fila 2 = [Agregar carpeta (contained)] [overflow MoreVert → resto de acciones]
					─────────────────────────────────────────────────────────────────────── */}

					{matchDownSM ? (
						/* ── MOBILE TOOLBAR ── */
						<Stack spacing={1.5} sx={{ ...(isOnboarding && data.length === 0 && { opacity: 0.7 }) }}>
							{/* Fila 1: Buscador (acción primaria) */}
							<Box sx={{ width: "100%", ...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }) }}>
								<GlobalFilter
									preGlobalFilteredRows={preGlobalFilteredRows as any}
									globalFilter={globalFilter}
									setGlobalFilter={setGlobalFilter}
									disabled={data.length === 0}
								/>
							</Box>

							{/* Fila 2: Agregar carpeta + overflow */}
							<Stack direction="row" spacing={1} alignItems="center">
								{handleAdd && (
									<Button
										ref={g1ButtonRef}
										variant="contained"
										size="small"
										startIcon={<FolderAdd />}
										onClick={handleAdd}
										sx={{
											textTransform: "none",
											flex: 1,
											bgcolor: BRAND_BLUE,
											color: "#fff",
											fontWeight: 600,
											letterSpacing: "-0.005em",
											borderRadius: 1.25,
											boxShadow: "none",
											transition: "background-color 0.15s ease",
											"&:hover": {
												bgcolor: alpha(BRAND_BLUE, 0.88),
												boxShadow: "none",
											},
										}}
										data-testid="folder-add-btn"
									>
										{isOnboarding && data.length === 0 ? "Crear mi primera carpeta" : "Agregar carpeta"}
									</Button>
								)}

								{/* Overflow: resto de acciones colapsadas */}
								<Tooltip title="Más opciones">
									<span>
										<IconButton size="small" color="secondary" onClick={handleMobileMenuOpen} aria-label="Más opciones">
											<More variant="Bulk" size={20} />
										</IconButton>
									</span>
								</Tooltip>
								<Menu
									anchorEl={mobileMenuAnchor}
									open={mobileMenuOpen}
									onClose={handleMobileMenuClose}
									anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
									transformOrigin={{ vertical: "top", horizontal: "right" }}
									slotProps={{ paper: { sx: { minWidth: 200 } } }}
								>
									{/* Archivados */}
									<MenuItem
										onClick={() => {
											handleMobileMenuClose();
											handleOpenArchivedModal?.();
										}}
										sx={{ ...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }) }}
									>
										<ListItemIcon>
											<Box1 size={18} />
										</ListItemIcon>
										<ListItemText>Archivados</ListItemText>
									</MenuItem>

									{/* Archivar seleccionados */}
									{handleArchiveSelected && (
										<MenuItem
											onClick={() => {
												handleMobileMenuClose();
												handleArchiveSelected(selectedFlatRows);
											}}
											disabled={Object.keys(selectedRowIds).length === 0}
											sx={{ ...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }) }}
										>
											<ListItemIcon>
												<Archive size={18} />
											</ListItemIcon>
											<ListItemText>
												{Object.keys(selectedRowIds).length > 0 ? `Archivar (${selectedFlatRows.length})` : "Archivar seleccionados"}
											</ListItemText>
										</MenuItem>
									)}

									{/* Filtros toggle */}
									{onFolderTypeFilterChange && (
										<MenuItem
											onClick={() => {
												handleMobileMenuClose();
												setShowFilters((prev) => !prev);
											}}
											sx={{ ...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }) }}
										>
											<ListItemIcon>
												<Filter size={18} />
											</ListItemIcon>
											<ListItemText>
												{activeFiltersCount > 0 ? `Filtros (${activeFiltersCount})` : showFilters ? "Ocultar filtros" : "Filtros"}
											</ListItemText>
										</MenuItem>
									)}

									{/* Eliminar seleccionados */}
									{handleDeleteSelected && (
										<MenuItem
											onClick={() => {
												handleMobileMenuClose();
												handleDeleteSelected(selectedFlatRows);
											}}
											disabled={Object.keys(selectedRowIds).length === 0}
										>
											<ListItemIcon>
												<Trash variant="Bulk" size={18} />
											</ListItemIcon>
											<ListItemText>
												{Object.keys(selectedRowIds).length > 0 ? `Eliminar (${selectedFlatRows.length})` : "Eliminar seleccionados"}
											</ListItemText>
										</MenuItem>
									)}

									{/* Exportar CSV */}
									<MenuItem
										onClick={() => {
											handleMobileMenuClose();
											csvLinkRef.current?.link?.click();
										}}
									>
										<ListItemIcon>
											<DocumentDownload variant="Bulk" size={18} />
										</ListItemIcon>
										<ListItemText>Exportar CSV</ListItemText>
									</MenuItem>

									{/* Guía */}
									<MenuItem
										onClick={() => {
											handleMobileMenuClose();
											handleOpenGuide?.();
										}}
									>
										<ListItemIcon>
											<InfoCircle variant="Bulk" size={18} />
										</ListItemIcon>
										<ListItemText>Ver Guía</ListItemText>
									</MenuItem>
								</Menu>
								<CSVLink ref={csvLinkRef} data={csvData} headers={csvHeaders} filename={"causas.csv"} style={{ display: "none" }} />
							</Stack>
						</Stack>
					) : (
						/* ── DESKTOP TOOLBAR ── */
						<Stack ref={g2StackRef} direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
							{/* Grupo 1: Acción principal */}
							{handleAdd && (
								<Button
									ref={g1ButtonRef}
									variant="contained"
									size="small"
									startIcon={<FolderAdd />}
									onClick={handleAdd}
									sx={{
										textTransform: "none",
										bgcolor: BRAND_BLUE,
										color: "#fff",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										borderRadius: 1.25,
										boxShadow: "none",
										transition: "background-color 0.15s ease",
										"&:hover": {
											bgcolor: alpha(BRAND_BLUE, 0.88),
											boxShadow: "none",
										},
									}}
									data-testid="folder-add-btn"
								>
									{isOnboarding && data.length === 0 ? "Crear mi primera carpeta" : "Agregar carpeta"}
								</Button>
							)}

							{/* Grupo 2: Gestión de archivados */}
							<Stack direction="row" spacing={1} sx={{ ...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }) }}>
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
									<Tooltip
										title={Object.keys(selectedRowIds).length === 0 ? "Seleccioná al menos una carpeta para archivar" : ""}
										placement="top"
									>
										<span>
											<Button
												variant="outlined"
												color="secondary"
												size="small"
												startIcon={<Archive size={18} />}
												onClick={() => handleArchiveSelected(selectedFlatRows)}
												disabled={Object.keys(selectedRowIds).length === 0}
												sx={{ textTransform: "none" }}
												aria-label={
													Object.keys(selectedRowIds).length === 0
														? "Archivar carpetas — seleccioná al menos una"
														: `Archivar ${selectedFlatRows.length} carpeta${selectedFlatRows.length > 1 ? "s" : ""}`
												}
											>
												{Object.keys(selectedRowIds).length > 0 ? `Archivar (${selectedFlatRows.length})` : "Archivar"}
											</Button>
										</span>
									</Tooltip>
								)}
							</Stack>

							{/* Grupo 3: Filtros y ordenamiento */}
							<Stack
								direction="row"
								spacing={1}
								alignItems="center"
								sx={{ ...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }) }}
							>
								{onFolderTypeFilterChange && (
									<Button
										variant={showFilters || activeFiltersCount > 0 ? "contained" : "outlined"}
										color={activeFiltersCount > 0 ? "primary" : "secondary"}
										size="small"
										startIcon={<Filter size={18} />}
										endIcon={showFilters ? <ArrowUp2 size={14} /> : <ArrowDown2 size={14} />}
										onClick={() => setShowFilters(!showFilters)}
										sx={{ textTransform: "none", height: "30.75px", minWidth: 100 }}
										aria-label={
											activeFiltersCount > 0
												? `Mostrar filtros — ${activeFiltersCount} activo${activeFiltersCount > 1 ? "s" : ""}`
												: showFilters
												? "Ocultar filtros"
												: "Mostrar filtros"
										}
										aria-expanded={showFilters}
									>
										{activeFiltersCount > 0 ? `Filtros (${activeFiltersCount})` : "Filtros"}
									</Button>
								)}
								<Box
									sx={{
										minWidth: 180,
										// Aplicamos el lenguaje brand vía selectores descendentes —
										// el SortingSelect es shared, no lo tocamos. Solo overridemos
										// los bordes y el botón de dirección aquí.
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
											transition: "border-color 0.15s ease",
										},
										"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
											borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
										},
										"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
											borderColor: alpha(BRAND_BLUE, 0.55),
											borderWidth: 1,
										},
										// IconButton de dirección (ArrowUp/ArrowDown) — borde brand
										"& .MuiIconButton-root": {
											borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
											color: BRAND_BLUE,
											transition: "border-color 0.15s ease, background-color 0.15s ease",
											"&:hover": {
												borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06),
											},
										},
									}}
								>
									<SortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns as any} />
								</Box>
							</Stack>

							{/* Grupo 4: Búsqueda y utilidades — alineado a la derecha */}
							<Stack
								direction="row"
								spacing={1}
								alignItems="center"
								sx={{
									flex: 1,
									justifyContent: "flex-end",
									...(isOnboarding && data.length === 0 && { opacity: 0.4, pointerEvents: "none" }),
								}}
							>
								<Box
									sx={{
										width: "220px",
										// Mismo lenguaje brand para el search input — coherente con
										// el SortingSelect y los Selects del filter panel.
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
											transition: "border-color 0.15s ease",
										},
										"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
											borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
										},
										"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
											borderColor: alpha(BRAND_BLUE, 0.55),
											borderWidth: 1,
										},
									}}
								>
									<GlobalFilter
										preGlobalFilteredRows={preGlobalFilteredRows as any}
										globalFilter={globalFilter}
										setGlobalFilter={setGlobalFilter}
										disabled={data.length === 0}
									/>
								</Box>
								<CSVLink ref={csvLinkRef} data={csvData} headers={csvHeaders} filename={"causas.csv"} style={{ display: "none" }} />
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
												sx={{ opacity: Object.keys(selectedRowIds).length === 0 ? 0.5 : 1, position: "relative" }}
												aria-label={
													Object.keys(selectedRowIds).length === 0
														? "Eliminar carpetas — seleccioná al menos una"
														: `Eliminar ${selectedFlatRows.length} carpeta${selectedFlatRows.length > 1 ? "s" : ""}`
												}
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
								<Tooltip title="Más opciones">
									<IconButton color="secondary" size="small" onClick={handleDesktopMenuOpen} aria-label="Más opciones">
										<More variant="Bulk" size={20} />
									</IconButton>
								</Tooltip>
								<Menu
									anchorEl={desktopMenuAnchor}
									open={desktopMenuOpen}
									onClose={handleDesktopMenuClose}
									anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
									transformOrigin={{ vertical: "top", horizontal: "right" }}
									slotProps={{ paper: { sx: { minWidth: 200 } } }}
								>
									<MenuItem
										onClick={() => {
											handleDesktopMenuClose();
											csvLinkRef.current?.link?.click();
										}}
									>
										<ListItemIcon>
											<DocumentDownload variant="Bulk" size={18} />
										</ListItemIcon>
										<ListItemText>Exportar CSV</ListItemText>
									</MenuItem>
									<MenuItem
										onClick={() => {
											handleDesktopMenuClose();
											handleOpenGuide?.();
										}}
									>
										<ListItemIcon>
											<InfoCircle variant="Bulk" size={18} />
										</ListItemIcon>
										<ListItemText>Ver Guía</ListItemText>
									</MenuItem>
								</Menu>
							</Stack>
						</Stack>
					)}

					{/* Panel de filtros colapsable (desktop + mobile) — wrapper tintado
					    brand en lugar del action.hover MUI default. */}
					{onFolderTypeFilterChange && (
						<Collapse in={showFilters}>
							<Box
								sx={{
									p: { xs: 1.5, sm: 1.75 },
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
									borderRadius: 1.5,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
								}}
							>
								{/* Eyebrow opcional cuando hay filtros activos — refuerza la
								    afordancia "estás filtrando algo" sin necesidad de un h. */}
								{activeFiltersCount > 0 && (
									<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
										<Box
											sx={{
												display: "inline-flex",
												alignItems: "center",
												px: 1,
												py: 0.3,
												borderRadius: 0.75,
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.34 : 0.22)}`,
											}}
										>
											<Typography
												sx={{
													fontSize: "0.62rem",
													fontWeight: 600,
													letterSpacing: "0.14em",
													textTransform: "uppercase",
													color: BRAND_BLUE,
													fontVariantNumeric: "tabular-nums",
												}}
											>
												Filtros activos · {activeFiltersCount}
											</Typography>
										</Box>
									</Stack>
								)}

								<Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
									{/* Filtro por Tipo */}
									<FormControl size="small" sx={{ minWidth: 130 }}>
										<Select
											id="folder-type-filter"
											displayEmpty
											value={folderTypeFilter}
											onChange={onFolderTypeFilterChange}
											sx={filterSelectSx}
										>
											<MenuItem value="all">
												<Typography variant="body2">Tipo: Todos</Typography>
											</MenuItem>
											<MenuItem value="manual">
												<Typography variant="body2">Manual</Typography>
											</MenuItem>
											<MenuItem value="pjn">
												<Typography variant="body2">PJN</Typography>
											</MenuItem>
											<MenuItem value="eje">
												<Typography variant="body2">EJE</Typography>
											</MenuItem>
											<MenuItem value="mev">
												<Typography variant="body2">MEV</Typography>
											</MenuItem>
										</Select>
									</FormControl>
									{/* Filtro por Estado */}
									{onStatusFilterChange && (
										<FormControl size="small" sx={{ minWidth: 140 }}>
											<Select id="status-filter" displayEmpty value={statusFilter} onChange={onStatusFilterChange} sx={filterSelectSx}>
												<MenuItem value="all">
													<Typography variant="body2">Estado: Todos</Typography>
												</MenuItem>
												<MenuItem value="Nueva">
													<Typography variant="body2">Nueva</Typography>
												</MenuItem>
												<MenuItem value="En Proceso">
													<Typography variant="body2">En Proceso</Typography>
												</MenuItem>
												<MenuItem value="Pendiente">
													<Typography variant="body2">Pendiente</Typography>
												</MenuItem>
												<MenuItem value="Cerrada">
													<Typography variant="body2">Cerrada</Typography>
												</MenuItem>
											</Select>
										</FormControl>
									)}
									{/* Filtro por Parte */}
									{onParteFilterChange && uniquePartes.length > 0 && (
										<FormControl size="small" sx={{ minWidth: 130 }}>
											<Select id="parte-filter" displayEmpty value={parteFilter} onChange={onParteFilterChange} sx={filterSelectSx}>
												<MenuItem value="all">
													<Typography variant="body2">Parte: Todas</Typography>
												</MenuItem>
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
										<FormControl size="small" sx={{ minWidth: 160 }}>
											<Select
												id="movimientos-filter"
												displayEmpty
												value={movimientosFilter}
												onChange={onMovimientosFilterChange}
												sx={filterSelectSx}
											>
												<MenuItem value="all">
													<Typography variant="body2">Movimientos: Todos</Typography>
												</MenuItem>
												<MenuItem value="today">
													<Typography variant="body2">Hoy</Typography>
												</MenuItem>
												<MenuItem value="week">
													<Typography variant="body2">Última semana</Typography>
												</MenuItem>
												<MenuItem value="month">
													<Typography variant="body2">Último mes</Typography>
												</MenuItem>
												<MenuItem value="none">
													<Typography variant="body2">Sin movimientos</Typography>
												</MenuItem>
											</Select>
										</FormControl>
									)}
									{/* Filtro por Jurisdicción */}
									{onJurisdiccionFilterChange && uniqueJurisdicciones.length > 0 && (
										<FormControl size="small" sx={{ minWidth: 150 }}>
											<Select
												id="jurisdiccion-filter"
												displayEmpty
												value={jurisdiccionFilter}
												onChange={onJurisdiccionFilterChange}
												sx={filterSelectSx}
											>
												<MenuItem value="all">
													<Typography variant="body2">Jurisdicción: Todas</Typography>
												</MenuItem>
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
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.625,
											px: 0.875,
											py: 0.25,
											borderRadius: 0.75,
											bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
											border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
										}}
									>
										<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: STALE_AMBER }} />
										<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "0.01em", lineHeight: 1 }}>
											{pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
										</Typography>
									</Box>
								)}
								{invalidCount > 0 && (
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.625,
											px: 0.875,
											py: 0.25,
											borderRadius: 0.75,
											bgcolor: alpha(theme.palette.error.main, isDark ? 0.16 : 0.1),
											border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.32 : 0.22)}`,
										}}
									>
										<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: theme.palette.error.main }} />
										<Typography
											sx={{
												fontSize: "0.68rem",
												fontWeight: 600,
												color: theme.palette.error.main,
												letterSpacing: "0.01em",
												lineHeight: 1,
											}}
										>
											{invalidCount} inválida{invalidCount > 1 ? "s" : ""}
										</Typography>
									</Box>
								)}
								<Typography variant="body2" color="text.secondary">
									(Click para ver)
								</Typography>
							</Stack>
						</Alert>
					)}
				</Stack>
			)}

			{/* Vista condicional: cards en mobile, tabla en desktop */}
			{matchDownSM ? (
				/* ── MOBILE: Cards verticales ─────────────────────────────────────── */
				<Stack spacing={1.5} sx={{ px: 2, pb: 2 }}>
					{page.map((row) => {
						prepareRow(row);
						const folder = row.original as any;
						const isSelected = row.isSelected;

						// Chip de estado — replica el patrón brand-aware del desktop.
						const statusChip = folder.status ? <StatusPill status={folder.status} /> : null;

						// Badge de fuente (PJN / MEV / EJE / SCBA) — patrón monocromo brand
						// con dot indicador. Replica el live-dot del landing (integraciones).
						const sourceLabel = folder.pjn ? "PJN" : folder.mev ? "MEV" : folder.eje ? "EJE" : folder.scba ? "SCBA" : null;
						const sourceBadge = sourceLabel ? (
							<Box
								sx={{
									display: "inline-flex",
									alignItems: "center",
									gap: 0.6,
									px: 0.75,
									height: 20,
									borderRadius: 0.75,
									bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.14 : 0.08),
									border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.32 : 0.2)}`,
								}}
							>
								<Box aria-hidden sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: BRAND_BLUE, flexShrink: 0 }} />
								<Typography
									sx={{
										fontSize: "0.62rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										color: BRAND_BLUE,
										lineHeight: 1,
										fontVariantNumeric: "tabular-nums",
									}}
								>
									{sourceLabel}
								</Typography>
							</Box>
						) : null;

						// Último movimiento formateado
						const lastMovStr = folder.lastMovementDate
							? (() => {
									try {
										return dayjs.utc(folder.lastMovementDate).format("DD/MM/YYYY");
									} catch {
										return null;
									}
							  })()
							: null;

						// Fecha inicio formateada
						const initDateStr = folder.initialDateFolder
							? (() => {
									try {
										return dayjs.utc(folder.initialDateFolder).format("DD/MM/YYYY");
									} catch {
										return null;
									}
							  })()
							: null;

						return (
							<Card
								key={row.id}
								variant="outlined"
								onClick={
									disableRowSelection
										? disableRowNavigation
											? undefined
											: () => navigate(`../details/${folder._id}`)
										: () => row.toggleRowSelected()
								}
								sx={{
									borderColor: isSelected ? "primary.main" : "divider",
									bgcolor: isSelected ? alpha(theme.palette.primary.lighter, 0.25) : "background.paper",
									cursor: disableRowSelection && disableRowNavigation ? "default" : "pointer",
									transition: "border-color 0.15s, background-color 0.15s",
								}}
							>
								{/* Header de la card: carátula + badges */}
								<CardContent sx={{ pb: 1, "&:last-child": { pb: 1 } }}>
									<Stack spacing={0.75}>
										{/* Fila: carátula + chips de fuente y estado */}
										<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
											<Typography
												variant="subtitle2"
												fontWeight={600}
												sx={{
													flex: 1,
													lineHeight: 1.3,
													wordBreak: "break-word",
													cursor: disableRowNavigation ? "default" : "pointer",
												}}
												onClick={
													disableRowNavigation
														? undefined
														: (e) => {
																e.stopPropagation();
																navigate(`../details/${folder._id}`);
														  }
												}
											>
												{folder.folderName ? formatFolderName(folder.folderName, 60) : "Sin nombre"}
											</Typography>
											<Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
												{sourceBadge}
												{statusChip}
											</Stack>
										</Stack>

										{/* Metadata preview — blur en modo preview para indicar que los
										    datos son indicativos; el detalle real está al tap. */}
										<Box
											sx={
												disableRowSelection
													? {
															display: "flex",
															flexDirection: "column",
															gap: 0.75,
															filter: "blur(2.5px)",
															opacity: 0.55,
															userSelect: "none",
															pointerEvents: "none",
													  }
													: { display: "flex", flexDirection: "column", gap: 0.75 }
											}
										>
											{/* Fuero y Jurisdicción */}
											{(folder.folderFuero || folder.folderJuris?.label) && (
												<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
													{folder.folderFuero && (
														<Typography variant="caption" color="text.secondary">
															{folder.folderFuero}
														</Typography>
													)}
													{folder.folderFuero && folder.folderJuris?.label && (
														<Typography variant="caption" color="text.secondary">
															·
														</Typography>
													)}
													{folder.folderJuris?.label && (
														<Typography variant="caption" color="text.secondary">
															{folder.folderJuris.label}
														</Typography>
													)}
												</Stack>
											)}

											{/* Parte */}
											{folder.orderStatus && (
												<Typography variant="caption" color="text.secondary">
													Parte: <strong>{folder.orderStatus}</strong>
												</Typography>
											)}

											{/* Fechas */}
											<Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
												{initDateStr && (
													<Typography variant="caption" color="text.secondary">
														Inicio: {initDateStr}
													</Typography>
												)}
												{lastMovStr && (
													<Typography variant="caption" color="text.secondary">
														Últ. mov.: {lastMovStr}
													</Typography>
												)}
											</Stack>
										</Box>
									</Stack>
								</CardContent>

								<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) }} />

								{/* Footer: acciones — delega en la Cell "Acciones" ya preparada */}
								<CardActions sx={{ px: 1, py: 0.5, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
									{row.cells.find((c) => (c.column as any).Header === "Acciones")?.render("Cell")}
								</CardActions>
							</Card>
						);
					})}
				</Stack>
			) : (
				/* ── DESKTOP: Tabla con ScrollX ───────────────────────────────────── */
				<ScrollX>
					<Table {...getTableProps()} sx={tableSx}>
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
											onClick={
												disableRowSelection
													? // En modo preview, el single-click navega al detalle: como la
													  // selección está apagada, el click ya no toglea nada y aprovechamos
													  // el gesto para llevar al usuario directo a las opciones.
													  disableRowNavigation
														? undefined
														: () => navigate(`../details/${row.original._id}`)
													: () => {
															row.toggleRowSelected();
													  }
											}
											onDoubleClick={
												disableRowNavigation
													? undefined
													: () => {
															navigate(`../details/${row.original._id}`);
													  }
											}
											sx={{
												cursor: disableRowSelection && disableRowNavigation ? "default" : "pointer",
												transition: "background-color 0.15s ease",
												bgcolor: row.isSelected ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) : "inherit",
												// Modo preview (tabla de "Carpetas que requieren tu atención"):
												// blureamos las celdas de datos del medio, dejamos limpias la
												// carátula (primera) y las acciones (última). Comunica visualmente
												// "esto es una preview, no contenido interactivo".
												...(disableRowSelection && {
													"& > .MuiTableCell-root:not(:first-of-type):not(:last-of-type)": {
														filter: "blur(3px)",
														opacity: 0.5,
														userSelect: "none",
														pointerEvents: "none",
														transition: "filter 0.2s ease, opacity 0.2s ease",
													},
													"&:hover > .MuiTableCell-root:not(:first-of-type):not(:last-of-type)": {
														filter: "blur(3.5px)",
														opacity: 0.4,
													},
												}),
												"&:hover": {
													bgcolor: row.isSelected ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.11) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
												},
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
			)}
			{page.length > 0 && rows.length > pageSize && (
				<Box sx={{ p: 2, py: 3 }}>
					<TablePagination gotoPage={gotoPage} rows={rows as any} setPageSize={setPageSize} pageSize={pageSize} pageIndex={pageIndex} />
				</Box>
			)}

			{page.length === 0 && (
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						width: "100%",
						py: { xs: 3.5, sm: 4.5 },
						px: 2,
					}}
				>
					{/* Atmósfera brand sutil — radial blob centrado + dot grid con mask */}
					<Box
						aria-hidden
						sx={{
							position: "absolute",
							inset: 0,
							background: `radial-gradient(circle at 50% 40%, ${alpha(
								BRAND_BLUE,
								theme.palette.mode === "dark" ? 0.12 : 0.07,
							)} 0%, transparent 60%)`,
							pointerEvents: "none",
							zIndex: 0,
						}}
					/>
					<Box
						aria-hidden
						sx={{
							position: "absolute",
							inset: 0,
							backgroundImage: `radial-gradient(${alpha(
								theme.palette.text.primary,
								theme.palette.mode === "dark" ? 0.06 : 0.04,
							)} 1px, transparent 1px)`,
							backgroundSize: "22px 22px",
							maskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 80%)",
							WebkitMaskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 80%)",
							pointerEvents: "none",
							zIndex: 0,
						}}
					/>

					{data.length === 0 ? (
						isOnboarding && handleAdd ? (
							// Empty state especial para onboarding (solo si puede crear)
							<Stack
								spacing={2.5}
								alignItems="center"
								sx={{ position: "relative", zIndex: 1, maxWidth: 480, mx: "auto", textAlign: "center" }}
							>
								{/* Eyebrow */}
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										px: 1.25,
										py: 0.4,
										borderRadius: 1,
										bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.08),
										border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.32 : 0.2)}`,
									}}
								>
									<Typography
										sx={{
											fontSize: "0.68rem",
											fontWeight: 600,
											letterSpacing: "0.14em",
											textTransform: "uppercase",
											color: BRAND_BLUE,
										}}
									>
										Primer paso
									</Typography>
								</Box>

								{/* Icono en círculo tintado brand */}
								<Box
									sx={{
										width: 88,
										height: 88,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.1),
										color: BRAND_BLUE,
									}}
								>
									<Folder2 size={44} variant="Bulk" />
								</Box>

								<Stack spacing={1} alignItems="center">
									<Typography
										sx={{
											fontSize: { xs: "1.25rem", sm: "1.375rem" },
											fontWeight: 600,
											letterSpacing: "-0.02em",
											lineHeight: 1.2,
											color: "text.primary",
											textWrap: "balance",
										}}
									>
										Vamos a crear tu primera carpeta
									</Typography>
									<Typography
										sx={{
											fontSize: "0.9rem",
											color: "text.secondary",
											lineHeight: 1.55,
											maxWidth: 380,
											textWrap: "pretty",
										}}
									>
										Las carpetas representan expedientes, causas o clientes. Podés empezar con una y completarla luego.
									</Typography>
								</Stack>

								<Button
									variant="contained"
									startIcon={<Add size={18} />}
									onClick={handleAdd}
									sx={{
										mt: 0.5,
										textTransform: "none",
										bgcolor: BRAND_BLUE,
										color: "#fff",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										borderRadius: 1.25,
										px: 2.25,
										py: 0.9,
										boxShadow: `0 4px 12px ${alpha(BRAND_BLUE, 0.22)}`,
										transition: "background-color 0.15s ease, box-shadow 0.15s ease",
										"&:hover": {
											bgcolor: alpha(BRAND_BLUE, 0.88),
											boxShadow: `0 6px 16px ${alpha(BRAND_BLUE, 0.28)}`,
										},
									}}
								>
									Crear mi primera carpeta
								</Button>
							</Stack>
						) : (
							// Empty state normal (sin onboarding)
							<Stack
								spacing={2}
								alignItems="center"
								sx={{ position: "relative", zIndex: 1, maxWidth: 460, mx: "auto", textAlign: "center" }}
							>
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										px: 1.25,
										py: 0.4,
										borderRadius: 1,
										bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.08),
										border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.32 : 0.2)}`,
									}}
								>
									<Typography
										sx={{
											fontSize: "0.68rem",
											fontWeight: 600,
											letterSpacing: "0.14em",
											textTransform: "uppercase",
											color: BRAND_BLUE,
										}}
									>
										{handleAdd ? "Sin carpetas" : "Equipo"}
									</Typography>
								</Box>

								<Box
									sx={{
										width: 80,
										height: 80,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.14 : 0.08),
										color: BRAND_BLUE,
									}}
								>
									<FolderOpen size={40} variant="Bulk" />
								</Box>

								<Stack spacing={0.75} alignItems="center">
									<Typography
										sx={{
											fontSize: "1.125rem",
											fontWeight: 600,
											letterSpacing: "-0.015em",
											color: "text.primary",
											textWrap: "balance",
										}}
									>
										{handleAdd ? "Todavía no hay carpetas creadas" : "Este equipo no tiene carpetas"}
									</Typography>
									<Typography
										sx={{
											fontSize: "0.875rem",
											color: "text.secondary",
											lineHeight: 1.55,
											maxWidth: 360,
											textWrap: "pretty",
										}}
									>
										{handleAdd
											? "Creá la primera con el botón Agregar carpeta de arriba."
											: "Las carpetas del equipo van a aparecer acá cuando estén disponibles."}
									</Typography>
								</Stack>
							</Stack>
						)
					) : (
						// Empty state de búsqueda — sin resultados
						<Stack spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1, maxWidth: 460, mx: "auto", textAlign: "center" }}>
							<Box
								sx={{
									display: "inline-flex",
									alignItems: "center",
									px: 1.25,
									py: 0.4,
									borderRadius: 1,
									bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.1 : 0.06),
									border: `1px solid ${alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.2 : 0.12)}`,
								}}
							>
								<Typography
									sx={{
										fontSize: "0.68rem",
										fontWeight: 600,
										letterSpacing: "0.14em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Sin resultados
								</Typography>
							</Box>

							<Box
								sx={{
									width: 80,
									height: 80,
									borderRadius: "50%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.08 : 0.05),
									color: "text.secondary",
								}}
							>
								<SearchStatus1 size={40} variant="Bulk" />
							</Box>

							<Stack spacing={0.75} alignItems="center">
								<Typography
									sx={{
										fontSize: "1.125rem",
										fontWeight: 600,
										letterSpacing: "-0.015em",
										color: "text.primary",
										textWrap: "balance",
									}}
								>
									No encontramos carpetas
								</Typography>
								<Typography
									sx={{
										fontSize: "0.875rem",
										color: "text.secondary",
										lineHeight: 1.55,
										maxWidth: 340,
										textWrap: "pretty",
									}}
								>
									Probá con otros términos de búsqueda o ajustá los filtros.
								</Typography>
							</Stack>
						</Stack>
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
	const [searchParams, setSearchParams] = useSearchParams();

	// Estado de la cred SCBA del user: afecta el render del badge de folders SCBA
	// (warning amber en lugar de tick azul cuando la cred del user está en error).
	const scbaCredError = useScbaCredentialError();
	const pjnCredError = usePjnCredentialError();

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
	const [docChooserOpen, setDocChooserOpen] = useState(false);
	const [createPostalOpen, setCreatePostalOpen] = useState(false);
	const [pickModelOpen, setPickModelOpen] = useState(false);
	const [selectedFolderForDoc, setSelectedFolderForDoc] = useState<{ id: string; name: string } | null>(null);

	// Estado para CausaSelector (selección de múltiples resultados)
	const [causaSelectorOpen, setCausaSelectorOpen] = useState(false);
	const [causaSelectorFolder, setCausaSelectorFolder] = useState<{ id: string; name: string }>({ id: "", name: "" });

	// Filas en proceso de "Actualizar estado de verificación".
	// Loading scoped a la fila: evita el skeleton global cuando se refresca una sola.
	const [verifyingFolderIds, setVerifyingFolderIds] = useState<Set<string>>(() => new Set());

	// Estados para filtros de carpetas
	const [folderTypeFilter, setFolderTypeFilter] = useState<"all" | "manual" | "pjn" | "eje" | "mev">("all");
	const [statusFilter, setStatusFilter] = useState<"all" | "Nueva" | "En Proceso" | "Pendiente" | "Cerrada">("all");
	const [parteFilter, setParteFilter] = useState<string>("all");
	const [movimientosFilter, setMovimientosFilter] = useState<"all" | "today" | "week" | "month" | "none">("all");
	const [jurisdiccionFilter, setJurisdiccionFilter] = useState<string>("all");

	// Estado para alinear la barra de carpetas con los botones de la toolbar
	const [barWidth, setBarWidth] = useState<number | undefined>(undefined);
	// Estado para pre-seleccionar paso y valores al abrir AddFolder desde los badges
	const [addFolderInitialStep, setAddFolderInitialStep] = useState<number | undefined>(undefined);
	const [addFolderInitialFormValues, setAddFolderInitialFormValues] = useState<
		{ entryMethod?: string; judicialPower?: string; pjnImportMode?: string; baImportMode?: string } | undefined
	>(undefined);

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
		// Helper para determinar si una carpeta es automática (PJN, MEV, EJE o SCBA)
		const isAutoFolder = (folder: any) =>
			folder.source === "auto" || folder.pjn === true || folder.mev === true || folder.eje === true || folder.scba === true;

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
			(folder: any) =>
				isAutoFolder(folder) &&
				folder.causaVerified === false &&
				folder.causaAssociationStatus !== "failed" &&
				folder.causaAssociationStatus !== "pending_selection",
		).length;

		// Contar folders con selección pendiente
		const pendingSelection = folders.filter(
			(folder: any) => isAutoFolder(folder) && folder.causaAssociationStatus === "pending_selection",
		).length;

		const invalid = folders.filter(
			(folder: any) =>
				isAutoFolder(folder) &&
				((folder.causaVerified === true && folder.causaIsValid === false) || folder.causaAssociationStatus === "failed"),
		).length;

		// Folders verificados y válidos (incluye todos los que NO están en pending)
		const verified = folders.filter(
			(folder: any) =>
				// Carpetas que NO son automáticas (siempre van a la tabla principal)
				!isAutoFolder(folder) ||
				// O carpetas automáticas que están verificadas y válidas (y no tienen selección pendiente)
				(isAutoFolder(folder) &&
					folder.causaVerified === true &&
					folder.causaIsValid === true &&
					folder.causaAssociationStatus !== "failed" &&
					folder.causaAssociationStatus !== "pending_selection"),
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
			if (folderTypeFilter !== "all") {
				switch (folderTypeFilter) {
					case "manual":
						if (!(folder.source === "manual" || (!folder.pjn && !folder.mev && !folder.eje))) return false;
						break;
					case "pjn":
						if (folder.pjn !== true) return false;
						break;
					case "mev":
						if (folder.mev !== true) return false;
						break;
					case "eje":
						if (folder.eje !== true) return false;
						break;
				}
			}

			// Filtro por estado
			if (statusFilter !== "all" && folder.status !== statusFilter) {
				return false;
			}

			// Filtro por parte
			if (parteFilter !== "all" && folder.orderStatus !== parteFilter) {
				return false;
			}

			// Filtro por jurisdicción
			if (jurisdiccionFilter !== "all" && folder.folderJuris?.label !== jurisdiccionFilter) {
				return false;
			}

			// Filtro por movimientos recientes
			if (movimientosFilter !== "all") {
				const lastMovement = folder.lastMovementDate ? dayjs(folder.lastMovementDate) : null;
				const today = dayjs().startOf("day");

				switch (movimientosFilter) {
					case "today":
						if (!lastMovement || !lastMovement.isSame(today, "day")) return false;
						break;
					case "week":
						if (!lastMovement || !lastMovement.isAfter(today.subtract(7, "day"))) return false;
						break;
					case "month":
						if (!lastMovement || !lastMovement.isAfter(today.subtract(30, "day"))) return false;
						break;
					case "none":
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

	// Refetch puntual de una sola fila pendiente de verificación.
	// Mantiene un Set de IDs en vuelo para mostrar spinner localizado en
	// el botón sin disparar el skeleton global de las tablas.
	const handleVerifyFolder = useCallback(
		async (folderId: string) => {
			if (verifyingFolderIds.has(folderId)) return;

			setVerifyingFolderIds((prev) => {
				const next = new Set(prev);
				next.add(folderId);
				return next;
			});

			try {
				const result = await dispatch(getFolderById(folderId, true));

				if (result.success && result.folder) {
					if (result.folder.causaAssociationStatus === "pending_selection") {
						setSnackbarMessage("Hay múltiples resultados. Seleccione el expediente correcto.");
						setSnackbarSeverity("info");
						setSnackbarOpen(true);
					} else if (result.folder.causaVerified && result.folder.causaIsValid) {
						setSnackbarMessage("La carpeta fue sincronizada correctamente");
						setSnackbarSeverity("success");
						setSnackbarOpen(true);
					} else if (result.folder.causaVerified && result.folder.causaIsValid === false) {
						setSnackbarMessage("La carpeta no existe o no es pública");
						setSnackbarSeverity("error");
						setSnackbarOpen(true);
					}
				} else if (!result.success) {
					setSnackbarMessage(result.message || "Error al verificar la carpeta. Intente nuevamente");
					setSnackbarSeverity("error");
					setSnackbarOpen(true);
				}
			} finally {
				setVerifyingFolderIds((prev) => {
					const next = new Set(prev);
					next.delete(folderId);
					return next;
				});
			}
		},
		[verifyingFolderIds],
	);

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

	// Abrir modal AddFolder en el paso de importar causa desde Poder Judicial Nacional (PJN)
	const handleOpenPjnFolder = useCallback(() => {
		setAddFolderInitialStep(2);
		setAddFolderInitialFormValues({ entryMethod: "automatic", judicialPower: "nacional" });
		setAdd(true);
		setAddFolderMode("add");
		setFolder(null);
	}, []);

	// Auto-abrir modal AddFolder cuando se llega desde el onboarding checklist
	// con `?onboarding=true&action=create&jurisdiction=PJN|MEV|EJE`. El click en
	// el logo de cada jurisdicción en el step "Conectar con el Poder Judicial"
	// del checklist debe abrir el modal en el paso 2 con la opción correcta
	// pre-seleccionada.
	//
	// Para PJN y MEV el modal tiene dos sub-tabs ("Conectar mi cuenta" /
	// "Importar expediente individual"). Como esta opción del checklist es
	// explícitamente "vincular expediente uno por uno", forzamos el sub-tab
	// "single" via `pjnImportMode/baImportMode: "single"` en los form values.
	// El componente `automaticStep` lee ese valor del form como initial state
	// del toggle. EJE no tiene esa distinción — va directo al input de CUIJ.
	//
	// Una vez disparado, limpia los query params para que el modal no se reabra
	// si el user navega dentro de la página (cierra modal + abre otro flujo).
	const onboardingActionFired = useRef(false);
	useEffect(() => {
		if (onboardingActionFired.current) return;
		const onboarding = searchParams.get("onboarding");
		const action = searchParams.get("action");
		const jurisdiction = searchParams.get("jurisdiction");
		if (onboarding !== "true" || action !== "create" || !jurisdiction) return;

		const j = jurisdiction.toUpperCase();
		if (j === "EJE") {
			handleOpenCabaFolder();
		} else if (j === "MEV") {
			setAddFolderInitialStep(2);
			setAddFolderInitialFormValues({
				entryMethod: "automatic",
				judicialPower: "buenosaires",
				baImportMode: "single",
			});
			setAdd(true);
			setAddFolderMode("add");
			setFolder(null);
		} else if (j === "PJN") {
			setAddFolderInitialStep(2);
			setAddFolderInitialFormValues({
				entryMethod: "automatic",
				judicialPower: "nacional",
				pjnImportMode: "single",
			});
			setAdd(true);
			setAddFolderMode("add");
			setFolder(null);
		} else {
			return;
		}

		onboardingActionFired.current = true;
		// Limpiar los params consumidos. Preservar `onboarding=true` por si la
		// página lo usa para otros adornos visuales (el flag `isOnboarding`
		// arriba cambia el label del CTA principal).
		const next = new URLSearchParams(searchParams);
		next.delete("action");
		next.delete("jurisdiction");
		setSearchParams(next, { replace: true });
	}, [searchParams, setSearchParams, handleOpenCabaFolder]);

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
					`${result.deletedCount} ${result.deletedCount === 1 ? "carpeta eliminada" : "carpetas eliminadas"} correctamente`,
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
	const handleFolderTypeFilterChange = useCallback((event: SelectChangeEvent<"all" | "manual" | "pjn" | "eje" | "mev">) => {
		setFolderTypeFilter(event.target.value as "all" | "manual" | "pjn" | "eje" | "mev");
	}, []);

	const handleStatusFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setStatusFilter(event.target.value as "all" | "Nueva" | "En Proceso" | "Pendiente" | "Cerrada");
	}, []);

	const handleParteFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setParteFilter(event.target.value);
	}, []);

	const handleMovimientosFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setMovimientosFilter(event.target.value as "all" | "today" | "week" | "month" | "none");
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

	// Handlers para el modal de documentos
	const handleOpenDocChooser = useCallback((folderId: string, folderName: string) => {
		setSelectedFolderForDoc({ id: folderId, name: folderName });
		setDocChooserOpen(true);
		handleMenuClose();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

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
				minWidth: 180,
				Cell: ({ row }: { row: any }) => {
					const folder = row.original;
					const value = folder.folderName;

					// Solo mostrar indicadores visuales si es una causa sincronizada automáticamente
					const showStatusIndicators = folder.pjn === true || folder.mev === true || folder.eje === true || folder.scba === true;
					// Si no se deben mostrar indicadores, solo mostrar el nombre
					if (!showStatusIndicators) {
						return (
							<Tooltip title={value || ""}>
								<span
									style={{
										display: "-webkit-box",
										WebkitLineClamp: 2,
										WebkitBoxOrient: "vertical",
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
								>
									{formatFolderName(value, 50)}
								</span>
							</Tooltip>
						);
					}

					// La causa fue removida del listado del portal origen.
					// Soporta el flag nuevo (listRemoved + listRemovedSource) y el legacy
					// (pjnNotFound) durante la transición.
					// IMPORTANTE: el tracking de "Mis Causas" sólo aplica a causas
					// agregadas por los workers de login (source = *-login). Las causas
					// individuales (manual / agregadas vía pjn-workers, etc.) no
					// participan del listado y nunca deben mostrar este aviso aunque
					// el flag esté seteado.
					const isFromMisCausas =
						(folder.pjn === true && folder.source === "pjn-login") ||
						(folder.scba === true && folder.source === "scba-login") ||
						(folder.mev === true && folder.source === "mev-login");
					const isListRemoved = isFromMisCausas && (folder.listRemoved === true || (folder.pjn === true && folder.pjnNotFound === true));
					// Causa PJN reservada: solo aplica a causas individuales (no
					// pjn-login). El privacy-checker la marcó tras N fallos consecutivos
					// del scrape público. listRemoved e isPjnPrivateRestricted son
					// mutuamente excluyentes por construcción (uno requiere pjn-login,
					// el otro lo excluye), pero por las dudas evaluamos primero la
					// privada por ser más severa.
					const isPjnPrivateRestricted = folder.pjn === true && folder.causaIsPrivate === true && folder.source !== "pjn-login";
					if (isPjnPrivateRestricted) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Tooltip title={value || ""}>
									<span
										style={{
											display: "-webkit-box",
											WebkitLineClamp: 2,
											WebkitBoxOrient: "vertical",
											overflow: "hidden",
											textOverflow: "ellipsis",
											flex: 1,
										}}
									>
										{formatFolderName(value, 50)}
									</span>
								</Tooltip>
								<Tooltip title="Causa reservada — el tribunal restringió la consulta web pública. El sistema sigue verificando si vuelve a estar accesible.">
									<IconButton
										size="small"
										onClick={(e) => e.stopPropagation()}
										sx={{
											padding: 0.5,
											"&:hover": {
												backgroundColor: "error.lighter",
											},
										}}
									>
										<Warning2 size={16} variant="Bold" color="#EF4444" />
									</IconButton>
								</Tooltip>
							</Stack>
						);
					}
					if (isListRemoved) {
						const source = folder.listRemovedSource ? folder.listRemovedSource.toUpperCase() : "PJN";
						const tooltipCopy = `Esta causa ya no aparece en tu lista de Mis Causas del portal ${source}. Puede haber sido archivada o desvinculada por el tribunal.`;
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Tooltip title={value || ""}>
									<span
										style={{
											display: "-webkit-box",
											WebkitLineClamp: 2,
											WebkitBoxOrient: "vertical",
											overflow: "hidden",
											textOverflow: "ellipsis",
											flex: 1,
										}}
									>
										{formatFolderName(value, 50)}
									</span>
								</Tooltip>
								<Tooltip title={tooltipCopy}>
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
								<Box
									onClick={(e) => {
										e.stopPropagation();
										setCausaSelectorFolder({ id: folder._id, name: folder.folderName || folder.searchTerm || "" });
										setCausaSelectorOpen(true);
									}}
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.625,
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
										cursor: "pointer",
										transition: "background-color 0.15s ease, border-color 0.15s ease",
										"&:hover": {
											bgcolor: alpha(STALE_AMBER, isDark ? 0.22 : 0.14),
											borderColor: alpha(STALE_AMBER, isDark ? 0.42 : 0.32),
										},
									}}
								>
									<Warning2 size={12} variant="Bulk" color={STALE_AMBER} />
									<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "0.01em", lineHeight: 1 }}>
										Seleccionar expediente
									</Typography>
								</Box>
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
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.625,
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(theme.palette.error.main, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.32 : 0.22)}`,
									}}
								>
									<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: theme.palette.error.main }} />
									<Typography
										sx={{ fontSize: "0.68rem", fontWeight: 600, color: theme.palette.error.main, letterSpacing: "0.01em", lineHeight: 1 }}
									>
										Asociación fallida
									</Typography>
								</Box>
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
					if (
						folder.causaVerified === false ||
						(folder.causaVerified !== true && (folder.pjn || folder.mev || folder.eje || folder.scba))
					) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.625,
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
									}}
								>
									<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: STALE_AMBER }} />
									<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "0.01em", lineHeight: 1 }}>
										Pendiente de verificación
									</Typography>
								</Box>
								<Tooltip title={verifyingFolderIds.has(folder._id) ? "Verificando…" : "Actualizar estado de verificación"}>
									<span>
										<IconButton
											size="small"
											disabled={verifyingFolderIds.has(folder._id)}
											onClick={(e) => {
												e.stopPropagation();
												handleVerifyFolder(folder._id);
											}}
											sx={{
												padding: 0.5,
												"&:hover": {
													backgroundColor: "warning.lighter",
												},
											}}
										>
											{verifyingFolderIds.has(folder._id) ? (
												<CircularProgress size={14} thickness={5} sx={{ color: STALE_AMBER }} />
											) : (
												<Refresh size={16} />
											)}
										</IconButton>
									</span>
								</Tooltip>
							</Stack>
						);
					}

					// Si causaVerified es true pero causaIsValid es false, mostrar chip de causa inválida
					if (folder.causaVerified === true && folder.causaIsValid === false) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.625,
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(theme.palette.error.main, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.32 : 0.22)}`,
									}}
								>
									<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: theme.palette.error.main }} />
									<Typography
										sx={{ fontSize: "0.68rem", fontWeight: 600, color: theme.palette.error.main, letterSpacing: "0.01em", lineHeight: 1 }}
									>
										Causa inválida
									</Typography>
								</Box>
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
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.625,
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
										border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
									}}
								>
									<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: STALE_AMBER }} />
									<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "0.01em", lineHeight: 1 }}>
										Pendiente de verificación
									</Typography>
								</Box>
								<Tooltip title={verifyingFolderIds.has(folder._id) ? "Verificando…" : "Actualizar estado de verificación"}>
									<span>
										<IconButton
											size="small"
											disabled={verifyingFolderIds.has(folder._id)}
											onClick={(e) => {
												e.stopPropagation();
												handleVerifyFolder(folder._id);
											}}
											sx={{
												padding: 0.5,
												"&:hover": {
													backgroundColor: "warning.lighter",
												},
											}}
										>
											{verifyingFolderIds.has(folder._id) ? (
												<CircularProgress size={14} thickness={5} sx={{ color: STALE_AMBER }} />
											) : (
												<Refresh size={16} />
											)}
										</IconButton>
									</span>
								</Tooltip>
							</Stack>
						);
					}

					// Si causaVerified es true y causaIsValid es true, mostrar nombre con badge verde
					if (folder.causaVerified === true && folder.causaIsValid === true) {
						return (
							<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
								<Tooltip title={value || ""}>
									<span
										style={{
											display: "-webkit-box",
											WebkitLineClamp: 2,
											WebkitBoxOrient: "vertical",
											overflow: "hidden",
											textOverflow: "ellipsis",
											flex: 1,
										}}
									>
										{formatFolderName(value, 50)}
									</span>
								</Tooltip>
								<Tooltip
									title={
										folder.scba === true && scbaCredError.hasError
											? "SCBA — Sincronización pausada: tus credenciales fueron rechazadas. Actualizalas desde Perfil → Cuentas Judiciales."
											: folder.pjn === true && folder.source === "pjn-login" && pjnCredError.hasError
											? "PJN — Sincronización pausada: tus credenciales fueron rechazadas. Actualizalas desde Perfil → Cuentas Judiciales."
											: folder.pjn === true
											? "Causa vinculada a PJN"
											: folder.mev === true
											? "Causa vinculada a MEV"
											: folder.eje === true
											? "Causa vinculada a EJE"
											: folder.scba === true
											? "Causa vinculada a SCBA"
											: "Causa vinculada"
									}
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
										{(folder.scba === true && scbaCredError.hasError) ||
										(folder.pjn === true && folder.source === "pjn-login" && pjnCredError.hasError) ? (
											<Warning2 size={16} variant="Bold" color={STALE_AMBER} />
										) : (
											<TickCircle size={16} variant="Bold" color={BRAND_BLUE} />
										)}
									</Box>
								</Tooltip>
							</Stack>
						);
					}

					// En todos los demás casos, mostrar solo el nombre del folder
					return (
						<Tooltip title={value || ""}>
							<span
								style={{
									display: "-webkit-box",
									WebkitLineClamp: 2,
									WebkitBoxOrient: "vertical",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{formatFolderName(value, 50)}
							</span>
						</Tooltip>
					);
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
				Cell: ({ value }: { value: string }) => (value ? <StatusPill status={value} /> : null),
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
					const isAutoFolder = folder.pjn || folder.mev || folder.eje || folder.scba;

					// Folders con error: asociación fallida o causa inválida
					const isErrorFolder =
						isAutoFolder &&
						(folder.causaAssociationStatus === "failed" || (folder.causaVerified === true && folder.causaIsValid === false));

					// Folders pendientes de verificación (sin error, esperando al worker)
					const isPendingVerification =
						isAutoFolder && !isErrorFolder && (folder.causaVerified !== true || folder.causaAssociationStatus === "pending_selection");

					// Deshabilitar acciones principales para pendientes y errores
					const disableMainActions = isPendingVerification || isErrorFolder;

					// Tooltip según el estado.
					// "Abrir" en una causa pendiente/inválida sigue siendo una acción
					// útil ahora que /details/:id renderiza la PendingVerificationView,
					// así que cambiamos la copy para anunciar el destino concreto.
					const getTooltipText = (action: string) => {
						if (action === "Abrir" && (isPendingVerification || isErrorFolder)) return "Revisar verificación";
						if (isPendingVerification) return "Pendiente de verificación";
						if (isErrorFolder) return action === "Eliminar" ? "Eliminar" : "Causa con error";
						return action;
					};

					// Acción normal (navegar/editar/más) → hover brand-blue.
					// Acción destructiva (eliminar) → hover red.
					// Default state: monocromo text.secondary para que no compita.
					const isDarkMode = theme.palette.mode === "dark";
					const actionIconSx = {
						color: "text.secondary",
						transition: "background-color 0.15s ease, color 0.15s ease",
						"&:hover:not(.Mui-disabled)": {
							bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.16 : 0.08),
							color: BRAND_BLUE,
						},
						"&.Mui-disabled": {
							color: alpha(theme.palette.text.disabled, 0.6),
						},
					} as const;
					const destructiveIconSx = {
						color: "text.secondary",
						transition: "background-color 0.15s ease, color 0.15s ease",
						"&:hover:not(.Mui-disabled)": {
							bgcolor: alpha(theme.palette.error.main, isDarkMode ? 0.18 : 0.1),
							color: theme.palette.error.main,
						},
						"&.Mui-disabled": {
							color: alpha(theme.palette.text.disabled, 0.6),
						},
					} as const;

					// Para filas en estado de verificación reemplazamos la grilla de íconos
					// por un único botón explícito que lleva al PendingVerificationView.
					// Más visible, menos ruido, comunica "esto es lo único que podés hacer".
					if (isPendingVerification || isErrorFolder) {
						const ctaTone = isErrorFolder ? theme.palette.error.main : STALE_AMBER;
						return (
							<Stack direction="row" alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
								<Button
									size="small"
									variant="contained"
									disableElevation
									onClick={(e) => handleRowAction(e, () => navigate(`../details/${row.values._id}`))}
									endIcon={<ArrowRight2 size={14} />}
									sx={{
										textTransform: "none",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										fontSize: "0.74rem",
										py: 0.5,
										px: 1.25,
										minHeight: 30,
										borderRadius: 1,
										bgcolor: ctaTone,
										color: "#fff",
										boxShadow: "none",
										whiteSpace: "nowrap",
										"&:hover": { bgcolor: alpha(ctaTone, 0.88), boxShadow: "none" },
									}}
								>
									Revisar verificación
								</Button>
							</Stack>
						);
					}

					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
							{/* "Abrir" estándar para causas verificadas. */}
							<Tooltip title={getTooltipText("Abrir")}>
								<span>
									<IconButton
										size="small"
										sx={actionIconSx}
										onClick={(e) => handleRowAction(e, () => navigate(`../details/${row.values._id}`))}
									>
										<Maximize variant="Bulk" size={18} />
									</IconButton>
								</span>
							</Tooltip>
							{canUpdate && (
								<Tooltip title={getTooltipText("Editar")}>
									<span>
										<IconButton
											size="small"
											sx={actionIconSx}
											disabled={disableMainActions}
											onClick={(e) => handleRowAction(e, () => handleEditContact(row.original))}
											data-testid="folder-edit-btn"
										>
											<Edit variant="Bulk" size={18} />
										</IconButton>
									</span>
								</Tooltip>
							)}
							{canDelete && (
								<Tooltip title={getTooltipText("Eliminar")}>
									<span>
										<IconButton
											size="small"
											sx={destructiveIconSx}
											disabled={isPendingVerification}
											onClick={(e) =>
												handleRowAction(e, () => {
													handleClose();
													setFolderDeleteId(row.values.folderName);
													setFolderId(row.values._id);
												})
											}
											data-testid="folder-delete-btn"
										>
											<Trash variant="Bulk" size={18} />
										</IconButton>
									</span>
								</Tooltip>
							)}
							<Tooltip title={getTooltipText("Más acciones")}>
								<span>
									<IconButton
										size="small"
										sx={actionIconSx}
										disabled={disableMainActions}
										onClick={(e) => handleMenuOpen(e, row.id, row.original)}
									>
										<More variant="Bulk" size={18} />
									</IconButton>
								</span>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		[
			theme,
			mode,
			handleEditContact,
			handleClose,
			navigate,
			handleRowAction,
			handleMenuOpen,
			canUpdate,
			canDelete,
			verifyingFolderIds,
			handleVerifyFolder,
			// Cred-error hooks: la columna Carátula usa pjnCredError.hasError /
			// scbaCredError.hasError para mostrar el ícono ámbar Warning2. Sin estas
			// deps, el useMemo retorna columnas con closure viejo y el ícono solo se
			// actualiza al desmontar/montar (navegar a otra ruta y volver).
			scbaCredError.hasError,
			pjnCredError.hasError,
		],
	);

	// Row sub component memoizado
	const renderRowSubComponent = useCallback(
		({ row }: { row: Row<Folder> }) => {
			const folderData = folders.find((f: any) => f._id === row.original._id);
			return folderData ? <FolderView data={folderData} /> : null;
		},
		[folders],
	);

	const isDark = mode === "dark";

	// Renderizar skeleton durante la carga inicial — mantiene la estructura
	// visual del page final (header card + table card) para evitar el "salto"
	// cuando carga.
	if (isInitialLoad) {
		return (
			<>
				<SEO path="/apps/folders" />
				<Stack spacing={{ xs: 1, sm: 2.5 }}>
					{/* Skeleton del header card brand */}
					<Box
						sx={{
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
							boxShadow: `0 4px 18px ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)}`,
							borderRadius: 1.5,
							px: { xs: 1.5, sm: 2.5 },
							py: { xs: 1, sm: 1.75 },
						}}
					>
						<Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={{ xs: 1.5, md: 3 }}>
							<Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: { md: 1 }, width: "100%" }}>
								<Skeleton variant="rounded" width={88} height={22} />
								<Skeleton variant="text" sx={{ flex: 1 }} height={18} />
							</Stack>
							<Stack direction="row" alignItems="center" spacing={1} sx={{ width: { xs: "100%", md: "auto" }, minWidth: { md: 380 } }}>
								<Skeleton variant="circular" width={18} height={18} />
								<Skeleton variant="text" width={70} height={18} />
								<Skeleton variant="rectangular" height={9} sx={{ flex: 1, borderRadius: 1.25 }} />
								<Skeleton variant="text" width={50} height={18} />
							</Stack>
						</Stack>
					</Box>

					{/* Skeleton de la tabla */}
					<MainCard content={false}>
						<Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
							<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
								<Skeleton variant="rounded" width={140} height={32} />
								<Skeleton variant="rounded" width={110} height={32} />
								<Skeleton variant="rounded" width={90} height={32} />
								<Skeleton variant="rounded" width={180} height={32} />
								<Box sx={{ flex: 1 }} />
								<Skeleton variant="rounded" width={220} height={32} />
								<Skeleton variant="circular" width={32} height={32} />
							</Stack>
							<Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
						</Stack>
					</MainCard>
				</Stack>
			</>
		);
	}

	return (
		<>
			<SEO path="/apps/folders" />
			<Stack spacing={{ xs: 1, sm: 2.5 }}>
				{/* ── HEADER DE SECCIÓN ───────────────────────────────────────────
				    Eyebrow + h2 + descripción con atmósfera tintada brand. Replica
				    el lenguaje del WelcomeBanner del dashboard, en una variante más
				    compacta (la página es data-heavy y el banner es solo contexto).
				─────────────────────────────────────────────────────────────────── */}
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						bgcolor: theme.palette.background.paper,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
						boxShadow: `0 4px 18px ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)}`,
						borderRadius: 1.5,
						px: { xs: 0.5, sm: 2.5 },
						py: { xs: 0.25, sm: 1.75 },
					}}
				>
					{/* Blob radial brand-blue — sutil, solo desktop (mobile no tiene
					    eyebrow ni descripción, solo la barra; los efectos sobran). */}
					<Box
						aria-hidden
						sx={{
							display: { xs: "none", md: "block" },
							position: "absolute",
							top: "-80%",
							right: "-10%",
							width: 280,
							height: 280,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.15 : 0.09)} 0%, transparent 65%)`,
							filter: "blur(50px)",
							pointerEvents: "none",
							zIndex: 0,
						}}
					/>
					{/* Dot grid con mask — solo desktop */}
					<Box
						aria-hidden
						sx={{
							display: { xs: "none", md: "block" },
							position: "absolute",
							inset: 0,
							backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04)} 1px, transparent 1px)`,
							backgroundSize: "22px 22px",
							maskImage: "radial-gradient(ellipse 50% 100% at 90% 50%, #000 0%, transparent 70%)",
							WebkitMaskImage: "radial-gradient(ellipse 50% 100% at 90% 50%, #000 0%, transparent 70%)",
							pointerEvents: "none",
							zIndex: 0,
						}}
					/>

					<Stack
						direction={{ xs: "column", md: "row" }}
						alignItems={{ xs: "stretch", md: "center" }}
						spacing={{ xs: 1.5, md: 3 }}
						sx={{ position: "relative", zIndex: 1 }}
					>
						{/* Columna izquierda: eyebrow + descripción — oculta en mobile/tablet
						    para que la tabla no se empuje hacia abajo. La identidad la da el
						    breadcrumb "Mis Carpetas" del layout. */}
						<Stack
							direction="row"
							alignItems="center"
							spacing={1.5}
							sx={{ flex: { md: 1 }, minWidth: 0, display: { xs: "none", md: "flex" } }}
						>
							<Box
								sx={{
									display: "inline-flex",
									alignItems: "center",
									px: 1.25,
									py: 0.4,
									borderRadius: 1,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
									flexShrink: 0,
								}}
							>
								<Typography
									sx={{
										fontSize: "0.68rem",
										fontWeight: 600,
										letterSpacing: "0.14em",
										textTransform: "uppercase",
										color: BRAND_BLUE,
										fontVariantNumeric: "tabular-nums",
									}}
								>
									Expedientes
								</Typography>
							</Box>

							<Typography
								sx={{
									fontSize: "0.875rem",
									color: "text.secondary",
									lineHeight: 1.5,
									textWrap: "pretty",
								}}
							>
								Cada carpeta concentra los documentos, cálculos, tareas y vencimientos de un expediente.
							</Typography>
						</Stack>

						{/* Columna derecha: barra de uso del plan + sync badges */}
						<Box
							sx={{
								flexShrink: 0,
								width: { xs: "100%", md: "auto" },
								// minWidth subido de 380 → 440 para que la barra de progreso
								// tenga más ancho real y se lea bien (antes quedaba comprimida).
								minWidth: { md: 440 },
								pl: { md: 2 },
								borderLeft: { md: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` },
							}}
						>
							<ResourceUsageBar
								resourceType="folders"
								compact
								disableContainerPadding
								onCabaClick={canCreate ? handleOpenCabaFolder : undefined}
								onBaClick={canCreate ? handleOpenBaFolder : undefined}
								onPjnClick={canCreate ? handleOpenPjnFolder : undefined}
							/>
						</Box>
					</Stack>
				</Box>

				<MainCard content={false}>
					<DowngradeGracePeriodAlert />

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
						<Box ref={pendingTableRef} sx={{ mt: { xs: 3, sm: 4 } }}>
							{/* Banner atmosférico ámbar con live-dot pulsante — replica el
						    lenguaje del landing (integraciones live). Reemplaza el bloque
						    warning.lighter MUI default que rompía la atmósfera brand. */}
							<Box
								sx={{
									mx: { xs: 2, sm: 3 },
									mb: 2,
									position: "relative",
									overflow: "hidden",
									borderRadius: 1.5,
									border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
									bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
									px: { xs: 2, sm: 2.5 },
									py: { xs: 1.5, sm: 1.75 },
									...LIVE_PULSE_KEYFRAMES,
								}}
							>
								<Stack direction="row" alignItems="center" spacing={1.75}>
									{/* Dot ámbar con pulso animado */}
									<Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0, mt: 0.5, alignSelf: "flex-start" }}>
										<Box
											sx={{
												width: 8,
												height: 8,
												borderRadius: "50%",
												bgcolor: STALE_AMBER,
												zIndex: 1,
											}}
										/>
										<Box
											aria-hidden
											sx={{
												position: "absolute",
												inset: 0,
												borderRadius: "50%",
												bgcolor: STALE_AMBER,
												opacity: 0.5,
												animation: "la-live-pulse 2.4s ease-out infinite",
											}}
										/>
									</Box>

									<Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
										<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
											<Typography
												sx={{
													fontSize: { xs: "0.92rem", sm: "1rem" },
													fontWeight: 600,
													letterSpacing: "-0.01em",
													color: "text.primary",
													lineHeight: 1.25,
												}}
											>
												Carpetas que requieren tu atención
											</Typography>
											<Box
												sx={{
													display: "inline-flex",
													alignItems: "center",
													px: 0.875,
													py: 0.25,
													borderRadius: 0.75,
													bgcolor: alpha(STALE_AMBER, isDark ? 0.22 : 0.14),
													border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.4 : 0.28)}`,
												}}
											>
												<Typography
													sx={{
														fontSize: "0.7rem",
														fontWeight: 600,
														letterSpacing: "0.02em",
														color: STALE_AMBER,
														fontVariantNumeric: "tabular-nums",
														lineHeight: 1,
													}}
												>
													{pendingOrInvalidFolders.length}
												</Typography>
											</Box>
										</Stack>
										<Typography
											sx={{
												fontSize: { xs: "0.8rem", sm: "0.85rem" },
												color: "text.secondary",
												lineHeight: 1.55,
												textWrap: "pretty",
											}}
										>
											Estas causas importadas automáticamente esperan verificación del worker o presentan problemas de validación.
										</Typography>
									</Stack>
								</Stack>
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
									disableRowSelection
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
										if (menuFolderData && menuFolderData._id && menuFolderData.folderName) {
											handleOpenDocChooser(menuFolderData._id, menuFolderData.folderName);
										}
									}}
								>
									<ListItemIcon>
										<DocumentText1 variant="Bulk" size={18} />
									</ListItemIcon>
									<ListItemText>Crear Documento</ListItemText>
								</MenuItem>
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
							onClose={handleCloseDialog}
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
							<AddFolder
								open={add}
								folder={folder}
								mode={addFolderMode}
								onCancel={handleCloseDialog}
								onAddFolder={handleCloseDialog}
								initialStep={addFolderInitialStep}
								initialFormValues={addFolderInitialFormValues}
							/>
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
							if (isTeamMode && activeTeam?._id) {
								dispatch(getFoldersByGroupId(activeTeam._id));
							} else if (user?._id) {
								dispatch(getFoldersByUserId(user._id, true));
							}
						}}
						onSelectionCancelled={() => {
							if (isTeamMode && activeTeam?._id) {
								dispatch(getFoldersByGroupId(activeTeam._id));
							} else if (user?._id) {
								dispatch(getFoldersByUserId(user._id, true));
							}
						}}
					/>

					{/* Chooser: elegir tipo de documento */}
					<ResponsiveDialog
						open={docChooserOpen}
						onClose={() => setDocChooserOpen(false)}
						maxWidth="xs"
						fullWidth
						PaperProps={{ elevation: 5, sx: { borderRadius: 2, overflow: "hidden" } }}
					>
						<DialogTitle
							sx={{
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
								p: 3,
								borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
							}}
						>
							<Stack spacing={1}>
								<Stack direction="row" alignItems="center" spacing={1}>
									<DocumentText1 size={24} color={BRAND_BLUE} variant="Bold" />
									<Typography variant="h5" sx={{ fontWeight: 600, color: BRAND_BLUE }}>
										Crear Documento
									</Typography>
								</Stack>
								<Typography variant="body2" color="textSecondary">
									{selectedFolderForDoc?.name ?? ""}
								</Typography>
							</Stack>
						</DialogTitle>
						<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12) }} />
						<DialogContent sx={{ pb: 3 }}>
							<Stack spacing={1.5}>
								<Card
									variant="outlined"
									sx={{
										cursor: "pointer",
										"&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
										transition: "border-color 0.15s",
									}}
								>
									<CardActionArea
										onClick={() => {
											setDocChooserOpen(false);
											setCreatePostalOpen(true);
										}}
									>
										<CardContent>
											<Stack direction="row" spacing={1.5} alignItems="center">
												<NoteText size={28} variant="Bulk" />
												<Stack spacing={0.25}>
													<Typography variant="body2" fontWeight={600}>
														Modelo del Sistema
													</Typography>
													<Typography variant="caption" color="text.secondary">
														Telegramas, cartas documento y más
													</Typography>
												</Stack>
											</Stack>
										</CardContent>
									</CardActionArea>
								</Card>
								<Divider>
									<Typography variant="caption" color="text.secondary">
										o
									</Typography>
								</Divider>
								<Card
									variant="outlined"
									sx={{
										cursor: "pointer",
										"&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
										transition: "border-color 0.15s",
									}}
								>
									<CardActionArea
										onClick={() => {
											setDocChooserOpen(false);
											setPickModelOpen(true);
										}}
									>
										<CardContent>
											<Stack direction="row" spacing={1.5} alignItems="center">
												<DocumentText size={28} variant="Bulk" />
												<Stack spacing={0.25}>
													<Typography variant="body2" fontWeight={600}>
														Mis Modelos
													</Typography>
													<Typography variant="caption" color="text.secondary">
														Escritos personalizados con editor de texto
													</Typography>
												</Stack>
											</Stack>
										</CardContent>
									</CardActionArea>
								</Card>
							</Stack>
						</DialogContent>
					</ResponsiveDialog>

					{/* Modal postal */}
					{createPostalOpen && (
						<CreatePostalDocumentModal
							open={createPostalOpen}
							handleClose={() => setCreatePostalOpen(false)}
							prefilledFolderId={selectedFolderForDoc?.id ?? null}
							showSnackbar={(message, severity) => {
								setSnackbarMessage(message);
								setSnackbarSeverity(severity);
								setSnackbarOpen(true);
							}}
						/>
					)}

					{/* Modal mis modelos */}
					<PickModelDialog open={pickModelOpen} onClose={() => setPickModelOpen(false)} folderId={selectedFolderForDoc?.id ?? null} />

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

					{/* Diálogo de confirmación de eliminación — brand sober destructive */}
					<Dialog
						open={deleteDialogOpen}
						onClose={handleCancelDelete}
						keepMounted
						TransitionComponent={PopupTransition}
						maxWidth="xs"
						fullWidth
						aria-labelledby="folders-delete-title"
						aria-describedby="folders-delete-description"
						PaperProps={{
							sx: {
								borderRadius: 2,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
								boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
								overflow: "hidden",
							},
						}}
					>
						<DialogContent sx={{ p: { xs: 3, sm: 3.5 }, position: "relative" }}>
							<Box
								sx={{
									position: "absolute",
									top: -80,
									left: "50%",
									transform: "translateX(-50%)",
									width: 280,
									height: 280,
									borderRadius: "50%",
									background: `radial-gradient(circle, ${alpha(theme.palette.error.main, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
									pointerEvents: "none",
								}}
							/>
							<Stack alignItems="center" spacing={2.25} sx={{ position: "relative" }}>
								<Box
									sx={{
										width: 60,
										height: 60,
										borderRadius: 1.5,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(theme.palette.error.main, isDark ? 0.16 : 0.08),
										border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.32 : 0.2)}`,
										color: theme.palette.error.main,
									}}
								>
									<Trash size={26} variant="Bulk" />
								</Box>
								<Stack spacing={1} alignItems="center">
									<Typography
										id="folders-delete-title"
										sx={{
											fontSize: "1.05rem",
											fontWeight: 600,
											letterSpacing: "-0.015em",
											color: "text.primary",
											textAlign: "center",
											textWrap: "balance" as any,
										}}
									>
										{foldersToDelete.length === 1 ? "¿Eliminar esta carpeta?" : `¿Eliminar ${foldersToDelete.length} carpetas?`}
									</Typography>
									<Typography
										id="folders-delete-description"
										sx={{
											fontSize: "0.85rem",
											color: "text.secondary",
											letterSpacing: "-0.005em",
											textAlign: "center",
											textWrap: "pretty" as any,
										}}
									>
										Vas a eliminar{" "}
										<Box component="span" sx={{ fontWeight: 600, color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
											{foldersToDelete.length} {foldersToDelete.length === 1 ? "carpeta" : "carpetas"}
										</Box>{" "}
										de forma permanente. Esta acción no se puede deshacer.
									</Typography>
								</Stack>

								<Stack direction="row" spacing={1.25} sx={{ width: 1, mt: 0.5 }}>
									<Button
										fullWidth
										onClick={handleCancelDelete}
										sx={{
											textTransform: "none",
											fontWeight: 600,
											letterSpacing: "-0.005em",
											color: "text.secondary",
											borderRadius: 1.25,
											py: 1,
											border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
											"&:hover": {
												color: BRAND_BLUE,
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
												borderColor: alpha(BRAND_BLUE, 0.28),
											},
										}}
									>
										Cancelar
									</Button>
									<Button
										fullWidth
										onClick={handleConfirmDelete}
										autoFocus
										variant="contained"
										sx={{
											textTransform: "none",
											fontWeight: 600,
											letterSpacing: "-0.005em",
											bgcolor: theme.palette.error.main,
											color: "#fff",
											borderRadius: 1.25,
											py: 1,
											boxShadow: "none",
											"&:hover": { bgcolor: alpha(theme.palette.error.main, 0.88), boxShadow: "none" },
										}}
									>
										Eliminar
									</Button>
								</Stack>
							</Stack>
						</DialogContent>
					</Dialog>
				</MainCard>
			</Stack>
		</>
	);
};

export default FoldersLayout;
