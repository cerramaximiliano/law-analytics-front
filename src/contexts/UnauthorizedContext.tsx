import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	Button,
	Alert,
	AlertTitle,
	Box,
	Typography,
	Grid,
	Stack,
	InputLabel,
	OutlinedInput,
	FormHelperText,
	InputAdornment,
	Divider,
	CircularProgress,
} from "@mui/material";
import { Eye, EyeSlash } from "iconsax-react";
import * as Yup from "yup";
import { Formik, FormikHelpers } from "formik";
import IconButton from "components/@extended/IconButton";
import useAuth from "hooks/useAuth";
import { dispatch as reduxDispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { GoogleLogin } from "@react-oauth/google";
import { CredentialResponse } from "@react-oauth/google";

// Types
interface UnauthorizedContextType {
	showUnauthorizedModal: boolean;
	setShowUnauthorizedModal: (show: boolean) => void;
	handleLogout: () => void;
}

interface FormValues {
	email: string;
	password: string;
	submit: null;
}

// Create context with type
const UnauthorizedContext = createContext<UnauthorizedContextType | null>(null);

const validationSchema = Yup.object().shape({
	email: Yup.string().email("Debe ser un e-mail válido").required("El e-mail es requerido").trim(),
	password: Yup.string().required("El password es requerido").min(6, "El password debe tener al menos 6 caracteres"),
});

const initialValues: FormValues = {
	email: "",
	password: "",
	submit: null,
};

export const UnauthorizedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submitAttempts = useRef(0);
	const maxRetries = 3;

	const { logout, login, loginWithGoogle } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const showSnackbar = useCallback((message: string, color: "success" | "error" | "info") => {
		reduxDispatch(
			openSnackbar({
				open: true,
				message,
				variant: "alert",
				alert: { color },
				close: false,
			}),
		);
	}, []);

	useEffect(() => {
		if (!showUnauthorizedModal) {
			setIsSubmitting(false);
			submitAttempts.current = 0;
		}
	}, [showUnauthorizedModal]);

	useEffect(() => {
		console.log("interceptor unauth context");
		const interceptor = axios.interceptors.response.use(
			(response) => response,
			(error) => {
				if (error.response?.status === 401 && !error.config.url?.includes("/api/auth/") && !error.config._retry) {
					error.config._retry = true;
					setShowUnauthorizedModal(true);
				}
				return Promise.reject(error);
			},
		);

		return () => axios.interceptors.response.eject(interceptor);
	}, []);

	const handleFormSubmit = async (values: FormValues, { setErrors, setStatus }: FormikHelpers<FormValues>) => {
		if (isSubmitting) return;

		try {
			setIsSubmitting(true);
			submitAttempts.current += 1;

			await validationSchema.validate(values, { abortEarly: false });
			await login(values.email.trim(), values.password);

			setStatus({ success: true });
			setShowUnauthorizedModal(false);
			showSnackbar("¡Inicio de sesión exitoso!", "success");
		} catch (err: any) {
			console.error("Login error:", err);

			setStatus({ success: false });

			const errorMessage = err?.response?.data?.message || err.message || "Error al iniciar sesión";

			setErrors({
				submit: `${errorMessage}${submitAttempts.current >= maxRetries ? ". Demasiados intentos, serás redirigido." : ""}`,
			});

			showSnackbar(errorMessage, "error");

			if (submitAttempts.current >= maxRetries) {
				setTimeout(handleLogout, 2000);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLogout = async () => {
		try {
			setShowUnauthorizedModal(false);
			await logout();
			showSnackbar("Por favor, inicie sesión nuevamente", "info");
		} catch (error) {
			console.error("Logout error:", error);
			showSnackbar("Error al cerrar sesión", "error");
		} finally {
			navigate("/login", {
				state: { from: location.pathname },
				replace: true,
			});
		}
	};

	const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
		try {
			setIsSubmitting(true);
			await loginWithGoogle(credentialResponse);
			setShowUnauthorizedModal(false);
			showSnackbar("¡Inicio de sesión con Google exitoso!", "success");
		} catch (error) {
			console.error("Google login error:", error);
			showSnackbar("Error al iniciar sesión con Google", "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<UnauthorizedContext.Provider
			value={{
				showUnauthorizedModal,
				setShowUnauthorizedModal,
				handleLogout,
			}}
		>
			{children}
			<Dialog open={showUnauthorizedModal} maxWidth="xs" fullWidth disableEscapeKeyDown={isSubmitting}>
				<DialogTitle>
					<Box display="flex" alignItems="center">
						<Typography variant="h5">Sesión Expirada</Typography>
					</Box>
				</DialogTitle>
				<DialogContent>
					<Alert severity="error" sx={{ mb: 2 }}>
						<AlertTitle>No Autorizado</AlertTitle>
						Tu sesión ha expirado o no tienes autorización para acceder a este recurso. Por favor, inicia sesión nuevamente.
					</Alert>

					<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleFormSubmit}>
						{({ errors, handleBlur, handleChange, handleSubmit, touched, values }) => (
							<form noValidate onSubmit={handleSubmit}>
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
												placeholder="Ingresa tu email"
												fullWidth
												error={Boolean(touched.email && errors.email)}
												disabled={isSubmitting}
											/>
											{touched.email && errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
										</Stack>
									</Grid>

									<Grid item xs={12}>
										<Stack spacing={1}>
											<InputLabel htmlFor="password-login">Password</InputLabel>
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
												endAdornment={
													<InputAdornment position="end">
														<IconButton onClick={() => setShowPassword(!showPassword)} edge="end" color="secondary" disabled={isSubmitting}>
															{showPassword ? <Eye /> : <EyeSlash />}
														</IconButton>
													</InputAdornment>
												}
												placeholder="Ingresa tu password"
											/>
											{touched.password && errors.password && <FormHelperText error>{errors.password}</FormHelperText>}
										</Stack>
									</Grid>

									{errors.submit && (
										<Grid item xs={12}>
											<FormHelperText error>{errors.submit}</FormHelperText>
										</Grid>
									)}

									<Grid item xs={12}>
										<Stack spacing={2}>
											<Button variant="contained" type="submit" fullWidth disabled={isSubmitting}>
												{isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Iniciar Sesión"}
											</Button>

											<Divider>
												<Typography variant="caption" color="textSecondary">
													O
												</Typography>
											</Divider>

											<Box sx={{ width: "100%" }}>
												<GoogleLogin
													onSuccess={handleGoogleSuccess}
													onError={() => showSnackbar("Error al iniciar sesión con Google", "error")}
													theme="filled_blue"
													size="large"
													shape="rectangular"
													useOneTap={false}
													text="continue_with"
													type="standard"
													width={400}
												/>
											</Box>

											<Button variant="outlined" color="secondary" onClick={handleLogout} fullWidth disabled={isSubmitting}>
												Cancelar
											</Button>
										</Stack>
									</Grid>
								</Grid>
							</form>
						)}
					</Formik>
				</DialogContent>
			</Dialog>
		</UnauthorizedContext.Provider>
	);
};

export const useUnauthorized = () => {
	const context = useContext(UnauthorizedContext);
	if (!context) {
		throw new Error("useUnauthorized debe ser usado dentro de un UnauthorizedProvider");
	}
	return context;
};

export default UnauthorizedContext;
