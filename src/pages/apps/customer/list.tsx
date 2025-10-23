import React from "react";
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
// import CustomerView from "sections/apps/customer/CustomerViewFixed";
// import CustomerView from "sections/apps/customer/CustomerViewRobust";
// import CustomerView from "sections/apps/customer/CustomerViewSimple";
// import CustomerView from "sections/apps/customer/CustomerViewSimple2";
import AlertCustomerDelete from "sections/apps/customer/AlertCustomerDelete";
import ArchivedItemsModal from "sections/apps/customer/ArchivedItemsModal";
import LinkToCause from "sections/apps/customer/LinkToCause";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";

import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, UserAdd, Edit2, Eye, Trash, Link1, Archive, Box1, InfoCircle, DocumentDownload, Profile2User } from "iconsax-react";

// types
import { dispatch, useSelector } from "store";
import { getContactsByUserId, archiveContacts, getArchivedContactsByUserId, unarchiveContacts } from "store/reducers/contacts";
import { Contact } from "types/contact";
import { GuideContacts } from "components/guides";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
// import useSubscription from "hooks/useSubscription";

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
			{/* Controles FUERA del ScrollX para que siempre estén visibles */}
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
						<GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
					</Box>

					{/* Botones principales (derecha) */}
					<Stack direction={matchDownSM ? "column" : "row"} spacing={1} sx={{ width: matchDownSM ? "100%" : "auto" }}>
						<Button
							variant="contained"
							size="small"
							startIcon={<UserAdd />}
							onClick={handleAdd}
							fullWidth={matchDownSM}
						>
							Agregar Contacto
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
							<Tooltip title={Object.keys(selectedRowIds).length === 0 ? "Selecciona contactos para archivar" : ""} placement="top">
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
											? `${selectedFlatRows.length} ${selectedFlatRows.length === 1 ? "contacto" : "contactos"}`
											: "contactos"}
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
						<SortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
					</Box>

					{/* Botones secundarios (derecha) */}
					<Stack direction="row" spacing={1} alignItems="center" justifyContent={matchDownSM ? "flex-start" : "flex-end"}>
						<Tooltip title="Exportar a CSV">
							<IconButton color="primary" size="medium">
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
						<Tooltip title="Ver Guía">
							<IconButton color="success" onClick={handleOpenGuide}>
								<InfoCircle variant="Bulk" />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
			</Stack>

			{/* Tabla con ScrollX */}
			<ScrollX>
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
											<Collapse
												in={expandedRowId === row.id}
												timeout={{
													enter: 400,
													exit: 300,
												}}
												easing={{
													enter: "cubic-bezier(0.4, 0, 0.2, 1)",
													exit: "cubic-bezier(0.4, 0, 0.2, 1)",
												}}
												unmountOnExit
											>
												<Box
													sx={{
														margin: 1,
														transition: "all 0.3s ease-in-out",
													}}
												>
													{expandedRowId === row.id && renderRowSubComponent({ row, rowProps, visibleColumns, expanded })}
												</Box>
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
						<TablePagination gotoPage={gotoPage} rows={rows} setPageSize={setPageSize} pageSize={pageSize} pageIndex={pageIndex} />
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

	// Estado para el modal de límite de recursos
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [limitErrorMessage, setLimitErrorMessage] = useState("");

	// Referencias
	const mountedRef = useRef(false);
	const loadingRef = useRef(false);

	// Selectores
	const user = useSelector((state) => state.auth.user);
	const { subscription } = useSelector((state) => state.auth);
	const { contacts, archivedContacts, isLoader } = useSelector((state) => state.contacts);
	// const { getLimitLocal } = useSubscription();

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
					await dispatch(getContactsByUserId(userId));
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
			const reloadContacts = async () => {
				try {
					// Garantizar que user._id es un string
					const userId = user._id;
					if (!userId) {
						return;
					}

					loadingRef.current = true;
					await dispatch(getContactsByUserId(userId));
				} catch (error) {
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
		// Verificamos el límite de contactos usando los datos en el estado global de auth
		if (subscription && subscription.limits && contacts) {
			const maxContacts = subscription.limits.maxContacts;
			const currentContactCount = contacts.length;

			// Si el número de contactos es igual o superior al límite, mostrar modal de error
			if (maxContacts !== undefined && currentContactCount >= maxContacts) {
				// Configuramos la información para el modal de error
				setLimitErrorInfo({
					resourceType: "Contactos",
					plan: subscription.plan,
					currentCount: `${currentContactCount}`,
					limit: maxContacts,
				});
				setLimitErrorMessage("Has alcanzado el límite de contactos disponibles en tu plan actual.");
				setLimitErrorOpen(true);
				return;
			}
		}

		// Si no se ha alcanzado el límite, mostramos el modal normal
		setAdd(true);
		setAddCustomerMode("add");
		setCustomer(null);
	}, [subscription, contacts]);

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
				return;
			}

			loadingRef.current = true;
			await dispatch(getContactsByUserId(userId, true)); // forceRefresh=true para recargar después de cambios
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
				return;
			}

			loadingRef.current = true;
			await dispatch(getArchivedContactsByUserId(userId));
			setArchivedModalOpen(true);
		} catch (error) {
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

	// Manejador para cerrar el modal de límite de error
	const handleCloseLimitErrorModal = useCallback(() => {
		setLimitErrorOpen(false);
	}, []);

	const handleUnarchiveSelected = useCallback(
		async (contactIds: string[]) => {
			if (!user?._id || contactIds.length === 0 || loadingRef.current) return;

			// Garantizar que user._id es un string
			const userId = user._id;
			if (!userId) {
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
					const isExpanded = expandedRowId === row.id;
					const collapseIcon = isExpanded ? (
						<Add
							style={{
								color: theme.palette.error.main,
								transform: "rotate(45deg)",
								transition: "transform 0.3s ease-in-out",
							}}
						/>
					) : (
						<Eye
							variant="Bulk"
							style={{
								transition: "transform 0.3s ease-in-out",
							}}
						/>
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
										})
									}
									sx={{
										transition: "all 0.3s ease-in-out",
										"&:hover": {
											transform: "scale(1.1)",
										},
									}}
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
			// Usar directamente row.original que ya contiene los datos completos del contacto
			// No es necesario buscar en contacts porque row.original ya tiene la información

			return <CustomerView data={row.original} />;
		},
		[], // No necesitamos dependencias ya que usamos row.original directamente
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
			<DowngradeGracePeriodAlert />
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
					sx={{
						"& .MuiDialog-paper": {
							p: 0,
							display: "flex",
							flexDirection: "column",
							maxHeight: "90vh",
						},
					}}
				>
					<AddCustomer open={add} customer={customer} mode={addCustomerMode} onCancel={handleCloseDialog} onAddMember={handleRefreshData} />
				</Dialog>
			)}

			{/* El componente AddCustomer manejará el LimitErrorModal independientemente */}

			<Dialog maxWidth="md" TransitionComponent={PopupTransition} keepMounted fullWidth open={link} sx={{ "& .MuiDialog-paper": { p: 0 } }}>
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

			{/* Modal de límite de recursos */}
			<LimitErrorModal
				open={limitErrorOpen}
				onClose={handleCloseLimitErrorModal}
				message={limitErrorMessage}
				limitInfo={limitErrorInfo}
				upgradeRequired={true}
			/>
		</MainCard>
	);
};

export default CustomerListPage;
