import React from "react";
import { RefObject, useState } from "react";
import { useOutletContext } from "react-router";

// material-ui
import {
	Autocomplete,
	Box,
	Button,
	CardHeader,
	CircularProgress,
	Divider,
	FormHelperText,
	Grid,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Skeleton,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";

// project-imports
import MainCard from "components/MainCard";
import countries from "data/countries";
import { dispatch, useSelector } from "store";
import { updateUserProfile } from "store/reducers/auth"; // Importamos la acción
import { useFormWithSnackbar } from "hooks/useFormWithSnackbar";

// assets
import dayjs from "utils/dayjs-config";
import { Lock } from "iconsax-react";

// styles & constant

function useInputRef() {
	return useOutletContext<RefObject<HTMLInputElement>>();
}

// ==============================|| USER PROFILE - PERSONAL ||============================== //

const TabPersonal = () => {
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

	// Mostrar skeleton mientras se carga el usuario
	if (!userData.user) {
		return (
			<MainCard content={false} title="Información Personal" sx={{ "& .MuiInputLabel-root": { fontSize: "0.875rem" } }}>
				<CardHeader title="Detalles del Perfil" />
				<Divider />
				<Box sx={{ p: 2.5 }}>
					<Grid container spacing={3}>
						{[1, 2, 3, 4, 5, 6].map((item) => (
							<Grid item xs={12} sm={6} key={item}>
								<Stack spacing={1}>
									<Skeleton variant="text" width="30%" height={20} />
									<Skeleton variant="rounded" height={40} />
								</Stack>
							</Grid>
						))}
						<Grid item xs={12}>
							<Stack direction="row" justifyContent="flex-end" spacing={2}>
								<Skeleton variant="rounded" width={100} height={36} />
								<Skeleton variant="rounded" width={100} height={36} />
							</Stack>
						</Grid>
					</Grid>
				</Box>
			</MainCard>
		);
	}

	// Formatear fecha para inicialización
	const formatInitialDate = () => {
		if (userData.user?.dob) {
			// Extraer los componentes de la fecha en UTC
			const utcDate = dayjs.utc(userData.user.dob);
			const year = utcDate.year();
			const month = utcDate.month();
			const day = utcDate.date();
			// Crear una nueva fecha local con esos componentes exactos
			const parsedDate = dayjs().year(year).month(month).date(day).hour(0).minute(0).second(0).millisecond(0).toDate();

			return parsedDate;
		}
		return null; // Fecha por defecto vacía
	};

	return (
		<MainCard content={false} title="Información Personal" sx={{ "& .MuiInputLabel-root": { fontSize: "0.875rem" } }}>
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
					colleges: (userData.user?.skill as string[]) || [], // Cambiamos skill por colleges
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
						<Box sx={{ p: 2.5 }}>
							<Grid container spacing={3}>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-first-name">Nombre</InputLabel>
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
										/>
										{touched.firstName && errors.firstName && (
											<FormHelperText error id="personal-first-name-helper">
												{errors.firstName}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-last-name">Apellido</InputLabel>
										<TextField
											fullWidth
											id="personal-last-name"
											value={values.lastName}
											name="lastName"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Apellido"
											error={Boolean(touched.lastName && errors.lastName)}
										/>
										{touched.lastName && errors.lastName && (
											<FormHelperText error id="personal-last-name-helper">
												{errors.lastName}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-email">Correo Electrónico</InputLabel>
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
														<Lock size={16} />
													</InputAdornment>
												),
											}}
											helperText="El correo no puede modificarse. Contactá a soporte para cambiarlo."
										/>
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-dob">Fecha de Nacimiento</InputLabel>
										<LocalizationProvider dateAdapter={AdapterDateFns}>
											<DatePicker
												value={values.dob}
												onChange={(newValue) => {
													setFieldValue("dob", newValue);
												}}
												format="dd/MM/yyyy"
												maxDate={new Date()}
												minDate={new Date(1900, 0, 1)}
												sx={{ width: 1 }}
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
											<FormHelperText error id="personal-dob-helper">
												{errors.dob as string}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-phone">Teléfono</InputLabel>
										<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
											<TextField
												fullWidth
												id="personal-contact"
												value={values.contact}
												name="contact"
												onBlur={handleBlur}
												onChange={handleChange}
												placeholder="Número de Contacto"
												error={Boolean(touched.contact && errors.contact)}
											/>
										</Stack>
										{touched.contact && errors.contact && (
											<FormHelperText error id="personal-contact-helper">
												{errors.contact}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-designation">Cargo</InputLabel>
										<Select
											fullWidth
											id="personal-designation"
											value={values.designation}
											name="designation"
											onBlur={handleBlur}
											onChange={handleChange}
											displayEmpty
											error={Boolean(touched.designation && errors.designation)}
											inputProps={{ id: "personal-designation" }}
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
											<FormHelperText error id="personal-designation-helper">
												{errors.designation}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
							</Grid>
						</Box>
						<CardHeader title="Dirección" />
						<Divider />
						<Box sx={{ p: 2.5 }}>
							<Grid container spacing={3}>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-addrees1">Domicilio principal</InputLabel>
										<TextField
											multiline
											rows={3}
											fullWidth
											id="personal-addrees1"
											value={values.address}
											name="address"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Dirección principal"
											error={Boolean(touched.address && errors.address)}
										/>
										{touched.address && errors.address && (
											<FormHelperText error id="personal-address-helper">
												{errors.address}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-addrees2">Domicilio alternativo</InputLabel>
										<TextField
											multiline
											rows={3}
											fullWidth
											id="personal-addrees2"
											value={values.address1}
											name="address1"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Dirección alternativo"
										/>
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-country">País</InputLabel>
										<Autocomplete
											id="personal-country"
											fullWidth
											value={countries.find((item) => item.code === values?.country) || null}
											onBlur={handleBlur}
											onChange={(event, newValue) => {
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
													placeholder="Selecciona un país"
													name="country"
													error={Boolean(touched.country && errors.country)}
													inputProps={{
														...params.inputProps,
														autoComplete: "new-password", // disable autocomplete and autofill
													}}
												/>
											)}
										/>
										{touched.country && errors.country && (
											<FormHelperText error id="personal-country-helper">
												{errors.country}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-state">Provincia</InputLabel>
										<TextField
											fullWidth
											id="personal-state"
											value={values.state}
											name="state"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Provincia"
											error={Boolean(touched.state && errors.state)}
										/>
										{touched.state && errors.state && (
											<FormHelperText error id="personal-state-helper">
												{errors.state}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
							</Grid>
						</Box>
						<CardHeader title="Nota" />
						<Divider />
						<Box sx={{ p: 2.5 }}>
							<TextField
								multiline
								rows={5}
								fullWidth
								value={values.note}
								name="note"
								onBlur={handleBlur}
								onChange={handleChange}
								id="personal-note"
								placeholder="Puede agregar notas en este espacio"
								error={Boolean(touched.note && errors.note)}
								helperText={touched.note && errors.note ? errors.note : "Mínimo 5 caracteres si querés agregar una nota."}
							/>
							<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
								<Button color="error" onClick={() => resetForm()} disabled={isSubmitting || loading}>
									Cancelar
								</Button>
								<Button
									disabled={isSubmitting || loading}
									type="submit"
									variant="contained"
									startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
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
