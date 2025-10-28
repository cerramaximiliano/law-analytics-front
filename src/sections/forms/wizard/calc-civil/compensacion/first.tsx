import React from "react";
import { useState, useEffect } from "react";
import { Box, Grid, InputLabel, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import LinkCauseSelector from "./components/LinkCauseSelector";
import { useFormikContext } from "formik";
import { Calendar, UserSquare, DocumentText } from "iconsax-react";
import { Folder } from "types/folders";

interface FormField {
	reclamante: {
		name: string;
	};
	reclamado: {
		name: string;
	};
	tasaDescuentoAnual: {
		name: string;
	};
	edadDisolucion: {
		name: string;
	};
	edadLimite: {
		name: string;
	};
	cantIngresosMensuales: {
		name: string;
	};
	probCapacitacion: {
		name: string;
	};
	ingresoMax: {
		name: string;
	};
	probIngresoMax: {
		name: string;
	};
	ingresoReal: {
		name: string;
	};
	probIngresoReal: {
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
			tasaDescuentoAnual,
			edadDisolucion,
			edadLimite,
			cantIngresosMensuales,
			probCapacitacion,
			ingresoMax,
			probIngresoMax,
			ingresoReal,
			probIngresoReal,
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Tasa de descuento anual*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={tasaDescuentoAnual.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Edad al momento de disolución del vínculo*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={0}
									fullWidth
									placeholder="Indique una edad"
									name={edadDisolucion.name}
									InputProps={{ startAdornment: <Calendar /> }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
									Edad límite hasta el cual se calculan los ingresos*:
								</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={0}
									fullWidth
									placeholder="Indique una edad"
									name={edadLimite.name}
									InputProps={{ startAdornment: <Calendar /> }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Cantidad de ingresos mensuales por año:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								{/* Aca va un select */}
								<InputField
									fullWidth
									placeholder="Indique una monto"
									name={cantIngresosMensuales.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
									Probabilidad de capacitación de no haberse iniciado el vínculo conyugal*:
								</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={0}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probCapacitacion.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Ingreso máximo para capacitación frustrada*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={ingresoMax.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Probabilidad de acceder al máximo ingreso*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probIngresoMax.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Ingreso real actual sin capacitación*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={ingresoReal.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
									Probabilidad de acceder o mantener el ingreso real*:
								</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probIngresoReal.name}
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
