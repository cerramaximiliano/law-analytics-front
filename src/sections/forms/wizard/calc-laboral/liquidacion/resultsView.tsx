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
	const [savedCalculationId] = useState<string | null>(null);
	const { formField } = liquidacionFormModel;

	const userFromRedux = useSelector((state: RootState) => state.auth.user);

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
		};

		if (interesesLabels[key]) {
			return interesesLabels[key];
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

		// Para la tasa de intereses (mostrar un nombre más amigable)
		if (key === "tasaIntereses") {
			const tasasLabels: { [key: string]: string } = {
				tasaPasivaBCRA: "Tasa Pasiva BCRA",
				acta2601: "Acta 2601",
				acta2630: "Acta 2630",
			};
			return tasasLabels[String(value)] || String(value);
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
		if (inputValues.aplicarIntereses && inputValues.fechaInicialIntereses && inputValues.fechaFinalIntereses && inputValues.tasaIntereses) {
			// Calcular intereses (simulado)
			const montoBase = totalLiquidacion + otrasSumas;
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
		if (isSaved) return;

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
		let html = "<h2>RESULTADOS DE LA LIQUIDACIÓN FINAL</h2>";

		const groupTitles: Record<string, string> = {
			reclamo: "DATOS DEL RECLAMO",
			liquidacion: "LIQUIDACIÓN FINAL",
			otrasSumas: "OTRAS SUMAS ADEUDADAS",
			intereses: "INTERESES",
		};

		Object.entries(groupedResults).forEach(([group, items]: [string, ResultItem[]]) => {
			if (items.length) {
				const title = groupTitles[group] || group.toUpperCase();
				html += `<h3>${title}</h3>`;
				html += "<table style='width: 100%; border-collapse: collapse;'>";

				items.forEach((item: ResultItem) => {
					// Ocultar montoTotalConIntereses en la sección de intereses
					if (group === "intereses" && item.key === "montoTotalConIntereses") {
						return;
					}
					html += `<tr>
						<td style='padding: 8px; border-bottom: 1px solid #ddd;'>${getLabelForKey(item.key)}:</td>
						<td style='padding: 8px; border-bottom: 1px solid #ddd; text-align: right;'>${formatValue(item.key, item.value)}</td>
					</tr>`;
				});

				html += "</table><br/>";
			}
		});

		html += `<h3>TOTAL: ${new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(total)}</h3>`;

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
