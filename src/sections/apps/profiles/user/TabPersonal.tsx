import React from "react";
import { RefObject, useState } from "react";
import { useOutletContext } from "react-router";

// material-ui
import {
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	FormHelperText,
	Grid,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";

// project-imports
import MainCard from "components/MainCard";
import countries from "data/countries";
import { dispatch, useSelector } from "store";
import { updateUserProfile } from "store/reducers/auth";
import { useFormWithSnackbar } from "hooks/useFormWithSnackbar";

// assets
import dayjs from "utils/dayjs-config";
import { Profile, Lock, Location, Note1 } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

function useInputRef() {
	return useOutletContext<RefObject<HTMLInputElement>>();
}

// ── Section header brand ───────────────────────────────────────────────────────

const SectionHeader = ({
	eyebrow,
	title,
	icon,
}: {
	eyebrow: string;
	title: string;
	icon: React.ReactNode;
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Stack direction="row" spacing={1.25} alignItems="center">
			<Box
				sx={{
					width: 32,
					height: 32,
					borderRadius: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					flexShrink: 0,
				}}
			>
				{icon}
			</Box>
			<Stack spacing={0.125}>
				<Stack direction="row" spacing={0.625} alignItems="center">
					<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
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
				<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>{title}</Typography>
			</Stack>
		</Stack>
	);
};

// ==============================|| USER PROFILE - PERSONAL ||============================== //

const TabPersonal = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [loading, setLoading] = useState(false);

	const handleSubmit = useFormWithSnackbar({
		onSubmit: async (values: {
			firstName: string;
			lastName: string;
			email: string;
			dob: Date | null;
			contact: string;
			designation: string;
			address: string;
			address1: string;
			country: string;
			state: string;
			colleges: string[];
			note: string;
			submit: null;
		}) => {
			setLoading(true);
			try {
				const formattedDate = values.dob ? dayjs(values.dob).format("YYYY-MM-DD") : null;
				const updateData = {
					firstName: values.firstName,
					lastName: values.lastName,
					dob: formattedDate,
					contact: values.contact,
					designation: values.designation,
					address: values.address,
					address1: values.address1,
					country: values.country,
					state: values.state,
					skill: values.colleges,
					note: values.note,
				};
				await dispatch(updateUserProfile(updateData));
			} finally {
				setLoading(false);
			}
		},
		successMessage: "Perfil actualizado correctamente",
		errorMessage: "Error al actualizar el perfil",
	});

	const inputRef = useInputRef();
	const userData = useSelector((state) => state.auth);

	// Brand helpers
	const labelSx = {
		fontSize: "0.72rem",
		fontWeight: 600,
		letterSpacing: "0.04em",
		textTransform: "uppercase" as const,
		color: "text.secondary",
	};
	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1.25,
			fontSize: "0.875rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14), transition: "border-color 0.15s ease" },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
		"& .MuiInputLabel-root.Mui-focused": { color: BRAND_BLUE },
	};
	const selectSx = {
		borderRadius: 1.25,
		fontSize: "0.875rem",
		"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
		"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
		"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
	};
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.75,
		transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};
	const brandPrimarySx = {
		minWidth: 120,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const hairline = <Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08), my: 2.5 }} />;

	// Skeleton inicial brand
	if (!userData.user) {
		return (
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, p: 2.5 }}>
				<Stack spacing={2.5}>
					<SectionHeader eyebrow="Información personal" title="Detalles del perfil" icon={<Profile size={16} variant="Bulk" />} />
					<Grid container spacing={2}>
						{[1, 2, 3, 4, 5, 6].map((item) => (
							<Grid item xs={12} sm={6} key={item}>
								<Stack spacing={0.75}>
									<Skeleton variant="text" width="30%" height={16} />
									<Skeleton variant="rounded" height={40} sx={{ borderRadius: 1.25 }} />
								</Stack>
							</Grid>
						))}
					</Grid>
					<Stack direction="row" justifyContent="flex-end" spacing={1.25} sx={{ pt: 1 }}>
						<Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 1.25 }} />
						<Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 1.25 }} />
					</Stack>
				</Stack>
			</MainCard>
		);
	}

	const formatInitialDate = () => {
		if (userData.user?.dob) {
			const utcDate = dayjs.utc(userData.user.dob);
			const year = utcDate.year();
			const month = utcDate.month();
			const day = utcDate.date();
			return dayjs().year(year).month(month).date(day).hour(0).minute(0).second(0).millisecond(0).toDate();
		}
		return null;
	};

	return (
		<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, p: 2.5 }}>
			<Formik
				initialValues={{
					firstName: userData.user?.firstName || "",
					lastName: userData.user?.lastName || "",
					email: userData.user?.email || "",
					dob: formatInitialDate(),
					contact: userData.user?.contact || "",
					designation: userData.user?.designation || "",
					address: userData.user?.address || "",
					address1: userData.user?.address1 || "",
					country: userData.user?.country || "",
					state: userData.user?.state || "",
					colleges: (userData.user?.skill as string[]) || [],
					note: userData.user?.note || "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					firstName: Yup.string().max(255).required("El nombre es requerido"),
					lastName: Yup.string().max(255).required("El apellido es requerido."),
					dob: Yup.date().nullable().max(new Date(), "La fecha no puede ser futura"),
					note: Yup.string().min(5, "La nota debe tener más de 5 caracteres."),
				})}
				onSubmit={handleSubmit}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, setFieldValue, touched, values, resetForm }) => (
					<form noValidate onSubmit={handleSubmit}>
						{/* Sección: Detalles del perfil */}
						<SectionHeader eyebrow="Información personal" title="Detalles del perfil" icon={<Profile size={16} variant="Bulk" />} />
						<Box sx={{ mt: 2 }}>
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-first-name" sx={labelSx}>
											Nombre
										</InputLabel>
										<TextField
											fullWidth
											id="personal-first-name"
											value={values.firstName}
											name="firstName"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Nombre"
											autoFocus
											inputRef={inputRef}
											error={Boolean(touched.firstName && errors.firstName)}
											sx={inputSx}
										/>
										{touched.firstName && errors.firstName && (
											<FormHelperText error sx={{ fontSize: "0.7rem" }}>
												{errors.firstName}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-last-name" sx={labelSx}>
											Apellido
										</InputLabel>
										<TextField
											fullWidth
											id="personal-last-name"
											value={values.lastName}
											name="lastName"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Apellido"
											error={Boolean(touched.lastName && errors.lastName)}
											sx={inputSx}
										/>
										{touched.lastName && errors.lastName && (
											<FormHelperText error sx={{ fontSize: "0.7rem" }}>
												{errors.lastName}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-email" sx={labelSx}>
											Correo electrónico
										</InputLabel>
										<TextField
											type="email"
											fullWidth
											value={values.email}
											name="email"
											id="personal-email"
											disabled
											InputProps={{
												readOnly: true,
												endAdornment: (
													<InputAdornment position="end">
														<Lock size={14} variant="Linear" color={theme.palette.text.secondary} />
													</InputAdornment>
												),
											}}
											sx={inputSx}
										/>
										<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
											El correo no puede modificarse. Contactá a soporte para cambiarlo.
										</Typography>
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-dob" sx={labelSx}>
											Fecha de nacimiento
										</InputLabel>
										<LocalizationProvider dateAdapter={AdapterDateFns}>
											<DatePicker
												value={values.dob}
												onChange={(newValue) => setFieldValue("dob", newValue)}
												format="dd/MM/yyyy"
												maxDate={new Date()}
												minDate={new Date(1900, 0, 1)}
												sx={{ width: 1, ...inputSx }}
												slotProps={{
													textField: {
														id: "personal-dob",
														fullWidth: true,
														onBlur: handleBlur,
														name: "dob",
														placeholder: "DD/MM/AAAA",
														error: Boolean(touched.dob && errors.dob),
													},
												}}
											/>
										</LocalizationProvider>
										{touched.dob && errors.dob && (
											<FormHelperText error sx={{ fontSize: "0.7rem" }}>
												{errors.dob as string}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-contact" sx={labelSx}>
											Teléfono
										</InputLabel>
										<TextField
											fullWidth
											id="personal-contact"
											value={values.contact}
											name="contact"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Número de contacto"
											error={Boolean(touched.contact && errors.contact)}
											sx={inputSx}
										/>
										{touched.contact && errors.contact && (
											<FormHelperText error sx={{ fontSize: "0.7rem" }}>
												{errors.contact}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-designation" sx={labelSx}>
											Cargo
										</InputLabel>
										<Select
											fullWidth
											id="personal-designation"
											value={values.designation}
											name="designation"
											onBlur={handleBlur}
											onChange={handleChange}
											displayEmpty
											error={Boolean(touched.designation && errors.designation)}
											sx={selectSx}
										>
											<MenuItem value="">
												<em>Seleccioná tu cargo</em>
											</MenuItem>
											{["Abogado", "Procurador", "Estudio Jurídico", "Contador Público", "Escribano/a", "Otro"].map((option) => (
												<MenuItem key={option} value={option}>
													{option}
												</MenuItem>
											))}
										</Select>
										{touched.designation && errors.designation && (
											<FormHelperText error sx={{ fontSize: "0.7rem" }}>
												{errors.designation}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
							</Grid>
						</Box>

						{hairline}

						{/* Sección: Dirección */}
						<SectionHeader eyebrow="Ubicación" title="Dirección" icon={<Location size={16} variant="Bulk" />} />
						<Box sx={{ mt: 2 }}>
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-address" sx={labelSx}>
											Domicilio principal
										</InputLabel>
										<TextField
											multiline
											rows={3}
											fullWidth
											id="personal-address"
											value={values.address}
											name="address"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Dirección principal"
											error={Boolean(touched.address && errors.address)}
											sx={inputSx}
										/>
										{touched.address && errors.address && (
											<FormHelperText error sx={{ fontSize: "0.7rem" }}>
												{errors.address}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-address1" sx={labelSx}>
											Domicilio alternativo
										</InputLabel>
										<TextField
											multiline
											rows={3}
											fullWidth
											id="personal-address1"
											value={values.address1}
											name="address1"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Dirección alternativa"
											sx={inputSx}
										/>
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-country" sx={labelSx}>
											País
										</InputLabel>
										<Autocomplete
											id="personal-country"
											fullWidth
											value={countries.find((item) => item.code === values?.country) || null}
											onBlur={handleBlur}
											onChange={(_event, newValue) => {
												setFieldValue("country", newValue === null ? "" : newValue.code);
											}}
											options={countries}
											autoHighlight
											isOptionEqualToValue={(option, value) => option.code === value?.code}
											getOptionLabel={(option) => option.label}
											renderOption={(props, option) => (
												<Box component="li" sx={{ "& > img": { mr: 2, flexShrink: 0 } }} {...props}>
													{option.code && (
														<img
															loading="lazy"
															width="20"
															src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
															srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
															alt=""
														/>
													)}
													{option.label}
													{option.code && `(${option.code}) ${option.phone}`}
												</Box>
											)}
											renderInput={(params) => (
												<TextField
													{...params}
													placeholder="Seleccioná un país"
													name="country"
													error={Boolean(touched.country && errors.country)}
													inputProps={{ ...params.inputProps, autoComplete: "new-password" }}
													sx={inputSx}
												/>
											)}
										/>
										{touched.country && errors.country && (
											<FormHelperText error sx={{ fontSize: "0.7rem" }}>
												{errors.country}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={0.75}>
										<InputLabel htmlFor="personal-state" sx={labelSx}>
											Provincia
										</InputLabel>
										<TextField
											fullWidth
											id="personal-state"
											value={values.state}
											name="state"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Provincia"
											error={Boolean(touched.state && errors.state)}
											sx={inputSx}
										/>
										{touched.state && errors.state && (
											<FormHelperText error sx={{ fontSize: "0.7rem" }}>
												{errors.state}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
							</Grid>
						</Box>

						{hairline}

						{/* Sección: Nota */}
						<SectionHeader eyebrow="Adicional" title="Nota" icon={<Note1 size={16} variant="Bulk" />} />
						<Box sx={{ mt: 2 }}>
							<TextField
								multiline
								rows={5}
								fullWidth
								value={values.note}
								name="note"
								onBlur={handleBlur}
								onChange={handleChange}
								id="personal-note"
								placeholder="Podés agregar notas en este espacio"
								error={Boolean(touched.note && errors.note)}
								sx={inputSx}
							/>
							<Typography
								sx={{
									mt: 0.75,
									fontSize: "0.7rem",
									color: touched.note && errors.note ? theme.palette.error.main : "text.secondary",
									letterSpacing: "-0.005em",
								}}
							>
								{touched.note && errors.note ? errors.note : "Mínimo 5 caracteres si querés agregar una nota."}
							</Typography>

							<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1.25} sx={{ mt: 2.5 }}>
								<Button onClick={() => resetForm()} disabled={isSubmitting || loading} sx={ghostBtnSx}>
									Cancelar
								</Button>
								<Button
									type="submit"
									variant="contained"
									disabled={isSubmitting || loading}
									startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
									sx={brandPrimarySx}
								>
									{loading ? "Guardando..." : "Guardar"}
								</Button>
							</Stack>
						</Box>
					</form>
				)}
			</Formik>
		</MainCard>
	);
};

export default TabPersonal;
