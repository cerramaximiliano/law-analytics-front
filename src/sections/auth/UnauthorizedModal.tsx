import React from "react";
import { useState, useRef, FC, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	Button,
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
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Eye, EyeSlash, ShieldCross, InfoCircle } from "iconsax-react";
import * as Yup from "yup";
import { Formik, FormikHelpers } from "formik";
import IconButton from "components/@extended/IconButton";
import { useGoogleLogin, CredentialResponse } from "@react-oauth/google";
import CustomGoogleButton from "components/auth/CustomGoogleButton";
import { UnauthorizedModalProps, FormValues } from "types/auth";
import { useDispatch } from "react-redux";
import { openSnackbar } from "store/reducers/snackbar";
import { AppDispatch } from "store";
import { requestQueueService } from "services/requestQueueService";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";

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
	const [queuedRequests, setQueuedRequests] = useState(0);
	const submitAttempts = useRef(0);
	const maxRetries = 3;
	const reduxDispatch = useDispatch<AppDispatch>();

	// Controlar cuando se muestra el modal para prevenir interacciones no deseadas
	useEffect(() => {
		// Usamos un pequeño retraso para evitar conflictos con otros modales
		const timer = setTimeout(() => {
			setInternalOpen(open);
			// Reiniciar el contador de intentos cuando se abre el modal
			if (open) {
				submitAttempts.current = 0;
				// Actualizar el número de peticiones en cola
				setQueuedRequests(requestQueueService.getQueueLength());
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [open]);

	// Monitorear cambios en la cola de peticiones
	useEffect(() => {
		const unsubscribe = requestQueueService.subscribe(() => {
			setQueuedRequests(requestQueueService.getQueueLength());
		});

		return unsubscribe;
	}, []);

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

	// Función para mostrar snackbar
	const showSnackbar = (message: string, color: "success" | "error" | "info") => {
		reduxDispatch(
			openSnackbar({
				open: true,
				message,
				variant: "alert",
				alert: { color },
				close: false,
			}),
		);
	};

	const handleFormSubmit = async (values: FormValues, { setStatus }: FormikHelpers<FormValues>) => {
		if (isSubmitting) return;

		try {
			setIsSubmitting(true);

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
			// Incrementar contador de intentos solo cuando hay un error de login
			submitAttempts.current += 1;

			setStatus({ success: false });

			// Manejar errores con tipado seguro y traducirlos a mensajes amigables en español
			let errorMessage = "Error al iniciar sesión";

			if (err instanceof Error) {
				// Traducir mensajes de error técnicos a español amigable
				const errorMsg = err.message;
				if (errorMsg.includes("Invalid credentials") || errorMsg.includes("Unauthorized") || errorMsg.includes("401")) {
					errorMessage = "Credenciales inválidas. Por favor verifica tu email y contraseña";
				} else if (errorMsg.includes("Network Error") || errorMsg.includes("timeout")) {
					errorMessage = "Error de conexión. Por favor verifica tu internet y vuelve a intentarlo";
				} else if (errorMsg.includes("404")) {
					errorMessage = "El servicio no está disponible en este momento";
				} else if (errorMsg.includes("500")) {
					errorMessage = "Error en el servidor. Por favor intenta más tarde";
				} else if (errorMsg.includes("Request failed with status code")) {
					errorMessage = "Error de comunicación con el servidor. Por favor intenta más tarde";
				} else {
					// Mantener el mensaje original solo si no pudimos traducirlo
					errorMessage = errorMsg;
				}
			} else if (typeof err === "object" && err !== null) {
				const errorObj = err as { response?: { data?: { message?: string; status?: number } } };
				if (errorObj.response?.data?.message) {
					const serverMessage = errorObj.response.data.message;
					// Traducir mensajes comunes del servidor
					if (serverMessage.includes("Invalid credentials") || serverMessage.includes("invalid")) {
						errorMessage = "Credenciales inválidas. Por favor verifica tu email y contraseña";
					} else if (serverMessage.includes("expired")) {
						errorMessage = "Tu sesión ha expirado. Por favor inicia sesión nuevamente";
					} else {
						errorMessage = serverMessage;
					}
				} else if (errorObj.response?.data?.status === 401) {
					errorMessage = "No autorizado. Por favor verifica tus credenciales";
				}
			}

			// Calcular intentos restantes después de incrementar
			//const remainingAttempts = maxRetries - submitAttempts.current;

			// Mostrar error mediante snackbar en lugar de dentro del modal
			showSnackbar(`${errorMessage}. Intento ${submitAttempts.current} de ${maxRetries}.`, "error");

			if (submitAttempts.current >= maxRetries) {
				showSnackbar("Demasiados intentos fallidos. Serás redirigido al inicio en unos segundos", "error");
				// Usar el mismo patrón de cierre seguro pero con más tiempo para leer
				setInternalOpen(false);
				setTimeout(onLogout, 3000);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Método de inicio de sesión con Google - mejorado para evitar errores de eventos
	const handleGoogleSuccess = async (tokenResponse: any) => {
		try {
			setIsSubmitting(true);

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
				// Simplemente redirigir el error al catch externo sin incrementar submitAttempts
				throw loginError;
			}
		} catch (error) {
			// Incrementar contador de intentos solo cuando hay un error de login
			submitAttempts.current += 1;

			// Formatear el mensaje de error
			let errorMessage = "Error al iniciar sesión con Google";

			if (error instanceof Error) {
				// Traducir mensajes de error técnicos a español amigable
				const errorMsg = error.message;
				if (errorMsg.includes("Invalid credentials") || errorMsg.includes("Unauthorized") || errorMsg.includes("401")) {
					errorMessage = "Credenciales de Google inválidas. Por favor intenta nuevamente";
				} else if (errorMsg.includes("Network Error") || errorMsg.includes("timeout")) {
					errorMessage = "Error de conexión con Google. Por favor verifica tu internet";
				} else if (errorMsg.includes("404")) {
					errorMessage = "El servicio de autenticación no está disponible en este momento";
				} else if (errorMsg.includes("500")) {
					errorMessage = "Error en el servidor de autenticación. Por favor intenta más tarde";
				} else if (errorMsg.includes("Request failed with status code")) {
					errorMessage = "Error de comunicación con el servidor de autenticación";
				} else if (errorMsg.includes("popup")) {
					errorMessage = "La ventana de Google fue cerrada. Por favor intenta nuevamente";
				} else {
					// Mantener un mensaje genérico si no pudimos traducirlo
					errorMessage = "Error al iniciar sesión con Google. Por favor intenta nuevamente";
				}
			} else if (typeof error === "object" && error !== null) {
				const errorObj = error as { response?: { data?: { message?: string } } };
				if (errorObj.response?.data?.message) {
					const serverMessage = errorObj.response.data.message;
					// Traducir mensajes comunes del servidor
					if (serverMessage.includes("Invalid") || serverMessage.includes("invalid")) {
						errorMessage = "Credenciales de Google inválidas. Por favor intenta nuevamente";
					} else if (serverMessage.includes("expired")) {
						errorMessage = "Tu sesión con Google ha expirado. Por favor inicia sesión nuevamente";
					} else {
						errorMessage = "Error al iniciar sesión con Google. Por favor intenta nuevamente";
					}
				}
			}

			// Calcular intentos restantes
			//const remainingAttempts = maxRetries - submitAttempts.current;

			showSnackbar(`${errorMessage}. Intento ${submitAttempts.current} de ${maxRetries}.`, "error");

			// Verificar si ha excedido el máximo de intentos
			if (submitAttempts.current >= maxRetries) {
				showSnackbar("Demasiados intentos fallidos. Serás redirigido al inicio en unos segundos", "error");
				setInternalOpen(false);
				setTimeout(onLogout, 3000);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Hook para iniciar sesión con Google - Actualizado para evitar incrementos múltiples
	const googleLogin = useGoogleLogin({
		onSuccess: handleGoogleSuccess,
		onError: () => {
			// Incrementar contador de intentos solo si no está en proceso de envío
			// Esto evita duplicados con handleGoogleSuccess
			if (!isSubmitting) {
				submitAttempts.current += 1;

				// Ya no necesitamos calcular los intentos restantes porque mostramos "Intento X de Y"

				showSnackbar(`Error al iniciar sesión con Google. Intento ${submitAttempts.current} de ${maxRetries}.`, "error");

				// Verificar si ha excedido el máximo de intentos
				if (submitAttempts.current >= maxRetries) {
					showSnackbar("Demasiados intentos fallidos. Serás redirigido al inicio en unos segundos", "error");
					setInternalOpen(false);
					setTimeout(onLogout, 3000);
				}
			}

			setIsSubmitting(false);
		},
		flow: "implicit",
		scope: "email profile",
	});

	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;

	// Click fuera del modal o tecla Escape: comportarse como "Cancelar" (cerrar sesión).
	// Esto deja al usuario en un estado consistente — sin sesión válida —
	// en lugar de quedarse en una vista a la que ya no puede acceder.
	const handleBackdropCancel = () => {
		if (isSubmitting) return;
		setInternalOpen(false);
		setTimeout(() => onLogout(), 50);
	};

	return (
		<Dialog
			open={internalOpen}
			maxWidth="xs"
			fullWidth
			disableEscapeKeyDown={isSubmitting}
			onClose={handleBackdropCancel}
			PaperProps={{
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			<DialogContent sx={{ p: { xs: 3, sm: 3.5 }, position: "relative" }}>
				{/* Radial blob destructivo */}
				<Box
					sx={{
						position: "absolute",
						top: -80,
						left: "50%",
						transform: "translateX(-50%)",
						width: 280,
						height: 280,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(errorColor, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Stack alignItems="center" spacing={2.25} sx={{ position: "relative" }}>
					{/* Icon ring sober destructivo */}
					<Box
						sx={{
							width: 60,
							height: 60,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.2)}`,
							color: errorColor,
						}}
					>
						<ShieldCross size={26} variant="Bulk" />
					</Box>

					{/* Eyebrow + título + body */}
					<Stack spacing={1} alignItems="center" sx={{ width: 1 }}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: errorColor }} />
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								No autorizado
							</Typography>
						</Stack>
						<Typography
							sx={{
								fontSize: "1.05rem",
								fontWeight: 600,
								letterSpacing: "-0.015em",
								color: "text.primary",
								textAlign: "center",
								textWrap: "balance" as any,
							}}
						>
							Sesión expirada
						</Typography>
						<Typography
							sx={{
								fontSize: "0.82rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								textAlign: "center",
								textWrap: "pretty" as any,
								lineHeight: 1.5,
							}}
						>
							Tu sesión expiró o no tenés autorización para acceder a este recurso. Iniciá sesión nuevamente para continuar.
						</Typography>
					</Stack>

					{/* Aviso de peticiones en cola */}
					{queuedRequests > 0 && (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								p: 1.25,
								width: 1,
								borderRadius: 1.25,
								bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.06),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
							}}
						>
							<InfoCircle size={16} variant="Bulk" color={STALE_AMBER} />
							<Typography sx={{ fontSize: "0.74rem", color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.5 }}>
								Tenés{" "}
								<Box component="span" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
									{queuedRequests}
								</Box>{" "}
								{queuedRequests === 1 ? "petición pendiente" : "peticiones pendientes"} que se procesarán automáticamente al iniciar
								sesión.
							</Typography>
						</Box>
					)}

					{/* Formulario */}
					<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleFormSubmit}>
						{({ errors, handleBlur, handleChange, handleSubmit, touched, values }) => (
							<form noValidate onSubmit={handleSubmit} style={{ width: "100%" }}>
								<Grid container spacing={1.75}>
									<Grid item xs={12}>
										<Stack spacing={0.75}>
											<InputLabel
												htmlFor="email-login"
												sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}
											>
												Email
											</InputLabel>
											<OutlinedInput
												id="email-login"
												type="email"
												value={values.email}
												name="email"
												onBlur={handleBlur}
												onChange={handleChange}
												placeholder="Ingresá tu email"
												fullWidth
												error={Boolean(touched.email && errors.email)}
												disabled={isSubmitting}
												sx={{
													borderRadius: 1,
													"& .MuiOutlinedInput-notchedOutline": {
														borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
													},
													"&:hover .MuiOutlinedInput-notchedOutline": {
														borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
													},
													"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
														borderColor: BRAND_BLUE,
													},
												}}
											/>
											{touched.email && errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
										</Stack>
									</Grid>

									<Grid item xs={12}>
										<Stack spacing={0.75}>
											<InputLabel
												htmlFor="password-login"
												sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}
											>
												Contraseña
											</InputLabel>
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
															{showPassword ? <Eye size={18} variant="Bulk" /> : <EyeSlash size={18} variant="Bulk" />}
														</IconButton>
													</InputAdornment>
												}
												placeholder="Ingresá tu contraseña"
												sx={{
													borderRadius: 1,
													"& .MuiOutlinedInput-notchedOutline": {
														borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
													},
													"&:hover .MuiOutlinedInput-notchedOutline": {
														borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
													},
													"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
														borderColor: BRAND_BLUE,
													},
												}}
											/>
											{touched.password && errors.password && <FormHelperText error>{errors.password}</FormHelperText>}
										</Stack>
									</Grid>

									<Grid item xs={12}>
										<Stack spacing={1.25} sx={{ mt: 0.5 }}>
											<Button
												variant="contained"
												type="submit"
												fullWidth
												disabled={isSubmitting}
												sx={{
													textTransform: "none",
													fontWeight: 600,
													letterSpacing: "-0.005em",
													bgcolor: BRAND_BLUE,
													color: "#fff",
													borderRadius: 1.25,
													py: 1,
													boxShadow: "none",
													"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
												}}
											>
												{isSubmitting ? (
													<Stack direction="row" spacing={1} alignItems="center">
														<CircularProgress size={16} sx={{ color: "#fff" }} />
														<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "-0.005em" }}>
															Iniciando sesión…
														</Typography>
													</Stack>
												) : (
													"Iniciar sesión"
												)}
											</Button>

											<Stack direction="row" alignItems="center" spacing={1}>
												<Box sx={{ flex: 1, height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12) }} />
												<Typography
													sx={{
														fontSize: "0.62rem",
														fontWeight: 600,
														letterSpacing: "0.08em",
														textTransform: "uppercase",
														color: "text.secondary",
													}}
												>
													o
												</Typography>
												<Box sx={{ flex: 1, height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12) }} />
											</Stack>

											<Box sx={{ width: "100%", position: "relative" }}>
												<CustomGoogleButton
													onClick={() => googleLogin()}
													disabled={isSubmitting}
													text={isSubmitting ? "Iniciando sesión…" : "Iniciar sesión con Google"}
													fullWidth
													customHeight="36.49px"
												/>
												{isSubmitting && (
													<CircularProgress
														size={18}
														sx={{
															color: BRAND_BLUE,
															position: "absolute",
															top: "50%",
															left: 16,
															marginTop: "-9px",
														}}
													/>
												)}
											</Box>

											<Button
												onClick={handleBackdropCancel}
												fullWidth
												disabled={isSubmitting}
												sx={{
													textTransform: "none",
													fontWeight: 600,
													letterSpacing: "-0.005em",
													color: "text.secondary",
													borderRadius: 1.25,
													py: 1,
													border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
													"&:hover": {
														color: BRAND_BLUE,
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
														borderColor: alpha(BRAND_BLUE, 0.28),
													},
												}}
											>
												Cancelar
											</Button>
										</Stack>
									</Grid>
								</Grid>
							</form>
						)}
					</Formik>
				</Stack>
			</DialogContent>
		</Dialog>
	);
};

export default UnauthorizedModal;
