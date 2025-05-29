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
	Container,
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
import { Calculator, Chart2, Coin, Warning2, Eye, Trash, Add, DocumentText, Archive, DocumentDownload } from "iconsax-react";
import { Checkbox } from "@mui/material";
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
	archiveCalculators,
	unarchiveCalculators,
	getArchivedCalculatorsByUserId,
	deleteCalculator,
} from "store/reducers/calculator";
import { openSnackbar } from "store/reducers/snackbar";

// types
import { CalculatorType } from "types/calculator";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";
import moment from "moment";
// Importamos el componente selector de guías
import { GuideSelector } from "components/guides";
// Importamos componentes para gestión de archivado
import ArchivedCalculatorsModal from "sections/apps/calculator/ArchivedCalculatorsModal";
import AlertCalculatorDelete from "sections/apps/calculator/AlertCalculatorDelete";

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

	const getSubClassTypeTitle = (subClassType?: string) => {
		switch (subClassType) {
			case "despido":
				return "Despido";
			case "liquidación final":
				return "Liquidación Final";
			case "intereses":
				return "Intereses";
			default:
				return subClassType || "No especificado";
		}
	};

	const getTypeChipColor = (type: string) => {
		switch (type) {
			case "Calculado":
				return "primary";
			case "Ofertado":
				return "success";
			case "Reclamado":
				return "warning";
			default:
				return "default";
		}
	};

	return (
		<Box sx={{ p: 2, backgroundColor: (theme) => alpha(theme.palette.primary.lighter, 0.1) }}>
			<Box mb={2} display="flex" alignItems="center" gap={2}>
				<Typography variant="h5" fontWeight="medium">
					Detalles del Cálculo
				</Typography>
				<Chip label={getTypeTitle(data.type)} color={getTypeChipColor(data.type) as any} size="small" variant="light" />
				{data.folderName && <Chip icon={<DocumentText size="16" />} label={data.folderName} variant="light" color="default" size="small" />}
			</Box>

			<Grid container spacing={3}>
				<Grid item xs={12} md={6}>
					<MainCard title="Información General" elevation={0}>
						<Stack spacing={1.5}>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="subtitle2">Fecha:</Typography>
								<Typography variant="body2">{moment(data.date).format("DD/MM/YYYY")}</Typography>
							</Stack>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="subtitle2">Categoría:</Typography>
								<Typography variant="body2">{getClassTypeTitle(data.classType)}</Typography>
							</Stack>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="subtitle2">Subcategoría:</Typography>
								<Typography variant="body2">{getSubClassTypeTitle(data.subClassType)}</Typography>
							</Stack>
						</Stack>
					</MainCard>
				</Grid>
				<Grid item xs={12} md={6}>
					<MainCard
						title="Importes"
						elevation={0}
						sx={{
							"& .MuiCardContent-root": {
								bgcolor: alpha(theme.palette.success.lighter, 0.2),
							},
						}}
					>
						<Stack spacing={1.5}>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="subtitle2">Capital:</Typography>
								<Typography variant="body2" fontWeight="bold">
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(data.capital !== undefined ? data.capital : data.amount - (data.interest || 0))}
								</Typography>
							</Stack>
							{data.interest !== undefined && (
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="subtitle2">Intereses:</Typography>
									<Typography variant="body2">
										{new Intl.NumberFormat("es-AR", {
											style: "currency",
											currency: "ARS",
										}).format(data.interest)}
									</Typography>
								</Stack>
							)}
							{data.interest !== undefined && (
								<>
									<Divider />
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="subtitle1" fontWeight="bold">
											Total:
										</Typography>
										<Typography variant="body1" fontWeight="bold" color="primary.main">
											{new Intl.NumberFormat("es-AR", {
												style: "currency",
												currency: "ARS",
											}).format(data.amount)}
										</Typography>
									</Stack>
								</>
							)}
						</Stack>
					</MainCard>
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
	handleDeleteSelected: () => void;
	processingAction: boolean;
	onOpenArchivedModal: () => void;
	onArchiveCalculators: (ids: string[]) => void;
	selectedCalculatorIds: string[];
	scrollToCalculators: () => void;
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
}: ReactTableProps) {
	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [isColumnsReady, setIsColumnsReady] = useState(false);

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "date", desc: true };

	const defaultHiddenColumns = useMemo(() => ["_id", "variables", "folderId"], []);

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
			<Stack spacing={1}>
				{/* Primera fila: buscador a la izquierda, botones a la derecha */}
				<Stack
					direction={matchDownSM ? "column" : "row"}
					spacing={2}
					justifyContent="space-between"
					alignItems={matchDownSM ? "flex-start" : "center"}
					sx={{ p: 3, pb: 0.5 }}
				>
					{/* Buscador (izquierda) */}
					<Box width={matchDownSM ? "100%" : "280px"}>
						<CustomGlobalFilter
							preGlobalFilteredRows={preGlobalFilteredRows}
							globalFilter={globalFilter}
							setGlobalFilter={setGlobalFilter}
						/>
					</Box>

					{/* Botones de acción (derecha) */}
					<Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
						<Button color="secondary" size="small" variant="outlined" startIcon={<Archive />} onClick={() => onOpenArchivedModal()}>
							Archivados
						</Button>
						<Tooltip title={selectedCalculatorIds.length === 0 ? "Seleccione elementos para archivar" : ""}>
							<span>
								<Button
									color="primary"
									size="small"
									variant="outlined"
									startIcon={<Archive />}
									onClick={() => onArchiveCalculators(selectedCalculatorIds)}
									disabled={selectedCalculatorIds.length === 0 || processingAction}
								>
									Archivar {selectedCalculatorIds.length > 0 ? `(${selectedCalculatorIds.length})` : ""}
								</Button>
							</span>
						</Tooltip>
						<Button color="primary" size="small" variant="contained" startIcon={<Add />} onClick={scrollToCalculators}>
							Nuevo cálculo
						</Button>
					</Stack>
				</Stack>

				{/* Segunda fila: selector de ordenamiento a la izquierda, botones de eliminar/exportar a la derecha */}
				<Stack
					direction={matchDownSM ? "column" : "row"}
					spacing={2}
					justifyContent="space-between"
					alignItems={matchDownSM ? "flex-start" : "center"}
					sx={{ px: 3, pb: 1 }}
				>
					{/* Selector de ordenamiento (izquierda) */}
					<Box width={matchDownSM ? "100%" : "280px"}>
						<CustomSortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
					</Box>

					{/* Botones de eliminar y exportar (derecha) */}
					<Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
						{/* Botón de eliminar */}
						<Tooltip
							title={
								Object.keys(selectedRowIds).length === 0
									? "Seleccione elementos para eliminar"
									: `Eliminar ${Object.keys(selectedRowIds).length} elementos`
							}
						>
							<span>
								<IconButton
									color="error"
									onClick={handleDeleteSelected}
									disabled={Object.keys(selectedRowIds).length === 0 || processingAction}
									size="medium"
									sx={{
										position: "relative",
										"&.Mui-disabled": {
											color: "text.disabled",
										},
									}}
								>
									<Trash variant="Bulk" size={22} />
									{Object.keys(selectedRowIds).length > 0 && (
										<Box
											sx={{
												position: "absolute",
												top: -8,
												right: -8,
												bgcolor: "error.main",
												color: "white",
												borderRadius: "50%",
												fontSize: "0.75rem",
												minWidth: "20px",
												height: "20px",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontWeight: "bold",
											}}
										>
											{Object.keys(selectedRowIds).length}
										</Box>
									)}
								</IconButton>
							</span>
						</Tooltip>

						{/* Botón de exportar CSV personalizado */}
						<Tooltip title="Exportar a CSV">
							<IconButton
								color="primary"
								size="medium"
								sx={{
									position: "relative",
								}}
							>
								<CSVLink
									data={data}
									filename={"calculos-guardados.csv"}
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
					</Stack>
				</Stack>
				<Table {...getTableProps()}>
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
											bgcolor: row.isSelected
												? alpha(theme.palette.primary.lighter, 0.35)
												: expandedRowId === row.id
												? alpha(theme.palette.primary.lighter, 0.35)
												: "inherit",
											"&:hover": {
												bgcolor: alpha(theme.palette.primary.lighter, 0.15),
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
								<TableCell colSpan={9} sx={{ textAlign: "center", py: 5 }}>
									<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
										<Calculator
											variant="Bulk"
											size={64}
											style={{
												marginBottom: "16px",
												color: theme.palette.primary.main,
												opacity: 0.7,
											}}
										/>
										<Typography variant="h5" gutterBottom>
											No hay cálculos guardados. Puedes crear una usando el botón 'Nuevo Cálculo'.
										</Typography>
										<Typography variant="body2" color="textSecondary">
											Los cálculos que guardes aparecerán aquí
										</Typography>
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
			</Stack>
		</>
	);
}

// ==============================|| MAIN COMPONENT - ALL CALCULATORS ||============================== //

const AllCalculators = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { calculators, archivedCalculators, isLoader, isInitialized, lastFetchedUserId } = useSelector((state: any) => state.calculator);
	const auth = useSelector((state: any) => state.auth);
	const userId = auth.user?._id;
	const [loading, setLoading] = useState(true);

	// Estados para confirmación y archivado
	const [deleteId, setDeleteId] = useState<string>("");
	const [deleteTitle, setDeleteTitle] = useState<string>("");
	const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
	const [openArchivedModal, setOpenArchivedModal] = useState<boolean>(false);
	const [processingArchiveAction, setProcessingArchiveAction] = useState<boolean>(false);
	const [selectedCalculatorIds, setSelectedCalculatorIds] = useState<string[]>([]);

	// Crear una referencia para la sección de calculadoras disponibles
	const calculatorsSectionRef = useRef<HTMLDivElement>(null);

	// Estado para controlar la visualización del selector de guías
	const [guideSelectorOpen, setGuideSelectorOpen] = useState(false);

	// Función para desplazarse a la sección de calculadoras
	const scrollToCalculators = () => {
		calculatorsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Función para actualizar calculadoras archivadas cuando se abre el modal
	useEffect(() => {
		if (openArchivedModal && userId) {
			dispatch(getArchivedCalculatorsByUserId(userId));
		}
	}, [openArchivedModal, userId]);

	// Fetch all calculators for the user
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);

			if (userId) {
				// Solo hacer fetch si no está inicializado o si el usuario cambió
				const shouldFetch = !isInitialized || lastFetchedUserId !== userId;

				if (shouldFetch) {
					await dispatch(getCalculatorsByUserId(userId));
					await dispatch(getArchivedCalculatorsByUserId(userId));
				}
			}

			const timer = setTimeout(() => {
				setLoading(false);
			}, 1000);

			return () => clearTimeout(timer);
		};

		fetchData();
	}, [userId, isInitialized, lastFetchedUserId]);

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
			const response = await dispatch(archiveCalculators(userId, calculatorIds));

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
			const response = await dispatch(unarchiveCalculators(userId, calculatorIds));

			if (response.success) {
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
					return <Typography>{moment(value).format("DD/MM/YYYY")}</Typography>;
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
				Cell: ({ value }) => {
					let color;

					switch (value) {
						case "Calculado":
							color = "primary";
							break;
						case "Ofertado":
							color = "success";
							break;
						case "Reclamado":
							color = "warning";
							break;
						default:
							color = "default";
					}

					return <Chip label={value} color={color as any} size="small" variant="light" />;
				},
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
				Header: "Acciones",
				accessor: "variables", // Utilizamos variables como accessor para tener acceso a la data completa
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: { row: Row<CalculatorType> }) => {
					const collapseIcon = row.isExpanded ? (
						<Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} />
					) : (
						<Eye variant="Bulk" />
					);

					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
							<Tooltip title="Ver detalles">
								<IconButton
									color="secondary"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										row.toggleRowExpanded();
									}}
									size="small"
								>
									{collapseIcon}
								</IconButton>
							</Tooltip>
							<Tooltip title="Archivar">
								<IconButton
									color="primary"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleArchiveCalculators([row.original._id]);
									}}
									size="small"
								>
									<Archive variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Eliminar">
								<IconButton
									color="error"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleDeleteCalculator(row.original._id, row.original.folderName || "Cálculo");
									}}
									size="small"
								>
									<Trash variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		[theme.palette.error.main, theme.palette.text.secondary],
	);

	// Función para manejar selección de calculadoras
	const handleSelectedRows = useCallback((selected: string[]) => {
		setSelectedCalculatorIds(selected);
	}, []);

	// Table row sub-component with details
	const renderRowSubComponent = useCallback(({ row }: { row: Row<CalculatorType> }) => <CalculationDetails data={row.original} />, []);

	return (
		<MainCard title="Cálculos Legales">
			<Container maxWidth="lg">
				{/* PRIMERO: Tabla de cálculos guardados */}
				<MainCard
					title={
						<Box display="flex" alignItems="center" gap={1}>
							<DocumentText variant="Bulk" size={20} style={{ color: theme.palette.primary.main }} />
							<Typography variant="h5">Mis cálculos guardados</Typography>
						</Box>
					}
					sx={{ mb: 4 }}
					content={false}
				>
					<ScrollX>
						<ReactTable
							columns={columns}
							data={calculators || []}
							isLoading={isLoader || loading}
							renderRowSubComponent={renderRowSubComponent}
							handleSelectedRows={handleSelectedRows}
							handleDeleteSelected={handleDeleteSelectedCalculators}
							processingAction={processingArchiveAction}
							onOpenArchivedModal={() => setOpenArchivedModal(true)}
							onArchiveCalculators={handleArchiveCalculators}
							selectedCalculatorIds={selectedCalculatorIds}
							scrollToCalculators={scrollToCalculators}
						/>
					</ScrollX>
				</MainCard>

				{/* SEGUNDO: Calculadoras disponibles */}
				<Box mb={4}>
					<Alert
						severity="info"
						icon={<Warning2 variant="Bulk" />}
						sx={{ mb: 3 }}
						action={
							<Button color="info" size="small" onClick={() => setGuideSelectorOpen(true)}>
								Ver Guía
							</Button>
						}
					>
						<AlertTitle>Herramientas para tu trabajo legal</AlertTitle>
						Accede a nuestras calculadoras especializadas para resolver diferentes tipos de cálculos legales.
					</Alert>
				</Box>

				<MainCard
					title={
						<Box display="flex" alignItems="center" gap={1}>
							<Calculator variant="Bulk" size={20} style={{ color: theme.palette.primary.main }} />
							<Typography variant="h5">Cálculos disponibles</Typography>
						</Box>
					}
					sx={{ mb: 3 }}
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
					onClose={() => setOpenArchivedModal(false)}
					items={archivedCalculators || []}
					onUnarchive={handleUnarchiveCalculators}
					loading={isLoader || processingArchiveAction}
				/>

				<AlertCalculatorDelete title={deleteTitle} open={openDeleteModal} handleClose={handleCloseDeleteModal} id={deleteId} />
			</Container>
		</MainCard>
	);
};

export default AllCalculators;
