import React from "react";
import { Link } from "react-router-dom";
import { useGoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useState } from "react";
// material-ui
import { Grid, Stack, Alert, Typography, Box, LinearProgress, Button, CircularProgress } from "@mui/material";

// project-imports
import Logo from "components/logo";
import useAuth from "hooks/useAuth";
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper from "sections/auth/AuthWrapper";
import AuthLogin from "sections/auth/auth-forms/AuthLogin";
import CustomGoogleButton from "components/auth/CustomGoogleButton";

// ================================|| LOGIN ||================================ //

const Login = () => {
	const { loginWithGoogle } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);
	// Cuenta Google desactivada: retenemos el credential para ofrecer reactivar.
	const [reactivateCred, setReactivateCred] = useState<CredentialResponse | null>(null);
	const [reactivating, setReactivating] = useState<boolean>(false);

	// Estado combinado de loading
	const isAnyLoading = isLoading || isEmailLoading;

	// Verificar si el sitio está en modo mantenimiento
	const isMaintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === "true";

	const handleGoogleSuccess = async (tokenResponse: any) => {
		setIsLoading(true);
		setIsEmailLoading(true); // Bloquear también el formulario de email
		// Crear un objeto de credencial para mantener la compatibilidad con el sistema existente
		const credentialResponse: CredentialResponse = {
			clientId: tokenResponse.clientId || "",
			credential: tokenResponse.access_token,
			select_by: "user",
		};
		try {
			// Llamar a la función de login existente
			await loginWithGoogle(credentialResponse);
		} catch (err: any) {
			const errData = err?.response?.data?.error;
			if (errData?.code === "ACCOUNT_INACTIVE" && errData?.canReactivate) {
				// Cuenta desactivada: ofrecemos reactivar reutilizando el mismo credential.
				setReactivateCred(credentialResponse);
				setError(null);
			} else {
				setError("Error al autenticar con Google. Por favor, intenta nuevamente.");
			}
		} finally {
			setIsLoading(false);
			setIsEmailLoading(false);
		}
	};

	const handleReactivateGoogle = async () => {
		if (!reactivateCred) return;
		setReactivating(true);
		setError(null);
		try {
			// Re-enviamos el flujo de Google con confirmReactivation → el backend
			// reactiva (token ya verificado) y deja la sesión iniciada.
			await loginWithGoogle(reactivateCred, true);
		} catch (err) {
			setError("No pudimos reactivar tu cuenta. Intentá nuevamente.");
			setReactivating(false);
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
		scope: "email profile",
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
			<Box sx={{ position: "relative" }}>
				{/* Barra de progreso global */}
				{isAnyLoading && (
					<Box
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							zIndex: 1000,
						}}
					>
						<LinearProgress />
					</Box>
				)}

				<Grid container spacing={3}>
					<Grid item xs={12} sx={{ textAlign: "center" }}>
						<Logo />
					</Grid>
					<Grid item xs={12}>
						<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
							<Typography variant="h3">Iniciar sesión</Typography>
							<Typography
								component={isAnyLoading ? Box : Link}
								to={isAnyLoading ? undefined : "/register?source=login"}
								variant="body1"
								sx={{
									textDecoration: "none",
									color: isAnyLoading ? "text.disabled" : "primary.main",
									cursor: isAnyLoading ? "not-allowed" : "pointer",
									pointerEvents: isAnyLoading ? "none" : "auto",
								}}
							>
								¿No tienes una cuenta?
							</Typography>
						</Stack>
					</Grid>
					<Grid item xs={12}>
						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}
						<AuthLogin forgot="/auth/forgot-password" isGoogleLoading={isLoading} onLoadingChange={setIsEmailLoading} />
					</Grid>
					<Grid item xs={12}>
						<AuthDivider>
							<Typography variant="body1">O</Typography>
						</AuthDivider>
					</Grid>
					<Grid item xs={12}>
						{reactivateCred ? (
							<Alert severity="warning" sx={{ "& .MuiAlert-message": { width: "100%" } }}>
								<Stack spacing={1.25}>
									<Typography variant="body2">
										Tu cuenta está desactivada. ¿Querés reactivarla y volver a ingresar?
									</Typography>
									<Stack direction="row" spacing={1}>
										<Button
											variant="contained"
											size="small"
											onClick={handleReactivateGoogle}
											disabled={reactivating}
											startIcon={reactivating ? <CircularProgress size={16} color="inherit" /> : null}
										>
											{reactivating ? "Reactivando..." : "Reactivar mi cuenta"}
										</Button>
										<Button variant="text" size="small" onClick={() => setReactivateCred(null)} disabled={reactivating}>
											Cancelar
										</Button>
									</Stack>
								</Stack>
							</Alert>
						) : (
							/* Botón personalizado que llama a googleLogin.login() */
							<CustomGoogleButton
								onClick={() => googleLogin()}
								disabled={isLoading || isEmailLoading}
								text={isLoading ? "Iniciando sesión..." : "Iniciar sesión con Google"}
								fullWidth
								showLoader={isLoading}
							/>
						)}
					</Grid>
				</Grid>
			</Box>
		</AuthWrapper>
	);
};

export default Login;
