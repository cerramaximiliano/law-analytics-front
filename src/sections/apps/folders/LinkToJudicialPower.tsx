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
	InputLabel,
	Grid,
	MenuItem,
	Select,
	FormControl,
	SelectChangeEvent,
	Box,
	TextField,
	Checkbox,
	FormControlLabel,
	CircularProgress,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { PopupTransition } from "components/@extended/Transitions";
import { DocumentUpload, ArrowLeft2, ArrowRight2, ExportSquare, InfoCircle, TickCircle, CloseCircle, Warning2 } from "iconsax-react";
import { enqueueSnackbar } from "notistack";
import { dispatch } from "store";
import { linkFolderToCausa } from "store/reducers/folder";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";
import PjnMaintenanceAlert from "components/PjnMaintenanceAlert";
import PjnGuardedButton from "components/PjnGuardedButton";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

interface LinkToJudicialPowerProps {
	openLink: boolean;
	onCancelLink: () => void;
	folderId: string;
	folderName: string;
	onSelectBuenosAires?: () => void;
	onSelectCaba?: () => void;
	// Label de jurisdicción del folder (data/folder.json) usada para filtrar las
	// tarjetas del selector. Si el folder fue creado manualmente con una
	// jurisdicción específica, solo se ofrece el sistema compatible:
	// "Nacional" → PJN, "Buenos Aires" → MEV/SCBA, "CABA" → EJE. Si la prop es
	// undefined / vacía, se muestran las 3 opciones (folders legacy o sin
	// jurisdicción declarada).
	folderJurisLabel?: string;
}

const LOGO_EJE = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";
const LOGO_PJN = "https://res.cloudinary.com/dqyoeolib/image/upload/v1746884259/xndhymcmzv3kk0f62v0y.png";

// Lista de jurisdicciones del Poder Judicial de la Nación
const jurisdicciones = [
	{ value: "", nombre: "Seleccione una jurisdicción" },
	{ value: "1", nombre: "CIV - Cámara Nacional de Apelaciones en lo Civil" },
	{ value: "5", nombre: "CSS - Camara Federal de la Seguridad Social" },
	{ value: "7", nombre: "CNT - Cámara Nacional de Apelaciones del Trabajo" },
	{ value: "10", nombre: "COM - Cámara Nacional de Apelaciones en lo Comercial" },
];

const LinkToJudicialPower = ({
	openLink,
	onCancelLink,
	folderId,
	folderName,
	onSelectBuenosAires,
	onSelectCaba,
	folderJurisLabel,
}: LinkToJudicialPowerProps) => {
	// Si el folder tiene jurisdicción declarada, solo mostrar la tarjeta
	// correspondiente. Sin jurisdicción → mostrar las 3 (legacy).
	const showNacional = !folderJurisLabel || folderJurisLabel === "Nacional";
	const showBuenosAires = !folderJurisLabel || folderJurisLabel === "Buenos Aires";
	const showCaba = !folderJurisLabel || folderJurisLabel === "CABA";
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const [selectedPower, setSelectedPower] = useState<"nacional" | "buenosaires" | "caba" | null>(null);
	const [expedientNumber, setExpedientNumber] = useState("");
	const [expedientYear, setExpedientYear] = useState("");
	const [jurisdiction, setJurisdiction] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [yearError, setYearError] = useState("");
	const [jurisdictionError, setJurisdictionError] = useState("");
	const [numberError, setNumberError] = useState("");
	const [error, setError] = useState("");
	const [overwriteData, setOverwriteData] = useState(true);
	const [touched, setTouched] = useState({
		jurisdiction: false,
		expedientNumber: false,
		expedientYear: false,
	});

	const formSubmitAttempted = useRef<boolean>(false);

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

	const validateJurisdiction = (jurisdictionValue: string) => {
		if (!jurisdictionValue || jurisdictionValue === "") {
			setJurisdictionError("Debe seleccionar una jurisdicción");
			return false;
		}
		setJurisdictionError("");
		return true;
	};

	const validateAllFields = () => {
		const isJurisdictionValid = validateJurisdiction(jurisdiction);
		const isNumberValid = validateExpedientNumber(expedientNumber);
		const isYearValid = validateYear(expedientYear);
		setTouched({ jurisdiction: true, expedientNumber: true, expedientYear: true });
		return isJurisdictionValid && isNumberValid && isYearValid;
	};

	const handleSubmit = async () => {
		formSubmitAttempted.current = true;
		if (!validateAllFields()) return;

		setLoading(true);
		setError("");

		try {
			const result = await dispatch(
				linkFolderToCausa(folderId, {
					pjnCode: jurisdiction,
					number: expedientNumber,
					year: expedientYear,
					overwrite: overwriteData,
					pjn: selectedPower === "nacional",
				}),
			);

			if (result.success) {
				setLoading(false);
				setSuccess(true);

				enqueueSnackbar("Causa vinculada exitosamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					autoHideDuration: 4000,
				});

				setTimeout(() => {
					setExpedientNumber("");
					setExpedientYear("");
					setJurisdiction("");
					setSuccess(false);
					setSelectedPower(null);
					onCancelLink();
				}, 1500);
			} else {
				setLoading(false);
				setError(result.message || "Error al vincular la causa");
			}
		} catch (err) {
			setLoading(false);
			setError("Ocurrió un error inesperado");
		}
	};

	const handleClose = () => {
		if (!loading) {
			setExpedientNumber("");
			setExpedientYear("");
			setJurisdiction("");
			setError("");
			setSuccess(false);
			setYearError("");
			setNumberError("");
			setJurisdictionError("");
			formSubmitAttempted.current = false;
			setTouched({ jurisdiction: false, expedientNumber: false, expedientYear: false });
			setSelectedPower(null);
			onCancelLink();
		}
	};

	const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setExpedientYear(value);
		setTouched({ ...touched, expedientYear: true });
		if (touched.expedientYear || formSubmitAttempted.current) validateYear(value);
	};

	const handleJurisdictionChange = (e: SelectChangeEvent) => {
		const value = e.target.value as string;
		setJurisdiction(value);
		setTouched({ ...touched, jurisdiction: true });
		if (touched.jurisdiction || formSubmitAttempted.current) validateJurisdiction(value);
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setExpedientNumber(value);
		setTouched({ ...touched, expedientNumber: true });
		if (touched.expedientNumber || formSubmitAttempted.current) validateExpedientNumber(value);
	};

	useEffect(() => {
		if (formSubmitAttempted.current) {
			validateJurisdiction(jurisdiction);
			validateExpedientNumber(expedientNumber);
			validateYear(expedientYear);
		}
	}, [jurisdiction, expedientNumber, expedientYear]);

	useEffect(() => {
		const handlePlanRestriction = (_event: Event) => {
			onCancelLink();
			setLoading(false);
		};
		window.addEventListener("planRestrictionError", handlePlanRestriction);
		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
		};
	}, [onCancelLink]);

	// Brand styles reutilizables
	const inputBrandSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1,
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14) },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
		},
		"& .MuiInputBase-input": { fontSize: "0.85rem" },
	};

	const eyebrowLabelSx = {
		fontSize: "0.78rem",
		fontWeight: 500,
		color: "text.primary",
		letterSpacing: "-0.005em",
	};

	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		px: 2,
		py: 0.875,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};

	const soberBrandBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		bgcolor: BRAND_BLUE,
		color: "#fff",
		borderRadius: 1.25,
		px: 2,
		py: 0.875,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};

	// Header brand reutilizable
	const renderHeader = (title: string, subtitle: string, eyebrow: string) => (
		<DialogTitle
			sx={{
				display: "flex",
				alignItems: "center",
				gap: 1.25,
				px: 2.5,
				py: 1.75,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
				borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
			}}
		>
			<Box
				sx={{
					width: 32,
					height: 32,
					borderRadius: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					flexShrink: 0,
				}}
			>
				<DocumentUpload size={18} variant="Bulk" />
			</Box>
			<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
				<Stack direction="row" spacing={0.5} alignItems="center">
					<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
					<Typography
						sx={{
							fontSize: "0.6rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						{eyebrow}
					</Typography>
				</Stack>
				<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>{title}</Typography>
				<Typography
					sx={{
						fontSize: "0.72rem",
						color: "text.secondary",
						letterSpacing: "-0.005em",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{subtitle}
				</Typography>
			</Stack>
		</DialogTitle>
	);

	// Tarjeta brand de selección de poder judicial
	const PowerCard = ({
		onClick,
		logoBg,
		logoSrc,
		logoAlt,
		hasLogoBorder,
		title,
		description,
	}: {
		onClick: () => void;
		logoBg: string;
		logoSrc: string;
		logoAlt: string;
		hasLogoBorder?: boolean;
		title: string;
		description: string;
	}) => (
		<Box
			role="button"
			onClick={onClick}
			sx={{
				width: "100%",
				display: "flex",
				alignItems: "center",
				gap: 1.5,
				p: 1.5,
				borderRadius: 1.25,
				cursor: "pointer",
				bgcolor: theme.palette.background.paper,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				transition: "all 180ms ease",
				"&:hover": {
					borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
				},
			}}
		>
			<Box
				sx={{
					width: 56,
					height: 56,
					borderRadius: 1,
					p: 0.75,
					bgcolor: logoBg,
					border: hasLogoBorder ? `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08)}` : "none",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					flexShrink: 0,
				}}
			>
				<img src={logoSrc} alt={logoAlt} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
			</Box>
			<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
				<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.3 }}>
					{title}
				</Typography>
				<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", letterSpacing: "-0.005em", lineHeight: 1.4 }}>
					{description}
				</Typography>
			</Stack>
			<Box
				sx={{
					width: 28,
					height: 28,
					borderRadius: 0.875,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					color: BRAND_BLUE,
					flexShrink: 0,
				}}
			>
				<ArrowRight2 size={14} variant="Bulk" />
			</Box>
		</Box>
	);

	// Banner inline brand-tinted
	const InlineBanner = ({ accent, icon, children }: { accent: string; icon: React.ReactNode; children: React.ReactNode }) => (
		<Box
			sx={{
				display: "flex",
				alignItems: "flex-start",
				gap: 1.25,
				p: 1.25,
				borderRadius: 1.25,
				bgcolor: alpha(accent, isDark ? 0.1 : 0.06),
				border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
			}}
		>
			<Box sx={{ color: accent, flexShrink: 0, mt: 0.125 }}>{icon}</Box>
			<Box sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.5 }}>{children}</Box>
		</Box>
	);

	return (
		<Dialog
			open={openLink}
			onClose={handleClose}
			TransitionComponent={PopupTransition}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			{selectedPower === null ? (
				// ─────── Vista de selección ───────
				<>
					{renderHeader("Vincular con Poder Judicial", folderName, "Vinculación")}

					<DialogContent sx={{ p: 2.5 }}>
						<Stack spacing={1.5}>
							<Box>
								<Stack direction="row" spacing={0.5} alignItems="center" mb={0.625}>
									<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
									<Typography
										sx={{
											fontSize: "0.6rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Elegí el poder judicial
									</Typography>
								</Stack>
								<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", lineHeight: 1.5 }}>
									Seleccioná el sistema con el que querés vincular esta causa.
								</Typography>
							</Box>

							{showNacional && (
								<PowerCard
									onClick={() => setSelectedPower("nacional")}
									logoBg="#222E43"
									logoSrc={LOGO_PJN}
									logoAlt="Poder Judicial de la Nación"
									title="Poder Judicial de la Nación"
									description="Causas federales y nacionales"
								/>
							)}

							{showBuenosAires && (
								<PowerCard
									onClick={() => {
										if (onSelectBuenosAires) {
											onCancelLink();
											onSelectBuenosAires();
										}
									}}
									logoBg="#f8f8f8"
									logoSrc={logoPJBuenosAires}
									logoAlt="Poder Judicial de Buenos Aires"
									hasLogoBorder
									title="Poder Judicial de la Provincia de Buenos Aires"
									description="Causas del fuero provincial"
								/>
							)}

							{showCaba && (
								<PowerCard
									onClick={() => {
										if (onSelectCaba) {
											onCancelLink();
											onSelectCaba();
										}
									}}
									logoBg="#FFFFFF"
									logoSrc={LOGO_EJE}
									logoAlt="EJE - Expediente Judicial Electrónico"
									hasLogoBorder
									title="Poder Judicial de la Ciudad de Buenos Aires"
									description="Sistema EJE — buscá por CUIJ o número/año"
								/>
							)}
						</Stack>
					</DialogContent>

					<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
						<Button onClick={handleClose} sx={ghostBtnSx}>
							Cancelar
						</Button>
					</DialogActions>
				</>
			) : (
				// ─────── Vista del formulario PJN nacional ───────
				<>
					{renderHeader("Vincular con Poder Judicial de la Nación", folderName, "Completá los datos")}

					<DialogContent sx={{ p: 2.5 }}>
						<Stack spacing={2}>
							<PjnMaintenanceAlert compact contextHint="No vas a poder vincular la causa hasta que el portal vuelva." />

							{/* Logo PJN */}
							<Box
								sx={{
									backgroundColor: "#222E43",
									borderRadius: 1.5,
									p: 1.5,
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									height: 80,
								}}
							>
								<img
									src={LOGO_PJN}
									alt="Poder Judicial de la Nación"
									style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
								/>
							</Box>

							{/* Causa a vincular */}
							<Box
								sx={{
									p: 1.5,
									borderRadius: 1.25,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
								}}
							>
								<Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
									<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
									<Typography
										sx={{
											fontSize: "0.6rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Causa a vincular
									</Typography>
								</Stack>
								<Typography
									sx={{
										fontSize: "0.95rem",
										fontWeight: 600,
										color: BRAND_BLUE,
										letterSpacing: "-0.005em",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{folderName}
								</Typography>
							</Box>

							{/* Mensajes contextuales */}
							{error && (
								<InlineBanner accent={errorColor} icon={<CloseCircle size={16} variant="Bulk" />}>
									{error}
								</InlineBanner>
							)}

							{success && (
								<InlineBanner accent={LIVE_GREEN} icon={<TickCircle size={16} variant="Bulk" />}>
									Vinculación exitosa. Los datos de la causa se actualizarán automáticamente.
								</InlineBanner>
							)}

							<InlineBanner accent={STALE_AMBER} icon={<Warning2 size={16} variant="Bulk" />}>
								La causa debe ser de acceso público en el sistema del Poder Judicial.
							</InlineBanner>

							{/* Jurisdicción */}
							<Stack spacing={0.5}>
								<InputLabel htmlFor="jurisdiction" sx={eyebrowLabelSx}>
									Jurisdicción{" "}
									<Box component="span" sx={{ color: errorColor }}>
										*
									</Box>
								</InputLabel>
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
												return <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>Seleccioná una jurisdicción</Typography>;
											}
											const selectedJurisdiction = jurisdicciones.find((j) => j.value === selected);
											return (
												<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em" }}>
													{selectedJurisdiction ? selectedJurisdiction.nombre : ""}
												</Typography>
											);
										}}
										sx={{
											borderRadius: 1,
											"& .MuiOutlinedInput-notchedOutline": { borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14) },
											"&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26) },
											"&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_BLUE },
										}}
									>
										{jurisdicciones
											.filter((j) => j.value !== "")
											.map((jurisdiccion) => (
												<MenuItem key={jurisdiccion.value} value={jurisdiccion.value} sx={{ fontSize: "0.85rem" }}>
													{jurisdiccion.nombre}
												</MenuItem>
											))}
									</Select>
									{jurisdictionError && (touched.jurisdiction || formSubmitAttempted.current) && (
										<Typography sx={{ fontSize: "0.72rem", color: errorColor, mt: 0.5, letterSpacing: "-0.005em" }}>
											{jurisdictionError}
										</Typography>
									)}
								</FormControl>
							</Stack>

							{/* Número + Año */}
							<Grid container spacing={1.5}>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.5}>
										<InputLabel htmlFor="expedient-number" sx={eyebrowLabelSx}>
											Número de expediente{" "}
											<Box component="span" sx={{ color: errorColor }}>
												*
											</Box>
										</InputLabel>
										<TextField
											fullWidth
											sx={inputBrandSx}
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
									<Stack spacing={0.5}>
										<InputLabel htmlFor="expedient-year" sx={eyebrowLabelSx}>
											Año{" "}
											<Box component="span" sx={{ color: errorColor }}>
												*
											</Box>
										</InputLabel>
										<TextField
											fullWidth
											sx={inputBrandSx}
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
							</Grid>

							{/* Checkbox sobrescribir */}
							<FormControlLabel
								sx={{ m: 0, alignItems: "flex-start" }}
								control={
									<Checkbox
										checked={overwriteData}
										onChange={(e) => setOverwriteData(e.target.checked)}
										size="small"
										sx={{
											color: alpha(BRAND_BLUE, 0.5),
											"&.Mui-checked": { color: BRAND_BLUE },
											pt: 0,
										}}
									/>
								}
								label={
									<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.5, ml: 0.5 }}>
										Sobrescribir datos actuales de la causa (carátula, juzgado y número de expediente) con los datos obtenidos del Poder
										Judicial.
									</Typography>
								}
							/>

							<InlineBanner accent={BRAND_BLUE} icon={<InfoCircle size={16} variant="Bulk" />}>
								Al vincular esta causa, se descargará y actualizará automáticamente la información desde el sistema del Poder Judicial de la
								Nación.
							</InlineBanner>
						</Stack>
					</DialogContent>

					<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
						<Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%", justifyContent: "flex-end" }}>
							<Button
								onClick={() => setSelectedPower(null)}
								disabled={loading}
								startIcon={<ArrowLeft2 size={14} variant="Bulk" />}
								sx={ghostBtnSx}
							>
								Atrás
							</Button>
							<Button onClick={handleClose} disabled={loading} sx={ghostBtnSx}>
								Cancelar
							</Button>
							<PjnGuardedButton
								variant="contained"
								onClick={handleSubmit}
								disabled={
									loading || !jurisdiction || !expedientNumber || !expedientYear || !!yearError || !!numberError || !!jurisdictionError
								}
								startIcon={loading ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <ExportSquare size={14} variant="Bulk" />}
								sx={{ ...soberBrandBtnSx, minWidth: 120 }}
							>
								{loading ? "Vinculando…" : "Vincular"}
							</PjnGuardedButton>
						</Stack>
					</DialogActions>
				</>
			)}
		</Dialog>
	);
};

export default LinkToJudicialPower;
