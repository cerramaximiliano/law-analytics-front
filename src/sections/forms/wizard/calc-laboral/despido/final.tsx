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
		formField: { reclamante, reclamado, fechaIngreso, fechaEgreso, remuneracion, otrasSumas, dias, isLiquidacion, isTopes, isMultas },
		values,
	} = props;

	const formFields: { [key: string]: { name: string; type: string; label: string } } = {
		reclamante,
		reclamado,
		fechaIngreso,
		fechaEgreso,
		remuneracion,
		otrasSumas,
		dias,
		isLiquidacion,
		isTopes,
		isMultas,
	};

	const helperIsLiquidacionField = useField(isLiquidacion.name)[2];
	const helperIsTopesField = useField(isTopes.name)[2];
	const helperIsMultasField = useField(isMultas.name)[2];
	const [displayedValues, setDisplayedValues] = useState<{ [type: string]: { key: string; value: any }[] }>({});

	// Agrupar valores por tipo
	const groupValuesByType = () => {
		const groupedValues: { [type: string]: { key: string; value: any }[] } = {};
		Object.entries(values).forEach(([key, value]) => {
			if (value && formFields[key]) {
				const type = formFields[key].type;
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

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos para la Liquidación
			</Typography>
			{Object.entries(displayedValues).map(([type, items], index) => (
				<Card key={index} variant="outlined" sx={{ mb: 2 }}>
					<CardContent sx={{ position: "relative" }}>
						{type !== "reclamo" && (
							<Tooltip title="Eliminar" sx={{ position: "absolute", top: 8, right: 8 }}>
								<IconButton color="error" onClick={() => handleDeleteType(type)}>
									<Trash />
								</IconButton>
							</Tooltip>
						)}
						<Typography variant="subtitle1" gutterBottom>
							{type === "reclamo" ? "Datos de Reclamo" : `Datos de ${type}`}
						</Typography>
						<List>
							{items.map(({ key, value }) => (
								<ListItem key={key} sx={{ py: 1, px: 0 }}>
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
