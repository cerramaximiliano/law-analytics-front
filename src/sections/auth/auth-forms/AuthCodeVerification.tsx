import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Button, Grid, Stack, Typography } from "@mui/material";
import OtpInput from "react18-input-otp";
import AnimateButton from "components/@extended/AnimateButton";
import axios from "axios"; // Importa axios para hacer la solicitud HTTP
import { ThemeMode } from "types/config";
import useAuth from "hooks/useAuth";

const AuthCodeVerification = () => {
	
	// Ver si llega el email para poder enviarlo en la PETICION
	const { email } = useAuth();
	console.log(email);


	const theme = useTheme();
	const [otp, setOtp] = useState<string>("");
	const [error, setError] = useState<string | null>(null); // Para mostrar errores si los hay

	const borderColor = theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary[200] : theme.palette.secondary.light;

	// Manejador de envío de código de verificación
	const handleVerifyCode = async () => {
		try {
			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/verify-code`, { code: otp });
			if (response.data.success) {
				// Redirigir o mostrar mensaje de éxito si la verificación es correcta
				console.log("Código verificado exitosamente");
			} else {
				setError("El código es incorrecto. Inténtalo nuevamente.");
			}
		} catch (error) {
			setError("Hubo un problema al verificar el código. Inténtalo de nuevo más tarde.");
			console.error("Error de verificación:", error);
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
