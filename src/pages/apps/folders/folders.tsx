import React from "react";
import { isDevReview } from "utils/devReview";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, Fragment, MouseEvent, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	ButtonBase,
	Card,
	CardActionArea,
	CardContent,
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
	Portal,
	Typography,
	Collapse,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	FormControl,
	Select,
	SelectChangeEvent,
	CircularProgress,
	ToggleButton,
	ToggleButtonGroup,
	Checkbox,
	OutlinedInput,
} from "@mui/material";

import { useFilters, useExpanded, useGlobalFilter, useRowSelect, useSortBy, useTable, usePagination, Row, HeaderProps } from "react-table";

// project-imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import IconButton from "components/@extended/IconButton";
import { PopupTransition } from "components/@extended/Transitions";
import { IndeterminateCheckbox, HeaderSort, SortingSelect, TablePagination } from "components/third-party/ReactTable";
import axios from "axios";
import { getTeamAssignees, resolveAssignees } from "utils/teamAssignees";
import { isResponsableVistaFija, responsableOptions, responsableQueryValue } from "utils/responsableVista";
import { FOLDERS_LIST_PREFS_KEY, readListPrefs, writeListPrefs } from "utils/listPrefs";
import { updateUser } from "store/reducers/auth";
import { juzgadoCounts, juzgadoKey, juzgadoOptions, radicacionOrigen, ubicacionActual, ubicacionDetalle } from "utils/radicacion";
import {
	diasDesdeUltimoMovimiento,
	enPeriodo,
	INACTIVIDAD_FILTROS,
	isInactividadFiltro,
	isIsoDay,
	PeriodoMovimientos,
	situacionKey,
	situacionLabel,
	situacionOptions,
	sinMovimientoHace,
} from "utils/controlCarpetas";
import { CSVLink } from "react-csv";
import { formatFolderName } from "utils/formatFolderName";
import {
	INVALID_FOLDER_NAME,
	MEV_CRED_LABEL,
	MEV_PROFILE_PATH,
	MEV_CRED_MISSING_ON_FAILED,
	isMevCredLoginFailure,
	isMevCredMissing,
	mevCredIssue,
} from "utils/mevCredential";
import SEO from "components/SEO/SEO";
import { FolderSourceBadge } from "./FolderSourceBadge";

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
	Trash,
	Maximize,
	Archive,
	Box1,
	InfoCircle,
	DocumentDownload,
	Refresh,
	More,
	SearchStatus1,
	Folder2,
	Warning2,
	Lock1,
	Filter,
	ArrowUp2,
	ArrowDown2,
	ArrowRight2,
	UserEdit,
	Star1,
	Hierarchy,
	CloseCircle,
} from "iconsax-react";
import PjnCredErrorBanner from "sections/apps/folders/PjnCredErrorBanner";
import TaskAssignees from "sections/apps/tasks/TaskAssignees";
import BulkResponsablesDialog from "sections/apps/folders/BulkResponsablesDialog";
import DistributeFoldersDialog from "sections/apps/teams/DistributeFoldersDialog";
import { openExpedienteExport } from "utils/expedienteExportTracker";
import FolderActionsMenu, { FolderCreateKind } from "sections/apps/folders/FolderActionsMenu";
import { RelacionesIcon, SinVerCount } from "sections/apps/folders/FolderNovedadesIndicators";

// types
import { dispatch, useSelector } from "store";
import {
	getFoldersByUserId,
	getFoldersByGroupId,
	fetchGroupFolderIdsByResponsable,
	archiveFolders,
	getArchivedFoldersByUserId,
	getArchivedFoldersByGroupId,
	updateFolderSeguimiento,
	updateFoldersSeguimientoBulk,
	unarchiveFolders,
	getFolderById,
	setFolderSort,
	deleteFoldersByIds,
} from "store/reducers/folder";
import { fetchUserStats } from "store/reducers/userStats";
import { useTeam } from "contexts/TeamContext";
import { Folder, Props } from "types/folders";
import dayjs from "utils/dayjs-config";
import { DocumentText, DocumentText1, NoteText } from "iconsax-react";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";
import PickModelDialog from "sections/apps/rich-text-documents/PickModelDialog";
import { ResponsiveDialog } from "components/@extended/ResponsiveDialog";

// sections
import ArchivedItemsModal from "sections/apps/customer/ArchivedItemsModal";
import ArchivedByPlanBanner from "sections/apps/folders/ArchivedByPlanBanner";
import { showUnarchiveLimitSnackbar } from "utils/unarchiveLimitSnackbar";
import { GuideFolders } from "components/guides";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import { ResourceUsageBar } from "sections/widget/chart/ResourceUsageWidget";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER, LIVE_PULSE_KEYFRAMES } from "themes/dashboardTokens";
import { getPjnBindingState, PJN_BINDING_COPY, pjnCredErrorCopy, pjnFailedCopy, PJN_PROFILE_PATH } from "utils/pjnBindingState";
import { SCBA_BINDING_COPY, SCBA_PROFILE_PATH } from "utils/scbaBindingState";
import { useScbaCredentialError } from "hooks/useScbaCredentialError";
import { usePjnCredentialError } from "hooks/usePjnCredentialError";
import { useExpedienteChatAccess } from "hooks/useExpedienteChatAccess";

const HIDDEN_COLUMNS_STORAGE_KEY = "la.folders.hiddenColumns.v1";
const NON_HIDEABLE_COLUMNS = new Set(["selection", "folderName"]);

/** Selector «Columnas» del listado (ocultar / mostrar), con memoria en el navegador. */
function ColumnasSelect({
	allColumns,
	hiddenColumns,
	setHiddenColumns,
	selectSx,
}: {
	allColumns: any[];
	hiddenColumns: string[];
	setHiddenColumns: (ids: string[]) => void;
	selectSx?: any;
}) {
	// «Acciones» no se puede ocultar: es la columna que motivó el selector.
	const options = allColumns.filter(
		(c) => typeof c.Header === "string" && c.Header !== "Acciones" && !NON_HIDEABLE_COLUMNS.has(c.id) && c.id !== "_id" && c.id !== "email",
	);
	const visibles = options.filter((c) => !hiddenColumns.includes(c.id)).length;
	return (
		<FormControl size="small" sx={{ minWidth: 150 }}>
			<Select
				id="folders-columnas"
				multiple
				displayEmpty
				value={hiddenColumns}
				onChange={(event) => {
					const value = event.target.value;
					const next = typeof value === "string" ? value.split(",") : (value as string[]);
					setHiddenColumns(next);
					try {
						localStorage.setItem(HIDDEN_COLUMNS_STORAGE_KEY, JSON.stringify(next));
					} catch {
						/* sin memoria local */
					}
				}}
				input={<OutlinedInput />}
				renderValue={() => (
					<Typography variant="body2">
						Columnas: {visibles} de {options.length}
					</Typography>
				)}
				sx={selectSx}
				MenuProps={{ PaperProps: { style: { maxHeight: 360, width: 240 } } }}
			>
				{options.map((column) => (
					<MenuItem key={column.id} value={column.id} dense sx={{ "&.Mui-selected": { bgcolor: "background.paper" } }}>
						<Checkbox size="small" checked={!hiddenColumns.includes(column.id)} />
						<ListItemText primary={column.Header} primaryTypographyProps={{ variant: "body2" }} />
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}

/**
 * Segunda línea de la columna Jurisdicción / opción del filtro Departamento:
 * `folderJuris.item` canónico ("Buenos Aires - Lomas de Zamora", "Mendoza - 1ª
 * Circunscripción - Mendoza", "Justicia Nacional - Trabajo") sin el prefijo de
 * provincia. Para Nacional el prefijo distingue Justicia Nacional de Federal, así
 * que se conserva abreviado con "·".
 */
const departamentoDe = (item?: string | null, label?: string | null): string => {
	if (!item) return "";
	if (label && item.startsWith(`${label} - `)) return item.slice(label.length + 3);
	if (/^Justicia (Nacional|Federal) - /.test(item)) return item.replace(/^Justicia (Nacional|Federal) - /, "Justicia $1 · ");
	return item;
};

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
	/** Memoria del listado (6/11/2026): clave de sessionStorage para tamaño de página y orden. */
	prefsKey?: string;
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
	folderTypeFilter?: "all" | "manual" | "pjn" | "eje" | "mev" | "pjsalta" | "pjcatamarca" | "pjmendoza" | "scba";
	onFolderTypeFilterChange?: (
		event: SelectChangeEvent<"all" | "manual" | "pjn" | "eje" | "mev" | "pjsalta" | "pjcatamarca" | "pjmendoza" | "scba">,
	) => void;
	statusFilter?: "all" | "Nueva" | "En Proceso" | "Pendiente" | "Cerrada";
	onStatusFilterChange?: (event: SelectChangeEvent<string>) => void;
	parteFilter?: string;
	onParteFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniquePartes?: string[];
	movimientosFilter?: string;
	onMovimientosFilterChange?: (event: SelectChangeEvent<string>) => void;
	/** «Período…» de Movimientos (6/11/2026): último movimiento entre dos fechas. */
	periodo?: PeriodoMovimientos;
	onPeriodoChange?: (p: PeriodoMovimientos) => void;
	jurisdiccionFilter?: string;
	onJurisdiccionFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniqueJurisdicciones?: string[];
	fueroFilter?: string;
	onFueroFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniqueFueros?: string[];
	departamentoFilter?: string;
	onDepartamentoFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniqueDepartamentos?: string[];
	/** Radicación (5/11/2026): juzgado de origen (clave fuero|número) y ubicación actual. */
	juzgadoFilter?: string;
	onJuzgadoFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniqueJuzgados?: { value: string; label: string; count: number }[];
	ubicacionFilter?: string;
	onUbicacionFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniqueUbicaciones?: { value: string; count: number }[];
	/** Situación procesal del expediente (6/11/2026): EN LETRA, EN DESPACHO… desde la causa. */
	situacionFilter?: string;
	onSituacionFilterChange?: (event: SelectChangeEvent<string>) => void;
	uniqueSituaciones?: { value: string; label: string; count: number }[];
	/** Seguimiento (6/11/2026): all | si | no. */
	seguimientoFilter?: string;
	onSeguimientoFilterChange?: (event: SelectChangeEvent<string>) => void;
	/** Nombres de responsables para el CSV (modo equipo). */
	resolveResponsables?: (ids: string[] | undefined) => string;
	/** Columnas ocultas guardadas en el hub para este usuario (manda sobre el navegador) y cómo guardarlas. */
	storedHiddenColumns?: string[] | null;
	onHiddenColumnsChange?: (ids: string[]) => void;
	handleDeleteSelected?: (selectedRows: any[]) => void;
	/** Equipos: asignación masiva de responsables (recibe cómo limpiar la selección). */
	handleAssignSelected?: (selectedRows: any[], clearSelection: () => void) => void;
	/** Equipos: asistente «Repartir carpetas» (fase 3, 6/11/2026); con selección, se limita a ella. */
	handleDistribute?: (selectedRows: any[], clearSelection: () => void) => void;
	/** Seguimiento (6/11/2026): marcar o quitar en lote; `activo` lo decide el botón según la selección. */
	handleSeguimientoSelected?: (selectedRows: any[], clearSelection: () => void, activo: boolean) => void;
	onBarWidthMeasured?: (width: number) => void;
}

function ReactTable({
	columns,
	data,
	renderRowSubComponent,
	handleAdd,
	handleArchiveSelected,
	handleDeleteSelected,
	handleAssignSelected,
	handleDistribute,
	handleSeguimientoSelected,
	isLoading,
	handleOpenArchivedModal,
	handleOpenGuide,
	expandedRowId,
	navigate,
	hideControls = false,
	simpleSkeleton = false,
	skeletonRowCount = 5,
	initialPageSize = 10,
	prefsKey,
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
	periodo = { desde: "", hasta: "" },
	onPeriodoChange,
	jurisdiccionFilter = "all",
	onJurisdiccionFilterChange,
	uniqueJurisdicciones = [],
	fueroFilter = "all",
	onFueroFilterChange,
	uniqueFueros = [],
	departamentoFilter = "all",
	onDepartamentoFilterChange,
	uniqueDepartamentos = [],
	juzgadoFilter = "all",
	onJuzgadoFilterChange,
	uniqueJuzgados = [],
	ubicacionFilter = "all",
	onUbicacionFilterChange,
	uniqueUbicaciones = [],
	situacionFilter = "all",
	onSituacionFilterChange,
	uniqueSituaciones = [],
	seguimientoFilter = "all",
	onSeguimientoFilterChange,
	resolveResponsables,
	storedHiddenColumns = null,
	onHiddenColumnsChange,
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
	// Estado de credencial SCBA/PJN del usuario (cache singleton con TTL, ver
	// useScbaCredentialError) — para el ícono superpuesto del badge de fuente en
	// las cards mobile. Llamarlo acá también es seguro: el hook está diseñado
	// para que N call-sites no dupliquen el fetch al backend.
	const scbaCredError = useScbaCredentialError();
	const pjnCredError = usePjnCredentialError();
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
		if (fueroFilter !== "all") count++;
		if (departamentoFilter !== "all") count++;
		if (juzgadoFilter !== "all") count++;
		if (ubicacionFilter !== "all") count++;
		if (situacionFilter !== "all") count++;
		if (seguimientoFilter !== "all") count++;
		return count;
	}, [
		folderTypeFilter,
		statusFilter,
		parteFilter,
		movimientosFilter,
		jurisdiccionFilter,
		fueroFilter,
		departamentoFilter,
		juzgadoFilter,
		ubicacionFilter,
		situacionFilter,
		seguimientoFilter,
	]);

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "folderName", desc: false };
	// Tamaño de página y orden guardados en esta pestaña (al volver de una causa se restauran).
	const savedPrefs = useMemo(
		() => (prefsKey ? readListPrefs<{ pageSize?: number; sortBy?: { id: string; desc: boolean }[] }>(prefsKey) : {}),
		[prefsKey],
	);

	// Columnas sin información para este usuario (capturas de Silvia, 5/11/2026): si ninguna
	// carpeta tiene «Parte» definida o fecha de inicio, esas columnas arrancan ocultas en
	// escritorio (siguen disponibles en «Columnas»). Ahorra ancho para llegar a «Acciones».
	const emptyColumns = useMemo(() => {
		const rows = Array.isArray(data) ? (data as any[]) : [];
		if (rows.length === 0) return [] as string[];
		const out: string[] = [];
		if (rows.every((f) => !f?.orderStatus || f.orderStatus === "Sin definir")) out.push("orderStatus");
		if (rows.every((f) => !f?.initialDateFolder && !f?.judFolder?.initialDateJudFolder && !f?.preFolder?.initialDatePreFolder))
			out.push("initialDateFolder");
		// Situación (6/11/2026): solo la informan PJN y los portales con situación; sin dato, oculta.
		if (rows.every((f) => !f?.situacion)) out.push("situacion");
		return out;
	}, [data]);

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
					"responsables",
			  ]
			: ["email", "_id", "description", "finalDateFolder", "createdAt", "updatedAt", ...emptyColumns];
		return disableRowSelection ? [...base, "selection"] : base;
	}, [matchDownSM, disableRowSelection, emptyColumns]);

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
		state: { globalFilter, selectedRowIds, pageIndex, pageSize, expanded, sortBy: tableSortBy, hiddenColumns: currentHiddenColumns },
		preGlobalFilteredRows,
		setGlobalFilter,
		setSortBy,
		selectedFlatRows,
		toggleAllRowsSelected,
	} = useTable<Folder>(
		{
			columns: columns as any,
			data,
			filterTypes,
			// El orden elegido no se pierde al filtrar ni al recargar la lista (11/11/2026, reporte de
			// Silvia): react-table lo reiniciaba al inicial con cada array nuevo de `data`. La página
			// sí vuelve a la 1 al filtrar (autoResetPage queda por defecto).
			autoResetSortBy: false,
			initialState: {
				pageIndex: 0,
				pageSize: typeof savedPrefs.pageSize === "number" && savedPrefs.pageSize > 0 ? savedPrefs.pageSize : initialPageSize,
				hiddenColumns: defaultHiddenColumns,
				sortBy: Array.isArray(savedPrefs.sortBy) && savedPrefs.sortBy.length > 0 ? savedPrefs.sortBy : [sortBy],
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
		if (prefsKey) writeListPrefs(prefsKey, { pageSize, sortBy: tableSortBy });
	}, [prefsKey, pageSize, tableSortBy]);

	useEffect(() => {
		// Columnas elegidas por el usuario (selector «Columnas», 5/11/2026): primero las guardadas
		// en el hub (valen en cualquier navegador), después las del navegador; en móvil manda el default.
		let stored: string[] | null = null;
		if (!matchDownSM) {
			if (Array.isArray(storedHiddenColumns)) {
				stored = storedHiddenColumns.filter((id) => typeof id === "string");
			} else {
				try {
					const raw = localStorage.getItem(HIDDEN_COLUMNS_STORAGE_KEY);
					const parsed = raw ? JSON.parse(raw) : null;
					if (Array.isArray(parsed)) stored = parsed.filter((id) => typeof id === "string");
				} catch {
					stored = null;
				}
			}
		}
		const base = stored ? [...new Set([...stored, "email", "_id"])] : defaultHiddenColumns;
		setHiddenColumns(disableRowSelection && !base.includes("selection") ? [...base, "selection"] : base);
		setIsColumnsReady(true);

		return () => {
			setIsColumnsReady(false);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		setHiddenColumns,
		defaultHiddenColumns,
		matchDownSM,
		disableRowSelection,
		Array.isArray(storedHiddenColumns) ? storedHiddenColumns.join("|") : "",
	]);

	// Sincronizar sortBy con Redux cuando cambie
	useEffect(() => {
		if (tableSortBy && tableSortBy.length > 0) {
			const { id, desc } = tableSortBy[0];
			dispatch(setFolderSort(id, desc || false));
		}
	}, [tableSortBy]);

	const csvHeaders = [
		{ label: "Nombre", key: "folderName" },
		{ label: "CUIJ", key: "cuij" },
		{ label: "Nº expediente", key: "numberJudFolder" },
		{ label: "Materia", key: "materia" },
		{ label: "Estado", key: "status" },
		{ label: "Jurisdicción", key: "jurisdiccion" },
		{ label: "Departamento / Circunscripción", key: "departamento" },
		{ label: "Fuero", key: "folderFuero" },
		{ label: "Juzgado de origen", key: "radicacion" },
		{ label: "Ubicación actual", key: "ubicacion" },
		{ label: "Situación", key: "situacion" },
		{ label: "Seguimiento", key: "seguimiento" },
		...(resolveResponsables ? [{ label: "Responsable", key: "responsable" }] : []),
		{ label: "Fecha inicio", key: "initialDateFolder" },
		{ label: "Fecha cierre", key: "finalDateFolder" },
		{ label: "Monto", key: "amount" },
		{ label: "Descripción", key: "description" },
		// "Nro. Expediente"/"Año Expediente" salían de folder.expedientNumber y
		// folder.expedientYear, que NO existen en el modelo: eran dos columnas
		// siempre vacías, y además duplicaban a "Nº expediente" (numberJudFolder),
		// que sí tiene dato. Mismo campo fantasma que había en la vista de
		// verificación pendiente — 2026-08-26.
		{ label: "Origen", key: "source" },
	];

	const csvData = useMemo(() => {
		const sourceRows = selectedFlatRows.length > 0 ? selectedFlatRows.map((d: any) => d.original) : data;
		return sourceRows.map((folder: Folder) => ({
			folderName: folder.folderName || "",
			cuij: folder.judFolder?.cuij || "",
			numberJudFolder: folder.judFolder?.numberJudFolder || "",
			materia: folder.materia || "",
			status: folder.status || "",
			jurisdiccion: folder.folderJuris?.label || "",
			departamento: departamentoDe(folder.folderJuris?.item, folder.folderJuris?.label),
			folderFuero: folder.folderFuero || "",
			radicacion: radicacionOrigen(folder),
			ubicacion: ubicacionDetalle(folder) || ubicacionActual(folder),
			situacion: (folder as any).situacion ? situacionLabel((folder as any).situacion) : "",
			seguimiento: (folder as any).seguimiento?.activo ? "Sí" : "",
			responsable: resolveResponsables ? resolveResponsables((folder as any).responsables) : "",
			initialDateFolder: folder.initialDateFolder || "",
			finalDateFolder: folder.finalDateFolder || "",
			amount: folder.amount ?? "",
			description: folder.description || "",
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
					    Desktop (≥ sm): una sola fila —  Agregar | sep | Archivados+Repartir | sep | Filtros+Orden+Columnas | sep | [Buscador · Más opciones]
					                   + barra de selección (Collapse) debajo con las acciones masivas cuando hay carpetas marcadas
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

									{/* Equipos: asignar responsable a las seleccionadas */}
									{handleAssignSelected && (
										<MenuItem
											onClick={() => {
												handleMobileMenuClose();
												handleAssignSelected(selectedFlatRows, () => toggleAllRowsSelected(false));
											}}
											disabled={Object.keys(selectedRowIds).length === 0}
										>
											<ListItemIcon>
												<UserEdit size={18} />
											</ListItemIcon>
											<ListItemText>
												{Object.keys(selectedRowIds).length > 0
													? `Asignar responsable (${selectedFlatRows.length})`
													: "Asignar responsable"}
											</ListItemText>
										</MenuItem>
									)}

									{/* Seguimiento (6/11/2026): marcar o quitar las seleccionadas */}
									{handleSeguimientoSelected && (
										<MenuItem
											onClick={() => {
												handleMobileMenuClose();
												handleSeguimientoSelected(
													selectedFlatRows,
													() => toggleAllRowsSelected(false),
													!selectedFlatRows.every((r: any) => r.original?.seguimiento?.activo),
												);
											}}
											disabled={Object.keys(selectedRowIds).length === 0}
										>
											<ListItemIcon>
												<Star1 size={18} />
											</ListItemIcon>
											<ListItemText>
												{Object.keys(selectedRowIds).length === 0
													? "Seguimiento"
													: selectedFlatRows.every((r: any) => r.original?.seguimiento?.activo)
													? `Quitar seguimiento (${selectedFlatRows.length})`
													: `Marcar seguimiento (${selectedFlatRows.length})`}
											</ListItemText>
										</MenuItem>
									)}

									{/* Equipos: repartir por criterios (con selección, solo esas) */}
									{handleDistribute && (
										<MenuItem
											onClick={() => {
												handleMobileMenuClose();
												handleDistribute(selectedFlatRows, () => toggleAllRowsSelected(false));
											}}
										>
											<ListItemIcon>
												<Hierarchy size={18} />
											</ListItemIcon>
											<ListItemText>
												{Object.keys(selectedRowIds).length > 0 ? `Repartir (${selectedFlatRows.length})` : "Repartir carpetas"}
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
								{handleDistribute && (
									<Tooltip title="Repartir carpetas del equipo por juzgado, fuero, partes iguales, cantidades o al azar" placement="top">
										<Button
											variant="outlined"
											color="secondary"
											size="small"
											startIcon={<Hierarchy size={18} />}
											onClick={() => handleDistribute(selectedFlatRows, () => toggleAllRowsSelected(false))}
											sx={{ textTransform: "none" }}
											data-testid="folder-distribute-btn"
										>
											Repartir
										</Button>
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
									<SortingSelect
										sortBy={tableSortBy[0]?.id || sortBy.id}
										sortDesc={tableSortBy[0]?.desc === true}
										setSortBy={setSortBy}
										allColumns={allColumns as any}
									/>
								</Box>
								{!matchDownSM && (
									<ColumnasSelect
										allColumns={allColumns as any}
										hiddenColumns={currentHiddenColumns || []}
										setHiddenColumns={(ids) => {
											setHiddenColumns(ids);
											onHiddenColumnsChange?.(ids);
										}}
									/>
								)}
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

					{/* ── BARRA DE SELECCIÓN (escritorio) ──────────────────────────────────
					    Las acciones que dependen de la selección viven acá y no en la barra principal:
					    antes los botones se alargaban con el contador («Archivar (3)», «Asignar
					    responsable (3)»…) y el buscador y «Más opciones» caían a una segunda línea
					    (11/11/2026). La barra principal no cambia de ancho al seleccionar. */}
					{!matchDownSM && (
						<Collapse in={selectedFlatRows.length > 0} unmountOnExit>
							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
								flexWrap="wrap"
								useFlexGap
								sx={{
									px: 1.75,
									py: 1,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.045),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.26 : 0.16)}`,
									borderRadius: 1.5,
								}}
								data-testid="folder-selection-bar"
							>
								<Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap", mr: 0.5 }}>
									{selectedFlatRows.length === 1 ? "1 seleccionada" : `${selectedFlatRows.length} seleccionadas`}
								</Typography>
								{handleArchiveSelected && (
									<Button
										variant="outlined"
										color="secondary"
										size="small"
										startIcon={<Archive size={18} />}
										onClick={() => handleArchiveSelected(selectedFlatRows)}
										sx={{ textTransform: "none" }}
										data-testid="folder-archive-selected-btn"
									>
										Archivar
									</Button>
								)}
								{handleAssignSelected && (
									<Button
										variant="outlined"
										color="secondary"
										size="small"
										startIcon={<UserEdit size={18} />}
										onClick={() => handleAssignSelected(selectedFlatRows, () => toggleAllRowsSelected(false))}
										sx={{ textTransform: "none" }}
										data-testid="folder-assign-responsable-btn"
									>
										Asignar responsable
									</Button>
								)}
								{handleSeguimientoSelected && (
									<Button
										variant="outlined"
										color="secondary"
										size="small"
										startIcon={<Star1 size={18} />}
										onClick={() =>
											handleSeguimientoSelected(
												selectedFlatRows,
												() => toggleAllRowsSelected(false),
												!selectedFlatRows.every((r: any) => r.original?.seguimiento?.activo),
											)
										}
										sx={{ textTransform: "none" }}
										data-testid="folder-seguimiento-btn"
									>
										{selectedFlatRows.every((r: any) => r.original?.seguimiento?.activo) ? "Quitar seguimiento" : "Marcar seguimiento"}
									</Button>
								)}
								{handleDistribute && (
									<Tooltip
										title="Repartir las carpetas seleccionadas por juzgado, fuero, partes iguales, cantidades o al azar"
										placement="top"
									>
										<Button
											variant="outlined"
											color="secondary"
											size="small"
											startIcon={<Hierarchy size={18} />}
											onClick={() => handleDistribute(selectedFlatRows, () => toggleAllRowsSelected(false))}
											sx={{ textTransform: "none" }}
											data-testid="folder-distribute-selected-btn"
										>
											Repartir
										</Button>
									</Tooltip>
								)}
								{handleDeleteSelected && (
									<Button
										variant="outlined"
										color="error"
										size="small"
										startIcon={<Trash size={18} />}
										onClick={() => handleDeleteSelected(selectedFlatRows)}
										sx={{ textTransform: "none" }}
										data-testid="folder-delete-selected-btn"
									>
										Eliminar
									</Button>
								)}
								<Box sx={{ flex: 1 }} />
								{selectedFlatRows.length < rows.length && (
									<Tooltip title="Selecciona todas las carpetas que pasan los filtros actuales, no solo la página visible" placement="top">
										<Button
											variant="text"
											size="small"
											onClick={() => toggleAllRowsSelected(true)}
											sx={{ textTransform: "none", color: "text.secondary", whiteSpace: "nowrap" }}
											data-testid="folder-select-all-filtered-btn"
										>
											{`Seleccionar todas (${rows.length})`}
										</Button>
									</Tooltip>
								)}
								<Tooltip title="Quitar selección">
									<IconButton size="small" color="secondary" onClick={() => toggleAllRowsSelected(false)} aria-label="Quitar selección">
										<CloseCircle size={18} />
									</IconButton>
								</Tooltip>
							</Stack>
						</Collapse>
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
											<MenuItem value="scba">
												<Typography variant="body2">SCBA</Typography>
											</MenuItem>
											<MenuItem value="eje">
												<Typography variant="body2">EJE</Typography>
											</MenuItem>
											<MenuItem value="mev">
												<Typography variant="body2">MEV</Typography>
											</MenuItem>
											<MenuItem value="pjsalta">
												<Typography variant="body2">PJ Salta</Typography>
											</MenuItem>
											<MenuItem value="pjcatamarca">
												<Typography variant="body2">PJ Catamarca</Typography>
											</MenuItem>
											<MenuItem value="pjmendoza">
												<Typography variant="body2">PJ Mendoza</Typography>
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
												{/* Control del estudio (6/11/2026): expedientes quietos hace más de N días */}
												{Object.entries(INACTIVIDAD_FILTROS).map(([value, def]) => (
													<MenuItem key={value} value={value}>
														<Typography variant="body2">{def.label}</Typography>
													</MenuItem>
												))}
												{onPeriodoChange && (
													<MenuItem value="periodo">
														<Typography variant="body2">Período…</Typography>
													</MenuItem>
												)}
											</Select>
										</FormControl>
									)}
									{/* Período (6/11/2026): último movimiento entre dos fechas; se enlaza con ?movimientos=periodo&desde=&hasta= */}
									{onPeriodoChange && movimientosFilter === "periodo" && (
										<>
											<OutlinedInput
												size="small"
												type="date"
												value={periodo.desde}
												onChange={(e) => onPeriodoChange({ ...periodo, desde: e.target.value })}
												inputProps={{ "aria-label": "Movimientos desde", max: periodo.hasta || undefined, "data-testid": "periodo-desde" }}
												sx={{ width: 160, fontSize: "0.8rem" }}
											/>
											<OutlinedInput
												size="small"
												type="date"
												value={periodo.hasta}
												onChange={(e) => onPeriodoChange({ ...periodo, hasta: e.target.value })}
												inputProps={{ "aria-label": "Movimientos hasta", min: periodo.desde || undefined, "data-testid": "periodo-hasta" }}
												sx={{ width: 160, fontSize: "0.8rem" }}
											/>
										</>
									)}
									{/* Filtro por Situación procesal (EN LETRA, EN DESPACHO…), solo si hay dato */}
									{onSituacionFilterChange && uniqueSituaciones.some((s) => s.value) && (
										<FormControl size="small" sx={{ minWidth: 160 }}>
											<Select
												id="situacion-filter"
												displayEmpty
												value={situacionFilter}
												onChange={onSituacionFilterChange}
												sx={filterSelectSx}
											>
												<MenuItem value="all">
													<Typography variant="body2">Situación: Todas</Typography>
												</MenuItem>
												{uniqueSituaciones.map((s) => (
													<MenuItem key={s.value || "__none"} value={s.value || "__none"}>
														<Typography variant="body2">
															{s.label} ({s.count})
														</Typography>
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
									{/* Seguimiento (6/11/2026): solo las marcadas o solo las no marcadas */}
									{onSeguimientoFilterChange && (
										<FormControl size="small" sx={{ minWidth: 160 }}>
											<Select
												id="seguimiento-filter"
												displayEmpty
												value={seguimientoFilter}
												onChange={onSeguimientoFilterChange}
												sx={filterSelectSx}
											>
												<MenuItem value="all">
													<Typography variant="body2">Seguimiento: Todas</Typography>
												</MenuItem>
												<MenuItem value="si">
													<Typography variant="body2">Solo en seguimiento</Typography>
												</MenuItem>
												<MenuItem value="no">
													<Typography variant="body2">Sin seguimiento</Typography>
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
									{/* Filtro por Departamento / circunscripción: solo cuando la provincia
									    elegida tiene más de uno entre las carpetas del usuario */}
									{onDepartamentoFilterChange && jurisdiccionFilter !== "all" && uniqueDepartamentos.length > 1 && (
										<FormControl size="small" sx={{ minWidth: 170 }}>
											<Select
												id="departamento-filter"
												displayEmpty
												value={departamentoFilter}
												onChange={onDepartamentoFilterChange}
												sx={filterSelectSx}
											>
												<MenuItem value="all">
													<Typography variant="body2">Departamento: Todos</Typography>
												</MenuItem>
												{uniqueDepartamentos.map((dep) => (
													<MenuItem key={dep} value={dep}>
														<Typography variant="body2">{departamentoDe(dep, jurisdiccionFilter)}</Typography>
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
									{/* Filtro por Fuero (valores presentes en las carpetas del usuario) */}
									{onFueroFilterChange && uniqueFueros.length > 0 && (
										<FormControl size="small" sx={{ minWidth: 150 }}>
											<Select id="fuero-filter" displayEmpty value={fueroFilter} onChange={onFueroFilterChange} sx={filterSelectSx}>
												<MenuItem value="all">
													<Typography variant="body2">Fuero: Todos</Typography>
												</MenuItem>
												{uniqueFueros.map((fuero) => (
													<MenuItem key={fuero} value={fuero}>
														<Typography variant="body2">{fuero}</Typography>
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
									{/* Filtro por Juzgado de origen (fuero + número), con conteo */}
									{onJuzgadoFilterChange && uniqueJuzgados.length > 0 && (
										<FormControl size="small" sx={{ minWidth: 160 }}>
											<Select id="juzgado-filter" displayEmpty value={juzgadoFilter} onChange={onJuzgadoFilterChange} sx={filterSelectSx}>
												<MenuItem value="all">
													<Typography variant="body2">Juzgado: Todos</Typography>
												</MenuItem>
												{uniqueJuzgados.map((j) => (
													<MenuItem key={j.value} value={j.value}>
														<Typography variant="body2">
															{j.label} ({j.count})
														</Typography>
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
									{/* Filtro por Ubicación actual (Juzgado / Cámara / Corte / Otro) */}
									{onUbicacionFilterChange && uniqueUbicaciones.length > 1 && (
										<FormControl size="small" sx={{ minWidth: 160 }}>
											<Select
												id="ubicacion-filter"
												displayEmpty
												value={ubicacionFilter}
												onChange={onUbicacionFilterChange}
												sx={filterSelectSx}
											>
												<MenuItem value="all">
													<Typography variant="body2">Ubicación: Todas</Typography>
												</MenuItem>
												{uniqueUbicaciones.map((u) => (
													<MenuItem key={u.value} value={u.value}>
														<Typography variant="body2">
															{u.value || "Sin dato"} ({u.count})
														</Typography>
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

					{/* Credencial PJN rechazada (2026-09-28): no se suspenden los avisos — las
					    causas públicas siguen; las reservadas esperan la contraseña nueva. */}
					{pjnCredError.requiresAction && <PjnCredErrorBanner to={PJN_PROFILE_PATH} />}
				</Stack>
			)}

			{/* Vista condicional: cards en mobile, tabla en desktop */}
			{matchDownSM ? (
				/* ── MOBILE: Cards verticales ─────────────────────────────────────── */
				<Stack spacing={1} sx={{ px: 0, pb: 1.5 }}>
					{page.map((row) => {
						prepareRow(row);
						const folder = row.original as any;
						const isSelected = row.isSelected;

						// Chip de estado — replica el patrón brand-aware del desktop.
						const statusChip = folder.status ? <StatusPill status={folder.status} /> : null;

						const sourceBadge = (
							<FolderSourceBadge
								folder={folder}
								pjnCredErrorActive={!!pjnCredError.requiresAction}
								scbaCredErrorActive={!!scbaCredError.hasError}
							/>
						);

						// Último movimiento formateado
						const lastMovStr = folder.lastMovementDate
							? (() => {
									try {
										return dayjs.utc(folder.lastMovementDate).format("DD/MM/YY");
									} catch {
										return null;
									}
							  })()
							: null;

						// Fecha inicio formateada
						const initDateStr = folder.initialDateFolder
							? (() => {
									try {
										return dayjs.utc(folder.initialDateFolder).format("DD/MM/YY");
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
								{/* Mobile (2026-09-29): carátula a todo el ancho (2 líneas) con la fuente a la
								    izquierda; fuero/jurisdicción + estado; último movimiento + "sin ver" + ⛓
								    en una sola fila. "Parte" solo si está definida. */}
								<CardContent sx={{ p: 1.5, pb: 1, "&:last-child": { pb: 1 } }}>
									<Stack spacing={0.5}>
										<Stack direction="row" alignItems="flex-start" spacing={1}>
											{sourceBadge && <Box sx={{ pt: 0.25, flexShrink: 0 }}>{sourceBadge}</Box>}
											<Typography
												variant="subtitle2"
												fontWeight={600}
												sx={{
													flex: 1,
													minWidth: 0,
													lineHeight: 1.3,
													wordBreak: "break-word",
													display: "-webkit-box",
													WebkitLineClamp: 2,
													WebkitBoxOrient: "vertical",
													overflow: "hidden",
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
												{folder.folderName ? formatFolderName(folder.folderName, 90) : "Sin nombre"}
											</Typography>
										</Stack>

										{/* Metadata preview — blur en modo preview para indicar que los
										    datos son indicativos; el detalle real está al tap. */}
										<Box
											sx={
												disableRowSelection
													? {
															display: "flex",
															flexDirection: "column",
															gap: 0.5,
															filter: "blur(2.5px)",
															opacity: 0.55,
															userSelect: "none",
															pointerEvents: "none",
													  }
													: { display: "flex", flexDirection: "column", gap: 0.5 }
											}
										>
											<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
												<Typography variant="caption" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
													{[folder.folderFuero, folder.folderJuris?.label].filter(Boolean).join(" · ") || "—"}
												</Typography>
												{statusChip && <Box sx={{ flexShrink: 0 }}>{statusChip}</Box>}
											</Stack>

											{folder.orderStatus && folder.orderStatus !== "Sin definir" && (
												<Typography variant="caption" color="text.secondary">
													Parte: <strong>{folder.orderStatus}</strong>
												</Typography>
											)}

											{/* Último movimiento ("sin ver" y ⛓ debajo) + acciones a la derecha: una sola
											    fila en vez del pie separado. */}
											<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
												<Stack spacing={0.25} sx={{ minWidth: 0 }}>
													<Typography variant="caption" color="text.secondary" noWrap>
														{lastMovStr ? `Últ. mov. ${lastMovStr}` : initDateStr ? `Inicio ${initDateStr}` : "Sin movimientos"}
													</Typography>
													{((folder.unseenCount || 0) > 0 || (folder.unseenOcultos || 0) > 0 || folder.relaciones) && (
														<Stack direction="row" alignItems="center" sx={{ ml: -0.75, minHeight: 22 }}>
															<SinVerCount count={folder.unseenCount} ocultos={folder.unseenOcultos} />
															{folder.relaciones && (
																<Box sx={{ ml: 0.5 }} onClick={(e) => e.stopPropagation()}>
																	<RelacionesIcon
																		relaciones={folder.relaciones}
																		onClick={() => navigate(`/apps/folders/details/${folder._id}?tab=relaciones`)}
																	/>
																</Box>
															)}
														</Stack>
													)}
												</Stack>
												<Box
													sx={{
														flexShrink: 0,
														mr: -1,
														"& .MuiStack-root": { gap: 0 },
														"& .MuiStack-root > :not(style) ~ :not(style)": { ml: 0 },
													}}
													onClick={(e) => e.stopPropagation()}
												>
													{row.cells.find((c) => (c.column as any).Header === "Acciones")?.render("Cell", { compact: true })}
												</Box>
											</Stack>
										</Box>
									</Stack>
								</CardContent>
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
	const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
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
	const [archivedSearch, setArchivedSearch] = useState("");
	// Equipos: filtro por responsable del modal de archivadas ("" = todos, "ninguno", o un id).
	const [archivedResponsable, setArchivedResponsable] = useState("");
	// Juzgado de origen del modal de archivadas ("" = todos, o «fuero|número»), 6/11/2026.
	const [archivedJuzgado, setArchivedJuzgado] = useState("");
	const archivedExtra = useMemo(
		() => ({ responsable: archivedResponsable, juzgado: archivedJuzgado }),
		[archivedResponsable, archivedJuzgado],
	);
	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [menuRowId, setMenuRowId] = useState<string | null>(null);
	const [menuFolderData, setMenuFolderData] = useState<any>(null);
	// Chat con IA sobre el expediente: el renglón del menú solo aparece con acceso
	const chatAccess = useExpedienteChatAccess();
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

	// Estados para filtros de carpetas. Arrancan con lo que quedó en esta pestaña (6/11/2026, pedido
	// de Silvia: al entrar en una causa y volver, el listado estaba «como restaurado»).
	const savedFilters = useMemo(
		() => (readListPrefs<{ filters?: Record<string, any> }>(FOLDERS_LIST_PREFS_KEY).filters || {}) as Record<string, any>,
		[],
	);
	const [folderTypeFilter, setFolderTypeFilter] = useState<
		"all" | "manual" | "pjn" | "eje" | "mev" | "pjsalta" | "pjcatamarca" | "pjmendoza" | "scba"
	>(savedFilters.folderTypeFilter ?? "all");
	const [statusFilter, setStatusFilter] = useState<"all" | "Nueva" | "En Proceso" | "Pendiente" | "Cerrada">(
		savedFilters.statusFilter ?? "all",
	);
	const [parteFilter, setParteFilter] = useState<string>(savedFilters.parteFilter ?? "all");
	// ?movimientos=today|week|month|none (lo usa la alerta agrupada de movimientos nuevos).
	// También inactive30|90|180|365 («Sin movimiento hace más de…») y periodo (+ ?desde= y ?hasta=),
	// control del estudio 6/11/2026.
	const MOVIMIENTOS_FILTROS = ["all", "today", "week", "month", "none", "periodo"] as const;
	type MovimientosFiltro = (typeof MOVIMIENTOS_FILTROS)[number] | keyof typeof INACTIVIDAD_FILTROS;
	const esMovimientosFiltro = (v: string | null): v is MovimientosFiltro =>
		MOVIMIENTOS_FILTROS.includes(v as (typeof MOVIMIENTOS_FILTROS)[number]) || isInactividadFiltro(v);
	const movimientosParam = searchParams.get("movimientos");
	const [movimientosFilter, setMovimientosFilter] = useState<MovimientosFiltro>(
		esMovimientosFiltro(movimientosParam)
			? movimientosParam
			: esMovimientosFiltro(savedFilters.movimientosFilter ?? null)
			? savedFilters.movimientosFilter
			: "all",
	);
	const periodoDesdeUrl = (p: string | null) => (isIsoDay(p) ? p : "");
	const [periodo, setPeriodo] = useState<PeriodoMovimientos>(() =>
		movimientosParam === "periodo" || !savedFilters.periodo
			? { desde: periodoDesdeUrl(searchParams.get("desde")), hasta: periodoDesdeUrl(searchParams.get("hasta")) }
			: { desde: periodoDesdeUrl(savedFilters.periodo.desde), hasta: periodoDesdeUrl(savedFilters.periodo.hasta) },
	);
	// Si se llega con el parámetro estando ya en la página (otra alerta), aplicarlo.
	useEffect(() => {
		if (esMovimientosFiltro(movimientosParam)) {
			setMovimientosFilter(movimientosParam);
			if (movimientosParam === "periodo") {
				setPeriodo({ desde: periodoDesdeUrl(searchParams.get("desde")), hasta: periodoDesdeUrl(searchParams.get("hasta")) });
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [movimientosParam]);
	const [jurisdiccionFilter, setJurisdiccionFilter] = useState<string>(savedFilters.jurisdiccionFilter ?? "all");
	const [fueroFilter, setFueroFilter] = useState<string>(savedFilters.fueroFilter ?? "all");
	const [departamentoFilter, setDepartamentoFilter] = useState<string>(savedFilters.departamentoFilter ?? "all");
	// Radicación (5/11/2026): juzgado de origen (clave fuero|número) y ubicación actual
	const [juzgadoFilter, setJuzgadoFilter] = useState<string>(savedFilters.juzgadoFilter ?? "all");
	const [ubicacionFilter, setUbicacionFilter] = useState<string>(savedFilters.ubicacionFilter ?? "all");
	// Situación procesal (6/11/2026): "all" | clave normalizada | "__none" (sin dato).
	const [situacionFilter, setSituacionFilter] = useState<string>(savedFilters.situacionFilter ?? "all");
	// Seguimiento (6/11/2026): "all" | "si" | "no".
	const [seguimientoFilter, setSeguimientoFilter] = useState<string>(savedFilters.seguimientoFilter ?? "all");

	// Estado para pre-seleccionar paso y valores al abrir AddFolder desde los badges
	const [addFolderInitialStep, setAddFolderInitialStep] = useState<number | undefined>(undefined);
	const [addFolderInitialFormValues, setAddFolderInitialFormValues] = useState<
		{ entryMethod?: string; judicialPower?: string; pjnImportMode?: string; baImportMode?: string } | undefined
	>(undefined);

	// Referencias
	const loadingRef = useRef(false);
	const pendingTableRef = useRef<HTMLDivElement>(null);

	// Selectores
	const user = useSelector((state) => state.auth.user);
	const { folders, archivedFolders, archivedPagination, archivedFacets, isLoader, isArchivedLoader } = useSelector((state) => state.folder);
	const subscription = useSelector((state) => state.auth.subscription);

	// Team context - para cargar recursos del equipo si hay uno activo
	const {
		activeTeam,
		isTeamMode,
		canCreate,
		canUpdate,
		canDelete,
		isInitialized: isTeamInitialized,
		getRequestHeaders,
		userRole,
	} = useTeam();
	const canEditResponsables = userRole === "owner" || userRole === "admin" || userRole === "editor";

	// Equipos: vista por responsable («Mis carpetas / Todas / Sin responsable», o «De…» con el id
	// de un integrante, previsto o invitado). Default «Todas». El filtro lo resuelve el hub
	// (`?responsable=me|ninguno|<id>`); mientras llega la respuesta se filtra con los
	// `responsables` que ya trae el listado. Solo afecta la tabla principal.
	const [responsableVista, setResponsableVista] = useState<string>(savedFilters.responsableVista ?? "todas");
	const [responsableIds, setResponsableIds] = useState<Set<string> | null>(null);
	// Guardar los filtros en esta pestaña cada vez que cambian (ver savedFilters).
	useEffect(() => {
		writeListPrefs(FOLDERS_LIST_PREFS_KEY, {
			filters: {
				folderTypeFilter,
				statusFilter,
				parteFilter,
				movimientosFilter,
				periodo,
				jurisdiccionFilter,
				fueroFilter,
				departamentoFilter,
				juzgadoFilter,
				ubicacionFilter,
				situacionFilter,
				seguimientoFilter,
				responsableVista,
			},
		});
	}, [
		folderTypeFilter,
		statusFilter,
		parteFilter,
		movimientosFilter,
		periodo,
		jurisdiccionFilter,
		fueroFilter,
		departamentoFilter,
		juzgadoFilter,
		ubicacionFilter,
		situacionFilter,
		seguimientoFilter,
		responsableVista,
	]);
	const responsablesSignature = useMemo(
		() => (isTeamMode ? folders.map((f: any) => `${f._id}:${(f.responsables || []).join(",")}`).join("|") : ""),
		[folders, isTeamMode],
	);
	useEffect(() => {
		const responsableParam = responsableQueryValue(responsableVista);
		if (!isTeamMode || !activeTeam?._id || !responsableParam) {
			setResponsableIds(null);
			return;
		}
		let cancelled = false;
		setResponsableIds(null);
		fetchGroupFolderIdsByResponsable(activeTeam._id, responsableParam).then((ids) => {
			if (!cancelled) setResponsableIds(ids ? new Set(ids) : null);
		});
		return () => {
			cancelled = true;
		};
	}, [isTeamMode, activeTeam?._id, responsableVista, responsablesSignature]);

	// Separar folders en categorías
	const { pendingOrInvalidFolders, verifiedFolders, pendingCount, invalidCount } = useMemo(() => {
		// Helper para determinar si una carpeta es automática (PJN, MEV, EJE o SCBA)
		const isAutoFolder = (folder: any) =>
			folder.source === "auto" ||
			folder.pjn === true ||
			folder.mev === true ||
			folder.eje === true ||
			folder.scba === true ||
			folder.pjsalta === true ||
			folder.pjcatamarca === true ||
			folder.pjmendoza === true;

		// MEV con login fallido (invalid/expired/disabled): el worker marcó la carpeta como
		// failed / causaIsValid=false, pero el problema es la credencial, no la causa. Se
		// queda en la tabla principal con el chip ámbar de credencial (mismo criterio que
		// PJN/SCBA con cred en error), sin contar como inválida.
		const isCredFailure = (folder: any) => isMevCredLoginFailure(folder);

		// Filtrar folders que necesitan verificación o son inválidos
		// Para carpetas automáticas (source "auto", PJN, MEV o EJE)
		const pending = folders.filter(
			(folder: any) =>
				isAutoFolder(folder) &&
				!isCredFailure(folder) &&
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
				!isCredFailure(folder) &&
				((folder.causaVerified === true && folder.causaIsValid === false) || folder.causaAssociationStatus === "failed"),
		).length;

		// Folders verificados y válidos (incluye todos los que NO están en pending)
		const verified = folders.filter(
			(folder: any) =>
				// Carpetas que NO son automáticas (siempre van a la tabla principal)
				!isAutoFolder(folder) ||
				// MEV con credencial en error: el estado failed/inválida lo escribió el login fallido
				isCredFailure(folder) ||
				// O carpetas automáticas verificadas y no inválidas (sin selección pendiente).
				// T21: antes se exigía `causaIsValid === true`. Con `null` —que es un
				// valor legítimo: "verificada, validez todavía sin determinar"— la
				// carpeta no entraba acá NI en `pending` (que pide `=== false`), así
				// que desaparecía de las dos tablas y era invisible en la lista.
				(isAutoFolder(folder) &&
					folder.causaVerified === true &&
					folder.causaIsValid !== false &&
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

	const uniqueDepartamentos = useMemo(() => {
		if (jurisdiccionFilter === "all") return [] as string[];
		const deps = new Set<string>();
		verifiedFolders.forEach((folder: any) => {
			if (folder.folderJuris?.label === jurisdiccionFilter && folder.folderJuris?.item) deps.add(folder.folderJuris.item);
		});
		return Array.from(deps).sort();
	}, [verifiedFolders, jurisdiccionFilter]);

	const uniqueFueros = useMemo(() => {
		const fueros = new Set<string>();
		verifiedFolders.forEach((folder: any) => {
			if (folder.folderFuero) fueros.add(folder.folderFuero);
		});
		return Array.from(fueros).sort();
	}, [verifiedFolders]);

	// Juzgados de origen presentes (fuero + número), con conteo; ordenados por fuero y número.
	// Número → «7 · Seguridad Social»; texto (MEV, SCBA) → el nombre recortado (util compartido con Archivadas, 6/11/2026).
	const uniqueJuzgados = useMemo(() => juzgadoOptions(juzgadoCounts(verifiedFolders)), [verifiedFolders]);
	const uniqueSituaciones = useMemo(() => situacionOptions(verifiedFolders), [verifiedFolders]);
	// Juzgados de las archivadas: conteo del hub sobre todas, no solo la página visible.
	const archivedJuzgadoOptions = useMemo(() => juzgadoOptions(archivedFacets?.juzgados || []), [archivedFacets]);

	const uniqueUbicaciones = useMemo(() => {
		const map = new Map<string, number>();
		verifiedFolders.forEach((folder: any) => {
			const u = ubicacionActual(folder);
			map.set(u, (map.get(u) || 0) + 1);
		});
		const order = ["Juzgado", "Cámara", "Corte", "Otro", ""];
		return Array.from(map.entries())
			.map(([value, count]) => ({ value, count }))
			.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
	}, [verifiedFolders]);

	// Columnas ocultas por usuario (5/11/2026): se guardan en el hub (PUT /api/auth/update,
	// uiPreferences.foldersHiddenColumns) con un pequeño retraso para no pegar en cada clic,
	// y en el store para que el próximo montaje ya las tenga.
	const storedHiddenColumns = (user as any)?.uiPreferences?.foldersHiddenColumns ?? null;
	const hiddenColumnsSaveRef = useRef<ReturnType<typeof setTimeout>>();
	const handleHiddenColumnsChange = useCallback(
		(ids: string[]) => {
			clearTimeout(hiddenColumnsSaveRef.current);
			hiddenColumnsSaveRef.current = setTimeout(async () => {
				try {
					await axios.put(`${import.meta.env.VITE_BASE_URL}/api/auth/update`, { uiPreferences: { foldersHiddenColumns: ids } });
					dispatch(updateUser({ uiPreferences: { ...((user as any)?.uiPreferences || {}), foldersHiddenColumns: ids } }));
				} catch {
					/* queda guardado en el navegador igual */
				}
			}, 800);
		},
		[dispatch, user],
	);

	// Responsables con nombre para el CSV (integrantes, previstos e invitados).
	const teamAssigneesForCsv = useMemo(
		() => (isTeamMode ? getTeamAssignees(activeTeam, { includeInvitations: true }) : []),
		[isTeamMode, activeTeam],
	);
	const resolveResponsablesForCsv = useCallback(
		(ids: string[] | undefined) =>
			resolveAssignees(ids, teamAssigneesForCsv)
				.map((a) => a.name)
				.join("; "),
		[teamAssigneesForCsv],
	);
	// Opciones «De…» del selector del listado (sin el usuario: ya está en «Mis carpetas») y del
	// filtro por responsable del modal de archivadas (con todos).
	const responsableDeOptions = useMemo(() => responsableOptions(teamAssigneesForCsv, user?._id), [teamAssigneesForCsv, user?._id]);
	const archivedResponsableOptions = useMemo(() => responsableOptions(teamAssigneesForCsv), [teamAssigneesForCsv]);

	// Filtrar carpetas verificadas por todos los filtros
	const filteredVerifiedFolders = useMemo(() => {
		return verifiedFolders.filter((folder: any) => {
			// Filtro por responsable (modo equipo)
			if (isTeamMode && responsableVista !== "todas") {
				if (responsableIds) {
					if (!responsableIds.has(folder._id)) return false;
				} else {
					const ids: string[] = folder.responsables || [];
					if (responsableVista === "mias" && !(user?._id && ids.includes(user._id))) return false;
					if (responsableVista === "sin" && ids.length > 0) return false;
				}
			}

			// Filtro por tipo de carpeta
			if (folderTypeFilter !== "all") {
				switch (folderTypeFilter) {
					case "manual":
						if (
							!(
								folder.source === "manual" ||
								(!folder.pjn && !folder.scba && !folder.mev && !folder.eje && !folder.pjsalta && !folder.pjcatamarca && !folder.pjmendoza)
							)
						)
							return false;
						break;
					case "pjn":
						if (folder.pjn !== true) return false;
						break;
					case "scba":
						if (folder.scba !== true) return false;
						break;
					case "mev":
						if (folder.mev !== true) return false;
						break;
					case "eje":
						if (folder.eje !== true) return false;
						break;
					case "pjsalta":
						if (folder.pjsalta !== true) return false;
						break;
					case "pjcatamarca":
						if (folder.pjcatamarca !== true) return false;
						break;
					case "pjmendoza":
						if (folder.pjmendoza !== true) return false;
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

			// Filtro por departamento / circunscripción (dentro de la provincia elegida)
			if (departamentoFilter !== "all" && folder.folderJuris?.item !== departamentoFilter) {
				return false;
			}

			// Filtro por fuero
			if (fueroFilter !== "all" && folder.folderFuero !== fueroFilter) {
				return false;
			}

			// Filtro por juzgado de origen y por ubicación actual (5/11/2026)
			if (juzgadoFilter !== "all" && juzgadoKey(folder) !== juzgadoFilter) {
				return false;
			}
			if (ubicacionFilter !== "all" && ubicacionActual(folder) !== ubicacionFilter) {
				return false;
			}
			// Situación procesal (6/11/2026)
			if (situacionFilter !== "all") {
				const k = situacionKey(folder.situacion);
				if (situacionFilter === "__none" ? k !== "" : k !== situacionFilter) return false;
			}
			// Seguimiento (6/11/2026)
			if (seguimientoFilter !== "all" && Boolean(folder.seguimiento?.activo) !== (seguimientoFilter === "si")) {
				return false;
			}

			// Filtro por movimientos recientes
			if (movimientosFilter !== "all") {
				const today = dayjs().startOf("day");
				// Días por día calendario UTC (6/11/2026): «Hoy» no mostraba nada en Argentina.
				const dias = diasDesdeUltimoMovimiento(folder, today);

				switch (movimientosFilter) {
					case "today":
						if (dias !== 0) return false;
						break;
					case "week":
						if (dias === null || dias < 0 || dias >= 7) return false;
						break;
					case "month":
						if (dias === null || dias < 0 || dias >= 30) return false;
						break;
					case "none":
						if (folder.lastMovementDate) return false;
						break;
					case "periodo":
						if (!enPeriodo(folder, periodo)) return false;
						break;
					default:
						// inactive30|90|180|365: último movimiento conocido y anterior a hoy - N días
						if (isInactividadFiltro(movimientosFilter) && !sinMovimientoHace(folder, INACTIVIDAD_FILTROS[movimientosFilter].days, today))
							return false;
				}
			}

			return true;
		});
	}, [
		verifiedFolders,
		isTeamMode,
		responsableVista,
		responsableIds,
		user?._id,
		folderTypeFilter,
		statusFilter,
		parteFilter,
		jurisdiccionFilter,
		departamentoFilter,
		fueroFilter,
		juzgadoFilter,
		ubicacionFilter,
		situacionFilter,
		seguimientoFilter,
		movimientosFilter,
		periodo,
	]);

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
		if (maxFolders !== undefined && currentFolderCount >= maxFolders && !isDevReview()) {
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

	// IOL-8: mismo patrón que handleOpenCabaFolder — abren el wizard de alta con
	// la jurisdicción IOL pre-seleccionada. Detrás del toggle "mostrar más" del
	// sync bar (FoldersSyncBadges), ver ResourceUsageWidget.tsx.
	const handleOpenSaltaFolder = useCallback(() => {
		setAddFolderInitialStep(2);
		setAddFolderInitialFormValues({ entryMethod: "automatic", judicialPower: "salta" });
		setAdd(true);
		setAddFolderMode("add");
		setFolder(null);
	}, []);

	const handleOpenCatamarcaFolder = useCallback(() => {
		setAddFolderInitialStep(2);
		setAddFolderInitialFormValues({ entryMethod: "automatic", judicialPower: "catamarca" });
		setAdd(true);
		setAddFolderMode("add");
		setFolder(null);
	}, []);

	const handleOpenMendozaFolder = useCallback(() => {
		setAddFolderInitialStep(2);
		setAddFolderInitialFormValues({ entryMethod: "automatic", judicialPower: "mendoza" });
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
		if (onboarding !== "true" || action !== "create") return;

		const j = (jurisdiction || "").toUpperCase();
		if (!jurisdiction) {
			// O4 (2026-09-12): "Empezar ahora" del step "Crear tu primera carpeta"
			// llega sin jurisdicción y antes no abría nada. Mismo camino que el botón
			// "Agregar carpeta" (respeta el límite del plan).
			handleAddFolder();
		} else if (j === "EJE") {
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
		} else if (j === "MANUAL") {
			// Primera causa (2026-10-23): "Prefiero cargarla a mano" y la salida sin usuario de
			// Buenos Aires abren directo los datos requeridos, sin pasar por "Método de ingreso".
			setAddFolderInitialStep(1);
			setAddFolderInitialFormValues({ entryMethod: "manual" });
			setAdd(true);
			setAddFolderMode("add");
			setFolder(null);
		} else if (j === "SALTA" || j === "CATAMARCA" || j === "MENDOZA") {
			// O8 (2026-09-12): portales IOL, mismo asistente con el poder judicial preseleccionado
			setAddFolderInitialStep(2);
			setAddFolderInitialFormValues({
				entryMethod: "automatic",
				judicialPower: j.toLowerCase(),
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
	}, [searchParams, setSearchParams, handleOpenCabaFolder, handleAddFolder]);

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

	// Equipos: responsables de una carpeta desde la celda del listado
	const [singleAssign, setSingleAssign] = useState<{ open: boolean; folderId: string; folderName?: string; responsables: string[] }>({
		open: false,
		folderId: "",
		responsables: [],
	});

	// Equipos: asignación masiva de responsables
	const [bulkAssign, setBulkAssign] = useState<{ open: boolean; folderIds: string[]; clearSelection?: () => void }>({
		open: false,
		folderIds: [],
	});
	// Seguimiento de expedientes importantes (6/11/2026): estrella por fila y acción masiva.
	const handleToggleSeguimiento = useCallback(
		async (folder: any) => {
			const activo = !folder?.seguimiento?.activo;
			const r = await dispatch(updateFolderSeguimiento(folder._id, activo, undefined, getRequestHeaders()));
			setSnackbarMessage(
				r.success
					? activo
						? "Carpeta marcada para seguimiento"
						: "Carpeta quitada del seguimiento"
					: r.message || "No se pudo cambiar el seguimiento",
			);
			setSnackbarSeverity(r.success ? "success" : "error");
			setSnackbarOpen(true);
		},
		[getRequestHeaders],
	);
	const handleSeguimientoSelected = useCallback(
		async (selectedRows: Row<any>[], clearSelection: () => void, activo: boolean) => {
			if (selectedRows.length === 0) return;
			const r = await dispatch(
				updateFoldersSeguimientoBulk(
					selectedRows.map((row) => row.original._id),
					activo,
					getRequestHeaders(),
				),
			);
			setSnackbarMessage(
				r.success
					? `${activo ? "Marcadas para seguimiento" : "Quitadas del seguimiento"}: ${r.modified} carpeta${r.modified === 1 ? "" : "s"}`
					: r.message || "No se pudo cambiar el seguimiento",
			);
			setSnackbarSeverity(r.success ? "success" : "error");
			setSnackbarOpen(true);
			if (r.success) clearSelection();
		},
		[getRequestHeaders],
	);

	const handleAssignSelected = useCallback((selectedRows: Row<any>[], clearSelection: () => void) => {
		if (selectedRows.length === 0) return;
		setBulkAssign({ open: true, folderIds: selectedRows.map((row) => row.original._id), clearSelection });
	}, []);

	// Equipos: asistente «Repartir carpetas» (fase 3, 6/11/2026). Sin selección reparte el
	// alcance que se elija en el asistente; con selección, solo esas carpetas.
	const [distribute, setDistribute] = useState<{ open: boolean; folderIds: string[]; clearSelection?: () => void }>({
		open: false,
		folderIds: [],
	});
	const handleDistribute = useCallback((selectedRows: Row<any>[], clearSelection: () => void) => {
		setDistribute({ open: true, folderIds: selectedRows.map((row) => row.original._id), clearSelection });
	}, []);

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
				// Borradas desde el modal de archivadas (6/11/2026): recargar esa lista.
				if (archivedModalOpen) {
					if (isTeamMode && activeTeam?._id) {
						dispatch(getArchivedFoldersByGroupId(activeTeam._id, archivedPage, archivedPageSize, archivedSearch, archivedExtra));
					} else {
						dispatch(getArchivedFoldersByUserId(user._id, archivedPage, archivedPageSize, archivedSearch, archivedExtra));
					}
				}
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
	}, [
		user?._id,
		foldersToDelete,
		getRequestHeaders,
		archivedModalOpen,
		isTeamMode,
		activeTeam?._id,
		archivedPage,
		archivedPageSize,
		archivedSearch,
		archivedExtra,
	]);

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
				await dispatch(getArchivedFoldersByGroupId(activeTeam._id, archivedPage, archivedPageSize, undefined, archivedExtra));
			} else {
				await dispatch(getArchivedFoldersByUserId(user._id, archivedPage, archivedPageSize, undefined, archivedExtra));
			}
			setArchivedModalOpen(true);
		} catch (error) {
			setSnackbarMessage("Error al obtener causas archivadas");
			setSnackbarSeverity("error");
			setSnackbarOpen(true);
		} finally {
			loadingRef.current = false;
		}
	}, [user?._id, archivedPage, archivedPageSize, isTeamMode, activeTeam?._id, archivedExtra]);

	const handleCloseArchivedModal = useCallback(() => {
		setArchivedModalOpen(false);
		setArchivedPage(1); // Resetear a página 1 al cerrar
		setArchivedSearch(""); // Resetear búsqueda al cerrar
		setArchivedResponsable("");
		setArchivedJuzgado("");
	}, []);

	const handleArchivedPageChange = useCallback(
		async (page: number) => {
			if (!user?._id || loadingRef.current) return;

			try {
				loadingRef.current = true;
				setArchivedPage(page);
				// Usar la función correcta según el modo equipo
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getArchivedFoldersByGroupId(activeTeam._id, page, archivedPageSize, archivedSearch, archivedExtra));
				} else {
					await dispatch(getArchivedFoldersByUserId(user._id, page, archivedPageSize, archivedSearch, archivedExtra));
				}
			} catch (error) {
				setSnackbarMessage("Error al cambiar de página");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			} finally {
				loadingRef.current = false;
			}
		},
		[user?._id, archivedPageSize, archivedSearch, isTeamMode, activeTeam?._id, archivedExtra],
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
					await dispatch(getArchivedFoldersByGroupId(activeTeam._id, 1, pageSize, archivedSearch, archivedExtra));
				} else {
					await dispatch(getArchivedFoldersByUserId(user._id, 1, pageSize, archivedSearch, archivedExtra));
				}
			} catch (error) {
				setSnackbarMessage("Error al cambiar tamaño de página");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			} finally {
				loadingRef.current = false;
			}
		},
		[user?._id, archivedSearch, isTeamMode, activeTeam?._id, archivedExtra],
	);

	const handleArchivedSearchChange = useCallback(
		async (term: string) => {
			if (!user?._id) return;

			// Sin loadingRef: el debounce del modal ya espacia las llamadas y un
			// guard acá descartaría términos de búsqueda legítimos.
			setArchivedSearch(term);
			setArchivedPage(1);
			try {
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getArchivedFoldersByGroupId(activeTeam._id, 1, archivedPageSize, term, archivedExtra));
				} else {
					await dispatch(getArchivedFoldersByUserId(user._id, 1, archivedPageSize, term, archivedExtra));
				}
			} catch (error) {
				setSnackbarMessage("Error al buscar causas archivadas");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			}
		},
		[user?._id, archivedPageSize, isTeamMode, activeTeam?._id, archivedExtra],
	);

	// Filtro por responsable del modal de archivadas (solo en modo equipo): vuelve a página 1.
	const handleArchivedResponsableChange = useCallback(
		async (value: string) => {
			if (!activeTeam?._id) return;
			setArchivedResponsable(value);
			setArchivedPage(1);
			try {
				await dispatch(
					getArchivedFoldersByGroupId(activeTeam._id, 1, archivedPageSize, archivedSearch, { ...archivedExtra, responsable: value }),
				);
			} catch (error) {
				setSnackbarMessage("Error al filtrar causas archivadas");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			}
		},
		[activeTeam?._id, archivedPageSize, archivedSearch, archivedExtra],
	);

	// Filtro por juzgado del modal de archivadas (también sin equipo): vuelve a página 1.
	const handleArchivedJuzgadoChange = useCallback(
		async (value: string) => {
			if (!user?._id) return;
			setArchivedJuzgado(value);
			setArchivedPage(1);
			const extra = { ...archivedExtra, juzgado: value };
			try {
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getArchivedFoldersByGroupId(activeTeam._id, 1, archivedPageSize, archivedSearch, extra));
				} else {
					await dispatch(getArchivedFoldersByUserId(user._id, 1, archivedPageSize, archivedSearch, extra));
				}
			} catch (error) {
				setSnackbarMessage("Error al filtrar causas archivadas");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			}
		},
		[user?._id, isTeamMode, activeTeam?._id, archivedPageSize, archivedSearch, archivedExtra],
	);

	const handleOpenGuide = useCallback(() => {
		setGuideOpen(true);
	}, []);

	// Handler para el filtro de tipo de carpeta
	const handleFolderTypeFilterChange = useCallback(
		(event: SelectChangeEvent<"all" | "manual" | "pjn" | "eje" | "mev" | "pjsalta" | "pjcatamarca" | "pjmendoza" | "scba">) => {
			setFolderTypeFilter(
				event.target.value as "all" | "manual" | "pjn" | "eje" | "mev" | "pjsalta" | "pjcatamarca" | "pjmendoza" | "scba",
			);
		},
		[],
	);

	const handleStatusFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setStatusFilter(event.target.value as "all" | "Nueva" | "En Proceso" | "Pendiente" | "Cerrada");
	}, []);

	const handleParteFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setParteFilter(event.target.value);
	}, []);

	const handleMovimientosFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setMovimientosFilter(event.target.value as MovimientosFiltro);
	}, []);
	const handlePeriodoChange = useCallback((p: PeriodoMovimientos) => setPeriodo(p), []);

	const handleJurisdiccionFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setJurisdiccionFilter(event.target.value);
		setDepartamentoFilter("all");
	}, []);

	const handleDepartamentoFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setDepartamentoFilter(event.target.value);
	}, []);

	const handleFueroFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setFueroFilter(event.target.value);
	}, []);
	const handleJuzgadoFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setJuzgadoFilter(event.target.value);
	}, []);
	const handleUbicacionFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setUbicacionFilter(event.target.value);
	}, []);
	const handleSituacionFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setSituacionFilter(event.target.value);
	}, []);
	const handleSeguimientoFilterChange = useCallback((event: SelectChangeEvent<string>) => {
		setSeguimientoFilter(event.target.value);
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
				} else if (result.limitReached) {
					// Tope del plan: aviso con acción "Ver planes" (notistack) en lugar del snackbar local
					showUnarchiveLimitSnackbar({ active: result.active, planLimit: result.planLimit, navigate });
					return;
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
				// ⛓ Expedientes relacionados (acumulación / acumuladas / incidentes) a la derecha de la
				// celda existente, sin tocar sus ramas de estado PJN.
				Cell: ({ row }: { row: any }) => {
					const base = (() => {
						const folder = row.original;
						const value = folder.folderName;

						// Solo mostrar indicadores visuales si es una causa sincronizada automáticamente
						const showStatusIndicators =
							folder.pjn === true ||
							folder.mev === true ||
							folder.eje === true ||
							folder.scba === true ||
							folder.pjsalta === true ||
							folder.pjcatamarca === true ||
							folder.pjmendoza === true;

						// Carpeta desvinculada (conserva `previousSyncSource`, ningún flag de
						// fuente activo). Va ANTES del early-return de abajo: la desvinculación
						// apaga todos los flags, así que si se evaluara después nunca se
						// alcanzaría y la fila sería indistinguible de una carpeta manual (el
						// detalle y la fila expandida sí la muestran). Mismo patrón que la cred
						// SCBA/PJN rechazada: carátula + ícono ámbar con tooltip. La acción va
						// a donde se resuelve: la carpeta (MEV/EJE/IOL, se re-vincula por
						// número) o Integraciones (PJN/SCBA).
						const isUnlinked = !!folder.previousSyncSource && !showStatusIndicators;
						if (isUnlinked) {
							const src = folder.previousSyncSource as string;
							const SOURCE_NAMES: Record<string, string> = {
								pjn: "PJN",
								scba: "SCBA",
								mev: "MEV",
								eje: "EJE",
								pjsalta: "PJ Salta",
								pjcatamarca: "PJ Catamarca",
								pjmendoza: "PJ Mendoza",
							};
							const sourceName = SOURCE_NAMES[src] || src.toUpperCase();
							const relinkable = ["eje", "mev", "pjsalta", "pjcatamarca", "pjmendoza"].includes(src);
							// SCBA: copy y destino compartidos (S15). PJN/otros: la cuenta se
							// administra en Integraciones (el tab ya no se llama "Cuentas Judiciales").
							const tooltip = relinkable
								? `Desvinculada de ${sourceName} — conserva todos sus datos pero ya no se sincroniza. Hacé clic para volver a vincularla desde la carpeta.`
								: src === "scba"
								? SCBA_BINDING_COPY.unlinked
								: `Sincronización pausada (era ${sourceName}) — conserva el histórico pero no recibe actualizaciones. Para reanudar, vinculá tu cuenta desde Integraciones.`;
							const unlinkedTarget = relinkable
								? `/apps/folders/details/${folder._id}`
								: src === "scba"
								? SCBA_PROFILE_PATH
								: "/apps/profiles/account/pjn";
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
									<Tooltip title={tooltip}>
										<IconButton
											size="small"
											onClick={(e) => {
												e.stopPropagation();
												navigate(unlinkedTarget);
											}}
											sx={{ padding: 0.5, "&:hover": { backgroundColor: "warning.lighter" } }}
										>
											<Warning2 size={16} variant="Bold" color={STALE_AMBER} />
										</IconButton>
									</Tooltip>
								</Stack>
							);
						}

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
						// IOL-8: para PJ Salta/Catamarca/Mendoza no hay "Mis Causas" — el updater
						// marca listRemoved cuando el portal repite "no encontrado".
						const isIolListRemoved =
							(folder.pjsalta === true || folder.pjcatamarca === true || folder.pjmendoza === true) &&
							folder.listRemoved === true &&
							["pjsalta", "pjcatamarca", "pjmendoza"].includes(folder.listRemovedSource || "");
						const isListRemoved =
							isIolListRemoved ||
							(isFromMisCausas && (folder.listRemoved === true || (folder.pjn === true && folder.pjnNotFound === true)));
						// Privacidad PJN (F2, 2026-08-25). Tres situaciones que antes la lista no
						// distinguía (solo el detalle):
						//  - revocada: carpeta de Mis Causas (pjn-login) cuya credencial ya no cubre
						//    la causa reservada → el detalle bloquea (403 CAUSA_RESERVED).
						//  - reservada con acceso: causa privada pero cubierta por la credencial
						//    del usuario → ve todo; solo se le avisa que es reservada.
						//  - reservada sin acceso: causa individual (no pjn-login) marcada privada
						//    por el privacy-checker o sin cobertura → consulta pública restringida.
						// Predicados y copy compartidos con la fila expandida y el detalle (F10).
						// Misma señal de credencial que la card mobile y el ícono de la celda (2026-09-28):
						// antes la fila se calculaba sin `credError` y podía mostrar otro estado.
						const pjnState = getPjnBindingState(folder, { credError: pjnCredError.requiresAction });
						const isPjnRevoked = pjnState === "revoked";
						const isPjnReservedCovered = pjnState === "reserved_covered";
						const isPjnPrivateRestricted = pjnState === "reserved";
						// El estado (tooltip + acción) lo muestra el ícono de la fuente (FolderSourceBadge) a la
						// izquierda; acá solo la carátula. Firma conservada para no tocar las ramas.
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const renderPrivacyRow = (_tooltip: string, _icon: React.ReactNode, _hoverBg: string, _onIconClick?: () => void) => (
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
						// Credencial PJN rechazada: gana sobre revoked/reserved/list_removed/pending (no
						// sobre pending_selection/failed — ver getPjnBindingState). El ícono lleva al perfil.
						if (pjnState === "cred_error") {
							return renderPrivacyRow(
								pjnCredErrorCopy(folder),
								<Warning2 size={16} variant="Bold" color={STALE_AMBER} />,
								"warning.lighter",
								() => navigate(PJN_PROFILE_PATH),
							);
						}
						if (isPjnRevoked) {
							return renderPrivacyRow(PJN_BINDING_COPY.revoked, <Lock1 size={16} variant="Bold" color={STALE_AMBER} />, "warning.lighter");
						}
						if (isPjnReservedCovered) {
							return renderPrivacyRow(
								PJN_BINDING_COPY.reserved_covered,
								<Lock1 size={16} variant="Bold" color={LIVE_GREEN} />,
								"success.lighter",
							);
						}
						if (isPjnPrivateRestricted) {
							return renderPrivacyRow(PJN_BINDING_COPY.reserved, <Warning2 size={16} variant="Bold" color="#EF4444" />, "error.lighter");
						}
						// T20: `pending_selection` se evalúa ANTES que `listRemoved`, igual
						// que en la fila expandida (FolderView.tsx). Antes el orden era el
						// inverso acá, así que la misma carpeta mostraba un estado en la
						// lista y otro al expandirla. Gana el estado accionable: si el
						// usuario puede elegir expediente, eso es lo que tiene que ver;
						// un `listRemoved` sobre un pivote es información vieja.
						if (isListRemoved && folder.causaAssociationStatus !== "pending_selection") {
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
								</Stack>
							);
						}

						// Si hay selección pendiente de múltiples causas, mostrar chip de seleccionar
						if (folder.causaAssociationStatus === "pending_selection") {
							// La celda mostraba solo el chip: en la tabla de atención se perdía qué
							// se había buscado y cuántos candidatos había, y había que entrar al
							// detalle para enterarse. 2026-08-26.
							const candidatos = Array.isArray(folder.pendingCausaIds) ? folder.pendingCausaIds.length : 0;
							const buscado = folder.searchTerm || folder.judFolder?.numberJudFolder || folder.judFolder?.cuij;
							return (
								<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" spacing={0.5}>
									<Stack spacing={0.25} sx={{ minWidth: 0 }}>
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
										{(buscado || candidatos > 0) && (
											<Typography
												noWrap
												sx={{ fontSize: "0.66rem", color: "text.secondary", lineHeight: 1.3 }}
												title={buscado ? `Buscaste ${buscado}` : undefined}
											>
												{buscado ? `Buscaste ${buscado}` : ""}
												{buscado && candidatos > 0 ? " · " : ""}
												{candidatos > 0
													? folder.tooManyResults
														? `${candidatos} de ${folder.searchTotalResults ?? "muchos"} coincidencias`
														: `${candidatos} coincidencia${candidatos === 1 ? "" : "s"}`
													: ""}
											</Typography>
										)}
									</Stack>
								</Stack>
							);
						}

						// Si la asociación falló, mostrar chip de error. verified+inválida es el mismo
						// estado (F7/F10: antes mostraba "Causa inválida" con otro copy más abajo).
						// Excepción MEV: si la credencial falló el login (invalid/expired/disabled) el
						// worker deja la carpeta en failed, pero la causa de fondo es la credencial → el
						// chip ámbar de credencial (más abajo) gana sobre "Asociación fallida".
						if (
							(folder.causaAssociationStatus === "failed" || (folder.causaVerified === true && folder.causaIsValid === false)) &&
							!isMevCredLoginFailure(folder)
						) {
							return (
								<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" spacing={0.5}>
									<Stack spacing={0.25} sx={{ minWidth: 0 }}>
										{/* El motivo real (causaAssociationError) va en el tooltip del chip: el ícono rojo
										    de la derecha era redundante con el de la fuente (2026-09-30). */}
										<Tooltip
											title={isMevCredMissing(folder) ? `${pjnFailedCopy(folder)} ${MEV_CRED_MISSING_ON_FAILED}` : pjnFailedCopy(folder)}
										>
											<Box
												sx={{
													alignSelf: "flex-start",
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
													Asociación fallida
												</Typography>
											</Box>
										</Tooltip>
										{/* Sin esto había que entrar al detalle para saber qué se había buscado. */}
										{(folder.searchTerm || folder.judFolder?.numberJudFolder) && (
											<Typography noWrap sx={{ fontSize: "0.66rem", color: "text.secondary", lineHeight: 1.3 }}>
												Buscaste {folder.searchTerm || folder.judFolder?.numberJudFolder}
											</Typography>
										)}
										{/* MV17: causa fallida + sin credencial MEV → mostrar la relación (sin credencial no se re-verifica). */}
										{isMevCredMissing(folder) && (
											<Typography
												noWrap
												onClick={(e) => {
													e.stopPropagation();
													navigate(MEV_PROFILE_PATH);
												}}
												sx={{ fontSize: "0.66rem", color: STALE_AMBER, lineHeight: 1.3, cursor: "pointer", fontWeight: 600 }}
											>
												Sin credencial MEV — cargala para volver a verificar
											</Typography>
										)}
									</Stack>
								</Stack>
							);
						}

						// MEV: problema con la credencial del usuario → warning (en vez del tilde/pendiente).
						// La causa no se scrapea hasta que el usuario corrija/cargue su credencial.
						const credIssue = mevCredIssue(folder);
						if (credIssue) {
							const credLabel = MEV_CRED_LABEL[credIssue];
							// M11: el chip no reemplaza la carátula — el usuario tiene que saber qué carpeta es
							// sin expandir. Si el worker dejó el nombre placeholder ("Causa inválida o no
							// accesible") mostramos lo que se buscó, como en la rama de asociación fallida.
							const caratula = value && value !== INVALID_FOLDER_NAME ? value : null;
							const searched = folder.searchTerm || folder.judFolder?.numberJudFolder;
							return (
								<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" spacing={0.5}>
									<Stack spacing={0.375} sx={{ minWidth: 0 }}>
										{caratula ? (
											<Tooltip title={caratula}>
												<span
													style={{
														display: "-webkit-box",
														WebkitLineClamp: 2,
														WebkitBoxOrient: "vertical",
														overflow: "hidden",
														textOverflow: "ellipsis",
													}}
												>
													{formatFolderName(caratula, 50)}
												</span>
											</Tooltip>
										) : searched ? (
											<Typography noWrap sx={{ fontSize: "0.66rem", color: "text.secondary", lineHeight: 1.3 }}>
												Buscaste {searched}
											</Typography>
										) : null}
										<Box
											onClick={(e) => {
												e.stopPropagation();
												navigate(MEV_PROFILE_PATH);
											}}
											sx={{
												alignSelf: "flex-start",
												display: "inline-flex",
												alignItems: "center",
												gap: 0.625,
												px: 0.875,
												py: 0.25,
												borderRadius: 0.75,
												bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
												border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
												cursor: "pointer",
												"&:hover": { bgcolor: alpha(STALE_AMBER, isDark ? 0.22 : 0.14) },
											}}
										>
											<Warning2 size={12} variant="Bulk" color={STALE_AMBER} />
											<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "0.01em", lineHeight: 1 }}>
												{credLabel}
											</Typography>
										</Box>
									</Stack>
								</Stack>
							);
						}

						// Si causaVerified es false o no está verificado (pendiente), mostrar chip de pendiente con botón de actualización
						if (
							folder.causaVerified === false ||
							(folder.causaVerified !== true &&
								(folder.pjn || folder.mev || folder.eje || folder.scba || folder.pjsalta || folder.pjcatamarca || folder.pjmendoza))
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
					})();
					const rel = row.original.relaciones;
					// Ícono del portal con el estado superpuesto, igual que la card mobile (2026-09-29).
					return (
						<Stack direction="row" alignItems="center" spacing={1} width="100%" sx={{ minWidth: 160 }}>
							<FolderSourceBadge
								folder={row.original}
								pjnCredErrorActive={!!pjnCredError.requiresAction}
								scbaCredErrorActive={!!scbaCredError.hasError}
							/>
							<Box sx={{ flex: 1, minWidth: 0 }}>{base}</Box>
							{rel && (
								<RelacionesIcon relaciones={rel} onClick={() => navigate(`/apps/folders/details/${row.original._id}?tab=relaciones`)} />
							)}
						</Stack>
					);
				},
			},
			{
				// Identificador del expediente: CUIJ (compartido por EJE/Salta/Catamarca/
				// Mendoza — el número por organismo no siempre es unívoco) y, si difiere,
				// el número propio del portal ("EXP 905878/25", "61009/2007").
				Header: "Expediente",
				accessor: "judFolder.numberJudFolder",
				minWidth: 120,
				Cell: ({ row }: { row: any }) => {
					const jf = row.original?.judFolder || {};
					const cuij: string | undefined = jf.cuij;
					const nro: string | undefined = jf.numberJudFolder;
					// Principal: CUIJ en IOL/EJE, número de expediente en PJN/MEV/SCBA/manual.
					const principal = cuij || nro;
					if (!principal) return null;
					const secundario = cuij && nro && nro !== cuij ? nro : null;
					return (
						<Stack spacing={0}>
							<Typography variant="body2" sx={{ fontFamily: "monospace", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
								{principal}
							</Typography>
							{secundario && (
								<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
									{secundario}
								</Typography>
							)}
						</Stack>
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
				Cell: ({ value, row }: { value: any; row: any }) => {
					if (!value) return <span>-</span>;
					const sinVer = <SinVerCount count={row.original.unseenCount} ocultos={row.original.unseenOcultos} />;

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
										{sinVer}
									</Stack>
								);
							}

							return (
								<Stack direction="row" alignItems="center" flexWrap="wrap">
									<span style={row.original.unseenCount > 0 ? { fontWeight: 600 } : undefined}>{formattedDate}</span>
									{sinVer}
								</Stack>
							);
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
				// Provincia en la línea principal y, debajo, el departamento judicial /
				// circunscripción / fuero nacional (folderJuris.item canónico sin el
				// prefijo de provincia). Sin item, la celda queda como antes.
				Cell: ({ row }: { row: any }) => {
					const juris = row.original?.folderJuris;
					const label: string | undefined = typeof juris === "string" ? juris : juris?.label;
					const dep = typeof juris === "string" ? "" : departamentoDe(juris?.item, label);
					if (!label) return null;
					// Una línea para la provincia y una sola (con puntos suspensivos y tooltip) para el
					// departamento: antes ocupaba tres líneas y empujaba la tabla (5/11/2026).
					return (
						<Stack spacing={0} sx={{ maxWidth: 160 }}>
							<Typography variant="body2" noWrap>
								{label}
							</Typography>
							{dep && (
								<Tooltip title={dep} placement="top-start" enterDelay={400}>
									<Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1.3, display: "block" }}>
										{dep}
									</Typography>
								</Tooltip>
							)}
						</Stack>
					);
				},
			},
			{
				Header: "Fuero",
				accessor: "folderFuero",
			},
			{
				// Juzgado de origen (y, debajo, la ubicación actual si está en Cámara o Corte).
				// Reparto por juzgado en equipos (5/11/2026).
				Header: "Radicación",
				accessor: "judFolder.courtNumber" as any,
				sortType: (a: any, b: any) => {
					const na = parseInt(a.original?.judFolder?.courtNumber, 10);
					const nb = parseInt(b.original?.judFolder?.courtNumber, 10);
					if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
					if (Number.isNaN(na)) return 1;
					if (Number.isNaN(nb)) return -1;
					return na - nb;
				},
				Cell: ({ row }: { row: any }) => {
					const origen = radicacionOrigen(row.original);
					const actual = ubicacionDetalle(row.original);
					if (!origen && !actual) return null;
					// Una sola línea por dato, con puntos suspensivos y tooltip: en MEV/SCBA el «número» de
					// juzgado es el nombre completo y, sin recorte, el texto se metía en Situación (10/11/2026).
					const linea1 = origen || "Sin juzgado";
					return (
						<Stack spacing={0} sx={{ maxWidth: 150 }}>
							<Tooltip title={linea1} placement="top-start" enterDelay={400}>
								<Typography variant="body2" noWrap sx={{ display: "block" }}>
									{linea1}
								</Typography>
							</Tooltip>
							{actual && (
								<Tooltip title={actual} placement="top-start" enterDelay={400}>
									<Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1.3, display: "block" }}>
										{actual}
									</Typography>
								</Tooltip>
							)}
						</Stack>
					);
				},
			},
			{
				// Situación procesal del expediente PJN (EN LETRA, EN DESPACHO, GIRO…), desde la causa.
				// Control del estudio (6/11/2026).
				Header: "Situación",
				accessor: "situacion" as any,
				Cell: ({ value }: { value?: string }) => {
					if (!value) return null;
					const label = situacionLabel(value);
					return (
						<Tooltip title={label} placement="top-start" enterDelay={400}>
							<Typography variant="body2" noWrap sx={{ display: "block", maxWidth: 140 }}>
								{label}
							</Typography>
						</Tooltip>
					);
				},
			},
			{
				Header: "Estado",
				accessor: "status",
				Cell: ({ value }: { value: string }) => (value ? <StatusPill status={value} /> : null),
			},
			...(isTeamMode
				? [
						{
							Header: "Responsable",
							accessor: "responsables",
							// Ordenar por responsable (pedido de Silvia, 6/11/2026): por los nombres resueltos; sin responsable al final.
							sortType: (a: Row<any>, b: Row<any>) => {
								const na = resolveResponsablesForCsv(a.original?.responsables);
								const nb = resolveResponsablesForCsv(b.original?.responsables);
								if (!na && !nb) return 0;
								if (!na) return 1;
								if (!nb) return -1;
								return na.localeCompare(nb, "es");
							},
							Cell: ({ value, row }: { value?: string[]; row: Row<any> }) =>
								canEditResponsables ? (
									// Clic en el responsable: asignar, cambiar o quitar (owner, admin, editor).
									<ButtonBase
										onClick={(e) => {
											e.stopPropagation();
											setSingleAssign({
												open: true,
												folderId: row.original._id,
												folderName: row.original.folderName,
												responsables: value || [],
											});
										}}
										aria-label="Cambiar responsable"
										data-testid="folder-responsable-edit"
										sx={{
											borderRadius: 1,
											px: 0.5,
											py: 0.25,
											justifyContent: "flex-start",
											"&:hover": { bgcolor: "action.hover" },
										}}
									>
										<TaskAssignees ids={value} max={3} emptyLabel="Asignar" />
									</ButtonBase>
								) : (
									<Box sx={{ display: "flex", justifyContent: "flex-start" }}>
										<TaskAssignees ids={value} max={3} emptyLabel="Sin responsable" />
									</Box>
								),
						},
				  ]
				: []),
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
				Cell: ({ row, compact }: any) => {
					const folder = row.original;
					const isAutoFolder =
						folder.pjn || folder.mev || folder.eje || folder.scba || folder.pjsalta || folder.pjcatamarca || folder.pjmendoza;

					// Folders con error: asociación fallida o causa inválida.
					// MEV con login fallido no cuenta como error de causa: el detalle sigue accesible
					// con los datos ya sincronizados y el aviso es sobre la credencial.
					const isErrorFolder =
						isAutoFolder &&
						!isMevCredLoginFailure(folder) &&
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
							{/* Seguimiento (6/11/2026): estrella ámbar cuando está marcada; cualquier jurisdicción */}
							{canUpdate && (
								<Tooltip title={folder.seguimiento?.activo ? "Quitar de seguimiento" : "Marcar para seguimiento"}>
									<span>
										<IconButton
											size="small"
											sx={{ ...actionIconSx, color: folder.seguimiento?.activo ? STALE_AMBER : "text.secondary" }}
											onClick={(e) => handleRowAction(e, () => handleToggleSeguimiento(folder))}
											data-testid="folder-seguimiento-star"
										>
											<Star1 variant={folder.seguimiento?.activo ? "Bold" : "Linear"} size={18} />
										</IconButton>
									</span>
								</Tooltip>
							)}
							{/* "Abrir" estándar para causas verificadas. En la card mobile (compact) no va:
							    tocar la card ya abre la carpeta y el área táctil de 44 px no deja lugar. */}
							{!compact && (
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
							)}
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
			canEditResponsables,
			verifyingFolderIds,
			handleVerifyFolder,
			// Cred-error hooks: la columna Carátula usa pjnCredError.requiresAction /
			// scbaCredError.hasError para mostrar el ícono ámbar Warning2. Sin estas
			// deps, el useMemo retorna columnas con closure viejo y el ícono solo se
			// actualiza al desmontar/montar (navegar a otra ruta y volver).
			scbaCredError.hasError,
			pjnCredError.requiresAction,
			isTeamMode,
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
								onSaltaClick={canCreate ? handleOpenSaltaFolder : undefined}
								onCatamarcaClick={canCreate ? handleOpenCatamarcaFolder : undefined}
								onMendozaClick={canCreate ? handleOpenMendozaFolder : undefined}
							/>
						</Box>
					</Stack>
				</Box>

				{/* Mobile: sin borde ni fondo propio — las cards ya enmarcan cada carpeta (evita el doble marco). */}
				<MainCard
					content={false}
					sx={{
						// Solo el ancho: el shorthand "1px solid" en la media query reseteaba el color del
						// borde al del texto (recuadro casi negro en desktop).
						borderWidth: { xs: 0, sm: "1px" },
						bgcolor: { xs: "transparent", sm: "background.paper" },
					}}
				>
					<DowngradeGracePeriodAlert />

					{/* Causas archivadas por el límite del plan — solo en el listado personal */}
					{!isTeamMode && user?._id && <ArchivedByPlanBanner onChooseVisible={handleOpenArchivedModal} refreshKey={folders?.length ?? 0} />}

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

					{/* Equipos: vista por responsable */}
					{isTeamMode && (
						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={1}
							alignItems={{ xs: "stretch", sm: "center" }}
							sx={{ px: { xs: 0, sm: 3 }, pt: 2, pb: { xs: 1, sm: 0 } }}
						>
							<ToggleButtonGroup
								exclusive
								size="small"
								value={isResponsableVistaFija(responsableVista) ? responsableVista : null}
								onChange={(_e, next: string | null) => {
									if (next) setResponsableVista(next);
								}}
								aria-label="Filtrar carpetas por responsable"
								sx={{
									width: { xs: "100%", sm: "auto" },
									"& .MuiToggleButton-root": {
										flex: { xs: 1, sm: "initial" },
										textTransform: "none",
										fontSize: "0.78rem",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										px: 1.5,
										py: 0.625,
										color: "text.secondary",
										borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
										"&.Mui-selected": {
											color: BRAND_BLUE,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
											"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12) },
										},
									},
								}}
							>
								<ToggleButton value="mias">Mis carpetas</ToggleButton>
								<ToggleButton value="todas">Todas</ToggleButton>
								<ToggleButton value="sin">Sin responsable</ToggleButton>
							</ToggleButtonGroup>
							{/* «De…»: carpetas a cargo de un integrante, previsto o invitado concreto (6/11/2026) */}
							{responsableDeOptions.length > 0 && (
								<FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
									<Select
										value={isResponsableVistaFija(responsableVista) ? "" : responsableVista}
										onChange={(e) => {
											const next = String(e.target.value);
											setResponsableVista(next || "todas");
										}}
										displayEmpty
										renderValue={(v) => {
											const sel = responsableDeOptions.find((o) => o.id === v);
											return sel ? `De ${sel.name}` : "De…";
										}}
										inputProps={{ "aria-label": "Carpetas a cargo de un integrante" }}
										data-testid="folders-responsable-de"
										sx={{
											borderRadius: 1.25,
											fontSize: "0.78rem",
											fontWeight: 600,
											letterSpacing: "-0.005em",
											color: isResponsableVistaFija(responsableVista) ? "text.secondary" : BRAND_BLUE,
											bgcolor: isResponsableVistaFija(responsableVista) ? "transparent" : alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
											"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14) },
											"& .MuiSelect-select": { py: 0.75 },
										}}
									>
										<MenuItem value="">
											<em>Todas (sin filtrar por persona)</em>
										</MenuItem>
										{responsableDeOptions.map((o) => (
											<MenuItem key={o.id} value={o.id}>
												{o.name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}
						</Stack>
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
								handleAssignSelected={isTeamMode && canEditResponsables ? handleAssignSelected : undefined}
								handleDistribute={isTeamMode && canEditResponsables ? handleDistribute : undefined}
								handleSeguimientoSelected={canUpdate ? handleSeguimientoSelected : undefined}
								handleOpenGuide={handleOpenGuide}
								handleOpenArchivedModal={handleOpenArchivedModal}
								renderRowSubComponent={renderRowSubComponent}
								prefsKey={FOLDERS_LIST_PREFS_KEY}
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
								periodo={periodo}
								onPeriodoChange={handlePeriodoChange}
								jurisdiccionFilter={jurisdiccionFilter}
								onJurisdiccionFilterChange={handleJurisdiccionFilterChange}
								uniqueJurisdicciones={uniqueJurisdicciones}
								fueroFilter={fueroFilter}
								onFueroFilterChange={handleFueroFilterChange}
								uniqueFueros={uniqueFueros}
								departamentoFilter={departamentoFilter}
								onDepartamentoFilterChange={handleDepartamentoFilterChange}
								uniqueDepartamentos={uniqueDepartamentos}
								juzgadoFilter={juzgadoFilter}
								onJuzgadoFilterChange={handleJuzgadoFilterChange}
								uniqueJuzgados={uniqueJuzgados}
								ubicacionFilter={ubicacionFilter}
								onUbicacionFilterChange={handleUbicacionFilterChange}
								uniqueUbicaciones={uniqueUbicaciones}
								situacionFilter={situacionFilter}
								onSituacionFilterChange={handleSituacionFilterChange}
								uniqueSituaciones={uniqueSituaciones}
								seguimientoFilter={seguimientoFilter}
								onSeguimientoFilterChange={handleSeguimientoFilterChange}
								resolveResponsables={isTeamMode ? resolveResponsablesForCsv : undefined}
								storedHiddenColumns={storedHiddenColumns}
								onHiddenColumnsChange={handleHiddenColumnsChange}
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
					<FolderActionsMenu
						anchorEl={anchorEl}
						open={Boolean(anchorEl && menuRowId)}
						onClose={handleMenuClose}
						folder={menuFolderData}
						detailsExpanded={expandedRowId === menuRowId}
						canCreate={canCreate}
						chatEnabled={chatAccess.allowed}
						onToggleDetails={() => {
							const rowId = menuRowId;
							handleMenuClose();
							if (rowId) handleToggleExpanded(rowId);
						}}
						onOpenFolder={() => {
							const id = menuFolderData?._id;
							handleMenuClose();
							if (id) navigate(`../details/${id}`);
						}}
						onDownloadExpediente={() => {
							if (menuFolderData?._id) {
								// El modal lo monta GlobalExpedienteExportListener (uno solo para toda la app).
								openExpedienteExport(menuFolderData._id, menuFolderData.folderName || "");
							}
							handleMenuClose();
						}}
						onChatExpediente={() => {
							const id = menuFolderData?._id;
							handleMenuClose();
							if (id) navigate(`../details/${id}?tab=chat`);
						}}
						onCreate={(kind: FolderCreateKind) => {
							const id = menuFolderData?._id;
							const name = menuFolderData?.folderName;
							if (!id) return;
							// Cada handler cierra el menú; el cálculo es el único que no necesita el nombre.
							if (kind === "calculo") return handleOpenCalculatorModal(id);
							if (!name) return;
							if (kind === "documento") handleOpenDocChooser(id, name);
							else if (kind === "tarea") handleOpenTaskModal(id, name);
							else if (kind === "nota") handleOpenNoteModal(id, name);
							else if (kind === "contacto") handleOpenContactModal(id, name);
							else if (kind === "movimiento") handleOpenMovementModal(id, name);
							else if (kind === "evento") handleOpenEventModal(id, name);
							else if (kind === "oferta") handleOpenCalcDataModal(id, name);
						}}
					/>

					<AlertFolderDelete title={folderDeleteId} open={open} handleClose={handleClose} id={folderId} onDelete={async () => {}} />
					{add && (
						<Dialog
							maxWidth="sm"
							TransitionComponent={PopupTransition}
							keepMounted
							fullWidth
							// En el teléfono, pantalla completa: con 90vh y márgenes la botonera quedaba
							// recortada en ≤ 360 px y el teclado tapaba "Siguiente" (13/10/2026).
							fullScreen={isPhone}
							open={add}
							onClose={handleCloseDialog}
							sx={{
								"& .MuiDialog-paper": {
									p: 0,
									height: { xs: "100dvh", sm: "85vh", md: "80vh" },
									maxHeight: { xs: "100dvh", sm: "85vh", md: "80vh" },
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
						fetching={isArchivedLoader}
						itemType="folders"
						pagination={archivedPagination}
						onPageChange={handleArchivedPageChange}
						onPageSizeChange={handleArchivedPageSizeChange}
						onSearchChange={handleArchivedSearchChange}
						showResponsables={isTeamMode}
						responsableFilter={archivedResponsable}
						responsableOptions={archivedResponsableOptions}
						onResponsableFilterChange={isTeamMode ? handleArchivedResponsableChange : undefined}
						juzgadoFilter={archivedJuzgado}
						juzgadoOptions={archivedJuzgadoOptions}
						onJuzgadoFilterChange={handleArchivedJuzgadoChange}
						onDeleteSelected={
							canDelete
								? (ids) => {
										setFoldersToDelete(ids.map((_id) => ({ original: { _id } })) as unknown as Row<any>[]);
										setDeleteDialogOpen(true);
								  }
								: undefined
						}
						onAssignResponsables={
							isTeamMode && canEditResponsables
								? (ids) =>
										setBulkAssign({
											open: true,
											folderIds: ids,
											// Al terminar, recargar la página actual de archivadas para ver el responsable nuevo
											clearSelection: () => {
												if (activeTeam?._id)
													dispatch(
														getArchivedFoldersByGroupId(activeTeam._id, archivedPage, archivedPageSize, archivedSearch, archivedExtra),
													);
											},
										})
								: undefined
						}
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

					{/* Portal al body: sin esto el Snackbar queda atrapado en el stacking
					    context de la página y se pinta por debajo de los Dialogs (z-index
					    1400 vs 1300 solo aplica si comparten stacking context). */}
					<Portal>
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
					</Portal>

					{/* Equipos: responsables de una carpeta (clic en la celda) */}
					{isTeamMode && (
						<BulkResponsablesDialog
							open={singleAssign.open}
							folderIds={singleAssign.folderId ? [singleAssign.folderId] : []}
							single={{ folderName: singleAssign.folderName, responsables: singleAssign.responsables }}
							onClose={() => setSingleAssign((prev) => ({ ...prev, open: false }))}
						/>
					)}

					{/* Equipos: asignación masiva de responsables */}
					{isTeamMode && (
						<BulkResponsablesDialog
							open={bulkAssign.open}
							folderIds={bulkAssign.folderIds}
							onClose={() => setBulkAssign((prev) => ({ ...prev, open: false }))}
							onDone={() => bulkAssign.clearSelection?.()}
						/>
					)}

					{/* Equipos: reparto por criterios */}
					{isTeamMode && (
						<DistributeFoldersDialog
							open={distribute.open}
							folderIds={distribute.folderIds}
							onClose={() => setDistribute((prev) => ({ ...prev, open: false }))}
							onApplied={() => {
								distribute.clearSelection?.();
								if (activeTeam?._id) dispatch(getFoldersByGroupId(activeTeam._id));
							}}
						/>
					)}

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
