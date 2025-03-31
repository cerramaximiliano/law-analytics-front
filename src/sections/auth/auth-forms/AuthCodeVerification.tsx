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
	const auth = useAuth();

	// Verificar que auth no sea null antes de desestructurarlo
	if (!auth) {
		throw new Error("Auth context is not available");
	}

	const { setIsLoggedIn, setNeedsVerification, verifyCode, verifyResetCode } = auth;

	// Obtener el email desde Redux si no viene como prop
	const reduxEmail = useSelector((state: RootState) => state.auth.email);
	const emailToUse = propEmail || reduxEmail || "";

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
		if (!otp || otp.length !== 6) {
			setError("Por favor, ingresa el código completo de 6 dígitos.");
			return;
		}

		if (!emailToUse) {
			setError("No se encontró una dirección de correo electrónico válida.");
			return;
		}

		try {
			console.log(`Verificando código en modo: ${mode}`);

			if (mode === "register" && verifyCode) {
				// Para registro, usa la función verifyCode del provider
				const success = await verifyCode(emailToUse, otp);

				if (success) {
					setError(null);
					setIsLoggedIn(true);
					setNeedsVerification(false);
					navigate("/dashboard/default");
					if (onVerificationSuccess) onVerificationSuccess();
				}
			} else if (mode === "reset" && verifyResetCode) {
				console.log("Verificando código para reseteo de contraseña");

				// Para reseteo de contraseña, usa verifyResetCode
				const success = await verifyResetCode(emailToUse, otp);

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
			} else {
				setError("Las funciones de verificación no están disponibles.");
				console.error("Funciones de verificación no disponibles o modo incorrecto:", {
					mode,
					verifyCode: !!verifyCode,
					verifyResetCode: !!verifyResetCode,
				});
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
