import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin, CredentialResponse } from "@react-oauth/google";

// material-ui
import { Grid, Stack, Alert, Typography } from "@mui/material";

// project-imports
import Logo from "components/logo";
import useAuth from "hooks/useAuth";
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper from "sections/auth/AuthWrapper";
import AuthRegister from "sections/auth/auth-forms/AuthRegister";
import CustomGoogleButton from "components/auth/CustomGoogleButton";

const Register = () => {
	const { loginWithGoogle } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// Verificar si el sitio está en modo mantenimiento
	const isMaintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === "true";

	const handleGoogleSuccess = async (tokenResponse: any) => {
		setIsLoading(true);
		try {
			// Crear un objeto de credencial para mantener la compatibilidad con el sistema existente
			const credentialResponse: CredentialResponse = {
				clientId: tokenResponse.clientId || "",
				credential: tokenResponse.access_token,
				select_by: "user",
			};

			// Llamar a la función de login existente
			await loginWithGoogle(credentialResponse);
		} catch (error) {
			setError("Error al autenticar con Google. Por favor, intenta nuevamente.");
		} finally {
			setIsLoading(false);
		}
	};

	// Hook para iniciar sesión con Google
	const googleLogin = useGoogleLogin({
		onSuccess: handleGoogleSuccess,
		onError: () => {
			setError("Error al iniciar sesión con Google. Intenta nuevamente.");
			setIsLoading(false);
		},
		flow: "implicit",
	});

	// Mostrar mensaje de mantenimiento si está activo
	if (isMaintenanceMode) {
		return (
			<AuthWrapper>
				<Grid container spacing={3}>
					<Grid item xs={12} sx={{ textAlign: "center" }}>
						<Logo />
					</Grid>
					<Grid item xs={12}>
						<Alert severity="info" sx={{ mt: 3 }}>
							<Typography variant="h5" sx={{ mb: 1 }}>
								Sitio en Mantenimiento
							</Typography>
							<Typography variant="body1">
								Estamos realizando mejoras en nuestro sistema. Por favor, vuelve a intentarlo más tarde.
							</Typography>
						</Alert>
					</Grid>
				</Grid>
			</AuthWrapper>
		);
	}

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12} sx={{ textAlign: "center" }}>
					<Logo />
				</Grid>
				<Grid item xs={12}>
					<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
						<Typography variant="h3">Registro</Typography>
						<Typography component={Link} to={"/login"} variant="body1" sx={{ textDecoration: "none" }} color="primary">
							¿Ya tienes una cuenta?
						</Typography>
					</Stack>
				</Grid>
				<Grid item xs={12}>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					<AuthRegister />
				</Grid>
				<Grid item xs={12}>
					<AuthDivider>
						<Typography variant="body1">O</Typography>
					</AuthDivider>
				</Grid>
				<Grid item xs={12}>
					{/* Botón personalizado que llama a googleLogin.login() */}
					<CustomGoogleButton onClick={() => googleLogin()} disabled={isLoading} text="Registrarse con Google" fullWidth />
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default Register;
