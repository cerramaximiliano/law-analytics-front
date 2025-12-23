import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin, CredentialResponse } from "@react-oauth/google";

// material-ui
import { Grid, Stack, Alert, Typography, Box } from "@mui/material";

// icons
import { TickCircle } from "iconsax-react";

// project-imports
import Logo from "components/logo";
import useAuth from "hooks/useAuth";
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper from "sections/auth/AuthWrapper";
import AuthRegister from "sections/auth/auth-forms/AuthRegister";
import CustomGoogleButton from "components/auth/CustomGoogleButton";
import { trackRegisterView, trackSignUp, trackGoogleSignupClick } from "utils/gtm";

const Register = () => {
	const { loginWithGoogle } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const location = useLocation();

	// Verificar si el sitio está en modo mantenimiento
	const isMaintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === "true";

	// Get attribution params from URL
	const params = new URLSearchParams(location.search);
	const source = params.get("source") || undefined;
	const feature = params.get("feature") || undefined;

	// Track register page view with attribution
	useEffect(() => {
		trackRegisterView(source, feature);
	}, [source, feature]);

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

			// Track successful sign up with Google
			trackSignUp("google", source, feature);
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

	// Handle Google button click with tracking
	const handleGoogleClick = () => {
		trackGoogleSignupClick(source, feature);
		googleLogin();
	};

	// Mostrar mensaje de mantenimiento si está activo
	if (isMaintenanceMode) {
		return (
			<AuthWrapper>
				<Grid container spacing={3}>
					<Grid item xs={12} sx={{ textAlign: "center" }}>
						<Logo to="/" />
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
					<Logo to="/" />
				</Grid>
				<Grid item xs={12}>
					<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
						<Typography variant="h3">Empezá gratis</Typography>
						<Typography component={Link} to={"/login"} variant="body1" sx={{ textDecoration: "none" }} color="primary">
							¿Ya tienes una cuenta?
						</Typography>
					</Stack>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Configuración inicial en menos de 2 minutos
					</Typography>
				</Grid>
				<Grid item xs={12}>
					<Box sx={{ mb: 1.5 }}>
						<Stack spacing={0.3}>
							<Stack direction="row" alignItems="center" spacing={0.75}>
								<TickCircle size={14} variant="Bold" color="#4caf50" />
								<Typography variant="caption" color="text.secondary">Estados y movimientos automáticos</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" spacing={0.75}>
								<TickCircle size={14} variant="Bold" color="#4caf50" />
								<Typography variant="caption" color="text.secondary">Alertas de vencimientos</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" spacing={0.75}>
								<TickCircle size={14} variant="Bold" color="#4caf50" />
								<Typography variant="caption" color="text.secondary">Centralizá agenda y cálculos</Typography>
							</Stack>
						</Stack>
					</Box>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					<CustomGoogleButton
						onClick={handleGoogleClick}
						disabled={isLoading}
						showLoader={isLoading}
						text="Registrate con Google"
						fullWidth
						sx={{ py: 1.5 }}
					/>
				</Grid>
				<Grid item xs={12}>
					<AuthDivider>
						<Typography variant="caption" color="text.secondary" sx={{ opacity: 0.5, fontSize: "0.7rem" }}>
							o registrate con email
						</Typography>
					</AuthDivider>
				</Grid>
				<Grid item xs={12}>
					<AuthRegister source={source} feature={feature} />
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default Register;
