import { useState, useRef, FC, useEffect } from "react";
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
import { useGoogleLogin, CredentialResponse } from "@react-oauth/google";
import CustomGoogleButton from "components/auth/CustomGoogleButton";
import { UnauthorizedModalProps, FormValues } from "types/auth";

const validationSchema = Yup.object().shape({
	email: Yup.string().email("Debe ser un e-mail válido").required("El e-mail es requerido").trim(),
	password: Yup.string().required("El password es requerido").min(6, "El password debe tener al menos 6 caracteres"),
});

const initialValues: FormValues = {
	email: "",
	password: "",
	submit: null,
};

export const UnauthorizedModal: FC<UnauthorizedModalProps> = ({ open, onClose, onLogin, onGoogleLogin, onLogout }) => {
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [internalOpen, setInternalOpen] = useState(false);
	const submitAttempts = useRef(0);
	const maxRetries = 3;
	
	// Controlar cuando se muestra el modal para prevenir interacciones no deseadas
	useEffect(() => {
		// Usamos un pequeño retraso para evitar conflictos con otros modales
		const timer = setTimeout(() => {
			setInternalOpen(open);
		}, 100);
		
		return () => clearTimeout(timer);
	}, [open]);
	
	// Escuchar eventos de plan restriction para coordinar con otros modales
	useEffect(() => {
		const handlePlanRestrictionError = () => {
			// Si hay un error de restricción de plan, cerrar temporalmente este modal
			if (internalOpen) {
				setInternalOpen(false);
			}
		};
		
		window.addEventListener("planRestrictionError", handlePlanRestrictionError);
		
		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestrictionError);
		};
	}, [internalOpen]);

	const handleFormSubmit = async (values: FormValues, { setErrors, setStatus }: FormikHelpers<FormValues>) => {
		if (isSubmitting) return;

		try {
			setIsSubmitting(true);
			submitAttempts.current += 1;

			// Validar el formulario
			await validationSchema.validate(values, { abortEarly: false });
			
			// Manejo defensivo para evitar errores de eventos perdidos
			try {
				await onLogin(values.email.trim(), values.password);
				
				setStatus({ success: true });
				// Primero cerramos nuestro estado interno
				setInternalOpen(false);
				// Luego informamos al padre
				setTimeout(() => onClose(), 50);
			} catch (loginErr) {
				throw loginErr;
			}
		} catch (err: unknown) {
			console.error("Login error:", err);

			setStatus({ success: false });

			// Manejar errores con tipado seguro
			let errorMessage = "Error al iniciar sesión";

			if (err instanceof Error) {
				errorMessage = err.message;
			} else if (typeof err === "object" && err !== null) {
				const errorObj = err as { response?: { data?: { message?: string } } };
				if (errorObj.response?.data?.message) {
					errorMessage = errorObj.response.data.message;
				}
			}

			setErrors({
				submit: `${errorMessage}${submitAttempts.current >= maxRetries ? ". Demasiados intentos, serás redirigido." : ""}`,
			});

			if (submitAttempts.current >= maxRetries) {
				// Usar el mismo patrón de cierre seguro
				setInternalOpen(false);
				setTimeout(onLogout, 500);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Método de inicio de sesión con Google - mejorado para evitar errores de eventos
	const handleGoogleSuccess = async (tokenResponse: any) => {
		try {
			setIsSubmitting(true);
			console.log("Token response from Modal:", tokenResponse);
			console.log("Access token Modal:", tokenResponse.access_token);
			console.log("Token type Modal:", typeof tokenResponse.access_token);
			console.log("Token length Modal:", tokenResponse.access_token?.length || 0);

			// Crear un objeto de credencial para mantener la compatibilidad con el sistema existente
			const credentialResponse: CredentialResponse = {
				clientId: tokenResponse.clientId || "",
				credential: tokenResponse.access_token,
				select_by: "user",
			};

			// Manejo defensivo del login para evitar errores de eventos
			try {
				await onGoogleLogin(credentialResponse);
				
				// Primero cerramos nuestro estado interno
				setInternalOpen(false);
				// Luego informamos al padre con un pequeño retraso para evitar conflictos
				setTimeout(() => onClose(), 50);
			} catch (loginError) {
				console.error("Error during Google login callback:", loginError);
			}
		} catch (error) {
			console.error("Google login error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Hook para iniciar sesión con Google - EXACTAMENTE igual al de login.tsx
	const googleLogin = useGoogleLogin({
		onSuccess: handleGoogleSuccess,
		onError: () => {
			console.error("Error al iniciar sesión con Google. Intenta nuevamente.");
			setIsSubmitting(false);
		},
		flow: "implicit",
		scope: "email profile",
	});

	return (
		<Dialog 
			open={internalOpen} 
			maxWidth="xs" 
			fullWidth 
			disableEscapeKeyDown={isSubmitting}
			onClose={() => {
				// Manejo seguro al cerrar el modal
				setInternalOpen(false);
				setTimeout(() => onClose(), 50);
			}}
		>
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
											<CustomGoogleButton
												onClick={() => googleLogin()}
												disabled={isSubmitting}
												text="Iniciar sesión con Google"
												fullWidth
											/>
										</Box>

										<Button 
											variant="outlined" 
											color="secondary" 
											onClick={() => {
												// Manejo seguro para el botón de cancelar
												setInternalOpen(false);
												setTimeout(() => onLogout(), 50);
											}} 
											fullWidth 
											disabled={isSubmitting}
										>
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
	);
};

export default UnauthorizedModal;
