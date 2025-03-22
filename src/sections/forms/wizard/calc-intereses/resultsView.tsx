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
} from "@mui/material";
import MainCard from "components/MainCard";
import { Copy, Sms, Printer, Save2 } from "iconsax-react";
import styled from "@emotion/styled";
import { useReactToPrint } from "react-to-print";
import { enqueueSnackbar } from "notistack";

//third party
import moment from "moment";
import axios from "axios";

// Tipos
interface ResultItem {
	key: string;
	value: number | string;
	customLabel?: string; // Nuevo campo para etiquetas personalizadas
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

const ResultsView: React.FC<ResultsViewProps> = ({ values, formField, onReset }) => {
	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [isSaved, setIsSaved] = useState(false);

	const printRef = useRef<HTMLDivElement>(null);

	// Función mejorada para obtener etiquetas, ahora puede usar etiquetas personalizadas
	const getLabelForKey = (key: string, customLabel?: string): string => {
		if (customLabel) {
			return customLabel;
		}
		const field = formField[key as keyof typeof formField];
		return field?.label || key;
	};

	const formatValue = (key: string, value: number | string): string => {
		if (key === "fechaInicial" || key === "fechaFinal") {
			const date = moment(value);
			if (date.isValid()) {
				return date.format("DD/MM/YYYY");
			}
			return String(value);
		}

		// Para valores monetarios
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
			capital: [],
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
		if (inputValues.capital) {
			groups.capital.push({
				key: "capitalBase",
				value: inputValues.capital,
				customLabel: "Capital", // Cambiado de "capitalBase" a "Capital"
			});
		}

		// Procesar resultados de tasas
		if (inputValues.tasasResult && Array.isArray(inputValues.tasasResult)) {
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
						// Primero intentamos usar item.nombre, luego aplicar getTasaLabel, y si no, mostramos el porcentaje
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
		}

		// Agregar total final (capital + intereses)
		const capitalBase = typeof inputValues.capital === "number" ? inputValues.capital : 0;
		const interesesTotales =
			groups.intereses.length > 0 ? (typeof groups.intereses[0].value === "number" ? groups.intereses[0].value : 0) : 0;

		groups.intereses.push({
			key: "capitalActualizado",
			value: capitalBase + interesesTotales,
			customLabel: "Capital Actualizado", // Etiqueta personalizada para el capital actualizado
		});

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
				text += `${group.toUpperCase()}\n`;
				items.forEach((item: ResultItem) => {
					text += `${getLabelForKey(item.key, item.customLabel)}: ${formatValue(item.key, item.value)}\n`;
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
			// Llamamos a la función onSave proporcionada por el padre
			// Simulamos un guardado exitoso
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
		} catch (error) {
			enqueueSnackbar("Error al guardar el cálculo", {
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
					{items.map(({ key, value, customLabel }) => (
						<Stack key={key} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
							<Typography variant="body1" color="text.secondary">
								{getLabelForKey(key, customLabel)}:
							</Typography>
							<Typography variant="body1" fontWeight="medium">
								{formatValue(key, value)}
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
			calculos: "Cálculos por Período",
			intereses: "Intereses",
		};
		return titles[groupKey] || groupKey;
	};

	const PrintableContent = React.forwardRef<HTMLDivElement>((_, ref) => (
		<div ref={ref}>
			<Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: "center" }}>
				Liquidación de Intereses
			</Typography>

			{renderGroup(getGroupTitle("detalles"), groupedResults.detalles)}
			{renderGroup(getGroupTitle("capital"), groupedResults.capital)}
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

	return (
		<PrintContainer>
			{renderActionButtons()}

			<PrintableContent ref={printRef} />

			<Stack direction="row" justifyContent="flex-end" className="no-print">
				<Button variant="contained" color="error" onClick={onReset} sx={{ mt: 3 }}>
					Nueva Liquidación
				</Button>
			</Stack>

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
		</PrintContainer>
	);
};

export default ResultsView;
