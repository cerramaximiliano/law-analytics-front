import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Button, Grid, Stack, Typography } from "@mui/material";
import OtpInput from "react18-input-otp";
import AnimateButton from "components/@extended/AnimateButton";
import axios from "axios";
import { ThemeMode } from "types/config";
import { useSelector } from "react-redux";
import { dispatch, RootState } from "store";
import { useNavigate } from "react-router-dom";
import useAuth from "hooks/useAuth";
import { openSnackbar } from "store/reducers/snackbar";

// Define el tipo para el modo
type VerificationMode = "register" | "reset";

// Props para el componente
interface AuthCodeVerificationProps {
	mode?: VerificationMode;
	email?: string;
	onVerificationSuccess?: () => void;
}

const AuthCodeVerification = ({ mode = "register", email: propEmail, onVerificationSuccess }: AuthCodeVerificationProps) => {
	// Obtener funciones y estado del contexto de autenticación
	console.log("AuthCodeVerification inicializado con mode:", mode, "y email:", propEmail);

	const auth = useAuth();

	// Verificar que auth no sea null antes de desestructurarlo
	if (!auth) {
		throw new Error("Auth context is not available");
	}

	const { setIsLoggedIn, setNeedsVerification, verifyCode, verifyResetCode } = auth;

	// Obtener el email desde Redux si no viene como prop
	const reduxEmail = useSelector((state: RootState) => state.auth.email);
	const emailToUse = propEmail || reduxEmail || "";

	console.log("AuthCodeVerification - Usando email:", emailToUse, "y mode:", mode);

	const navigate = useNavigate();

	const theme = useTheme();

	const [otp, setOtp] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [isResending, setIsResending] = useState<boolean>(false);

	const borderColor = theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary[200] : theme.palette.secondary.light;

	// Manejador para reenviar el código
	const handleResendCode = async () => {
		if (isResending) return;

		setIsResending(true);
		try {
			console.log(`Solicitando reenvío de código en modo: ${mode} para email: ${emailToUse}`);

			if (!emailToUse) {
				throw new Error("No se encontró una dirección de correo electrónico válida");
			}

			let endpoint = mode === "register" ? "/api/auth/resend-code" : "/api/auth/reset-request";

			console.log(`Usando endpoint: ${endpoint}`);

			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}${endpoint}`, {
				email: emailToUse,
			});

			console.log("Respuesta de reenvío:", response.data);

			setError(null);
			dispatch(
				openSnackbar({
					open: true,
					message: "El código ha sido reenviado a tu correo electrónico.",
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);
		} catch (error) {
			console.error("Error al reenviar código:", error);
			setError("No se pudo reenviar el código. Inténtalo más tarde.");
		} finally {
			setIsResending(false);
		}
	};

	// Manejador de verificación de código según el modo
	const handleVerifyCode = async () => {
		// Determinar si estamos en un proceso de reseteo de contraseña
		const isResetProcess = mode === "reset" || localStorage.getItem("reset_in_progress") === "true";
		// Si estamos en proceso de reseteo, forzar modo "reset" independientemente del valor de prop
		const effectiveMode = isResetProcess ? "reset" : mode;

		console.log(
			"handleVerifyCode - Email:",
			emailToUse,
			"Mode original:",
			mode,
			"Modo efectivo:",
			effectiveMode,
			"OTP:",
			otp,
			"¿Proceso de reseteo?:",
			isResetProcess,
			"¿reset_in_progress en localStorage?:",
			localStorage.getItem("reset_in_progress"),
		);

		if (!otp || otp.length !== 6) {
			setError("Por favor, ingresa el código completo de 6 dígitos.");
			return;
		}

		if (!emailToUse) {
			setError("No se encontró una dirección de correo electrónico válida.");
			return;
		}

		try {
			// IMPORTANTE: Verificar el modo y usar el endpoint correcto
			console.log(
				`Verificando código en modo efectivo: ${effectiveMode} - Se usará el endpoint: ${
					effectiveMode === "reset" ? "/api/auth/verify-reset-code" : "/api/auth/verify-code"
				}`,
			);

			// Para reseteo de contraseña, SIEMPRE usamos el endpoint verify-reset-code
			if (effectiveMode === "reset") {
				if (!verifyResetCode) {
					throw new Error("La función verifyResetCode no está disponible");
				}

				console.log("MODO RESET CONFIRMADO - Usando verifyResetCode que apunta a '/api/auth/verify-reset-code'");
				const success = await verifyResetCode(emailToUse, otp);

				console.log("Resultado de verificación con verifyResetCode:", success);

				if (success) {
					console.log("Código verificado exitosamente, redirigiendo a reset-password");
					setError(null);

					// Almacenar información en localStorage para evitar pérdida durante navegación
					localStorage.setItem("reset_email", emailToUse);
					localStorage.setItem("reset_code", otp);
					localStorage.setItem("reset_verified", "true");

					// Navegar a la página de reseteo de contraseña
					navigate("/auth/reset-password", { replace: true });

					if (onVerificationSuccess) onVerificationSuccess();
				} else {
					console.log("Error: El código no pudo ser verificado");
				}
			}
			// Para registro normal, usamos el endpoint verify-code
			else if (effectiveMode === "register" && verifyCode) {
				console.log("MODO REGISTER - Usando verifyCode para registro normal");
				const response = await verifyCode(emailToUse, otp);

				if (response) {
					console.log("Verificación exitosa:", response);

					// Si el servidor devuelve el objeto usuario completo en la respuesta
					if (response.user) {
						// Actualizar estado global de auth con la data completa del usuario
						dispatch({
							type: "LOGIN",
							payload: {
								isLoggedIn: true,
								user: response.user,
								needsVerification: false,
							},
						});

						// Actualizar también estado local de auth
						setError(null);
						setIsLoggedIn(true);
						setNeedsVerification(false);

						console.log("Estado de autenticación actualizado con datos del usuario:", response.user);
					} else {
						// Comportamiento anterior si no hay datos de usuario
						setError(null);
						setIsLoggedIn(true);
						setNeedsVerification(false);
					}

					navigate("/dashboard/default");
					if (onVerificationSuccess) onVerificationSuccess();
				}
			}
			// Caso de emergencia - si el modo no está definido correctamente
			else {
				console.error("Modo no reconocido o funciones no disponibles:", {
					mode,
					hasVerifyCode: !!verifyCode,
					hasVerifyResetCode: !!verifyResetCode,
				});

				// Si estamos en code-verification y no tenemos modo explícito, intentar con verifyResetCode
				if (window.location.pathname.includes("code-verification") && verifyResetCode) {
					console.log("MODO EMERGENCIA - Usando verifyResetCode por defecto");
					const success = await verifyResetCode(emailToUse, otp);

					if (success) {
						console.log("Código verificado exitosamente, redirigiendo a reset-password");
						setError(null);
						localStorage.setItem("reset_email", emailToUse);
						localStorage.setItem("reset_code", otp);
						localStorage.setItem("reset_verified", "true");
						navigate("/auth/reset-password", { replace: true });
						if (onVerificationSuccess) onVerificationSuccess();
					} else {
						console.log("Error: El código no pudo ser verificado");
					}
				} else {
					setError("Las funciones de verificación no están disponibles.");
					console.error("Funciones de verificación no disponibles o modo incorrecto:", {
						mode,
						verifyCode: !!verifyCode,
						verifyResetCode: !!verifyResetCode,
					});
				}
			}
		} catch (error) {
			console.error("Error de verificación:", error);
			if (axios.isAxiosError(error) && error.response?.data?.message) {
				setError(error.response.data.message);
			} else {
				setError("Hubo un problema al verificar el código. Inténtalo de nuevo más tarde.");
			}
		}
	};

	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<Typography variant="h3" textAlign="center" gutterBottom>
					{mode === "register" ? "Verificación de cuenta" : "Verificación para reseteo de contraseña"}
				</Typography>
				<Typography variant="body1" textAlign="center" sx={{ mb: 3 }}>
					Hemos enviado un código a <strong>{emailToUse}</strong>
				</Typography>
			</Grid>

			<Grid item xs={12}>
				<OtpInput
					value={otp}
					onChange={(otp: string) => setOtp(otp)}
					numInputs={6}
					containerStyle={{ justifyContent: "space-between" }}
					inputStyle={{
						width: "100%",
						margin: "4px",
						padding: "10px",
						border: `1px solid ${borderColor}`,
						borderRadius: 4,
						":hover": {
							borderColor: theme.palette.primary.main,
						},
					}}
					focusStyle={{
						outline: "none",
						boxShadow: theme.customShadows.primary,
						border: `1px solid ${theme.palette.primary.main}`,
					}}
				/>
			</Grid>

			{error && (
				<Grid item xs={12}>
					<Typography color="error">{error}</Typography>
				</Grid>
			)}

			<Grid item xs={12}>
				<AnimateButton>
					<Button disableElevation fullWidth size="large" type="submit" variant="contained" onClick={handleVerifyCode}>
						{mode === "register" ? "Verificar y continuar" : "Verificar código"}
					</Button>
				</AnimateButton>
			</Grid>

			<Grid item xs={12}>
				<Stack direction="row" justifyContent="space-between" alignItems="baseline">
					<Typography>¿No recibiste el código?</Typography>
					<Typography
						variant="body1"
						sx={{
							minWidth: 85,
							ml: 2,
							textDecoration: "none",
							cursor: "pointer",
							opacity: isResending ? 0.6 : 1,
						}}
						color="primary"
						onClick={handleResendCode}
					>
						{isResending ? "Enviando..." : "Reenviar código"}
					</Typography>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default AuthCodeVerification;
