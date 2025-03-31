import { useState, SyntheticEvent } from "react";

// material-ui
import {
	Box,
	Button,
	FormHelperText,
	Grid,
	InputAdornment,
	InputLabel,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	OutlinedInput,
	Stack,
	Typography,
	CircularProgress,
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import { dispatch } from "store";
import { changeUserPassword } from "store/reducers/auth"; // Importamos la acción
import { isNumber, isLowercaseChar, isUppercaseChar, isSpecialChar, minLength } from "utils/password-validation";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";

// assets
import { Eye, EyeSlash, Minus, TickCircle } from "iconsax-react";

// ==============================|| USER PROFILE - PASSWORD CHANGE ||============================== //

const TabPassword = () => {
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleClickShowOldPassword = () => {
		setShowOldPassword(!showOldPassword);
	};
	const handleClickShowNewPassword = () => {
		setShowNewPassword(!showNewPassword);
	};
	const handleClickShowConfirmPassword = () => {
		setShowConfirmPassword(!showConfirmPassword);
	};

	const handleMouseDownPassword = (event: SyntheticEvent) => {
		event.preventDefault();
	};

	return (
		<MainCard title="Cambiar Contraseña">
			<Formik
				initialValues={{
					old: "",
					password: "",
					confirm: "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					old: Yup.string().required("La contraseña actual es requerida"),
					password: Yup.string()
						.required("La nueva contraseña es requerida")
						.matches(
							/^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/,
							"La contraseña debe contener al menos 8 caracteres, una letra mayúscula, un número y un carácter especial.",
						),
					confirm: Yup.string()
						.required("La confirmación es requerida.")
						.test("confirm", `No coinciden las contraseñas.`, (confirm: string, yup: any) => yup.parent.password === confirm),
				})}
				onSubmit={async (values, { resetForm, setErrors, setStatus, setSubmitting }) => {
					try {
						setLoading(true);

						// Llamar a la acción de cambio de contraseña
						await dispatch(
							changeUserPassword({
								currentPassword: values.old,
								newPassword: values.password,
							}),
						);

						// Si llegamos aquí, la acción fue exitosa
						resetForm();
						setStatus({ success: true });
					} catch (err: any) {
						console.error("Error al cambiar la contraseña:", err);
						setStatus({ success: false });

						// Si el error tiene un mensaje de respuesta del servidor, mostrar ese
						if (err.response && err.response.data && err.response.data.message) {
							setErrors({ submit: err.response.data.message });
						} else {
							setErrors({ submit: err.message || "Error al cambiar la contraseña" });
						}
					} finally {
						setLoading(false);
						setSubmitting(false);
					}
				}}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
					<form noValidate onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid item container spacing={3} xs={12} sm={6}>
								<Grid item xs={12}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="password-old">Contraseña actual</InputLabel>
										<OutlinedInput
											placeholder="Ingrese contraseña actual"
											id="password-old"
											type={showOldPassword ? "text" : "password"}
											value={values.old}
											name="old"
											onBlur={handleBlur}
											onChange={handleChange}
											endAdornment={
												<InputAdornment position="end">
													<IconButton
														aria-label="toggle password visibility"
														onClick={handleClickShowOldPassword}
														onMouseDown={handleMouseDownPassword}
														edge="end"
														size="large"
														color="secondary"
													>
														{showOldPassword ? <Eye /> : <EyeSlash />}
													</IconButton>
												</InputAdornment>
											}
											autoComplete="current-password"
										/>
										{touched.old && errors.old && (
											<FormHelperText error id="password-old-helper">
												{errors.old}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="password-password">Contraseña nueva</InputLabel>
										<OutlinedInput
											placeholder="Ingrese nueva contraseña"
											id="password-password"
											type={showNewPassword ? "text" : "password"}
											value={values.password}
											name="password"
											onBlur={handleBlur}
											onChange={handleChange}
											endAdornment={
												<InputAdornment position="end">
													<IconButton
														aria-label="toggle password visibility"
														onClick={handleClickShowNewPassword}
														onMouseDown={handleMouseDownPassword}
														edge="end"
														size="large"
														color="secondary"
													>
														{showNewPassword ? <Eye /> : <EyeSlash />}
													</IconButton>
												</InputAdornment>
											}
											autoComplete="new-password"
										/>
										{touched.password && errors.password && (
											<FormHelperText error id="password-password-helper">
												{errors.password}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="password-confirm">Confirme contraseña</InputLabel>
										<OutlinedInput
											placeholder="Ingrese contraseña de confirmación"
											id="password-confirm"
											type={showConfirmPassword ? "text" : "password"}
											value={values.confirm}
											name="confirm"
											onBlur={handleBlur}
											onChange={handleChange}
											endAdornment={
												<InputAdornment position="end">
													<IconButton
														aria-label="toggle password visibility"
														onClick={handleClickShowConfirmPassword}
														onMouseDown={handleMouseDownPassword}
														edge="end"
														size="large"
														color="secondary"
													>
														{showConfirmPassword ? <Eye /> : <EyeSlash />}
													</IconButton>
												</InputAdornment>
											}
											autoComplete="new-password"
										/>
										{touched.confirm && errors.confirm && (
											<FormHelperText error id="password-confirm-helper">
												{errors.confirm}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								{errors.submit && (
									<Grid item xs={12}>
										<FormHelperText error>{errors.submit}</FormHelperText>
									</Grid>
								)}
							</Grid>
							<Grid item xs={12} sm={6}>
								<Box sx={{ p: { xs: 0, sm: 2, md: 4, lg: 5 } }}>
									<Typography variant="h5">La nueva contraseña debe contener:</Typography>
									<List sx={{ p: 0, mt: 1 }}>
										<ListItem divider>
											<ListItemIcon sx={{ color: minLength(values.password) ? "success.main" : "inherit" }}>
												{minLength(values.password) ? <TickCircle /> : <Minus />}
											</ListItemIcon>
											<ListItemText primary="Al menos 8 caractéres" />
										</ListItem>
										<ListItem divider>
											<ListItemIcon
												sx={{
													color: isLowercaseChar(values.password) ? "success.main" : "inherit",
												}}
											>
												{isLowercaseChar(values.password) ? <TickCircle /> : <Minus />}
											</ListItemIcon>
											<ListItemText primary="Al menos una letra minúscula (a-z)" />
										</ListItem>
										<ListItem divider>
											<ListItemIcon
												sx={{
													color: isUppercaseChar(values.password) ? "success.main" : "inherit",
												}}
											>
												{isUppercaseChar(values.password) ? <TickCircle /> : <Minus />}
											</ListItemIcon>
											<ListItemText primary="Al menos una letra mayúscula (A-Z)" />
										</ListItem>
										<ListItem divider>
											<ListItemIcon sx={{ color: isNumber(values.password) ? "success.main" : "inherit" }}>
												{isNumber(values.password) ? <TickCircle /> : <Minus />}
											</ListItemIcon>
											<ListItemText primary="Al menos un número (0-9)" />
										</ListItem>
										<ListItem>
											<ListItemIcon sx={{ color: isSpecialChar(values.password) ? "success.main" : "inherit" }}>
												{isSpecialChar(values.password) ? <TickCircle /> : <Minus />}
											</ListItemIcon>
											<ListItemText primary="Al menos un caracter especial" />
										</ListItem>
									</List>
								</Box>
							</Grid>
							<Grid item xs={12}>
								<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
									<Button color="error">Cancelar</Button>
									<Button
										disabled={isSubmitting || loading || Object.keys(errors).length !== 0}
										type="submit"
										variant="contained"
										startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
									>
										{loading ? "Guardando..." : "Guardar"}
									</Button>
								</Stack>
							</Grid>
						</Grid>
					</form>
				)}
			</Formik>
		</MainCard>
	);
};

export default TabPassword;
