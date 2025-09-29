import React from "react";
import { useState, useRef, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Stack,
	Typography,
	Alert,
	InputLabel,
	Grid,
	MenuItem,
	Select,
	FormControl,
	SelectChangeEvent,
	Box,
	Divider,
	TextField,
	Checkbox,
	FormControlLabel,
	CircularProgress,
} from "@mui/material";
import { PopupTransition } from "components/@extended/Transitions";
import { DocumentUpload } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { enqueueSnackbar } from "notistack";
import { dispatch } from "store";
import { linkFolderToPJBA } from "store/reducers/folder";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";
import mevWorkersService, { NavigationCode } from "api/workersMev";

interface LinkToPJBuenosAiresProps {
	open: boolean;
	onCancel: () => void;
	onBack?: () => void;
	folderId: string;
	folderName: string;
}

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

const LinkToPJBuenosAires = ({ open, onCancel, onBack, folderId, folderName }: LinkToPJBuenosAiresProps) => {
	const theme = useTheme();
	const [expedientNumber, setExpedientNumber] = useState("");
	const [expedientYear, setExpedientYear] = useState("");
	const [jurisdiction, setJurisdiction] = useState("");
	const [organismo, setOrganismo] = useState("");
	const [navigationCodes, setNavigationCodes] = useState<NavigationCode[]>([]);
	const [loadingCodes, setLoadingCodes] = useState(false);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [yearError, setYearError] = useState("");
	const [numberError, setNumberError] = useState("");
	const [jurisdictionError, setJurisdictionError] = useState("");
	const [organismoError, setOrganismoError] = useState("");
	const [error, setError] = useState("");
	const [overwriteData, setOverwriteData] = useState(true);
	const [touched, setTouched] = useState({
		jurisdiction: false,
		organismo: false,
		expedientNumber: false,
		expedientYear: false,
	});

	// Referencia para detectar el intento de envío
	const formSubmitAttempted = useRef<boolean>(false);

	// Obtener jurisdicciones únicas de los códigos de navegación
	const jurisdictions = React.useMemo(() => {
		const uniqueJurisdictions = new Map();
		navigationCodes.forEach((code) => {
			if (!uniqueJurisdictions.has(code.jurisdiccion.codigo)) {
				uniqueJurisdictions.set(code.jurisdiccion.codigo, code.jurisdiccion);
			}
		});
		return Array.from(uniqueJurisdictions.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
	}, [navigationCodes]);

	// Filtrar organismos basados en la jurisdicción seleccionada
	const organismos = React.useMemo(() => {
		if (!jurisdiction) return [];
		return navigationCodes
			.filter((code) => code.jurisdiccion.codigo === jurisdiction)
			.sort((a, b) => a.organismo.nombre.localeCompare(b.organismo.nombre));
	}, [jurisdiction, navigationCodes]);

	// Cargar códigos de navegación y resetear estado cuando se abre el modal
	useEffect(() => {
		if (open) {
			console.log("Modal opened, resetting state and loading navigation codes");
			// Resetear todos los estados cuando se abre el modal
			setExpedientNumber("");
			setExpedientYear("");
			setJurisdiction("");
			setOrganismo("");
			setError("");
			setYearError("");
			setNumberError("");
			setJurisdictionError("");
			setOrganismoError("");
			setSuccess(false);
			setOverwriteData(true);
			formSubmitAttempted.current = false;
			setTouched({
				jurisdiction: false,
				organismo: false,
				expedientNumber: false,
				expedientYear: false,
			});
			// Cargar los códigos de navegación
			loadNavigationCodes();
		}
	}, [open]);

	const loadNavigationCodes = async () => {
		setLoadingCodes(true);
		setError("");
		try {
			const response = await mevWorkersService.getNavigationCodes();
			console.log("API Response:", response);
			console.log("Response data:", response.data);
			console.log("Response data codes:", response.data?.codes);

			if (response.success && response.data?.codes) {
				// Filtrar solo los códigos activos
				const activeCodes = response.data.codes.filter((code) => code.activo);
				console.log("Total codes:", response.data.codes.length);
				console.log("Active codes:", activeCodes.length);
				console.log("Sample active code:", activeCodes[0]);
				setNavigationCodes(activeCodes);

				if (activeCodes.length === 0) {
					setError("No hay organismos judiciales disponibles en este momento");
				}
			} else {
				console.log("Response structure issue - success:", response.success, "has codes:", !!response.data?.codes);
				setError("No se pudieron cargar los organismos judiciales");
			}
		} catch (err: any) {
			console.error("Error loading navigation codes:", err);
			const errorMessage = err.message || "Error al cargar los organismos judiciales";
			setError(errorMessage);

			// Solo mostrar snackbar si no es un error de autenticación (ya se muestra en el modal)
			if (!errorMessage.includes("autenticación")) {
				enqueueSnackbar(errorMessage, {
					variant: "error",
					anchorOrigin: { vertical: "top", horizontal: "right" },
				});
			}
		} finally {
			setLoadingCodes(false);
		}
	};

	// Función para validar el año
	const validateYear = (year: string) => {
		if (!year || year.trim() === "") {
			setYearError("El año es requerido");
			return false;
		}

		const currentYear = new Date().getFullYear();
		const yearNumber = parseInt(year);

		// Verificamos que tenga 4 dígitos
		if (year.length !== 4) {
			setYearError("El año debe tener 4 dígitos");
			return false;
		}

		// Verificamos que esté en el rango correcto
		if (yearNumber < 2000 || yearNumber > currentYear) {
			setYearError(`El año debe estar entre 2000 y ${currentYear}`);
			return false;
		}

		setYearError("");
		return true;
	};

	// Validar el número de expediente
	const validateExpedientNumber = (number: string) => {
		if (!number || number.trim() === "") {
			setNumberError("El número de expediente es requerido");
			return false;
		}
		setNumberError("");
		return true;
	};

	// Validar la jurisdicción
	const validateJurisdiction = (jurisdictionValue: any) => {
		console.log("validateJurisdiction called with:", jurisdictionValue, "type:", typeof jurisdictionValue);

		// Verificar si realmente tiene un valor válido
		const hasValue = jurisdictionValue !== undefined &&
						jurisdictionValue !== null &&
						jurisdictionValue !== "" &&
						jurisdictionValue !== "undefined" &&
						jurisdictionValue !== "null";

		if (!hasValue) {
			console.log("Jurisdiction validation failed - empty or invalid value");
			setJurisdictionError("Debe seleccionar una jurisdicción");
			return false;
		}

		console.log("Jurisdiction validation passed for value:", jurisdictionValue);
		setJurisdictionError("");
		return true;
	};

	// Validar el organismo
	const validateOrganismo = (organismoValue: any) => {
		console.log("validateOrganismo called with:", organismoValue, "type:", typeof organismoValue);

		// Verificar si realmente tiene un valor válido
		const hasValue = organismoValue !== undefined &&
						organismoValue !== null &&
						organismoValue !== "" &&
						organismoValue !== "undefined" &&
						organismoValue !== "null";

		if (!hasValue) {
			console.log("Organismo validation failed - empty or invalid value");
			setOrganismoError("Debe seleccionar un organismo");
			return false;
		}

		console.log("Organismo validation passed for value:", organismoValue);
		setOrganismoError("");
		return true;
	};

	// Validar todos los campos
	const validateAllFields = () => {
		console.log("Validating all fields:");
		console.log("jurisdiction value:", jurisdiction, "type:", typeof jurisdiction);
		console.log("organismo value:", organismo, "type:", typeof organismo);
		console.log("expedientNumber:", expedientNumber);
		console.log("expedientYear:", expedientYear);

		const isJurisdictionValid = validateJurisdiction(jurisdiction);
		const isOrganismoValid = validateOrganismo(organismo);
		const isNumberValid = validateExpedientNumber(expedientNumber);
		const isYearValid = validateYear(expedientYear);

		console.log("Validation results:");
		console.log("jurisdiction valid:", isJurisdictionValid);
		console.log("organismo valid:", isOrganismoValid);
		console.log("number valid:", isNumberValid);
		console.log("year valid:", isYearValid);

		setTouched({
			jurisdiction: true,
			organismo: true,
			expedientNumber: true,
			expedientYear: true,
		});

		return isJurisdictionValid && isOrganismoValid && isNumberValid && isYearValid;
	};

	const handleSubmit = async () => {
		formSubmitAttempted.current = true;

		if (!validateAllFields()) {
			return;
		}

		setLoading(true);
		setError("");

		try {
			// Obtener el código de navegación seleccionado
			const selectedCode = navigationCodes.find((code) => code._id === organismo);

			if (!selectedCode) {
				setError("Error: No se encontró el organismo seleccionado");
				setLoading(false);
				return;
			}

			// Llamar a la acción del store para vincular la causa
			const result = await dispatch(
				linkFolderToPJBA(folderId, {
					number: expedientNumber,
					year: expedientYear,
					navigationCode: selectedCode.code,
					overwrite: overwriteData,
				}),
			);

			if (result.success) {
				setLoading(false);
				setSuccess(true);

				// Usar el mensaje del servidor o generar uno basado en el estado
				let message = result.message || "Causa vinculada exitosamente con el Poder Judicial de Buenos Aires";

				// Si queremos personalizar según el estado (opcional)
				if (result.causaInfo) {
					const { associationStatus, verified } = result.causaInfo;

					if (associationStatus === "success" && verified) {
						message = message || "Folder vinculado exitosamente a causa MEV verificada";
					} else if (associationStatus === "pending") {
						message = message || "Causa MEV vinculada. Pendiente de verificación en el sistema judicial.";
					}
				}

				// Mostrar notificación de éxito
				enqueueSnackbar(message, {
					variant: "success",
					anchorOrigin: { vertical: "top", horizontal: "right" },
				});

				// Esperar un momento antes de cerrar
				setTimeout(() => {
					onCancel();
				}, 1500);
			} else {
				setError(result.message || "Error al vincular la causa. Por favor intente nuevamente.");
				setLoading(false);
			}
		} catch (err) {
			setError("Error inesperado al vincular la causa. Por favor intente nuevamente.");
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (!loading) {
			setExpedientNumber("");
			setExpedientYear("");
			setJurisdiction("");
			setOrganismo("");
			setError("");
			setYearError("");
			setNumberError("");
			setJurisdictionError("");
			setOrganismoError("");
			setSuccess(false);
			setOverwriteData(true);
			formSubmitAttempted.current = false;
			setTouched({
				jurisdiction: false,
				organismo: false,
				expedientNumber: false,
				expedientYear: false,
			});
			onCancel();
		}
	};

	const handleBack = () => {
		if (!loading && onBack) {
			// Limpiar estados antes de volver
			setExpedientNumber("");
			setExpedientYear("");
			setJurisdiction("");
			setOrganismo("");
			setError("");
			setYearError("");
			setNumberError("");
			setJurisdictionError("");
			setOrganismoError("");
			setSuccess(false);
			setOverwriteData(true);
			formSubmitAttempted.current = false;
			setTouched({
				jurisdiction: false,
				organismo: false,
				expedientNumber: false,
				expedientYear: false,
			});
			// Cerrar este modal y volver al anterior
			onCancel();
			onBack();
		}
	};

	// Manejar cambio en el campo de año
	const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setExpedientYear(value);
		setTouched({ ...touched, expedientYear: true });
		if (touched.expedientYear || formSubmitAttempted.current) {
			validateYear(value);
		}
	};

	// Manejar cambio en el campo de jurisdicción
	const handleJurisdictionChange = (e: SelectChangeEvent) => {
		const value = e.target.value as string;
		console.log("handleJurisdictionChange - Selected value:", value, "type:", typeof value);
		setJurisdiction(value);
		setOrganismo(""); // Resetear el organismo cuando cambia la jurisdicción
		setTouched({ ...touched, jurisdiction: true });
		if (touched.jurisdiction || formSubmitAttempted.current) {
			validateJurisdiction(value);
		}
	};

	// Manejar cambio en el campo de organismo
	const handleOrganismoChange = (e: SelectChangeEvent) => {
		const value = e.target.value as string;
		setOrganismo(value);
		setTouched({ ...touched, organismo: true });
		if (touched.organismo || formSubmitAttempted.current) {
			validateOrganismo(value);
		}
	};

	// Manejar cambio en el campo de número de expediente
	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setExpedientNumber(value);
		setTouched({ ...touched, expedientNumber: true });
		if (touched.expedientNumber || formSubmitAttempted.current) {
			validateExpedientNumber(value);
		}
	};

	// Validar cuando se envía el formulario
	useEffect(() => {
		if (formSubmitAttempted.current) {
			validateJurisdiction(jurisdiction);
			validateOrganismo(organismo);
			validateExpedientNumber(expedientNumber);
			validateYear(expedientYear);
		}
	}, [jurisdiction, organismo, expedientNumber, expedientYear]);

	// Escuchar evento de restricción del plan
	useEffect(() => {
		const handlePlanRestriction = (_event: Event) => {
			// Cerrar el modal inmediatamente
			onCancel();

			// Importante: Detener cualquier solicitud pendiente o efecto secundario
			setLoading(false);
			setLoadingCodes(false);
		};

		// Agregar listener para el evento personalizado
		window.addEventListener("planRestrictionError", handlePlanRestriction);

		// Limpieza al desmontar
		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
		};
	}, [onCancel]);

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			TransitionComponent={PopupTransition}
			maxWidth="sm"
			fullWidth
			sx={{ "& .MuiDialog-paper": { p: 0 } }}
		>
			<DialogTitle sx={{ p: 3, pb: 2 }}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<DocumentUpload size={24} color={theme.palette.primary.main} />
					<Typography variant="h5">Vincular con Poder Judicial de Buenos Aires</Typography>
				</Stack>
			</DialogTitle>

			<Divider />

			<DialogContent sx={{ p: 3 }}>
				<Grid container spacing={3}>
					{/* Logo del Poder Judicial de Buenos Aires */}
					<Grid item xs={12}>
						<Box
							sx={{
								backgroundColor: "#f8f8f8",
								borderRadius: 2,
								p: 2,
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								height: 100,
								mb: 2,
							}}
						>
							<img
								src={logoPJBuenosAires}
								alt="Poder Judicial de Buenos Aires"
								style={{
									maxHeight: "100%",
									maxWidth: "100%",
									objectFit: "contain",
								}}
							/>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={0.5}>
							<Typography variant="body2" color="textSecondary">
								Causa a vincular:
							</Typography>
							<Typography variant="h6" color="primary">
								{folderName}
							</Typography>
						</Stack>
					</Grid>

					{error && (
						<Grid item xs={12}>
							<Alert severity="error" onClose={() => setError("")}>
								{error}
							</Alert>
						</Grid>
					)}

					{success && (
						<Grid item xs={12}>
							<Alert severity="success">Vinculación exitosa. Los datos de la causa se actualizarán automáticamente.</Alert>
						</Grid>
					)}

					{loadingCodes ? (
						<Grid item xs={12}>
							<Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
								<CircularProgress />
							</Box>
						</Grid>
					) : (
						<>
							<Grid item xs={12}>
								<Alert severity="info">La causa debe ser de acceso público en el sistema del Poder Judicial.</Alert>
							</Grid>

							{/* Jurisdicción */}
							<Grid item xs={12}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="jurisdiction">Jurisdicción</InputLabel>
									<FormControl fullWidth error={Boolean(jurisdictionError && (touched.jurisdiction || formSubmitAttempted.current))}>
										<Select
											id="jurisdiction"
											name="jurisdiction"
											value={jurisdiction}
											onChange={handleJurisdictionChange}
											displayEmpty
											size="small"
											disabled={loading || navigationCodes.length === 0}
											renderValue={(selected) => {
												console.log("renderValue - selected:", selected, "type:", typeof selected);
												if (!selected || selected === "") {
													return <em>Seleccione una jurisdicción</em>;
												}
												const selectedJurisdiction = jurisdictions.find((j) => j.codigo === selected);
												console.log("Found jurisdiction:", selectedJurisdiction);
												return selectedJurisdiction ? selectedJurisdiction.nombre : selected;
											}}
											sx={{
												"& .MuiInputBase-root": { height: 39.91 },
												"& .MuiInputBase-input": { fontSize: 12 },
											}}
										>
											<MenuItem value="" disabled>
												<em>Seleccione una jurisdicción</em>
											</MenuItem>
											{jurisdictions.map((jurisdiccion) => (
												<MenuItem key={jurisdiccion.codigo} value={jurisdiccion.codigo}>
													{jurisdiccion.nombre}
												</MenuItem>
											))}
										</Select>
										{jurisdictionError && (touched.jurisdiction || formSubmitAttempted.current) && (
											<Typography color="error" variant="caption" sx={{ mt: 0.5, display: "block" }}>
												{jurisdictionError}
											</Typography>
										)}
									</FormControl>
								</Stack>
							</Grid>

							{/* Organismo */}
							<Grid item xs={12}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="organismo">Organismo</InputLabel>
									<FormControl fullWidth error={Boolean(organismoError && (touched.organismo || formSubmitAttempted.current))}>
										<Select
											id="organismo"
											name="organismo"
											value={organismo}
											onChange={handleOrganismoChange}
											displayEmpty
											size="small"
											disabled={loading || !jurisdiction}
											renderValue={(selected) => {
												if (!selected) {
													return <em>{jurisdiction ? "Seleccione un organismo" : "Seleccione primero una jurisdicción"}</em>;
												}
												const selectedOrganismo = navigationCodes.find((c) => c._id === selected);
												return selectedOrganismo ? selectedOrganismo.organismo.nombre : "";
											}}
											sx={{
												"& .MuiInputBase-root": { height: 39.91 },
												"& .MuiInputBase-input": { fontSize: 12 },
											}}
										>
											<MenuItem value="" disabled>
												<em>Seleccione un organismo</em>
											</MenuItem>
											{organismos.map((code) => (
												<MenuItem key={code._id} value={code._id}>
													{code.organismo.nombre}
												</MenuItem>
											))}
										</Select>
										{organismoError && (touched.organismo || formSubmitAttempted.current) && (
											<Typography color="error" variant="caption" sx={{ mt: 0.5, display: "block" }}>
												{organismoError}
											</Typography>
										)}
									</FormControl>
								</Stack>
							</Grid>

							{/* Número de Expediente y Año */}
							<Grid item xs={12} sm={6}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="expedientNumber">Número de Expediente</InputLabel>
									<TextField
										fullWidth
										sx={customInputStyles}
										id="expedient-number"
										placeholder="Ej. 123456"
										name="expedientNumber"
										type="number"
										value={expedientNumber}
										onChange={handleNumberChange}
										disabled={loading}
										error={Boolean(numberError && (touched.expedientNumber || formSubmitAttempted.current))}
										helperText={touched.expedientNumber || formSubmitAttempted.current ? numberError : ""}
										size="small"
									/>
								</Stack>
							</Grid>

							<Grid item xs={12} sm={6}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="expedientYear">Año</InputLabel>
									<TextField
										fullWidth
										sx={customInputStyles}
										id="expedient-year"
										placeholder="Ej. 2024"
										name="expedientYear"
										type="number"
										value={expedientYear}
										onChange={handleYearChange}
										disabled={loading}
										error={Boolean(yearError && (touched.expedientYear || formSubmitAttempted.current))}
										helperText={touched.expedientYear || formSubmitAttempted.current ? yearError : ""}
										size="small"
									/>
								</Stack>
							</Grid>

							<Grid item xs={12}>
								<FormControlLabel
									control={<Checkbox checked={overwriteData} onChange={(e) => setOverwriteData(e.target.checked)} color="primary" />}
									label={
										<Typography variant="body2">
											Sobrescribir datos actuales de la causa (carátula, juzgado y número de expediente) con los datos obtenidos del Poder
											Judicial
										</Typography>
									}
								/>
							</Grid>

							<Grid item xs={12}>
								<Alert severity="warning">
									Al vincular esta causa, se descargará y actualizará automáticamente la información desde el sistema del Poder Judicial de
									Buenos Aires.
								</Alert>
							</Grid>
						</>
					)}
				</Grid>
			</DialogContent>

			<Divider />

			<DialogActions sx={{ p: 2.5 }}>
				{onBack && (
					<Button onClick={handleBack} disabled={loading} color="inherit">
						Atrás
					</Button>
				)}
				<Button onClick={handleClose} disabled={loading} color="inherit">
					Cancelar
				</Button>
				<Button variant="contained" onClick={handleSubmit} disabled={loading || loadingCodes || navigationCodes.length === 0}>
					{loading ? "Vinculando..." : "Vincular Causa"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default LinkToPJBuenosAires;
