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

const SecondStep = () => {
	return (
		<DialogContent sx={{ p: 2.5 }}>
			<Grid container spacing={3} justifyContent="center">
				<Grid item xs={12} md={8}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="address">Domicilio</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="address" name="address" placeholder="Ingrese un domicilio" />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="state">Provincia</InputLabel>
								<SelectField
									label="Seleccione una provincia"
									data={data.provincias}
									name="state"
									style={{ maxHeight: "39.91px" }}
								></SelectField>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="city">Localidad</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="city" name="city" placeholder="Ingrese una localidad" />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="zipCode">Código Postal</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="zipCode" name="zipCode" placeholder="Ingrese un Código Postal" />
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="email">Email</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="email" name="email" placeholder="Ingrese un Email" />
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="phone">Teléfono</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="phone" name="phone" placeholder="Ingrese un Teléfono" />
							</Stack>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</DialogContent>
	);
};
export default SecondStep;
