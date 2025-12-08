import React from "react";
import { Grid, InputLabel, Typography, Divider, Box, alpha, useTheme, Alert } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import "dayjs/locale/es";
import { UserSquare, DocumentText } from "iconsax-react";
import { useEffect, useState, useCallback } from "react";
import { useFormikContext } from "formik";
import { actualizarRangoFechasTasa } from "./formModel/tasasFechasStore";
import LinkCauseSelector from "./components/LinkCauseSelector";
import { useSelector, dispatch } from "store";
import { getInterestRates } from "store/reducers/interestRates";
import InterestSegmentsManager, { InterestSegment, InterestRate } from "components/calculator/InterestSegmentsManager";

interface FormField {
	reclamante: {
		name: string;
	};
	reclamado: {
		name: string;
	};
	tasa: {
		name: string;
	};
	capital: {
		name: string;
	};
	fechaInicial: {
		name: string;
	};
	fechaFinal: {
		name: string;
	};
	segments: {
		name: string;
	};
	capitalizeInterest: {
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
		formField: { reclamante, reclamado, capital, segments, capitalizeInterest },
		folder,
		onFolderChange,
	} = props;

	const [inputMethod, setInputMethod] = useState<"manual" | "causa">(folder ? "causa" : "manual");
	const [selectedFolder, setSelectedFolder] = useState<any>(folder || null);

	// Obtener datos del store
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;
	const { rates: tasasOpciones, isLoading: cargandoTasas, isInitialized } = useSelector((state) => state.interestRates);

	const theme = useTheme();

	// Obtenemos el valor actual del formulario para detectar cambios
	const { values, setFieldValue, errors, touched, submitCount } = useFormikContext<any>();

	// Manejador para el cambio de método de entrada
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
				// Guardar estos valores en campos ocultos o estado del formulario
				// para que estén disponibles al guardar
				setFieldValue("folderId", folderData.folderId);
				setFieldValue("folderName", folderData.folderName);
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
			setFieldValue("folderId", "");
			setFieldValue("folderName", "");

			// Limpiar la URL
			if (onFolderChange) {
				onFolderChange(null);
			}
		}
	};

	// Cargar tasas del store
	useEffect(() => {
		if (userId && !isInitialized) {
			dispatch(getInterestRates(userId));
		}
	}, [userId, isInitialized]);

	// Inicializar el formulario cuando hay un folder desde la URL
	useEffect(() => {
		if (folder && inputMethod === "causa") {
			handleMethodChange("causa", folder, {
				folderId: folder._id,
				folderName: folder.folderName,
			});
		}
	}, [folder]);

	// Actualizar el mapa global de rangos de fechas cuando se cargan las tasas
	useEffect(() => {
		tasasOpciones.forEach((tasa) => {
			actualizarRangoFechasTasa(tasa.value, tasa.fechaInicio, tasa.fechaUltima);
		});
	}, [tasasOpciones]);

	// Handlers para InterestSegmentsManager
	const handleSegmentsChange = useCallback(
		(newSegments: InterestSegment[]) => {
			setFieldValue(segments.name, newSegments);

			// Actualizar fechaInicial y fechaFinal basado en los tramos
			if (newSegments.length > 0) {
				setFieldValue("fechaInicial", newSegments[0].startDate);
				setFieldValue("fechaFinal", newSegments[newSegments.length - 1].endDate);
				// Usar la tasa del primer tramo para compatibilidad
				setFieldValue("tasa", newSegments[0].rate);
			}
		},
		[setFieldValue, segments.name],
	);

	const handleCapitalizeChange = useCallback(
		(capitalize: boolean) => {
			setFieldValue(capitalizeInterest.name, capitalize);
		},
		[setFieldValue, capitalizeInterest.name],
	);

	const handleTotalChange = useCallback(
		(total: { interest: number; amount: number }) => {
			// Guardar los totales calculados para usarlos en el submit
			setFieldValue("calculatedInterest", total.interest);
			setFieldValue("calculatedAmount", total.amount);
		},
		[setFieldValue],
	);

	// Convertir tasas al formato esperado por InterestSegmentsManager
	const availableRates: InterestRate[] = tasasOpciones.map((tasa) => ({
		label: tasa.label,
		value: tasa.value,
		fechaInicio: tasa.fechaInicio,
		fechaUltima: tasa.fechaUltima,
	}));

	// Obtener el capital como número
	const capitalValue = typeof values[capital.name] === "string" ? parseFloat(values[capital.name]) || 0 : values[capital.name] || 0;

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos requeridos
			</Typography>

			{/* Selector de método de entrada */}
			<LinkCauseSelector requiereField={reclamante.name} requeridoField={reclamado.name} onMethodChange={handleMethodChange} />

			<Divider sx={{ my: 3 }} />

			<Grid container spacing={2} alignItems="center">
				{/* Sección reclamante/reclamado o causa vinculada */}
				{inputMethod === "causa" && selectedFolder ? (
					<Grid item xs={12}>
						<Box sx={{ mb: 2 }}>
							<Typography variant="subtitle1" color="primary" gutterBottom>
								Carpeta vinculada
							</Typography>
							<Box
								sx={{
									p: 2,
									bgcolor: alpha(theme.palette.primary.main, 0.08),
									borderRadius: 1,
									border: `1px solid ${theme.palette.primary.main}`,
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

				{/* Campo de capital */}
				<Grid item xs={12} lg={6}>
					<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} lg={3}>
							<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Capital*:</InputLabel>
						</Grid>
						<Grid item xs={12} lg={9}>
							<NumberField
								thousandSeparator={","}
								allowNegative={false}
								allowLeadingZeros={false}
								decimalScale={2}
								fullWidth
								placeholder="00.00"
								name={capital.name}
								InputProps={{ startAdornment: "$" }}
								disabled={(values[segments.name] || []).length > 0}
							/>
							{(values[segments.name] || []).length > 0 && (
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
									Elimine los tramos para modificar el capital
								</Typography>
							)}
						</Grid>
					</Grid>
				</Grid>
			</Grid>

			{/* Sección de tramos de intereses */}
			<Divider sx={{ my: 3 }} />

			<InterestSegmentsManager
				capital={capitalValue}
				segments={values[segments.name] || []}
				onSegmentsChange={handleSegmentsChange}
				availableRates={availableRates}
				disabled={cargandoTasas || capitalValue <= 0}
				capitalizeInterest={values[capitalizeInterest.name] || false}
				onCapitalizeChange={handleCapitalizeChange}
				onTotalChange={handleTotalChange}
			/>

			{capitalValue <= 0 && (
				<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
					Ingrese un capital para poder agregar tramos de intereses
				</Typography>
			)}

			{/* Mostrar error de validación de segments */}
			{errors[segments.name] && (touched[segments.name] || submitCount > 0) && (
				<Alert severity="error" sx={{ mt: 2 }}>
					{errors[segments.name] as string}
				</Alert>
			)}
		</>
	);
}
