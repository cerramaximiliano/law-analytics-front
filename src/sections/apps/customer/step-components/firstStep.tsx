import React from "react";
import { Grid, Stack, InputLabel, Alert, TextField, Typography } from "@mui/material";
import { useFormikContext } from "formik";
import data from "data/folder.json";
import InputField from "components/UI/InputField";
import SelectField from "components/UI/SelectField";

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 39.91,
	},
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& input::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

interface FirstStepProps {
	isImportedFromPjn?: boolean;
}

// Helper para formatear role (puede ser string o array)
const formatRole = (role: string | string[] | undefined): string => {
	if (!role) return "No disponible";
	if (Array.isArray(role)) return role.join(", ");
	return role;
};

const FirstStep = ({ isImportedFromPjn = false }: FirstStepProps) => {
	const { values } = useFormikContext<{ role: string | string[] }>();
	return (
		<Grid container spacing={2} justifyContent="center">
			<Grid item xs={12} md={8}>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="name" required>
								Nombre
							</InputLabel>
							<InputField fullWidth sx={customInputStyles} id="name" name="name" placeholder="Ingrese un nombre" required />
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="lastName" required>
								Apellido
							</InputLabel>
							<InputField fullWidth sx={customInputStyles} id="lastName" placeholder="Ingrese un apellido" name="lastName" required />
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="role" required>
								Categoría
							</InputLabel>
							{isImportedFromPjn ? (
								<>
									<TextField
										fullWidth
										disabled
										value={formatRole(values.role)}
										sx={{
											...customInputStyles,
											"& .MuiInputBase-input.Mui-disabled": {
												WebkitTextFillColor: "rgba(0, 0, 0, 0.6)",
											},
										}}
									/>
									<Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
										<Typography variant="caption">
											El rol de este contacto fue importado desde PJN y no puede modificarse.
										</Typography>
									</Alert>
								</>
							) : (
								<SelectField
									label="Seleccione una categoría"
									data={data.categorias}
									name="role"
									style={{ maxHeight: "39.91px" }}
									required
								/>
							)}
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="type" required>
								Tipos
							</InputLabel>
							<SelectField label="Seleccione un tipo" data={data.tipos} name="type" style={{ maxHeight: "39.91px" }} required></SelectField>
						</Stack>
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};
export default FirstStep;
