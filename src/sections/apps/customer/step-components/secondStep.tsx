import React, { useEffect } from "react";
import { Grid, Stack, InputLabel } from "@mui/material";
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

const SecondStep = () => {
	const { values, setFieldValue } = useFormikContext<{ state: string; city: string }>();
	const isCaba = values.state === "CABA";

	useEffect(() => {
		if (isCaba) {
			setFieldValue("city", "CABA");
		}
	}, [isCaba, setFieldValue]);

	return (
		<Grid container spacing={2} justifyContent="center">
			<Grid item xs={12} md={8}>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="address">Domicilio</InputLabel>
							<InputField fullWidth sx={customInputStyles} id="address" name="address" placeholder="Ingrese un domicilio" />
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="state" required>
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
						<Stack spacing={1}>
							<InputLabel htmlFor="city" required>
								Localidad
							</InputLabel>
							<InputField
								fullWidth
								sx={customInputStyles}
								id="city"
								name="city"
								placeholder="Ingrese una localidad"
								required
								disabled={isCaba}
							/>
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="zipCode">Código Postal</InputLabel>
							<InputField fullWidth sx={customInputStyles} id="zipCode" name="zipCode" placeholder="Ingrese un Código Postal" />
						</Stack>
					</Grid>
					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="email">Email</InputLabel>
							<InputField fullWidth sx={customInputStyles} id="email" name="email" placeholder="Ingrese un Email" />
						</Stack>
					</Grid>
					<Grid item xs={12}>
						<Stack spacing={1}>
							<InputLabel htmlFor="phone">Teléfono</InputLabel>
							<InputField fullWidth sx={customInputStyles} id="phone" name="phone" placeholder="Ingrese un Teléfono" />
						</Stack>
					</Grid>

					<Grid item xs={4}>
						<Stack spacing={1}>
							<InputLabel htmlFor="phoneCodArea">
								Cód. área celular
							</InputLabel>
							<InputField
								fullWidth
								sx={customInputStyles}
								id="phoneCodArea"
								name="phoneCodArea"
								placeholder="11, 351, 341..."
								inputProps={{ maxLength: 4 }}
							/>
						</Stack>
					</Grid>
					<Grid item xs={8}>
						<Stack spacing={1}>
							<InputLabel htmlFor="phoneCelular">
								Celular (sin 15)
							</InputLabel>
							<InputField
								fullWidth
								sx={customInputStyles}
								id="phoneCelular"
								name="phoneCelular"
								placeholder="55554444"
								inputProps={{ maxLength: 8 }}
							/>
						</Stack>
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};
export default SecondStep;
