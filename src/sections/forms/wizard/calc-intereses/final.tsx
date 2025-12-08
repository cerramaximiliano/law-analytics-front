import React from "react";
/* import React, { useState, useEffect } from "react"; */
import { Card, CardContent, List, Typography, ListItem, ListItemText } from "@mui/material";
/* import { Trash } from "iconsax-react";
import { useField } from "formik"; */

interface Props {
	values: { [key: string]: any };
	formField: any;
}

// Campos que no deben mostrarse o que son objetos/arrays
const HIDDEN_FIELDS = [
	"folderId",
	"segments",
	"capitalizeInterest",
	"calculatedInterest",
	"calculatedAmount",
	"tasasResult",
	"interesTotal",
	"capitalActualizado",
];

// Función para formatear valores complejos
const formatValue = (field: string, value: any): string => {
	if (value === null || value === undefined) return "";

	// Si es un array o objeto, no mostrarlo directamente
	if (typeof value === "object") {
		return "";
	}

	// Si es un número, formatearlo como moneda si es un campo de dinero
	if (typeof value === "number") {
		if (field.toLowerCase().includes("capital") || field.toLowerCase().includes("monto") || field.toLowerCase().includes("interes")) {
			return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
		}
		return value.toString();
	}

	// Si es booleano
	if (typeof value === "boolean") {
		return value ? "Sí" : "No";
	}

	return String(value);
};

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

		// Agregar el resto de los campos, excepto los ocultos
		Object.keys(values).forEach((field) => {
			// No mostrar campos ocultos
			if (HIDDEN_FIELDS.includes(field) || field === "folderName") {
				return;
			}

			// Si hay folderName, no mostrar reclamante ni reclamado
			if (values.folderName && (field === "reclamante" || field === "reclamado")) {
				return;
			}

			// Solo agregar reclamante y reclamado si tienen valores válidos
			if ((field === "reclamante" || field === "reclamado") && (!values[field] || String(values[field]).includes("__CAUSA_VINCULADA__"))) {
				return;
			}

			// No mostrar objetos o arrays
			if (typeof values[field] === "object" && values[field] !== null) {
				return;
			}

			// Agregar el resto de los campos si tienen valor
			if (values[field] !== "" && values[field] !== null && values[field] !== undefined) {
				orderedFields.push(field);
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
								<ListItemText primary={formField[field]?.label || field} secondary={formatValue(field, values[field])} />
							</ListItem>
						</List>
					))}
				</CardContent>
			</Card>
		</>
	);
};
export default FinalStep;
