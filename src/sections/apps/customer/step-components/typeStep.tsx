import React from "react";
import {
	Grid,
	Stack,
	InputLabel,
	Alert,
	TextField,
	Typography,
	FormControlLabel,
	Switch,
	RadioGroup,
	FormControl,
	Radio,
} from "@mui/material";
import { useFormikContext } from "formik";
import data from "data/folder.json";
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

interface TypeStepProps {
	isImportedFromPjn?: boolean;
}

const formatRole = (role: string | string[] | undefined): string => {
	if (!role) return "No disponible";
	if (Array.isArray(role)) return role.join(", ");
	return role;
};

const TypeStep = ({ isImportedFromPjn = false }: TypeStepProps) => {
	const { values, setFieldValue } = useFormikContext<{ role: string | string[]; representado: boolean; tipoRepresentacion: string }>();

	return (
		<Grid container spacing={2} justifyContent="center">
			<Grid item xs={12} md={8}>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="type" required>
								Tipo
							</InputLabel>
							<SelectField label="Seleccione un tipo" data={data.tipos} name="type" style={{ maxHeight: "39.91px" }} required />
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
										<Typography variant="caption">El rol de este contacto fue importado desde PJN y no puede modificarse.</Typography>
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

					{/* Representación */}
					{!isImportedFromPjn && (
						<>
							<Grid item xs={12}>
								<Stack spacing={0.5}>
									<InputLabel>Representación</InputLabel>
									<FormControlLabel
										control={
											<Switch
												checked={!!values.representado}
												onChange={(e) => {
													setFieldValue("representado", e.target.checked);
													if (!e.target.checked) setFieldValue("tipoRepresentacion", "");
												}}
												size="small"
											/>
										}
										label={
											<Typography variant="body2" color="text.secondary">
												¿Lo/la representás?
											</Typography>
										}
									/>
								</Stack>
							</Grid>

							{values.representado && (
								<Grid item xs={12}>
									<Stack spacing={1}>
										<InputLabel required>¿En carácter de?</InputLabel>
										<FormControl>
											<RadioGroup
												row
												value={values.tipoRepresentacion || ""}
												onChange={(e) => setFieldValue("tipoRepresentacion", e.target.value)}
											>
												<FormControlLabel
													value="Patrocinante"
													control={<Radio size="small" />}
													label={<Typography variant="body2">Patrocinante</Typography>}
												/>
												<FormControlLabel
													value="Apoderado"
													control={<Radio size="small" />}
													label={<Typography variant="body2">Apoderado</Typography>}
												/>
											</RadioGroup>
										</FormControl>
									</Stack>
								</Grid>
							)}
						</>
					)}
				</Grid>
			</Grid>
		</Grid>
	);
};

export default TypeStep;
