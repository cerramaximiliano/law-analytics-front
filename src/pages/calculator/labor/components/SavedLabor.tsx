import { useCallback, useEffect, useMemo, useState, FC, Fragment, MouseEvent, useRef } from "react";
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
	CardContent,
	Button,
	Box,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
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
import { CSVExport, EmptyTable, HeaderSort, SortingSelect, TablePagination, TableRowSelection } from "components/third-party/ReactTable";
import AlertCustomerDelete from "sections/apps/customer/AlertCustomerDelete";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { Add, Eye, Trash, Copy, Sms, Printer, Link21, Calculator } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { getCalculatorsByFilter } from "store/reducers/calculator";
import { openSnackbar } from "store/reducers/snackbar";
import axios from "axios";
import { useReactToPrint } from "react-to-print";

// ==============================|| REACT TABLE ||============================== //

interface Props {
	columns: Column[];
	data: [];
	handleAdd: () => void;
	renderRowSubComponent: FC<any>;
	isLoading: boolean;
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
}

interface CalculationDetailsProps {
	data: {
		amount: number;
		variables?: Record<string, any>;
	};
}

const CalculationDetails: React.FC<CalculationDetailsProps> = ({ data }) => {
	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [causeNumber, setCauseNumber] = useState("");
	const [updateModalOpen, setUpdateModalOpen] = useState(false);
	const [interestRate, setInterestRate] = useState("");
	const printRef = useRef<HTMLDivElement>(null);

	// Función para generar texto plano
	const generatePlainText = () => {
		let text = "RESULTADOS DE LA LIQUIDACIÓN\n\n";
		const groupedData = groupResults(data?.variables);

		Object.entries(groupedData).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				text += `${group.toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${item.key}: ${
						typeof item.value === "number"
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
        .container { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 24px; }
        .header h2 { color: #333; margin: 0; }
        .card { 
          border: 1px solid #ddd; 
          border-radius: 8px; 
          margin-bottom: 16px; 
          break-inside: avoid;
          page-break-inside: avoid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
        .row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .row:last-child { border-bottom: none; }
        .label { color: #666; }
        .value { font-weight: 500; color: #333; }
        .total-card {
          background-color: #1976d2;
          color: white;
          margin-top: 24px;
        }
        .total-content {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          font-size: 1.2em;
          font-weight: bold;
        }
      </style>
    `;

		const renderCard = (title: string, items: ResultItem[]) => {
			if (!items.length) return "";

			const rows = items
				.map(
					({ key, value }) => `
            <div class="row">
                <span class="label">${key}:</span>
                <span class="value">${
									typeof value === "number"
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
                        <h2>Resultados de la Liquidación</h2>
                    </div>
                    ${cardsHtml}
                    <div class="card total-card">
                        <div class="total-content">
                            <span>TOTAL</span>
                            <span>${new Intl.NumberFormat("es-AR", {
															style: "currency",
															currency: "ARS",
														}).format(data.amount)}</span>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
	};

	// Manejadores de eventos
	const handleLinkToCause = async () => {
		try {
			console.log("Vinculando causa:", causeNumber);
			// Aquí iría la lógica para vincular a la causa
			dispatch(
				openSnackbar({
					open: true,
					message: "Causa vinculada correctamente",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setLinkModalOpen(false);
			setCauseNumber("");
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al vincular la causa",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handleUpdateWithInterest = async () => {
		try {
			console.log("Actualizando con tasa:", interestRate);
			// Aquí iría la lógica para actualizar con intereses
			dispatch(
				openSnackbar({
					open: true,
					message: "Intereses actualizados correctamente",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setUpdateModalOpen(false);
			setInterestRate("");
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al actualizar los intereses",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handleEmailSend = async () => {
		try {
			const htmlBody = generateHtmlContent();
			const textBody = generatePlainText();
			const subject = "Liquidación por Despido - Law||Analytics";

			await axios.post(`${process.env.REACT_APP_BASE_URL}/api/email/send-email`, {
				to: email,
				subject,
				htmlBody,
				textBody,
			});
			dispatch(
				openSnackbar({
					open: true,
					message: `Liquidación enviada correctamente.`,
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setEmailModalOpen(false);
			setEmail("");
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Ha ocurrido un error. Intente más tarde.",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(generatePlainText());
			dispatch(
				openSnackbar({
					open: true,
					message: `Liquidación copiada correctamente.`,
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
		} catch (err) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Ha ocurrido un error al copiar. Intente más tarde.",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
	});

	const renderActionButtons = () => (
		<Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent="center" className="no-print">
			<Tooltip title="Copiar al portapapeles">
				<IconButton onClick={handleCopyToClipboard} color="primary">
					<Copy size={20} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Enviar por email">
				<IconButton onClick={() => setEmailModalOpen(true)} color="primary">
					<Sms size={20} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Imprimir">
				<IconButton onClick={handlePrint} color="primary">
					<Printer size={20} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Vincular a causa">
				<IconButton onClick={() => setLinkModalOpen(true)} color="primary">
					<Link21 size={20} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Actualizar con intereses">
				<IconButton onClick={() => setUpdateModalOpen(true)} color="primary">
					<Calculator size={20} />
				</IconButton>
			</Tooltip>
		</Stack>
	);

	const groupResults = (variables: Record<string, any> | undefined): GroupedResults => {
		const groups: GroupedResults = {
			reclamo: [],
			indemnizacion: [],
			liquidacion: [],
			multas: [],
			otros: [],
		};

		if (!variables) return groups;

		Object.entries(variables).forEach(([key, value]) => {
			if (value == null || value === "" || value === false) return;
			if (typeof value === "object" || typeof value === "boolean") return;
			if (typeof value === "number" && value === 0) return;

			const item: ResultItem = { key, value };

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

	const renderGroup = (title: string, items: ResultItem[]) => {
		if (!items.length) return null;

		return (
			<MainCard shadow={3} title={title} sx={{ mb: 1 }}>
				<CardContent sx={{ py: 1 }}>
					{items.map(({ key, value }) => (
						<Stack key={key} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
							<Typography variant="body2" color="text.secondary">
								{key}:
							</Typography>
							<Typography variant="body2">
								{typeof value === "number"
									? new Intl.NumberFormat("es-AR", {
											style: "currency",
											currency: "ARS",
									  }).format(value)
									: value}
							</Typography>
						</Stack>
					))}
				</CardContent>
			</MainCard>
		);
	};
	const groupedData = groupResults(data?.variables);

	return (
		<>
			<Stack sx={{ p: 2 }} spacing={1}>
				{/* Botones de acción al inicio */}
				{renderActionButtons()}

				<div ref={printRef}>
					{/* Contenido principal */}
					<Stack spacing={1}>
						{renderGroup("Datos del Reclamo", groupedData.reclamo)}
						{renderGroup("Indemnización", groupedData.indemnizacion)}
						{renderGroup("Liquidación Final", groupedData.liquidacion)}
						{renderGroup("Multas", groupedData.multas)}

						<MainCard
							shadow={3}
							sx={{
								mt: 1,
								bgcolor: "primary.main",
								color: "primary.contrastText",
							}}
							content={false}
						>
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }}>
								<Typography variant="h6" color="inherit">
									TOTAL
								</Typography>
								<Typography variant="h6" color="inherit">
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(data.amount)}
								</Typography>
							</Stack>
						</MainCard>
					</Stack>
				</div>
			</Stack>{" "}
			<div className="no-print">
				{/* Email Modal */}
				<Dialog open={emailModalOpen} onClose={() => setEmailModalOpen(false)}>
					<DialogTitle>Enviar por Email</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							margin="dense"
							label="Dirección de Email"
							type="email"
							fullWidth
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setEmailModalOpen(false)}>Cancelar</Button>
						<Button onClick={handleEmailSend} variant="contained">
							Enviar
						</Button>
					</DialogActions>
				</Dialog>

				{/* Link Modal */}
				<Dialog open={linkModalOpen} onClose={() => setLinkModalOpen(false)}>
					<DialogTitle>Vincular a Causa</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							margin="dense"
							label="Número de Causa"
							fullWidth
							value={causeNumber}
							onChange={(e) => setCauseNumber(e.target.value)}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setLinkModalOpen(false)}>Cancelar</Button>
						<Button onClick={handleLinkToCause} variant="contained">
							Vincular
						</Button>
					</DialogActions>
				</Dialog>

				{/* Interest Modal */}
				<Dialog open={updateModalOpen} onClose={() => setUpdateModalOpen(false)}>
					<DialogTitle>Actualizar con Intereses</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							margin="dense"
							label="Tasa de Interés (%)"
							type="number"
							fullWidth
							value={interestRate}
							onChange={(e) => setInterestRate(e.target.value)}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setUpdateModalOpen(false)}>Cancelar</Button>
						<Button onClick={handleUpdateWithInterest} variant="contained">
							Actualizar
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		</>
	);
};

function ReactTable({ columns, data, renderRowSubComponent, handleAdd, isLoading }: Props) {
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
				hiddenColumns: ["_id"],
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
			setHiddenColumns(["_id"]);
		} else {
			setHiddenColumns(["_id"]);
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
												<TablePagination
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
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const calculatorData = useSelector((state: any) => state.calculator.calculators);
	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id;

	const [open, setOpen] = useState<boolean>(false);
	const [customer, setCustomer] = useState<any>(null);
	const [customerDeleteId, setCustomerDeleteId] = useState<any>("");
	const [add, setAdd] = useState<boolean>(false);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			await dispatch(
				getCalculatorsByFilter({
					userId,
					type: "Calculado",
					classType: "laboral",
				}),
			);
			setIsLoading(false);
		};
		fetchData();
	}, [dispatch]);

	const handleAdd = () => {
		setAdd(!add);
		if (customer && !add) setCustomer(null);
	};

	const handleClose = () => {
		setOpen(!open);
	};
	const columns = useMemo(
		() => [
			{
				Header: "#",
				accessor: "_id",
				className: "cell-center",
			},
			{
				Header: "Fecha",
				accessor: "date",
				Cell: ({ value }: { value: unknown }) => (
					<Typography noWrap>{typeof value === "string" ? moment(value).format("DD/MM/YYYY") : value?.toString() || ""}</Typography>
				),
			},
			{
				Header: "Carátula",
				accessor: "folderName",
				Cell: ({ value }: { value: unknown }) => {
					if (!value) {
						return (
							<Button
								variant="contained"
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									console.log("Vincular carátula");
								}}
							>
								Vincular
							</Button>
						);
					}

					return <Typography noWrap>{value?.toString() || ""}</Typography>;
				},
			},
			{
				Header: "Tipo",
				accessor: "type",
			},
			{
				Header: "Categoría",
				accessor: "subClassType",
				Cell: ({ value }: { value: unknown }) => {
					const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

					const formattedValue = value ? (typeof value === "string" ? capitalizeFirst(value) : capitalizeFirst(value.toString())) : "";

					return <Typography noWrap>{formattedValue}</Typography>;
				},
			},
			{
				Header: "Capital",
				accessor: "amount",
				Cell: ({ value }: { value: unknown }) => (
					<Typography>
						{typeof value === "number"
							? new Intl.NumberFormat("es-AR", {
									style: "currency",
									currency: "ARS",
							  }).format(value)
							: value?.toString() || ""}
					</Typography>
				),
			},
			{
				Header: "Intereses",
				accessor: "interest",
				Cell: ({ value }: { value: unknown }) => {
					if (!value) {
						return (
							<Button
								variant="contained"
								size="small"
								onClick={(e) => {
									e.stopPropagation(); // Evita que se expanda la fila
									console.log("Calcular intereses");
								}}
							>
								Calcular
							</Button>
						);
					}

					return (
						<Typography>
							{typeof value === "number"
								? new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
								  }).format(value)
								: value?.toString() || ""}
						</Typography>
					);
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
									<Trash variant="Bulk" />
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

	const renderRowSubComponent = useCallback(
		({ row }: { row: Row<{}> }) => (
			<TableRow>
				<TableCell colSpan={3} /> {/* Este es el desplazamiento */}
				<TableCell colSpan={6}>
					{" "}
					{/* Ajusta este número según la cantidad de columnas restantes */}
					<Stack direction="row" justifyContent="flex-end" sx={{ width: "100%" }}>
						<Box sx={{ width: "100%" }}>
							<CalculationDetails data={row.original as CalculationDetailsProps["data"]} />
						</Box>
					</Stack>
				</TableCell>
			</TableRow>
		),
		[],
	);

	return (
		<MainCard content={false} title={"Cáculos Guardados"}>
			<ScrollX>
				<ReactTable
					columns={columns}
					data={calculatorData}
					handleAdd={handleAdd}
					renderRowSubComponent={renderRowSubComponent}
					isLoading={isLoading}
				/>
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
			></Dialog>
		</MainCard>
	);
};

export default SavedLabor;
