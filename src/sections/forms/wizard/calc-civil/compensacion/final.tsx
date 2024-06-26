import React, { useState, useEffect } from "react";
import { Card, CardContent, List, ListItem, ListItemText, Typography, Tooltip, IconButton } from "@mui/material";
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
			tasaDescuentoAnual,
			edadDisolucion,
			edadLimite,
			cantIngresosMensuales,
			probCapacitacion,
			ingresoMax,
			probIngresoMax,
			ingresoReal,
			probIngresoReal,
			isPatrimonio,
			patrimonioInicialReclamado,
			patrimonioInicialReclamante,
			patrimonioFinalReclamado,
			patrimonioFinalReclamante,
			isVivienda,
			cantMesesAtribucionVivienda,
			porcentajeInmuebleOCanon,
			valorCanon,
			cantidadHijos,
			cantidadOtrosFamiliares,
		},
		values,
	} = props;

	const formFields: { [key: string]: { name: string; type: string; label: string } } = {
		reclamante,
		reclamado,
		tasaDescuentoAnual,
		edadDisolucion,
		edadLimite,
		cantIngresosMensuales,
		probCapacitacion,
		ingresoMax,
		probIngresoMax,
		ingresoReal,
		probIngresoReal,
		isPatrimonio,
		patrimonioInicialReclamado,
		patrimonioInicialReclamante,
		patrimonioFinalReclamado,
		patrimonioFinalReclamante,
		isVivienda,
		cantMesesAtribucionVivienda,
		porcentajeInmuebleOCanon,
		valorCanon,
		cantidadHijos,
		cantidadOtrosFamiliares,
	};

	const helperIsPatrimonioField = useField(isPatrimonio.name)[2];
	const helperIsViviendaField = useField(isVivienda.name)[2];

	const [displayedValues, setDisplayedValues] = useState<{ [type: string]: { key: string; value: any }[] }>({});
	// Agrupar valores por tipo
	const groupValuesByType = () => {
		const groupedValues: { [type: string]: { key: string; value: any }[] } = {};
		Object.entries(values).forEach(([key, value]) => {
			if (value && formFields[key]) {
				const type = formFields[key].type;
				if ((type === "patrimonio" && !values.isPatrimonio) || (type === "vivienda" && !values.isVivienda)) {
					return;
				}
				if (!groupedValues[type]) {
					groupedValues[type] = [];
				}
				groupedValues[type].push({ key, value });
			}
		});
		setDisplayedValues(groupedValues);
	};

	// Eliminar un tipo completo
	const handleDeleteType = (type: string) => {
		if (type === "patrimonio") {
			helperIsPatrimonioField.setValue(false);
		} else if (type === "topes") {
			helperIsViviendaField.setValue(false);
		}
		const updatedValues = { ...displayedValues };
		delete updatedValues[type];
		setDisplayedValues(updatedValues);
	};

	// Inicializar los valores agrupados
	useEffect(() => {
		groupValuesByType();
	}, [values]);
	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos para la Liquidación
			</Typography>
			{Object.entries(displayedValues).map(([type, items], index) => (
				<Card key={index} variant="outlined" sx={{ mb: 2 }}>
					<CardContent sx={{ position: "relative" }}>
						{type !== "reclamo" && (
							<Tooltip title="Delete" sx={{ position: "absolute", top: 8, right: 8 }}>
								<IconButton color="error" onClick={() => handleDeleteType(type)}>
									<Trash />
								</IconButton>
							</Tooltip>
						)}
						<Typography variant="subtitle1" gutterBottom>
							{type === "reclamo" ? "Datos de Reclamo" : `Datos de ${type}`}
						</Typography>
						<List>
							{items.map(({ key, value }, index) => (
								<ListItem key={index} sx={{ py: 1, px: 0 }}>
									<ListItemText primary={formFields[key].label} secondary={value} />
								</ListItem>
							))}
						</List>
					</CardContent>
				</Card>
			))}
		</>
	);
};
export default FinalStep;
