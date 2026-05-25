import React from "react";
import { useState, useRef, SyntheticEvent } from "react";

// material-ui
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	FormControl,
	FormHelperText,
	Grid,
	InputAdornment,
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
import { trackSignUp, trackRegisterFormStart, trackRegisterFormSubmit, trackRegisterFormError } from "utils/gtm";

// types
import { StringColorProps } from "types/password";

// assets
import { Eye, EyeSlash, Sms, Lock } from "iconsax-react";

// ============================|| JWT - REGISTER ||============================ //

interface AuthRegisterProps {
	source?: string;
	feature?: string;
}

const AuthRegister = ({ source, feature }: AuthRegisterProps) => {
	const { register } = useAuth();
	const scriptedRef = useScriptRef();
	// La navegación se hará con window.location.href
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	//const navigate = useNavigate();

	const [level, setLevel] = useState<StringColorProps>();
	const [showPassword, setShowPassword] = useState(false);
	const formStartedRef = useRef(false);

	const fireFormStartOnce = () => {
		if (!formStartedRef.current) {
			formStartedRef.current = true;
			trackRegisterFormStart(source, feature);
		}
	};
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

	return (
		<>
			<Formik
				initialValues={{
					email: "",
					password: "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					email: Yup.string().email("Debe ser un correo válido").max(255).required("El correo es requerido"),
					password: Yup.string().min(8, "Mínimo 8 caracteres").max(255).required("El password es requerido"),
				})}
				onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
					trackRegisterFormSubmit("email", source, feature);
					try {
						await register(values.email, values.password);
						if (scriptedRef.current) {
							setStatus({ success: true });
							setSubmitting(false);

							// Track successful sign up with email
							trackSignUp("email", source, feature);

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
						const apiMessage = err?.response?.data?.message;
						const errorType = err?.response?.status ? `api_${err.response.status}` : "api_network";
						trackRegisterFormError(errorType, apiMessage, source);
						if (scriptedRef.current) {
							setStatus({ success: false });
							setTimeout(() => {
								setErrors({ submit: apiMessage });
							}, 1);
							setSubmitting(false);
						}
					}
				}}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
					<form noValidate onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							{errors.submit && (
								<Grid item xs={12}>
									<Alert severity="error" sx={{ py: 0.5 }}>
										{errors.submit}
									</Alert>
								</Grid>
							)}
							<Grid item xs={12}>
								<Stack spacing={0.5}>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.email && errors.email)}
										id="email-login"
										type="email"
										value={values.email}
										name="email"
										onBlur={handleBlur}
										onChange={(e) => {
											fireFormStartOnce();
											handleChange(e);
										}}
										placeholder="nombre@estudio.com"
										startAdornment={
											<InputAdornment position="start">
												<Sms size={20} color="#8c8c8c" />
											</InputAdornment>
										}
										sx={{ "& input": { py: 1.5 } }}
										inputProps={{
											inputMode: "email",
											autoCapitalize: "off",
											autoCorrect: "off",
										}}
									/>
									{touched.email && errors.email && (
										<FormHelperText error id="helper-text-email-signup">
											{errors.email}
										</FormHelperText>
									)}
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={0.5}>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.password && errors.password)}
										id="password-signup"
										type={showPassword ? "text" : "password"}
										value={values.password}
										name="password"
										onBlur={handleBlur}
										onChange={(e) => {
											fireFormStartOnce();
											handleChange(e);
											changePassword(e.target.value);
										}}
										startAdornment={
											<InputAdornment position="start">
												<Lock size={20} color="#8c8c8c" />
											</InputAdornment>
										}
										endAdornment={
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={handleClickShowPassword}
													onMouseDown={handleMouseDownPassword}
													edge="end"
													color="secondary"
													sx={{ minWidth: 44, minHeight: 44 }}
												>
													{showPassword ? <Eye /> : <EyeSlash />}
												</IconButton>
											</InputAdornment>
										}
										placeholder="Elegí una contraseña"
										sx={{ "& input": { py: 1.5 } }}
										inputProps={{
											autoCapitalize: "off",
											autoCorrect: "off",
											spellCheck: "false",
										}}
									/>
									<Typography variant="caption" color="text.secondary">
										8+ caracteres
									</Typography>
									{touched.password && errors.password && (
										<FormHelperText error id="helper-text-password-signup">
											{errors.password}
										</FormHelperText>
									)}
								</Stack>
								{values.password.length >= 3 && (
									<FormControl fullWidth sx={{ mt: 1 }}>
										<Grid container spacing={2} alignItems="center">
											<Grid item>
												<Box sx={{ bgcolor: level?.color, width: 85, height: 8, borderRadius: "7px" }} />
											</Grid>
											<Grid item>
												<Typography variant="subtitle1" fontSize="0.75rem" color="text.secondary">
													{level?.label}
												</Typography>
											</Grid>
										</Grid>
									</FormControl>
								)}
							</Grid>
							<Grid item xs={12}>
								<AnimateButton>
									<Button
										disableElevation
										disabled={isSubmitting}
										fullWidth
										size="large"
										type="submit"
										variant="contained"
										color="primary"
										startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
									>
										{isSubmitting ? "Creando..." : "Empezar gratis ahora"}
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
