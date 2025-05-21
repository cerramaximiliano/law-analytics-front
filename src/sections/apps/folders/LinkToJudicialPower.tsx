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
	IconButton,
	InputLabel,
	Grid,
	MenuItem,
	Select,
	FormControl,
	SelectChangeEvent,
	Box,
	Divider,
	TextField,
	ListItemButton,
	ListItemText,
	ListItemIcon,
	alpha,
	Chip,
} from "@mui/material";
import { PopupTransition } from "components/@extended/Transitions";
import { Add, DocumentUpload, ArrowRight, Lock } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { enqueueSnackbar } from "notistack";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";

interface LinkToJudicialPowerProps {
	openLink: boolean;
	onCancelLink: () => void;
	folderId: string;
	folderName: string;
}

// Lista de jurisdicciones del Poder Judicial de la Nación
const jurisdicciones = [
	{
		value: "",
		nombre: "Seleccione una jurisdicción",
	},
	{
		value: "1",
		nombre: "CIV - Cámara Nacional de Apelaciones en lo Civil",
	},
	{
		value: "5",
		nombre: "CSS - Camara Federal de la Seguridad Social",
	},
	{
		value: "7",
		nombre: "CNT - Cámara Nacional de Apelaciones del Trabajo",
	},
];

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

const LinkToJudicialPower = ({ openLink, onCancelLink, folderId, folderName }: LinkToJudicialPowerProps) => {
	const theme = useTheme();
	const [selectedPower, setSelectedPower] = useState<"nacional" | "buenosaires" | null>(null);
	const [expedientNumber, setExpedientNumber] = useState("");
	const [expedientYear, setExpedientYear] = useState("");
	const [jurisdiction, setJurisdiction] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [yearError, setYearError] = useState("");
	const [jurisdictionError, setJurisdictionError] = useState("");
	const [numberError, setNumberError] = useState("");
	const [error, setError] = useState("");
	const [touched, setTouched] = useState({
		jurisdiction: false,
		expedientNumber: false,
		expedientYear: false,
	});

	// Referencia para detectar el intento de envío
	const formSubmitAttempted = useRef<boolean>(false);

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
	const validateJurisdiction = (jurisdictionValue: string) => {
		if (!jurisdictionValue || jurisdictionValue === "") {
			setJurisdictionError("Debe seleccionar una jurisdicción");
			return false;
		}
		setJurisdictionError("");
		return true;
	};

	// Validar todos los campos
	const validateAllFields = () => {
		const isJurisdictionValid = validateJurisdiction(jurisdiction);
		const isNumberValid = validateExpedientNumber(expedientNumber);
		const isYearValid = validateYear(expedientYear);

		setTouched({
			jurisdiction: true,
			expedientNumber: true,
			expedientYear: true,
		});

		return isJurisdictionValid && isNumberValid && isYearValid;
	};

	const handleSubmit = async () => {
		formSubmitAttempted.current = true;

		if (!validateAllFields()) {
			return;
		}

		setLoading(true);
		setError("");

		try {
			// TODO: Implementar llamada al servicio externo del Poder Judicial
			console.log("Vinculando causa:", {
				folderId,
				folderName,
				expedientNumber,
				expedientYear,
				jurisdiction,
			});

			// Simulación de llamada exitosa
			setTimeout(() => {
				setLoading(false);
				setSuccess(true);

				// Mostrar notificación de éxito
				enqueueSnackbar("Causa vinculada exitosamente con el Poder Judicial de la Nación", {
					variant: "success",
					anchorOrigin: { vertical: "top", horizontal: "right" },
				});

				// Esperar un momento antes de cerrar
				setTimeout(() => {
					onCancelLink();
				}, 1500);
			}, 2000);
		} catch (err) {
			setError("Error al vincular la causa. Por favor intente nuevamente.");
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (!loading) {
			setExpedientNumber("");
			setExpedientYear("");
			setJurisdiction("");
			setError("");
			setYearError("");
			setNumberError("");
			setJurisdictionError("");
			setSuccess(false);
			formSubmitAttempted.current = false;
			setTouched({
				jurisdiction: false,
				expedientNumber: false,
				expedientYear: false,
			});
			setSelectedPower(null);
			onCancelLink();
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
		setJurisdiction(value);
		setTouched({ ...touched, jurisdiction: true });
		if (touched.jurisdiction || formSubmitAttempted.current) {
			validateJurisdiction(value);
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
			validateExpedientNumber(expedientNumber);
			validateYear(expedientYear);
		}
	}, [jurisdiction, expedientNumber, expedientYear]);

	// Escuchar evento de restricción del plan
	useEffect(() => {
		const handlePlanRestriction = (event: Event) => {
			const customEvent = event as CustomEvent;
			console.log(
				"Restricción de plan detectada, cerrando modal de vinculación",
				customEvent.detail ? `(Modales activos: ${customEvent.detail.openDialogsCount || 0})` : "",
			);

			// Cerrar el modal inmediatamente
			onCancelLink();

			// Importante: Detener cualquier solicitud pendiente o efecto secundario
			setLoading(false);
		};

		// Agregar listener para el evento personalizado
		window.addEventListener("planRestrictionError", handlePlanRestriction);

		// Limpieza al desmontar
		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
		};
	}, [onCancelLink]);

	// Ya no es necesario verificar la característica aquí,
	// ahora lo hacemos desde el componente padre mediante useSubscription

	return (
		<Dialog
			open={openLink}
			onClose={handleClose}
			TransitionComponent={PopupTransition}
			maxWidth="sm"
			fullWidth
			sx={{ "& .MuiDialog-paper": { p: 0 } }}
		>
			{selectedPower === null ? (
				// Vista de selección del poder judicial
				<>
					<DialogTitle sx={{ p: 3, pb: 2 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Stack direction="row" alignItems="center" spacing={1}>
								<DocumentUpload size={24} color={theme.palette.primary.main} />
								<Typography variant="h5">Vincular con Poder Judicial</Typography>
							</Stack>
							<IconButton color="secondary" onClick={handleClose} sx={{ p: 0 }}>
								<Add style={{ transform: "rotate(45deg)" }} />
							</IconButton>
						</Stack>
					</DialogTitle>

					<Divider />

					<DialogContent sx={{ p: 3 }}>
						<Grid container spacing={3}>
							<Grid item xs={12}>
								<Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
									Seleccione el poder judicial con el que desea vincular esta causa:
								</Typography>
							</Grid>

							{/* Opción Poder Judicial de la Nación */}
							<Grid item xs={12}>
								<ListItemButton
									onClick={() => setSelectedPower("nacional")}
									sx={{
										border: 1,
										borderColor: "divider",
										borderRadius: 2,
										p: 2,
										"&:hover": {
											backgroundColor: alpha(theme.palette.primary.main, 0.08),
											borderColor: theme.palette.primary.main,
										},
									}}
								>
									<ListItemIcon sx={{ minWidth: 80 }}>
										<Box
											sx={{
												backgroundColor: "#222E43",
												borderRadius: 1,
												p: 1,
												width: 60,
												height: 60,
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
											}}
										>
											<img
												src="https://res.cloudinary.com/dqyoeolib/image/upload/v1746884259/xndhymcmzv3kk0f62v0y.png"
												alt="Poder Judicial de la Nación"
												style={{
													maxHeight: "100%",
													maxWidth: "100%",
													objectFit: "contain",
												}}
											/>
										</Box>
									</ListItemIcon>
									<ListItemText
										primary="Poder Judicial de la Nación"
										secondary="Acceda a causas federales y nacionales"
										primaryTypographyProps={{ fontWeight: 600 }}
									/>
									<ArrowRight size={24} color={theme.palette.text.secondary} />
								</ListItemButton>
							</Grid>

							{/* Opción Poder Judicial de Buenos Aires */}
							<Grid item xs={12}>
								<ListItemButton
									onClick={() => {
										// No hacer nada, solo mostrar el candado y el chip
									}}
									sx={{
										border: 1,
										borderColor: "divider",
										borderRadius: 2,
										p: 2,
										cursor: "pointer",
										"&:hover": {
											backgroundColor: alpha(theme.palette.primary.main, 0.05),
											borderColor: theme.palette.primary.main,
										},
									}}
								>
									<ListItemIcon sx={{ minWidth: 80 }}>
										<Box
											sx={{
												backgroundColor: "#f8f8f8",
												borderRadius: 1,
												p: 1,
												width: 60,
												height: 60,
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
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
									</ListItemIcon>
									<Box sx={{ flexGrow: 1 }}>
										<Stack direction="row" alignItems="center" spacing={1}>
											<Typography variant="body1" fontWeight={600}>
												Poder Judicial de la Provincia de Buenos Aires
											</Typography>
											<Chip label="Próximamente" size="small" color="primary" variant="outlined" />
										</Stack>
										<Typography variant="body2" color="text.secondary">
											Vincule causas del fuero provincial
										</Typography>
									</Box>
									<Lock size={24} color={theme.palette.primary.main} />
								</ListItemButton>
							</Grid>
						</Grid>
					</DialogContent>

					<Divider />

					<DialogActions sx={{ p: 2.5 }}>
						<Button onClick={handleClose} color="inherit">
							Cancelar
						</Button>
					</DialogActions>
				</>
			) : (
				// Vista del formulario para Poder Judicial de la Nación
				<>
					<DialogTitle sx={{ p: 3, pb: 2 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Stack direction="row" alignItems="center" spacing={1}>
								<DocumentUpload size={24} color={theme.palette.primary.main} />
								<Typography variant="h5">Vincular con Poder Judicial de la Nación</Typography>
							</Stack>
							<IconButton color="secondary" onClick={handleClose} disabled={loading} sx={{ p: 0 }}>
								<Add style={{ transform: "rotate(45deg)" }} />
							</IconButton>
						</Stack>
					</DialogTitle>

					<Divider />

					<DialogContent sx={{ p: 3 }}>
						<Grid container spacing={3}>
							{/* Logo del Poder Judicial de la Nación */}
							<Grid item xs={12}>
								<Box
									sx={{
										backgroundColor: "#222E43",
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
										src="https://res.cloudinary.com/dqyoeolib/image/upload/v1746884259/xndhymcmzv3kk0f62v0y.png"
										alt="Poder Judicial de la Nación"
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

							<Grid item xs={12}>
								<Alert severity="warning">La causa debe ser de acceso público en el sistema del Poder Judicial.</Alert>
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
											disabled={loading}
											renderValue={(selected) => {
												if (!selected) {
													return <em>Seleccione una jurisdicción</em>;
												}
												const selectedJurisdiction = jurisdicciones.find((j) => j.value === selected);
												return selectedJurisdiction ? selectedJurisdiction.nombre : "";
											}}
											sx={{
												"& .MuiInputBase-root": { height: 39.91 },
												"& .MuiInputBase-input": { fontSize: 12 },
											}}
										>
											<MenuItem value="" disabled>
												<em>Seleccione una jurisdicción</em>
											</MenuItem>
											{jurisdicciones
												.filter((j) => j.value !== "")
												.map((jurisdiccion) => (
													<MenuItem key={jurisdiccion.value} value={jurisdiccion.value}>
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
								<Alert severity="info">
									Al vincular esta causa, se descargará y actualizará automáticamente la información desde el sistema del Poder Judicial de
									la Nación.
								</Alert>
							</Grid>
						</Grid>
					</DialogContent>

					<Divider />

					<DialogActions sx={{ p: 2.5 }}>
						<Button onClick={() => setSelectedPower(null)} disabled={loading} color="inherit">
							Atrás
						</Button>
						<Button variant="contained" onClick={handleSubmit} disabled={loading}>
							{loading ? "Vinculando..." : "Vincular Causa"}
						</Button>
					</DialogActions>
				</>
			)}
		</Dialog>
	);
};

export default LinkToJudicialPower;
