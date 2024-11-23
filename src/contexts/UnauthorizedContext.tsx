import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import { Eye, EyeSlash } from "iconsax-react";
import * as Yup from "yup";
import { Formik } from "formik";
import IconButton from "components/@extended/IconButton";
import useAuth from "hooks/useAuth";
import useScriptRef from "hooks/useScriptRef";
import { dispatch as reduxDispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { GoogleLogin } from "@react-oauth/google";

// Types
interface UnauthorizedContextType {
	showUnauthorizedModal: boolean;
	setShowUnauthorizedModal: (show: boolean) => void;
	handleLogout: () => void;
}

interface UnauthorizedProviderProps {
	children: React.ReactNode;
}

const UnauthorizedContext = createContext<UnauthorizedContextType | null>(null);

const validationSchema = Yup.object().shape({
	email: Yup.string().email("Debe ser un e-mail válido").max(255).required("El e-mail es requerido"),
	password: Yup.string().max(255).required("El password es requerido"),
});

const initialValues = {
	email: "",
	password: "",
	submit: null,
};

export const UnauthorizedProvider: React.FC<UnauthorizedProviderProps> = ({ children }) => {
	const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { logout, login, loginWithGoogle } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const scriptedRef = useScriptRef();

	const handleClickShowPassword = useCallback(() => {
		setShowPassword((prev) => !prev);
	}, []);

	const handleMouseDownPassword = useCallback((event: React.SyntheticEvent) => {
		event.preventDefault();
	}, []);

	useEffect(() => {
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

		return () => {
			axios.interceptors.response.eject(interceptor);
		};
	}, []);

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

	const handleCloseModal = useCallback(async () => {
		try {
			setShowUnauthorizedModal(false);
			await logout();
			showSnackbar("Por favor, inicie sesión nuevamente", "info");
			navigate("/login", {
				state: { from: location.pathname },
				replace: true,
			});
		} catch (error) {
			console.error("Error during modal close:", error);
			showSnackbar("Error al cerrar sesión", "error");
			navigate("/login", {
				state: { from: location.pathname },
				replace: true,
			});
		}
	}, [logout, navigate, location.pathname, showSnackbar]);

	const handleGoogleSuccess = useCallback(
		async (tokenResponse: any) => {
			try {
				await loginWithGoogle(tokenResponse);
				setShowUnauthorizedModal(false);
				showSnackbar("¡Inicio de sesión con Google exitoso!", "success");
			} catch (error) {
				console.error("Error en login con Google:", error);
				showSnackbar("Error al iniciar sesión con Google", "error");
			}
		},
		[loginWithGoogle, showSnackbar],
	);

	const handleGoogleError = useCallback(() => {
		showSnackbar("Error al iniciar sesión con Google", "error");
	}, [showSnackbar]);

	const handleFormSubmit = useCallback(
		async (values: typeof initialValues, { setErrors, setStatus, setSubmitting }: any) => {
			try {
				await login(values.email, values.password);
				if (scriptedRef.current) {
					setStatus({ success: true });
					setSubmitting(false);
					setShowUnauthorizedModal(false);
					showSnackbar("¡Inicio de sesión exitoso!", "success");
				}
			} catch (err: any) {
				console.log("Error en login:", err);

				// Manejar el error sin depender de scriptedRef
				setStatus({ success: false });
				setSubmitting(false);

				// Obtener el mensaje de error
				const errorMessage = err?.response?.data?.message || "Error al iniciar sesión";

				// Mostrar errores
				setErrors({ submit: errorMessage });
				showSnackbar(errorMessage, "error");

				// Cerrar sesión y redirigir después de 3 segundos
				setTimeout(async () => {
					try {
						setShowUnauthorizedModal(false);
						await logout();
						navigate("/login", {
							state: { from: location.pathname },
							replace: true,
						});
					} catch (logoutError) {
						console.error("Error during logout:", logoutError);
						// Redirigir aunque falle el logout
						navigate("/login", {
							state: { from: location.pathname },
							replace: true,
						});
					}
				}, 3000);
			}
		},
		[login, scriptedRef, showSnackbar, navigate, location.pathname],
	);

	return (
		<UnauthorizedContext.Provider
			value={{
				showUnauthorizedModal,
				setShowUnauthorizedModal,
				handleLogout: handleCloseModal,
			}}
		>
			{children}
			<Dialog open={showUnauthorizedModal} onClose={handleCloseModal} maxWidth="xs" fullWidth disableEscapeKeyDown={false}>
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
						{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
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
												placeholder="Ingresa tu password"
											/>
											{touched.password && errors.password && (
												<FormHelperText error id="standard-weight-helper-text-password-login">
													{errors.password}
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
										<Stack spacing={2} sx={{ width: "100%" }}>
											<Button variant="contained" type="submit" fullWidth disabled={isSubmitting}>
												Iniciar Sesión
											</Button>

											<Divider>
												<Typography variant="caption" color="textSecondary">
													O
												</Typography>
											</Divider>

											<Box
												sx={{
													width: "100%",
													"& > div": {
														width: "100% !important",
														display: "flex !important",
														justifyContent: "center !important",
													},
													"& > div > div": {
														width: "100% !important",
													},
													"& > div > div > div": {
														width: "100% !important",
													},
													"& > div > div > div > div": {
														width: "100% !important",
													},
													"& > div > div > div > div > div": {
														width: "100% !important",
													},
													"& > div > div > div > div > div > div": {
														width: "100% !important",
													},
													"& > div > div > div > div > div > div > iframe": {
														width: "100% !important",
														margin: "0 !important",
													},
												}}
											>
												<GoogleLogin
													onSuccess={handleGoogleSuccess}
													onError={handleGoogleError}
													theme="filled_blue"
													size="large"
													shape="rectangular"
													useOneTap={false}
													text="continue_with"
													type="standard"
													width="400"
												/>
											</Box>
											<Box sx={{ width: "100%", mt: 2 }}>
												<Button variant="outlined" color="secondary" onClick={handleCloseModal} fullWidth>
													Cancelar
												</Button>
											</Box>
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
