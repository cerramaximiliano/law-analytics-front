import React from "react";
import { Link, useLocation } from "react-router-dom";

// material-ui
import { Box, Button, Grid, Typography } from "@mui/material";

// project-imports
import useAuth from "hooks/useAuth";
import AnimateButton from "components/@extended/AnimateButton";
import AuthWrapper from "sections/auth/AuthWrapper";
import { RootState, useSelector } from "store";
import secureStorage from "services/secureStorage";
import { maskEmail } from "utils/maskEmail";

// ================================|| CHECK MAIL ||================================ //

const CheckMail = () => {
	const { isLoggedIn } = useAuth();
	const location = useLocation();

	// Intentar obtener el email desde location.state (viene de forgot-password),
	// luego Redux, y finalmente sessionStorage como fallback.
	const locationEmail = (location.state as { email?: string } | null)?.email;
	const reduxEmail = useSelector((state: RootState) => state.auth.email);
	const storedEmail = secureStorage.getSessionData<string>("reset_email");

	const email = locationEmail || reduxEmail || storedEmail || "";
	const maskedEmail = maskEmail(email);

	// State a pasar a code-verification para continuar el flujo
	const codeVerificationState = { email, mode: "reset" };

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<Box sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
						<Typography variant="h3">Hola, revisá tu correo</Typography>
						<Typography color="secondary" sx={{ mb: 0.5, mt: 1.25 }}>
							{maskedEmail ? (
								<>
									Enviamos las instrucciones para recuperar tu contraseña a <strong>{maskedEmail}</strong>
								</>
							) : (
								"Revisá el email que nos indicaste para obtener las instrucciones de recuperación."
							)}
						</Typography>
					</Box>
				</Grid>
				<Grid item xs={12}>
					<AnimateButton>
						<Button
							component={Link}
							to={isLoggedIn ? "/auth/code-verification" : "/code-verification"}
							state={codeVerificationState}
							disableElevation
							fullWidth
							size="large"
							variant="contained"
							color="primary"
						>
							Ingresar el código
						</Button>
					</AnimateButton>
				</Grid>
				<Grid item xs={12}>
					<Button
						component={Link}
						to={isLoggedIn ? "/auth/login" : "/login"}
						fullWidth
						size="large"
						variant="text"
						color="secondary"
					>
						Iniciar sesión
					</Button>
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default CheckMail;
