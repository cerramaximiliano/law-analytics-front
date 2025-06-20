import { useState, SyntheticEvent } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import {
	Button,
	Checkbox,
	CircularProgress,
	FormControlLabel,
	FormHelperText,
	Grid,
	Link,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	Stack,
	Typography,
} from "@mui/material";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";

// project-imports
import useAuth from "hooks/useAuth";
import useScriptRef from "hooks/useScriptRef";
import IconButton from "components/@extended/IconButton";
import AnimateButton from "components/@extended/AnimateButton";

// assets
import { Eye, EyeSlash } from "iconsax-react";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// ============================|| JWT - LOGIN ||============================ //

const AuthLogin = ({ forgot }: { forgot?: string }) => {
	const [checked, setChecked] = useState(false);

	const { isLoggedIn, login } = useAuth();
	const scriptedRef = useScriptRef();

	const [showPassword, setShowPassword] = useState(false);
	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleMouseDownPassword = (event: SyntheticEvent) => {
		event.preventDefault();
	};

	return (
		<>
			<Formik
				initialValues={{
					email: "",
					password: "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					email: Yup.string().email("Debe ser un e-mail válido").max(255).required("El e-mail es requerido"),
					password: Yup.string().max(255).required("La contraseña es requerida"),
				})}
				onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
					try {
						await login(values.email, values.password);
						if (scriptedRef.current) {
							setStatus({ success: true });
							setSubmitting(false);
						}
					} catch (err: any) {
						if (scriptedRef.current) {
							setStatus({ success: false });

							// Safely extract error message with proper checks
							let errorMessage = "Error al iniciar sesión";

							if (err && err.response && err.response.data && err.response.data.message) {
								errorMessage = err.response.data.message;
							} else if (err && err.message) {
								errorMessage = err.message;
							} else if (typeof err === "string") {
								errorMessage = err;
							}
							dispatch(
								openSnackbar({
									open: true,
									message: errorMessage,
									variant: "alert",
									alert: {
										color: "error",
									},
									close: false,
								}),
							);
							setErrors({ submit: errorMessage });

							setSubmitting(false);
						}
					}
				}}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => {
					// Create a custom submit handler to avoid the persist error
					const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
						e.preventDefault();
						e.stopPropagation();

						// TEMPORARY FIX: Disable Enter key submission due to Formik/InputBase conflict
						// Only allow submission via button click
						return false;
					};

					return (
						<form noValidate onSubmit={onFormSubmit}>
							<Grid container spacing={3}>
								<Grid item xs={12}>
									<Stack spacing={1}>
										<InputLabel htmlFor="email-login">Email</InputLabel>
										<OutlinedInput
											id="email-login"
											type="email"
											value={values.email}
											name="email"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Ingrese su dirección de correo electrónico"
											fullWidth
											error={Boolean(touched.email && errors.email)}
											disabled={isSubmitting}
											autoComplete="email"
											onKeyDown={(e) => {
												// Prevent form submission on Enter in input fields
												if (e.key === "Enter") {
													e.preventDefault();
													e.stopPropagation();
												}
											}}
										/>
										{touched.email && errors.email && (
											<FormHelperText error id="standard-weight-helper-text-email-login">
												{errors.email}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Stack spacing={1}>
										<InputLabel htmlFor="password-login">Contraseña</InputLabel>
										<OutlinedInput
											fullWidth
											error={Boolean(touched.password && errors.password)}
											id="password-login"
											type={showPassword ? "text" : "password"}
											value={values.password}
											name="password"
											onBlur={handleBlur}
											onChange={handleChange}
											disabled={isSubmitting}
											autoComplete="current-password"
											onKeyDown={(e) => {
												// Prevent form submission on Enter in input fields
												if (e.key === "Enter") {
													e.preventDefault();
													e.stopPropagation();
												}
											}}
											endAdornment={
												<InputAdornment position="end">
													<IconButton
														aria-label="toggle password visibility"
														onClick={handleClickShowPassword}
														onMouseDown={handleMouseDownPassword}
														edge="end"
														color="secondary"
														disabled={isSubmitting}
													>
														{showPassword ? <Eye /> : <EyeSlash />}
													</IconButton>
												</InputAdornment>
											}
											placeholder="Ingrese una contraseña"
										/>
										{touched.password && errors.password && (
											<FormHelperText error id="standard-weight-helper-text-password-login">
												{errors.password}
											</FormHelperText>
										)}
									</Stack>
								</Grid>

								<Grid item xs={12} sx={{ mt: -1 }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
										<FormControlLabel
											control={
												<Checkbox
													checked={checked}
													onChange={(event) => setChecked(event.target.checked)}
													name="checked"
													color="primary"
													size="small"
													disabled={isSubmitting}
												/>
											}
											label={<Typography variant="h6">Mantener la sesión abierta</Typography>}
										/>

										<Link variant="h6" component={RouterLink} to={isLoggedIn && forgot ? forgot : "/forgot-password"} color="text.primary">
											Olvidé mi Password
										</Link>
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<AnimateButton>
										<Button
											disableElevation
											disabled={isSubmitting}
											fullWidth
											size="large"
											type="button"
											variant="contained"
											color="primary"
											startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
											onClick={(e) => {
												e.preventDefault();
												if (!isSubmitting) {
													handleSubmit();
												}
											}}
										>
											{isSubmitting ? "Iniciando sesión..." : "Login"}
										</Button>
									</AnimateButton>
								</Grid>
							</Grid>
						</form>
					);
				}}
			</Formik>
		</>
	);
};

export default AuthLogin;
