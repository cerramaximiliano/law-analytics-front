import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
// material-ui
import { Grid, Stack, Alert, Typography } from "@mui/material";

// project-imports
import Logo from "components/logo";
import useAuth from "hooks/useAuth";
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper from "sections/auth/AuthWrapper";
import AuthLogin from "sections/auth/auth-forms/AuthLogin";

// ================================|| LOGIN ||================================ //

const Login = () => {
	const { loginWithGoogle } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const handleGoogleLogin = async (credentialResponse: any) => {
		setError(null);
		try {
			await loginWithGoogle(credentialResponse);
		} catch (error) {
			setError("Error al autenticar con Google. Por favor, intenta nuevamente.");
			console.error("Error:", error);
		}
	};

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12} sx={{ textAlign: "center" }}>
					<Logo />
				</Grid>
				<Grid justifyContent={"center"} item xs={12}>
					<Grid container spacing={1}>
						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}
						<Grid
							sx={{
								display: "flex",
								justifyContent: "center",
							}}
							item
							xs={12}
						>
							<GoogleLogin
								onSuccess={handleGoogleLogin}
								onError={() => setError("Error al iniciar sesión con Google. Intenta nuevamente.")}
								useOneTap={false}
								theme="filled_blue"
								text="signin_with"
								shape="rectangular"
								logo_alignment="center"
								context="signin"
								width="300"
							/>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12}>
					<AuthDivider>
						<Typography variant="body1">O</Typography>
					</AuthDivider>
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
					<AuthLogin forgot="/auth/forgot-password" />
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default Login;
