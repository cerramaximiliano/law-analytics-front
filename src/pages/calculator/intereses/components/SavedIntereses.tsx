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
import { Add, Eye, Trash, Copy, Sms, Printer, Link21, SearchNormal1, UserAdd, DocumentDownload } from "iconsax-react";

// types
import { ThemeMode } from "types/config";
import { getCalculatorsByFilter } from "store/reducers/calculator";
import { openSnackbar } from "store/reducers/snackbar";
import { getContactsByUserId } from "store/reducers/contacts";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
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
	customLabel?: string;
	formatType?: string;
}

interface GroupedResults {
	detalles: ResultItem[];
	calculos: ResultItem[];
	intereses: ResultItem[];
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
	const [contactsLoaded, setContactsLoaded] = useState(false);
	const { contacts, isLoader: contactsLoading } = useSelector((state: any) => state.contacts);
	const { user } = useSelector((state: any) => state.auth);
	const printRef = useRef<HTMLDivElement>(null);

	// Función para obtener etiquetas personalizadas o claves directamente
	const getLabelForKey = (key: string, customLabel?: string): string => {
		if (customLabel) {
			return customLabel;
		}
		return key;
	};

	const formatValue = (key: string, value: number | string, formatType?: string): string => {
		// Formato específico según el tipo indicado
		if (formatType === "percentage") {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return `${(numValue * 100).toFixed(2)}%`;
			}
		} else if (formatType === "plainNumber") {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return numValue.toString();
			}
		}

		// Para valores especiales que NO deberían tener formato monetario
		if (key === "valorInicial" || key === "valorFinal") {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return numValue.toFixed(6); // Mostrar con 6 decimales sin formato de moneda
			}
		}

		// Formatos por defecto según la clave
		if (key === "fechaInicial" || key === "fechaFinal") {
			const date = moment(value);
			if (date.isValid()) {
				return date.format("DD/MM/YYYY");
			}
			return String(value);
		}

		// Para valores monetarios (por defecto)
		if (typeof value === "number" || !isNaN(Number(value))) {
			const numValue = Number(value);
			if (!isNaN(numValue)) {
				return new Intl.NumberFormat("es-AR", {
					style: "currency",
					currency: "ARS",
				}).format(numValue);
			}
		}

		return String(value);
	};

	// Función para generar texto plano
	const generatePlainText = () => {
		let text = "Liquidación de Intereses\n\n";

		if (customMessage) {
			text += `${customMessage}\n\n`;
		}
		const groupedData = data?.variables?.calculationResult || groupResults(data?.variables);

		// Usar una aserción de tipo para ayudar a TypeScript a entender la estructura
		Object.entries(groupedData as Record<string, ResultItem[]>).forEach(([group, items]) => {
			if (items && items.length) {
				text += `${getGroupTitle(group).toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${getLabelForKey(item.key, item.customLabel)}: ${formatValue(item.key, item.value, item.formatType)}\n`;
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

	const generateHtmlContent = () => {
		let html = `
		  <!DOCTYPE html>
		  <html lang="es">
		  <head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Liquidación de Intereses</title>
			<style>
			  body {
				font-family: Arial, sans-serif;
				line-height: 1.6;
				color: #333;
				max-width: 800px;
				margin: 0 auto;
				padding: 20px;
			  }
			  .container {
				font-family: Arial, sans-serif;
				max-width: 800px;
				margin: 0 auto;
				padding: 20px;
			  }
			  .header {
				text-align: center;
				margin-bottom: 24px;
			  }
			  .header h1, .header h2 {
				color: #333;
				margin: 0;
			  }
			  .card {
				border: 1px solid #ddd;
				border-radius: 8px;
				margin-bottom: 16px;
				box-shadow: 0 2px 5px rgba(0,0,0,0.1);
				overflow: hidden;
				break-inside: avoid;
				page-break-inside: avoid;
			  }
			  .card-header {
				background-color: #f5f5f5;
				padding: 12px 16px;
				font-weight: bold;
				border-bottom: 1px solid #ddd;
				border-radius: 8px 8px 0 0;
				color: #333;
			  }
			  .card-content {
				padding: 16px;
			  }
			  .item-row, .row {
				display: flex;
				justify-content: space-between;
				padding: 8px 0;
				border-bottom: 1px solid #eee;
			  }
			  .item-row:last-child, .row:last-child {
				border-bottom: none;
			  }
			  .label {
				color: #666;
			  }
			  .value {
				font-weight: 500;
				color: #333;
			  }
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
		  </head>
		  <body>
			<div class="container">
				<div class="header">
					<h1>Liquidación de Intereses</h1>
				</div>
				${
					customMessage
						? `<div class="message-card">
					<p>${customMessage.replace(/\n/g, "<br>")}</p>
				</div>`
						: ""
				}
		`;

		const groupedData = data?.variables?.calculationResult || groupResults(data?.variables);

		// Generar secciones de tarjetas para cada grupo
		Object.entries(groupedData as Record<string, ResultItem[]>).forEach(([group, items]) => {
			if (items && items.length) {
				const title = getGroupTitle(group);
				html += `
			  <div class="card">
				<div class="card-header">${title.toUpperCase()}</div>
				<div class="card-content">
			`;

				items.forEach((item: ResultItem) => {
					const label = getLabelForKey(item.key, item.customLabel);
					const value = formatValue(item.key, item.value, item.formatType);
					html += `
				<div class="item-row">
				  <span class="label">${label}:</span>
				  <span class="value">${value}</span>
				</div>
			  `;
				});

				html += `
				</div>
			  </div>
			`;
			}
		});

		// Agregar la tarjeta de total
		const totalFormatted = new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(data.amount);

		html += `
			<div class="total-card">
			  <span class="total-label">CAPITAL ACTUALIZADO</span>
			  <span class="total-value">${totalFormatted}</span>
			</div>
	  
			<div class="footer">
			  <p>Este documento fue generado automáticamente por Law||Analytics.</p>
			</div>
			</div>
		  </body>
		  </html>
		`;

		return html;
	};

	// Manejadores de eventos

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
			const textBody = generatePlainText();
			const htmlBody = generateHtmlContent();
			const subject = "Liquidación de Intereses - Law||Analytics";

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
				textBody,
				htmlBody,
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
		</Stack>
	);

	// Función para obtener el título del grupo
	const getGroupTitle = (groupKey: string): string => {
		const titles: Record<string, string> = {
			detalles: "Detalles del Cálculo",
			calculos: "Metodología de Cálculo",
			intereses: "Resultados",
		};
		return titles[groupKey] || groupKey;
	};

	const groupResults = (variables: Record<string, any> | undefined): GroupedResults => {
		const groups: GroupedResults = {
			detalles: [],
			calculos: [],
			intereses: [],
		};

		if (!variables) return groups;

		// Si ya tenemos un resultado precalculado
		if (variables.calculationResult) {
			return variables.calculationResult as GroupedResults;
		}

		// De lo contrario, intentamos agrupar los datos
		// Agregamos datos básicos
		if (variables.tasa) {
			groups.detalles.push({
				key: "tasa",
				value: variables.tasa,
				customLabel: "Tipo de Tasa",
			});
		}
		if (variables.fechaInicial) {
			groups.detalles.push({
				key: "fechaInicial",
				value: variables.fechaInicial,
				customLabel: "Fecha Inicial",
			});
		}
		if (variables.fechaFinal) {
			groups.detalles.push({
				key: "fechaFinal",
				value: variables.fechaFinal,
				customLabel: "Fecha Final",
			});
		}
		if (variables.capital) {
			groups.detalles.push({
				key: "capital",
				value: variables.capital,
				customLabel: "Capital",
			});
		}

		// Agregamos datos de interés
		if (variables.tasasResult) {
			if (variables.tasasResult.resultado !== undefined) {
				groups.calculos.push({
					key: "coeficiente",
					value: variables.tasasResult.resultado,
					customLabel: "Coeficiente de Tasa",
					formatType: "percentage",
				});

				// Calcular intereses
				const capitalBase = typeof variables.capital === "number" ? variables.capital : parseFloat(variables.capital || "0");
				const coeficiente = variables.tasasResult.resultado || 0;
				const interesesCalculados = capitalBase * coeficiente;

				// Agregar resultados
				groups.intereses.push({
					key: "capitalBase",
					value: capitalBase,
					customLabel: "Capital",
				});
				groups.intereses.push({
					key: "interesCalculado",
					value: interesesCalculados,
					customLabel: "Intereses",
				});
				groups.intereses.push({
					key: "capitalActualizado",
					value: capitalBase + interesesCalculados,
					customLabel: "Capital Actualizado",
				});
			}
		}

		return groups;
	};

	const renderGroup = (title: string, items: ResultItem[]) => {
		if (!items || !items.length) return null;

		return (
			<MainCard shadow={3} title={title} sx={{ mb: 1 }}>
				<CardContent sx={{ py: 1 }}>
					{items.map(({ key, value, customLabel, formatType }) => (
						<Stack key={key} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
							<Typography variant="body2" color="text.secondary">
								{getLabelForKey(key, customLabel)}:
							</Typography>
							<Typography variant="body2">{formatValue(key, value, formatType)}</Typography>
						</Stack>
					))}
				</CardContent>
			</MainCard>
		);
	};

	const groupedData = data?.variables?.calculationResult || groupResults(data?.variables);

	return (
		<>
			<Stack sx={{ p: 2 }} spacing={1}>
				{/* Botones de acción al inicio */}
				{renderActionButtons()}

				<div ref={printRef}>
					{/* Contenido principal */}
					<Stack spacing={1}>
						{renderGroup("Detalles del Cálculo", groupedData.detalles)}
						{renderGroup("Metodología de Cálculo", groupedData.calculos)}
						{renderGroup("Resultados", groupedData.intereses)}

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
									CAPITAL ACTUALIZADO
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
			</Stack>
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
									filename={"calculos-intereses.csv"}
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

const SavedIntereses = () => {
	const theme = useTheme();
	const mode = theme.palette.mode;
	const { selectedCalculators, isLoader } = useSelector((state: any) => state.calculator);
	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id;

	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [selectedCalculationId, setSelectedCalculationId] = useState("");

	const [open, setOpen] = useState<boolean>(false);
	const [customer, setCustomer] = useState<any>(null);
	const [calculatorIdToDelete, setCalculatorIdToDelete] = useState<string>("");
	const [add, setAdd] = useState<boolean>(false);

	useEffect(() => {
		const fetchData = async () => {
			await dispatch(
				getCalculatorsByFilter({
					userId,
					type: "Calculado",
					classType: "intereses",
				}),
			);
		};
		fetchData();
	}, [userId]);

	const handleDeleteDialogClose = () => {
		setOpen(false);
		setCalculatorIdToDelete("");
	};

	const handleAdd = () => {
		setAdd(!add);
		if (customer && !add) setCustomer(null);
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
				Header: "Tipo de Tasa",
				accessor: "subClassType",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					// Función para obtener un nombre legible de la tasa
					const getTasaLabel = (tasaValue: string): string => {
						const tasasMapping: Record<string, string> = {
							tasaPasivaBNA: "Tasa Pasiva BNA",
							tasaPasivaBCRA: "Tasa Pasiva BCRA",
							tasaActivaBNA: "Tasa Activa BNA",
							tasaActivaTnaBNA: "Tasa Activa TNA BNA",
							cer: "CER",
							icl: "ICL BCRA",
							tasaActivaCNAT2601: "Tasa Activa BNA - Acta 2601",
							tasaActivaCNAT2658: "Tasa Activa BNA - Acta 2658",
							tasaActivaCNAT2764: "Tasa Activa BNA - Acta 2764",
						};
						return tasasMapping[tasaValue] || tasaValue;
					};

					return <Typography noWrap>{getTasaLabel(row.original.subClassType)}</Typography>;
				},
			},
			{
				Header: "Capital",
				accessor: "amount",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					// Considerando que el monto total incluye capital + intereses, obtener el capital original
					let capital = row.original.amount;
					if (row.original.interest) {
						capital = row.original.amount - row.original.interest;
					} else if (row.original.variables?.capital) {
						capital =
							typeof row.original.variables.capital === "number"
								? row.original.variables.capital
								: parseFloat(row.original.variables.capital);
					}

					return (
						<Typography>
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(capital)}
						</Typography>
					);
				},
			},
			{
				Header: "Intereses",
				accessor: "interest",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					if (!row.original.interest) {
						// Si no hay interés registrado, buscamos en variables
						let interes = 0;
						if (row.original.variables?.tasasResult?.resultado && row.original.variables?.capital) {
							const capital =
								typeof row.original.variables.capital === "number"
									? row.original.variables.capital
									: parseFloat(row.original.variables.capital);
							const coef = row.original.variables.tasasResult.resultado;
							interes = capital * coef;
						}

						if (interes > 0) {
							return (
								<Typography>
									{new Intl.NumberFormat("es-AR", {
										style: "currency",
										currency: "ARS",
									}).format(interes)}
								</Typography>
							);
						}

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
				Header: "Total",
				accessor: "total",
				Cell: ({ row }: { row: Row<CalculatorData> }) => {
					return (
						<Typography>
							{new Intl.NumberFormat("es-AR", {
								style: "currency",
								currency: "ARS",
							}).format(row.original.amount)}
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
										setCalculatorIdToDelete(row.original._id);
										setOpen(true);
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
		[theme, mode],
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
		<MainCard content={false} title={"Cálculos de Intereses Guardados"}>
			<ScrollX>
				<ReactTable
					columns={columns}
					data={selectedCalculators}
					handleAdd={handleAdd}
					renderRowSubComponent={renderRowSubComponent}
					isLoading={isLoader}
				/>
			</ScrollX>
			<AlertCalculatorDelete id={calculatorIdToDelete} title={`Cálculo de Intereses`} open={open} handleClose={handleDeleteDialogClose} />
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

export default SavedIntereses;
