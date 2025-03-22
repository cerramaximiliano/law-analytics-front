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
import {
	IndeterminateCheckbox,
	CSVExport,
	EmptyTable,
	HeaderSort,
	SortingSelect,
	TablePagination,
	TableRowSelection,
} from "components/third-party/ReactTable";

import AddFolder from "sections/apps/folders/AddFolder";
import FolderView from "sections/apps/folders/FolderView";
import AlertFolderDelete from "sections/apps/folders/AlertFolderDelete";

import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, FolderAdd, Edit, Eye, Trash, Maximize } from "iconsax-react";

// types
import { dispatch, useSelector } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { Folder, Props } from "types/folders";
// ==============================|| REACT TABLE ||============================== //

function ReactTable({ columns, data, renderRowSubComponent, handleAdd, isLoading }: Props) {
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
							<Skeleton width={100} height={40} />
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

	return (
		<>
			<TableRowSelection selected={Object.keys(selectedRowIds).length} />
			<Stack spacing={3}>
				<Stack
					direction={matchDownSM ? "column" : "row"}
					spacing={1}
					justifyContent="space-between"
					alignItems="center"
					sx={{ p: 3, pb: 0 }}
				>
					<GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
					<Stack direction={matchDownSM ? "column" : "row"} alignItems="center" spacing={2}>
						<SortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
						<Button variant="contained" startIcon={<FolderAdd />} onClick={handleAdd} size="small">
							Agregar Causa
						</Button>
						<CSVExport data={selectedFlatRows.length > 0 ? selectedFlatRows.map((d: Row) => d.original) : data} filename={"causas.csv"} />
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
									{row.isExpanded && renderRowSubComponent({ row, rowProps, visibleColumns, expanded })}
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
				{page.length === 0 && <EmptyTable msg="No Hay Datos" colSpan={7} />}
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

	// Referencias
	const mountedRef = useRef(false);
	const loadingRef = useRef(false);

	// Selectores
	const user = useSelector((state) => state.auth.user);
	const { folders, isLoader } = useSelector((state) => state.folder);

	// Efecto para la carga inicial
	useEffect(() => {
		// Solo ejecutar en el primer montaje
		if (!mountedRef.current) {
			mountedRef.current = true;

			const initialLoad = async () => {
				if (!user?._id || loadingRef.current) return;

				try {
					loadingRef.current = true;
					await dispatch(getFoldersByUserId(user._id));
				} catch (error) {
					console.error("Error loading folders:", error);
				} finally {
					loadingRef.current = false;
					setIsInitialLoad(false);
				}
			};

			initialLoad();
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

	const handleAddFolder = useCallback(() => {
		setAdd(true);
		setAddFolderMode("add");
		setFolder(null);
	}, []);

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
			},
			{
				Header: "Materia",
				accessor: "materia",
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
			},
			{
				Header: "Fecha Final",
				accessor: "finalDateFolder",
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
					const collapseIcon = row.isExpanded ? (
						<Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} />
					) : (
						<Eye variant="Bulk" />
					);

					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
							<Tooltip title="Ver">
								<IconButton color="secondary" onClick={(e) => handleRowAction(e, () => row.toggleRowExpanded())}>
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
		[theme, mode, handleEditContact, handleClose, navigate, handleRowAction],
	);

	// Row sub component memoizado
	const renderRowSubComponent = useCallback(
		({ row }: { row: Row<Folder> }) => {
			const folderData = folders.find((f: any) => f._id === row.original._id);
			return folderData ? <FolderView data={folderData} /> : null;
		},
		[folders],
	);

	if (isInitialLoad) {
		return null; // O un componente de loading si prefieres
	}

	return (
		<MainCard content={false}>
			<ScrollX>
				<ReactTable
					columns={columns}
					data={folders}
					handleAdd={handleAddFolder}
					renderRowSubComponent={renderRowSubComponent}
					isLoading={isLoader}
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
					sx={{ "& .MuiDialog-paper": { p: 0 } }}
				>
					<AddFolder open={add} folder={folder} mode={addFolderMode} onCancel={handleCloseDialog} onAddFolder={handleRefreshData} />
				</Dialog>
			)}
		</MainCard>
	);
};

export default FoldersLayout;
