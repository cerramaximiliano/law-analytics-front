import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, List, ListItem, ListItemText, Typography, Tooltip, IconButton, Divider } from "@mui/material";
import { Trash } from "iconsax-react";
import { useField } from "formik";

interface Props {
	values: { [key: string]: any };
	formField: any;
}

const FinalStep: React.FC<Props> = (props) => {
	const {
		formField: {
			reclamante,
			reclamado,
			fechaIngreso,
			fechaEgreso,
			remuneracion,
			remuneracionTope,
			otrasSumas,
			dias,
			aplicarLey27742,
			isLiquidacion,
			isTopes,
			isMultas,
			aplicarIntereses,
			fechaInicialIntereses,
			fechaFinalIntereses,
			tasaIntereses,
			folderId,
			folderName,
		},
		values,
	} = props;

	const formFields: { [key: string]: { name: string; type: string; label: string } } = {
		reclamante,
		reclamado,
		fechaIngreso,
		fechaEgreso,
		remuneracion,
		remuneracionTope,
		otrasSumas,
		dias,
		aplicarLey27742,
		isLiquidacion,
		isTopes,
		isMultas,
		aplicarIntereses,
		fechaInicialIntereses,
		fechaFinalIntereses,
		tasaIntereses,
		folderId,
		folderName,
	};

	const helperIsLiquidacionField = useField(isLiquidacion.name)[2];
	const helperIsTopesField = useField(isTopes.name)[2];
	const helperIsMultasField = useField(isMultas.name)[2];
	const [displayedValues, setDisplayedValues] = useState<{ [type: string]: { key: string; value: any }[] }>({});

	// Verificar si el reclamo está vinculado a una causa
	const isCauseLinked = useMemo(() => {
		if (values[reclamante.name] && typeof values[reclamante.name] === "string") {
			return values[reclamante.name].startsWith("__CAUSA_VINCULADA__");
		}
		return false;
	}, [values, reclamante.name]);

	// Agrupar valores por tipo
	const groupValuesByType = () => {
		const groupedValues: { [type: string]: { key: string; value: any }[] } = {};

		// Campos que no se mostrarán en "Otros Conceptos"
		const camposExcluidosDeOtros = [folderId.name, folderName.name, "reclamo"];

		// Primero procesar los valores normales
		Object.entries(values).forEach(([key, value]) => {
			// Ignorar campos excluidos en "Otros Conceptos"
			if (camposExcluidosDeOtros.includes(key)) {
				return;
			}

			// Procesar otros campos solo si tienen valor y están definidos en formFields
			if ((value || value === 0 || value === true) && formFields[key]) {
				const type = formFields[key].type;

				// Para los campos de intereses, si aplicarIntereses es true, crear sección separada
				if (type === "intereses" && values[aplicarIntereses.name]) {
					// Solo procesar campos de intereses que no sean el toggle aplicarIntereses
					if (key !== aplicarIntereses.name) {
						if (!groupedValues["intereses"]) {
							groupedValues["intereses"] = [];
						}

						// Formatear valor de tasa de interés para mostrarlo de forma más amigable
						if (key === tasaIntereses.name) {
							const tasasLabels: { [key: string]: string } = {
								tasaPasivaBCRA: "Tasa Pasiva BCRA",
								acta2601: "Acta 2601",
								acta2630: "Acta 2630",
							};
							const formattedValue = tasasLabels[String(value)] || String(value);
							groupedValues["intereses"].push({ key, value: formattedValue });
						} else {
							groupedValues["intereses"].push({ key, value });
						}
					}
				}
				// Procesar campos normales
				else if (type !== "intereses") {
					if (!groupedValues[type]) {
						groupedValues[type] = [];
					}

					// Si es reclamante o reclamado y está vinculado a una causa, no los mostraremos
					// ya que mostraremos la carátula en su lugar
					if ((key === reclamante.name || key === reclamado.name) && isCauseLinked) {
						return;
					}

					groupedValues[type].push({ key, value });
				}
			}
		});

		// Añadir la carátula si hay una causa vinculada
		if (isCauseLinked && values[folderName.name]) {
			if (!groupedValues["reclamo"]) {
				groupedValues["reclamo"] = [];
			}
			// Agregar al principio de la lista para que aparezca primero
			groupedValues["reclamo"].unshift({
				key: "caratula",
				value: values[folderName.name],
			});
		}
		// Si no hay causa vinculada, asegurar que reclamante y reclamado estén incluidos
		else {
			if (!groupedValues["reclamo"]) {
				groupedValues["reclamo"] = [];
			}
			// Agregar reclamante y reclamado si no están ya incluidos
			if (values[reclamante.name] && !groupedValues["reclamo"].find((item) => item.key === reclamante.name)) {
				groupedValues["reclamo"].push({
					key: reclamante.name,
					value: values[reclamante.name],
				});
			}
			if (values[reclamado.name] && !groupedValues["reclamo"].find((item) => item.key === reclamado.name)) {
				groupedValues["reclamo"].push({
					key: reclamado.name,
					value: values[reclamado.name],
				});
			}
		}

		setDisplayedValues(groupedValues);
	};

	// Eliminar un tipo completo
	const handleDeleteType = (type: string) => {
		if (type === "liquidacion") {
			helperIsLiquidacionField.setValue(false);
		} else if (type === "topes") {
			helperIsTopesField.setValue(false);
		} else if (type === "multas") {
			helperIsMultasField.setValue(false);
		}
		const updatedValues = { ...displayedValues };
		delete updatedValues[type];
		setDisplayedValues(updatedValues);
	};

	// Inicializar los valores agrupados
	useEffect(() => {
		groupValuesByType();
	}, [values]);

	// Obtener el nombre del campo para mostrar
	const getFieldLabel = (key: string): string => {
		if (key === "caratula") return "Carátula:";
		return formFields[key]?.label || key;
	};

	// Ordenar los campos según el tipo de sección
	const getOrderedItems = (items: { key: string; value: any }[], type: string) => {
		if (type === "reclamo") {
			// Definir el orden para la sección "reclamo"
			const orderMap: Record<string, number> = {
				caratula: 0,
				reclamante: 1,
				reclamado: 2,
				fechaIngreso: 3,
				fechaEgreso: 4,
				remuneracion: 5,
				remuneracionTope: 6,
				otrasSumas: 7,
				dias: 8,
				incluirSAC: 9,
			};

			return [...items].sort((a, b) => {
				const orderA = orderMap[a.key] !== undefined ? orderMap[a.key] : 999;
				const orderB = orderMap[b.key] !== undefined ? orderMap[b.key] : 999;
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
			// Orden para la sección "intereses"
			const orderMap: Record<string, number> = {
				fechaInicialIntereses: 0,
				fechaFinalIntereses: 1,
				tasaIntereses: 2,
			};

			return [...items].sort((a, b) => {
				const orderA = orderMap[a.key] !== undefined ? orderMap[a.key] : 999;
				const orderB = orderMap[b.key] !== undefined ? orderMap[b.key] : 999;
				return orderA - orderB;
			});
		}

		return items;
	};

	const getSectionTitle = (type: string): string => {
		const titles: { [key: string]: string } = {
			reclamo: "Datos del Reclamo",
			indemnizacion: "Indemnización",
			liquidacion: "Liquidación Final",
			multas: "Multas",
			intereses: "Intereses",
		};
		return titles[type] || `Datos de ${type}`;
	};

	const calculateSectionSubtotal = (items: { key: string; value: any }[], type: string): number => {
		if (type === "reclamo" || type === "intereses") return 0;

		// Para liquidación e indemnización, sumar solo valores numéricos
		return items.reduce((sum, item) => {
			const numValue = typeof item.value === "number" ? item.value : parseFloat(item.value);
			return sum + (isNaN(numValue) ? 0 : numValue);
		}, 0);
	};

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos para la Liquidación
			</Typography>
			{Object.entries(displayedValues).map(([type, items], index) => {
				const subtotal = calculateSectionSubtotal(items, type);
				return (
					<Card key={index} variant="outlined" sx={{ mb: 2 }}>
						<CardContent sx={{ position: "relative" }}>
							{type !== "reclamo" && type !== "intereses" && (
								<Tooltip title="Eliminar" sx={{ position: "absolute", top: 8, right: 8 }}>
									<IconButton color="error" onClick={() => handleDeleteType(type)}>
										<Trash />
									</IconButton>
								</Tooltip>
							)}
							<Typography variant="subtitle1" gutterBottom>
								{getSectionTitle(type)}
							</Typography>
							<List>
								{getOrderedItems(items, type).map(({ key, value }) => (
									<ListItem key={key} sx={{ py: 1, px: 0 }}>
										<ListItemText primary={getFieldLabel(key)} secondary={value} />
									</ListItem>
								))}
								{/* Mostrar subtotal para liquidación e indemnización */}
								{(type === "liquidacion" || type === "indemnizacion") && subtotal > 0 && (
									<>
										<Divider sx={{ my: 1 }} />
										<ListItem sx={{ py: 1, px: 0 }}>
											<ListItemText
												primary={
													<Typography variant="subtitle2" fontWeight="bold">
														Subtotal:
													</Typography>
												}
												secondary={
													<Typography variant="body2" fontWeight="bold">
														${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
													</Typography>
												}
											/>
										</ListItem>
									</>
								)}
								{/* Mostrar subtotal para intereses si aplica */}
								{type === "intereses" && (
									<>
										<Divider sx={{ my: 1 }} />
										<ListItem sx={{ py: 1, px: 0 }}>
											<ListItemText primary="Monto de intereses:" secondary="[Calculado al procesar]" />
										</ListItem>
										<ListItem sx={{ py: 1, px: 0 }}>
											<ListItemText
												primary={
													<Typography variant="subtitle2" fontWeight="bold">
														Subtotal:
													</Typography>
												}
												secondary={
													<Typography variant="body2" fontWeight="bold">
														[Calculado al procesar]
													</Typography>
												}
											/>
										</ListItem>
									</>
								)}
							</List>
						</CardContent>
					</Card>
				);
			})}
		</>
	);
};

export default FinalStep;
