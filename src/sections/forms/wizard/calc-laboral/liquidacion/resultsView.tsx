import React, { useState, useMemo } from "react";
import { Button, Stack, Zoom } from "@mui/material";
import { CalculationDetailsView } from "../../../../../components/calculator/CalculationDetailsView";
import { dispatch, useSelector, RootState } from "store";
import { addCalculator } from "store/reducers/calculator";
import { CalculatorType } from "types/calculator";
import LinkCauseModal from "../components/linkCauseModal";
import liquidacionFormModel from "./formModel/liquidacionFormModel";
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
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [savedCalculationId] = useState<string | null>(null);
	const { formField } = liquidacionFormModel;

	const userFromRedux = useSelector((state: RootState) => state.auth.user);
	const interestRates = useSelector((state: RootState) => state.interestRates.rates);

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

		// Para valores monetarios (incluyendo los relacionados con intereses)
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

	const shouldShowValue = (value: number | string): boolean => {
		if (typeof value === "number") return value > 0;
		if (typeof value === "string") return value.trim() !== "";
		return false;
	};

	const sortItemsByType = (items: ResultItem[], type: string): ResultItem[] => {
		// Ordenar los items de liquidacion según prioridad
		if (type === "liquidacion") {
			const order = ["preaviso", "integracionMes", "sacProp", "sacPreaviso", "diasTrabajados", "vacaciones"];
			return [...items].sort((a, b) => {
				const aIndex = order.indexOf(a.key);
				const bIndex = order.indexOf(b.key);
				if (aIndex === -1) return 1;
				if (bIndex === -1) return -1;
				return aIndex - bIndex;
			});
		}

		// Ordenar los items de intereses
		if (type === "intereses") {
			const orderMap: Record<string, number> = {
				fechaInicialIntereses: 0,
				fechaFinalIntereses: 1,
				tasaIntereses: 2,
				capitalizeInterest: 3,
				montoIntereses: 1000,
				montoTotalConIntereses: 1001,
			};

			return [...items].sort((a, b) => {
				let orderA = orderMap[a.key];
				let orderB = orderMap[b.key];

				// Manejar tramos dinámicos
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

		// Para otros tipos, ordenar alfabéticamente
		return [...items].sort((a, b) => {
			const aLabel = getLabelForKey(a.key);
			const bLabel = getLabelForKey(b.key);
			return aLabel.localeCompare(bLabel);
		});
	};

	const groupResults = (inputValues: Record<string, any> | undefined): GroupedResults => {
		const groups: GroupedResults = {
			reclamo: [],
			liquidacion: [],
			otrasSumas: [],
			intereses: [],
		};

		if (!inputValues) return groups;

		// Detectar si hay una carpeta vinculada
		const isLinkedToFolder =
			inputValues.reclamante && typeof inputValues.reclamante === "string" && inputValues.reclamante.startsWith("__CAUSA_VINCULADA__");

		// Si hay carpeta vinculada, extraer el nombre de la carpeta
		if (isLinkedToFolder) {
			const folderName =
				inputValues.folderName ||
				(typeof inputValues.reclamante === "string" ? inputValues.reclamante.replace("__CAUSA_VINCULADA__", "").trim() : "");

			if (folderName) {
				groups.reclamo.push({ key: "caratula", value: folderName });
			}
		}

		// Realizar cálculos de liquidación (simulados por ahora)
		const remuneracion = parseFloat(inputValues.remuneracion) || 0;
		const otrasSumas = parseFloat(inputValues.otrasSumas) || 0;
		const diasNoTrabajados = parseInt(inputValues.dias) || 0;

		// Calcular componentes seleccionados
		const liquidacionSeleccionada = inputValues.liquidacion || [];
		let totalLiquidacion = 0;

		if (liquidacionSeleccionada.includes("preaviso")) {
			const preaviso = remuneracion; // 1 mes de preaviso
			groups.liquidacion.push({ key: "preaviso", value: preaviso });
			totalLiquidacion += preaviso;
		}

		if (liquidacionSeleccionada.includes("integracionMes")) {
			const integracion = remuneracion; // 1 mes de integración
			groups.liquidacion.push({ key: "integracionMes", value: integracion });
			totalLiquidacion += integracion;
		}

		if (liquidacionSeleccionada.includes("sacProp")) {
			const sacProp = remuneracion / 12; // SAC proporcional aproximado
			groups.liquidacion.push({ key: "sacProp", value: sacProp });
			totalLiquidacion += sacProp;
		}

		if (liquidacionSeleccionada.includes("sacPreaviso")) {
			const sacPreaviso = remuneracion / 12; // SAC sobre preaviso
			groups.liquidacion.push({ key: "sacPreaviso", value: sacPreaviso });
			totalLiquidacion += sacPreaviso;
		}

		if (liquidacionSeleccionada.includes("diasTrabajados")) {
			const diasTrabajados = (remuneracion / 30) * (30 - diasNoTrabajados); // Días trabajados del mes
			groups.liquidacion.push({ key: "diasTrabajados", value: diasTrabajados });
			totalLiquidacion += diasTrabajados;
		}

		if (liquidacionSeleccionada.includes("vacaciones")) {
			const vacaciones = remuneracion / 12; // Vacaciones proporcionales aproximadas
			groups.liquidacion.push({ key: "vacaciones", value: vacaciones });
			totalLiquidacion += vacaciones;
		}

		// Agregar datos del reclamo
		Object.entries(inputValues).forEach(([key, value]) => {
			if (value == null || value === "" || value === false) return;
			if (typeof value === "object" || Array.isArray(value)) return;
			if (typeof value === "number" && value === 0) return;

			// Excluir reclamante y reclamado si hay carpeta vinculada
			if (isLinkedToFolder && (key === "reclamante" || key === "reclamado")) {
				return;
			}

			const item: ResultItem = { key, value };

			if (["reclamante", "reclamado", "fechaIngreso", "fechaEgreso", "remuneracion"].includes(key)) {
				if (shouldShowValue(value)) {
					groups.reclamo.push(item);
				}
			}
		});

		// Agregar otras sumas
		if (otrasSumas > 0) {
			groups.otrasSumas.push({ key: "otrasSumas", value: otrasSumas });
		}

		// Manejar intereses si están habilitados
		if (inputValues.aplicarIntereses) {
			const montoBase = totalLiquidacion + otrasSumas;
			const segments = inputValues.segmentsIntereses || [];

			// Verificar si hay múltiples tramos
			if (segments.length > 0) {
				// Verificar si el capital de los segmentos coincide con el montoBase calculado
				// Si el usuario modificó rubros después de configurar intereses, los segmentos pueden estar desactualizados
				const capitalSegmentos = segments[0]?.capital || 0;
				const diferenciaCapital = Math.abs(montoBase - capitalSegmentos);

				// Ajustar segmentos si hay diferencia significativa (más de $1)
				let segmentosAjustados = segments;
				if (diferenciaCapital > 1) {
					// Recalcular proporcionalmente cada segmento con el nuevo capital
					let capitalAcumulado = montoBase;
					segmentosAjustados = segments.map((seg: any, index: number) => {
						const nuevoCapital = inputValues.capitalizeInterest && index > 0 ? capitalAcumulado : montoBase;
						const nuevoInteres = Math.round(nuevoCapital * seg.coefficient);

						if (inputValues.capitalizeInterest) {
							capitalAcumulado = nuevoCapital + nuevoInteres;
						}

						return {
							...seg,
							capital: nuevoCapital,
							interest: nuevoInteres,
						};
					});
				}

				// Modo con múltiples tramos - mostrar información detallada de cada tramo
				groups.intereses.push({
					key: "fechaInicialIntereses",
					value: segmentosAjustados[0]?.startDate || inputValues.fechaInicialIntereses,
				});
				groups.intereses.push({
					key: "fechaFinalIntereses",
					value: segmentosAjustados[segmentosAjustados.length - 1]?.endDate || inputValues.fechaFinalIntereses,
				});

				if (inputValues.capitalizeInterest) {
					groups.intereses.push({
						key: "capitalizeInterest",
						value: "Sí",
					});
				}

				// Mostrar detalle de cada tramo con su tasa (usando segmentos ajustados)
				segmentosAjustados.forEach((seg: any, index: number) => {
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

					// Interés del tramo (usando el valor ajustado)
					groups.intereses.push({
						key: `tramoInteres_${index}`,
						value: seg.interest || 0,
					});
				});

				// Calcular total de intereses (usando segmentos ajustados)
				const totalIntereses = segmentosAjustados.reduce((sum: number, seg: any) => sum + (seg.interest || 0), 0);

				// Si hay capitalización, el monto final es diferente
				const montoTotalConIntereses = inputValues.capitalizeInterest
					? (segmentosAjustados[segmentosAjustados.length - 1]?.capital || montoBase) +
						(segmentosAjustados[segmentosAjustados.length - 1]?.interest || 0)
					: montoBase + totalIntereses;

				groups.intereses.push({
					key: "montoIntereses",
					value: totalIntereses,
				});

				groups.intereses.push({
					key: "montoTotalConIntereses",
					value: montoTotalConIntereses,
				});
			} else if (inputValues.fechaInicialIntereses && inputValues.fechaFinalIntereses && inputValues.tasaIntereses) {
				// Fallback al método anterior para compatibilidad
				const fechaInicial = dayjs(inputValues.fechaInicialIntereses, "DD/MM/YYYY");
				const fechaFinal = dayjs(inputValues.fechaFinalIntereses, "DD/MM/YYYY");
				const dias = fechaFinal.diff(fechaInicial, "days");
				const tasaAnual = 0.15; // Tasa simulada del 15% anual
				const intereses = (montoBase * tasaAnual * dias) / 365;

				groups.intereses.push({ key: "fechaInicialIntereses", value: inputValues.fechaInicialIntereses });
				groups.intereses.push({ key: "fechaFinalIntereses", value: inputValues.fechaFinalIntereses });
				groups.intereses.push({ key: "tasaIntereses", value: inputValues.tasaIntereses });
				groups.intereses.push({ key: "montoIntereses", value: intereses });
				groups.intereses.push({ key: "montoTotalConIntereses", value: montoBase + intereses });
			}
		}

		// Ordenar items en cada grupo
		Object.keys(groups).forEach((groupKey) => {
			groups[groupKey] = sortItemsByType(groups[groupKey], groupKey);
		});

		return groups;
	};

	const groupedResults = useMemo(() => groupResults(values), [values]);

	// Calcular capital base (sin intereses)
	const capitalBase = useMemo(() => {
		const liquidacionTotal =
			groupedResults.liquidacion?.reduce((sum, { value }) => {
				return sum + (typeof value === "number" ? value : 0);
			}, 0) || 0;

		const otrasSumasTotal =
			groupedResults.otrasSumas?.reduce((sum, { value }) => {
				return sum + (typeof value === "number" ? value : 0);
			}, 0) || 0;

		return liquidacionTotal + otrasSumasTotal;
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
			const userId = userFromRedux?._id;
			const userName = userFromRedux?.name || userFromRedux?.email || "Usuario";

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

			const calculatorData: Omit<CalculatorType, "_id" | "isLoader" | "error"> = {
				userId,
				date: dayjs().format("YYYY-MM-DD"),
				type: "Calculado" as const,
				classType: "laboral" as const,
				subClassType: "liquidación final" as const,
				amount: total, // Total con intereses
				capital: capitalBase, // Capital sin intereses
				interest: interesesMonto, // Monto de intereses
				user: userName,
				...(folderId ? { folderId } : {}),
				...(folderName ? { folderName } : {}),
				variables: {
					...values,
					calculationResult: groupedResults,
				},
			};

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
		let text = "RESULTADOS DE LA LIQUIDACIÓN FINAL\n\n";

		const groupTitles: Record<string, string> = {
			reclamo: "DATOS DEL RECLAMO",
			liquidacion: "LIQUIDACIÓN FINAL",
			otrasSumas: "OTRAS SUMAS ADEUDADAS",
			intereses: "INTERESES",
		};

		Object.entries(groupedResults).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				const title = groupTitles[group] || group.toUpperCase();
				text += `${title}\n`;

				items.forEach((item: ResultItem) => {
					// Ocultar montoTotalConIntereses en la sección de intereses
					if (group === "intereses" && item.key === "montoTotalConIntereses") {
						return;
					}
					text += `${getLabelForKey(item.key)}: ${formatValue(item.key, item.value)}\n`;
				});

				text += "\n";
			}
		});

		text += `TOTAL: ${new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(total)}`;

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
			const tasaLabel = tasa ? getLabelForKey(tasa.key) : "";
			const tasaValue = tasa ? formatValue(tasa.key, tasa.value) : "";
			const interesLabel = interes ? getLabelForKey(interes.key) : "";
			const interesValue = interes ? formatValue(interes.key, interes.value) : "";

			const tasaHtml = tasa
				? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;"><span style="color: #666;">${tasaLabel}:</span><span style="font-weight: 500;">${tasaValue}</span></div>`
				: "";
			const interesHtml = interes
				? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;"><span style="color: #666;">${interesLabel}:</span><span style="font-weight: 500; color: #2e7d32;">${interesValue}</span></div>`
				: "";
			return `
				<div style="margin: 8px 0; background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden;">
					<div style="background: #f0f0f0; padding: 8px 12px; border-bottom: 1px solid #e8e8e8; font-weight: 600; font-size: 13px; display: flex; justify-content: space-between;">
						<span>${getLabelForKey(header.key)}</span>
						<span style="color: #666; font-weight: 500;">${formatValue(header.key, header.value)}</span>
					</div>
					<div style="padding: 8px 12px;">
						${tasaHtml}
						${interesHtml}
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
					rowsHtml += createRow(
						`${getLabelForKey(montoInteresesItem.key)}:`,
						formatValue(montoInteresesItem.key, montoInteresesItem.value),
					);
				}
			}

			// Calcular y agregar subtotal si corresponde
			if (showSubtotal) {
				const subtotal = filteredItems.reduce((sum, item) => {
					// No sumar campos no monetarios ni tramos individuales
					if (
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

		const groupTitles: Record<string, string> = {
			reclamo: "Datos del Reclamo",
			liquidacion: "Liquidación Final",
			otrasSumas: "Otras Sumas Adeudadas",
			intereses: "Intereses",
		};

		let html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">`;
		html += `<h2 style="text-align: center; color: #1976d2; margin-bottom: 24px;">Liquidación Final</h2>`;

		// Renderizar cada sección
		Object.entries(groupedResults).forEach(([group, items]: [string, ResultItem[]]) => {
			const title = groupTitles[group] || group;
			const showSubtotal = group !== "reclamo"; // Mostrar subtotal en todas menos reclamo
			html += renderSection(title, items, showSubtotal);
		});

		// Total final
		html += `
			<div style="margin-bottom: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
				<div style="background: #1976d2; padding: 12px 16px; font-weight: 600; color: white;">Total a Pagar</div>
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 12px 16px; color: #666; text-align: left;">Total:</td>
						<td style="padding: 12px 16px; font-weight: 700; color: #1976d2; font-size: 16px; text-align: right;">${new Intl.NumberFormat("es-AR", {
							style: "currency",
							currency: "ARS",
						}).format(total)}</td>
					</tr>
				</table>
			</div>
		`;

		html += `</div>`;
		return html;
	};

	const handleReset = () => {
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
				customTitle="Liquidación Final - Law||Analytics"
				hideInterestButton={true}
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
		</>
	);
};

export default ResultsView;
