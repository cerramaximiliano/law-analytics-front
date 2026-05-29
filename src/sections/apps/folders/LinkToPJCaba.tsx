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
	Box,
	TextField,
	Checkbox,
	FormControlLabel,
	RadioGroup,
	Radio,
} from "@mui/material";
import { PopupTransition } from "components/@extended/Transitions";
import { DocumentUpload, ArrowLeft2 } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { enqueueSnackbar } from "notistack";
import { dispatch } from "store";
import { linkFolderToEJE } from "store/reducers/folder";
import ejeWorkersService from "api/workersEje";

const LOGO_EJE = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";

interface LinkToPJCabaProps {
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

const LinkToPJCaba = ({ open, onCancel, onBack, folderId, folderName }: LinkToPJCabaProps) => {
	const theme = useTheme();
	const [searchType, setSearchType] = useState<"expediente" | "cuij">("expediente");
	const [cuij, setCuij] = useState("");
	const [expedientNumber, setExpedientNumber] = useState("");
	const [expedientYear, setExpedientYear] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [cuijError, setCuijError] = useState("");
	const [numberError, setNumberError] = useState("");
	const [yearError, setYearError] = useState("");
	const [error, setError] = useState("");
	const [overwriteData, setOverwriteData] = useState(true);
	const [touched, setTouched] = useState({
		cuij: false,
		expedientNumber: false,
		expedientYear: false,
	});

	const formSubmitAttempted = useRef<boolean>(false);

	const resetState = () => {
		setSearchType("expediente");
		setCuij("");
		setExpedientNumber("");
		setExpedientYear("");
		setError("");
		setCuijError("");
		setNumberError("");
		setYearError("");
		setSuccess(false);
		setOverwriteData(true);
		formSubmitAttempted.current = false;
		setTouched({
			cuij: false,
			expedientNumber: false,
			expedientYear: false,
		});
	};

	useEffect(() => {
		if (open) {
			resetState();
		}
	}, [open]);

	const validateCuij = (value: string) => {
		const validation = ejeWorkersService.validateCuij(value || "");
		if (!validation.valid) {
			setCuijError(validation.error || "CUIJ inválido");
			return false;
		}
		setCuijError("");
		return true;
	};

	const validateYear = (year: string) => {
		if (!year || year.trim() === "") {
			setYearError("El año es requerido");
			return false;
		}

		const currentYear = new Date().getFullYear();
		const yearNumber = parseInt(year);

		if (year.length !== 4) {
			setYearError("El año debe tener 4 dígitos");
			return false;
		}

		if (yearNumber < 2000 || yearNumber > currentYear) {
			setYearError(`El año debe estar entre 2000 y ${currentYear}`);
			return false;
		}

		setYearError("");
		return true;
	};

	const validateExpedientNumber = (number: string) => {
		if (!number || number.trim() === "") {
			setNumberError("El número de expediente es requerido");
			return false;
		}
		setNumberError("");
		return true;
	};

	const validateAllFields = () => {
		if (searchType === "cuij") {
			setTouched({ ...touched, cuij: true });
			return validateCuij(cuij);
		}
		setTouched({ ...touched, expedientNumber: true, expedientYear: true });
		const isNumberValid = validateExpedientNumber(expedientNumber);
		const isYearValid = validateYear(expedientYear);
		return isNumberValid && isYearValid;
	};

	const handleSubmit = async () => {
		formSubmitAttempted.current = true;

		if (!validateAllFields()) {
			return;
		}

		setLoading(true);
		setError("");

		try {
			const linkData =
				searchType === "cuij"
					? { cuij, overwrite: overwriteData }
					: { number: expedientNumber, year: expedientYear, overwrite: overwriteData };

			const result = await dispatch(linkFolderToEJE(folderId, linkData));

			if (result.success) {
				setLoading(false);
				setSuccess(true);

				let message = result.message || "Causa vinculada exitosamente con el Poder Judicial de CABA";
				if (result.causaInfo?.associationStatus === "pending") {
					message = "Causa EJE vinculada. Pendiente de verificación en el sistema judicial.";
				}

				enqueueSnackbar(message, {
					variant: "success",
					anchorOrigin: { vertical: "top", horizontal: "right" },
				});

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
			resetState();
			onCancel();
		}
	};

	const handleBack = () => {
		if (!loading && onBack) {
			resetState();
			onCancel();
			onBack();
		}
	};

	const handleCuijChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setCuij(value);
		setTouched({ ...touched, cuij: true });
		if (touched.cuij || formSubmitAttempted.current) {
			validateCuij(value);
		}
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setExpedientNumber(value);
		setTouched({ ...touched, expedientNumber: true });
		if (touched.expedientNumber || formSubmitAttempted.current) {
			validateExpedientNumber(value);
		}
	};

	const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setExpedientYear(value);
		setTouched({ ...touched, expedientYear: true });
		if (touched.expedientYear || formSubmitAttempted.current) {
			validateYear(value);
		}
	};

	useEffect(() => {
		if (formSubmitAttempted.current) {
			if (searchType === "cuij") {
				validateCuij(cuij);
			} else {
				validateExpedientNumber(expedientNumber);
				validateYear(expedientYear);
			}
		}
	}, [cuij, expedientNumber, expedientYear, searchType]);

	useEffect(() => {
		const handlePlanRestriction = (_event: Event) => {
			onCancel();
			setLoading(false);
		};

		window.addEventListener("planRestrictionError", handlePlanRestriction);
		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
		};
	}, [onCancel]);

	const submitDisabled =
		loading || (searchType === "cuij" ? !cuij || !!cuijError : !expedientNumber || !expedientYear || !!numberError || !!yearError);

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			TransitionComponent={PopupTransition}
			maxWidth="sm"
			fullWidth
			sx={{ "& .MuiDialog-paper": { p: 0 } }}
		>
			<DialogTitle
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.paper,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<DocumentUpload size={24} color={theme.palette.primary.main} />
						<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
							Vincular con Poder Judicial de CABA
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						Complete los datos del expediente
					</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 2.5 }}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Box
							sx={{
								backgroundColor: "#FFFFFF",
								border: `1px solid ${theme.palette.divider}`,
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
								src={LOGO_EJE}
								alt="EJE - Expediente Judicial Electrónico"
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
						<Alert severity="info">La causa debe ser de acceso público en el sistema EJE.</Alert>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={1.25}>
							<InputLabel>¿Cómo querés buscar el expediente?</InputLabel>
							<RadioGroup
								row
								value={searchType}
								onChange={(e) => {
									setSearchType(e.target.value as "expediente" | "cuij");
									setCuijError("");
									setNumberError("");
									setYearError("");
								}}
							>
								<FormControlLabel value="expediente" control={<Radio size="small" />} label="Por número y año" />
								<FormControlLabel value="cuij" control={<Radio size="small" />} label="Por CUIJ" />
							</RadioGroup>
						</Stack>
					</Grid>

					{searchType === "cuij" ? (
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="eje-cuij">CUIJ</InputLabel>
								<TextField
									fullWidth
									sx={customInputStyles}
									id="eje-cuij"
									placeholder="J-01-00053687-9/2020-0"
									name="cuij"
									value={cuij}
									onChange={handleCuijChange}
									disabled={loading}
									error={Boolean(cuijError && (touched.cuij || formSubmitAttempted.current))}
									helperText={
										touched.cuij || formSubmitAttempted.current
											? cuijError || "Formato: J-XX-XXXXXXXX-X/AAAA-X"
											: "Formato: J-XX-XXXXXXXX-X/AAAA-X"
									}
									size="small"
								/>
							</Stack>
						</Grid>
					) : (
						<>
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
						</>
					)}

					<Grid item xs={12}>
						<FormControlLabel
							control={<Checkbox checked={overwriteData} onChange={(e) => setOverwriteData(e.target.checked)} color="primary" />}
							label={
								<Typography variant="body2">
									Sobrescribir datos actuales de la causa (carátula, juzgado y número de expediente) con los datos obtenidos del sistema EJE
								</Typography>
							}
						/>
					</Grid>

					<Grid item xs={12}>
						<Alert severity="warning">
							Al vincular esta causa, se descargará y actualizará automáticamente la información desde el sistema EJE de la Ciudad de Buenos
							Aires.
						</Alert>
					</Grid>
				</Grid>
			</DialogContent>

			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Grid container justifyContent="space-between" alignItems="center">
					<Grid item></Grid>
					<Grid item>
						<Stack direction="row" spacing={2} alignItems="center">
							{onBack && (
								<Button onClick={handleBack} disabled={loading} startIcon={<ArrowLeft2 size={18} />}>
									Atrás
								</Button>
							)}
							<Button onClick={handleClose} disabled={loading} color="error" sx={{ minWidth: 100 }}>
								Cancelar
							</Button>
							<Button variant="contained" onClick={handleSubmit} disabled={submitDisabled} sx={{ minWidth: 100 }}>
								{loading ? "Vinculando..." : "Vincular"}
							</Button>
						</Stack>
					</Grid>
				</Grid>
			</DialogActions>
		</Dialog>
	);
};

export default LinkToPJCaba;
