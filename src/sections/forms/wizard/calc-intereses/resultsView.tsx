import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
	Typography,
	Stack,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
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
	Divider,
	CircularProgress,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { dispatch, useSelector, RootState } from "store";
import { addCalculator } from "store/reducers/calculator";
import { CalculatorType } from "types/calculator";
import { CalculationDetailsView } from "components/calculator/CalculationDetailsView";

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

// Función para formatear el nombre del tipo de índice
const formatTipoIndice = (tipoIndice: string): string => {
	const tiposIndiceMap: Record<string, string> = {
		interesDiario: "Interés diario",
		indexado: "Indexado",
		multipleSegments: "Múltiples tramos",
	};

	return tiposIndiceMap[tipoIndice] || tipoIndice;
};

// Tipo para los segmentos de intereses
interface InterestSegment {
	id: string;
	startDate: string;
	endDate: string;
	rate: string;
	rateName?: string;
	capital: number;
	interest: number;
	coefficient: number;
	isExtension?: boolean;
	// Campos para interés simple
	interestType?: "indexed" | "simple";
	simpleRate?: number;
	ratePeriod?: "daily" | "monthly" | "annual";
	capitalizationFrequency?: "none" | "monthly" | "quarterly" | "semiannual" | "annual";
}

const ResultsView: React.FC<ResultsViewProps> = ({ values, formField, onReset, onSave, currentUser, folderId, folderName, groupId }) => {
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showTasasModal, setShowTasasModal] = useState(false);

	// Estados para cargar datos de tasas en el modal
	const [tasasDataLoaded, setTasasDataLoaded] = useState(false);
	const [tasasDataLoading, setTasasDataLoading] = useState(false);
	const [segmentsTasasData, setSegmentsTasasData] = useState<Record<string, any>>({});

	const userFromRedux = useSelector((state: RootState) => state.auth.user);

	// Cargar datos de tasas cuando se abre el modal
	useEffect(() => {
		const loadTasasData = async () => {
			const segments: InterestSegment[] = values.segments || [];
			if (showTasasModal && segments.length > 0 && !tasasDataLoaded && !tasasDataLoading) {
				setTasasDataLoading(true);
				try {
					const baseURL = process.env.REACT_APP_BASE_URL || "";
					const dataBySegment: Record<string, any> = {};

					// Cargar datos solo para segmentos que NO son de interés simple
					for (const segment of segments) {
						// Si es interés simple, no necesitamos cargar datos de la API
						if (segment.interestType === "simple" || segment.rate === "simple") {
							dataBySegment[segment.id] = { isSimpleInterest: true };
							continue;
						}

						try {
							const url = `${baseURL}/api/tasas/consulta?fechaDesde=${segment.startDate}&fechaHasta=${segment.endDate}&campo=${segment.rate}&calcular=true&completo=true`;
							const response = await axios.get(url, { withCredentials: true });
							dataBySegment[segment.id] = response.data;
						} catch (segmentError) {
							console.error(`Error al cargar datos para segmento ${segment.id}:`, segmentError);
							dataBySegment[segment.id] = null;
						}
					}

					setSegmentsTasasData(dataBySegment);
					setTasasDataLoaded(true);
				} catch (error) {
					console.error("Error al cargar datos de tasas:", error);
				} finally {
					setTasasDataLoading(false);
				}
			}
		};

		loadTasasData();
	}, [showTasasModal, values.segments, tasasDataLoaded, tasasDataLoading]);

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

		// Agregar información de carpeta o reclamante/reclamado a la sección detalles
		if (inputValues.folderName) {
			groups.detalles.unshift({
				key: "folderName",
				value: inputValues.folderName,
				customLabel: "Nombre de carpeta",
			});
		} else {
			// Solo mostrar reclamante y reclamado si no hay carpeta
			if (inputValues.reclamante) {
				groups.detalles.unshift({
					key: "reclamante",
					value: inputValues.reclamante,
					customLabel: "Nombre del reclamante",
				});
			}
			if (inputValues.reclamado) {
				groups.detalles.unshift({
					key: "reclamado",
					value: inputValues.reclamado,
					customLabel: "Nombre del reclamado",
				});
			}
		}

		// Verificar si hay múltiples tramos
		const segments: InterestSegment[] = inputValues.segments || [];
		const hasMultipleSegments = segments.length > 0;

		if (hasMultipleSegments) {
			// Modo con múltiples tramos
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

			// Mostrar cantidad de tramos
			groups.detalles.push({
				key: "cantidadTramos",
				value: `${segments.length} tramo${segments.length > 1 ? "s" : ""}`,
				customLabel: "Tramos de Intereses",
			});

			// Mostrar si hay capitalización
			if (inputValues.capitalizeInterest) {
				groups.detalles.push({
					key: "capitalizeInterest",
					value: "Sí",
					customLabel: "Capitalización de Intereses",
				});
			}

			// Movemos el capital a la sección detalles
			if (inputValues.capital) {
				groups.detalles.push({
					key: "capitalBase",
					value: inputValues.capital,
					customLabel: "Capital Inicial",
				});
			}

			// Agregar detalles de cada tramo a la sección cálculos
			segments.forEach((segment: InterestSegment, index: number) => {
				groups.calculos.push({
					key: `tramoHeader_${index}`,
					value: `${segment.startDate} - ${segment.endDate}`,
					customLabel: `Tramo ${index + 1}`,
				});
				groups.calculos.push({
					key: `tramoTasa_${index}`,
					value: segment.rateName || segment.rate,
					customLabel: `  Tasa Aplicada`,
				});
				groups.calculos.push({
					key: `tramoCapital_${index}`,
					value: segment.capital,
					customLabel: `  Capital del Tramo`,
				});
				groups.calculos.push({
					key: `tramoCoef_${index}`,
					value: segment.coefficient,
					customLabel: `  Coeficiente`,
					formatType: "percentage",
				});
				groups.calculos.push({
					key: `tramoInteres_${index}`,
					value: segment.interest,
					customLabel: `  Interés Generado`,
				});
			});

			// Agregar resultados finales
			const capitalBase = typeof inputValues.capital === "number" ? inputValues.capital : parseFloat(inputValues.capital || "0");
			const interesTotal = inputValues.interesTotal || segments.reduce((sum: number, seg: InterestSegment) => sum + seg.interest, 0);
			const capitalActualizado = inputValues.capitalActualizado || capitalBase + interesTotal;

			groups.intereses.push({
				key: "capitalBaseResult",
				value: capitalBase,
				customLabel: "Capital Inicial",
			});

			groups.intereses.push({
				key: "interesCalculado",
				value: interesTotal,
				customLabel: "Total de Intereses",
			});

			groups.intereses.push({
				key: "capitalActualizado",
				value: capitalActualizado,
				customLabel: "Capital Actualizado",
			});

			return groups;
		}

		// Modo sin múltiples tramos (comportamiento original)
		if (inputValues.tasa) {
			groups.detalles.push({
				key: "tasa",
				value: getTasaLabel(inputValues.tasa),
				customLabel: "Tipo de Tasa",
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

	const groupedResults = useMemo(() => groupResults(values), [values]);

	const total = useMemo(() => {
		// Obtener el capital actualizado (última entrada en el grupo de intereses)
		if (groupedResults.intereses.length > 0) {
			const capitalActualizado = groupedResults.intereses[groupedResults.intereses.length - 1];
			return typeof capitalActualizado.value === "number" ? capitalActualizado.value : 0;
		}
		return 0;
	}, [groupedResults]);

	// Función para mostrar los títulos de las secciones en español
	const getGroupTitle = useCallback((groupKey: string): string => {
		const titles: Record<string, string> = {
			detalles: "Detalles del Cálculo",
			capital: "Capital",
			calculos: "Metodología de Cálculo",
			intereses: "Resultados",
		};
		return titles[groupKey] || groupKey;
	}, []);

	const generatePlainText = useCallback(() => {
		const segments: InterestSegment[] = values.segments || [];
		const hasMultipleSegments = segments.length > 0;
		const capitalBase = typeof values.capital === "number" ? values.capital : parseFloat(values.capital || "0");

		let text = "LIQUIDACIÓN DE INTERESES\n";
		text += "═".repeat(50) + "\n\n";

		// Sección Detalles
		text += "DETALLES DEL CÁLCULO\n";
		text += "-".repeat(30) + "\n";
		if (groupedResults.detalles.length) {
			groupedResults.detalles.forEach((item: ResultItem) => {
				text += `${getLabelForKey(item.key, item.customLabel)}: ${formatValue(item.key, item.value, item.formatType)}\n`;
			});
		}
		text += "\n";

		// Sección Metodología de Cálculo
		text += "METODOLOGÍA DE CÁLCULO\n";
		text += "-".repeat(30) + "\n";
		if (hasMultipleSegments) {
			segments.forEach((segment, index) => {
				text += `\nTramo ${index + 1}: ${segment.startDate} - ${segment.endDate}\n`;
				text += `  Tasa: ${segment.rateName || getTasaLabel(segment.rate)}\n`;
				text += `  Capital del tramo: ${formatValue("capital", segment.capital)}\n`;
				text += `  Coeficiente: ${((segment.coefficient || 0) * 100).toFixed(4)}%\n`;
				text += `  Interés generado: ${formatValue("interest", segment.interest)}\n`;
			});
			if (values.capitalizeInterest) {
				text += "\n  ℹ Capitalización de intereses activada\n";
			}
		} else if (groupedResults.calculos.length) {
			groupedResults.calculos.forEach((item: ResultItem) => {
				text += `${getLabelForKey(item.key, item.customLabel)}: ${formatValue(item.key, item.value, item.formatType)}\n`;
			});
		}
		text += "\n";

		// Sección Intereses
		text += "INTERESES\n";
		text += "-".repeat(30) + "\n";
		text += `Capital Inicial: ${formatValue("capital", capitalBase)}\n`;

		if (hasMultipleSegments) {
			const totalIntereses = segments.reduce((sum, seg) => sum + (seg.interest || 0), 0);
			text += `Total de Intereses: ${formatValue("interest", totalIntereses)}\n\n`;
			segments.forEach((segment, index) => {
				text += `Tramo ${index + 1} (${segment.startDate} - ${segment.endDate}):\n`;
				text += `  ${segment.rateName || getTasaLabel(segment.rate)}: ${formatValue("interest", segment.interest)}\n`;
			});
			text += `\nSubtotal: ${formatValue("interest", totalIntereses)}\n`;
		} else {
			groupedResults.intereses.forEach((item: ResultItem) => {
				if (item.key !== "capital") {
					text += `${getLabelForKey(item.key, item.customLabel)}: ${formatValue(item.key, item.value, item.formatType)}\n`;
				}
			});
		}
		text += "\n";

		// Capital Actualizado
		text += "CAPITAL ACTUALIZADO\n";
		text += "-".repeat(30) + "\n";
		text += `Capital actualizado: ${formatValue("total", total)}\n`;

		return text;
	}, [values, groupedResults, total, getGroupTitle, getLabelForKey, formatValue, getTasaLabel]);

	const generateHtmlContent = useCallback(() => {
		const segments: InterestSegment[] = values.segments || [];
		const hasMultipleSegments = segments.length > 0;
		const capitalBase = typeof values.capital === "number" ? values.capital : parseFloat(values.capital || "0");

		// Helper para crear filas de tabla con label a la izquierda y valor a la derecha
		const createRow = (label: string, value: string, isSubtotal = false, valueColor = "#333") => {
			const bgColor = isSubtotal ? "#f5f5f5" : "transparent";
			const fontWeight = isSubtotal ? "600" : "500";
			return `<tr style="background: ${bgColor};">
				<td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; color: #666; text-align: left;">${label}</td>
				<td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; font-weight: ${fontWeight}; color: ${valueColor}; text-align: right;">${value}</td>
			</tr>`;
		};

		let html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">`;
		html += `<h2 style="text-align: center; color: #1976d2; margin-bottom: 24px;">Liquidación de Intereses</h2>`;

		// Sección Detalles
		if (groupedResults.detalles.length) {
			html += `<div style="margin-bottom: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">`;
			html += `<div style="background: #f5f5f5; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333;">Detalles del Cálculo</div>`;
			html += `<table style="width: 100%; border-collapse: collapse;">`;
			groupedResults.detalles.forEach((item: ResultItem) => {
				html += createRow(`${getLabelForKey(item.key, item.customLabel)}:`, formatValue(item.key, item.value, item.formatType));
			});
			html += `</table></div>`;
		}

		// Sección Metodología de Cálculo
		html += `<div style="margin-bottom: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">`;
		html += `<div style="background: #f5f5f5; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333;">Metodología de Cálculo</div>`;
		html += `<div style="padding: 12px 16px;">`;
		if (hasMultipleSegments) {
			segments.forEach((segment, index) => {
				html += `<div style="background: #fafafa; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #1976d2; overflow: hidden;">`;
				html += `<div style="font-weight: 600; color: #1976d2; padding: 12px 12px 8px;">Tramo ${index + 1}: ${segment.startDate} - ${
					segment.endDate
				}</div>`;
				html += `<table style="width: 100%; border-collapse: collapse;">`;
				html += `<tr><td style="padding: 6px 12px; color: #666; text-align: left;">Tasa:</td><td style="padding: 6px 12px; font-weight: 500; text-align: right;">${
					segment.rateName || getTasaLabel(segment.rate)
				}</td></tr>`;
				html += `<tr><td style="padding: 6px 12px; color: #666; text-align: left;">Capital del tramo:</td><td style="padding: 6px 12px; font-weight: 500; text-align: right;">${formatValue(
					"capital",
					segment.capital,
				)}</td></tr>`;
				html += `<tr><td style="padding: 6px 12px; color: #666; text-align: left;">Coeficiente:</td><td style="padding: 6px 12px; font-weight: 500; text-align: right;">${(
					(segment.coefficient || 0) * 100
				).toFixed(4)}%</td></tr>`;
				html += `<tr><td style="padding: 6px 12px 12px; color: #666; text-align: left;">Interés generado:</td><td style="padding: 6px 12px 12px; font-weight: 500; color: #2e7d32; text-align: right;">${formatValue(
					"interest",
					segment.interest,
				)}</td></tr>`;
				html += `</table></div>`;
			});
			if (values.capitalizeInterest) {
				html += `<div style="background: #e3f2fd; padding: 8px 12px; border-radius: 4px; color: #1565c0; font-size: 13px;">ℹ Capitalización de intereses activada</div>`;
			}
		} else if (groupedResults.calculos.length) {
			html += `<table style="width: 100%; border-collapse: collapse;">`;
			groupedResults.calculos.forEach((item: ResultItem) => {
				html += createRow(`${getLabelForKey(item.key, item.customLabel)}:`, formatValue(item.key, item.value, item.formatType));
			});
			html += `</table>`;
		}
		html += `</div></div>`;

		// Sección Intereses
		html += `<div style="margin-bottom: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">`;
		html += `<div style="background: #f5f5f5; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333;">Intereses</div>`;
		html += `<table style="width: 100%; border-collapse: collapse;">`;
		html += createRow("Capital Inicial:", formatValue("capital", capitalBase));

		if (hasMultipleSegments) {
			const totalIntereses = segments.reduce((sum, seg) => sum + (seg.interest || 0), 0);
			html += createRow("Total de Intereses:", formatValue("interest", totalIntereses));
			segments.forEach((segment, index) => {
				html += `<tr>
					<td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; color: #666; text-align: left;">
						Tramo ${index + 1} (${segment.startDate} - ${segment.endDate}):<br/>
						<span style="font-size: 12px; color: #888;">${segment.rateName || getTasaLabel(segment.rate)}</span>
					</td>
					<td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; font-weight: 500; text-align: right; vertical-align: top;">${formatValue(
						"interest",
						segment.interest,
					)}</td>
				</tr>`;
			});
			html += createRow("Subtotal:", formatValue("interest", totalIntereses), true, "#1976d2");
		} else {
			groupedResults.intereses.forEach((item: ResultItem) => {
				if (item.key !== "capital") {
					html += createRow(`${getLabelForKey(item.key, item.customLabel)}:`, formatValue(item.key, item.value, item.formatType));
				}
			});
		}
		html += `</table></div>`;

		// Capital Actualizado
		html += `<div style="margin-bottom: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">`;
		html += `<div style="background: #f5f5f5; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333;">Capital Actualizado</div>`;
		html += `<table style="width: 100%; border-collapse: collapse;">`;
		html += `<tr>
			<td style="padding: 12px 16px; color: #666; text-align: left;">Capital actualizado:</td>
			<td style="padding: 12px 16px; font-weight: 700; color: #1976d2; font-size: 16px; text-align: right;">${formatValue("total", total)}</td>
		</tr>`;
		html += `</table></div>`;

		html += `</div>`;
		return html;
	}, [values, groupedResults, total, getLabelForKey, formatValue, getTasaLabel]);

	const handleSaveCalculation = async () => {
		if (isSaved || isSaving) return;

		setIsSaving(true);
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
				// Buscar el item con customLabel "Intereses" o "Total de Intereses" (para múltiples tramos)
				const interesItem = groupedResults.intereses.find(
					(item) => item.customLabel === "Intereses" || item.customLabel === "Total de Intereses",
				);
				if (interesItem && typeof interesItem.value === "number") {
					interesValor = interesItem.value;
				}
			}

			// Verificar si hay múltiples tramos
			const segments: InterestSegment[] = values.segments || [];
			const hasMultipleSegments = segments.length > 0;

			// Obtener capital base
			const capitalBase = typeof values.capital === "number" ? values.capital : parseFloat(values.capital || "0");

			// Crear el objeto para enviar al servidor según el modelo
			// Usamos Omit<CalculatorType, "_id" | "isLoader" | "error"> para asegurar compatibilidad con el tipo esperado
			const calculatorData: Omit<CalculatorType, "_id" | "isLoader" | "error"> = {
				userId,
				date: dayjs().format("YYYY-MM-DD"),
				type: "Calculado" as const,
				classType: "intereses" as const,
				subClassType: hasMultipleSegments ? segments.map((s) => s.rate).join(",") : values.tasa,
				amount: total,
				capital: capitalBase,
				interest: interesValor,
				user: userName,
				// Añadir las propiedades opcionales
				...(folderId ? { folderId } : {}),
				...(folderName ? { folderName } : {}),
				...(groupId ? { groupId } : {}),
				variables: {
					// Guardamos todas las variables necesarias para recrear el cálculo
					...values,
					// Incluir tramos si existen
					...(hasMultipleSegments
						? {
								segments: segments.map((seg) => ({
									startDate: seg.startDate,
									endDate: seg.endDate,
									rate: seg.rate,
									rateName: seg.rateName,
									capital: seg.capital,
									interest: seg.interest,
									coefficient: seg.coefficient,
									isExtension: seg.isExtension || false,
									// Campos para interés simple
									interestType: seg.interestType,
									simpleRate: seg.simpleRate,
									ratePeriod: seg.ratePeriod,
									capitalizationFrequency: seg.capitalizationFrequency,
								})),
								capitalizeInterest: values.capitalizeInterest || false,
						  }
						: {}),
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
		} finally {
			setIsSaving(false);
		}
	};

	// Crear el objeto de datos para CalculationDetailsView
	const calculationData = useMemo(() => {
		const segments: InterestSegment[] = values.segments || [];
		const hasMultipleSegments = segments.length > 0;
		const capitalBase = typeof values.capital === "number" ? values.capital : parseFloat(values.capital || "0");

		// Obtener el valor de interés
		let interesValor = 0;
		if (groupedResults.intereses && groupedResults.intereses.length > 1) {
			const interesItem = groupedResults.intereses.find(
				(item) => item.customLabel === "Intereses" || item.customLabel === "Total de Intereses",
			);
			if (interesItem && typeof interesItem.value === "number") {
				interesValor = interesItem.value;
			}
		}

		return {
			_id: "temp-calculation",
			amount: total,
			capital: capitalBase,
			interest: interesValor,
			type: "Calculado" as const,
			subClassType: hasMultipleSegments ? segments.map((s) => s.rate).join(",") : values.tasa,
			variables: {
				...values,
				// Incluir tramos si existen
				...(hasMultipleSegments
					? {
							segments: segments.map((seg) => ({
								startDate: seg.startDate,
								endDate: seg.endDate,
								rate: seg.rate,
								rateName: seg.rateName,
								capital: seg.capital,
								interest: seg.interest,
								coefficient: seg.coefficient,
								isExtension: seg.isExtension || false,
								// Campos para interés simple
								interestType: seg.interestType,
								simpleRate: seg.simpleRate,
								ratePeriod: seg.ratePeriod,
								capitalizationFrequency: seg.capitalizationFrequency,
							})),
							capitalizeInterest: values.capitalizeInterest || false,
					  }
					: {}),
				calculationResult: {
					detalles: groupedResults.detalles,
					calculos: groupedResults.calculos,
					intereses: groupedResults.intereses,
				},
			},
			keepUpdated: false,
		};
	}, [values, total, groupedResults]);

	// Función para agrupar resultados pasada al componente
	const groupResultsForView = useCallback(
		(variables: Record<string, any> | undefined): Record<string, ResultItem[]> => {
			if (!variables) return groupedResults as unknown as Record<string, ResultItem[]>;
			// Usar los resultados ya agrupados que tenemos
			if (variables.calculationResult) {
				return variables.calculationResult as Record<string, ResultItem[]>;
			}
			return groupedResults as unknown as Record<string, ResultItem[]>;
		},
		[groupedResults],
	);

	// Renderizar tabla de tasas
	const renderTasasTable = () => {
		// Verificar si hay múltiples tramos
		const segments: InterestSegment[] = values.segments || [];
		const hasMultipleSegments = segments.length > 0;

		// Caso: Múltiples tramos
		if (hasMultipleSegments) {
			// Mostrar loading mientras se cargan los datos
			if (tasasDataLoading) {
				return (
					<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
						<CircularProgress size={24} sx={{ mr: 2 }} />
						<Typography>Cargando datos de tasas...</Typography>
					</Box>
				);
			}

			return (
				<>
					<Typography variant="subtitle1" gutterBottom>
						Detalle de Tasas por Tramo {values.capitalizeInterest && "(con capitalización)"}
					</Typography>

					{segments.map((segment: InterestSegment, index: number) => {
						const tasaData = segmentsTasasData[segment.id];
						const isSimpleInterest = segment.interestType === "simple" || segment.rate === "simple" || tasaData?.isSimpleInterest;
						const tipoIndice = tasaData?.configTasa?.tipoIndice;
						const isIndexado = tipoIndice === "indexado";

						// Helper para obtener el nombre del período
						const getPeriodLabel = (period?: string) => {
							const labels: Record<string, string> = {
								daily: "Diario",
								monthly: "Mensual",
								annual: "Anual",
							};
							return labels[period || ""] || period || "";
						};

						// Helper para obtener el nombre de la capitalización
						const getCapitalizationLabel = (cap?: string) => {
							const labels: Record<string, string> = {
								none: "Sin capitalización",
								monthly: "Mensual",
								quarterly: "Trimestral",
								semiannual: "Semestral",
								annual: "Anual",
							};
							return labels[cap || ""] || cap || "";
						};

						return (
							<Box key={segment.id || index} sx={{ mb: 3 }}>
								<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "primary.main" }}>
									Tramo {index + 1}: {segment.rateName || segment.rate}
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									Período: {segment.startDate} - {segment.endDate} | Capital:{" "}
									{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(segment.capital)} | Coeficiente:{" "}
									{(segment.coefficient * 100).toFixed(4)}% | Interés:{" "}
									{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(segment.interest)}
								</Typography>

								{isSimpleInterest ? (
									// Mostrar información de la tasa simple (solo configuración, sin resultados)
									<TableContainer component={Paper} sx={{ mt: 1 }}>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Parámetro</TableCell>
													<TableCell align="right">Valor</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												<TableRow>
													<TableCell>Tipo de Interés</TableCell>
													<TableCell align="right">Interés Simple</TableCell>
												</TableRow>
												<TableRow>
													<TableCell>Tasa</TableCell>
													<TableCell align="right">{segment.simpleRate || "-"}%</TableCell>
												</TableRow>
												<TableRow>
													<TableCell>Período de la Tasa</TableCell>
													<TableCell align="right">{getPeriodLabel(segment.ratePeriod)}</TableCell>
												</TableRow>
												{segment.capitalizationFrequency && segment.capitalizationFrequency !== "none" && (
													<TableRow>
														<TableCell>Capitalización</TableCell>
														<TableCell align="right">{getCapitalizationLabel(segment.capitalizationFrequency)}</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</TableContainer>
								) : tasaData ? (
									<TableContainer component={Paper} sx={{ mt: 1 }}>
										<Table size="small">
											<TableHead>
												<TableRow>
													{isIndexado ? (
														<>
															<TableCell>Período</TableCell>
															<TableCell>Fecha</TableCell>
															<TableCell align="right">Valor</TableCell>
														</>
													) : (
														<>
															<TableCell>Fecha</TableCell>
															<TableCell align="right">Valor Diario</TableCell>
														</>
													)}
												</TableRow>
											</TableHead>
											<TableBody>
												{isIndexado ? (
													<>
														<TableRow>
															<TableCell>Inicial</TableCell>
															<TableCell>
																{tasaData.datos?.inicio?.fecha ? dayjs(tasaData.datos.inicio.fecha).format("DD/MM/YYYY") : "N/A"}
															</TableCell>
															<TableCell align="right">{tasaData.datos?.inicio?.[segment.rate]?.toFixed(6) || "N/A"}</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>Final</TableCell>
															<TableCell>
																{tasaData.datos?.fin?.fecha ? dayjs(tasaData.datos.fin.fecha).format("DD/MM/YYYY") : "N/A"}
															</TableCell>
															<TableCell align="right">{tasaData.datos?.fin?.[segment.rate]?.toFixed(6) || "N/A"}</TableCell>
														</TableRow>
													</>
												) : Array.isArray(tasaData.datos) ? (
													tasaData.datos.slice(0, 10).map((item: any, idx: number) => (
														<TableRow key={idx}>
															<TableCell>{item.fecha ? dayjs(item.fecha).format("DD/MM/YYYY") : "N/A"}</TableCell>
															<TableCell align="right">
																{item[segment.rate] !== undefined ? item[segment.rate].toFixed(4) : "N/A"}
															</TableCell>
														</TableRow>
													))
												) : (
													<TableRow>
														<TableCell colSpan={2}>Sin datos disponibles</TableCell>
													</TableRow>
												)}
												{!isIndexado && Array.isArray(tasaData.datos) && tasaData.datos.length > 10 && (
													<TableRow>
														<TableCell colSpan={2} sx={{ textAlign: "center", fontStyle: "italic" }}>
															... y {tasaData.datos.length - 10} registros más
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</TableContainer>
								) : (
									<Typography variant="body2" color="text.secondary">
										Datos de tasa no disponibles
									</Typography>
								)}

								{index < segments.length - 1 && <Divider sx={{ my: 2 }} />}
							</Box>
						);
					})}
				</>
			);
		}

		// Caso: Sin múltiples tramos (comportamiento original)
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
		<>
			{/* Usar CalculationDetailsView para el renderizado */}
			<CalculationDetailsView
				data={calculationData}
				getLabelForKey={getLabelForKey}
				formatValue={formatValue}
				groupResults={groupResultsForView}
				generatePlainText={generatePlainText}
				generateHtmlContent={generateHtmlContent}
				customTitle="Liquidación de Intereses"
				hideInterestButton={true}
				showSaveButton={!isSaved}
				onSaveClick={handleSaveCalculation}
				isSaved={isSaved}
				isSaving={isSaving}
			/>

			{/* Botones adicionales específicos de resultsView */}
			<Stack direction="row" justifyContent="flex-end" spacing={2} className="no-print" sx={{ mt: 3, px: 2 }}>
				<Button variant="contained" color="info" onClick={() => setShowTasasModal(true)}>
					Ver Tasas
				</Button>
				<Button variant="contained" color="error" onClick={onReset}>
					Nueva Liquidación
				</Button>
			</Stack>

			{/* Modal para ver tabla de tasas */}
			<Dialog open={showTasasModal} onClose={() => setShowTasasModal(false)} maxWidth="md" fullWidth>
				<DialogTitle>Detalle de Tasas</DialogTitle>
				<DialogContent sx={{ minHeight: 300 }}>{renderTasasTable()}</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowTasasModal(false)}>Cerrar</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ResultsView;
