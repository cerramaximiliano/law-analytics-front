import React from "react";
import { Grid, Stack, InputLabel, DialogContent } from "@mui/material";
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
		<DialogContent sx={{ p: 0 }}>
			<Grid container spacing={2} justifyContent="center">
				<Grid item xs={12} md={8}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="nationality" sx={{ fontSize: 13 }}>
									Nacionalidad
								</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="nationality" name="nationality" placeholder="Ingrese una Nacionalidad" />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="document" sx={{ fontSize: 13 }}>
									Documento
								</InputLabel>
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
							<Stack spacing={0.75}>
								<InputLabel htmlFor="status" sx={{ fontSize: 13 }}>
									Estado Civil
								</InputLabel>
								<SelectField
									label="Seleccione el estado civil"
									data={data.estadoCivil}
									name="status"
									style={{ maxHeight: "39.91px" }}
								></SelectField>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="cuit" sx={{ fontSize: 13 }}>
									CUIT o CUIL
								</InputLabel>
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
							<Stack spacing={0.75}>
								<InputLabel htmlFor="activity" sx={{ fontSize: 13 }}>
									Profesión/Oficio
								</InputLabel>
								<InputField fullWidth sx={customInputStyles} id="activity" name="activity" placeholder="Ingrese una profesión" />
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="company" sx={{ fontSize: 13 }}>
									Empresa
								</InputLabel>
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
							<Stack spacing={0.75}>
								<InputLabel htmlFor="fiscal" sx={{ fontSize: 13 }}>
									Condición Fiscal
								</InputLabel>
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
		</DialogContent>
	);
};
export default ThirdStep;
