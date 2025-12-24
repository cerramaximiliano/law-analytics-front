import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
import MainCard from "components/MainCard";
import AuthRegister from "sections/auth/auth-forms/AuthRegister";
import CustomGoogleButton from "components/auth/CustomGoogleButton";
import { trackRegisterView, trackSignUp, trackGoogleSignupClick } from "utils/gtm";

// assets
import AuthBackground from "assets/images/auth/AuthBackground";
import desktopDashboard from "assets/images/desktop_dashboard-removebg.png";

const Register = () => {
	const { loginWithGoogle } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [cardHeight, setCardHeight] = useState<number>(0);
	const cardRef = useRef<HTMLDivElement>(null);
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

	// Medir altura del card para proporcionar la imagen
	useEffect(() => {
		const updateHeight = () => {
			if (cardRef.current) {
				setCardHeight(cardRef.current.offsetHeight);
			}
		};
		updateHeight();
		window.addEventListener("resize", updateHeight);
		return () => window.removeEventListener("resize", updateHeight);
	}, []);

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
		<Box sx={{ minHeight: "100vh" }}>
			<AuthBackground />
			<Grid
				container
				direction="column"
				justifyContent="center"
				sx={{ minHeight: "100vh" }}
			>
				<Grid item xs={12}>
					<Box
						sx={{
							display: "flex",
							flexDirection: { xs: "column", md: "row" },
							justifyContent: "center",
							alignItems: "center",
							gap: { xs: 4, md: 8 },
							minHeight: { xs: "auto", sm: "calc(100vh - 134px)", md: "calc(100vh - 112px)" },
							py: { xs: 2, sm: 0 },
							px: { xs: 2, md: 4 },
						}}
					>
						<Box ref={cardRef}>
							<MainCard
								sx={{
									maxWidth: { xs: "calc(100vw - 32px)", sm: 400, md: 420 },
									width: "100%",
								}}
								content={false}
							>
								<Box sx={{ p: { xs: 2.5, sm: 3, md: 3.5 }, py: { xs: 3, sm: 3.5, md: 4 } }}>
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
								</Box>
								</MainCard>
						</Box>
						<Box
							component="img"
							src={desktopDashboard}
							alt="Law Analytics Dashboard"
							sx={{
								display: { xs: "none", md: "block" },
								maxWidth: "70%",
								maxHeight: cardHeight ? cardHeight * 0.8 : "60vh",
								height: "auto",
								filter: "contrast(1.05)",
								opacity: 0.96,
							}}
						/>
					</Box>
				</Grid>
			</Grid>
		</Box>
	);
};

export default Register;
