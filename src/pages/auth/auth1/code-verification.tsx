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

	// Obtener datos del estado de location, URL o Redux
	const { email: locationEmail, mode: locationMode = "register" } = location.state || {};
	const searchParams = new URLSearchParams(location.search);
	const urlEmail = searchParams.get("email");
	const urlMode = searchParams.get("mode") || "register";

	const reduxEmail = useSelector((state: RootState) => state.auth.email);
	// Ya no necesitamos este valor ya que no lo estamos verificando
	// const needsVerification = useSelector((state: RootState) => state.auth.needsVerification);

	const email = urlEmail || locationEmail || reduxEmail || "";
	const mode = urlMode || locationMode;

	// Redireccionar si no hay email o no necesita verificación (en caso de registro)
	useEffect(() => {
		console.log("CodeVerification - Email:", email, "Mode:", mode);

		if (!email) {
			if (mode === "register") {
				navigate("/register");
			} else {
				navigate("/forgot-password");
			}
			return;
		}

		// Ya no verificamos needsVerification ya que puede estar llegando por URL
		// y es posible que el estado de Redux no esté sincronizado
	}, [email, mode, navigate]);

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
