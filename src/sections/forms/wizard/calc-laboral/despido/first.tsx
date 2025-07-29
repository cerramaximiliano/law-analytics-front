import { useState } from "react";
import { Box, Checkbox, Grid, InputLabel, Typography } from "@mui/material";
import DateInputField from "components/UI/DateInputField";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import { useFormikContext, useField } from "formik";
import { UserSquare, Calendar2, DocumentText } from "iconsax-react";
import LinkCauseSelector from "./components/LinkCauseSelector";
import { Folder } from "types/folders";

interface FormField {
	reclamante: {
		name: string;
	};
	reclamado: {
		name: string;
	};
	remuneracion: {
		name: string;
	};
	otrasSumas: {
		name: string;
	};
	fechaIngreso: {
		name: string;
	};
	fechaEgreso: {
		name: string;
	};
	dias: {
		name: string;
	};
	incluirSAC: {
		name: string;
	};
	aplicarLey27742: {
		name: string;
	};
	folderId: {
		name: string;
	};
	folderName: {
		name: string;
	};
}

interface FirstFormProps {
	formField: FormField;
}

export default function FirstForm(props: FirstFormProps) {
	const {
		formField: { reclamado, reclamante, remuneracion, otrasSumas, fechaIngreso, fechaEgreso, dias, aplicarLey27742, folderId, folderName },
	} = props;

	const { setFieldValue } = useFormikContext();
	const [inputMethod, setInputMethod] = useState<"manual" | "causa">("manual");
	const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

	// Hooks para los checkboxes
	const [incluirSACField] = useField("incluirSAC");
	const [aplicarLey27742Field] = useField(aplicarLey27742.name);

	const handleMethodChange = (method: "manual" | "causa", folder: any, folderData?: { folderId: string; folderName: string }) => {
		setInputMethod(method);
		setSelectedFolder(folder);

		if (method === "causa" && folder) {
			// Si se ha seleccionado una causa, establecer los valores de reclamante/reclamado como
			// campos especiales para indicar que se está utilizando una causa vinculada
			setFieldValue(reclamante.name, `__CAUSA_VINCULADA__${folder._id}`);
			setFieldValue(reclamado.name, `__CAUSA_VINCULADA__${folder._id}`);

			// Almacenar folderId y folderName para guardarlos en la base de datos
			if (folderData) {
				setFieldValue(folderId.name, folderData.folderId);
				setFieldValue(folderName.name, folderData.folderName);
			}
		} else if (method === "manual") {
			// Si se cambia a modo manual, limpiar los campos
			setFieldValue(reclamante.name, "");
			setFieldValue(reclamado.name, "");
			// Limpiar los campos de vinculación de carpeta
			setFieldValue(folderId.name, "");
			setFieldValue(folderName.name, "");
		}
	};

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos requeridos
			</Typography>

			<LinkCauseSelector requiereField={reclamante.name} requeridoField={reclamado.name} onMethodChange={handleMethodChange} />

			<Grid item xs={12}>
				<Grid container spacing={2} alignItems="center">
					{inputMethod === "causa" && selectedFolder ? (
						<Grid item xs={12} sx={{ mb: 2 }}>
							<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
								Causa vinculada:
							</Typography>
							<Box
								sx={{
									p: 2,
									borderRadius: 1,
									bgcolor: (theme) => theme.palette.background.paper,
									border: (theme) => `1px solid ${theme.palette.divider}`,
									display: "flex",
									alignItems: "center",
									gap: 2,
								}}
							>
								<DocumentText size={20} variant="Bold" />
								<Typography variant="body1" fontWeight={500}>
									{selectedFolder.folderName}
								</Typography>
								{selectedFolder.materia && (
									<Typography variant="body2" sx={{ ml: 1, color: "text.secondary" }}>
										({selectedFolder.materia})
									</Typography>
								)}
							</Box>
						</Grid>
					) : (
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Remuneración*</InputLabel>
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
								<Checkbox checked={incluirSACField.value || false} onChange={incluirSACField.onChange} name={incluirSACField.name} />
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Aplicar Ley 27.742:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<Checkbox
									checked={aplicarLey27742Field.value || false}
									onChange={aplicarLey27742Field.onChange}
									name={aplicarLey27742Field.name}
								/>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
}
