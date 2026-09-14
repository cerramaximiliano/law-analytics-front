import React from "react";
import { useState, useEffect } from "react";
import { Box, Checkbox, Grid, InputLabel, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import LinkCauseSelector from "./components/LinkCauseSelector";
import { UserSquare, Calendar2, DocumentText } from "iconsax-react";
import { useFormikContext, useField } from "formik";
import { Folder } from "types/folders";
import { BRAND_BLUE } from "themes/dashboardTokens";

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
	folderId: {
		name: string;
	};
	folderName: {
		name: string;
	};
}

interface FirstFormProps {
	formField: FormField;
	folder?: any;
	onFolderChange?: (folderId: string | null) => void;
}

export default function FirstForm(props: FirstFormProps) {
	const {
		formField: { reclamado, reclamante, remuneracion, otrasSumas, fechaIngreso, fechaEgreso, dias, incluirSAC, folderId, folderName },
		folder,
		onFolderChange,
	} = props;

	const { setFieldValue } = useFormikContext();
	const [inputMethod, setInputMethod] = useState<"manual" | "causa">(folder ? "causa" : "manual");
	const [selectedFolder, setSelectedFolder] = useState<Folder | null>(folder || null);

	// Hooks para los checkboxes
	const [incluirSACField] = useField(incluirSAC.name);

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

			// Actualizar la URL con el nuevo folderId
			if (onFolderChange && folderData?.folderId) {
				onFolderChange(folderData.folderId);
			}
		} else if (method === "manual") {
			// Si se cambia a modo manual, limpiar los campos
			setFieldValue(reclamante.name, "");
			setFieldValue(reclamado.name, "");
			// Limpiar los campos de vinculación de carpeta
			setFieldValue(folderId.name, "");
			setFieldValue(folderName.name, "");

			// Limpiar la URL
			if (onFolderChange) {
				onFolderChange(null);
			}
		}
	};

	// Inicializar el formulario cuando hay un folder desde la URL
	useEffect(() => {
		if (folder && inputMethod === "causa") {
			handleMethodChange("causa", folder, {
				folderId: folder._id,
				folderName: folder.folderName,
			});
		}
	}, [folder]);

	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	return (
		<>
			<LinkCauseSelector requiereField={reclamante.name} requeridoField={reclamado.name} onMethodChange={handleMethodChange} />

			<Grid item xs={12}>
				<Grid container spacing={2} alignItems="center">
					{inputMethod === "causa" && selectedFolder ? (
						<Grid item xs={12} sx={{ mb: 2 }}>
							<Stack spacing={0.75}>
								<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
									Carpeta vinculada
								</Typography>
								<Box
									sx={{
										p: 1.5,
										borderRadius: 1.25,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
										display: "flex",
										alignItems: "center",
										gap: 1.25,
									}}
								>
									<Box
										sx={{
											width: 28,
											height: 28,
											borderRadius: 1,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
											color: BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										<DocumentText size={16} variant="Bulk" />
									</Box>
									<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
										<Typography sx={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
											{selectedFolder.folderName}
										</Typography>
										{selectedFolder.materia && (
											<Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{selectedFolder.materia}</Typography>
										)}
									</Stack>
								</Box>
							</Stack>
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
								<Checkbox checked={incluirSACField.value || false} onChange={incluirSACField.onChange} name={incluirSACField.name} />
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
}
