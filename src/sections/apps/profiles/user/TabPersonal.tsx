import { RefObject } from "react";
import { useOutletContext } from "react-router";

// material-ui
import {
	Autocomplete,
	Box,
	Button,
	CardHeader,
	Chip,
	Divider,
	FormHelperText,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	SelectChangeEvent,
	Stack,
	TextField,
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
import { openSnackbar } from "store/reducers/snackbar";

// assets
import { Add } from "iconsax-react";

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

const skills = [
	"Adobe XD",
	"After Effect",
	"Angular",
	"Animación",
	"ASP.Net",
	"Bootstrap",
	"C#",
	"CC",
	"Corel Draw",
	"CSS",
	"DIV",
	"Dreamweaver",
	"Figma",
	"Gráficos",
	"HTML",
	"Illustrator",
	"J2Ee",
	"Java",
	"Javascript",
	"JQuery",
	"Diseño de Logotipos",
	"Material UI",
	"Motion",
	"MVC",
	"MySQL",
	"NodeJS",
	"npm",
	"Photoshop",
	"PHP",
	"React",
	"Redux",
	"Reduxjs & toolkit",
	"SASS",
	"SCSS",
	"SQL Server",
	"SVG",
	"UI/UX",
	"Diseño de Interfaz de Usuario",
	"Wordpress",
];

function useInputRef() {
	return useOutletContext<RefObject<HTMLInputElement>>();
}

// ==============================|| USER PROFILE - PERSONAL ||============================== //

const TabPersonal = () => {
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

	return (
		<MainCard content={false} title="Información Personal" sx={{ "& .MuiInputLabel-root": { fontSize: "0.875rem" } }}>
			<Formik
				initialValues={{
					firstname: userData.user?.firstName || "",
					lastname: userData.user?.lastName || "",
					email: userData.user?.email || "",
					dob: new Date("03-10-1993"),
					countryCode: "+91",
					contact: userData.user?.contact || "",
					designation: userData.user?.designation || "",
					address: userData.user?.address || "",
					address1: userData.user?.address1 || "",
					country: userData.user?.country || "",
					state: userData.user?.state || "",
					skill: userData.user?.skill || "",
					note: userData.user?.note || "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					firstname: Yup.string().max(255).required("El nombre es requerido"),
					lastname: Yup.string().max(255).required("El apellido es requerido."),
					email: Yup.string().email("Correo electrónico inválido.").max(255).required("El correo electrónico es requerido."),
					dob: Yup.date().max(maxDate, "La edad debe ser mayor de 18 años.").required("La fecha de nacimiento es requerida."),
					contact: Yup.number()
						.test("len", "El número de contacto debe tener exactamente 10 dígitos", (val) => val?.toString().length === 10)
						.required("El número de teléfono es requerido"),
					designation: Yup.string().required("La designación es requerida"),
					address: Yup.string().min(50, "La dirección es demasiado corta.").required("La dirección es requerida"),
					country: Yup.string().required("El país es requerido"),
					state: Yup.string().required("El estado es requerido"),
					note: Yup.string().min(150, "La nota debe tener más de 150 caracteres."),
				})}
				onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
					try {
						dispatch(
							openSnackbar({
								open: true,
								message: "Perfil profesional actualizado satisfactoriamente.",
								variant: "alert",
								alert: {
									color: "success",
								},
								close: false,
							}),
						);
						setStatus({ success: false });
						setSubmitting(false);
					} catch (err: any) {
						setStatus({ success: false });
						setErrors({ submit: err.message });
						setSubmitting(false);
					}
				}}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, setFieldValue, touched, values }) => (
					<form noValidate onSubmit={handleSubmit}>
						<Box sx={{ p: 2.5 }}>
							<Grid container spacing={3}>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="personal-first-name">Nombre</InputLabel>
										<TextField
											fullWidth
											id="personal-first-name"
											value={values.firstname}
											name="firstname"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Nombre"
											autoFocus
											inputRef={inputRef}
										/>
										{touched.firstname && errors.firstname && (
											<FormHelperText error id="personal-first-name-helper">
												{errors.firstname}
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
											value={values.lastname}
											name="lastname"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Apellido"
										/>
										{touched.lastname && errors.lastname && (
											<FormHelperText error id="personal-last-name-helper">
												{errors.lastname}
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
											onBlur={handleBlur}
											onChange={handleChange}
											id="personal-email"
											placeholder="Correo Electrónico"
										/>
										{touched.email && errors.email && (
											<FormHelperText error id="personal-email-helper">
												{errors.email}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="dob-month">Fecha de Nacimiento</InputLabel>
										<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
											<Select
												fullWidth
												value={values.dob.getMonth().toString()}
												name="dob-month"
												onChange={(e: SelectChangeEvent<string>) => handleChangeMonth(e, values.dob, setFieldValue)}
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
											<Select
												fullWidth
												value={values.dob.getDate().toString()}
												name="dob-date"
												onBlur={handleBlur}
												onChange={(e: SelectChangeEvent<string>) => handleChangeDay(e, values.dob, setFieldValue)}
												MenuProps={MenuProps}
											>
												{[
													1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
												].map((i) => (
													<MenuItem
														key={i}
														value={i}
														disabled={
															(values.dob.getMonth() === 1 && i > (values.dob.getFullYear() % 4 === 0 ? 29 : 28)) ||
															(values.dob.getMonth() % 2 !== 0 && values.dob.getMonth() < 7 && i > 30) ||
															(values.dob.getMonth() % 2 === 0 && values.dob.getMonth() > 7 && i > 30)
														}
													>
														{i}
													</MenuItem>
												))}
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
												/>
											</LocalizationProvider>
										</Stack>
										{touched.dob && errors.dob && (
											<FormHelperText error id="personal-dob-helper">
												{errors.dob as String}
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
											value={countries.filter((item) => item.code === values?.country)[0]}
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
						<CardHeader title="Campos" />
						<Divider />
						<Box sx={{ display: "flex", flexWrap: "wrap", listStyle: "none", p: 2.5, m: 0 }} component="ul">
							<Autocomplete
								multiple
								fullWidth
								id="tags-outlined"
								options={skills}
								value={Array.isArray(values.skill) ? values.skill : [values.skill]}
								onBlur={handleBlur}
								getOptionLabel={(label) => label}
								onChange={(event, newValue) => {
									setFieldValue("skill", newValue);
								}}
								renderInput={(params) => <TextField {...params} name="skill" placeholder="Agregar habilidades" />}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => (
										<Chip
											{...getTagProps({ index })}
											variant="combined"
											label={option}
											deleteIcon={<Add style={{ fontSize: "0.75rem", transform: "rotate(45deg)" }} />}
											sx={{ color: "text.primary" }}
										/>
									))
								}
								sx={{
									"& .MuiOutlinedInput-root": {
										p: 0,
										"& .MuiAutocomplete-tag": {
											m: 1,
										},
										"& fieldset": {
											display: "none",
										},
										"& .MuiAutocomplete-endAdornment": {
											display: "none",
										},
										"& .MuiAutocomplete-popupIndicator": {
											display: "none",
										},
									},
								}}
							/>
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
								placeholder="Nota"
							/>
							{touched.note && errors.note && (
								<FormHelperText error id="personal-note-helper">
									{errors.note}
								</FormHelperText>
							)}
							<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
								<Button variant="outlined" color="secondary">
									Cancelar
								</Button>
								<Button disabled={isSubmitting || Object.keys(errors).length !== 0} type="submit" variant="contained">
									Guardar
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
