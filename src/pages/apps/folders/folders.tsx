import { useCallback, useEffect, useMemo, useState, Fragment, MouseEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
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
	Box,
	Typography,
	Collapse,
} from "@mui/material";

import {
	useFilters,
	useExpanded,
	useGlobalFilter,
	useRowSelect,
	useSortBy,
	useTable,
	usePagination,
	HeaderGroup,
	Row,
	Cell,
	HeaderProps,
} from "react-table";

// project-imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import IconButton from "components/@extended/IconButton";
import { PopupTransition } from "components/@extended/Transitions";
import { IndeterminateCheckbox, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import { CSVLink } from "react-csv";

import AddFolder from "sections/apps/folders/AddFolder";
import FolderView from "sections/apps/folders/FolderView";
import AlertFolderDelete from "sections/apps/folders/AlertFolderDelete";

import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, FolderOpen, FolderAdd, Edit, Eye, Trash, Maximize, Archive, Box1, InfoCircle, DocumentDownload } from "iconsax-react";

// types
import { dispatch, useSelector } from "store";
import { getFoldersByUserId, archiveFolders, getArchivedFoldersByUserId, unarchiveFolders } from "store/reducers/folder";
import { Folder, Props } from "types/folders";
import moment from "moment";

// sections
import ArchivedItemsModal from "sections/apps/customer/ArchivedItemsModal";
import { GuideFolders } from "components/guides";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
// ==============================|| REACT TABLE ||============================== //

interface ReactTableProps extends Props {
	expandedRowId?: string | null;
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
}: ReactTableProps) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [isColumnsReady, setIsColumnsReady] = useState(false);

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "folderName", desc: false };

	const defaultHiddenColumns = useMemo(
		() =>
			matchDownSM
				? ["_id", "email", "status", "description", "initialDateFolder", "finalDateFolder", "folderJuris.label", "folderFuero"]
				: ["email", "_id", "description", "finalDateFolder"],
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
		state: { globalFilter, selectedRowIds, pageIndex, pageSize, expanded },
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
	);

	useEffect(() => {
		setHiddenColumns(defaultHiddenColumns);
		setIsColumnsReady(true);

		return () => {
			setIsColumnsReady(false);
		};
	}, [setHiddenColumns, defaultHiddenColumns]);

	if (!isColumnsReady || isLoading) {
		return (
			<>
				<TableRowSelection selected={0} />
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
			<TableRowSelection selected={Object.keys(selectedRowIds).length} />
			<Stack spacing={3}>
				<Stack
					direction={matchDownSM ? "column" : "row"}
					spacing={2}
					justifyContent="space-between"
					alignItems={matchDownSM ? "flex-start" : "flex-start"}
					sx={{ p: 3, pb: 0 }}
				>
					{/* Lado izquierdo - Filtro y ordenamiento */}
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "300px" }}>
						{/* Primera línea: Barra de búsqueda */}
						<GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

						{/* Segunda línea: Selector de ordenamiento */}
						<SortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
					</Stack>

					{/* Lado derecho - Botones de acción */}
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "auto" }}>
						{/* Primera línea: Agregar Causa, Ver Archivados, Archivar seleccionados */}
						<Stack
							direction={matchDownSM ? "column" : "row"}
							alignItems="center"
							spacing={2}
							sx={{
								width: "100%",
								justifyContent: matchDownSM ? "flex-start" : "flex-end",
							}}
						>
							{/* Acción principal */}
							<Button variant="contained" startIcon={<FolderAdd />} onClick={handleAdd} size="small">
								Agregar Causa
							</Button>

							{/* Botón para ver elementos archivados */}
							<Button
								variant="outlined"
								color="secondary"
								startIcon={<Box1 />}
								onClick={handleOpenArchivedModal}
								size="small"
								sx={{
									borderWidth: "1px",
								}}
							>
								Ver Archivados
							</Button>

							{/* Botón para archivar seleccionados */}
							{handleArchiveSelected && (
								<Tooltip title={Object.keys(selectedRowIds).length === 0 ? "Selecciona causas para archivar" : ""} placement="top">
									<span>
										<Button
											variant="outlined"
											color="primary"
											startIcon={<Archive />}
											onClick={() => handleArchiveSelected(selectedFlatRows)}
											size="small"
											disabled={Object.keys(selectedRowIds).length === 0}
											sx={{
												borderWidth: "1px",
												"&.Mui-disabled": {
													borderColor: "rgba(0, 0, 0, 0.12)",
													color: "text.disabled",
												},
											}}
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

						{/* Segunda línea: Exportación CSV y Ver Guía */}
						<Stack
							direction={matchDownSM ? "column" : "row"}
							alignItems="center"
							spacing={2}
							sx={{
								width: "100%",
								justifyContent: matchDownSM ? "flex-start" : "flex-end",
							}}
						>
							{/* Exportación CSV personalizada */}
							<Tooltip title="Exportar a CSV">
								<IconButton
									color="primary"
									size="medium"
									sx={{
										position: "relative",
									}}
								>
									<CSVLink
										data={selectedFlatRows.length > 0 ? selectedFlatRows.map((d: Row) => d.original) : data}
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

							{/* Botón para ver la guía */}
							<Tooltip title="Ver Guía">
								<IconButton color="success" onClick={handleOpenGuide}>
									<InfoCircle variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>
				</Stack>
				<Table {...getTableProps()}>
					<TableHead>
						{headerGroups.map((headerGroup: HeaderGroup<{}>) => (
							<TableRow {...headerGroup.getHeaderGroupProps()} sx={{ "& > th:first-of-type": { width: "40px" } }}>
								{headerGroup.headers.map((column: HeaderGroup) => (
									<TableCell {...column.getHeaderProps([{ className: column.className }])}>
										<HeaderSort column={column} sort />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody {...getTableBodyProps()}>
						{page.map((row: Row, i: number) => {
							prepareRow(row);
							const rowProps = row.getRowProps();
							return (
								<Fragment key={i}>
									<TableRow
										{...row.getRowProps()}
										onClick={() => {
											row.toggleRowSelected();
										}}
										sx={{
											cursor: "pointer",
											bgcolor: row.isSelected ? alpha(theme.palette.primary.lighter, 0.35) : "inherit",
										}}
									>
										{row.cells.map((cell: Cell) => (
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
				{page.length > 0 && (
					<TableRow sx={{ "&:hover": { bgcolor: "transparent !important" } }}>
						<TableCell sx={{ p: 2, py: 3 }} colSpan={9}>
							<TablePagination gotoPage={gotoPage} rows={rows} setPageSize={setPageSize} pageSize={pageSize} pageIndex={pageIndex} />
						</TableCell>
					</TableRow>
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
							No hay causas creadas. Puedes crear una usando el botón 'Agregar Causa'.
						</Typography>
						<Typography variant="body2" color="textSecondary" align="center">
							Las causas que guardes aparecerán aquí
						</Typography>
					</Box>
				)}
			</Stack>
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

	// Referencias
	const mountedRef = useRef(false);
	const loadingRef = useRef(false);

	// Selectores
	const user = useSelector((state) => state.auth.user);
	const { folders, archivedFolders, isLoader } = useSelector((state) => state.folder);
	const subscription = useSelector((state) => state.auth.subscription);

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
					await dispatch(getFoldersByUserId(userId));
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
					await dispatch(getFoldersByUserId(userId));
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
		if (currentFolderCount >= maxFolders) {
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

	const handleRefreshData = useCallback(async () => {
		if (!user?._id || loadingRef.current) return;

		try {
			loadingRef.current = true;
			await dispatch(getFoldersByUserId(user._id));
		} finally {
			loadingRef.current = false;
		}
	}, [user?._id]);

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

	// Columnas memoizadas
	const columns = useMemo(
		() => [
			{
				title: "Row Selection",
				Header: ({ getToggleAllPageRowsSelectedProps }: HeaderProps<{}>) => (
					<IndeterminateCheckbox indeterminate {...getToggleAllPageRowsSelectedProps()} />
				),
				accessor: "selection",
				Cell: ({ row }: any) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />,
				disableSortBy: true,
			},
			{
				Header: "Id",
				accessor: "_id",
				className: "cell-center",
			},
			{
				Header: "Carátula",
				accessor: "folderName",
				Cell: ({ value }: { value: any }) => {
					if (value === "Pendiente") {
						return (
							<Stack direction="row" alignItems="center" spacing={1}>
								<Chip color="warning" label="Pendiente de verificación" size="small" variant="light" />
							</Stack>
						);
					}
					return <span style={{ textTransform: "uppercase" }}>{value}</span>;
				},
			},
			{
				Header: "Materia",
				accessor: "materia",
				Cell: ({ value }: { value: any }) => {
					if (!value) return null;

					// Lista de palabras que no deben capitalizarse (excepto si son la primera palabra)
					const lowerCaseWords = ["de", "y", "para", "inc.", "por", "el", "la", "los", "del", "por", "a", "las"];

					// Convierte todo a minúsculas primero
					const lowercaseValue = value.toLowerCase();

					// Divide en palabras
					const words = lowercaseValue.split(" ");

					// Capitaliza cada palabra según las reglas
					const formattedWords = words.map((word: string, index: number) => {
						// Si es la primera palabra o no está en la lista de excepciones,
						// capitaliza su primera letra
						if (index === 0 || !lowerCaseWords.includes(word)) {
							return word.charAt(0).toUpperCase() + word.slice(1);
						}
						// Si está en la lista de excepciones, la deja en minúsculas
						return word;
					});

					// Une las palabras de nuevo
					const formattedValue = formattedWords.join(" ");

					return <span>{formattedValue}</span>;
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
							const parsedDate = moment(value);
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
							const parsedDate = moment(value);
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
				accessor: "folderJuris.label",
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
						case "Finalizada":
							return <Chip color="error" label="Finalizada" size="small" variant="light" />;
						case "Nueva":
							return <Chip color="success" label="Nueva" size="small" variant="light" />;
						case "En proceso":
						default:
							return <Chip color="info" label="En proceso" size="small" variant="light" />;
					}
				},
			},
			{
				Header: "Acciones",
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: { row: Row<{}> }) => {
					const collapseIcon =
						expandedRowId === row.id ? (
							<Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} />
						) : (
							<Eye variant="Bulk" />
						);

					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
							<Tooltip title="Ver">
								<IconButton
									color="secondary"
									onClick={(e) =>
										handleRowAction(e, () => {
											handleToggleExpanded(row.id);
											row.toggleRowExpanded();
										})
									}
								>
									{collapseIcon}
								</IconButton>
							</Tooltip>
							<Tooltip title="Editar">
								<IconButton color="primary" onClick={(e) => handleRowAction(e, () => handleEditContact(row.values))}>
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
							<Tooltip title="Abrir">
								<IconButton color="success" onClick={(e) => handleRowAction(e, () => navigate(`../details/${row.values._id}`))}>
									<Maximize variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		[theme, mode, handleEditContact, handleClose, navigate, handleRowAction, expandedRowId, handleToggleExpanded],
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
		<MainCard content={false}>
			<ScrollX>
				<ReactTable
					columns={columns}
					data={folders}
					handleAdd={handleAddFolder}
					handleArchiveSelected={handleArchiveSelected}
					handleOpenGuide={handleOpenGuide}
					handleOpenArchivedModal={handleOpenArchivedModal}
					renderRowSubComponent={renderRowSubComponent}
					isLoading={isLoader}
					expandedRowId={expandedRowId}
				/>
			</ScrollX>
			<AlertFolderDelete title={folderDeleteId} open={open} handleClose={handleClose} id={folderId} onDelete={handleRefreshData} />
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
							height: "80vh",
							maxHeight: "80vh",
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
						},
					}}
				>
					<AddFolder open={add} folder={folder} mode={addFolderMode} onCancel={handleCloseDialog} onAddFolder={handleRefreshData} />
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
	);
};

export default FoldersLayout;
