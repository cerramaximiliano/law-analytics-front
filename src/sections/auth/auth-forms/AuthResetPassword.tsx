import React from "react";
import { useEffect, useState, SyntheticEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// material-ui
import {
	Box,
	Button,
	FormControl,
	FormHelperText,
	Grid,
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
import secureStorage from "services/secureStorage";

import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { strengthColor, strengthIndicator } from "utils/password-strength";

// types
import { StringColorProps } from "types/password";

// assets
import { Eye, EyeSlash } from "iconsax-react";

// ============================|| RESET PASSWORD ||============================ //

const AuthResetPassword = () => {
	const scriptedRef = useScriptRef();
	const navigate = useNavigate();
	const location = useLocation();

	const auth = useAuth();
	if (!auth) {
		throw new Error("Auth context is not available");
	}

	const { setNewPassword } = auth;

	// Obtener el email y código de verificación desde location state
	const locationState = location.state as {
		email?: string;
		code?: string;
		verified?: boolean;
		from?: string;
	} | null;

	// Obtener datos de sessionStorage
	const storedEmail = secureStorage.getSessionData<string>("reset_email");
	const storedCode = secureStorage.getSessionData<string>("reset_code");
	const storedVerified = secureStorage.getSessionData<boolean>("reset_verified") === true;

	// Usar datos de location.state o localStorage
	const email = locationState?.email || storedEmail;
	const code = locationState?.code || storedCode;
	const verified = locationState?.verified || storedVerified;

	// Log para depuración

	const [level, setLevel] = useState<StringColorProps>();
	const [showPassword, setShowPassword] = useState(false);
	const [redirected, setRedirected] = useState(false);

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

		// IMPORTANTE: Solo redireccionar una vez para evitar ciclos infinitos
		if (!redirected && !verified && !storedVerified) {
			setRedirected(true);
			// Intentar determinar la ruta correcta
			const forgotPasswordPath = "/forgot-password";
			navigate(forgotPasswordPath);
		}
	}, []);

	// Si no hay información de verificación, mostrar mensaje
	if (!email || !code || (!verified && !storedVerified)) {
		return (
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<Typography variant="h3" textAlign="center" gutterBottom>
						Información incompleta
					</Typography>
					<Typography variant="body1" textAlign="center" gutterBottom>
						Se requiere verificación antes de restablecer la contraseña.
					</Typography>
				</Grid>
				<Grid item xs={12}>
					<AnimateButton>
						<Button
							disableElevation
							fullWidth
							size="large"
							variant="contained"
							color="primary"
							onClick={() => navigate("/forgot-password")}
						>
							Solicitar restablecimiento
						</Button>
					</AnimateButton>
				</Grid>
			</Grid>
		);
	}

	return (
		<>
			<Stack sx={{ mb: { xs: -0.5, sm: 0.5 } }} spacing={1}>
				<Typography variant="h3">Reseteo de Password</Typography>
				<Typography color="secondary">Ingrese un nuevo Password</Typography>
			</Stack>
			<Formik
				initialValues={{
					password: "",
					confirmPassword: "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					password: Yup.string().max(255).required("La contraseña es requerida"),
					confirmPassword: Yup.string()
						.required("La confirmación de contraseña es requerida")
						.test(
							"confirmPassword",
							"Ambas constraseñas deben ser iguales",
							(confirmPassword, yup) => yup.parent.password === confirmPassword,
						),
				})}
				onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
					try {
						if (!email || !code) {
							throw new Error("Información de verificación incompleta");
						}

						// Usar la función del provider para cambiar la contraseña
						const success = await setNewPassword(email, code, values.password);

						if (success && scriptedRef.current) {
							setStatus({ success: true });
							setSubmitting(false);

							// Limpiar datos de localStorage
							// Limpiar todos los datos del proceso de reseteo
							secureStorage.removeSessionData("reset_email");
							secureStorage.removeSessionData("reset_code");
							secureStorage.removeSessionData("reset_verified");
							secureStorage.removeSessionData("reset_in_progress");

							// Mensaje de éxito
							dispatch(
								openSnackbar({
									open: true,
									message: "Contraseña restablecida con éxito.",
									variant: "alert",
									alert: {
										color: "success",
									},
									close: false,
								}),
							);

							// Redirigir al login después de restablecer la contraseña
							setTimeout(() => {
								navigate("/login", { replace: true });
							}, 1500);
						}
					} catch (err: any) {
						if (scriptedRef.current) {
							setStatus({ success: false });
							setErrors({ submit: err.message });
							setSubmitting(false);
						}
					}
				}}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
					<form noValidate onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="password-reset">Password</InputLabel>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.password && errors.password)}
										id="password-reset"
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
										placeholder="Enter password"
									/>
									{touched.password && errors.password && (
										<FormHelperText error id="helper-text-password-reset">
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
								<Stack spacing={1}>
									<InputLabel htmlFor="confirm-password-reset">Confirmar Password</InputLabel>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.confirmPassword && errors.confirmPassword)}
										id="confirm-password-reset"
										type="password"
										value={values.confirmPassword}
										name="confirmPassword"
										onBlur={handleBlur}
										onChange={handleChange}
										placeholder="Enter confirm password"
									/>
									{touched.confirmPassword && errors.confirmPassword && (
										<FormHelperText error id="helper-text-confirm-password-reset">
											{errors.confirmPassword}
										</FormHelperText>
									)}
								</Stack>
							</Grid>

							{errors.submit && (
								<Grid item xs={12}>
									<FormHelperText error>{errors.submit}</FormHelperText>
								</Grid>
							)}
							<Grid item xs={12}>
								<AnimateButton>
									<Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
										Resetear Password
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

export default AuthResetPassword;
