import { Link } from "react-router-dom";
import { useGoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useState } from "react";
// material-ui
import { Grid, Stack, Alert, Typography } from "@mui/material";

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

	const handleGoogleSuccess = async (tokenResponse: any) => {
		setIsLoading(true);
		try {
			console.log("Token response from Google Login:", tokenResponse);
			console.log("Access token Login:", tokenResponse.access_token);
			console.log("Token type Login:", typeof tokenResponse.access_token);
			console.log("Token length Login:", tokenResponse.access_token?.length || 0);
			
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
			console.error("Error:", error);
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
		scope: "email profile",
	});

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12} sx={{ textAlign: "center" }}>
					<Logo />
				</Grid>
				<Grid item xs={12}>
					<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
						<Typography variant="h3">Login</Typography>
						<Typography component={Link} to={"/register"} variant="body1" sx={{ textDecoration: "none" }} color="primary">
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
					<AuthLogin forgot="/auth/forgot-password" />
				</Grid>
				<Grid item xs={12}>
					<AuthDivider>
						<Typography variant="body1">O</Typography>
					</AuthDivider>
				</Grid>
				<Grid item xs={12}>
					{/* Botón personalizado que llama a googleLogin.login() */}
					<CustomGoogleButton onClick={() => googleLogin()} disabled={isLoading} text="Iniciar sesión con Google" fullWidth />
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default Login;
