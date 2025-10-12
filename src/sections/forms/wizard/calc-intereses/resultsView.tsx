import React, { useState, useRef, useEffect } from "react";
import {
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
	Box,
	Chip,
	Divider,
	Checkbox,
	InputAdornment,
	Autocomplete,
	useTheme,
	GlobalStyles,
} from "@mui/material";
import logo from "assets/images/large_logo_transparent.png";
import { Copy, Sms, Printer, Save2, SearchNormal1, UserAdd, Information, Calculator, StatusUp } from "iconsax-react";
import styled from "@emotion/styled";
import { useReactToPrint } from "react-to-print";
import { enqueueSnackbar } from "notistack";
import { dispatch, useSelector, RootState } from "store";
import { addCalculator } from "store/reducers/calculator";
import { CalculatorType } from "types/calculator";
import { openSnackbar } from "store/reducers/snackbar";
import { getContactsByUserId } from "store/reducers/contacts";

//third party
import dayjs from "utils/dayjs-config";
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

// Iconos para cada sección
const SectionIcons: Record<string, React.ElementType> = {
	detalles: Information,
	calculos: Calculator,
	intereses: StatusUp,
};

const ResultsView: React.FC<ResultsViewProps> = ({ values, formField, onReset, onSave, currentUser, folderId, folderName, groupId }) => {
	const theme = useTheme();
	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [emailList, setEmailList] = useState<string[]>([]);
	const [copyToMe, setCopyToMe] = useState(false);
	const [customMessage, setCustomMessage] = useState("");
	const [isSaved, setIsSaved] = useState(false);
	const [showTasasModal, setShowTasasModal] = useState(false);
	const [contactsLoaded, setContactsLoaded] = useState(false);

	const printRef = useRef<HTMLDivElement>(null);

	const userFromRedux = useSelector((state: RootState) => state.auth.user);
	const { contacts, isLoader: contactsLoading } = useSelector((state: RootState) => state.contacts);

	// Cargar contactos cuando se abre el modal de email
	useEffect(() => {
		if (emailModalOpen && !contactsLoaded && userFromRedux?._id) {
			dispatch(getContactsByUserId(userFromRedux._id));
			setContactsLoaded(true);
		}
	}, [emailModalOpen, contactsLoaded, userFromRedux?._id]);

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

		// Para campos de texto que no deben ser formateados
		if (key === "reclamante" || key === "reclamado" || key === "folderName") {
			return String(value);
		}

		// Formatos por defecto según la clave
		if (key === "fechaInicial" || key === "fechaFinal") {
			const date = dayjs(value);
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

		// Agregar información de carpeta o reclamante/reclamado al inicio de los resultados
		if (inputValues.folderName) {
			groups.intereses.unshift({
				key: "folderName",
				value: inputValues.folderName,
				customLabel: "Nombre de carpeta",
			});
		} else {
			// Solo mostrar reclamante y reclamado si no hay carpeta
			if (inputValues.reclamante) {
				groups.intereses.unshift({
					key: "reclamante",
					value: inputValues.reclamante,
					customLabel: "Nombre del reclamante",
				});
			}
			if (inputValues.reclamado) {
				groups.intereses.unshift({
					key: "reclamado",
					value: inputValues.reclamado,
					customLabel: "Nombre del reclamado",
				});
			}
		}

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
						value: `${dayjs(item.desde).format("DD/MM/YYYY")} - ${dayjs(item.hasta).format("DD/MM/YYYY")}`,
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

	const handleAddEmail = () => {
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

	const generateHtmlContent = () => {
		let html = "<h2>LIQUIDACIÓN DE INTERESES</h2>";
		Object.entries(groupedResults).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				html += `<h3>${getGroupTitle(group).toUpperCase()}</h3>`;
				html += "<table style='width: 100%; border-collapse: collapse;'>";
				items.forEach((item: ResultItem) => {
					html += `<tr>
						<td style='padding: 8px; border-bottom: 1px solid #ddd;'>${getLabelForKey(item.key, item.customLabel)}:</td>
						<td style='padding: 8px; border-bottom: 1px solid #ddd; text-align: right;'>${formatValue(item.key, item.value, item.formatType)}</td>
					</tr>`;
				});
				html += "</table><br/>";
			}
		});
		html += `<h3>TOTAL: ${formatValue("total", total)}</h3>`;

		if (customMessage) {
			html = `<p>${customMessage.replace(/\n/g, "<br>")}</p><br><hr><br>` + html;
		}

		return html;
	};

	const handleEmailSend = async () => {
		try {
			const textBody = generatePlainText();
			const htmlBody = generateHtmlContent();
			const subject = "Liquidación de Intereses";
			const allEmails = [...emailList];

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

			await axios.post(`${process.env.REACT_APP_BASE_URL || "http://localhost:5000"}/api/email/send-email`, {
				to: allEmails,
				subject,
				textBody,
				htmlBody,
				copyToMe: copyToMe,
			});

			dispatch(
				openSnackbar({
					open: true,
					message: `Cálculo enviado correctamente.`,
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
				date: dayjs().format("YYYY-MM-DD"),
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
				<IconButton
					onClick={handleCopyToClipboard}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Copy size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Enviar por email">
				<IconButton
					onClick={() => setEmailModalOpen(true)}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Sms size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Imprimir">
				<IconButton
					onClick={handlePrint}
					size="small"
					sx={{
						border: "1px solid",
						borderColor: "divider",
						bgcolor: "background.paper",
						"&:hover": {
							bgcolor: "action.hover",
							borderColor: "primary.main",
						},
					}}
				>
					<Printer size={18} />
				</IconButton>
			</Tooltip>
			<Tooltip title={isSaved ? "El cálculo ya fue guardado" : "Guardar cálculo"}>
				<span>
					<IconButton
						onClick={handleSaveCalculation}
						disabled={isSaved}
						size="small"
						sx={{
							border: "1px solid",
							borderColor: "divider",
							bgcolor: "background.paper",
							"&:hover": {
								bgcolor: "action.hover",
								borderColor: "primary.main",
							},
							"&:disabled": {
								bgcolor: "action.disabledBackground",
								borderColor: "divider",
							},
						}}
					>
						<Save2 size={18} />
					</IconButton>
				</span>
			</Tooltip>
		</Stack>
	);

	const renderSection = (title: string, items: ResultItem[], sectionKey: string): React.ReactNode => {
		if (!items || !items.length) return null;

		const Icon = SectionIcons[sectionKey] || Information;

		return (
			<Paper
				elevation={0}
				sx={{
					mb: 1.5,
					overflow: "hidden",
					borderRadius: 2,
					border: `1px solid ${theme.palette.divider}`,
					bgcolor: "background.paper",
					boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						px: 2,
						py: 1.5,
						borderBottom: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
					}}
				>
					<Icon
						size={18}
						style={{
							marginRight: theme.spacing(1),
							color: theme.palette.primary.main,
						}}
					/>
					<Typography variant="body1" fontWeight={600}>
						{title}
					</Typography>
				</Box>
				<Box sx={{ px: 2, py: 1.5 }}>
					{items.map(({ key, value, customLabel, formatType }, itemIndex) => (
						<Box
							key={key}
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								py: 0.75,
								"&:not(:last-child)": {
									borderBottom: `1px solid ${theme.palette.divider}`,
								},
							}}
						>
							<Typography variant="body2" color="text.secondary">
								{getLabelForKey(key, customLabel)}:
							</Typography>
							<Typography variant="body2" fontWeight={500} sx={{ ml: 2 }}>
								{formatValue(key, value, formatType)}
							</Typography>
						</Box>
					))}
				</Box>
			</Paper>
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
		<Box sx={{ p: 2, maxWidth: 800, mx: "auto" }}>
			<Box
				ref={ref}
				sx={{
					bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#f8f8f8",
					borderRadius: 2,
					p: 2,
					border: `1px solid ${theme.palette.divider}`,
					boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
					"&:hover": {
						bgcolor: theme.palette.mode === "dark" ? "grey.900" : "#f8f8f8",
					},
					"@media print": {
						bgcolor: "white !important",
						border: "none !important",
						boxShadow: "none !important",
						p: 0,
					},
				}}
			>
				<Stack spacing={1}>
					{/* Logo para impresión */}
					<Box className="print-logo" sx={{ textAlign: "center", mb: 3 }}>
						<img src={logo} alt="Law Analytics" style={{ maxWidth: "150px", height: "auto" }} />
					</Box>

					{/* Título */}
					<Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: "center" }}>
						Liquidación de Intereses
					</Typography>

					{/* Renderizar las secciones disponibles */}
					{Object.entries(groupedResults).map(([key, items]) => renderSection(getGroupTitle(key), items as ResultItem[], key))}

					{/* Card del total con diseño minimalista */}
					<Paper
						elevation={0}
						sx={{
							mt: 1.5,
							overflow: "hidden",
							borderRadius: 2,
							border: `1px solid ${theme.palette.divider}`,
							bgcolor: "background.paper",
							boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								px: 2,
								py: 1.5,
								borderBottom: `1px solid ${theme.palette.divider}`,
								bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
							}}
						>
							<Typography variant="body1" fontWeight={600}>
								Capital Actualizado
							</Typography>
						</Box>
						<Box sx={{ px: 2, py: 1.5 }}>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									py: 0.75,
								}}
							>
								<Typography variant="body2" color="text.secondary">
									Capital actualizado:
								</Typography>
								<Typography variant="body2" fontWeight={700} sx={{ ml: 2, color: "primary.main" }}>
									{formatValue("total", total)}
								</Typography>
							</Box>
						</Box>
					</Paper>
				</Stack>
			</Box>
		</Box>
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
									<TableCell>{inicio.fecha ? dayjs(inicio.fecha).format("DD-MM-YYYY") : "N/A"}</TableCell>
									<TableCell>{inicio[campo] !== undefined ? inicio[campo].toFixed(4) : "N/A"}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Final</TableCell>
									<TableCell>{fin.fecha ? dayjs(fin.fecha).format("DD-MM-YYYY") : "N/A"}</TableCell>
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
										<TableCell>{item.fecha ? dayjs(item.fecha).format("DD-MM-YYYY") : "N/A"}</TableCell>
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
			<GlobalStyles
				styles={{
					"@media print": {
						"@page": {
							margin: "2cm",
							size: "A4",
						},
						body: {
							margin: "0",
							padding: "0",
							backgroundColor: "white",
						},
						".no-print": {
							display: "none !important",
						},
						".MuiPaper-root": {
							boxShadow: "none !important",
							border: "1px solid #ddd !important",
							pageBreakInside: "avoid",
							marginBottom: "10px !important",
						},
						".MuiBox-root": {
							pageBreakInside: "avoid",
						},
						".MuiTypography-root": {
							fontSize: "12px !important",
							pageBreakInside: "avoid",
						},
						".MuiTypography-h6": {
							fontSize: "14px !important",
							fontWeight: "bold !important",
						},
						".MuiTypography-body1": {
							fontSize: "12px !important",
						},
						".MuiTypography-body2": {
							fontSize: "11px !important",
						},
						".MuiStack-root": {
							spacing: "8px !important",
						},
						"td, th": {
							padding: "4px 8px !important",
						},
						".print-logo": {
							display: "block !important",
							width: "150px !important",
							height: "auto !important",
							marginBottom: "20px !important",
						},
					},
					".print-logo": {
						display: "none",
					},
				}}
			/>
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
								size="small"
							/>
							<Button variant="contained" onClick={handleAddEmail} color="primary" disabled={!email.trim()} size="small">
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
										<Chip key={emailItem} label={emailItem} onDelete={() => handleRemoveEmail(emailItem)} size="small" sx={{ m: 0.5 }} />
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
								size="small"
								options={contacts.filter((contact: any) => contact.email)}
								getOptionLabel={(option: any) => `${option.name} ${option.lastName} (${option.email})`}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Buscar contacto"
										variant="outlined"
										size="small"
										InputProps={{
											...params.InputProps,
											startAdornment: (
												<InputAdornment position="start">
													<SearchNormal1 size={16} />
												</InputAdornment>
											),
										}}
									/>
								)}
								renderOption={(props, option: any) => (
									<li {...props}>
										<Stack direction="row" spacing={1} alignItems="center" width="100%">
											<UserAdd size={16} />
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
								size="small"
							/>
						</Box>

						<Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
							<Checkbox size="small" checked={copyToMe} onChange={(e) => setCopyToMe(e.target.checked)} id="copy-to-me" />
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
