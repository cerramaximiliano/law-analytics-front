import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

// material-ui
import { Grid, Stack, Alert, Typography } from "@mui/material";

// project-imports
import Logo from "components/logo";
import useAuth from "hooks/useAuth";
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper from "sections/auth/AuthWrapper";
import FirebaseRegister from "sections/auth/auth-forms/AuthRegister";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

const Register = () => {
	const { setIsLoggedIn } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const responseMessage = async (response: CredentialResponse) => {
		setError(null);

		try {
			if (response && response.credential) {
				// Utiliza axios en lugar de fetch
				const result = await axios.post(
					`${process.env.REACT_APP_BASE_URL}/api/auth/google`,
					{ token: response.credential },
					{
						withCredentials: true,
						headers: {
							"Content-Type": "application/json",
						},
					},
				);

				// Axios ya parsea automaticamente la respuesta JSON
				const data = result.data;

				if (data.success) {
					// Llama a la función de login para actualizar el estado de autenticación en el frontend
					setIsLoggedIn(true);
				} else {
					setError("No se pudo autenticar. Intenta nuevamente.");
				}
			}
		} catch (error) {
			setError("Error al autenticar con Google. Por favor, intenta nuevamente.");
			console.error("Error:", error);
		}
	};

	const errorMessage = (error?: any) => {
		setError("Error al iniciar sesión con Google. Intenta nuevamente.");
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
								onSuccess={responseMessage}
								onError={errorMessage}
								useOneTap={false}
								theme="filled_blue"
								text="signup_with"
								shape="rectangular"
								logo_alignment="center"
								context="signup"
								width={"300"}
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
						<Typography variant="h3">Sign up</Typography>
						<Typography component={Link} to={"/login"} variant="body1" sx={{ textDecoration: "none" }} color="primary">
							¿Ya tienes una cuenta?
						</Typography>
					</Stack>
				</Grid>
				<Grid item xs={12}>
					<FirebaseRegister />
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default Register;
