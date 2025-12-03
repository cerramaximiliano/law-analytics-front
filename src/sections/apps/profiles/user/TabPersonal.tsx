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
	InputLabel,
	MenuItem,
	Select,
	SelectChangeEvent,
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

// assets
import dayjs from "utils/dayjs-config";

// styles & constant
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
		},
	},
};

function useInputRef() {
	return useOutletContext<RefObject<HTMLInputElement>>();
}

// ==============================|| USER PROFILE - PERSONAL ||============================== //

const TabPersonal = () => {
	const [loading, setLoading] = useState(false);

	const handleChangeDay = (event: SelectChangeEvent<string>, date: Date, setFieldValue: (field: string, value: any) => void) => {
		setFieldValue("dob", new Date(date.setDate(parseInt(event.target.value, 10))));
	};

	const handleChangeMonth = (event: SelectChangeEvent<string>, date: Date, setFieldValue: (field: string, value: any) => void) => {
		setFieldValue("dob", new Date(date.setMonth(parseInt(event.target.value, 10))));
	};

	const maxDate = new Date();
	maxDate.setFullYear(maxDate.getFullYear() - 18);
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
					colleges: userData.user?.skill || [], // Cambiamos skill por colleges
					note: userData.user?.note || "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					firstName: Yup.string().max(255).required("El nombre es requerido"),
					lastName: Yup.string().max(255).required("El apellido es requerido."),
					note: Yup.string().min(5, "La nota debe tener más de 5 caracteres."),
				})}
				onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
					setLoading(true);
					try {
						const formattedDate = dayjs(values.dob).format("YYYY-MM-DD");
						// Preparar datos para enviar al servidor
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
							skill: values.colleges, // Enviamos colleges como skill para mantener compatibilidad
							note: values.note,
						};
						// Utilizamos la acción de Redux para actualizar el perfil
						await dispatch(updateUserProfile(updateData));
						setStatus({ success: true });
					} catch (err: any) {
						setStatus({ success: false });
						setErrors({
							submit: err.response?.data?.message || err.message || "Error al actualizar el perfil",
						});
					} finally {
						setLoading(false);
						setSubmitting(false);
					}
				}}
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
											placeholder="Correo Electrónico"
											disabled
											InputProps={{
												readOnly: true,
											}}
										/>
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="dob-date">Fecha de Nacimiento</InputLabel>
										<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
											<Select
												fullWidth
												displayEmpty
												value={values.dob ? values.dob.getDate().toString() : ""}
												name="dob-date"
												onBlur={handleBlur}
												onChange={(e: SelectChangeEvent<string>) => handleChangeDay(e, values.dob || new Date(), setFieldValue)}
												MenuProps={MenuProps}
												renderValue={(selected) => {
													if (!selected) {
														return <span style={{ color: "#aaa" }}>DD</span>;
													}
													return selected;
												}}
											>
												{[
													1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
												].map((i) => (
													<MenuItem
														key={i}
														value={i}
														disabled={
															values.dob
																? (values.dob.getMonth() === 1 && i > (values.dob.getFullYear() % 4 === 0 ? 29 : 28)) ||
																  (values.dob.getMonth() % 2 !== 0 && values.dob.getMonth() < 7 && i > 30) ||
																  (values.dob.getMonth() % 2 === 0 && values.dob.getMonth() > 7 && i > 30)
																: false
														}
													>
														{i}
													</MenuItem>
												))}
											</Select>

											<Select
												fullWidth
												displayEmpty
												value={values.dob ? values.dob.getMonth().toString() : ""}
												name="dob-month"
												onChange={(e: SelectChangeEvent<string>) => handleChangeMonth(e, values.dob || new Date(), setFieldValue)}
												renderValue={(selected) => {
													if (selected === "") {
														return <span style={{ color: "#aaa" }}>Mes</span>;
													}
													const months = [
														"Enero",
														"Febrero",
														"Marzo",
														"Abril",
														"Mayo",
														"Junio",
														"Julio",
														"Agosto",
														"Septiembre",
														"Octubre",
														"Noviembre",
														"Diciembre",
													];
													return months[parseInt(selected, 10)];
												}}
											>
												<MenuItem value="0">Enero</MenuItem>
												<MenuItem value="1">Febrero</MenuItem>
												<MenuItem value="2">Marzo</MenuItem>
												<MenuItem value="3">Abril</MenuItem>
												<MenuItem value="4">Mayo</MenuItem>
												<MenuItem value="5">Junio</MenuItem>
												<MenuItem value="6">Julio</MenuItem>
												<MenuItem value="7">Agosto</MenuItem>
												<MenuItem value="8">Septiembre</MenuItem>
												<MenuItem value="9">Octubre</MenuItem>
												<MenuItem value="10">Noviembre</MenuItem>
												<MenuItem value="11">Diciembre</MenuItem>
											</Select>

											<LocalizationProvider dateAdapter={AdapterDateFns}>
												<DatePicker
													views={["year"]}
													value={values.dob}
													maxDate={maxDate}
													onChange={(newValue) => {
														setFieldValue("dob", newValue);
													}}
													sx={{ width: 1 }}
													slotProps={{
														textField: {
															placeholder: "AAAA",
														},
													}}
												/>
											</LocalizationProvider>
										</Stack>
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
										<TextField
											fullWidth
											id="personal-designation"
											value={values.designation}
											name="designation"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Cargo"
											error={Boolean(touched.designation && errors.designation)}
										/>
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
										<InputLabel htmlFor="personal-addrees1">Domicilio</InputLabel>
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
										<InputLabel htmlFor="personal-addrees2">Domicilio</InputLabel>
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
							/>
							{touched.note && errors.note && (
								<FormHelperText error id="personal-note-helper">
									{errors.note}
								</FormHelperText>
							)}
							{errors.submit && (
								<Box sx={{ mt: 2 }}>
									<FormHelperText error>{errors.submit}</FormHelperText>
								</Box>
							)}
							<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
								<Button color="error" onClick={() => resetForm()}>
									Cancelar
								</Button>
								<Button
									disabled={isSubmitting || loading || Object.keys(errors).filter((key) => key !== "submit").length !== 0}
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
