import { useMemo } from "react";

// material-ui
import { Chip, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

// third-party
import { useTable, useSortBy, Column, Row, HeaderGroup, Cell } from "react-table";

// project-imports
import makeData from "data/react-table";
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import LinearWithLabel from "components/@extended/progress/LinearWithLabel";
import { CSVExport, HeaderSort } from "components/third-party/ReactTable";

// ==============================|| REACT TABLE ||============================== //

function ReactTable({ columns, data }: { columns: Column[]; data: [] }) {
	const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
		{
			columns,
			data,
			initialState: {
				sortBy: [
					{
						id: "firstName",
						desc: false,
					},
				],
			},
		},
		useSortBy,
	);

	const sortingRow = rows.slice(0, 9);
	let sortedData = sortingRow.map((d: Row) => d.original);
	Object.keys(sortedData).forEach((key: string) => sortedData[Number(key)] === undefined && delete sortedData[Number(key)]);

	return (
		<MainCard title="Sorting Table" content={false} secondary={<CSVExport data={sortedData} filename={"sorting-table.csv"} />}>
			<ScrollX>
				<Table {...getTableProps()}>
					<TableHead>
						{headerGroups.map((headerGroup) => (
							<TableRow {...headerGroup.getHeaderGroupProps()}>
								{headerGroup.headers.map((column: HeaderGroup) => (
									<TableCell {...column.getHeaderProps([{ className: column.className }])}>
										<HeaderSort column={column} sort />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody {...getTableBodyProps()}>
						{sortingRow.map((row, i) => {
							prepareRow(row);
							return (
								<TableRow {...row.getRowProps()}>
									{row.cells.map((cell: Cell) => (
										<TableCell {...cell.getCellProps([{ className: cell.column.className }])}>{cell.render("Cell")}</TableCell>
									))}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</ScrollX>
		</MainCard>
	);
}

// ==============================|| REACT TABLE - SORTING ||============================== //

const SortingTable = () => {
	const data = useMemo(() => makeData(40), []);
	const columns = useMemo(
		() => [
			{
				Header: "First Name",
				accessor: "firstName",
			},
			{
				Header: "Last Name",
				accessor: "lastName",
			},
			{
				Header: "Email",
				accessor: "email",
			},
			{
				Header: "Age",
				accessor: "age",
				className: "cell-center",
			},
			{
				Header: "Role",
				accessor: "role",
			},
			{
				Header: "Visits",
				accessor: "visits",
				className: "cell-center",
			},
			{
				Header: "Status",
				accessor: "status",
				Cell: ({ value }: { value: string }) => {
					switch (value) {
						case "Complicated":
							return <Chip color="error" label="Complicated" size="small" variant="light" />;
						case "Relationship":
							return <Chip color="success" label="Relationship" size="small" variant="light" />;
						case "Single":
						default:
							return <Chip color="info" label="Single" size="small" variant="light" />;
					}
				},
			},
			{
				Header: "Profile Progress",
				accessor: "progress",
				Cell: ({ value }: { value: number }) => <LinearWithLabel value={value} sx={{ minWidth: 75 }} />,
			},
		],
		[],
	);

	return <ReactTable columns={columns} data={data} />;
};

export default SortingTable;
