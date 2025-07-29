/* import React, { useState, useEffect } from "react"; */
import { Card, CardContent, List, Typography, ListItem, ListItemText } from "@mui/material";
/* import { Trash } from "iconsax-react";
import { useField } from "formik"; */

interface Props {
	values: { [key: string]: any };
	formField: any;
}

const FinalStep: React.FC<Props> = (props) => {
	const { values, formField } = props;

	// Determinar el orden personalizado de los campos
	const getOrderedFields = () => {
		// Lista ordenada de campos (los primeros tienen más prioridad)
		const orderedFields = [];

		// Si existe folderName, debe aparecer primero
		if (values.folderName) {
			orderedFields.push("folderName");
		}

		// Agregar el resto de los campos, excepto folderId
		Object.keys(values).forEach((field) => {
			// No mostrar el folderId
			if (field !== "folderId" && field !== "folderName") {
				// Si hay folderName, no mostrar reclamante ni reclamado
				if (values.folderName && (field === "reclamante" || field === "reclamado")) {
					return;
				}

				// Solo agregar reclamante y reclamado si tienen valores
				if ((field === "reclamante" || field === "reclamado") && (!values[field] || values[field] === "CAUSA_VINCULADA")) {
					return;
				}

				// Agregar el resto de los campos si tienen valor
				if (values[field]) {
					orderedFields.push(field);
				}
			}
		});

		return orderedFields;
	};

	const orderedFields = getOrderedFields();

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos para la Liquidación
			</Typography>
			<Card variant="outlined" sx={{ mb: 2 }}>
				<CardContent sx={{ position: "relative" }}>
					<Typography variant="subtitle1" gutterBottom>
						Datos para la Liquidación
					</Typography>
					{orderedFields.map((field, index) => (
						<List key={index}>
							<ListItem key={index} sx={{ py: 1, px: 0 }}>
								<ListItemText primary={formField[field]?.label} secondary={values[field]} />
							</ListItem>
						</List>
					))}
				</CardContent>
			</Card>
		</>
	);
};
export default FinalStep;
