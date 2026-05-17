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
import { Add, UserAdd, Edit2, Eye, Trash, Link1, Archive, Box1, InfoCircle, DocumentDownload, Profile2User, More } from "iconsax-react";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

// types
import { dispatch, useSelector } from "store";
import {
	getContactsByUserId,
	getContactsByGroupId,
	archiveContacts,
	getArchivedContactsByUserId,
	getArchivedContactsByGroupId,
	unarchiveContacts,
} from "store/reducers/contacts";
import { useTeam } from "contexts/TeamContext";
import { Contact } from "types/contact";
import { GuideContacts } from "components/guides";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import { ResourceUsageBar } from "sections/widget/chart/ResourceUsageWidget";
import { BRAND_BLUE } from "themes/dashboardTokens";
// import useSubscription from "hooks/useSubscription";

// ==============================|| REACT TABLE ||============================== //

interface Props {
	columns: Column<Contact>[];
	data: Contact[];
	renderRowSubComponent: (props: { row: Row<Contact>; rowProps: any; visibleColumns: any; expanded: any }) => React.ReactNode;
	handleAdd?: () => void;
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
	const isDark = theme.palette.mode === "dark";
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const [isColumnsReady, setIsColumnsReady] = useState(false);
	const csvLinkRef = useRef<any>(null);

	// Overflow menu (CSV + Guía) — patrón compartido con folders/list.
	const [overflowAnchor, setOverflowAnchor] = useState<null | HTMLElement>(null);
	const overflowOpen = Boolean(overflowAnchor);
	const handleOverflowOpen = (e: MouseEvent<HTMLElement>) => setOverflowAnchor(e.currentTarget);
	const handleOverflowClose = () => setOverflowAnchor(null);

	// Use parent expanded row ID
	const expandedRowId = parentExpandedRowId ?? null;

	// Estilo brand-aware de la tabla — scoped a esta tabla, no toca el theme
	// global de MuiTable. Mismo lenguaje que el redesign de folders/list.
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

	const iconBtnBrandSx = {
		color: "text.secondary",
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	} as const;

	const ghostOutlinedBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.16),
		transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.32),
		},
	} as const;

	// Lenguaje brand-aware compartido para inputs (search + sort).
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

	const csvHeaders = [
		{ label: "Nombre", key: "name" },
		{ label: "Apellido", key: "lastName" },
		{ label: "Rol", key: "role" },
		{ label: "Tipo", key: "type" },
		{ label: "Email", key: "email" },
		{ label: "Teléfono", key: "phone" },
		{ label: "Dirección", key: "address" },
		{ label: "Ciudad", key: "city" },
		{ label: "Provincia", key: "state" },
		{ label: "Código Postal", key: "zipCode" },
		{ label: "Nacionalidad", key: "nationality" },
		{ label: "Documento", key: "document" },
		{ label: "CUIT", key: "cuit" },
		{ label: "Estado", key: "status" },
		{ label: "Actividad", key: "activity" },
		{ label: "Empresa", key: "company" },
		{ label: "Fiscal", key: "fiscal" },
	];

	const csvData = useMemo(() => {
		const sourceRows = selectedFlatRows.length > 0 ? selectedFlatRows.map((d: Row<Contact>) => d.original) : data;
		return sourceRows.map((contact: Contact) => ({
			name: contact.name || "",
			lastName: contact.lastName || "",
			role: Array.isArray(contact.role) ? contact.role.join(", ") : contact.role || "",
			type: contact.type || "",
			email: contact.email || "",
			phone: contact.phone || "",
			address: contact.address || "",
			city: contact.city || "",
			state: contact.state || "",
			zipCode: contact.zipCode || "",
			nationality: contact.nationality || "",
			document: contact.document || "",
			cuit: contact.cuit || "",
			status: contact.status || "",
			activity: contact.activity || "",
			company: contact.company || "",
			fiscal: contact.fiscal || "",
		}));
	}, [selectedFlatRows, data]);

	if (!isColumnsReady || isLoading) {
		return (
			<>
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

	return (
		<>
			{/* Controles FUERA del ScrollX para que siempre estén visibles */}
			<Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
				{matchDownSM ? (
					/* ── MOBILE TOOLBAR ── */
					<Stack spacing={1.5}>
						{/* Fila 1: Buscador (acción primaria de filtrado) */}
						<Box sx={brandedInputSx}>
							<GlobalFilter
								preGlobalFilteredRows={preGlobalFilteredRows}
								globalFilter={globalFilter}
								setGlobalFilter={setGlobalFilter}
							/>
						</Box>

						{/* Fila 2: Agregar contacto + overflow */}
						<Stack direction="row" spacing={1} alignItems="center">
							{handleAdd && (
								<Button
									variant="contained"
									size="small"
									startIcon={<UserAdd />}
									onClick={handleAdd}
									sx={{ ...brandPrimaryButtonSx, flex: 1 }}
									data-testid="contacts-add-btn"
								>
									Agregar contacto
								</Button>
							)}
							<Tooltip title="Más opciones">
								<IconButton size="small" onClick={handleOverflowOpen} aria-label="Más opciones" sx={iconBtnBrandSx}>
									<More variant="Bulk" size={20} />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>
				) : (
					/* ── DESKTOP TOOLBAR ── (una sola fila) */
					<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
						{/* Grupo 1: Acción principal */}
						{handleAdd && (
							<Button
								variant="contained"
								size="small"
								startIcon={<UserAdd />}
								onClick={handleAdd}
								sx={brandPrimaryButtonSx}
								data-testid="contacts-add-btn"
							>
								Agregar contacto
							</Button>
						)}

						{/* Grupo 2: Gestión de archivados */}
						<Stack direction="row" spacing={1}>
							<Button
								variant="outlined"
								size="small"
								startIcon={<Box1 size={18} />}
								onClick={handleOpenArchivedModal}
								sx={ghostOutlinedBtnSx}
							>
								Archivados
							</Button>
							{handleArchiveSelected && (
								<Tooltip
									title={Object.keys(selectedRowIds).length === 0 ? "Seleccioná al menos un contacto para archivar" : ""}
									placement="top"
								>
									<span>
										<Button
											variant="outlined"
											size="small"
											startIcon={<Archive size={18} />}
											onClick={() => handleArchiveSelected(selectedFlatRows)}
											disabled={Object.keys(selectedRowIds).length === 0}
											sx={ghostOutlinedBtnSx}
										>
											{Object.keys(selectedRowIds).length > 0 ? `Archivar (${selectedFlatRows.length})` : "Archivar"}
										</Button>
									</span>
								</Tooltip>
							)}
						</Stack>

						{/* Grupo 3: Sort */}
						<Box sx={{ minWidth: 200, ...brandedInputSx }}>
							<SortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
						</Box>

						{/* Grupo 4: Búsqueda y utilidades — alineado a la derecha */}
						<Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, justifyContent: "flex-end" }}>
							<Box sx={{ width: 220, ...brandedInputSx }}>
								<GlobalFilter
									preGlobalFilteredRows={preGlobalFilteredRows}
									globalFilter={globalFilter}
									setGlobalFilter={setGlobalFilter}
								/>
							</Box>
							<Tooltip title="Más opciones">
								<IconButton size="small" onClick={handleOverflowOpen} aria-label="Más opciones" sx={iconBtnBrandSx}>
									<More variant="Bulk" size={20} />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>
				)}

				{/* CSV link siempre montado (hidden, lo dispara el menu overflow) */}
				<CSVLink ref={csvLinkRef} data={csvData} headers={csvHeaders} filename={"contactos.csv"} style={{ display: "none" }} />

				{/* Overflow menu: CSV + Guía. Compartido entre desktop y mobile. */}
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
					<MenuItem
						onClick={() => {
							handleOverflowClose();
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

			{/* Tabla con ScrollX */}
			<ScrollX>
				<Table {...getTableProps()} sx={tableSx}>
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
											transition: "background-color 0.15s ease",
											bgcolor: row.isSelected ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) : "inherit",
											"&:hover": {
												bgcolor: row.isSelected
													? alpha(BRAND_BLUE, isDark ? 0.18 : 0.11)
													: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
											},
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
						position: "relative",
						overflow: "hidden",
						width: "100%",
						py: { xs: 3.5, sm: 4.5 },
						px: 2,
					}}
				>
					{/* Atmósfera brand sutil — replica el patrón del empty state de folders */}
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
								Sin contactos
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
							<Profile2User size={40} variant="Bulk" />
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
								Todavía no hay contactos creados
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
								Sumá clientes, peritos, contrapartes o cualquier persona vinculada a tus expedientes con el botón Agregar contacto de
								arriba.
							</Typography>
						</Stack>
					</Stack>
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
	const [archivedPage, setArchivedPage] = useState(1);
	const [archivedPageSize, setArchivedPageSize] = useState(10);

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
	const { contacts, archivedContacts, archivedPagination, isLoader } = useSelector((state) => state.contacts);

	// Team context - para cargar recursos del equipo si hay uno activo
	const { activeTeam, isTeamMode, canCreate, canUpdate, canDelete, isInitialized: isTeamInitialized, getRequestHeaders } = useTeam();

	// Efecto para la carga inicial y cuando cambia el equipo activo
	useEffect(() => {
		const loadContacts = async () => {
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

				// Si hay equipo activo, cargar contactos del grupo
				// Si no, cargar contactos del usuario
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getContactsByGroupId(activeTeam._id));
				} else {
					const userId = user._id;
					if (userId) {
						await dispatch(getContactsByUserId(userId));
					}
				}
			} catch (error) {
				console.error("Error loading contacts:", error);
			} finally {
				loadingRef.current = false;
				setIsInitialLoad(false);
			}
		};

		loadContacts();

		return () => {
			loadingRef.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?._id, activeTeam?._id, isTeamMode, isTeamInitialized]);

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
			loadingRef.current = true;
			if (isTeamMode && activeTeam?._id) {
				await dispatch(getContactsByGroupId(activeTeam._id));
			} else {
				await dispatch(getContactsByUserId(user._id, true));
			}
		} finally {
			loadingRef.current = false;
		}
	}, [user?._id, isTeamMode, activeTeam?._id]);

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
				const result = await dispatch(archiveContacts(userId, contactIds, { headers: getRequestHeaders() }));

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

	// Función para cargar contactos archivados con paginación
	const loadArchivedContacts = useCallback(
		async (page: number, pageSize: number) => {
			if (!user?._id || loadingRef.current) return;

			try {
				loadingRef.current = true;
				// Usar la función correcta según el modo equipo
				if (isTeamMode && activeTeam?._id) {
					await dispatch(getArchivedContactsByGroupId(activeTeam._id, page, pageSize));
				} else {
					await dispatch(getArchivedContactsByUserId(user._id, page, pageSize));
				}
			} catch (error) {
				setSnackbarMessage("Error al obtener contactos archivados");
				setSnackbarSeverity("error");
				setSnackbarOpen(true);
			} finally {
				loadingRef.current = false;
			}
		},
		[user?._id, isTeamMode, activeTeam?._id],
	);

	// Manejadores para elementos archivados
	const handleOpenArchivedModal = useCallback(async () => {
		setArchivedPage(1); // Reset to first page
		await loadArchivedContacts(1, archivedPageSize);
		setArchivedModalOpen(true);
	}, [loadArchivedContacts, archivedPageSize]);

	const handleCloseArchivedModal = useCallback(() => {
		setArchivedModalOpen(false);
		setArchivedPage(1); // Reset page on close
	}, []);

	// Handler para cambio de página en archivados
	const handleArchivedPageChange = useCallback(
		(page: number) => {
			setArchivedPage(page);
			loadArchivedContacts(page, archivedPageSize);
		},
		[loadArchivedContacts, archivedPageSize],
	);

	// Handler para cambio de tamaño de página en archivados
	const handleArchivedPageSizeChange = useCallback(
		(pageSize: number) => {
			setArchivedPageSize(pageSize);
			setArchivedPage(1);
			loadArchivedContacts(1, pageSize);
		},
		[loadArchivedContacts],
	);

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
				const result = await dispatch(unarchiveContacts(userId, contactIds, { headers: getRequestHeaders() }));

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
					// Ícono que comunica "ver detalle" / "cerrar detalle". Heredan el
					// color del IconButton (text.secondary → brand-blue en hover).
					const collapseIcon = isExpanded ? (
						<Add size={18} style={{ transform: "rotate(45deg)", transition: "transform 0.3s ease-in-out" }} />
					) : (
						<Eye variant="Bulk" size={18} style={{ transition: "transform 0.3s ease-in-out" }} />
					);

					// Usar original que contiene los datos completos sin ambigüedades
					const { original } = row;
					const isDarkMode = theme.palette.mode === "dark";

					// Monocromo + intent hover: brand-blue para acciones normales,
					// red sólo para destructive. Mismo patrón que folders.
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
							<Tooltip title="Ver">
								<IconButton
									size="small"
									sx={actionIconSx}
									onClick={(e) =>
										handleRowAction(e, () => {
											handleToggleExpanded(row.id);
										})
									}
								>
									{collapseIcon}
								</IconButton>
							</Tooltip>
							{canUpdate && (
								<Tooltip title="Vincular">
									<IconButton
										size="small"
										sx={actionIconSx}
										onClick={(e) =>
											handleRowAction(e, () => {
												setCustomerId(original._id);
												setFolderIds(original.folderIds || []);
												handleOpenLink();
											})
										}
									>
										<Link1 variant="Bulk" size={18} />
									</IconButton>
								</Tooltip>
							)}
							{canUpdate && (
								<Tooltip title="Editar">
									<IconButton
										size="small"
										sx={actionIconSx}
										data-testid="contact-edit-btn"
										onClick={(e) => handleRowAction(e, () => handleEditContact(original))}
									>
										<Edit2 variant="Bulk" size={18} />
									</IconButton>
								</Tooltip>
							)}
							{canDelete && (
								<Tooltip title="Eliminar">
									<IconButton
										size="small"
										sx={destructiveIconSx}
										data-testid="contact-delete-btn"
										onClick={(e) =>
											handleRowAction(e, () => {
												handleClose();
												setCustomerDeleteId(`${original.name || ""} ${original.lastName || ""}`);
												setCustomerId(original._id);
											})
										}
									>
										<Trash variant="Bulk" size={18} />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					);
				},
				className: "cell-center",
				disableSortBy: true,
			},
		],
		[
			theme,
			mode,
			handleEditContact,
			handleClose,
			handleOpenLink,
			handleRowAction,
			expandedRowId,
			handleToggleExpanded,
			canUpdate,
			canDelete,
		],
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

	const isDark = theme.palette.mode === "dark";

	// Skeleton brand-aware durante la carga inicial — matchea la estructura
	// final (header card + table card) para evitar el "salto" cuando carga.
	if (isInitialLoad) {
		return (
			<Stack spacing={{ xs: 1, sm: 2.5 }}>
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
				<MainCard content={false}>
					<Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
							<Skeleton variant="rounded" width={150} height={32} />
							<Skeleton variant="rounded" width={110} height={32} />
							<Skeleton variant="rounded" width={200} height={32} />
							<Box sx={{ flex: 1 }} />
							<Skeleton variant="rounded" width={220} height={32} />
							<Skeleton variant="circular" width={32} height={32} />
						</Stack>
						<Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
					</Stack>
				</MainCard>
			</Stack>
		);
	}

	return (
		<Stack spacing={{ xs: 1, sm: 2.5 }}>
			{/* ── HEADER DE SECCIÓN ───────────────────────────────────────────
			    Eyebrow + descripción + ResourceUsageBar. Mismo patrón que
			    folders/list para coherencia visual cross-page.
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
				{/* Blob brand-blue + dot grid — solo desktop */}
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
					{/* Columna izquierda: eyebrow + descripción — oculta en mobile */}
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
								Contactos
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
							Personas vinculadas a tus expedientes — clientes, peritos, contrapartes, abogados.
						</Typography>
					</Stack>

					{/* Columna derecha: barra de uso del plan */}
					<Box
						sx={{
							flexShrink: 0,
							width: { xs: "100%", md: "auto" },
							minWidth: { md: 440 },
							pl: { md: 2 },
							borderLeft: { md: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` },
						}}
					>
						<ResourceUsageBar resourceType="contacts" compact disableContainerPadding />
					</Box>
				</Stack>
			</Box>

			<MainCard content={false}>
				<DowngradeGracePeriodAlert />
				<ScrollX>
				<ReactTable
					columns={columns}
					data={contacts}
					handleAdd={canCreate ? handleAddContact : undefined}
					handleArchiveSelected={canUpdate ? handleArchiveSelected : undefined}
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
							height: { xs: "90vh", sm: "85vh", md: "80vh" },
							maxHeight: { xs: "90vh", sm: "85vh", md: "80vh" },
							overflow: "hidden",
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
				pagination={archivedPagination}
				onPageChange={handleArchivedPageChange}
				onPageSizeChange={handleArchivedPageSizeChange}
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
		</Stack>
	);
};

export default CustomerListPage;
