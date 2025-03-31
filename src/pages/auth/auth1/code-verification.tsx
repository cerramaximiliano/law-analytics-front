import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RootState, useSelector } from "store";
// material-ui
import { Grid, Stack, Typography } from "@mui/material";

// project-imports
import AuthWrapper from "sections/auth/AuthWrapper";
import AuthCodeVerification from "sections/auth/auth-forms/AuthCodeVerification";

// ================================|| CODE VERIFICATION ||================================ //

const CodeVerification = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Obtener datos del estado de location o de Redux
	const { email: locationEmail, mode = "register" } = location.state || {};
	const reduxEmail = useSelector((state: RootState) => state.auth.email);
	const needsVerification = useSelector((state: RootState) => state.auth.needsVerification);

	const email = locationEmail || reduxEmail || "";

	// Redireccionar si no hay email o no necesita verificación (en caso de registro)
	useEffect(() => {
		if (!email) {
			if (mode === "register") {
				navigate("/register");
			} else {
				navigate("/forgot-password");
			}
			return;
		}

		if (mode === "register" && !needsVerification) {
			navigate("/dashboard/default");
		}
	}, [email, needsVerification, mode, navigate]);

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<Stack spacing={1}>
						<Typography variant="h3">Ingrese el Código de Verificación</Typography>
						<Typography color="secondary">Te lo enviamos a tu correo.</Typography>
					</Stack>
				</Grid>
				<Grid item xs={12}>
					<Typography>Enviamos un código a tu correo.</Typography>
				</Grid>
				<Grid item xs={12}>
					<AuthCodeVerification
						mode={mode as "register" | "reset"}
						email={email}
						onVerificationSuccess={() => {
							console.log(`Verificación exitosa en modo: ${mode}`);
							if (mode === "register") {
								navigate("/dashboard/default");
							}
							// Para "reset", la navegación se maneja dentro del componente
						}}
					/>
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default CodeVerification;
