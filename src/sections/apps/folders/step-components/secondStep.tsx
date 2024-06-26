import { Grid, Stack, InputLabel, DialogContent } from "@mui/material";
import data from "data/folder.json";
import GroupedAutocomplete from "components/UI/GroupedAutocomplete";
import SelectField from "components/UI/SelectField";
import DateInputField from "components/UI/DateInputField";

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
const SecondStep = ({ values }: any) => {
	return (
		<DialogContent sx={{ p: 2.5 }}>
			<Grid container spacing={3} justifyContent="center">
				<Grid item xs={12} md={8}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="folderJuris">Jurisdicción</InputLabel>
								<GroupedAutocomplete name="folderJuris" data={data.jurisdicciones} placeholder="Seleccione una jurisdicción" />
							</Stack>
						</Grid>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="initialDateFolder">Fecha de Inicio</InputLabel>
								<DateInputField name="initialDateFolder" customInputStyles={customInputStyles} />
								{/* <InputField fullWidth sx={customInputStyles} id="folder-date" placeholder="DD/MM/YYYY" name="initialDateFolder" /> */}
							</Stack>
						</Grid>
						{values.status === "Finalizada" && (
							<Grid item xs={12}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="finalDateFolder">Fecha de Fin</InputLabel>
									<DateInputField name="finalDateFolder" customInputStyles={customInputStyles} />
									{/* <InputField fullWidth sx={customInputStyles} id="folder-date" placeholder="DD/MM/YYYY" name="finalDateFolder" /> */}
								</Stack>
							</Grid>
						)}
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="folderFuero">Fuero</InputLabel>
								<SelectField label="Seleccione el fuero" style={{ maxHeight: "39.91px" }} name="folderFuero" data={data.fuero} />
							</Stack>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</DialogContent>
	);
};
export default SecondStep;
