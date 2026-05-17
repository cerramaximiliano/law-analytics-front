import React from "react";
import { useEffect, useMemo, useState, Fragment, MouseEvent, useCallback, useRef } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Button,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	useMediaQuery,
	Skeleton,
	Typography,
	IconButton,
	Box,
	CircularProgress,
	Collapse,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";

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
} from "react-table";

// project imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import TaskDetailRow from "sections/apps/tasks/TaskDetailRow";
import { IndeterminateCheckbox, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import AlertTaskDelete from "sections/apps/tasks/AlertTaskDelete";
import TaskModal from "sections/apps/tasks/TaskModal";
import GuideTasks from "components/guides/GuideTasks";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, Task, Eye, Trash, Edit2, DocumentDownload, InfoCircle, More } from "iconsax-react";

// types
import { dispatch, useSelector } from "store";
import { getTasksByUserId, getTasksByGroupId, deleteTask, getTaskDetail } from "store/reducers/tasks";
import { getFoldersByUserId, getFoldersByGroupId } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import { TaskType } from "types/task";
import dayjs from "utils/dayjs-config";
import { CSVLink } from "react-csv";

// ==============================|| BRAND PILLS ||============================== //

const TaskPriorityPill = ({ priority }: { priority?: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	if (!priority) return null;
	const map: Record<string, { color: string; label: string }> = {
		alta: { color: theme.palette.error.main, label: "Alta" },
		media: { color: STALE_AMBER, label: "Media" },
		baja: { color: LIVE_GREEN, label: "Baja" },
	};
	const cfg = map[priority] ?? { color: theme.palette.text.secondary, label: priority };
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.625,
				px: 0.875,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: alpha(cfg.color, isDark ? 0.16 : 0.1),
				border: `1px solid ${alpha(cfg.color, isDark ? 0.32 : 0.22)}`,
			}}
		>
			<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: cfg.color }} />
			<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: cfg.color, letterSpacing: "0.01em", lineHeight: 1 }}>
				{cfg.label}
			</Typography>
		</Box>
	);
};

const TaskStatusPill = ({ value }: { value?: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const map: Record<string, { color: string; label: string }> = {
		completada: { color: LIVE_GREEN, label: "Completada" },
		en_progreso: { color: BRAND_BLUE, label: "En progreso" },
		revision: { color: STALE_AMBER, label: "Revisión" },
		cancelada: { color: theme.palette.error.main, label: "Cancelada" },
		pendiente: { color: theme.palette.text.secondary, label: "Pendiente" },
	};
	const cfg = map[value ?? "pendiente"] ?? { color: theme.palette.text.secondary, label: value || "Pendiente" };
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.625,
				px: 0.875,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: alpha(cfg.color, isDark ? 0.16 : 0.1),
				border: `1px solid ${alpha(cfg.color, isDark ? 0.32 : 0.22)}`,
			}}
		>
			<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: cfg.color }} />
			<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: cfg.color, letterSpacing: "0.01em", lineHeight: 1 }}>
				{cfg.label}
			</Typography>
		</Box>
	);
};

// ==============================|| REACT TABLE ||============================== //

interface Props {
	columns: Column<TaskType>[];
	data: TaskType[];
	handleAdd?: () => void;
	handleOpenGuide: () => void;
	isLoading?: boolean;
	expandedTaskId?: string | null;
	folders?: any[];
	onViewTask: (taskId: string) => void;
	taskDetails: { [key: string]: TaskType };
	taskDetailsLoading: { [key: string]: boolean };
	pageIndex: number;
	pageSize: number;
	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;
}

function ReactTable({
	columns,
	data,
	handleAdd,
	handleOpenGuide,
	isLoading,
	expandedTaskId,
	folders,
	onViewTask,
	taskDetails,
	taskDetailsLoading,
	pageIndex: controlledPageIndex,
	pageSize: controlledPageSize,
	onPageChange,
	onPageSizeChange,
}: Props) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
	const isDark = theme.palette.mode === "dark";
	const [isColumnsReady, setIsColumnsReady] = useState(false);

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const [sortBy, setSortByState] = useState([{ id: "name", desc: false }]);

	const defaultHiddenColumns = useMemo(
		() => (matchDownSM ? ["_id", "description", "groupId", "folderId", "assignedTo", "subtasks"] : ["_id", "groupId", "assignedTo"]),
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
		state: { globalFilter, selectedRowIds, pageIndex, pageSize },
		preGlobalFilteredRows,
		setGlobalFilter,
		setSortBy,
	}: any = useTable(
		{
			columns,
			data,
			filterTypes,
			initialState: {
				pageIndex: controlledPageIndex,
				pageSize: controlledPageSize,
				sortBy: sortBy,
				hiddenColumns: defaultHiddenColumns,
			},
			pageCount: Math.ceil(data.length / controlledPageSize),
			manualPagination: false,
		},
		useGlobalFilter,
		useFilters,
		useSortBy,
		useExpanded,
		usePagination,
		useRowSelect,
		(hooks) => {
			hooks.allColumns.push((columns: any) => [
				{
					id: "row-selection-chk",
					accessor: "row-selection-chk",
					Header: ({ getToggleAllRowsSelectedProps }: any) => <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />,
					Cell: ({ row }: any) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />,
					sortable: false,
				},
				...columns,
			]);
		},
	);

	useEffect(() => {
		if (allColumns.length > 0 && !isColumnsReady) {
			setIsColumnsReady(true);
		}
	}, [allColumns, isColumnsReady]);

	useEffect(() => {
		if (isColumnsReady) {
			setHiddenColumns(defaultHiddenColumns);
		}
	}, [defaultHiddenColumns, setHiddenColumns, isColumnsReady]);

	useEffect(() => {
		setSortBy(sortBy);
	}, [setSortBy, sortBy]);

	useEffect(() => {
		if (pageIndex !== controlledPageIndex) {
			gotoPage(controlledPageIndex);
		}
	}, [controlledPageIndex, gotoPage, pageIndex]);

	useEffect(() => {
		if (pageSize !== controlledPageSize) {
			setPageSize(controlledPageSize);
		}
	}, [controlledPageSize, setPageSize, pageSize]);

	const handleGotoPage = (newPageIndex: number) => {
		onPageChange(newPageIndex);
	};

	const handleSetPageSize = (newPageSize: number) => {
		onPageSizeChange(newPageSize);
		onPageChange(0);
	};

	const csvHeaders = columns
		.filter((column: any) => column.accessor && typeof column.accessor === "string")
		.map((column: any) => ({
			label: column.Header?.toString() || "",
			key: column.accessor,
		}));

	// Brand helpers
	const brandPrimaryButtonSx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};

	const iconBtnSx = {
		width: 34,
		height: 34,
		borderRadius: 1,
		color: "text.secondary",
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	};

	const tableSx = {
		"& .MuiTableHead-root .MuiTableCell-root": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			color: "text.secondary",
			fontSize: "0.68rem",
			fontWeight: 600,
			letterSpacing: "0.06em",
			textTransform: "uppercase",
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
			py: 1.25,
		},
		"& .MuiTableBody-root .MuiTableRow-root": {
			transition: "background-color 0.12s ease",
		},
		"& .MuiTableBody-root .MuiTableRow-root:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
		},
		"& .MuiTableBody-root .MuiTableCell-root": {
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}`,
		},
	};

	// Overflow menu
	const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
	const moreOpen = Boolean(moreAnchor);
	const csvWrapperRef = useRef<HTMLDivElement>(null);

	const handleCsvFromMenu = () => {
		setMoreAnchor(null);
		const link = csvWrapperRef.current?.querySelector("a");
		link?.click();
	};

	const handleGuideFromMenu = () => {
		setMoreAnchor(null);
		handleOpenGuide();
	};

	return (
		<>
			<Stack gap={1} spacing={3}>
				<TableRowSelection selected={Object.keys(selectedRowIds).length} />

				{/* Toolbar consolidada brand-aware */}
				<Stack
					direction={matchDownSM ? "column" : "row"}
					spacing={{ xs: 1.25, sm: 1.5 }}
					alignItems={matchDownSM ? "stretch" : "center"}
					sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}
				>
					{/* Buscador */}
					<Box sx={{ width: { xs: "100%", sm: 240 } }}>
						<GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
					</Box>

					{/* Sort */}
					<Box sx={{ width: { xs: "100%", sm: 220 } }}>
						<SortingSelect
							sortBy={sortBy[0]?.id || "name"}
							setSortBy={(newSortBy: any) => {
								setSortByState(newSortBy);
								setSortBy(newSortBy);
							}}
							allColumns={allColumns}
						/>
					</Box>

					{/* Spacer */}
					<Box sx={{ flex: 1 }} />

					{/* Acciones derecha */}
					<Stack direction="row" spacing={1} alignItems="center" justifyContent={matchDownSM ? "flex-end" : "flex-end"}>
						{handleAdd && (
							<Button
								variant="contained"
								size="small"
								startIcon={<Add size={16} variant="Linear" />}
								onClick={handleAdd}
								fullWidth={matchDownSM}
								data-testid="tasks-add-btn"
								sx={brandPrimaryButtonSx}
							>
								Nueva tarea
							</Button>
						)}
						<Tooltip title="Más opciones">
							<IconButton onClick={(e) => setMoreAnchor(e.currentTarget)} sx={iconBtnSx} aria-label="más opciones">
								<More size={18} variant="Linear" />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>

				{/* Hairline brand */}
				<Box sx={{ height: 1, mx: { xs: 2, sm: 3 }, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />

				<Menu
					anchorEl={moreAnchor}
					open={moreOpen}
					onClose={() => setMoreAnchor(null)}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
					transformOrigin={{ vertical: "top", horizontal: "right" }}
					PaperProps={{
						elevation: 0,
						sx: {
							mt: 0.5,
							minWidth: 200,
							borderRadius: 1.5,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
							boxShadow: `0 10px 28px ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)}`,
							"& .MuiMenuItem-root": {
								fontSize: "0.82rem",
								letterSpacing: "-0.005em",
								py: 0.875,
								"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06) },
							},
						},
					}}
				>
					<MenuItem onClick={handleCsvFromMenu}>
						<ListItemIcon sx={{ color: "text.secondary", minWidth: "32px !important" }}>
							<DocumentDownload size={16} variant="Linear" />
						</ListItemIcon>
						<ListItemText primary="Exportar CSV" />
					</MenuItem>
					<MenuItem onClick={handleGuideFromMenu}>
						<ListItemIcon sx={{ color: "text.secondary", minWidth: "32px !important" }}>
							<InfoCircle size={16} variant="Linear" />
						</ListItemIcon>
						<ListItemText primary="Ver guía" />
					</MenuItem>
				</Menu>

				{/* CSVLink oculto para disparar desde menu */}
				<Box ref={csvWrapperRef} sx={{ display: "none" }}>
					<CSVLink data={data || []} headers={csvHeaders} filename={`tasks-${dayjs().format("DD-MM-YYYY")}.csv`}>
						{""}
					</CSVLink>
				</Box>

				{/* Tabla */}
				<ScrollX>
					<Table {...getTableProps()} sx={tableSx}>
						<TableHead>
							{headerGroups.map((headerGroup: HeaderGroup<TaskType>, i: number) => (
								<TableRow
									key={`header-group-${i}`}
									{...(headerGroup.getHeaderGroupProps() as any)}
									sx={{ "& > th:first-of-type": { width: "58px" } }}
								>
									{headerGroup.headers.map((column: HeaderGroup<TaskType>, j: number) => (
										<TableCell key={`header-${i}-${j}`} {...(column.getHeaderProps([{ className: column.className }]) as any)}>
											<HeaderSort column={column as any} sort />
										</TableCell>
									))}
								</TableRow>
							))}
						</TableHead>
						<TableBody {...getTableBodyProps()}>
							{isLoading && data.length === 0 ? (
								[...Array(5)].map((_, index) => (
									<TableRow key={index}>
										{visibleColumns.map((column: Column) => (
											<TableCell key={column.id}>
												<Skeleton animation="wave" />
											</TableCell>
										))}
									</TableRow>
								))
							) : page.length > 0 ? (
								page.map((row: Row<TaskType>, i: number) => {
									prepareRow(row);
									return (
										<Fragment key={i}>
											<TableRow
												{...row.getRowProps()}
												sx={{
													cursor: "pointer",
													bgcolor: row.isSelected ? alpha(BRAND_BLUE, isDark ? 0.16 : 0.08) : "inherit",
												}}
											>
												{row.cells.map((cell: Cell<TaskType>, k: number) => (
													<TableCell
														key={`cell-${i}-${k}`}
														{...(cell.getCellProps([{ className: cell.column.className }]) as any)}
													>
														{cell.render("Cell")}
													</TableCell>
												))}
											</TableRow>
											<TableRow>
												<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={visibleColumns.length}>
													<Collapse in={expandedTaskId === row.original._id} timeout={400} unmountOnExit>
														{expandedTaskId === row.original._id && (
															<Box sx={{ margin: 1 }}>
																{taskDetailsLoading[row.original._id] ? (
																	<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
																		<CircularProgress size={24} sx={{ color: BRAND_BLUE }} />
																	</Box>
																) : (
																	<TaskDetailRow
																		taskId={row.original._id}
																		taskData={taskDetails[row.original._id]}
																		colSpan={visibleColumns.length}
																		folders={folders}
																		onError={(message) => {
																			console.log(message);
																		}}
																	/>
																)}
															</Box>
														)}
													</Collapse>
												</TableCell>
											</TableRow>
										</Fragment>
									);
								})
							) : (
								<TableRow>
									<TableCell sx={{ p: 0 }} colSpan={visibleColumns.length}>
										<Box
											sx={{
												position: "relative",
												overflow: "hidden",
												px: 3,
												py: { xs: 6, md: 8 },
												textAlign: "center",
											}}
										>
											{/* Radial blob */}
											<Box
												sx={{
													position: "absolute",
													top: "-20%",
													left: "50%",
													transform: "translateX(-50%)",
													width: 360,
													height: 360,
													borderRadius: "50%",
													background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 0%, transparent 70%)`,
													pointerEvents: "none",
												}}
											/>
											{/* Dot grid */}
											<Box
												sx={{
													position: "absolute",
													inset: 0,
													backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)} 1px, transparent 1px)`,
													backgroundSize: "20px 20px",
													opacity: 0.5,
													maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
													WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
													pointerEvents: "none",
												}}
											/>
											<Stack spacing={1.5} alignItems="center" sx={{ position: "relative" }}>
												<Box
													sx={{
														width: 56,
														height: 56,
														borderRadius: 1.5,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
														border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
														color: BRAND_BLUE,
													}}
												>
													<Task size={26} variant="Bulk" />
												</Box>
												<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
													Sin tareas todavía
												</Typography>
												<Typography
													sx={{
														fontSize: "0.82rem",
														color: "text.secondary",
														maxWidth: 360,
														textWrap: "pretty",
													}}
												>
													Creá tu primera tarea para empezar a organizar el trabajo del estudio.
												</Typography>
												{handleAdd && (
													<Button
														variant="contained"
														size="small"
														startIcon={<Add size={16} variant="Linear" />}
														onClick={handleAdd}
														sx={{ ...brandPrimaryButtonSx, mt: 0.5 }}
													>
														Nueva tarea
													</Button>
												)}
											</Stack>
										</Box>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</ScrollX>
				<TablePagination gotoPage={handleGotoPage} rows={rows} setPageSize={handleSetPageSize} pageIndex={pageIndex} pageSize={pageSize} />
			</Stack>

		</>
	);
}

// ==============================|| TASKS PAGE ||============================== //

const Tasks = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { user } = useSelector((state) => state.auth);
	const userId = user?._id;

	const { activeTeam, isTeamMode, canCreate, canUpdate, canDelete, isInitialized: isTeamInitialized } = useTeam();

	const { tasks, isLoader, taskDetails, taskDetailsLoading } = useSelector((state) => state.tasksReducer);
	const { folders } = useSelector((state) => state.folder);
	const [taskData, setTaskData] = useState<TaskType[]>([]);
	const [editModal, setEditModal] = useState<{ open: boolean; task: TaskType | undefined }>({
		open: false,
		task: undefined,
	});
	const [deleteModal, setDeleteModal] = useState<{ open: boolean; taskId: string | null; taskName: string }>({
		open: false,
		taskId: null,
		taskName: "",
	});
	const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
	const [openGuide, setOpenGuide] = useState(false);
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	useEffect(() => {
		if (!userId) return;
		if (!isTeamInitialized) return;
		if (isTeamMode && !activeTeam?._id) return;

		if (isTeamMode && activeTeam?._id) {
			dispatch(getTasksByGroupId(activeTeam._id));
			dispatch(getFoldersByGroupId(activeTeam._id));
		} else {
			dispatch(getTasksByUserId(userId));
			dispatch(getFoldersByUserId(userId));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId, activeTeam?._id, isTeamMode, isTeamInitialized]);

	useEffect(() => {
		setTaskData(tasks);
	}, [tasks]);

	const handleAddTask = useCallback(() => {
		setEditModal({ open: true, task: undefined });
	}, []);

	const handleEditTask = useCallback((task: TaskType) => {
		setEditModal({ open: true, task });
	}, []);

	const handleDeleteClick = useCallback((taskId: string, taskName: string) => {
		setDeleteModal({ open: true, taskId, taskName });
	}, []);

	const handleDeleteConfirm = async (confirm: boolean) => {
		if (confirm && deleteModal.taskId) {
			const result = await dispatch(deleteTask(deleteModal.taskId));

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Tarea eliminada correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al eliminar la tarea",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		}

		setDeleteModal({ open: false, taskId: null, taskName: "" });
	};

	const handleViewTask = useCallback(
		async (taskId: string) => {
			if (expandedTaskId === taskId) {
				setExpandedTaskId(null);
				return;
			}

			if (!taskDetails[taskId]) {
				await dispatch(getTaskDetail(taskId));
			}

			setExpandedTaskId(taskId);
		},
		[expandedTaskId, taskDetails, dispatch],
	);

	// Brand action icon sx (compartido con columnas)
	const actionIconSx = useMemo(
		() => ({
			width: 32,
			height: 32,
			borderRadius: 1,
			color: "text.secondary",
			transition: "color 0.15s ease, background-color 0.15s ease",
			"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
		}),
		[isDark],
	);

	const actionIconDestructiveSx = useMemo(
		() => ({
			width: 32,
			height: 32,
			borderRadius: 1,
			color: "text.secondary",
			transition: "color 0.15s ease, background-color 0.15s ease",
			"&:hover": { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, isDark ? 0.14 : 0.08) },
		}),
		[isDark, theme.palette.error.main],
	);

	const columns = useMemo<Column<TaskType>[]>(
		() => [
			{
				Header: "Tarea",
				accessor: "name",
				Cell: ({ value, row }: any) => {
					const priority = row.original.priority;
					return (
						<Stack direction="row" spacing={1} alignItems="center">
							<Typography sx={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
								{value}
							</Typography>
							<TaskPriorityPill priority={priority} />
						</Stack>
					);
				},
			},
			{
				Header: "Vencimiento",
				accessor: "dueDate",
				Cell: ({ value }: any) => {
					const date = dayjs(value);
					const isOverdue = date.isBefore(dayjs(), "day");
					const isDueSoon = date.isAfter(dayjs()) && date.diff(dayjs(), "days") <= 3;
					const color = isOverdue ? theme.palette.error.main : isDueSoon ? STALE_AMBER : theme.palette.text.primary;
					return (
						<Typography
							sx={{
								fontSize: "0.82rem",
								color,
								fontVariantNumeric: "tabular-nums",
								fontWeight: isOverdue || isDueSoon ? 600 : 500,
							}}
						>
							{date.format("DD/MM/YYYY")}
						</Typography>
					);
				},
			},
			{
				Header: "Estado",
				accessor: "status",
				Cell: ({ value }: any) => <TaskStatusPill value={value} />,
			},
			{
				Header: "Carpeta",
				accessor: "folderId",
				Cell: ({ value }: any) => {
					return value ? (
						<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
							{folders?.find((f: any) => f._id === value)?.folderName || value}
						</Typography>
					) : (
						<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>—</Typography>
					);
				},
			},
			{
				Header: "Descripción",
				accessor: "description",
				Cell: ({ value }: any) => {
					return (
						<Typography
							sx={{
								fontSize: "0.8rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								maxWidth: 280,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{value || "—"}
						</Typography>
					);
				},
			},
			{
				Header: "Acciones",
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: any) => {
					const isExpanded = expandedTaskId === row.original._id;
					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
							<Tooltip title={isExpanded ? "Cerrar" : "Ver"}>
								<IconButton
									sx={actionIconSx}
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleViewTask(row.original._id);
									}}
								>
									{isExpanded ? (
										<Add size={16} variant="Linear" style={{ transform: "rotate(45deg)" }} />
									) : (
										<Eye size={16} variant="Linear" />
									)}
								</IconButton>
							</Tooltip>
							{canUpdate && (
								<Tooltip title="Editar">
									<IconButton
										sx={actionIconSx}
										data-testid="task-edit-btn"
										onClick={(e: MouseEvent<HTMLButtonElement>) => {
											e.stopPropagation();
											handleEditTask(row.original);
										}}
									>
										<Edit2 size={16} variant="Linear" />
									</IconButton>
								</Tooltip>
							)}
							{canDelete && (
								<Tooltip title="Eliminar">
									<IconButton
										sx={actionIconDestructiveSx}
										data-testid="task-delete-btn"
										onClick={(e: MouseEvent<HTMLButtonElement>) => {
											e.stopPropagation();
											handleDeleteClick(row.original._id, row.original.name);
										}}
									>
										<Trash size={16} variant="Linear" />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					);
				},
			},
		],
		[theme, folders, expandedTaskId, handleViewTask, handleEditTask, canUpdate, canDelete, actionIconSx, actionIconDestructiveSx],
	);

	const filteredData = useMemo(() => {
		return taskData.filter((task) => !task.archived);
	}, [taskData]);

	const totalTasks = filteredData.length;
	const pendingTasks = useMemo(
		() => filteredData.filter((t: any) => t.status !== "completada" && t.status !== "cancelada").length,
		[filteredData],
	);
	const overdueTasks = useMemo(() => {
		const today = dayjs();
		return filteredData.filter((t: any) => t.dueDate && dayjs(t.dueDate).isBefore(today, "day") && t.status !== "completada" && t.status !== "cancelada")
			.length;
	}, [filteredData]);

	return (
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			{/* Header brand atmosférico */}
			<Box
				sx={{
					position: "relative",
					overflow: "hidden",
					borderRadius: 2,
					p: { xs: 2, md: 2.5 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
				}}
			>
				{/* Radial blob */}
				<Box
					sx={{
						position: "absolute",
						top: -60,
						right: -40,
						width: 280,
						height: 280,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				{/* Dot grid */}
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
						backgroundSize: "22px 22px",
						maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						opacity: 0.6,
						pointerEvents: "none",
					}}
				/>

				<Stack
					direction={{ xs: "column", md: "row" }}
					alignItems={{ xs: "flex-start", md: "center" }}
					spacing={{ xs: 1.5, md: 3 }}
					sx={{ position: "relative" }}
				>
					{/* Identidad */}
					<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
						<Box
							sx={{
								width: 44,
								height: 44,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<Task size={22} variant="Bulk" />
						</Box>
						<Stack spacing={0.25} sx={{ minWidth: 0 }}>
							<Stack
								direction="row"
								spacing={0.875}
								alignItems="center"
								sx={{ display: { xs: "none", md: "flex" }, color: "text.secondary" }}
							>
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{
										fontSize: "0.62rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Productividad
								</Typography>
							</Stack>
							<Typography
								sx={{
									fontSize: { xs: "1.05rem", md: "1.25rem" },
									fontWeight: 600,
									letterSpacing: "-0.015em",
									color: "text.primary",
									textWrap: "balance",
								}}
							>
								Tus tareas
							</Typography>
							<Typography
								sx={{
									display: { xs: "none", md: "block" },
									fontSize: "0.82rem",
									color: "text.secondary",
									letterSpacing: "-0.005em",
									textWrap: "pretty",
								}}
							>
								Organizá el trabajo del estudio por prioridad, estado y carpeta vinculada.
							</Typography>
						</Stack>
					</Stack>

					{/* Métricas inline */}
					<Stack
						direction="row"
						spacing={{ xs: 1, md: 1.5 }}
						alignItems="center"
						sx={{
							flexShrink: 0,
							display: { xs: "none", sm: "flex" },
						}}
					>
						<HeaderStat label="Totales" value={totalTasks} tone="primary" />
						<HeaderStat label="Pendientes" value={pendingTasks} tone="amber" />
						<HeaderStat label="Vencidas" value={overdueTasks} tone="error" />
					</Stack>
				</Stack>
			</Box>

			{/* Card de contenido sin título duplicado */}
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
				<ReactTable
					columns={columns}
					data={filteredData}
					handleAdd={canCreate ? handleAddTask : undefined}
					handleOpenGuide={() => setOpenGuide(true)}
					isLoading={isLoader}
					expandedTaskId={expandedTaskId}
					folders={folders}
					onViewTask={handleViewTask}
					taskDetails={taskDetails}
					taskDetailsLoading={taskDetailsLoading}
					pageIndex={pageIndex}
					pageSize={pageSize}
					onPageChange={setPageIndex}
					onPageSizeChange={setPageSize}
				/>
			</MainCard>

			<AlertTaskDelete title={deleteModal.taskName} open={deleteModal.open} handleClose={handleDeleteConfirm} />

			<TaskModal
				open={editModal.open}
				handleClose={() => setEditModal({ open: false, task: undefined })}
				task={editModal.task}
				showSnackbar={(message: string, severity: "success" | "error") => {
					dispatch(
						openSnackbar({
							open: true,
							message,
							variant: "alert",
							alert: { color: severity },
							close: true,
						}),
					);
				}}
			/>

			<GuideTasks open={openGuide} onClose={() => setOpenGuide(false)} />
		</Stack>
	);
};

// Mini stat tile usado en header
const HeaderStat = ({ label, value, tone }: { label: string; value: number; tone: "primary" | "amber" | "error" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const color = tone === "primary" ? BRAND_BLUE : tone === "amber" ? STALE_AMBER : theme.palette.error.main;
	return (
		<Stack
			spacing={0.25}
			sx={{
				px: 1.25,
				py: 0.875,
				borderRadius: 1.25,
				bgcolor: alpha(color, isDark ? 0.12 : 0.06),
				border: `1px solid ${alpha(color, isDark ? 0.26 : 0.16)}`,
				minWidth: 86,
			}}
		>
			<Typography
				sx={{
					fontSize: "0.58rem",
					fontWeight: 600,
					letterSpacing: "0.08em",
					textTransform: "uppercase",
					color: "text.secondary",
				}}
			>
				{label}
			</Typography>
			<Typography
				sx={{
					fontSize: "1.05rem",
					fontWeight: 700,
					letterSpacing: "-0.015em",
					color,
					fontVariantNumeric: "tabular-nums",
					lineHeight: 1.1,
				}}
			>
				{value}
			</Typography>
		</Stack>
	);
};

export default Tasks;
