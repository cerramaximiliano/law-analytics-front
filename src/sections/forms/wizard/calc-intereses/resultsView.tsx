import React, { useState, useRef } from "react";
import {
	CardContent,
	Typography,
	Stack,
	IconButton,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Zoom,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
} from "@mui/material";
import MainCard from "components/MainCard";
import { Copy, Sms, Printer, Save2 } from "iconsax-react";
import styled from "@emotion/styled";
import { useReactToPrint } from "react-to-print";
import { enqueueSnackbar } from "notistack";
import { dispatch, useSelector, RootState } from "store";
import { addCalculator } from "store/reducers/calculator";
import { CalculatorType } from "types/calculator";

//third party
import moment from "moment";
import axios from "axios";

// Tipos
interface ResultItem {
	key: string;
	value: number | string;
	customLabel?: string; // Nuevo campo para etiquetas personalizadas
	formatType?: string; // Tipo especial de formato: 'percentage', 'plainNumber', etc.
}

interface GroupedResults {
	intereses: ResultItem[];
	capital: ResultItem[];
	detalles: ResultItem[];
	calculos: ResultItem[];
}

interface ResultsViewProps {
	values: Record<string, any>;
	formField: any;
	onReset: () => void;
	onSave?: (data: any) => void; // Función opcional para notificar al componente padre que se guardó el cálculo
	currentUser?: {
		id: string;
		name?: string;
		email?: string;
	}; // Información del usuario actual
	folderId?: string; // ID de la carpeta si el cálculo se guarda en una carpeta
	folderName?: string; // Nombre de la carpeta
	groupId?: string; // ID del grupo si el cálculo pertenece a un grupo
}

const PrintContainer = styled("div")`
	@media print {
		@page {
			size: auto;
			margin: 20mm;
		}

		& .no-print {
			display: none !important;
		}

		& .MuiCard-root {
			break-inside: avoid;
			page-break-inside: avoid;
			margin-bottom: 16px;
			border: 1px solid #ddd;
		}

		& .total-card {
			break-inside: avoid;
			page-break-inside: avoid;
			background-color: #f5f5f5 !important;
			color: #000 !important;
		}

		& .MuiTypography-root {
			color: #000 !important;
		}
	}
`;

// Función para formatear el nombre del tipo de índice
const formatTipoIndice = (tipoIndice: string): string => {
	const tiposIndiceMap: Record<string, string> = {
		interesDiario: "Interés diario",
		indexado: "Indexado",
	};

	return tiposIndiceMap[tipoIndice] || tipoIndice;
};

const ResultsView: React.FC<ResultsViewProps> = ({ values, formField, onReset, onSave, currentUser, folderId, folderName, groupId }) => {
	console.log(values);
	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [isSaved, setIsSaved] = useState(false);
	const [showTasasModal, setShowTasasModal] = useState(false);

	const printRef = useRef<HTMLDivElement>(null);

	const userFromRedux = useSelector((state: RootState) => state.auth.user);

	// Función mejorada para obtener etiquetas, ahora puede usar etiquetas personalizadas
	const getLabelForKey = (key: string, customLabel?: string): string => {
		if (customLabel) {
			return customLabel;
		}
		const field = formField[key as keyof typeof formField];
		return field?.label || key;
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

	// Función para obtener el nombre legible de la tasa
	const getTasaLabel = (tasaValue: string): string => {
		// Aquí se podría consultar un mapping de valores de tasa a sus etiquetas
		// Por ahora usaremos un mapeo simple
		const tasasMapping: Record<string, string> = {
			tasaPasivaBNA: "Tasa Pasiva Banco Nación",
			tasaPasivaBCRA: "Tasa Pasiva BCRA",
			tasaActivaBNA: "Tasa Activa Banco Nación",
			tasaActivaTnaBNA: "Tasa Activa TNA Banco Nación",
			cer: "CER",
			icl: "ICL BCRA",
			tasaActivaCNAT2601: "Tasa Activa Banco Nación - Acta 2601",
			tasaActivaCNAT2658: "Tasa Activa Banco Nación - Acta 2658",
			tasaActivaCNAT2764: "Tasa Activa Banco Nación - Acta 2764",
		};

		return tasasMapping[tasaValue] || tasaValue;
	};

	const groupResults = (inputValues: Record<string, any>): GroupedResults => {
		const groups: GroupedResults = {
			intereses: [],
			capital: [], // Mantendremos este grupo vacío
			detalles: [],
			calculos: [],
		};

		// Agregar datos básicos del caso
		if (inputValues.tasa) {
			groups.detalles.push({
				key: "tasa",
				// Utilizar getTasaLabel para mostrar el nombre legible de la tasa
				value: getTasaLabel(inputValues.tasa),
				customLabel: "Tipo de Tasa", // Etiqueta personalizada para la tasa
			});
		}
		if (inputValues.fechaInicial) {
			groups.detalles.push({
				key: "fechaInicial",
				value: inputValues.fechaInicial,
				customLabel: "Fecha Inicial",
			});
		}
		if (inputValues.fechaFinal) {
			groups.detalles.push({
				key: "fechaFinal",
				value: inputValues.fechaFinal,
				customLabel: "Fecha Final",
			});
		}

		// Movemos el capital a la sección detalles
		if (inputValues.capital) {
			groups.detalles.push({
				key: "capitalBase",
				value: inputValues.capital,
				customLabel: "Capital",
			});
		}

		// NUEVO: Procesar resultados de tasas recibidos del endpoint actualizado
		if (inputValues.tasasResult && inputValues.tasasResult.resultado !== undefined) {
			// Agregar información del coeficiente calculado
			groups.calculos.push({
				key: "coeficiente",
				value: inputValues.tasasResult.resultado,
				customLabel: "Coeficiente de Tasa",
				formatType: "percentage", // Nuevo: indicar que se muestre como porcentaje
			});

			// Agregar información sobre el tipo de cálculo
			if (inputValues.tasasResult.detalleCalculo) {
				groups.calculos.push({
					key: "tipoCalculo",
					value: formatTipoIndice(inputValues.tasasResult.detalleCalculo.tipoIndice) || "No especificado",
					customLabel: "Tipo de Índice",
				});

				groups.calculos.push({
					key: "formula",
					value: inputValues.tasasResult.detalleCalculo.formula || "No especificada",
					customLabel: "Fórmula Aplicada",
				});

				// Agregar detalles específicos según el tipo de índice
				if (inputValues.tasasResult.detalleCalculo.tipoIndice === "indexado") {
					if (inputValues.tasasResult.detalleCalculo.valorInicial) {
						groups.calculos.push({
							key: "valorInicial",
							value: parseFloat(inputValues.tasasResult.detalleCalculo.valorInicial.toFixed(6)),
							customLabel: "Valor Inicial",
							formatType: "plainNumber", // Especificar que es número plano sin formato monetario
						});
					}
					if (inputValues.tasasResult.detalleCalculo.valorFinal) {
						groups.calculos.push({
							key: "valorFinal",
							value: parseFloat(inputValues.tasasResult.detalleCalculo.valorFinal.toFixed(6)),
							customLabel: "Valor Final",
							formatType: "plainNumber", // Especificar que es número plano sin formato monetario
						});
					}
				} else if (inputValues.tasasResult.detalleCalculo.tipoIndice === "interesDiario") {
					if (inputValues.tasasResult.detalleCalculo.cantidadRegistros) {
						groups.calculos.push({
							key: "cantidadRegistros",
							value: inputValues.tasasResult.detalleCalculo.cantidadRegistros,
							customLabel: "Cantidad de Registros",
							formatType: "plainNumber",
						});
					}
				}
			}

			// Calcular los intereses multiplicando el capital por el coeficiente
			const capitalBase = typeof inputValues.capital === "number" ? inputValues.capital : parseFloat(inputValues.capital || "0");

			const coeficiente = inputValues.tasasResult.resultado || 0;
			const interesesCalculados = capitalBase * coeficiente;

			// Agregar el capital base a la sección de resultados
			groups.intereses.push({
				key: "capitalBaseResult",
				value: capitalBase,
				customLabel: "Capital",
			});

			// Agregar los intereses calculados
			groups.intereses.push({
				key: "interesCalculado",
				value: interesesCalculados,
				customLabel: "Intereses",
			});

			// Agregar el capital actualizado (capital + intereses)
			groups.intereses.push({
				key: "capitalActualizado",
				value: capitalBase + interesesCalculados,
				customLabel: "Capital Actualizado",
			});
		}
		// Mantener la compatibilidad con la forma anterior (por si existe)
		else if (inputValues.tasasResult && Array.isArray(inputValues.tasasResult)) {
			// Obtener el capital base
			const capitalBase = typeof inputValues.capital === "number" ? inputValues.capital : parseFloat(inputValues.capital || "0");

			// Agregar el capital base a la sección de resultados
			groups.intereses.push({
				key: "capitalBaseResult",
				value: capitalBase,
				customLabel: "Capital",
			});

			// Cálculos de intereses
			const interesesTotales = inputValues.tasasResult.reduce((sum: number, item: any) => {
				return sum + (typeof item.interes === "number" ? item.interes : 0);
			}, 0);

			groups.intereses.push({
				key: "interesTotal",
				value: interesesTotales,
				customLabel: "Intereses", // Etiqueta personalizada para los intereses
			});

			// Agregar información de cálculos por período
			inputValues.tasasResult.forEach((item: any, index: number) => {
				if (item.desde && item.hasta) {
					groups.calculos.push({
						key: `periodo_${index}`,
						value: `${moment(item.desde).format("DD/MM/YYYY")} - ${moment(item.hasta).format("DD/MM/YYYY")}`,
						customLabel: `Período ${index + 1}`, // Numeramos los períodos
					});

					if (item.tasa) {
						// Si tenemos el valor de la tasa, intentamos obtener su nombre legible
						let tasaLabel = "";
						if (item.nombre) {
							tasaLabel = item.nombre;
						} else if (item.tipo) {
							tasaLabel = `${getTasaLabel(item.tipo)} (${item.tasa}%)`;
						} else {
							tasaLabel = `${item.tasa}%`;
						}

						groups.calculos.push({
							key: `tasa_${index}`,
							value: tasaLabel,
							customLabel: `Tasa Aplicada`,
						});
					}

					if (typeof item.interes === "number") {
						groups.calculos.push({
							key: `interes_${index}`,
							value: item.interes,
							customLabel: `Interés Generado`,
						});
					}
				}
			});

			// Verificar si ya se agregó el capital actualizado
			if (!groups.intereses.some((item) => item.key === "capitalActualizado")) {
				groups.intereses.push({
					key: "capitalActualizado",
					value: capitalBase + interesesTotales,
					customLabel: "Capital Actualizado", // Etiqueta personalizada para el capital actualizado
				});
			}
		}

		return groups;
	};

	const groupedResults = React.useMemo(() => groupResults(values), [values]);

	const total = React.useMemo(() => {
		// Obtener el capital actualizado (última entrada en el grupo de intereses)
		if (groupedResults.intereses.length > 0) {
			const capitalActualizado = groupedResults.intereses[groupedResults.intereses.length - 1];
			return typeof capitalActualizado.value === "number" ? capitalActualizado.value : 0;
		}
		return 0;
	}, [groupedResults]);

	const generatePlainText = () => {
		let text = "LIQUIDACIÓN DE INTERESES\n\n";
		Object.entries(groupedResults).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				text += `${getGroupTitle(group).toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${getLabelForKey(item.key, item.customLabel)}: ${formatValue(item.key, item.value, item.formatType)}\n`;
				});
				text += "\n";
			}
		});
		text += `TOTAL: ${formatValue("total", total)}`;
		return text;
	};

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(generatePlainText());
			enqueueSnackbar("Liquidación copiada correctamente", {
				variant: "success",
				anchorOrigin: {
					vertical: "bottom",
					horizontal: "right",
				},
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		} catch (err) {
			enqueueSnackbar("Ha ocurrido un error al copiar. Intente más tarde.", {
				variant: "error",
				anchorOrigin: {
					vertical: "bottom",
					horizontal: "right",
				},
				TransitionComponent: Zoom,
				autoHideDuration: 5000,
			});
		}
	};

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
	});

	const handleEmailSend = async () => {
		try {
			// Simplificado para ejemplo - idealmente usaría la función generateHtmlContent
			const textBody = generatePlainText();
			const subject = "Liquidación de Intereses";
			console.log(process.env.REACT_APP_BASE_URL);
			await axios.post(`${process.env.REACT_APP_BASE_URL || "http://localhost:5000"}/api/email/send-email`, {
				to: email,
				subject,
				textBody,
			});

			enqueueSnackbar("Liquidación enviada correctamente", {
				variant: "success",
				anchorOrigin: {
					vertical: "bottom",
					horizontal: "right",
				},
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});

			setEmailModalOpen(false);
			setEmail("");
		} catch (error: any) {
			enqueueSnackbar("Ha ocurrido un error. Intente más tarde.", {
				variant: "error",
				anchorOrigin: {
					vertical: "bottom",
					horizontal: "right",
				},
				TransitionComponent: Zoom,
				autoHideDuration: 5000,
			});
		}
	};

	const handleSaveCalculation = async () => {
		if (isSaved) return;

		try {
			// Verificar si tenemos userId
			const userId = currentUser?.id || userFromRedux?._id;
			const userName = currentUser?.name || userFromRedux?.name || userFromRedux?.email || "Usuario";

			// Verificar si tenemos userId
			if (!userId) {
				enqueueSnackbar("Debe iniciar sesión para guardar el cálculo", {
					variant: "error",
					anchorOrigin: {
						vertical: "bottom",
						horizontal: "right",
					},
					TransitionComponent: Zoom,
					autoHideDuration: 5000,
				});
				return;
			}

			// Obtener los intereses calculados
			let interesValor = 0;
			if (groupedResults.intereses && groupedResults.intereses.length > 1) {
				// Buscar el item con customLabel "Intereses"
				const interesItem = groupedResults.intereses.find((item) => item.customLabel === "Intereses");
				if (interesItem && typeof interesItem.value === "number") {
					interesValor = interesItem.value;
				}
			}

			// Crear el objeto para enviar al servidor según el modelo
			// Usamos Omit<CalculatorType, "_id" | "isLoader" | "error"> para asegurar compatibilidad con el tipo esperado
			const calculatorData: Omit<CalculatorType, "_id" | "isLoader" | "error"> = {
				userId,
				date: moment().format("YYYY-MM-DD"),
				type: "Calculado" as const, // Usar 'as const' para que sea literalmente "Calculado"
				classType: "intereses" as const, // Usar 'as const' para que sea literalmente "intereses"
				subClassType: values.tasa,
				amount: total,
				interest: interesValor,
				user: userName,
				// Añadir las propiedades opcionales
				...(folderId ? { folderId } : {}),
				...(folderName ? { folderName } : {}),
				...(groupId ? { groupId } : {}),
				variables: {
					// Guardamos todas las variables necesarias para recrear el cálculo
					...values,
					// Aseguramos que el resultado esté incluido para poder renderizarlo sin recalcular
					calculationResult: {
						detalles: groupedResults.detalles,
						calculos: groupedResults.calculos,
						intereses: groupedResults.intereses,
					},
				},
			};

			// Utilizar la acción asíncrona addCalculator que ya tienes en tu store
			// Esta acción ya maneja la llamada a la API y la actualización del store
			const result = await dispatch(addCalculator(calculatorData));

			if (result.success) {
				enqueueSnackbar("Cálculo guardado correctamente", {
					variant: "success",
					anchorOrigin: {
						vertical: "bottom",
						horizontal: "right",
					},
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
				setIsSaved(true);

				// Si hay una función de callback después de guardar, la llamamos
				if (typeof onSave === "function") {
					onSave(result.calculator);
				}
			} else {
				throw new Error(result.error || "Error al guardar el cálculo");
			}
		} catch (error) {
			console.error("Error al guardar el cálculo:", error);
			enqueueSnackbar(error instanceof Error ? error.message : "Error al guardar el cálculo", {
				variant: "error",
				anchorOrigin: {
					vertical: "bottom",
					horizontal: "right",
				},
				TransitionComponent: Zoom,
				autoHideDuration: 5000,
			});
		}
	};
	const renderActionButtons = () => (
		<Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent="center" className="no-print">
			<Tooltip title="Copiar al portapapeles">
				<IconButton onClick={handleCopyToClipboard} color="primary">
					<Copy size={24} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Enviar por email">
				<IconButton onClick={() => setEmailModalOpen(true)} color="primary">
					<Sms size={24} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Imprimir">
				<IconButton onClick={handlePrint} color="primary">
					<Printer size={24} />
				</IconButton>
			</Tooltip>
			<Tooltip title={isSaved ? "El cálculo ya fue guardado" : "Guardar cálculo"}>
				<span>
					<IconButton onClick={handleSaveCalculation} color="primary" disabled={isSaved}>
						<Save2 size={24} />
					</IconButton>
				</span>
			</Tooltip>
		</Stack>
	);

	const renderGroup = (title: string, items: ResultItem[]): React.ReactNode => {
		if (!items.length) return null;

		return (
			<MainCard title={title} shadow={3} sx={{ mb: 2 }}>
				<CardContent>
					{items.map(({ key, value, customLabel, formatType }) => (
						<Stack key={key} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
							<Typography variant="body1" color="text.secondary">
								{getLabelForKey(key, customLabel)}:
							</Typography>
							<Typography variant="body1" fontWeight="medium">
								{formatValue(key, value, formatType)}
							</Typography>
						</Stack>
					))}
				</CardContent>
			</MainCard>
		);
	};

	// Función para mostrar los títulos de las secciones en español
	const getGroupTitle = (groupKey: string): string => {
		const titles: Record<string, string> = {
			detalles: "Detalles del Cálculo",
			capital: "Capital",
			calculos: "Metodología de Cálculo",
			intereses: "Resultados",
		};
		return titles[groupKey] || groupKey;
	};

	const PrintableContent = React.forwardRef<HTMLDivElement>((_, ref) => (
		<div ref={ref}>
			<Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: "center" }}>
				Liquidación de Intereses
			</Typography>

			{renderGroup(getGroupTitle("detalles"), groupedResults.detalles)}
			{/* Solo renderizamos el grupo capital si tiene elementos */}
			{groupedResults.capital.length > 0 && renderGroup(getGroupTitle("capital"), groupedResults.capital)}
			{renderGroup(getGroupTitle("calculos"), groupedResults.calculos)}
			{renderGroup(getGroupTitle("intereses"), groupedResults.intereses)}

			<MainCard
				shadow={3}
				className="total-card"
				sx={{
					mt: 3,
					bgcolor: "primary.main",
					color: "primary.contrastText",
				}}
				content={false}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
					<Typography variant="h5" color="inherit">
						CAPITAL ACTUALIZADO
					</Typography>
					<Typography variant="h5" color="inherit">
						{formatValue("total", total)}
					</Typography>
				</Stack>
			</MainCard>
		</div>
	));

	// Renderizar tabla de tasas
	const renderTasasTable = () => {
		if (!values.tasasResult || !values.tasasResult.datos) {
			return <Typography>No hay datos disponibles</Typography>;
		}

		const campo = values.tasa; // El campo de tasa usado en el cálculo
		const tipoIndice = values.tasasResult.detalleCalculo?.tipoIndice;
		const tipoIndiceFormateado = formatTipoIndice(tipoIndice);

		// Verificar si estamos en modo "indexado"
		const isIndexado = tipoIndice === "indexado";

		// Título descriptivo para la tabla
		const tableTitle = (
			<Typography variant="subtitle1" gutterBottom>
				Datos utilizados para el cálculo - Tipo: {tipoIndiceFormateado}
			</Typography>
		);

		if (isIndexado) {
			// Para tipoIndice "indexado", mostramos solo los datos de inicio y fin
			const inicio = values.tasasResult.datos.inicio;
			const fin = values.tasasResult.datos.fin;

			if (!inicio || !fin) {
				return (
					<>
						{tableTitle}
						<Typography>No hay datos disponibles para este índice</Typography>
					</>
				);
			}

			return (
				<>
					{tableTitle}
					<TableContainer component={Paper} sx={{ mt: 2 }}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Periodo</TableCell>
									<TableCell>Fecha</TableCell>
									<TableCell>Valor {campo}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									<TableCell>Inicial</TableCell>
									<TableCell>{inicio.fecha ? moment(inicio.fecha).format("DD-MM-YYYY") : "N/A"}</TableCell>
									<TableCell>{inicio[campo] !== undefined ? inicio[campo].toFixed(4) : "N/A"}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Final</TableCell>
									<TableCell>{fin.fecha ? moment(fin.fecha).format("DD-MM-YYYY") : "N/A"}</TableCell>
									<TableCell>{fin[campo] !== undefined ? fin[campo].toFixed(4) : "N/A"}</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</>
			);
		} else {
			// Para otros tipos de índices, mantener el comportamiento original
			// Asumimos que datos es un array en este caso
			if (!Array.isArray(values.tasasResult.datos)) {
				return (
					<>
						{tableTitle}
						<Typography>No hay datos disponibles en formato esperado</Typography>
					</>
				);
			}

			return (
				<>
					{tableTitle}
					<TableContainer component={Paper} sx={{ mt: 2 }}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Fecha</TableCell>
									<TableCell>Valor</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{values.tasasResult.datos.map((item: any, index: number) => (
									<TableRow key={index}>
										<TableCell>{item.fecha ? moment(item.fecha).format("DD-MM-YYYY") : "N/A"}</TableCell>
										<TableCell>{item[campo] !== undefined ? item[campo].toFixed(4) : "N/A"}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</>
			);
		}
	};

	return (
		<PrintContainer>
			{renderActionButtons()}

			<PrintableContent ref={printRef} />

			<Stack direction="row" justifyContent="flex-end" spacing={2} className="no-print" sx={{ mt: 3 }}>
				<Button variant="contained" color="info" onClick={() => setShowTasasModal(true)}>
					Ver Tasas
				</Button>
				<Button variant="contained" color="error" onClick={onReset}>
					Nueva Liquidación
				</Button>
			</Stack>

			{/* Modal para enviar email */}
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

			{/* Modal para ver tabla de tasas */}
			<Dialog open={showTasasModal} onClose={() => setShowTasasModal(false)} maxWidth="md" fullWidth>
				<DialogTitle>Detalle de Tasas</DialogTitle>
				<DialogContent>{renderTasasTable()}</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowTasasModal(false)}>Cerrar</Button>
				</DialogActions>
			</Dialog>
		</PrintContainer>
	);
};

export default ResultsView;
