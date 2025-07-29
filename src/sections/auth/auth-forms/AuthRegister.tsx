import { useEffect, useState, SyntheticEvent } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import {
	Box,
	Button,
	FormControl,
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

import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { setNeedsVerification } from "store/reducers/auth";
import { strengthColor, strengthIndicator } from "utils/password-strength";

// types
import { StringColorProps } from "types/password";

// assets
import { Eye, EyeSlash } from "iconsax-react";

// ============================|| JWT - REGISTER ||============================ //

const AuthRegister = () => {
	const { register } = useAuth();
	const scriptedRef = useScriptRef();
	// La navegación se hará con window.location.href
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	//const navigate = useNavigate();

	const [level, setLevel] = useState<StringColorProps>();
	const [showPassword, setShowPassword] = useState(false);
	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleMouseDownPassword = (event: SyntheticEvent) => {
		event.preventDefault();
	};

	const changePassword = (value: string) => {
		const temp = strengthIndicator(value);
		setLevel(strengthColor(temp));
	};

	useEffect(() => {
		changePassword("");
	}, []);

	return (
		<>
			<Formik
				initialValues={{
					firstname: "",
					lastname: "",
					email: "",
					company: "",
					password: "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					firstname: Yup.string().max(255).required("El nombre es requerido"),
					lastname: Yup.string().max(255).required("El apellido es requerido"),
					email: Yup.string().email("Debe ser un correo válido").max(255).required("El correo es requerido"),
					password: Yup.string().max(255).required("El password es requerido"),
				})}
				onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
					try {
						await register(values.email, values.password, values.firstname, values.lastname);
						if (scriptedRef.current) {
							setStatus({ success: true });
							setSubmitting(false);
							dispatch(
								openSnackbar({
									open: true,
									message: "!Tu registro se ha completado!.",
									variant: "alert",
									alert: {
										color: "success",
									},
									close: true,
								}),
							);
							// Redirigir a la ruta según `needsVerification`
							// Redirigir a la ruta de verificación de código

							// Forzamos la verificación y la redirección independientemente de lo que venga del backend
							dispatch(setNeedsVerification(values.email));

							// Redirección directa - usar window.location para garantizar que el navegador haga una carga completa

							// Usar un timeout para asegurar que el estado se actualice antes de la redirección
							setTimeout(() => {
								window.location.href = "/code-verification?email=" + encodeURIComponent(values.email) + "&mode=register";
							}, 500);
						}
					} catch (err: any) {
						if (scriptedRef.current) {
							setStatus({ success: false });
							setTimeout(() => {
								setErrors({ submit: err.response.data.message });
							}, 1);
							setSubmitting(false);
						}
					}
				}}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
					<form noValidate onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<Stack spacing={1}>
									<InputLabel htmlFor="firstname-signup">Nombre*</InputLabel>
									<OutlinedInput
										id="firstname-login"
										type="firstname"
										value={values.firstname}
										name="firstname"
										onBlur={handleBlur}
										onChange={handleChange}
										placeholder="John"
										fullWidth
										error={Boolean(touched.firstname && errors.firstname)}
									/>
									{touched.firstname && errors.firstname && (
										<FormHelperText error id="helper-text-firstname-signup">
											{errors.firstname}
										</FormHelperText>
									)}
								</Stack>
							</Grid>
							<Grid item xs={12} md={6}>
								<Stack spacing={1}>
									<InputLabel htmlFor="lastname-signup">Apellido*</InputLabel>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.lastname && errors.lastname)}
										id="lastname-signup"
										type="lastname"
										value={values.lastname}
										name="lastname"
										onBlur={handleBlur}
										onChange={handleChange}
										placeholder="Doe"
										inputProps={{}}
									/>
									{touched.lastname && errors.lastname && (
										<FormHelperText error id="helper-text-lastname-signup">
											{errors.lastname}
										</FormHelperText>
									)}
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="company-signup">Empresa/Estudio</InputLabel>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.company && errors.company)}
										id="company-signup"
										value={values.company}
										name="company"
										onBlur={handleBlur}
										onChange={handleChange}
										placeholder="Demo Inc."
										inputProps={{}}
									/>
									{touched.company && errors.company && (
										<FormHelperText error id="helper-text-company-signup">
											{errors.company}
										</FormHelperText>
									)}
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="email-signup">Email*</InputLabel>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.email && errors.email)}
										id="email-login"
										type="email"
										value={values.email}
										name="email"
										onBlur={handleBlur}
										onChange={handleChange}
										placeholder="demo@company.com"
										inputProps={{}}
									/>
									{touched.email && errors.email && (
										<FormHelperText error id="helper-text-email-signup">
											{errors.email}
										</FormHelperText>
									)}
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="password-signup">Password</InputLabel>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.password && errors.password)}
										id="password-signup"
										type={showPassword ? "text" : "password"}
										value={values.password}
										name="password"
										onBlur={handleBlur}
										onChange={(e) => {
											handleChange(e);
											changePassword(e.target.value);
										}}
										endAdornment={
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={handleClickShowPassword}
													onMouseDown={handleMouseDownPassword}
													edge="end"
													color="secondary"
												>
													{showPassword ? <Eye /> : <EyeSlash />}
												</IconButton>
											</InputAdornment>
										}
										placeholder="******"
										inputProps={{}}
									/>
									{touched.password && errors.password && (
										<FormHelperText error id="helper-text-password-signup">
											{errors.password}
										</FormHelperText>
									)}
								</Stack>
								<FormControl fullWidth sx={{ mt: 2 }}>
									<Grid container spacing={2} alignItems="center">
										<Grid item>
											<Box sx={{ bgcolor: level?.color, width: 85, height: 8, borderRadius: "7px" }} />
										</Grid>
										<Grid item>
											<Typography variant="subtitle1" fontSize="0.75rem">
												{level?.label}
											</Typography>
										</Grid>
									</Grid>
								</FormControl>
							</Grid>
							<Grid item xs={12}>
								<Typography variant="body2">
									Registrándose, está de acuerdo con &nbsp;
									<Link variant="subtitle2" component={RouterLink} to="/terms" target="_blank" rel="noopener noreferrer">
										Términos del Servicio
									</Link>
									&nbsp; y &nbsp;
									<Link variant="subtitle2" component={RouterLink} to="/privacy-policy" target="_blank" rel="noopener noreferrer">
										Política de Privacidad
									</Link>
								</Typography>
							</Grid>
							{errors.submit && (
								<Grid item xs={12}>
									<FormHelperText error>{errors.submit}</FormHelperText>
								</Grid>
							)}
							<Grid item xs={12}>
								<AnimateButton>
									<Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
										Crear una Cuenta
									</Button>
								</AnimateButton>
							</Grid>
						</Grid>
					</form>
				)}
			</Formik>
		</>
	);
};

export default AuthRegister;
