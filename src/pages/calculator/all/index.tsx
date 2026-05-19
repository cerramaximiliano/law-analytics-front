import React, { useEffect, useState, useCallback, useMemo, Fragment, MouseEvent, useRef } from "react";

// material-ui
import {
	Card,
	Grid,
	Typography,
	Button,
	Box,
	CardContent,
	CardActions,
	Alert,
	AlertTitle,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	useMediaQuery,
	alpha,
	Chip,
	Divider,
	IconButton,
	Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import MainCard from "components/MainCard";
import { useNavigate } from "react-router-dom";
import {
	Calculator,
	Chart2,
	Coin,
	Warning2,
	Eye,
	Trash,
	Add,
	DocumentText,
	Archive,
	DocumentDownload,
	Refresh,
	More,
	InfoCircle,
} from "iconsax-react";
import { Checkbox, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ScrollX from "components/ScrollX";

import {
	useFilters,
	useExpanded,
	useGlobalFilter,
	useRowSelect,
	useSortBy,
	useTable,
	usePagination,
	Column,
	Row,
	Cell,
	HeaderGroup,
} from "react-table";
import { HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import { CSVLink } from "react-csv";

// redux
import { dispatch, useSelector } from "store";
import {
	getCalculatorsByUserId,
	getCalculatorsByGroupId,
	archiveCalculators,
	unarchiveCalculators,
	getArchivedCalculatorsByUserId,
	getArchivedCalculatorsByGroupId,
	deleteCalculator,
} from "store/reducers/calculator";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";

// types
import { CalculatorType } from "types/calculator";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";
import dayjs from "utils/dayjs-config";
// Importamos el componente selector de guías
import { GuideSelector } from "components/guides";
// Importamos componentes para gestión de archivado
import ArchivedCalculatorsModal from "sections/apps/calculator/ArchivedCalculatorsModal";
import AlertCalculatorDelete from "sections/apps/calculator/AlertCalculatorDelete";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import { ResourceUsageBar } from "sections/widget/chart/ResourceUsageWidget";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ==============================|| TIPO PILL ||============================== //
// Píldora de tipo de cálculo — replica el patrón StatusPill de folders.
// 3 tipos: Calculado (brand) / Ofertado (verde) / Reclamado (ámbar).

const TipoPill = ({ tipo }: { tipo: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const config = (() => {
		switch (tipo) {
			case "Calculado":
				return { dot: BRAND_BLUE, bgAlpha: isDark ? 0.14 : 0.08, borderAlpha: isDark ? 0.36 : 0.22 };
			case "Ofertado":
				return { dot: LIVE_GREEN, bgAlpha: isDark ? 0.14 : 0.08, borderAlpha: isDark ? 0.36 : 0.22 };
			case "Reclamado":
				return { dot: STALE_AMBER, bgAlpha: isDark ? 0.16 : 0.1, borderAlpha: isDark ? 0.4 : 0.24 };
			default:
				return { dot: theme.palette.text.secondary, bgAlpha: isDark ? 0.1 : 0.06, borderAlpha: isDark ? 0.24 : 0.14 };
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
				{tipo}
			</Typography>
		</Box>
	);
};

// ==============================|| CALCULATOR CARD COMPONENT ||============================== //

interface CalculatorCardProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	path: string;
	disabled?: boolean;
	comingSoon?: boolean;
}

const CalculatorCard = ({ title, description, icon, path, disabled = false, comingSoon = false }: CalculatorCardProps) => {
	const navigate = useNavigate();

	const handleClick = () => {
		if (!disabled) {
			navigate(path);
		}
	};

	return (
		<Card
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				position: "relative",
				opacity: disabled ? 0.7 : 1,
				boxShadow: "0 2px 14px 0 rgba(32, 40, 45, 0.08)",
				"&:hover": {
					boxShadow: !disabled ? "0 2px 14px 0 rgba(32, 40, 45, 0.18)" : undefined,
				},
			}}
		>
			{comingSoon && (
				<Chip
					label="Próximamente"
					color="secondary"
					size="small"
					variant="light"
					sx={{
						position: "absolute",
						top: 16,
						right: 16,
					}}
				/>
			)}
			<CardContent sx={{ flexGrow: 1, p: 3 }}>
				<Box mb={2} display="flex" justifyContent="center">
					{icon}
				</Box>
				<Typography variant="h5" component="div" textAlign="center" gutterBottom>
					{title}
				</Typography>
				<Typography variant="body2" color="text.secondary" textAlign="center">
					{description}
				</Typography>
			</CardContent>
			<CardActions sx={{ p: 3, pt: 1, justifyContent: "center" }}>
				<Button
					variant="contained"
					size="medium"
					onClick={handleClick}
					disabled={disabled}
					color="primary"
					fullWidth
					startIcon={<Calculator variant="Bold" />}
				>
					Acceder
				</Button>
			</CardActions>
		</Card>
	);
};

// ==============================|| CALCULATION DETAILS COMPONENT ||============================== //

interface CalculationDetailsProps {
	data: CalculatorType;
}

const CalculationDetails: React.FC<CalculationDetailsProps> = ({ data }) => {
	const theme = useTheme();
	const interestRates = useSelector((state: any) => state.interestRates?.rates || []);

	const getTypeTitle = (type: string) => {
		switch (type) {
			case "Calculado":
				return "Calculado";
			case "Ofertado":
				return "Ofertado";
			case "Reclamado":
				return "Reclamado";
			default:
				return type;
		}
	};

	const getClassTypeTitle = (classType?: string) => {
		switch (classType) {
			case "laboral":
				return "Laboral";
			case "civil":
				return "Civil";
			case "intereses":
				return "Intereses";
			default:
				return classType || "No especificado";
		}
	};

	// Mapping de tasas conocidas como fallback
	const tasasMapping: Record<string, string> = {
		tasaPasivaBNA: "Tasa Pasiva Banco Nación",
		tasaPasivaBCRA: "Tasa Pasiva BCRA",
		tasaActivaBNA: "Tasa Activa Banco Nación",
		tasaActivaTnaBNA: "Tasa Activa TNA Banco Nación",
		cer: "CER",
		icl: "ICL BCRA",
		tasaActivaCNAT2601: "Tasa Activa Banco Nación - Acta 2601",
		tasaActivaCNAT2658: "Tasa Activa Banco Nación - Acta 2658",
		tasaActivaCNAT2764: "Tasa Activa Banco Nación - Acta 2764",
	};

	const getTasaLabel = (tasaValue: string): string => {
		// Primero buscar en el store de Redux
		const rate = interestRates.find((r: any) => r.value === tasaValue);
		if (rate) {
			return rate.label;
		}
		// Fallback al mapping de tasas conocidas
		return tasasMapping[tasaValue] || tasaValue;
	};

	const getSubClassTypeTitle = (subClassType?: string, classType?: string) => {
		// Para cálculos laborales
		switch (subClassType) {
			case "despido":
				return "Despido";
			case "liquidación final":
				return "Liquidación Final";
		}

		// Para cálculos de intereses, el subClassType contiene el value de la tasa
		// Necesitamos convertirlo al label
		if (classType === "intereses" && subClassType) {
			// Si hay múltiples tasas separadas por coma
			if (subClassType.includes(",")) {
				const tasaValues = subClassType.split(",").map((t) => t.trim());
				const labels = tasaValues.map((value) => getTasaLabel(value));
				return labels.join(", ");
			}

			// Una sola tasa
			return getTasaLabel(subClassType);
		}

		return subClassType || "No especificado";
	};

	const isDarkLocal = theme.palette.mode === "dark";

	const TypePill = ({ value }: { value: string }) => {
		const map: Record<string, string> = {
			Calculado: BRAND_BLUE,
			Ofertado: LIVE_GREEN,
			Reclamado: STALE_AMBER,
		};
		const color = map[value] ?? theme.palette.text.secondary;
		return (
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.625,
					px: 0.875,
					py: 0.25,
					borderRadius: 0.75,
					bgcolor: alpha(color, isDarkLocal ? 0.16 : 0.1),
					border: `1px solid ${alpha(color, isDarkLocal ? 0.32 : 0.22)}`,
				}}
			>
				<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
				<Typography
					sx={{ fontSize: "0.66rem", fontWeight: 600, color, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}
				>
					{getTypeTitle(value)}
				</Typography>
			</Box>
		);
	};

	const InfoSection = ({
		eyebrow,
		title,
		icon,
		children,
		highlight = false,
	}: {
		eyebrow: string;
		title: string;
		icon: React.ReactNode;
		children: React.ReactNode;
		highlight?: boolean;
	}) => {
		const accent = highlight ? LIVE_GREEN : BRAND_BLUE;
		return (
			<Box
				sx={{
					height: "100%",
					borderRadius: 1.5,
					border: `1px solid ${alpha(accent, isDarkLocal ? 0.18 : 0.1)}`,
					bgcolor: theme.palette.background.paper,
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						px: 1.75,
						py: 1.25,
						bgcolor: alpha(accent, isDarkLocal ? 0.05 : 0.025),
						borderBottom: `1px solid ${alpha(accent, isDarkLocal ? 0.16 : 0.1)}`,
					}}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						<Box
							sx={{
								width: 26,
								height: 26,
								borderRadius: 0.75,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(accent, isDarkLocal ? 0.16 : 0.08),
								border: `1px solid ${alpha(accent, isDarkLocal ? 0.28 : 0.18)}`,
								color: accent,
								flexShrink: 0,
							}}
						>
							{icon}
						</Box>
						<Stack spacing={0.125}>
							<Stack direction="row" spacing={0.5} alignItems="center">
								<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: accent }} />
								<Typography
									sx={{
										fontSize: "0.58rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									{eyebrow}
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
								{title}
							</Typography>
						</Stack>
					</Stack>
				</Box>
				<Box sx={{ p: 1.75 }}>{children}</Box>
			</Box>
		);
	};

	const Row = ({ label, value, emphasize = false }: { label: string; value: React.ReactNode; emphasize?: boolean }) => (
		<Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
			<Typography
				sx={{
					fontSize: "0.7rem",
					fontWeight: 600,
					letterSpacing: "0.04em",
					textTransform: "uppercase",
					color: "text.secondary",
				}}
			>
				{label}
			</Typography>
			<Typography
				sx={{
					fontSize: emphasize ? "0.95rem" : "0.82rem",
					fontWeight: emphasize ? 700 : 500,
					color: emphasize ? LIVE_GREEN : "text.primary",
					letterSpacing: "-0.005em",
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{value}
			</Typography>
		</Stack>
	);

	return (
		<Box
			sx={{
				m: 1.5,
				p: 2,
				borderRadius: 2,
				bgcolor: alpha(BRAND_BLUE, isDarkLocal ? 0.04 : 0.025),
				border: `1px solid ${alpha(BRAND_BLUE, isDarkLocal ? 0.16 : 0.1)}`,
			}}
		>
			{/* Header */}
			<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
				<Box
					sx={{
						width: 36,
						height: 36,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDarkLocal ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDarkLocal ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
					}}
				>
					<Calculator size={20} variant="Bulk" />
				</Box>
				<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" spacing={0.625} alignItems="center">
						<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							Detalle del cálculo
						</Typography>
					</Stack>
					<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						{getClassTypeTitle(data.classType)} · {getSubClassTypeTitle(data.subClassType, data.classType)}
					</Typography>
				</Stack>
				<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
					<TypePill value={data.type} />
					{data.folderName && (
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								gap: 0.625,
								px: 0.875,
								py: 0.25,
								borderRadius: 0.75,
								bgcolor: alpha(BRAND_BLUE, isDarkLocal ? 0.1 : 0.05),
								border: `1px solid ${alpha(BRAND_BLUE, isDarkLocal ? 0.22 : 0.16)}`,
							}}
						>
							<DocumentText size={12} variant="Linear" color={BRAND_BLUE} />
							<Typography
								sx={{
									fontSize: "0.7rem",
									fontWeight: 600,
									color: BRAND_BLUE,
									letterSpacing: "-0.005em",
									lineHeight: 1.4,
									maxWidth: 240,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{data.folderName}
							</Typography>
						</Box>
					)}
				</Stack>
			</Stack>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<InfoSection eyebrow="Datos" title="Información general" icon={<DocumentText size={14} variant="Bulk" />}>
						<Stack spacing={1.25}>
							<Row label="Fecha" value={dayjs(data.date).format("DD/MM/YYYY")} />
							<Row label="Categoría" value={getClassTypeTitle(data.classType)} />
							<Row label="Subcategoría" value={getSubClassTypeTitle(data.subClassType, data.classType)} />
						</Stack>
					</InfoSection>
				</Grid>
				<Grid item xs={12} md={6}>
					<InfoSection eyebrow="Monetario" title="Importes" icon={<DocumentText size={14} variant="Bulk" />} highlight>
						<Stack spacing={1.25}>
							<Row
								label="Capital"
								value={new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
									data.capital !== undefined ? data.capital : data.amount - (data.interest || 0),
								)}
							/>
							{(() => {
								const interestValue = data.keepUpdated && data.lastUpdate?.interest ? data.lastUpdate.interest : data.interest;
								const hasInterest = interestValue !== undefined && interestValue !== null && interestValue > 0;
								if (!hasInterest) return null;
								return (
									<Row
										label="Intereses"
										value={new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(interestValue)}
									/>
								);
							})()}
							{(() => {
								const interestValue = data.keepUpdated && data.lastUpdate?.interest ? data.lastUpdate.interest : data.interest;
								const totalValue = data.keepUpdated && data.lastUpdate?.amount ? data.lastUpdate.amount : data.amount;
								const hasInterest = interestValue !== undefined && interestValue !== null && interestValue > 0;
								if (!hasInterest) return null;
								return (
									<>
										<Box sx={{ height: 1, bgcolor: alpha(LIVE_GREEN, isDarkLocal ? 0.18 : 0.12) }} />
										<Row
											label="Total"
											value={new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(totalValue)}
											emphasize
										/>
									</>
								);
							})()}
						</Stack>
					</InfoSection>
				</Grid>
			</Grid>
		</Box>
	);
};

// ==============================|| REACT TABLE COMPONENT ||============================== //

interface ReactTableProps {
	columns: Column<CalculatorType>[];
	data: CalculatorType[];
	isLoading: boolean;
	renderRowSubComponent: (props: { row: Row<CalculatorType> }) => React.ReactNode;
	handleSelectedRows: (selectedIds: string[]) => void;
	handleDeleteSelected?: () => void;
	processingAction: boolean;
	onOpenArchivedModal: () => void;
	onArchiveCalculators?: (ids: string[]) => void;
	selectedCalculatorIds: string[];
	scrollToCalculators: () => void;
	canUpdate?: boolean;
	canDelete?: boolean;
}

// Componente para los checkboxes de selección con estado indeterminado
const IndeterminateCheckbox = React.forwardRef<
	HTMLInputElement,
	{ indeterminate?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "ref">
>((props, ref) => {
	const { indeterminate, ...rest } = props;
	const defaultRef = React.useRef<HTMLInputElement>(null);
	const resolvedRef = ref || defaultRef;

	useEffect(() => {
		if (resolvedRef && "current" in resolvedRef && resolvedRef.current) {
			resolvedRef.current.indeterminate = indeterminate ?? false;
		}
	}, [resolvedRef, indeterminate]);

	return (
		<Checkbox
			inputRef={resolvedRef}
			indeterminate={indeterminate}
			// @ts-ignore - MUI's type definitions are causing issues, but this works
			size="small"
			{...(rest as any)}
		/>
	);
});

function ReactTable({
	columns,
	data,
	renderRowSubComponent,
	isLoading,
	handleSelectedRows,
	handleDeleteSelected,
	processingAction,
	onOpenArchivedModal,
	onArchiveCalculators,
	selectedCalculatorIds,
	scrollToCalculators,
	canUpdate = true,
	canDelete = true,
}: ReactTableProps) {
	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [isColumnsReady, setIsColumnsReady] = useState(false);

	// Overflow menu (CSV + Guía si correspondiese)
	const [overflowAnchor, setOverflowAnchor] = useState<null | HTMLElement>(null);
	const overflowOpen = Boolean(overflowAnchor);
	const handleOverflowOpen = (e: MouseEvent<HTMLElement>) => setOverflowAnchor(e.currentTarget);
	const handleOverflowClose = () => setOverflowAnchor(null);
	const csvLinkRef = useRef<any>(null);

	// Estilo brand-aware de la tabla — scoped, no toca el theme global.
	const tableSx = {
		"& .MuiTableHead-root .MuiTableCell-head": {
			fontSize: "0.7rem",
			fontWeight: 600,
			letterSpacing: "0.1em",
			textTransform: "uppercase",
			color: "text.secondary",
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			py: 1.5,
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

	// Inputs (search + sort) tintados brand vía descendant selectors.
	const brandedInputSx = {
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
		"& .MuiIconButton-root": {
			borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
			color: BRAND_BLUE,
			transition: "border-color 0.15s ease, background-color 0.15s ease",
			"&:hover": {
				borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06),
			},
		},
	} as const;

	const brandPrimaryButtonSx = {
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
	} as const;

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "date", desc: true };

	const defaultHiddenColumns = useMemo(() => ["_id", "folderId"], []);

	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		prepareRow,
		setHiddenColumns,
		allColumns,
		rows,
		page,
		gotoPage,
		setPageSize,
		state: { globalFilter, selectedRowIds, pageIndex, pageSize },
		preGlobalFilteredRows,
		setGlobalFilter,
		setSortBy,
		selectedFlatRows,
	} = useTable(
		{
			columns,
			data,
			filterTypes,
			initialState: {
				pageIndex: 0,
				pageSize: 10,
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
		(hooks) => {
			hooks.visibleColumns.push((cols) => [
				{
					id: "selection",
					Header: ({ getToggleAllPageRowsSelectedProps }: any) => (
						<div>
							<IndeterminateCheckbox {...getToggleAllPageRowsSelectedProps()} />
						</div>
					),
					Cell: ({ row }: { row: any }) => (
						<div>
							<IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
						</div>
					),
				},
				...cols,
			]);
		},
	);

	useEffect(() => {
		setHiddenColumns(defaultHiddenColumns);
		setIsColumnsReady(true);

		return () => {
			setIsColumnsReady(false);
		};
	}, [setHiddenColumns, defaultHiddenColumns]);

	// Effect to update selected rows
	useEffect(() => {
		if (selectedFlatRows && selectedFlatRows.length > 0) {
			const selectedIds = selectedFlatRows.map((row) => row.original._id);
			handleSelectedRows(selectedIds);
		} else {
			handleSelectedRows([]);
		}
	}, [selectedRowIds, handleSelectedRows, selectedFlatRows]);

	if (!isColumnsReady || isLoading) {
		return (
			<>
				<TableRowSelection selected={0} />
				<Stack spacing={1}>
					<Stack
						direction={matchDownSM ? "column" : "row"}
						spacing={1}
						justifyContent="space-between"
						alignItems="center"
						sx={{ p: 3, pb: 0 }}
					>
						<Skeleton width={200} height={40} />
						<Stack direction={matchDownSM ? "column" : "row"} alignItems="center" spacing={2}>
							<Skeleton width={120} height={40} />
							<Skeleton width={150} height={40} />
						</Stack>
					</Stack>
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

	const CustomGlobalFilter = GlobalFilter as any;
	const CustomTablePagination = TablePagination as any;
	const CustomHeaderSort = HeaderSort as any;
	const CustomSortingSelect = SortingSelect as any;

	return (
		<>
			<TableRowSelection selected={Object.keys(selectedRowIds).length} />
			{/* Toolbar refrescada — una sola fila en desktop, dos en mobile */}
			<Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
				{matchDownSM ? (
					/* ── MOBILE TOOLBAR ── */
					<Stack spacing={1.5}>
						<Box sx={brandedInputSx}>
							<CustomGlobalFilter
								preGlobalFilteredRows={preGlobalFilteredRows}
								globalFilter={globalFilter}
								setGlobalFilter={setGlobalFilter}
							/>
						</Box>
						<Stack direction="row" spacing={1} alignItems="center">
							<Button
								variant="contained"
								size="small"
								startIcon={<Add />}
								onClick={scrollToCalculators}
								sx={{ ...brandPrimaryButtonSx, flex: 1 }}
							>
								Nuevo cálculo
							</Button>
							<Tooltip title="Más opciones">
								<IconButton size="small" color="secondary" onClick={handleOverflowOpen} aria-label="Más opciones">
									<More variant="Bulk" size={20} />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>
				) : (
					/* ── DESKTOP TOOLBAR ── una sola fila */
					<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
						<Button variant="contained" size="small" startIcon={<Add />} onClick={scrollToCalculators} sx={brandPrimaryButtonSx}>
							Nuevo cálculo
						</Button>

						<Stack direction="row" spacing={1}>
							<Button
								variant="outlined"
								color="secondary"
								size="small"
								startIcon={<Archive size={18} />}
								onClick={() => onOpenArchivedModal()}
								sx={{ textTransform: "none" }}
								data-testid="calculator-archived-btn"
							>
								Archivados
							</Button>
							{canUpdate && onArchiveCalculators && (
								<Tooltip title={selectedCalculatorIds.length === 0 ? "Seleccioná al menos un cálculo para archivar" : ""}>
									<span>
										<Button
											variant="outlined"
											color="secondary"
											size="small"
											startIcon={<Archive size={18} />}
											onClick={() => onArchiveCalculators(selectedCalculatorIds)}
											disabled={selectedCalculatorIds.length === 0 || processingAction}
											sx={{ textTransform: "none" }}
										>
											{selectedCalculatorIds.length > 0 ? `Archivar (${selectedCalculatorIds.length})` : "Archivar"}
										</Button>
									</span>
								</Tooltip>
							)}
						</Stack>

						<Box sx={{ minWidth: 200, ...brandedInputSx }}>
							<CustomSortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
						</Box>

						<Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, justifyContent: "flex-end" }}>
							<Box sx={{ width: 220, ...brandedInputSx }}>
								<CustomGlobalFilter
									preGlobalFilteredRows={preGlobalFilteredRows}
									globalFilter={globalFilter}
									setGlobalFilter={setGlobalFilter}
								/>
							</Box>

							{canDelete && handleDeleteSelected && (
								<Tooltip
									title={
										Object.keys(selectedRowIds).length === 0
											? "Seleccioná al menos un cálculo para eliminar"
											: `Eliminar ${Object.keys(selectedRowIds).length} ${
													Object.keys(selectedRowIds).length === 1 ? "cálculo" : "cálculos"
											  }`
									}
								>
									<span>
										<IconButton
											size="small"
											onClick={handleDeleteSelected}
											disabled={Object.keys(selectedRowIds).length === 0 || processingAction}
											sx={{
												position: "relative",
												color: "text.secondary",
												transition: "background-color 0.15s ease, color 0.15s ease",
												"&:hover:not(.Mui-disabled)": {
													bgcolor: alpha(theme.palette.error.main, isDark ? 0.18 : 0.1),
													color: theme.palette.error.main,
												},
												"&.Mui-disabled": { color: alpha(theme.palette.text.disabled, 0.6) },
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
													{Object.keys(selectedRowIds).length}
												</Box>
											)}
										</IconButton>
									</span>
								</Tooltip>
							)}

							<Tooltip title="Más opciones">
								<IconButton color="secondary" size="small" onClick={handleOverflowOpen} aria-label="Más opciones">
									<More variant="Bulk" size={20} />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>
				)}

				{/* CSV link siempre montado (hidden, lo dispara el menu overflow) */}
				<CSVLink ref={csvLinkRef} data={data} filename={"calculos-guardados.csv"} style={{ display: "none" }}>
					{" "}
				</CSVLink>

				<Menu
					anchorEl={overflowAnchor}
					open={overflowOpen}
					onClose={handleOverflowClose}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
					transformOrigin={{ vertical: "top", horizontal: "right" }}
					slotProps={{ paper: { sx: { minWidth: 200 } } }}
				>
					<MenuItem
						onClick={() => {
							handleOverflowClose();
							csvLinkRef.current?.link?.click();
						}}
					>
						<ListItemIcon>
							<DocumentDownload variant="Bulk" size={18} />
						</ListItemIcon>
						<ListItemText>Exportar CSV</ListItemText>
					</MenuItem>
				</Menu>
			</Stack>

			{/* Tabla con ScrollX */}
			<ScrollX>
				<Table {...getTableProps()} sx={tableSx}>
					<TableHead>
						{headerGroups.map((headerGroup: HeaderGroup<CalculatorType>) => (
							<TableRow {...headerGroup.getHeaderGroupProps()} sx={{ "& > th:first-of-type": { width: "40px" } }}>
								{headerGroup.headers.map((column: HeaderGroup<CalculatorType>) => (
									<TableCell {...column.getHeaderProps([{ className: column.className }])}>
										<CustomHeaderSort column={column} sort />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody {...getTableBodyProps()}>
						{page.map((row: Row<CalculatorType>, i: number) => {
							prepareRow(row);

							const isRowActive = row.isSelected || expandedRowId === row.id;
							return (
								<Fragment key={i}>
									<TableRow
										{...row.getRowProps()}
										onClick={() => {
											if (!row.isSelected) {
												if (expandedRowId === row.id) {
													setExpandedRowId(null);
												} else {
													setExpandedRowId(row.id);
												}
												row.toggleRowExpanded();
											}
										}}
										sx={{
											cursor: "pointer",
											transition: "background-color 0.15s ease",
											bgcolor: isRowActive ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) : "inherit",
											"&:hover": {
												bgcolor: isRowActive ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.11) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
											},
										}}
									>
										{row.cells.map((cell: Cell<CalculatorType>) => (
											<TableCell
												{...cell.getCellProps([{ className: cell.column.className }])}
												onClick={(e) => {
													// Si es la celda de selección (checkbox), no desplegar el contenido
													if (cell.column.id === "selection") {
														e.stopPropagation();
														row.toggleRowSelected();
													}
												}}
											>
												{cell.render("Cell")}
											</TableCell>
										))}
									</TableRow>
									<TableRow>
										<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
											<Collapse in={expandedRowId === row.id} timeout="auto" unmountOnExit>
												<Box sx={{ margin: 1 }}>{renderRowSubComponent({ row })}</Box>
											</Collapse>
										</TableCell>
									</TableRow>
								</Fragment>
							);
						})}
						{page.length === 0 && (
							<TableRow>
								<TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
									<Box
										sx={{
											position: "relative",
											overflow: "hidden",
											width: "100%",
											py: { xs: 3.5, sm: 4.5 },
											px: 2,
										}}
									>
										<Box
											aria-hidden
											sx={{
												position: "absolute",
												inset: 0,
												background: `radial-gradient(circle at 50% 40%, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)} 0%, transparent 60%)`,
												pointerEvents: "none",
												zIndex: 0,
											}}
										/>
										<Box
											aria-hidden
											sx={{
												position: "absolute",
												inset: 0,
												backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04)} 1px, transparent 1px)`,
												backgroundSize: "22px 22px",
												maskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 80%)",
												WebkitMaskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 80%)",
												pointerEvents: "none",
												zIndex: 0,
											}}
										/>

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
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
													border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
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
													Sin cálculos
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
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
													color: BRAND_BLUE,
												}}
											>
												<Calculator size={40} variant="Bulk" />
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
													Todavía no hay cálculos guardados
												</Typography>
												<Typography
													sx={{
														fontSize: "0.875rem",
														color: "text.secondary",
														lineHeight: 1.55,
														maxWidth: 380,
														textWrap: "pretty",
													}}
												>
													Elegí una calculadora abajo, ejecutá un cálculo y guardalo desde la pantalla de resultados.
												</Typography>
											</Stack>
										</Stack>
									</Box>
								</TableCell>
							</TableRow>
						)}
						{page.length > 0 && (
							<TableRow sx={{ "&:hover": { bgcolor: "transparent !important" } }}>
								<TableCell sx={{ p: 2, py: 3 }} colSpan={9}>
									<CustomTablePagination
										gotoPage={gotoPage}
										rows={rows}
										setPageSize={setPageSize}
										pageSize={pageSize}
										pageIndex={pageIndex}
									/>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</ScrollX>
		</>
	);
}

// ==============================|| MAIN COMPONENT - ALL CALCULATORS ||============================== //

const AllCalculators = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { calculators, archivedCalculators, archivedPagination, isLoader, isInitialized, lastFetchedUserId } = useSelector(
		(state: any) => state.calculator,
	);
	const auth = useSelector((state: any) => state.auth);
	const userId = auth.user?._id;
	const [loading, setLoading] = useState(true);

	// Team context - para cargar recursos del equipo si hay uno activo
	const { activeTeam, isTeamMode, canUpdate, canDelete, isInitialized: isTeamInitialized, getRequestHeaders } = useTeam();

	// Estados para confirmación y archivado
	const [deleteId, setDeleteId] = useState<string>("");
	const [deleteTitle, setDeleteTitle] = useState<string>("");
	const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
	const [openArchivedModal, setOpenArchivedModal] = useState<boolean>(false);
	const [processingArchiveAction, setProcessingArchiveAction] = useState<boolean>(false);
	const [selectedCalculatorIds, setSelectedCalculatorIds] = useState<string[]>([]);
	const [archivedPage, setArchivedPage] = useState(1);
	const [archivedPageSize, setArchivedPageSize] = useState(10);

	// Crear una referencia para la sección de calculadoras disponibles
	const calculatorsSectionRef = useRef<HTMLDivElement>(null);

	// Estado para controlar la visualización del selector de guías
	const [guideSelectorOpen, setGuideSelectorOpen] = useState(false);

	// Función para desplazarse a la sección de calculadoras
	const scrollToCalculators = () => {
		calculatorsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Función para actualizar calculadoras archivadas cuando se abre el modal o cambia la página
	useEffect(() => {
		if (openArchivedModal) {
			// En modo equipo, obtener archivados del grupo; si no, del usuario
			if (isTeamMode && activeTeam?._id) {
				dispatch(getArchivedCalculatorsByGroupId(activeTeam._id, archivedPage, archivedPageSize));
			} else if (userId) {
				dispatch(getArchivedCalculatorsByUserId(userId, archivedPage, archivedPageSize));
			}
		}
	}, [openArchivedModal, userId, isTeamMode, activeTeam?._id, archivedPage, archivedPageSize]);

	// Handler para cambio de página en archivados
	const handleArchivedPageChange = (page: number) => {
		setArchivedPage(page);
	};

	// Handler para cambio de tamaño de página en archivados
	const handleArchivedPageSizeChange = (pageSize: number) => {
		setArchivedPageSize(pageSize);
		setArchivedPage(1); // Reset a primera página
	};

	// Fetch all calculators for the user or group
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);

			if (!userId) {
				setLoading(false);
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

			try {
				// Si hay equipo activo, cargar calculators del grupo
				// Si no, cargar del usuario
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getCalculatorsByGroupId(activeTeam._id, true));
					await dispatch(getArchivedCalculatorsByGroupId(activeTeam._id));
				} else {
					// SIEMPRE forzar refresh en esta vista para obtener TODOS los cálculos
					// Usamos forceRefresh=true para ignorar el caché
					await dispatch(getCalculatorsByUserId(userId, true));
					await dispatch(getArchivedCalculatorsByUserId(userId));
				}
			} catch (error) {
				console.error("Error loading calculators:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId, activeTeam?._id, isTeamMode, isTeamInitialized]);

	// Handle delete multiple calculators
	const handleDeleteSelectedCalculators = async () => {
		if (!userId || selectedCalculatorIds.length === 0) return;

		setProcessingArchiveAction(true); // Reutilizamos el state para bloquear acciones durante el proceso

		try {
			// Procesamos cada ID en el array
			const promises = selectedCalculatorIds.map((id) => dispatch(deleteCalculator(id)));
			const results = await Promise.all(promises);

			// Verificamos si todos se eliminaron correctamente
			const allSuccess = results.every((result) => result.success);

			if (allSuccess) {
				dispatch(
					openSnackbar({
						open: true,
						message: `${selectedCalculatorIds.length} ${
							selectedCalculatorIds.length === 1 ? "cálculo eliminado" : "cálculos eliminados"
						} correctamente`,
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al eliminar algunos cálculos",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al eliminar los cálculos",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setProcessingArchiveAction(false);
		}
	};

	// Navigation calculator cards
	const calculatorCards = [
		{
			title: "Laboral",
			description: "Calcula liquidaciones laborales, indemnizaciones y otros conceptos relacionados con el ámbito laboral.",
			icon: <Calculator size={48} variant="Bulk" style={{ color: "var(--mui-palette-primary-main)" }} />,
			path: "/apps/calc/labor",
			disabled: false,
			comingSoon: false,
		},
		{
			title: "Intereses",
			description: "Calcula intereses según diferentes tasas y periodos para tus procesos legales y financieros.",
			icon: <Coin size={48} variant="Bulk" style={{ color: "var(--mui-palette-success-main)" }} />,
			path: "/apps/calc/intereses",
			disabled: false,
			comingSoon: false,
		},
		{
			title: "Civil",
			description: "Calcula liquidaciones del ámbito civil, indemnizaciones y otros conceptos relacionados.",
			icon: <Chart2 size={48} variant="Bulk" style={{ color: "var(--mui-palette-warning-main)" }} />,
			path: "/apps/calc/civil",
			disabled: true,
			comingSoon: true,
		},
	];

	// Handle delete calculator (single)
	const handleDeleteCalculator = (id: string, title: string) => {
		setDeleteId(id);
		setDeleteTitle(title || "este cálculo");
		setOpenDeleteModal(true);
	};

	// Handle close delete modal
	const handleCloseDeleteModal = (status: boolean) => {
		setOpenDeleteModal(false);
		if (status) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Cálculo eliminado correctamente",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
		}
	};

	// Handle archive calculators
	const handleArchiveCalculators = async (calculatorIds: string[]) => {
		if (!userId) return;

		setProcessingArchiveAction(true);

		try {
			const response = await dispatch(archiveCalculators(userId, calculatorIds, { headers: getRequestHeaders() }));

			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Cálculo archivado correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Error al archivar los cálculos",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al archivar los cálculos",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setProcessingArchiveAction(false);
		}
	};

	// Handle unarchive calculators
	const handleUnarchiveCalculators = async (calculatorIds: string[]) => {
		if (!userId) return;

		setProcessingArchiveAction(true);

		try {
			const response = await dispatch(unarchiveCalculators(userId, calculatorIds, { headers: getRequestHeaders() }));

			if (response.success) {
				// Force refresh the active calculators list from server to ensure table matches widget
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getCalculatorsByGroupId(activeTeam._id, true));
				} else {
					await dispatch(getCalculatorsByUserId(userId, true));
				}
				setOpenArchivedModal(false);
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Cálculos desarchivados correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Error al desarchivar los cálculos",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al desarchivar los cálculos",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setProcessingArchiveAction(false);
		}
	};

	// Table columns definition
	const columns = useMemo<Column<CalculatorType>[]>(
		() => [
			{
				Header: "ID",
				accessor: "_id",
				className: "cell-center",
			},
			{
				Header: "FolderID",
				accessor: "folderId",
				className: "cell-center",
			},
			{
				Header: "Fecha",
				accessor: "date",
				Cell: ({ value }) => {
					return <Typography>{dayjs(value).format("DD/MM/YYYY")}</Typography>;
				},
			},
			{
				Header: "Carátula",
				accessor: "folderName",
				Cell: ({ value }) => {
					return value ? (
						<Box display="flex" alignItems="center">
							<DocumentText size="18" style={{ marginRight: "8px", color: theme.palette.text.secondary }} />
							<Typography>{value}</Typography>
						</Box>
					) : (
						<Typography color="text.secondary">Sin carátula</Typography>
					);
				},
			},
			{
				Header: "Tipo",
				accessor: "type",
				Cell: ({ value }) => (value ? <TipoPill tipo={value} /> : null),
			},
			{
				Header: "Categoría",
				accessor: "classType",
				Cell: ({ value }) => {
					const getClassTypeLabel = (type?: string) => {
						switch (type) {
							case "laboral":
								return "Laboral";
							case "civil":
								return "Civil";
							case "intereses":
								return "Intereses";
							default:
								return "No especificado";
						}
					};

					const getClassTypeIcon = (type?: string) => {
						switch (type) {
							case "laboral":
								return <Calculator size="16" style={{ marginRight: "4px" }} />;
							case "civil":
								return <Chart2 size="16" style={{ marginRight: "4px" }} />;
							case "intereses":
								return <Coin size="16" style={{ marginRight: "4px" }} />;
							default:
								return null;
						}
					};

					return (
						<Box display="flex" alignItems="center">
							{getClassTypeIcon(value)}
							<Typography>{getClassTypeLabel(value)}</Typography>
						</Box>
					);
				},
			},
			{
				Header: "Capital",
				accessor: "amount",
				Cell: ({ row }: { row: Row<CalculatorType> }) => {
					// Si existe la propiedad capital, usarla
					if (row.original.capital !== undefined) {
						return (
							<Typography fontWeight="500">
								{new Intl.NumberFormat("es-AR", {
									style: "currency",
									currency: "ARS",
								}).format(row.original.capital)}
							</Typography>
						);
					}

					// Si no existe capital pero hay intereses, calcular capital = amount - interest
					const capital = row.original.amount - (row.original.interest || 0);

					return (
						<Typography fontWeight="500">
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(capital)}
						</Typography>
					);
				},
			},
			{
				Header: "Intereses",
				accessor: "interest",
				Cell: ({ row }: { row: Row<CalculatorType> }) => {
					// Si keepUpdated está activo y hay lastUpdate, usar esos intereses
					if (row.original.keepUpdated && row.original.lastUpdate?.interest) {
						return (
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<Typography fontWeight="500" color="success.main">
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(row.original.lastUpdate.interest)}
								</Typography>
								<Tooltip title="Intereses actualizados automáticamente">
									<Box component="span" sx={{ display: "flex", alignItems: "center" }}>
										<Refresh size={16} style={{ color: theme.palette.primary.main }} />
									</Box>
								</Tooltip>
							</Stack>
						);
					}

					const hasInterest = row.original.interest !== undefined && row.original.interest !== null && row.original.interest > 0;

					if (!hasInterest) {
						return (
							<Button
								variant="contained"
								size="small"
								color="success"
								onClick={(e) => {
									e.stopPropagation();
									// Navegar a la sección de intereses
									navigate("/apps/calc/intereses");
								}}
								startIcon={<Coin size={16} />}
							>
								Calcular
							</Button>
						);
					}

					return (
						<Typography fontWeight="500" color="success.main">
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(row.original.interest || 0)}
						</Typography>
					);
				},
			},
			{
				Header: "Total",
				id: "total",
				Cell: ({ row }: { row: Row<CalculatorType> }) => {
					// Si keepUpdated está activo y hay lastUpdate, usar ese amount
					if (row.original.keepUpdated && row.original.lastUpdate?.amount) {
						return (
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<Typography fontWeight="600">
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(row.original.lastUpdate.amount)}
								</Typography>
								<Tooltip title="Total actualizado automáticamente">
									<Box component="span" sx={{ display: "flex", alignItems: "center" }}>
										<Refresh size={16} style={{ color: theme.palette.primary.main }} />
									</Box>
								</Tooltip>
							</Stack>
						);
					}

					// Usar amount que ya es el total (capital + intereses)
					return (
						<Typography fontWeight="600">
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(row.original.amount)}
						</Typography>
					);
				},
			},
			{
				Header: "Acciones",
				accessor: "variables", // Utilizamos variables como accessor para tener acceso a la data completa
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: { row: Row<CalculatorType> }) => {
					const isDarkMode = theme.palette.mode === "dark";
					const collapseIcon = row.isExpanded ? <Add size={18} style={{ transform: "rotate(45deg)" }} /> : <Eye variant="Bulk" size={18} />;

					// Monocromo + intent: brand-blue para acciones normales,
					// red sólo para destructive.
					const actionIconSx = {
						color: "text.secondary",
						transition: "background-color 0.15s ease, color 0.15s ease",
						"&:hover:not(.Mui-disabled)": {
							bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.16 : 0.08),
							color: BRAND_BLUE,
						},
					} as const;
					const destructiveIconSx = {
						color: "text.secondary",
						transition: "background-color 0.15s ease, color 0.15s ease",
						"&:hover:not(.Mui-disabled)": {
							bgcolor: alpha(theme.palette.error.main, isDarkMode ? 0.18 : 0.1),
							color: theme.palette.error.main,
						},
					} as const;

					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
							<Tooltip title="Ver detalles">
								<IconButton
									size="small"
									sx={actionIconSx}
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										row.toggleRowExpanded();
									}}
								>
									{collapseIcon}
								</IconButton>
							</Tooltip>
							{canUpdate && (
								<Tooltip title="Archivar">
									<IconButton
										size="small"
										sx={actionIconSx}
										onClick={(e: MouseEvent<HTMLButtonElement>) => {
											e.stopPropagation();
											handleArchiveCalculators([row.original._id]);
										}}
										data-testid="calculator-archive-btn"
									>
										<Archive variant="Bulk" size={18} />
									</IconButton>
								</Tooltip>
							)}
							{canDelete && (
								<Tooltip title="Eliminar">
									<IconButton
										size="small"
										sx={destructiveIconSx}
										onClick={(e: MouseEvent<HTMLButtonElement>) => {
											e.stopPropagation();
											handleDeleteCalculator(row.original._id, row.original.folderName || "Cálculo");
										}}
										data-testid="calculator-delete-btn"
									>
										<Trash variant="Bulk" size={18} />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					);
				},
			},
		],
		[theme.palette.error.main, theme.palette.text.secondary, theme.palette.mode, canUpdate, canDelete],
	);

	// Función para manejar selección de calculadoras
	const handleSelectedRows = useCallback((selected: string[]) => {
		setSelectedCalculatorIds(selected);
	}, []);

	// Table row sub-component with details
	const renderRowSubComponent = useCallback(({ row }: { row: Row<CalculatorType> }) => <CalculationDetails data={row.original} />, []);

	const isDark = theme.palette.mode === "dark";

	return (
		<Stack spacing={{ xs: 1, sm: 2.5 }}>
			{/* ── HEADER DE SECCIÓN ─────────────────────────────────────────── */}
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
								Cálculos
							</Typography>
						</Box>
						<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
							Liquidaciones, intereses y daños — calculá, guardá y vinculá los resultados a tus expedientes.
						</Typography>
					</Stack>

					<Box
						sx={{
							flexShrink: 0,
							width: { xs: "100%", md: "auto" },
							minWidth: { md: 440 },
							pl: { md: 2 },
							borderLeft: { md: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` },
						}}
					>
						<ResourceUsageBar resourceType="calculators" compact disableContainerPadding />
					</Box>
				</Stack>
			</Box>

			<DowngradeGracePeriodAlert />

			{/* PRIMERO: Tabla de cálculos guardados */}
			<MainCard
				title={
					<Box display="flex" alignItems="center" gap={1}>
						<DocumentText variant="Bulk" size={20} style={{ color: BRAND_BLUE }} />
						<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
							Mis cálculos guardados
						</Typography>
					</Box>
				}
				content={false}
			>
				<ScrollX>
					<ReactTable
						columns={columns}
						data={calculators || []}
						isLoading={isLoader || loading}
						renderRowSubComponent={renderRowSubComponent}
						handleSelectedRows={handleSelectedRows}
						handleDeleteSelected={canDelete ? handleDeleteSelectedCalculators : undefined}
						processingAction={processingArchiveAction}
						onOpenArchivedModal={() => setOpenArchivedModal(true)}
						onArchiveCalculators={canUpdate ? handleArchiveCalculators : undefined}
						selectedCalculatorIds={selectedCalculatorIds}
						scrollToCalculators={scrollToCalculators}
						canUpdate={canUpdate}
						canDelete={canDelete}
					/>
				</ScrollX>
			</MainCard>

			{/* Notice brand-aware en lugar del Alert info MUI default */}
			<Box
				sx={{
					position: "relative",
					borderRadius: 1.5,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
					px: { xs: 2, sm: 2.5 },
					py: { xs: 1.25, sm: 1.5 },
				}}
			>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.25, sm: 2 }} alignItems={{ xs: "flex-start", sm: "center" }}>
					<Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
						<Box
							sx={{
								width: 32,
								height: 32,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<InfoCircle size={18} variant="Bulk" />
						</Box>
						<Stack spacing={0.25}>
							<Typography sx={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary", lineHeight: 1.25 }}>
								Herramientas para tu trabajo legal
							</Typography>
							<Typography sx={{ fontSize: "0.825rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
								Calculadoras especializadas para liquidaciones laborales, intereses y daños civiles.
							</Typography>
						</Stack>
					</Stack>
					<Button
						size="small"
						variant="text"
						onClick={() => setGuideSelectorOpen(true)}
						sx={{
							color: BRAND_BLUE,
							fontWeight: 600,
							textTransform: "none",
							fontSize: "0.82rem",
							flexShrink: 0,
							"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.08) },
						}}
					>
						Ver guía →
					</Button>
				</Stack>
			</Box>

			<MainCard
				title={
					<Box display="flex" alignItems="center" gap={1}>
						<Calculator variant="Bulk" size={20} style={{ color: BRAND_BLUE }} />
						<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
							Calculadoras disponibles
						</Typography>
					</Box>
				}
				ref={calculatorsSectionRef}
			>
				<Grid container spacing={3}>
					{loading
						? // Plantillas de carga que mantienen el mismo tamaño que las tarjetas reales
						  [...Array(3)].map((_, index) => (
								<Grid item xs={12} sm={6} md={4} key={index}>
									<Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
										<CardContent sx={{ flexGrow: 1, p: 3 }}>
											<Box mb={2} display="flex" justifyContent="center">
												<Skeleton variant="circular" width={48} height={48} />
											</Box>
											<Skeleton variant="text" height={32} width="60%" sx={{ mx: "auto" }} />
											<Skeleton variant="text" height={20} />
											<Skeleton variant="text" height={20} />
										</CardContent>
										<CardActions sx={{ p: 3, pt: 1, justifyContent: "center" }}>
											<Skeleton variant="rectangular" height={36} width="100%" />
										</CardActions>
									</Card>
								</Grid>
						  ))
						: // Tarjetas reales
						  calculatorCards.map((calc, index) => (
								<Grid item xs={12} sm={6} md={4} key={index}>
									<CalculatorCard {...calc} />
								</Grid>
						  ))}
				</Grid>
			</MainCard>

			{/* Componente selector de guías */}
			<GuideSelector open={guideSelectorOpen} onClose={() => setGuideSelectorOpen(false)} />

			{/* Modales */}
			<ArchivedCalculatorsModal
				open={openArchivedModal}
				onClose={() => {
					setOpenArchivedModal(false);
					setArchivedPage(1); // Reset page on close
				}}
				items={archivedCalculators || []}
				onUnarchive={handleUnarchiveCalculators}
				loading={isLoader || processingArchiveAction}
				pagination={archivedPagination}
				onPageChange={handleArchivedPageChange}
				onPageSizeChange={handleArchivedPageSizeChange}
			/>

			<AlertCalculatorDelete title={deleteTitle} open={openDeleteModal} handleClose={handleCloseDeleteModal} id={deleteId} />
		</Stack>
	);
};

export default AllCalculators;
