import React from "react";
import { useState, useEffect } from "react";
import { Box, Grid, InputLabel, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import LinkCauseSelector from "./components/LinkCauseSelector";
import { useFormikContext } from "formik";
import { UserSquare, DocumentText } from "iconsax-react";
import { Folder } from "types/folders";

interface FormField {
	reclamante: {
		name: string;
	};
	reclamado: {
		name: string;
	};
	compensacion: {
		name: string;
	};
	probabilidadPunitivos: {
		name: string;
	};
	probabilidadDsPs: {
		name: string;
	};
	nivelPrecaucion: {
		name: string;
	};
	porcentajeMin: {
		name: string;
	};
	probOcurrencia: {
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
		formField: {
			reclamante,
			reclamado,
			compensacion,
			probabilidadPunitivos,
			probabilidadDsPs,
			nivelPrecaucion,
			porcentajeMin,
			probOcurrencia,
			folderId,
			folderName,
		},
		folder,
		onFolderChange,
	} = props;

	const { setFieldValue } = useFormikContext();
	const [inputMethod, setInputMethod] = useState<"manual" | "causa">(folder ? "causa" : "manual");
	const [selectedFolder, setSelectedFolder] = useState<Folder | null>(folder || null);

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
								Carpeta vinculada:
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
										<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Reclamante:</InputLabel>
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
										<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Reclamado:</InputLabel>
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Compensación por daños y perjuicios*</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={compensacion.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Probabilidad de condena por daños y perjuicios*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probabilidadDsPs.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Probabilidad de condena por daños punitivos*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probabilidadPunitivos.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Nivel de precaución socialmente deseable*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique una cuantía"
									name={nivelPrecaucion.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Porcentaje mínimo de nivel de precaución*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={porcentajeMin.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Probabilidad de ocurrencia del daño*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probOcurrencia.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
}
