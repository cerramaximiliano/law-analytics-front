import { useCallback, useEffect, useMemo, useState, Fragment, MouseEvent, useRef } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Button,
	Dialog,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
	useMediaQuery,
	Skeleton,
	Snackbar,
	Alert,
	Box,
	Collapse,
} from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";
import {
	useFilters,
	useExpanded,
	useGlobalFilter,
	useRowSelect,
	useSortBy,
	useTable,
	usePagination,
	Column,
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
import { HeaderSort, IndeterminateCheckbox, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import { CSVLink } from "react-csv";

import AddCustomer from "sections/apps/customer/AddCustomer";
import CustomerView from "sections/apps/customer/CustomerView";
import AlertCustomerDelete from "sections/apps/customer/AlertCustomerDelete";
import ArchivedItemsModal from "sections/apps/customer/ArchivedItemsModal";
import LinkToCause from "sections/apps/customer/LinkToCause";

import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, UserAdd, Edit2, Eye, Trash, Link1, Archive, Box1, InfoCircle, DocumentDownload, Profile2User } from "iconsax-react";

// types
import { dispatch, useSelector } from "store";
import { getContactsByUserId, archiveContacts, getArchivedContactsByUserId, unarchiveContacts } from "store/reducers/contacts";
import { Contact } from "types/contact";
import { GuideContacts } from "components/guides";

// ==============================|| REACT TABLE ||============================== //

interface Props {
	columns: Column<Contact>[];
	data: Contact[];
	renderRowSubComponent: (props: { row: Row<Contact>; rowProps: any; visibleColumns: any; expanded: any }) => React.ReactNode;
	handleAdd: () => void;
	handleArchiveSelected?: (selectedRows: Row<Contact>[]) => void;
	isLoading?: boolean;
	handleOpenArchivedModal: () => void;
	handleOpenGuide: () => void;
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
	expandedRowId: parentExpandedRowId,
}: Props) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [isColumnsReady, setIsColumnsReady] = useState(false);

	// Use parent expanded row ID
	const expandedRowId = parentExpandedRowId ?? null;

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "name", desc: false };

	const defaultHiddenColumns = useMemo(
		() =>
			matchDownSM
				? [
						"email",
						"lastName",
						"_id",
						"address",
						"status",
						"state",
						"zipCode",
						"nationality",
						"document",
						"cuit",
						"activity",
						"company",
						"fiscal",
						"folderIds",
				  ]
				: [
						"email",
						"lastName",
						"_id",
						"address",
						"state",
						"zipCode",
						"nationality",
						"document",
						"cuit",
						"activity",
						"company",
						"fiscal",
						"folderIds",
				  ],
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
	}: any = useTable(
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
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "auto" }}>
						{/* Primera línea: Barra de búsqueda */}
						<GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

						{/* Segunda línea: Selector de ordenamiento */}
						<SortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
					</Stack>

					{/* Lado derecho - Botones de acción */}
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "auto" }}>
						{/* Primera línea: Agregar Contacto, Ver Archivados, Archivar seleccionados */}
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
							<Button variant="contained" startIcon={<UserAdd />} onClick={handleAdd} size="small">
								Agregar Contacto
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
								<Tooltip title={Object.keys(selectedRowIds).length === 0 ? "Selecciona contactos para archivar" : ""} placement="top">
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
												? `${selectedFlatRows.length} ${selectedFlatRows.length === 1 ? "contacto" : "contactos"}`
												: "contactos"}
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
										data={selectedFlatRows.length > 0 ? selectedFlatRows.map((d: Row<Contact>) => d.original) : data}
										filename={"contactos.csv"}
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
						{headerGroups.map((headerGroup: HeaderGroup<Contact>) => (
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
						{page.map((row: Row<Contact>, i: number) => {
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
										{row.cells.map((cell: Cell<Contact>) => (
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
						<Profile2User
							variant="Bulk"
							size={64}
							style={{
								marginBottom: "16px",
								color: theme.palette.primary.main,
								opacity: 0.7,
							}}
						/>
						<Typography variant="h5" gutterBottom align="center">
							No hay contactos creados. Puedes crear uno usando el botón 'Agregar Contacto'.
						</Typography>
						<Typography variant="body2" color="textSecondary" align="center">
							Los contactos que guardes aparecerán aquí
						</Typography>
					</Box>
				)}
			</Stack>
		</>
	);
}

// ==============================|| CUSTOMER - LIST ||============================== //

const CustomerListPage = () => {
	const theme = useTheme();
	const mode = theme.palette.mode;

	// Estados
	const [open, setOpen] = useState(false);
	const [customer, setCustomer] = useState<any>(null);
	const [customerDeleteId, setCustomerDeleteId] = useState("");
	const [customerId, setCustomerId] = useState("");
	const [folderIds, setFolderIds] = useState<string[]>([]);
	const [add, setAdd] = useState(false);
	const [link, setLink] = useState(false);
	const [addCustomerMode, setAddCustomerMode] = useState<"add" | "edit">("add");
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
	const { contacts, archivedContacts, isLoader } = useSelector((state) => state.contacts);

	// Efecto para la carga inicial
	useEffect(() => {
		// Solo ejecutar en el primer montaje
		if (!mountedRef.current) {
			mountedRef.current = true;

			const initialLoad = async () => {
				// Si no hay usuario, establecer isInitialLoad a false para mostrar la UI vacía
				if (!user?._id) {
					console.log("No hay usuario disponible, mostrando UI vacía");
					setIsInitialLoad(false);
					return;
				}

				if (loadingRef.current) return;

				try {
					console.log("Cargando contactos para el usuario:", user._id);
					// Garantizar que user._id es un string
					const userId = user._id;
					if (!userId) {
						console.error("User ID no disponible para cargar contactos");
						return;
					}

					loadingRef.current = true;
					await dispatch(getContactsByUserId(userId));
				} catch (error) {
					console.error("Error loading contacts:", error);
				} finally {
					loadingRef.current = false;
					setIsInitialLoad(false);
					console.log("Carga inicial de contactos completada");
				}
			};

			initialLoad();
		}

		// Este efecto también debe ejecutarse cuando cambia el usuario después del login
		if (user?._id && !loadingRef.current && mountedRef.current) {
			console.log("Usuario cambió después del montaje, recargando contactos");
			const reloadContacts = async () => {
				try {
					// Garantizar que user._id es un string
					const userId = user._id;
					if (!userId) {
						console.error("User ID no disponible para recargar contactos");
						return;
					}

					loadingRef.current = true;
					await dispatch(getContactsByUserId(userId));
				} catch (error) {
					console.error("Error reloading contacts after user change:", error);
				} finally {
					loadingRef.current = false;
					setIsInitialLoad(false);
				}
			};

			reloadContacts();
		}

		return () => {
			mountedRef.current = false;
			loadingRef.current = false;
		};
	}, [user?._id]);

	// Handlers
	const handleCloseDialog = useCallback(() => {
		setAdd(false);
	}, []);

	const handleOpenLink = useCallback(() => {
		setLink(true);
	}, []);

	const handleCloseLink = useCallback(() => {
		setLink(false);
	}, []);

	const handleAddContact = useCallback(() => {
		setAdd(true);
		setAddCustomerMode("add");
		setCustomer(null);
	}, []);

	const handleEditContact = useCallback((contactData: any) => {
		setAdd(true);
		setAddCustomerMode("edit");
		setCustomer(contactData);
	}, []);

	const handleClose = useCallback(() => {
		setOpen((prev) => !prev);
	}, []);

	const handleRefreshData = useCallback(async () => {
		if (!user?._id || loadingRef.current) return;

		try {
			// Garantizar que user._id es un string
			const userId = user._id;
			if (!userId) {
				console.error("User ID no disponible para refrescar datos");
				return;
			}

			loadingRef.current = true;
			await dispatch(getContactsByUserId(userId));
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
		async (selectedRows: Row<Contact>[]) => {
			if (!user?._id || selectedRows.length === 0 || loadingRef.current) return;

			// Garantizar que user._id es un string
			const userId = user._id;
			if (!userId) {
				console.error("User ID no disponible para archivar contactos");
				return;
			}

			const contactIds = selectedRows.map((row) => row.original._id);

			try {
				loadingRef.current = true;
				const result = await dispatch(archiveContacts(userId, contactIds));

				if (result.success) {
					setSnackbarMessage(
						`${contactIds.length} ${contactIds.length === 1 ? "contacto archivado" : "contactos archivados"} correctamente`,
					);
					setSnackbarSeverity("success");
				} else {
					setSnackbarMessage(result.message || "Error al archivar contactos");
					setSnackbarSeverity("error");
				}

				setSnackbarOpen(true);
			} catch (error) {
				console.error("Error al archivar contactos:", error);
				setSnackbarMessage("Error al archivar contactos");
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
			// Garantizar que user._id es un string
			const userId = user._id;
			if (!userId) {
				console.error("User ID no disponible para obtener contactos archivados");
				return;
			}

			loadingRef.current = true;
			await dispatch(getArchivedContactsByUserId(userId));
			setArchivedModalOpen(true);
		} catch (error) {
			console.error("Error al obtener contactos archivados:", error);
			setSnackbarMessage("Error al obtener contactos archivados");
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
		async (contactIds: string[]) => {
			if (!user?._id || contactIds.length === 0 || loadingRef.current) return;

			// Garantizar que user._id es un string
			const userId = user._id;
			if (!userId) {
				console.error("User ID no disponible para desarchivar contactos");
				return;
			}

			try {
				setLoadingUnarchive(true);
				const result = await dispatch(unarchiveContacts(userId, contactIds));

				if (result.success) {
					setSnackbarMessage(
						`${contactIds.length} ${contactIds.length === 1 ? "contacto desarchivado" : "contactos desarchivados"} correctamente`,
					);
					setSnackbarSeverity("success");
					setArchivedModalOpen(false);
				} else {
					setSnackbarMessage(result.message || "Error al desarchivar contactos");
					setSnackbarSeverity("error");
				}

				setSnackbarOpen(true);
			} catch (error) {
				console.error("Error al desarchivar contactos:", error);
				setSnackbarMessage("Error al desarchivar contactos");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			} finally {
				setLoadingUnarchive(false);
			}
		},
		[user?._id],
	);

	// Create a callback to toggle expansion
	const handleToggleExpanded = useCallback((rowId: string) => {
		setExpandedRowId((prev) => (prev === rowId ? null : rowId));
	}, []);

	// Columnas memoizadas
	const columns = useMemo<Column<Contact>[]>(
		() => [
			{
				id: "selection",
				Header: ({ getToggleAllPageRowsSelectedProps }: HeaderProps<Contact>) => (
					<IndeterminateCheckbox indeterminate {...getToggleAllPageRowsSelectedProps()} />
				),
				Cell: ({ row }: any) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />,
				className: "cell-center",
				disableSortBy: true,
			},
			{
				Header: "Id",
				accessor: "_id",
				className: "cell-center",
			},
			{
				Header: "Nombre",
				accessor: "name",
				Cell: ({ row }: any) => {
					const { original } = row;
					return (
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Stack spacing={0}>
								<Typography variant="subtitle1">{`${original.name || ""} ${original.lastName || ""}`}</Typography>
								<Typography color="text.secondary">{original.email || ""}</Typography>
							</Stack>
						</Stack>
					);
				},
			},
			{
				Header: "Email",
				accessor: "email",
			},
			{
				Header: "Nacionalidad",
				accessor: "nationality",
			},
			{
				Header: "DNI",
				accessor: "document",
			},
			{
				Header: "CUIT/CUIL",
				accessor: "cuit",
			},
			{
				Header: "Actividad",
				accessor: "activity",
			},
			{
				Header: "Empresa",
				accessor: "company",
			},
			{
				Header: "Fiscal",
				accessor: "fiscal",
			},
			{
				Header: "Provincia",
				accessor: "state",
			},
			{
				Header: "Código Postal",
				accessor: "zipCode",
			},
			{
				Header: "Rol",
				accessor: "role",
				Cell: ({ value }: any) => <Typography>{value || ""}</Typography>,
			},
			{
				Header: "Apellido",
				accessor: "lastName",
			},
			{
				Header: "Teléfono",
				accessor: "phone",
				Cell: ({ value }: any) => <PatternFormat displayType="text" format="+54 (###) ###-####" mask="_" defaultValue={value || ""} />,
			},
			{
				Header: "Ciudad",
				accessor: "city",
				Cell: ({ value }: any) => <Typography>{value || ""}</Typography>,
			},
			{
				Header: "Domicilio",
				accessor: "address",
			},
			{
				Header: "Estado",
				accessor: "status",
				Cell: ({ value }: any) => <Typography>{value || ""}</Typography>,
			},
			{
				Header: "Tipo",
				accessor: "type",
				Cell: ({ value }: any) => <Typography>{value || ""}</Typography>,
			},
			{
				Header: "folderIds",
				accessor: "folderIds",
			},
			{
				Header: "Acciones",
				id: "actions",
				Cell: ({ row }: any) => {
					const collapseIcon =
						expandedRowId === row.id ? (
							<Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} />
						) : (
							<Eye variant="Bulk" />
						);

					// Usar original que contiene los datos completos sin ambigüedades
					const { original } = row;

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
							<Tooltip title="Vincular">
								<IconButton
									color="success"
									onClick={(e) =>
										handleRowAction(e, () => {
											setCustomerId(original._id);
											setFolderIds(original.folderIds || []);
											handleOpenLink();
										})
									}
								>
									<Link1 variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Editar">
								<IconButton color="primary" onClick={(e) => handleRowAction(e, () => handleEditContact(original))}>
									<Edit2 variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Eliminar">
								<IconButton
									color="error"
									onClick={(e) =>
										handleRowAction(e, () => {
											handleClose();
											setCustomerDeleteId(`${original.name || ""} ${original.lastName || ""}`);
											setCustomerId(original._id);
										})
									}
								>
									<Trash variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
				className: "cell-center",
				disableSortBy: true,
			},
		],
		[theme, mode, handleEditContact, handleClose, handleOpenLink, handleRowAction, expandedRowId, handleToggleExpanded],
	);

	// Row sub component memoizado
	const renderRowSubComponent = useCallback(
		({ row }: { row: Row<Contact>; rowProps: any; visibleColumns: any; expanded: any }) => {
			const contactData = contacts.find((c: Contact) => c._id === row.original._id);
			return contactData ? <CustomerView data={contactData} /> : null;
		},
		[contacts],
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
					data={contacts}
					handleAdd={handleAddContact}
					handleArchiveSelected={handleArchiveSelected}
					handleOpenArchivedModal={handleOpenArchivedModal}
					handleOpenGuide={handleOpenGuide}
					renderRowSubComponent={renderRowSubComponent}
					isLoading={isLoader}
					expandedRowId={expandedRowId}
				/>
			</ScrollX>
			<AlertCustomerDelete title={customerDeleteId} open={open} handleClose={handleClose} id={customerId} onDelete={handleRefreshData} />
			{add && (
				<Dialog
					maxWidth="sm"
					TransitionComponent={PopupTransition}
					keepMounted
					fullWidth
					open={add}
					sx={{ "& .MuiDialog-paper": { p: 0 } }}
				>
					<AddCustomer open={add} customer={customer} mode={addCustomerMode} onCancel={handleCloseDialog} onAddMember={handleRefreshData} />
				</Dialog>
			)}

			{/* El componente AddCustomer manejará el LimitErrorModal independientemente */}

			<Dialog maxWidth="sm" TransitionComponent={PopupTransition} keepMounted fullWidth open={link} sx={{ "& .MuiDialog-paper": { p: 0 } }}>
				<LinkToCause openLink={link} onCancelLink={handleCloseLink} contactId={customerId} folderIds={folderIds} />
			</Dialog>

			{/* Modal para elementos archivados */}
			<ArchivedItemsModal
				open={archivedModalOpen}
				onClose={handleCloseArchivedModal}
				title="Contactos Archivados"
				items={archivedContacts || []}
				onUnarchive={handleUnarchiveSelected}
				loading={loadingUnarchive}
				itemType="contacts"
			/>

			{/* Guía de contactos */}
			<GuideContacts open={guideOpen} onClose={() => setGuideOpen(false)} />

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

export default CustomerListPage;
