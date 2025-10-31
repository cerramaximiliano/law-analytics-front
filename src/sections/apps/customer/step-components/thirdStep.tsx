import React from "react";
import { Grid, Stack, InputLabel } from "@mui/material";
import data from "data/folder.json";
import InputField from "components/UI/InputField";
import SelectField from "components/UI/SelectField";
import PatternField from "components/UI/PatternField";

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

const ThirdStep = () => {
	return (
		<Grid container spacing={2} justifyContent="center">
			<Grid item xs={12} md={8}>
				<Grid container spacing={2}>
						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="nationality">Nacionalidad</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="nationality" name="nationality" placeholder="Ingrese una Nacionalidad" />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="document">Documento</InputLabel>
								<PatternField
									fullWidth
									mask="_"
									sx={customInputStyles}
									id="document"
									name="document"
									placeholder="Ingrese un documento de identidad"
									format={"##.###.###"}
								/>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="status">Estado Civil</InputLabel>
								<SelectField
									label="Seleccione el estado civil"
									data={data.estadoCivil}
									name="status"
									style={{ maxHeight: "39.91px" }}
								></SelectField>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="cuit">CUIT o CUIL</InputLabel>
								<PatternField
									fullWidth
									mask="_"
									sx={customInputStyles}
									id="cuit"
									name="cuit"
									placeholder="Ingrese un CUIT/CUIL"
									format={"##-########-#"}
								/>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="activity">Profesión/Oficio</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="activity" name="activity" placeholder="Ingrese una profesión" />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="company">Empresa</InputLabel>
								<InputField
									fullWidth
									sx={customInputStyles}
									id="company"
									name="company"
									placeholder="Ingrese una empresa/lugar de trabajo"
								/>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="fiscal">Condición Fiscal</InputLabel>
								<SelectField
									label="Seleccione la condición fiscal"
									data={data.condicionFiscal}
									name="fiscal"
									style={{ maxHeight: "39.91px" }}
								></SelectField>
							</Stack>
						</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};
export default ThirdStep;
