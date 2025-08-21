import React from "react";
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
	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos para la Liquidación
			</Typography>
			<Card variant="outlined" sx={{ mb: 2 }}>
				<CardContent sx={{ position: "relative" }}>
					<Typography variant="subtitle1" gutterBottom>
						Datos de Reclamo
					</Typography>
					{Object.keys(values).map(
						(item, index) =>
							values[item] && (
								<List key={index}>
									<ListItem key={index} sx={{ py: 1, px: 0 }}>
										<ListItemText primary={formField[item].label} secondary={values[item]} />
									</ListItem>
								</List>
							),
					)}
				</CardContent>
			</Card>
		</>
	);
};
export default FinalStep;
