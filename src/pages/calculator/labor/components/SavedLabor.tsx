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
	Chip,
	Checkbox,
	Autocomplete,
	InputAdornment,
	Divider,
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

// assets
import { Add, Eye, Trash, Copy, Sms, Printer, Link21, Calculator, SearchNormal1, UserAdd, DocumentDownload } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { getCalculatorsByFilter } from "store/reducers/calculator";
import { openSnackbar } from "store/reducers/snackbar";
import { getContactsByUserId } from "store/reducers/contacts";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
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
		_id: string;
		folderId?: string;
		amount: number;
		variables?: Record<string, any>;
	};
}

const CustomGlobalFilter = GlobalFilter as any;
const CustomTablePagination = TablePagination as any;

// Update the HeaderSort component
const CustomHeaderSort = HeaderSort as any;

const CustomSortingSelect = SortingSelect as any;

const CalculationDetails: React.FC<CalculationDetailsProps> = ({ data }) => {
	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [emailList, setEmailList] = useState<string[]>([]);
	const [copyToMe, setCopyToMe] = useState(false);
	const [customMessage, setCustomMessage] = useState("");
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [updateModalOpen, setUpdateModalOpen] = useState(false);
	const [interestRate, setInterestRate] = useState("");
	const [contactsLoaded, setContactsLoaded] = useState(false);
	const { contacts, isLoader: contactsLoading } = useSelector((state: any) => state.contacts);
	const { user } = useSelector((state: any) => state.auth);
	const printRef = useRef<HTMLDivElement>(null);

	const { formField } = despidoFormModel;

	const getLabelForKey = (key: string): string => {
		const field = formField[key as keyof typeof formField];
		return field?.label || key;
	};

	// Función para generar texto plano
	const generatePlainText = () => {
		let text = "RESULTADOS DE LA LIQUIDACIÓN\n\n";

		if (customMessage) {
			text += `${customMessage}\n\n`;
		}
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
                    ${
											customMessage
												? `<div class="message-card">
                        <p>${customMessage.replace(/\n/g, "<br>")}</p>
                    </div>`
												: ""
										}
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

	// Manejadores de eventos
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

	// Cargar contactos cuando se abre el modal de email
	useEffect(() => {
		if (emailModalOpen && !contactsLoaded && user?._id) {
			dispatch(getContactsByUserId(user._id));
			setContactsLoaded(true);
		}
	}, [emailModalOpen, contactsLoaded, user?._id]);

	const handleAddEmail = () => {
		// Validar formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (email && emailRegex.test(email) && !emailList.includes(email)) {
			setEmailList([...emailList, email]);
			setEmail("");
		} else if (email && !emailRegex.test(email)) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Por favor ingrese un email válido",
					variant: "alert",
					alert: { color: "warning" },
					close: true,
				}),
			);
		} else if (email && emailList.includes(email)) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Este email ya fue agregado a la lista",
					variant: "alert",
					alert: { color: "info" },
					close: true,
				}),
			);
			setEmail("");
		}
	};

	const handleRemoveEmail = (emailToRemove: string) => {
		setEmailList(emailList.filter((e) => e !== emailToRemove));
	};

	const handleEmailSend = async () => {
		try {
			const htmlBody = generateHtmlContent();
			const textBody = generatePlainText();
			const subject = "Liquidación por Despido - Law||Analytics";

			// Solo usar la lista de emails explícitamente agregados
			const allEmails = [...emailList];

			// Si no hay emails en la lista, mostrar error
			if (allEmails.length === 0) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Debe agregar al menos un email a la lista de destinatarios",
						variant: "alert",
						alert: { color: "warning" },
						close: true,
					}),
				);
				return;
			}

			// Enviar email a todos los destinatarios como array
			await axios.post(`${process.env.REACT_APP_BASE_URL}/api/email/send-email`, {
				to: allEmails, // Enviar como array en lugar de string separado por comas
				subject,
				htmlBody,
				textBody,
				copyToMe: copyToMe,
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
			setEmailList([]);
			setCopyToMe(false);
			setCustomMessage("");
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
								{getLabelForKey(key) || key}:
							</Typography>
							<Typography variant="body2">
								{typeof value === "number" && key !== "Periodos" && key !== "Días Vacaciones"
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
				<Dialog open={emailModalOpen} onClose={() => setEmailModalOpen(false)} maxWidth="md" fullWidth>
					<DialogTitle>Enviar por Email</DialogTitle>
					<DialogContent>
						<Stack spacing={2} sx={{ mt: 1 }}>
							<Stack direction="row" spacing={1}>
								<TextField
									autoFocus
									margin="dense"
									label="Dirección de Email"
									type="email"
									fullWidth
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddEmail();
										}
									}}
									placeholder="Escribe un email y haz clic en Agregar"
								/>
								<Button variant="contained" onClick={handleAddEmail} sx={{ mt: 1 }} color="primary" disabled={!email.trim()}>
									Agregar
								</Button>
							</Stack>
							<Typography variant="caption" color="textSecondary">
								* Debes agregar cada email a la lista de destinatarios antes de enviar.
							</Typography>

							{emailList.length > 0 && (
								<Box sx={{ mt: 2 }}>
									<Typography variant="subtitle2" gutterBottom>
										Destinatarios:
									</Typography>
									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
										{emailList.map((emailItem) => (
											<Chip key={emailItem} label={emailItem} onDelete={() => handleRemoveEmail(emailItem)} sx={{ m: 0.5 }} />
										))}
									</Box>
								</Box>
							)}

							<Divider sx={{ my: 2 }}>
								<Typography variant="caption" color="textSecondary">
									o seleccionar de mis contactos
								</Typography>
							</Divider>

							{contactsLoading ? (
								<Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
									<Typography>Cargando contactos...</Typography>
								</Box>
							) : contacts && contacts.length > 0 ? (
								<Autocomplete
									options={contacts.filter((contact: any) => contact.email)}
									getOptionLabel={(option: any) => `${option.name} ${option.lastName} (${option.email})`}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Buscar contacto"
											variant="outlined"
											InputProps={{
												...params.InputProps,
												startAdornment: (
													<InputAdornment position="start">
														<SearchNormal1 size={18} />
													</InputAdornment>
												),
											}}
										/>
									)}
									renderOption={(props, option: any) => (
										<li {...props}>
											<Stack direction="row" spacing={1} alignItems="center" width="100%">
												<UserAdd size={18} />
												<Stack direction="column" sx={{ overflow: "hidden" }}>
													<Typography variant="body2" noWrap>
														{option.name} {option.lastName}
													</Typography>
													<Typography variant="caption" color="textSecondary" noWrap>
														{option.email}
													</Typography>
												</Stack>
											</Stack>
										</li>
									)}
									onChange={(_, newValue) => {
										if (newValue && newValue.email && !emailList.includes(newValue.email)) {
											setEmailList([...emailList, newValue.email]);
										}
									}}
									sx={{ mt: 1 }}
								/>
							) : null}

							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle2" gutterBottom>
									Mensaje (opcional):
								</Typography>
								<TextField
									multiline
									fullWidth
									rows={4}
									placeholder="Escriba un mensaje personalizado que se incluirá en el correo (opcional)"
									value={customMessage}
									onChange={(e) => setCustomMessage(e.target.value)}
									variant="outlined"
								/>
							</Box>

							<Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
								<Checkbox checked={copyToMe} onChange={(e) => setCopyToMe(e.target.checked)} id="copy-to-me" />
								<Typography component="label" htmlFor="copy-to-me" variant="body2" sx={{ cursor: "pointer" }}>
									Enviarme una copia
								</Typography>
							</Box>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button
							color="error"
							onClick={() => {
								setEmailModalOpen(false);
								setEmail("");
								setEmailList([]);
								setCopyToMe(false);
								setCustomMessage("");
							}}
						>
							Cancelar
						</Button>
						<Button onClick={handleEmailSend} variant="contained">
							Enviar
						</Button>
					</DialogActions>
				</Dialog>

				{/* Link Modal */}
				<LinkCauseModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} calculationId={data._id} folderId={data.folderId} />

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
					spacing={1}
					justifyContent="space-between"
					alignItems="center"
					sx={{ p: 3, pb: 0 }}
				>
					<CustomGlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

					<Stack direction={matchDownSM ? "column" : "row"} alignItems="center" spacing={2}>
						<CustomSortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
						<Tooltip title="Exportar CSV">
							<IconButton
								color="secondary"
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
													{row.isExpanded && renderRowSubComponent({ row })}
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
		[theme],
	) as Column<CalculatorData>[];

	const renderRowSubComponent = useCallback(
		({ row }: { row: Row<CalculatorData> }) => (
			<TableRow>
				<TableCell colSpan={3} />
				<TableCell colSpan={6}>
					<Stack direction="row" justifyContent="flex-end" sx={{ width: "100%" }}>
						<Box sx={{ width: "100%" }}>
							<CalculationDetails data={row.original} />
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
					data={selectedCalculators}
					handleAdd={handleAdd}
					renderRowSubComponent={renderRowSubComponent}
					isLoading={isLoader}
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
