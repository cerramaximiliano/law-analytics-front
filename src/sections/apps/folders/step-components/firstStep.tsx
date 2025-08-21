import React from "react";
import { Grid, Stack, InputLabel, DialogContent } from "@mui/material";
import data from "data/folder.json";
import AsynchronousAutocomplete from "components/UI/AsynchronousAutocomplete";
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
const customTextareaStyles = {
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& textarea::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const FirstStep = () => {
	return (
		<DialogContent sx={{ p: 2.5 }}>
			<Grid container spacing={3} justifyContent="center">
				<Grid item xs={12} md={8}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="customer-folderName">Carátula</InputLabel>
								<InputField
									fullWidth
									sx={customInputStyles}
									id="customer-folderName"
									placeholder="Ingrese una carátula"
									name="folderName"
								/>
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="customer-orderStatus">Parte</InputLabel>
								<SelectField
									required={true}
									label="Seleccione una parte"
									data={data.parte}
									name="orderStatus"
									style={{ maxHeight: "39.91px" }}
								></SelectField>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="status">Estado</InputLabel>
								<SelectField label="Seleccione un estado" data={data.estado} name="status" style={{ maxHeight: "39.91px" }}></SelectField>
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="materia">Materia</InputLabel>
								<AsynchronousAutocomplete placeholder="Seleccione una materia" options={data.materia} name="materia" />
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="description">Descripción</InputLabel>
								<InputField
									fullWidth
									sx={customTextareaStyles}
									id="description"
									multiline
									rows={2}
									placeholder="Ingrese una descripción"
									name="description"
								/>
							</Stack>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</DialogContent>
	);
};
export default FirstStep;
