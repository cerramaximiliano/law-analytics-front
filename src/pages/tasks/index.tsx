import React from "react";
import { useEffect, useMemo, useState, Fragment, MouseEvent, useCallback } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Button,
	Chip,
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
	Container,
	IconButton,
	Box,
	CircularProgress,
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
	Column,
	HeaderGroup,
	Row,
	Cell,
} from "react-table";

// project imports
import MainCard from "components/MainCard";
import TaskDetailRow from "sections/apps/tasks/TaskDetailRow";
import { IndeterminateCheckbox, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import AlertTaskDelete from "sections/apps/tasks/AlertTaskDelete";
import TaskModal from "sections/apps/tasks/TaskModal";
import GuideTasks from "components/guides/GuideTasks";

import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, Task, Eye, Trash, Edit2, DocumentDownload, InfoCircle } from "iconsax-react";

// sections

// types
import { dispatch, useSelector } from "store";
import { getTasksByUserId, deleteTask, getTaskDetail } from "store/reducers/tasks";
import { getFoldersByUserId } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { TaskType } from "types/task";
import dayjs from "utils/dayjs-config";
import { CSVLink } from "react-csv";

// ==============================|| REACT TABLE ||============================== //

interface Props {
	columns: Column<TaskType>[];
	data: TaskType[];
	handleAdd: () => void;
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

	// Sincronizar el estado de paginación con el controlador externo
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

	// Wrapper functions para manejar cambios de paginación
	const handleGotoPage = (newPageIndex: number) => {
		onPageChange(newPageIndex);
	};

	const handleSetPageSize = (newPageSize: number) => {
		onPageSizeChange(newPageSize);
		onPageChange(0); // Reset to first page when changing page size
	};

	const csvHeaders = columns
		.filter((column: any) => column.accessor && typeof column.accessor === "string")
		.map((column: any) => ({
			label: column.Header?.toString() || "",
			key: column.accessor,
		}));

	return (
		<>
			<Stack gap={1} spacing={3}>
				<TableRowSelection selected={Object.keys(selectedRowIds).length} />
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
						<SortingSelect
							sortBy={sortBy[0]?.id || "name"}
							setSortBy={(newSortBy: any) => {
								setSortByState(newSortBy);
								setSortBy(newSortBy);
							}}
							allColumns={allColumns}
						/>
					</Stack>

					{/* Lado derecho - Botones de acción */}
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "auto" }}>
						{/* Primera línea: Nueva Tarea */}
						<Stack
							direction="row"
							alignItems="center"
							spacing={2}
							sx={{ justifyContent: matchDownSM ? "flex-start" : "flex-end", width: "100%" }}
						>
							<Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="small">
								Nueva Tarea
							</Button>
						</Stack>

						{/* Segunda línea: Exportar CSV y Ver Guía */}
						<Stack
							direction="row"
							alignItems="center"
							spacing={2}
							sx={{ justifyContent: matchDownSM ? "flex-start" : "flex-end", width: "100%" }}
						>
							<Tooltip title="Exportar a CSV">
								<IconButton color="primary" size="medium" sx={{ position: "relative" }}>
									<CSVLink
										data={data || []}
										headers={csvHeaders}
										filename={`tasks-${dayjs().format("DD-MM-YYYY")}.csv`}
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
											sx={{ cursor: "pointer", bgcolor: row.isSelected ? alpha(theme.palette.primary.lighter, 0.35) : "inherit" }}
										>
											{row.cells.map((cell: Cell<TaskType>, k: number) => (
												<TableCell key={`cell-${i}-${k}`} {...(cell.getCellProps([{ className: cell.column.className }]) as any)}>
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
																	<CircularProgress size={24} />
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
								<TableCell sx={{ p: 2.5 }} colSpan={visibleColumns.length}>
									<Stack>
										<Typography variant="h5" align="center">
											Sin tareas
										</Typography>
										<Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
											Comienza creando tu primera tarea
										</Typography>
									</Stack>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<TablePagination gotoPage={handleGotoPage} rows={rows} setPageSize={handleSetPageSize} pageIndex={pageIndex} pageSize={pageSize} />
			</Stack>
		</>
	);
}

// ==============================|| TASKS PAGE ||============================== //

const Tasks = () => {
	const theme = useTheme();
	const { user } = useSelector((state) => state.auth);
	const userId = user?._id;

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
	// Removed local snackbar state - using global Redux snackbar instead
	const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
	const [openGuide, setOpenGuide] = useState(false);
	// Agregar estado para controlar la paginación
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	useEffect(() => {
		if (userId) {
			dispatch(getTasksByUserId(userId));
			dispatch(getFoldersByUserId(userId));
		}
	}, [userId]);

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

	// Removed handleCloseSnackbar - handled by global snackbar

	const handleViewTask = useCallback(
		async (taskId: string) => {
			// Si está colapsando
			if (expandedTaskId === taskId) {
				setExpandedTaskId(null);
				return;
			}

			// Si está expandiendo, verificar si ya tenemos los detalles
			if (!taskDetails[taskId]) {
				// Si no tenemos los detalles, hacer la llamada a la API
				await dispatch(getTaskDetail(taskId));
			}

			// Expandir la fila
			setExpandedTaskId(taskId);
		},
		[expandedTaskId, taskDetails, dispatch],
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
							<Typography variant="subtitle1">{value}</Typography>
							{priority && (
								<Chip
									size="small"
									label={priority.charAt(0).toUpperCase() + priority.slice(1)}
									color={priority === "alta" ? "error" : priority === "media" ? "warning" : priority === "baja" ? "success" : "default"}
									sx={{
										minWidth: 55,
										...(priority === "baja" && {
											backgroundColor: "success.main",
											color: "success.contrastText",
											"& .MuiChip-label": {
												fontWeight: 600,
											},
										}),
										...(priority === "media" && {
											backgroundColor: "warning.main",
											color: "black",
											"& .MuiChip-label": {
												fontWeight: 600,
											},
										}),
									}}
								/>
							)}
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
					return <Typography color={isOverdue ? "error" : isDueSoon ? "warning" : "textPrimary"}>{date.format("DD/MM/YYYY")}</Typography>;
				},
			},
			{
				Header: "Estado",
				accessor: "status",
				Cell: ({ value }: any) => {
					const getStatusColor = () => {
						switch (value) {
							case "completada":
								return "success";
							case "en_progreso":
								return "warning";
							case "revision":
								return "secondary";
							case "cancelada":
								return "error";
							default:
								return "default";
						}
					};
					const getStatusLabel = () => {
						switch (value) {
							case "completada":
								return "Completada";
							case "en_progreso":
								return "En Progreso";
							case "revision":
								return "Revisión";
							case "cancelada":
								return "Cancelada";
							case "pendiente":
								return "Pendiente";
							default:
								return value || "Pendiente";
						}
					};
					return <Chip size="small" label={getStatusLabel()} color={getStatusColor()} />;
				},
			},
			{
				Header: "Carpeta",
				accessor: "folderId",
				Cell: ({ value }: any) => {
					return value ? (
						<Typography variant="body2">{folders?.find((f: any) => f._id === value)?.folderName || value}</Typography>
					) : (
						<Typography variant="body2" color="textSecondary">
							-
						</Typography>
					);
				},
			},
			{
				Header: "Descripción",
				accessor: "description",
				Cell: ({ value }: any) => {
					return (
						<Typography variant="body2" color="textSecondary">
							{value || "-"}
						</Typography>
					);
				},
			},
			{
				Header: "Acciones",
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: any) => {
					const collapseIcon =
						expandedTaskId === row.original._id ? (
							<Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} />
						) : (
							<Eye variant="Bulk" />
						);

					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
							<Tooltip title={expandedTaskId === row.original._id ? "Cerrar" : "Ver"}>
								<IconButton
									color={expandedTaskId === row.original._id ? "primary" : "secondary"}
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleViewTask(row.original._id);
									}}
								>
									{collapseIcon}
								</IconButton>
							</Tooltip>
							<Tooltip title="Editar">
								<IconButton
									color="primary"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleEditTask(row.original);
									}}
								>
									<Edit2 variant="Bulk" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Eliminar">
								<IconButton
									color="error"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleDeleteClick(row.original._id, row.original.name);
									}}
								>
									<Trash variant="Bulk" />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		[theme, folders, expandedTaskId, handleViewTask, handleEditTask],
	);

	const filteredData = useMemo(() => {
		return taskData.filter((task) => !task.archived);
	}, [taskData]);

	// No necesitamos más el renderRowSubComponent

	return (
		<Container sx={{ mt: 2 }}>
			<MainCard
				title={
					<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
						<Stack direction="row" spacing={1} alignItems="center">
							<Task variant="Bulk" />
							<Typography variant="h4">Mis Tareas</Typography>
						</Stack>
					</Stack>
				}
			>
				<ReactTable
					columns={columns}
					data={filteredData}
					handleAdd={handleAddTask}
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

			{/* Snackbar now handled globally by Redux */}

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
		</Container>
	);
};

export default Tasks;
