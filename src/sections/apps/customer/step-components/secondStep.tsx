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
		<DialogContent sx={{ p: 0 }}>
			<Grid container spacing={2} justifyContent="center">
				<Grid item xs={12} md={8}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="address" sx={{ fontSize: 13 }}>
									Domicilio
								</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="address" name="address" placeholder="Ingrese un domicilio" />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="state" required sx={{ fontSize: 13 }}>
									Provincia
								</InputLabel>
								<SelectField
									label="Seleccione una provincia"
									data={data.provincias}
									name="state"
									style={{ maxHeight: "39.91px" }}
									required
								></SelectField>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="city" required sx={{ fontSize: 13 }}>
									Localidad
								</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="city" name="city" placeholder="Ingrese una localidad" required />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="zipCode" sx={{ fontSize: 13 }}>
									Código Postal
								</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="zipCode" name="zipCode" placeholder="Ingrese un Código Postal" />
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="email" sx={{ fontSize: 13 }}>
									Email
								</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="email" name="email" placeholder="Ingrese un Email" />
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="phone" sx={{ fontSize: 13 }}>
									Teléfono
								</InputLabel>
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
