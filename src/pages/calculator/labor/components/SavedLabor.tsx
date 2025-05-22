import { useCallback, useEffect, useMemo, useState, FC, Fragment, MouseEvent } from "react";
// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Skeleton,
	Dialog,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
	Tooltip,
	useMediaQuery,
	Button,
	Box,
	Collapse,
} from "@mui/material";
import { dispatch, useSelector } from "store";
import moment from "moment";
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
import { EmptyTable, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import { CSVLink } from "react-csv";
import AlertCalculatorDelete from "./AlertCalculatorDelete";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";
import { CalculationDetailsView } from "components/calculator/CalculationDetailsView";

// assets
import { Add, Eye, Trash, DocumentDownload } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { getCalculatorsByFilter } from "store/reducers/calculator";
import despidoFormModel from "sections/forms/wizard/calc-laboral/despido/formModel/despidoFormModel";
import LinkCauseModal from "sections/forms/wizard/calc-laboral/components/linkCauseModal";

// ==============================|| REACT TABLE ||============================== //

interface CalculatorData {
	_id: string;
	date: string;
	folderName?: string;
	folderId?: string;
	type: string;
	subClassType: string;
	amount: number;
	interest?: number;
	variables?: Record<string, any>;
}

// Update Props interface
interface Props {
	columns: Column<CalculatorData>[];
	data: CalculatorData[];
	handleAdd: () => void;
	renderRowSubComponent: FC<{ row: Row<CalculatorData> }>;
	isLoading: boolean;
	expandedRowId?: string | null;
	onToggleExpanded?: (rowId: string) => void;
}

interface ResultItem {
	key: string;
	value: number | string;
}

interface GroupedResults {
	reclamo: ResultItem[];
	indemnizacion: ResultItem[];
	liquidacion: ResultItem[];
	multas: ResultItem[];
	otros: ResultItem[];
	[key: string]: ResultItem[];
}

interface CalculationDetailsProps {
	data: {
		_id: string;
		folderId?: string;
		amount: number;
		variables?: Record<string, any>;
		subClassType?: string;
		type?: string;
	};
}

const CustomGlobalFilter = GlobalFilter as any;
const CustomTablePagination = TablePagination as any;

// Update the HeaderSort component
const CustomHeaderSort = HeaderSort as any;

const CustomSortingSelect = SortingSelect as any;

const CalculationDetails: React.FC<CalculationDetailsProps> = ({ data }) => {
	const { formField } = despidoFormModel;

	const getLabelForKey = (key: string): string => {
		// Manejo especial para carátula
		if (key === "caratula") {
			return "Carátula";
		}

		const field = formField[key as keyof typeof formField];
		return field?.label || key;
	};

	// Función para generar texto plano
	const generatePlainText = () => {
		let text = "RESULTADOS DE LA LIQUIDACIÓN\n\n";

		const groupedData = groupResults(data?.variables);

		Object.entries(groupedData).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				text += `${group.toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${getLabelForKey(item.key)}: ${
						typeof item.value === "number" && item.key !== "Periodos" && item.key !== "Días Vacaciones"
							? new Intl.NumberFormat("es-AR", {
									style: "currency",
									currency: "ARS",
							  }).format(item.value)
							: item.value
					}\n`;
				});
				text += "\n";
			}
		});

		text += `TOTAL: ${new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(data.amount)}`;

		return text;
	};

	// Función para generar contenido HTML
	const generateHtmlContent = () => {
		const styles = `
	      <style>
	        body {
	          font-family: Arial, sans-serif;
	          line-height: 1.6;
	          color: #333;
	          max-width: 800px;
	          margin: 0 auto;
	          padding: 20px;
	        }
	        .container { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
	        .header { text-align: center; margin-bottom: 24px; }
	        .header h1, .header h2 { color: #333; margin: 0; }
	        .card {
	          border: 1px solid #ddd;
	          border-radius: 8px;
	          margin-bottom: 16px;
	          break-inside: avoid;
	          page-break-inside: avoid;
	          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
	          overflow: hidden;
	        }
	        .card-header {
	          background-color: #f5f5f5;
	          padding: 12px 16px;
	          border-bottom: 1px solid #ddd;
	          border-radius: 8px 8px 0 0;
	          font-weight: bold;
	          color: #333;
	        }
	        .card-content { padding: 16px; }
	        .row, .item-row {
	          display: flex;
	          justify-content: space-between;
	          padding: 8px 0;
	          border-bottom: 1px solid #eee;
	        }
	        .row:last-child, .item-row:last-child { border-bottom: none; }
	        .label { color: #666; }
	        .value { font-weight: 500; color: #333; }
	        .total-card {
	          background-color: #1976d2;
	          color: white;
	          padding: 16px;
	          border-radius: 8px;
	          margin-top: 16px;
	          display: flex;
	          justify-content: space-between;
	          align-items: center;
	        }
	        .total-content {
	          display: flex;
	          justify-content: space-between;
	          padding: 16px;
	          font-size: 1.2em;
	          font-weight: bold;
	        }
	        .total-label {
	          font-size: 18px;
	          font-weight: bold;
	        }
	        .total-value {
	          font-size: 18px;
	          font-weight: bold;
	        }
	        .footer {
	          margin-top: 24px;
	          text-align: center;
	          font-size: 12px;
	          color: #666;
	        }
	        .message-card {
	          border: 1px solid #ddd;
	          border-radius: 8px;
	          margin-bottom: 16px;
	          padding: 16px;
	          background-color: #f9f9f9;
	          line-height: 1.5;
	        }
	      </style>
	    `;

		const renderCard = (title: string, items: ResultItem[]) => {
			if (!items.length) return "";

			const rows = items
				.map(
					({ key, value }) => `
	            <div class="row">
	                <span class="label">${getLabelForKey(key) || key}:</span>
	                <span class="value">${
										typeof value === "number" && key !== "Periodos" && key !== "Días Vacaciones"
											? new Intl.NumberFormat("es-AR", {
													style: "currency",
													currency: "ARS",
											  }).format(value)
											: value
									}</span>
	            </div>
	        `,
				)
				.join("");

			return `
	            <div class="card">
	                <div class="card-header">${title}</div>
	                <div class="card-content">${rows}</div>
	            </div>
	        `;
		};

		const groupedData = groupResults(data?.variables);
		const sections = [
			{ title: "Datos del Reclamo", data: groupedData.reclamo },
			{ title: "Indemnización", data: groupedData.indemnizacion },
			{ title: "Liquidación Final", data: groupedData.liquidacion },
			{ title: "Multas", data: groupedData.multas },
		];

		const cardsHtml = sections
			.map((section) => renderCard(section.title, section.data))
			.filter((card) => card !== "")
			.join("");

		return `
	        <!DOCTYPE html>
	        <html>
	            <head>
	                <meta charset="utf-8">
	                <meta name="viewport" content="width=device-width, initial-scale=1.0">
	                ${styles}
	            </head>
	            <body>
	                <div class="container">
	                    <div class="header">
	                        <h1>Resultados de la Liquidación</h1>
	                    </div>
	                    ${cardsHtml}
	                    <div class="total-card">
	                        <span class="total-label">TOTAL</span>
	                        <span class="total-value">${new Intl.NumberFormat("es-AR", {
														style: "currency",
														currency: "ARS",
													}).format(data.amount)}</span>
	                    </div>

	                    <div class="footer">
	                      <p>Este documento fue generado automáticamente por Law||Analytics.</p>
	                    </div>
	                </div>
	            </body>
	        </html>
	    `;
	};

	const groupResults = (variables: Record<string, any> | undefined): GroupedResults => {
		const groups: GroupedResults = {
			reclamo: [],
			indemnizacion: [],
			liquidacion: [],
			multas: [],
			otros: [],
		};

		if (!variables) return groups;

		// Detectar si hay una carpeta vinculada
		const isLinkedToFolder =
			variables.reclamante && typeof variables.reclamante === "string" && variables.reclamante.startsWith("__CAUSA_VINCULADA__");

		// Si hay carpeta vinculada, extraer el nombre de la carpeta
		if (isLinkedToFolder) {
			const folderName =
				variables.folderName ||
				(typeof variables.reclamante === "string" ? variables.reclamante.replace("__CAUSA_VINCULADA__", "").trim() : "");

			if (folderName) {
				groups.reclamo.push({ key: "caratula", value: folderName });
			}
		}

		Object.entries(variables).forEach(([key, value]) => {
			if (value == null || value === "" || value === false) return;
			if (typeof value === "object" || typeof value === "boolean") return;
			if (typeof value === "number" && value === 0) return;

			const item: ResultItem = { key, value };

			// Excluir reclamante y reclamado si hay carpeta vinculada
			if (isLinkedToFolder && (key === "reclamante" || key === "reclamado")) {
				return;
			}

			if (["reclamante", "reclamado", "fechaIngreso", "fechaEgreso", "remuneracion"].includes(key)) {
				groups.reclamo.push(item);
			} else if (key === "Indemnizacion" || key === "Periodos") {
				groups.indemnizacion.push(item);
			} else if (
				key.includes("Preaviso") ||
				key.includes("SAC") ||
				key.includes("Integracion") ||
				key.includes("Vacaciones") ||
				key.includes("Días Trabajados")
			) {
				groups.liquidacion.push(item);
			} else if (key.includes("Multa")) {
				groups.multas.push(item);
			}
		});

		return groups;
	};

	const formatValue = (key: string, value: number | string): string => {
		if (typeof value === "number" && key !== "Periodos" && key !== "Días Vacaciones") {
			return new Intl.NumberFormat("es-AR", {
				style: "currency",
				currency: "ARS",
			}).format(value);
		}
		return String(value);
	};

	return (
		<CalculationDetailsView
			data={data}
			getLabelForKey={getLabelForKey}
			formatValue={formatValue}
			groupResults={groupResults}
			generateHtmlContent={generateHtmlContent}
			generatePlainText={generatePlainText}
			customTitle="Liquidación por Despido - Law||Analytics"
			hideInterestButton={false}
		/>
	);
};

function ReactTable({ columns, data, renderRowSubComponent, handleAdd, isLoading, expandedRowId, onToggleExpanded }: Props) {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	const filterTypes = useMemo(() => renderFilterTypes, []);
	const sortBy = { id: "_id", desc: false };

	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		prepareRow,
		setHiddenColumns,
		allColumns,

		rows,
		page,
		gotoPage,
		setPageSize,
		state: { globalFilter, selectedRowIds, pageIndex, pageSize },
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
				hiddenColumns: ["_id", "folderId"],
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
			setHiddenColumns(["_id", "folderId"]);
		} else {
			setHiddenColumns(["_id", "folderId"]);
		}
		// eslint-disable-next-line
	}, [matchDownSM]);

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
						<CustomGlobalFilter
							preGlobalFilteredRows={preGlobalFilteredRows}
							globalFilter={globalFilter}
							setGlobalFilter={setGlobalFilter}
						/>

						{/* Segunda línea: Selector de ordenamiento */}
						<CustomSortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
					</Stack>

					{/* Lado derecho - Botón de exportación */}
					<Stack direction="column" spacing={2} sx={{ width: matchDownSM ? "100%" : "auto" }}>
						<Tooltip title="Exportar a CSV">
							<IconButton
								color="primary"
								size="medium"
								sx={{
									position: "relative",
								}}
							>
								<CSVLink
									data={selectedFlatRows.length > 0 ? selectedFlatRows.map((d: Row<CalculatorData>) => d.original) : data}
									filename={"calculos-laborales.csv"}
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
					</Stack>
				</Stack>
				<Table {...getTableProps()}>
					<TableHead>
						{headerGroups.map((headerGroup: HeaderGroup<CalculatorData>) => (
							<TableRow {...headerGroup.getHeaderGroupProps()} sx={{ "& > th:first-of-type": { width: "40px" } }}>
								{headerGroup.headers.map((column: HeaderGroup<CalculatorData>) => (
									<TableCell {...column.getHeaderProps([{ className: column.className }])}>
										<CustomHeaderSort column={column} sort />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody {...getTableBodyProps()}>
						{isLoading ? (
							<>
								{Array.from({ length: 10 }).map((_, rowIndex) => (
									<TableRow key={rowIndex}>
										{headerGroups[0].headers.map((column, cellIndex) => (
											<TableCell key={cellIndex}>
												<Skeleton />
											</TableCell>
										))}
									</TableRow>
								))}
							</>
						) : (
							<>
								{data.length > 0 ? (
									<>
										{page.map((row: Row<CalculatorData>, i: number) => {
											prepareRow(row);
											const isRowExpanded = expandedRowId === row.original._id;

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
														{row.cells.map((cell: Cell<CalculatorData>) => (
															<TableCell {...cell.getCellProps([{ className: cell.column.className }])}>{cell.render("Cell")}</TableCell>
														))}
													</TableRow>
													<TableRow sx={{ "&:hover": { bgcolor: "inherit !important" } }}>
														<TableCell colSpan={columns.length + 1} sx={{ p: 0 }}>
															<Collapse in={isRowExpanded} timeout="auto" unmountOnExit>
																<Box
																	sx={{
																		margin: 2,
																		bgcolor: theme.palette.mode === "dark" ? "grey.800" : "#f5f5f5",
																		borderRadius: 2,
																		p: 0,
																		border: `1px solid ${theme.palette.divider}`,
																		boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
																		"&:hover": {
																			bgcolor: theme.palette.mode === "dark" ? "grey.800" : "#f5f5f5",
																		},
																	}}
																>
																	{renderRowSubComponent({ row })}
																</Box>
															</Collapse>
														</TableCell>
													</TableRow>
												</Fragment>
											);
										})}
										<TableRow sx={{ "&:hover": { bgcolor: "transparent !important" } }}>
											<TableCell sx={{ p: 2, py: 3 }} colSpan={9}>
												<CustomTablePagination
													gotoPage={gotoPage}
													rows={rows}
													setPageSize={setPageSize}
													pageSize={pageSize}
													pageIndex={pageIndex}
												/>
											</TableCell>
										</TableRow>
									</>
								) : (
									<EmptyTable msg="No Hay Datos" colSpan={7} />
								)}
							</>
						)}
					</TableBody>
				</Table>
			</Stack>
		</>
	);
}

const SavedLabor = () => {
	const theme = useTheme();
	const mode = theme.palette.mode;
	const { selectedCalculators, isLoader } = useSelector((state: any) => state.calculator);
	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id;

	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [selectedCalculationId, setSelectedCalculationId] = useState("");

	const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
	const [calculatorIdToDelete, setCalculatorIdToDelete] = useState<string>("");
	const [add, setAdd] = useState<boolean>(false);
	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			await dispatch(
				getCalculatorsByFilter({
					userId,
					type: "Calculado",
					classType: "laboral",
				}),
			);
		};
		fetchData();
	}, [dispatch]);

	const handleAdd = () => {
		setAdd(!add);
	};

	const handleOpenDeleteModal = (id: string) => {
		setCalculatorIdToDelete(id);
		setDeleteModalOpen(true);
	};

	const handleCloseDeleteModal = () => {
		setDeleteModalOpen(false);
		setCalculatorIdToDelete("");
	};

	const handleToggleExpanded = useCallback((rowId: string) => {
		setExpandedRowId((prev) => (prev === rowId ? null : rowId));
	}, []);

	const columns = useMemo(
		() => [
			{
				Header: "#",
				accessor: "_id",
				className: "cell-center",
			},
			{
				Header: "folderId",
				accessor: "folderId",
				className: "cell-center",
			},
			{
				Header: "Fecha",
				accessor: "date",
				Cell: ({ row }: { row: Row<CalculatorData> }) => (
					<Typography noWrap>{row.original.date ? moment(row.original.date).format("DD/MM/YYYY") : "-"}</Typography>
				),
			},
			{
				Header: "Carátula",
				accessor: "folderName",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					if (!row.original.folderName) {
						return (
							<Button
								variant="contained"
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									setSelectedCalculationId(row.original._id);
									setLinkModalOpen(true);
								}}
							>
								Vincular
							</Button>
						);
					}
					return (
						<Tooltip title={row.original.folderName}>
							<Typography
								noWrap
								sx={{
									maxWidth: "200px",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									display: "block",
								}}
							>
								{row.original.folderName}
							</Typography>
						</Tooltip>
					);
				},
			},
			{
				Header: "Tipo",
				accessor: "type",
			},
			{
				Header: "Categoría",
				accessor: "subClassType",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					const capitalizeFirst = (str: string | undefined) => {
						if (!str) return "-";
						return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
					};
					return <Typography noWrap>{capitalizeFirst(row.original.subClassType)}</Typography>;
				},
			},
			{
				Header: "Capital",
				accessor: "amount",
				Cell: ({ row }: { row: Row<CalculatorData> }) => (
					<Typography>
						{row.original.amount
							? new Intl.NumberFormat("es-AR", {
									style: "currency",
									currency: "ARS",
							  }).format(row.original.amount)
							: "-"}
					</Typography>
				),
			},
			{
				Header: "Intereses",
				accessor: "interest",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					if (!row.original.interest) {
						return (
							<Button
								variant="contained"
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									console.log("Calcular intereses");
								}}
							>
								Calcular
							</Button>
						);
					}

					return (
						<Typography>
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(row.original.interest)}
						</Typography>
					);
				},
			},
			{
				Header: "Acciones",
				accessor: "actions",
				className: "cell-center",
				disableSortBy: true,
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					const isExpanded = expandedRowId === row.original._id;
					const collapseIcon = isExpanded ? (
						<Add style={{ color: theme.palette.error.main, transform: "rotate(45deg)" }} />
					) : (
						<Eye variant="Bulk" />
					);
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
										if (handleToggleExpanded) {
											handleToggleExpanded(row.original._id);
										}
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
								title="Eliminar"
							>
								<IconButton
									color="error"
									onClick={(e: MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										handleOpenDeleteModal(row.original._id);
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
		[theme, expandedRowId, handleToggleExpanded],
	) as Column<CalculatorData>[];

	const renderRowSubComponent = useCallback(
		({ row }: { row: Row<CalculatorData> }) => (
			<Stack direction="row" justifyContent="flex-end" sx={{ width: "100%" }}>
				<Box sx={{ width: "100%" }}>
					<CalculationDetails data={row.original} />
				</Box>
			</Stack>
		),
		[],
	);

	return (
		<MainCard content={false} title={"Cáculos Laborales Guardados"}>
			<ScrollX>
				<ReactTable
					columns={columns}
					data={selectedCalculators}
					handleAdd={handleAdd}
					renderRowSubComponent={renderRowSubComponent}
					isLoading={isLoader}
					expandedRowId={expandedRowId}
					onToggleExpanded={handleToggleExpanded}
				/>
			</ScrollX>
			<AlertCalculatorDelete id={calculatorIdToDelete} open={deleteModalOpen} handleClose={handleCloseDeleteModal} />
			{/* add customer dialog */}
			<LinkCauseModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} calculationId={selectedCalculationId} />
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				keepMounted
				fullWidth
				onClose={handleAdd}
				open={add}
				sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
				aria-describedby="alert-dialog-slide-description"
			></Dialog>
		</MainCard>
	);
};

export default SavedLabor;
