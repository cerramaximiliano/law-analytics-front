import React, { useState, useMemo } from "react";
import { Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Divider, Zoom } from "@mui/material";
import { CalculationDetailsView } from "../../../../../components/calculator/CalculationDetailsView";
import { dispatch, useSelector, RootState } from "store";
import { addCalculator } from "store/reducers/calculator";
import { CalculatorType } from "types/calculator";
import LinkCauseModal from "../components/linkCauseModal";
import { useNavigate } from "react-router";
import despidoFormModel from "./formModel/despidoFormModel";
import moment from "moment";
import { enqueueSnackbar } from "notistack";

// Tipos
interface ResultItem {
	key: string;
	value: number | string;
}

// Este tipo estaba causando el error, ya que no es compatible con Record<string, ResultItem[]>
// interface GroupedResults {
// 	reclamo: ResultItem[];
// 	indemnizacion: ResultItem[];
// 	liquidacion: ResultItem[];
// 	multas: ResultItem[];
// 	otros: ResultItem[];
// }

// En su lugar, usamos directamente el tipo que espera el componente CalculationDetailsView
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
	// These state variables are used by CalculationDetailsView internally
	const [savedCalculationId] = useState<string | null>(null);
	const navigate = useNavigate();
	const { formField } = despidoFormModel;

	const userFromRedux = useSelector((state: RootState) => state.auth.user);

	// No longer used but keeping for potential future use
	// const isLinkedToFolder = useMemo(() => {
	// 	return Boolean((values.folderId || folderId) && (values.folderName || folderName));
	// }, [values.folderId, values.folderName, folderId, folderName]);

	const getLabelForKey = (key: string): string => {
		// Manejo especial para carátula
		if (key === "caratula") {
			return "Carátula";
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
				tasaIntereses: 2,
				montoIntereses: 3,
				montoTotalConIntereses: 4,
			};

			return [...items].sort((a, b) => {
				const orderA = orderMap[a.key] !== undefined ? orderMap[a.key] : 999;
				const orderB = orderMap[b.key] !== undefined ? orderMap[b.key] : 999;
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
			// Agregar campos de intereses a la sección "intereses" (solo los datos solicitados)
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

		Object.entries(inputValues).forEach(([key, value]) => {
			// Omitir el objeto datosIntereses ya que lo procesamos por separado
			if (key === "datosIntereses") return;
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
			// Remover la sección "otros" que duplicaba el total
		});

		// Ordenar cada grupo según su tipo
		Object.keys(groups).forEach((groupKey) => {
			groups[groupKey] = sortItemsByType(groups[groupKey], groupKey);
		});

		return groups;
	};

	const groupedResults = useMemo(() => groupResults(values), [values]);

	const total = useMemo(() => {
		// Si hay intereses, calcular el total considerando el monto total con intereses + otras sumas
		const interesTotal = groupedResults.intereses?.find((item) => item.key === "montoTotalConIntereses");
		if (interesTotal && typeof interesTotal.value === "number") {
			// Sumar solo las "otras sumas" al monto total con intereses
			const otrasSumasTotal = Object.entries(groupedResults)
				.filter(([group]) => group === "otrasSumas")
				.flatMap(([_, items]) => items)
				.reduce((sum, { value }) => {
					return sum + (typeof value === "number" ? value : 0);
				}, 0);

			return interesTotal.value + otrasSumasTotal;
		}

		// De lo contrario, calcular el total como siempre (sin intereses)
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

	const handleSaveCalculation = async () => {
		if (isSaved) return;

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
				date: moment().format("YYYY-MM-DD"),
				type: "Calculado" as const,
				classType: "laboral" as const,
				subClassType: "despido" as const,
				amount: total,
				interest: 0, // Los cálculos laborales no tienen interés por separado
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
				.filter(({ key }) => {
					// Ocultar montoTotalConIntereses en la sección de intereses
					if (title === "Intereses" && key === "montoTotalConIntereses") {
						return false;
					}
					return true;
				})
				.map(
					({ key, value }) => `
				<div class="row">
				<span class="label">${getLabelForKey(key)}:</span>
				<span class="value">${formatValue(key, value)}</span>
				</div>
			`,
				)
				.join("");

			// Calcular subtotal para secciones monetarias
			let subtotalRow = "";
			const sectionsWithSubtotal = ["Indemnización", "Liquidación Final", "Multas", "Intereses", "Otros Rubros"];
			if (sectionsWithSubtotal.includes(title)) {
				const filteredItems = items.filter(({ key }) => {
					// Ocultar montoTotalConIntereses en la sección de intereses
					if (title === "Intereses" && key === "montoTotalConIntereses") {
						return false;
					}
					return true;
				});

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
					subtotalRow = `
					<div class="row" style="border-top: 2px solid #ddd; background-color: #f8f8f8; font-weight: bold;">
					<span class="label">Subtotal:</span>
					<span class="value">${formatValue("subtotal", subtotal)}</span>
					</div>
					`;
				}
			}

			return `
				<div class="card">
				<div class="card-header">${title}</div>
				<div class="card-content">
					${rows}
					${subtotalRow}
				</div>
				</div>
			`;
		};

		const groupSections = [
			{ title: "Datos del Reclamo", data: groupedResults.reclamo },
			{ title: "Indemnización", data: groupedResults.indemnizacion },
			{ title: "Liquidación Final", data: groupedResults.liquidacion },
			{ title: "Otros Rubros", data: groupedResults.otrasSumas },
			{ title: "Multas", data: groupedResults.multas },
			{ title: "Intereses", data: groupedResults.intereses },
		];

		const cardsHtml = groupSections
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
						<span>${formatValue("total", total)}</span>
					</div>
					</div>
				</div>
				</body>
			</html>
			`;
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
