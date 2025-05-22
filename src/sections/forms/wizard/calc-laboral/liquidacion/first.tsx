import { Checkbox, Grid, InputLabel, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import LinkCauseSelector from "../components/LinkCauseSelector";
import { UserSquare, Calendar2 } from "iconsax-react";
import { useField } from "formik";

export default function FirstForm(props: any) {
	const {
		formField: { reclamado, reclamante, remuneracion, otrasSumas, fechaIngreso, fechaEgreso, dias, incluirSAC, folderId, folderName },
	} = props;

	// Usar useField para acceder a los valores de Formik
	const [reclamanteField] = useField(reclamante.name);
	const [incluirSACField] = useField(incluirSAC.name);

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos requeridos
			</Typography>
			
			{/* Selector de vinculación de causa */}
			<Grid item xs={12} sx={{ mb: 3 }}>
				<LinkCauseSelector 
					reclamanteField={reclamante}
					reclamadoField={reclamado}
					folderIdField={folderId}
					folderNameField={folderName}
				/>
			</Grid>

			<Grid item xs={12}>
				<Grid container spacing={2} alignItems="center">
					{/* Solo mostrar campos manuales si no hay carpeta vinculada */}
					{(!reclamanteField.value || !reclamanteField.value.startsWith("__CAUSA_VINCULADA__")) && (
						<>
							<Grid item xs={12} lg={6}>
								<Grid container spacing={2} alignItems="center">
									<Grid item xs={12} lg={3}>
										<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Reclamante*:</InputLabel>
									</Grid>
									<Grid item xs={12} lg={9}>
										<InputField
											InputProps={{ startAdornment: <UserSquare /> }}
											fullWidth
											placeholder="Ingrese un nombre"
											name={reclamante.name}
										/>
									</Grid>
								</Grid>
							</Grid>
							<Grid item xs={12} lg={6}>
								<Grid container spacing={2} alignItems="center">
									<Grid item xs={12} lg={3}>
										<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Reclamado*:</InputLabel>
									</Grid>
									<Grid item xs={12} lg={9}>
										<InputField
											InputProps={{ startAdornment: <UserSquare /> }}
											fullWidth
											placeholder="Ingrese un nombre"
											name={reclamado.name}
										/>
									</Grid>
								</Grid>
							</Grid>
						</>
					)}
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Fecha de ingreso*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<DateInputField name={fechaIngreso.name} />
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Fecha de egreso*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<DateInputField name={fechaEgreso.name} />
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Remuneración*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={remuneracion.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Otras sumas adeudadas:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={otrasSumas.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Días no trabajados:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									decimalScale={0}
									fullWidth
									placeholder="Ingrese un valor numérico mayor a 0"
									name={dias.name}
									InputProps={{ startAdornment: <Calendar2 /> }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Incluir SAC:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<Checkbox 
									checked={incluirSACField.value || false}
									onChange={incluirSACField.onChange}
									name={incluirSACField.name}
								/>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
}
