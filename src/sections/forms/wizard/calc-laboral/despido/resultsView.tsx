import React, { useState, useMemo } from "react";
import {
	Button,
	Stack,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Typography,
	Box,
	Divider,
	Zoom,
	CircularProgress,
} from "@mui/material";
import { CalculationDetailsView } from "../../../../../components/calculator/CalculationDetailsView";
import { dispatch, useSelector, RootState } from "store";
import { addCalculator } from "store/reducers/calculator";
import { CalculatorType } from "types/calculator";
import LinkCauseModal from "../components/linkCauseModal";
import { useNavigate } from "react-router";
import despidoFormModel from "./formModel/despidoFormModel";
import dayjs from "utils/dayjs-config";
import { enqueueSnackbar } from "notistack";

// Tipos
interface ResultItem {
	key: string;
	value: number | string;
}

type GroupedResults = Record<string, ResultItem[]>;

interface ResultsViewProps {
	values: Record<string, any>;
	onReset: () => void;
	folderId?: string;
	folderName?: string;
}

const ResultsView: React.FC<ResultsViewProps> = ({ values, onReset, folderId, folderName }) => {
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [infoModalOpen, setInfoModalOpen] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	// These state variables are used by CalculationDetailsView internally
	const [savedCalculationId] = useState<string | null>(null);
	const navigate = useNavigate();
	const { formField } = despidoFormModel;

	const userFromRedux = useSelector((state: RootState) => state.auth.user);
	const interestRates = useSelector((state: RootState) => state.interestRates.rates);

	// No longer used but keeping for potential future use
	// const isLinkedToFolder = useMemo(() => {
	// 	return Boolean((values.folderId || folderId) && (values.folderName || folderName));
	// }, [values.folderId, values.folderName, folderId, folderName]);

	const getLabelForKey = (key: string): string => {
		// Manejo especial para carátula
		if (key === "caratula") {
			return "Carátula";
		}

		// Manejo especial para los campos de liquidación
		const liquidacionLabels: { [key: string]: string } = {
			preaviso: "Preaviso",
			integracionMes: "Integración mes",
			sacProp: "SAC proporcional",
			sacPreaviso: "SAC s/ Preaviso",
			diasTrabajados: "Días trabajados",
			vacaciones: "Vacaciones",
		};

		if (liquidacionLabels[key]) {
			return liquidacionLabels[key];
		}

		// Manejo especial para período de prueba
		if (key === "periodoPruebaLeyenda") {
			return "Aviso";
		}

		// Manejo especial para los campos de intereses
		const interesesLabels: { [key: string]: string } = {
			fechaInicialIntereses: "Fecha inicial de intereses",
			fechaFinalIntereses: "Fecha final de intereses",
			tasaIntereses: "Tasa de interés aplicada",
			montoIntereses: "Monto de intereses",
			montoTotalConIntereses: "Monto total con intereses",
			capitalizeInterest: "Capitalización de intereses",
		};

		if (interesesLabels[key]) {
			return interesesLabels[key];
		}

		// Manejo especial para tramos de intereses dinámicos
		if (key.startsWith("tramoHeader_")) {
			const index = parseInt(key.replace("tramoHeader_", ""), 10);
			return `Tramo ${index + 1}`;
		}
		if (key.startsWith("tramoTasa_")) {
			return `  Tasa aplicada`;
		}
		if (key.startsWith("tramoInteres_")) {
			return `  Interés generado`;
		}

		const field = formField[key as keyof typeof formField];
		return field?.label || key;
	};

	const formatValue = (key: string, value: number | string): string => {
		// Para leyenda de período de prueba, devolver tal cual
		if (key === "periodoPruebaLeyenda") {
			return String(value);
		}

		// Para campos de fechas (incluyendo los de intereses)
		if (key === "fechaIngreso" || key === "fechaEgreso" || key === "fechaInicialIntereses" || key === "fechaFinalIntereses") {
			const date = typeof value === "string" ? value : value.toString();
			return date;
		}

		// Para la tasa de intereses (obtener el label desde el store de Redux)
		// También aplica para tramoTasa_ que contiene el label ya procesado
		if (key === "tasaIntereses" || key.startsWith("tramoTasa_")) {
			const rateValue = String(value);

			// Si ya es un label legible (no es un código), devolverlo tal cual
			if (rateValue.includes(" ") || rateValue.includes("Interés Simple")) {
				return rateValue;
			}

			// Si hay múltiples tasas separadas por coma, procesar cada una
			if (rateValue.includes(",")) {
				const rates = rateValue.split(",").map((r) => r.trim());
				const labels = rates.map((rv) => {
					const rate = interestRates.find((r) => r.value === rv);
					return rate ? rate.label : rv;
				});
				return labels.join(", ");
			}

			// Buscar la tasa en el store de interestRates
			const rate = interestRates.find((r) => r.value === rateValue);
			if (rate) {
				return rate.label;
			}
			// Fallback para tasas conocidas que no estén en el store
			const tasasLabels: { [key: string]: string } = {
				tasaPasivaBCRA: "Tasa Pasiva BCRA",
				acta2601: "Acta 2601",
				acta2630: "Acta 2630",
			};
			return tasasLabels[rateValue] || rateValue;
		}

		// Para Períodos y otros valores numéricos
		if (key === "Periodos" || key === "Días Vacaciones") {
			const numValue = Number(value);
			return !isNaN(numValue) ? numValue.toFixed(2) : "0.00";
		}

		// Para valores monetarios (incluyendo los relacionados con intereses)
		if (typeof value === "number" || !isNaN(Number(value)) || key === "montoIntereses" || key === "montoTotalConIntereses") {
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

	const shouldShowValue = (value: number | string): boolean => {
		if (typeof value === "number") {
			return value !== 0;
		}
		return value !== "";
	};

	// Función auxiliar para ordenar items según tipo
	const sortItemsByType = (items: ResultItem[], type: string): ResultItem[] => {
		if (type === "reclamo") {
			// Definir el orden para la sección "reclamo"
			const orderMap: Record<string, number> = {
				folderId: 999, // No mostrar
				folderName: 998, // No mostrar
				caratula: 0,
				reclamante: 1,
				reclamado: 2,
				fechaIngreso: 3,
				fechaEgreso: 4,
				remuneracion: 5,
				remuneracionTope: 6,
				// Otros campos con menor prioridad
			};

			return [...items].sort((a, b) => {
				const orderA = orderMap[a.key] !== undefined ? orderMap[a.key] : 500;
				const orderB = orderMap[b.key] !== undefined ? orderMap[b.key] : 500;
				return orderA - orderB;
			});
		} else if (type === "indemnizacion") {
			// Orden para la sección "indemnizacion"
			const orderMap: Record<string, number> = {
				Periodos: 0,
				Indemnizacion: 1,
			};

			return [...items].sort((a, b) => {
				const orderA = orderMap[a.key] !== undefined ? orderMap[a.key] : 999;
				const orderB = orderMap[b.key] !== undefined ? orderMap[b.key] : 999;
				return orderA - orderB;
			});
		} else if (type === "intereses") {
			// Ordenar los items de intereses para la sección "intereses"
			const orderMap: Record<string, number> = {
				fechaInicialIntereses: 0,
				fechaFinalIntereses: 1,
				tasaIntereses: 2, // Solo se usa en modo sin tramos
				capitalizeInterest: 3,
				montoIntereses: 1000, // Después de todos los tramos
				montoTotalConIntereses: 1001,
			};

			return [...items].sort((a, b) => {
				let orderA = orderMap[a.key];
				let orderB = orderMap[b.key];

				// Manejar tramos dinámicos - cada tramo tiene 3 elementos: header, tasa, interes
				// tramoHeader_0 = 10, tramoTasa_0 = 11, tramoInteres_0 = 12
				// tramoHeader_1 = 13, tramoTasa_1 = 14, tramoInteres_1 = 15, etc.
				if (a.key.startsWith("tramoHeader_")) {
					const index = parseInt(a.key.replace("tramoHeader_", ""), 10);
					orderA = 10 + index * 3;
				} else if (a.key.startsWith("tramoTasa_")) {
					const index = parseInt(a.key.replace("tramoTasa_", ""), 10);
					orderA = 11 + index * 3;
				} else if (a.key.startsWith("tramoInteres_")) {
					const index = parseInt(a.key.replace("tramoInteres_", ""), 10);
					orderA = 12 + index * 3;
				}

				if (b.key.startsWith("tramoHeader_")) {
					const index = parseInt(b.key.replace("tramoHeader_", ""), 10);
					orderB = 10 + index * 3;
				} else if (b.key.startsWith("tramoTasa_")) {
					const index = parseInt(b.key.replace("tramoTasa_", ""), 10);
					orderB = 11 + index * 3;
				} else if (b.key.startsWith("tramoInteres_")) {
					const index = parseInt(b.key.replace("tramoInteres_", ""), 10);
					orderB = 12 + index * 3;
				}

				orderA = orderA !== undefined ? orderA : 999;
				orderB = orderB !== undefined ? orderB : 999;
				return orderA - orderB;
			});
		}

		return items;
	};

	const groupResults = (inputValues: Record<string, any> | undefined): GroupedResults => {
		// Inicializamos con el mismo formato pero como Record<string, ResultItem[]>
		const groups: GroupedResults = {
			reclamo: [],
			indemnizacion: [],
			liquidacion: [],
			multas: [],
			intereses: [],
			otrasSumas: [],
		};

		// Si no hay valores, retornar el objeto vacío
		if (!inputValues) {
			return groups;
		}

		// No mostrar estos campos en los resultados
		const camposExcluidos = ["folderId", "reclamo"];

		// Agregar datos de intereses si existen
		if (inputValues.datosIntereses) {
			const intereses = inputValues.datosIntereses;

			// Verificar si hay múltiples tramos
			if (intereses.segments && Array.isArray(intereses.segments) && intereses.segments.length > 0) {
				// Modo con múltiples tramos - mostrar información detallada de cada tramo
				groups.intereses.push({
					key: "fechaInicialIntereses",
					value: intereses.fechaInicialIntereses,
				});
				groups.intereses.push({
					key: "fechaFinalIntereses",
					value: intereses.fechaFinalIntereses,
				});

				if (intereses.capitalizeInterest) {
					groups.intereses.push({
						key: "capitalizeInterest",
						value: "Sí",
					});
				}

				// Mostrar detalle de cada tramo con su tasa
				intereses.segments.forEach((seg: any, index: number) => {
					const tasaLabel = seg.rateName || interestRates.find((r) => r.value === seg.rate)?.label || seg.rate;

					// Header del tramo con período
					groups.intereses.push({
						key: `tramoHeader_${index}`,
						value: `${seg.startDate} - ${seg.endDate}`,
					});

					// Tasa del tramo
					groups.intereses.push({
						key: `tramoTasa_${index}`,
						value: tasaLabel,
					});

					// Interés del tramo
					groups.intereses.push({
						key: `tramoInteres_${index}`,
						value: seg.interest,
					});
				});

				groups.intereses.push({
					key: "montoIntereses",
					value: intereses.montoIntereses,
				});
			} else {
				// Modo sin múltiples tramos (comportamiento original)
				groups.intereses.push({
					key: "fechaInicialIntereses",
					value: intereses.fechaInicialIntereses,
				});
				groups.intereses.push({
					key: "fechaFinalIntereses",
					value: intereses.fechaFinalIntereses,
				});
				groups.intereses.push({
					key: "tasaIntereses",
					value: intereses.tasaIntereses,
				});
				groups.intereses.push({
					key: "montoIntereses",
					value: intereses.montoIntereses,
				});
			}

			// Agregar el montoTotalConIntereses como campo oculto para el cálculo del total
			groups.intereses.push({
				key: "montoTotalConIntereses",
				value: intereses.montoTotalConIntereses,
			});
		}

		// Detectar si hay una causa vinculada
		const isCauseLinked =
			inputValues.reclamante && typeof inputValues.reclamante === "string" && inputValues.reclamante.startsWith("__CAUSA_VINCULADA__");

		// Agregar carátula si hay una causa vinculada
		if (isCauseLinked && inputValues.folderName) {
			groups.reclamo.push({
				key: "caratula",
				value: inputValues.folderName,
			});
		}

		// Siempre agregar la sección de indemnización (incluso cuando es 0)
		const periodos = inputValues.Periodos ?? 0;
		const indemnizacion = inputValues.Indemnizacion ?? 0;
		const esPeriodoPrueba = inputValues.esPeriodoPrueba === true;

		groups.indemnizacion.push({ key: "Periodos", value: periodos });
		groups.indemnizacion.push({ key: "Indemnizacion", value: indemnizacion });

		// Agregar leyenda si es período de prueba
		if (esPeriodoPrueba) {
			groups.indemnizacion.push({
				key: "periodoPruebaLeyenda",
				value: "El trabajador se encuentra en período de prueba, no corresponde indemnización por antigüedad.",
			});
		}

		Object.entries(inputValues).forEach(([key, value]) => {
			// Omitir el objeto datosIntereses ya que lo procesamos por separado
			if (key === "datosIntereses") return;
			// Omitir Periodos e Indemnizacion ya que los agregamos arriba
			if (key === "Periodos" || key === "Indemnizacion" || key === "esPeriodoPrueba") return;
			if (value == null || value === "" || value === false) return;
			if (typeof value === "object" || typeof value === "boolean") return;
			if (!shouldShowValue(value)) return;
			if (camposExcluidos.includes(key)) return;

			const item: ResultItem = { key, value };

			if (["reclamante", "reclamado", "fechaIngreso", "fechaEgreso", "remuneracion", "remuneracionTope"].includes(key)) {
				// Si hay causa vinculada, no agregar reclamante ni reclamado
				if (key === "reclamante" || key === "reclamado") {
					if (!isCauseLinked) {
						groups.reclamo.push(item);
					}
				} else {
					groups.reclamo.push(item);
				}
			} else if (key === "otrasSumas") {
				// Otras Sumas Adeudadas va en su propia sección para ser incluida en el total
				groups.otrasSumas.push(item);
			} else if (
				key.includes("Preaviso") ||
				key.includes("SAC") ||
				key.includes("Integración") ||
				key.includes("Vacaciones") ||
				key.includes("Días Trabajados")
			) {
				groups.liquidacion.push(item);
			} else if (key.includes("Multa")) {
				groups.multas.push(item);
			}
			// Remover la sección "otros" que duplicaba el total
		});

		// Ordenar cada grupo según su tipo
		Object.keys(groups).forEach((groupKey) => {
			groups[groupKey] = sortItemsByType(groups[groupKey], groupKey);
		});

		return groups;
	};

	const groupedResults = useMemo(() => groupResults(values), [values]);

	// Calcular capital base (sin intereses)
	const capitalBase = useMemo(() => {
		const sumableGroups = ["indemnizacion", "liquidacion", "multas", "otrasSumas"];
		return Object.entries(groupedResults)
			.filter(([group]) => sumableGroups.includes(group))
			.flatMap(([_, items]) => items)
			.reduce((sum, { key, value }) => {
				// No sumar si la key es Periodos, Días Vacaciones
				if (key === "Periodos" || key === "Días Vacaciones") {
					return sum;
				}

				// Solo sumar si es un número
				return sum + (typeof value === "number" ? value : 0);
			}, 0);
	}, [groupedResults]);

	// Calcular monto de intereses
	const interesesMonto = useMemo(() => {
		const interesesItem = groupedResults.intereses?.find((item) => item.key === "montoIntereses");
		return interesesItem && typeof interesesItem.value === "number" ? interesesItem.value : 0;
	}, [groupedResults]);

	// Total con intereses
	const total = useMemo(() => {
		return capitalBase + interesesMonto;
	}, [capitalBase, interesesMonto]);

	const handleSaveCalculation = async () => {
		if (isSaved || isSaving) return;

		setIsSaving(true);
		try {
			// Verificar si tenemos userId
			const userId = userFromRedux?._id;
			const userName = userFromRedux?.name || userFromRedux?.email || "Usuario";

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

			// Crear el objeto para enviar al servidor según el modelo
			const calculatorData: Omit<CalculatorType, "_id" | "isLoader" | "error"> = {
				userId,
				date: dayjs().format("YYYY-MM-DD"),
				type: "Calculado" as const,
				classType: "laboral" as const,
				subClassType: "despido" as const,
				amount: total, // Total con intereses
				capital: capitalBase, // Capital sin intereses
				interest: interesesMonto, // Monto de intereses
				user: userName,
				// Añadir las propiedades opcionales
				...(folderId ? { folderId } : {}),
				...(folderName ? { folderName } : {}),
				variables: {
					// Guardamos todas las variables necesarias para recrear el cálculo
					...values,
					// Aseguramos que el resultado esté incluido para poder renderizarlo sin recalcular
					calculationResult: groupedResults,
				},
			};

			// Utilizar la acción asíncrona addCalculator
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

	const generatePlainText = () => {
		let text = "RESULTADOS DE LA LIQUIDACIÓN\n\n";

		// Mapeo de títulos para texto plano
		const groupTitles: Record<string, string> = {
			reclamo: "DATOS DEL RECLAMO",
			indemnizacion: "INDEMNIZACIÓN",
			liquidacion: "LIQUIDACIÓN FINAL",
			otrasSumas: "OTROS RUBROS",
			multas: "MULTAS",
			intereses: "INTERESES",
		};

		Object.entries(groupedResults).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				const title = groupTitles[group] || group.toUpperCase();
				text += `${title}\n`;

				const filteredItems: ResultItem[] = [];
				items.forEach((item: ResultItem) => {
					// Ocultar montoTotalConIntereses en la sección de intereses
					if (group === "intereses" && item.key === "montoTotalConIntereses") {
						return;
					}
					text += `${getLabelForKey(item.key)}: ${formatValue(item.key, item.value)}\n`;
					filteredItems.push(item);
				});

				// Calcular subtotal para secciones monetarias
				const sectionsWithSubtotal = ["indemnizacion", "liquidacion", "multas", "intereses", "otrasSumas"];
				if (sectionsWithSubtotal.includes(group)) {
					const subtotal = filteredItems.reduce((sum, item) => {
						// No sumar campos no monetarios
						if (
							item.key === "Periodos" ||
							item.key === "Días Vacaciones" ||
							item.key === "fechaInicialIntereses" ||
							item.key === "fechaFinalIntereses" ||
							item.key === "tasaIntereses"
						) {
							return sum;
						}
						const numValue = typeof item.value === "number" ? item.value : parseFloat(item.value);
						return sum + (isNaN(numValue) ? 0 : numValue);
					}, 0);

					if (subtotal > 0) {
						text += `Subtotal: ${formatValue("subtotal", subtotal)}\n`;
					}
				}

				text += "\n";
			}
		});
		text += `TOTAL: ${formatValue("total", total)}`;
		return text;
	};

	const generateHtmlContent = () => {
		// Helper para crear filas de tabla con label a la izquierda y valor a la derecha
		const createRow = (label: string, value: string, isSubtotal = false, valueColor = "#333") => {
			const bgColor = isSubtotal ? "#f5f5f5" : "transparent";
			const fontWeight = isSubtotal ? "600" : "500";
			return `<tr style="background: ${bgColor};">
				<td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; color: #666; text-align: left;">${label}</td>
				<td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; font-weight: ${fontWeight}; color: ${valueColor}; text-align: right;">${value}</td>
			</tr>`;
		};

		// Helper para renderizar un tramo de intereses
		const renderTramo = (header: ResultItem, tasa: ResultItem | undefined, interes: ResultItem | undefined) => {
			return `
				<div style="margin: 8px 0; background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden;">
					<div style="background: #f0f0f0; padding: 8px 12px; border-bottom: 1px solid #e8e8e8; font-weight: 600; font-size: 13px; display: flex; justify-content: space-between;">
						<span>${getLabelForKey(header.key)}</span>
						<span style="color: #666; font-weight: 500;">${formatValue(header.key, header.value)}</span>
					</div>
					<div style="padding: 8px 12px;">
						${tasa ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;"><span style="color: #666;">${getLabelForKey(tasa.key)}:</span><span style="font-weight: 500;">${formatValue(tasa.key, tasa.value)}</span></div>` : ""}
						${interes ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;"><span style="color: #666;">${getLabelForKey(interes.key)}:</span><span style="font-weight: 500; color: #2e7d32;">${formatValue(interes.key, interes.value)}</span></div>` : ""}
					</div>
				</div>
			`;
		};

		// Helper para renderizar una sección/card
		const renderSection = (title: string, items: ResultItem[], showSubtotal = false) => {
			if (!items.length) return "";

			// Filtrar items ocultos
			const filteredItems = items.filter(({ key }) => {
				if (title === "Intereses" && key === "montoTotalConIntereses") return false;
				return true;
			});

			if (!filteredItems.length) return "";

			// Separar tramos de items regulares
			const tramosMap = new Map<number, { header?: ResultItem; tasa?: ResultItem; interes?: ResultItem }>();
			const regularItems: ResultItem[] = [];

			filteredItems.forEach((item) => {
				const headerMatch = item.key.match(/^tramoHeader_(\d+)$/);
				const tasaMatch = item.key.match(/^tramoTasa_(\d+)$/);
				const interesMatch = item.key.match(/^tramoInteres_(\d+)$/);

				if (headerMatch) {
					const idx = parseInt(headerMatch[1], 10);
					if (!tramosMap.has(idx)) tramosMap.set(idx, {});
					tramosMap.get(idx)!.header = item;
				} else if (tasaMatch) {
					const idx = parseInt(tasaMatch[1], 10);
					if (!tramosMap.has(idx)) tramosMap.set(idx, {});
					tramosMap.get(idx)!.tasa = item;
				} else if (interesMatch) {
					const idx = parseInt(interesMatch[1], 10);
					if (!tramosMap.has(idx)) tramosMap.set(idx, {});
					tramosMap.get(idx)!.interes = item;
				} else {
					regularItems.push(item);
				}
			});

			const tramos = Array.from(tramosMap.entries()).sort((a, b) => a[0] - b[0]);
			const hasTramos = tramos.length > 0;

			// Renderizar items regulares (excluyendo montoIntereses si hay tramos)
			let rowsHtml = regularItems
				.filter((item) => !hasTramos || item.key !== "montoIntereses")
				.map(({ key, value }) => createRow(`${getLabelForKey(key)}:`, formatValue(key, value)))
				.join("");

			// Renderizar tramos
			if (hasTramos) {
				rowsHtml += `<tr><td colspan="2" style="padding: 8px 16px;">`;
				tramos.forEach(([_, tramo]) => {
					if (tramo.header) {
						rowsHtml += renderTramo(tramo.header, tramo.tasa, tramo.interes);
					}
				});
				rowsHtml += `</td></tr>`;

				// Agregar montoIntereses al final
				const montoInteresesItem = regularItems.find((item) => item.key === "montoIntereses");
				if (montoInteresesItem) {
					rowsHtml += createRow(`${getLabelForKey(montoInteresesItem.key)}:`, formatValue(montoInteresesItem.key, montoInteresesItem.value));
				}
			}

			// Calcular y agregar subtotal si corresponde
			if (showSubtotal) {
				const subtotal = filteredItems.reduce((sum, item) => {
					// No sumar campos no monetarios ni tramos individuales
					if (
						item.key === "Periodos" ||
						item.key === "Días Vacaciones" ||
						item.key === "fechaInicialIntereses" ||
						item.key === "fechaFinalIntereses" ||
						item.key === "tasaIntereses" ||
						item.key === "capitalizeInterest" ||
						item.key.startsWith("tramoHeader_") ||
						item.key.startsWith("tramoTasa_") ||
						item.key.startsWith("tramoInteres_")
					) {
						return sum;
					}
					const numValue = typeof item.value === "number" ? item.value : parseFloat(String(item.value));
					return sum + (isNaN(numValue) ? 0 : numValue);
				}, 0);

				if (subtotal > 0) {
					rowsHtml += createRow("Subtotal:", formatValue("subtotal", subtotal), true, "#1976d2");
				}
			}

			return `
				<div style="margin-bottom: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
					<div style="background: #f5f5f5; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333;">${title}</div>
					<table style="width: 100%; border-collapse: collapse;">
						${rowsHtml}
					</table>
				</div>
			`;
		};

		let html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">`;
		html += `<h2 style="text-align: center; color: #1976d2; margin-bottom: 24px;">Liquidación por Despido</h2>`;

		// Renderizar cada sección
		html += renderSection("Datos del Reclamo", groupedResults.reclamo, false);
		html += renderSection("Indemnización", groupedResults.indemnizacion, true);
		html += renderSection("Liquidación Final", groupedResults.liquidacion, true);
		html += renderSection("Otros Rubros", groupedResults.otrasSumas, true);
		html += renderSection("Multas", groupedResults.multas, true);
		html += renderSection("Intereses", groupedResults.intereses, true);

		// Total final
		html += `
			<div style="margin-bottom: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
				<div style="background: #1976d2; padding: 12px 16px; font-weight: 600; color: white;">Total a Pagar</div>
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 12px 16px; color: #666; text-align: left;">Total:</td>
						<td style="padding: 12px 16px; font-weight: 700; color: #1976d2; font-size: 16px; text-align: right;">${formatValue("total", total)}</td>
					</tr>
				</table>
			</div>
		`;

		html += `</div>`;
		return html;
	};

	const handleReset = () => {
		navigate(".", { replace: true }); // This removes query parameters
		onReset();
	};

	return (
		<>
			<CalculationDetailsView
				data={{
					_id: savedCalculationId || "temp_id",
					folderId: values.folderId || folderId,
					amount: total,
					variables: {
						...values,
						groupedResults,
						total,
					},
					subClassType: "laboral",
				}}
				getLabelForKey={getLabelForKey}
				formatValue={formatValue}
				groupResults={groupResults}
				generatePlainText={generatePlainText}
				generateHtmlContent={generateHtmlContent}
				customTitle="Liquidación por Despido - Law||Analytics"
				hideInterestButton={true}
				showInfoButton={true}
				onInfoClick={() => setInfoModalOpen(true)}
				showSaveButton={true}
				onSaveClick={handleSaveCalculation}
				isSaved={isSaved}
				isSaving={isSaving}
			/>

			<Stack direction="row" justifyContent="flex-end" className="no-print" sx={{ mt: 2 }}>
				<Button variant="contained" color="error" onClick={handleReset}>
					Nueva Liquidación
				</Button>
			</Stack>

			<LinkCauseModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} calculationId={savedCalculationId || ""} />

			{/* Modal de información sobre cálculos */}
			<Dialog open={infoModalOpen} onClose={() => setInfoModalOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>Información sobre los Cálculos</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={3}>
						{/* Sección Indemnización */}
						<Box>
							<Typography variant="h6" color="primary" gutterBottom>
								Cálculo de Indemnización
							</Typography>
							<Typography variant="body2" paragraph>
								<strong>Fórmula:</strong> Períodos × Remuneración mensual
							</Typography>
							{values.aplicarLey27742 ? (
								<Box sx={{ p: 2, bgcolor: "warning.light", borderRadius: 1, mb: 2 }}>
									<Typography variant="body2" fontWeight="bold" gutterBottom>
										🗂️ Ley 27.742 aplicada
									</Typography>
									<Typography variant="body2" component="div">
										• <strong>Solo años completos:</strong> No se suma fracción mayor a 3 meses
										<br />• <strong>Período de prueba:</strong> Mínimo 6 meses de antigüedad
										<br />• <strong>Criterio mínimo:</strong> 6+ meses = 1 año de indemnización
										<br />• <strong>Años completos:</strong> Cada año completo = 1 mes de remuneración
									</Typography>
								</Box>
							) : (
								<Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 1, mb: 2 }}>
									<Typography variant="body2" fontWeight="bold" gutterBottom>
										📜 Criterio tradicional aplicado
									</Typography>
									<Typography variant="body2" component="div">
										• <strong>Fracción mayor a 3 meses:</strong> Se computa como año completo
										<br />• <strong>Período de prueba:</strong> Desde 3+ meses ya genera indemnización
										<br />• <strong>Criterio:</strong> Más flexible para el trabajador
									</Typography>
								</Box>
							)}
						</Box>

						<Divider />

						{/* Sección Tope Vizzoti */}
						{values.isTopes && (
							<>
								<Box>
									<Typography variant="h6" color="primary" gutterBottom>
										Criterio Vizzoti (Tope de Indemnización)
									</Typography>
									<Typography variant="body2" paragraph>
										<strong>Aplicación del Tope:</strong>
									</Typography>
									<Typography variant="body2" component="div" sx={{ ml: 2 }}>
										• Se calcula el <strong>67% de la remuneración real</strong>
										<br />• Se toma el <strong>mayor valor</strong> entre:
										<br />
										&nbsp;&nbsp;- El 67% de la remuneración
										<br />
										&nbsp;&nbsp;- El tope legal vigente
										<br />• <strong>Nunca puede superar</strong> la remuneración original
									</Typography>
									<Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
										<Typography variant="body2" fontWeight="bold" gutterBottom>
											Ejemplo práctico:
										</Typography>
										<Typography variant="body2" component="div">
											• Remuneración: $1.000.000
											<br />
											• Tope legal: $500.000
											<br />
											• 67% remuneración: $670.000
											<br />• <strong>Resultado: $670.000</strong> (mayor entre $670.000 y $500.000)
										</Typography>
									</Box>
								</Box>
								<Divider />
							</>
						)}

						{/* Sección Liquidación Final */}
						{values.isLiquidacion && (
							<>
								<Box>
									<Typography variant="h6" color="primary" gutterBottom>
										Liquidación Final
									</Typography>
									<Typography variant="body2" paragraph>
										<strong>Preaviso:</strong> Según antigüedad (1 o 2 meses de remuneración)
									</Typography>
									<Typography variant="body2" paragraph>
										<strong>SAC Proporcional:</strong> (Días trabajados en el semestre / 365) × (Remuneración / 12)
									</Typography>
									<Typography variant="body2" paragraph>
										<strong>Vacaciones:</strong> Según antigüedad (14, 21, 28 o 35 días) calculadas proporcionalmente
									</Typography>
								</Box>
								<Divider />
							</>
						)}

						{/* Sección Multas */}
						{values.isMultas && (
							<>
								<Box>
									<Typography variant="h6" color="primary" gutterBottom>
										Multas Laborales
									</Typography>
									<Typography variant="body2" paragraph>
										<strong>Art. 1° Ley 25.323:</strong> 50% de la indemnización
									</Typography>
									<Typography variant="body2" paragraph>
										<strong>Art. 2° Ley 25.323:</strong> 100% de la indemnización
									</Typography>
									<Typography variant="body2" paragraph>
										<strong>Art. 80 LCT:</strong> 3 meses de remuneración
									</Typography>
									<Typography variant="body2" paragraph>
										<strong>Arts. 8, 9, 10, 15 Ley 24.013:</strong> 25% del total de remuneraciones no registradas
									</Typography>
								</Box>
								<Divider />
							</>
						)}

						{/* Sección Intereses */}
						{values.aplicarIntereses && (
							<Box>
								<Typography variant="h6" color="primary" gutterBottom>
									Cálculo de Intereses
								</Typography>
								<Typography variant="body2" paragraph>
									Los intereses se calculan sobre el monto total de la liquidación desde la fecha de inicio hasta la fecha final, aplicando
									la tasa seleccionada de forma diaria.
								</Typography>
								<Typography variant="body2" paragraph>
									<strong>Fórmula:</strong> Monto base × Tasa diaria × Días transcurridos
								</Typography>
							</Box>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setInfoModalOpen(false)} variant="contained">
						Cerrar
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ResultsView;
