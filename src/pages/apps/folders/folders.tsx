import { useCallback, useEffect, useMemo, useState, FC, Fragment, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Button, Chip, Dialog, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, useMediaQuery } from "@mui/material";

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

// project-imports
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import IconButton from "components/@extended/IconButton";
import { PopupTransition } from "components/@extended/Transitions";
import { CSVExport, EmptyTable, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";

import AddFolder from "sections/apps/folders/AddFolder";
import FolderView from "sections/apps/folders/FolderView";

import AlertCustomerDelete from "sections/apps/customer/AlertCustomerDelete";

import makeData from "data/react-table";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, FolderAdd, Edit, Eye, Trash, Maximize } from "iconsax-react";

// types
import { ThemeMode } from "types/config";

// ==============================|| REACT TABLE ||============================== //

interface Props {
	columns: Column[];
	data: [];
	handleAdd: () => void;
	renderRowSubComponent: FC<any>;
}

function ReactTable({ columns, data, renderRowSubComponent, handleAdd }: Props) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "folderName", desc: false };

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
				hiddenColumns: ["avatar", "email"],
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
		if (matchDownSM) {
			setHiddenColumns(["age", "contact", "visits", "email", "status", "avatar"]);
		} else {
			setHiddenColumns(["avatar", "email"]);
		}
		// eslint-disable-next-line
	}, [matchDownSM]);

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
						{data.length > 0 ? (
							<>
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
								<TableRow sx={{ "&:hover": { bgcolor: "transparent !important" } }}>
									<TableCell sx={{ p: 2, py: 3 }} colSpan={9}>
										<TablePagination gotoPage={gotoPage} rows={rows} setPageSize={setPageSize} pageSize={pageSize} pageIndex={pageIndex} />
									</TableCell>
								</TableRow>
							</>
						) : (
							<EmptyTable msg="No Hay Datos" colSpan={7} />
						)}
					</TableBody>
				</Table>
			</Stack>
		</>
	);
}

// ==============================|| CUSTOMER - LIST ||============================== //

const FoldersLayout = () => {
	const theme = useTheme();
	const mode = theme.palette.mode;
	const data = useMemo(() => makeData(20), []);
	console.log(data);
	const [open, setOpen] = useState<boolean>(false);
	const [customer, setCustomer] = useState<any>(null);
	const [customerDeleteId, setCustomerDeleteId] = useState<any>("");
	const [add, setAdd] = useState<boolean>(false);

	const handleAdd = () => {
		setAdd(!add);
		if (customer && !add) setCustomer(null);
	};

	const handleClose = () => {
		setOpen(!open);
	};
	const navigate = useNavigate();
	const columns = useMemo(
		() => [
			{
				Header: "#",
				accessor: "id",
				className: "cell-center",
			},
			{
				Header: "Carátula",
				accessor: "folderName",
			},
			{
				Header: "Materia",
				accessor: "materiaSelect",
			},
			{
				Header: "Parte",
				accessor: "orderStatus",
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
					const collapseIcon = row.isExpanded ? <Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} /> : <Eye />;
					return (
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Ver"
							>
								<IconButton
									color="secondary"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										row.toggleRowExpanded();
									}}
								>
									{collapseIcon}
								</IconButton>
							</Tooltip>
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Editar"
							>
								<IconButton
									color="primary"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										setCustomer(row.values);
										handleAdd();
									}}
								>
									<Edit />
								</IconButton>
							</Tooltip>
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Eliminar"
							>
								<IconButton
									color="error"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleClose();
										setCustomerDeleteId(row.values.id);
									}}
								>
									<Trash />
								</IconButton>
							</Tooltip>
							<Tooltip
								componentsProps={{
									tooltip: {
										sx: {
											backgroundColor: mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[700],
											opacity: 0.9,
										},
									},
								}}
								title="Abrir"
							>
								<IconButton
									color="success"
									onClick={(e: MouseEvent) => {
										e.stopPropagation();
										console.log(row.values.id);
										navigate(`../details/${row.values.id}`);
									}}
								>
									<Maximize />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[theme],
	);

	const renderRowSubComponent = useCallback(({ row }: { row: Row<{}> }) => <FolderView data={data[Number(row.id)]} />, [data]);

	return (
		<MainCard content={false}>
			<ScrollX>
				<ReactTable columns={columns} data={data} handleAdd={handleAdd} renderRowSubComponent={renderRowSubComponent} />
			</ScrollX>
			<AlertCustomerDelete title={customerDeleteId} open={open} handleClose={handleClose} />
			{/* add customer dialog */}
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				keepMounted
				fullWidth
				onClose={handleAdd}
				open={add}
				sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
				aria-describedby="alert-dialog-slide-description"
			>
				<AddFolder open={add} customer={customer} onCancel={handleAdd} />
			</Dialog>
		</MainCard>
	);
};

export default FoldersLayout;
