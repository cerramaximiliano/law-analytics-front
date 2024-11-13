import { useCallback, useEffect, useMemo, useState, FC, Fragment, MouseEvent } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Button, Dialog, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography, useMediaQuery } from "@mui/material";

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
import {
	CSVExport,
	HeaderSort,
	IndeterminateCheckbox,
	SortingSelect,
	TablePagination,
	TableRowSelection,
} from "components/third-party/ReactTable";

import AddCustomer from "sections/apps/customer/AddCustomer";
import CustomerView from "sections/apps/customer/CustomerView";
import AlertCustomerDelete from "sections/apps/customer/AlertCustomerDelete";

import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, UserAdd, Edit, Eye, Trash } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { dispatch, useSelector } from "store";
import { getContactsByUserId } from "store/reducers/contacts";
import { Contact } from "types/contact";

// ==============================|| REACT TABLE ||============================== //

interface Props {
	columns: Column[];
	data: Contact[];
	renderRowSubComponent: FC<any>;
	handleAddContact: () => void;
}

function ReactTable({ columns, data, renderRowSubComponent, handleAddContact }: Props) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "name", desc: false };

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
				hiddenColumns: ["email", "lastName", "_id"],
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
			setHiddenColumns([
				"address",
				"phone",
				"lastName",
				"email",
				"status",
				"state",
				"_id",
				"zipCode",
				"nationality",
				"document",
				"cuit",
				"activity",
				"company",
				"fiscal",
			]);
		} else {
			setHiddenColumns([
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
			]);
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
						<Button
							variant="contained"
							startIcon={<UserAdd />}
							onClick={handleAddContact} // Usando la nueva función sin argumentos
							size="small"
						>
							Agregar Contacto
						</Button>

						<CSVExport
							data={selectedFlatRows.length > 0 ? selectedFlatRows.map((d: Row) => d.original) : data}
							filename={"contact-list.csv"}
						/>
					</Stack>
				</Stack>
				<Table {...getTableProps()}>
					<TableHead>
						{headerGroups.map((headerGroup: HeaderGroup<{}>) => (
							<TableRow {...headerGroup.getHeaderGroupProps()} sx={{ "& > th:first-of-type": { width: "58px" } }}>
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
						<TableRow sx={{ "&:hover": { bgcolor: "transparent !important" } }}>
							<TableCell sx={{ p: 2, py: 3 }} colSpan={9}>
								<TablePagination gotoPage={gotoPage} rows={rows} setPageSize={setPageSize} pageSize={pageSize} pageIndex={pageIndex} />
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Stack>
		</>
	);
}

// ==============================|| CUSTOMER - LIST ||============================== //

const CustomerListPage = () => {
	const theme = useTheme();
	const mode = theme.palette.mode;
	const [open, setOpen] = useState<boolean>(false);
	const [customer, setCustomer] = useState<any>(null);
	const [customerDeleteId, setCustomerDeleteId] = useState<any>("");
	const [customerId, setCustomerId] = useState<any>("");
	const [add, setAdd] = useState<boolean>(false);

	const handleCloseDialog = () => {
		setAdd(false);
	};

	const [addCustomerMode, setAddCustomerMode] = useState<"add" | "edit">("add");

	const handleAddContact = () => {
		setAdd(true);
		setAddCustomerMode("add");
		setCustomer(null);
	};

	// Nueva función específica para manejar la edición de un contacto
	const handleEditContact = (customer: any) => {
		setAdd(true);
		setAddCustomerMode("edit");
		setCustomer(customer);
	};

	const handleClose = () => {
		setOpen(!open);
	};

	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;
	const contacts = useSelector((state) => state.contacts.contacts);

	useEffect(() => {
		if (userId) {
			(async () => {
				try {
					dispatch(getContactsByUserId(userId));
				} catch (error) {
					console.log(error);
				}
			})();
		}
	}, [userId]);

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
				Header: "Nombre",
				accessor: "name",
				Cell: ({ row }: { row: Row }) => {
					const { values } = row;
					return (
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Stack spacing={0}>
								<Typography variant="subtitle1">{`${values.name} ${values.lastName}`}</Typography>
								<Typography color="text.secondary">{values.email}</Typography>
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
			},
			{
				Header: "Apellido",
				accessor: "lastName",
			},
			{
				Header: "Teléfono",
				accessor: "phone",
				Cell: ({ value }: { value: string }) => (
					<PatternFormat displayType="text" format="+54 (###) ###-####" mask="_" defaultValue={value} />
				),
			},
			{
				Header: "Ciudad",
				accessor: "city",
			},
			{
				Header: "Domicilio",
				accessor: "address",
			},

			{
				Header: "Estado",
				accessor: "status",
			},
			{
				Header: "Tipo",
				accessor: "type",
			},
			{
				Header: "id",
				accessor: "_id",
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
										console.log(row);
										e.stopPropagation();
										handleEditContact(row.values);
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
										console.log(row.values);
										setCustomerDeleteId(`${row.values.name} ${row.values.lastName}`);
										setCustomerId(row.values._id);
									}}
								>
									<Trash />
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
	/* Renderiza la vista ampliada del elemento seleccionado  */
	const renderRowSubComponent = useCallback(({ row }: { row: Row<{}> }) => <CustomerView data={contacts[Number(row.id)]} />, [contacts]);

	return (
		<MainCard content={false}>
			<ScrollX>
				<ReactTable columns={columns} data={contacts} renderRowSubComponent={renderRowSubComponent} handleAddContact={handleAddContact} />
			</ScrollX>
			<AlertCustomerDelete title={customerDeleteId} open={open} handleClose={handleClose} id={customerId} />
			{/* add customer dialog */}
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				keepMounted
				fullWidth
				open={add}
				sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
				aria-describedby="alert-dialog-slide-description"
			>
				<AddCustomer open={add} customer={customer} mode={addCustomerMode} onCancel={handleCloseDialog} onAddMember={() => {}} />
			</Dialog>
		</MainCard>
	);
};

export default CustomerListPage;
