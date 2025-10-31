import React from "react";
import { Grid, Stack, InputLabel, DialogContent } from "@mui/material";
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

const FirstStep = () => {
	return (
		<DialogContent sx={{ p: 0 }}>
			<Grid container spacing={2} justifyContent="center">
				<Grid item xs={12} md={8}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="name" required sx={{ fontSize: 13 }}>
									Nombre
								</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="name" name="name" placeholder="Ingrese un nombre" required />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="lastName" required sx={{ fontSize: 13 }}>
									Apellido
								</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="lastName" placeholder="Ingrese un apellido" name="lastName" required />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="role" required sx={{ fontSize: 13 }}>
									Categoría
								</InputLabel>
								<SelectField
									label="Seleccione una categoría"
									data={data.categorias}
									name="role"
									style={{ maxHeight: "39.91px" }}
									required
								></SelectField>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="type" required sx={{ fontSize: 13 }}>
									Tipos
								</InputLabel>
								<SelectField
									label="Seleccione un tipo"
									data={data.tipos}
									name="type"
									style={{ maxHeight: "39.91px" }}
									required
								></SelectField>
							</Stack>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</DialogContent>
	);
};
export default FirstStep;
