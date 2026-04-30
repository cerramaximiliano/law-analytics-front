import React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { RootState, useSelector } from "store";
// material-ui
import { Button, Grid, Stack, Typography } from "@mui/material";

// project-imports
import AuthWrapper from "sections/auth/AuthWrapper";
import AuthCodeVerification from "sections/auth/auth-forms/AuthCodeVerification";
import AnimateButton from "components/@extended/AnimateButton";
import secureStorage from "services/secureStorage";

// assets
import { InfoCircle } from "iconsax-react";

// ================================|| CODE VERIFICATION ||================================ //

const CodeVerification = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Obtener datos del estado de location, URL o Redux
	const { email: locationEmail, mode: locationMode } = location.state || {};

	// Verificar si venimos de una solicitud de reseteo de contraseña
	// 1. Verificar por estado explícito en location.state
	// 2. Verificar por documento referente (de dónde venimos)
	// 3. Verificar si hay un email almacenado en localStorage para reseteo
	const isResetPasswordContext =
		(location.state && location.state.mode === "reset") ||
		(document.referrer && document.referrer.includes("forgot-password")) ||
		secureStorage.getSessionData("reset_in_progress") === true;

	const searchParams = new URLSearchParams(location.search);
	const urlEmail = searchParams.get("email");
	const urlMode = searchParams.get("mode");

	const reduxEmail = useSelector((state: RootState) => state.auth.email);

	// Si detectamos que estamos en un contexto de reseteo de contraseña,
	// usamos 'reset' como modo y también intentamos recuperar el email del localStorage
	const storedResetEmail = secureStorage.getSessionData<string>("reset_email");

	// Para el email, intentamos usar el de localStorage si estamos en contexto de reseteo
	const email = urlEmail || locationEmail || (isResetPasswordContext ? storedResetEmail : "") || reduxEmail || "";

	// Para el modo, forzamos 'reset' si detectamos contexto de reseteo
	const mode = isResetPasswordContext ? "reset" : urlMode || locationMode || "register";

	const [showFallback, setShowFallback] = useState(false);

	useEffect(() => {
		if (!email) {
			setShowFallback(true);
		}
	}, [email]);

	if (showFallback) {
		// CTA primario según modo inferido; si no se puede inferir, ofrecer ambas opciones
		const inferredMode = urlMode || locationMode;
		return (
			<AuthWrapper>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
							<InfoCircle size={48} variant="Bulk" />
							<Typography variant="h3" textAlign="center">
								Necesitamos un código válido para verificarte
							</Typography>
							<Typography variant="body1" textAlign="center" color="secondary">
								El enlace puede haber expirado. Pedí un nuevo código desde tu email de registro o recuperación.
							</Typography>
						</Stack>
					</Grid>
					{inferredMode === "reset" || (!inferredMode && isResetPasswordContext) ? (
						<Grid item xs={12}>
							<AnimateButton>
								<Button component={Link} to="/forgot-password" disableElevation fullWidth size="large" variant="contained" color="primary">
									Recuperar contraseña
								</Button>
							</AnimateButton>
						</Grid>
					) : inferredMode === "register" ? (
						<Grid item xs={12}>
							<AnimateButton>
								<Button component={Link} to="/register" disableElevation fullWidth size="large" variant="contained" color="primary">
									Crear cuenta
								</Button>
							</AnimateButton>
						</Grid>
					) : (
						<>
							<Grid item xs={12}>
								<AnimateButton>
									<Button
										component={Link}
										to="/forgot-password"
										disableElevation
										fullWidth
										size="large"
										variant="contained"
										color="primary"
									>
										Recuperar contraseña
									</Button>
								</AnimateButton>
							</Grid>
							<Grid item xs={12}>
								<Button component={Link} to="/register" fullWidth size="large" variant="outlined" color="secondary">
									Crear cuenta nueva
								</Button>
							</Grid>
						</>
					)}
					<Grid item xs={12}>
						<Button component={Link} to="/login" fullWidth size="large" variant="text" color="secondary">
							Volver al inicio de sesión
						</Button>
					</Grid>
				</Grid>
			</AuthWrapper>
		);
	}

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<AuthCodeVerification
						mode={mode as "register" | "reset"}
						email={email}
						onVerificationSuccess={() => {
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
