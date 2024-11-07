import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Button, Grid, Stack, Typography } from "@mui/material";
import OtpInput from "react18-input-otp";
import AnimateButton from "components/@extended/AnimateButton";
import axios from "axios";
import { ThemeMode } from "types/config";
import { useSelector } from "react-redux";
import { RootState } from "store"; // Ajusta la ruta si es necesario
import { useNavigate } from "react-router-dom";
import useAuth from "hooks/useAuth";

const AuthCodeVerification = () => {
	const { isLoggedIn, needsVerification, setIsLoggedIn, setNeedsVerification } = useAuth();

	// Obtener el email desde Redux
	const email = useSelector((state: RootState) => state.auth.email);
	const navigate = useNavigate();
	const theme = useTheme();
	const [otp, setOtp] = useState<string>("");
	const [error, setError] = useState<string | null>(null); // Para mostrar errores si los hay

	const borderColor = theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary[200] : theme.palette.secondary.light;

	// Manejador de envío de código de verificación
	const handleVerifyCode = async () => {
		try {
			const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/verify-code`, { code: otp, email: email });
			if (result && result.data.success) {
				setError("");
				setIsLoggedIn(true);
				setNeedsVerification(false);
				navigate("/dashboard/default");
			} else {
				setError("El código es incorrecto. Inténtalo nuevamente.");
			}
		} catch (error) {
			console.error("Error de verificación:", error);
			if (axios.isAxiosError(error) && error.response && error.response.data.message) {
				setError(error.response.data.message);
			} else {
				setError("Hubo un problema al verificar el código. Inténtalo de nuevo más tarde.");
			}
		}
	};

	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<OtpInput
					value={otp}
					onChange={(otp: string) => setOtp(otp)}
					numInputs={4}
					containerStyle={{ justifyContent: "space-between" }}
					inputStyle={{
						width: "100%",
						margin: "8px",
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
					<Button
						disableElevation
						fullWidth
						size="large"
						type="submit"
						variant="contained"
						onClick={handleVerifyCode} // Llama a la función de verificación
					>
						Continuar
					</Button>
				</AnimateButton>
			</Grid>
			<Grid item xs={12}>
				<Stack direction="row" justifyContent="space-between" alignItems="baseline">
					<Typography>¿No recibiste el código?</Typography>
					<Typography variant="body1" sx={{ minWidth: 85, ml: 2, textDecoration: "none", cursor: "pointer" }} color="primary">
						Reenviar código
					</Typography>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default AuthCodeVerification;
