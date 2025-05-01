// material-ui
import { useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Container, Grid, Typography, InputAdornment, OutlinedInput, FormHelperText, CircularProgress } from "@mui/material";
import { Sms, Send } from "iconsax-react";

// project-imports
import FadeInWhenVisible from "./Animation";
import axios from "axios";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import PageBackground from "components/PageBackground";

// ==============================|| NEWSLETTER SUBSCRIPTION SERVICE ||============================== //

interface SubscriptionResponse {
	success: boolean;
	message: string;
}

const subscribeToNewsletter = async (email: string): Promise<SubscriptionResponse> => {
	try {
		const response = await axios.post("/api/newsletter/subscribe", { email });
		return response.data;
	} catch (error) {
		// Si hay un error específico en la respuesta, devuélvelo
		if (axios.isAxiosError(error) && error.response) {
			return {
				success: false,
				message: error.response.data.message || "Ocurrió un error al suscribirse. Por favor, inténtalo de nuevo.",
			};
		}
		// Error genérico
		return {
			success: false,
			message: "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
		};
	}
};

// ==============================|| LANDING - ContactUsPage ||============================== //

const ContactUsPage = () => {
	const theme = useTheme();
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const validateEmail = (email: string): boolean => {
		const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return re.test(email);
	};

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newEmail = e.target.value;
		setEmail(newEmail);

		// Limpiar el error cuando el usuario comienza a escribir
		if (error) setError("");
	};

	const handleSubscribe = async () => {
		// Validar el email
		if (!email) {
			setError("Por favor, ingresa tu dirección de correo electrónico");
			return;
		}

		if (!validateEmail(email)) {
			setError("Por favor, ingresa una dirección de correo electrónico válida");
			return;
		}

		setLoading(true);
		try {
			const response = await subscribeToNewsletter(email);

			if (response.success) {
				// Mostrar mensaje de éxito
				dispatch(
					openSnackbar({
						open: true,
						message: "¡Te has suscrito con éxito a nuestro newsletter!",
						variant: "alert",
						alert: {
							color: "success",
							variant: "filled",
						},
						close: true,
					}),
				);

				// Limpiar el formulario
				setEmail("");
			} else {
				// Mostrar mensaje de error
				dispatch(
					openSnackbar({
						open: true,
						message: response.message,
						variant: "alert",
						alert: {
							color: "error",
							variant: "filled",
						},
						close: true,
					}),
				);
			}
		} catch (err) {
			// Mostrar error genérico
			dispatch(
				openSnackbar({
					open: true,
					message: "Ocurrió un error al procesar tu solicitud",
					variant: "alert",
					alert: {
						color: "error",
						variant: "filled",
					},
					close: true,
				}),
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				pb: { md: 12, xs: 8 },
				pt: { md: 8, xs: 5 },
				borderRadius: { md: "16px 16px 0 0" },
			}}
		>
			<PageBackground variant="light" />
			<Container>
				<Grid container spacing={3} alignItems="center" justifyContent="center" sx={{ mt: { md: 5, xs: 2 } }}>
					<Grid item xs={12} md={6}>
						<FadeInWhenVisible>
							<Grid container spacing={2}>
								<Grid item xs={12}>
									<Typography variant="h2" sx={{ mb: 2, color: theme.palette.text.primary }}>
										Mantente informado
									</Typography>
									<Typography variant="h5" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
										Suscríbete a nuestro newsletter para recibir actualizaciones, nuevas funcionalidades y consejos para tu práctica legal.
									</Typography>

									<Box sx={{ position: "relative", maxWidth: { xs: "100%", md: "90%" } }}>
										<OutlinedInput
											fullWidth
											id="newsletter-email"
											placeholder="Ingresa tu correo electrónico"
											value={email}
											onChange={handleEmailChange}
											error={Boolean(error)}
											sx={{
												pr: 15,
												height: 54,
												borderRadius: 2.5,
												bgcolor: theme.palette.background.paper,
												boxShadow: theme.shadows[2],
												"& .MuiOutlinedInput-notchedOutline": {
													borderColor: error ? theme.palette.error.main : alpha(theme.palette.primary.main, 0.2),
												},
												"&:hover .MuiOutlinedInput-notchedOutline": {
													borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
												},
												"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
													border: error ? `1px solid ${theme.palette.error.main}` : `1px solid ${theme.palette.primary.main}`,
												},
											}}
											startAdornment={
												<InputAdornment position="start">
													<Sms variant="Bold" size={20} style={{ color: theme.palette.primary.main }} />
												</InputAdornment>
											}
										/>
										<Button
											variant="contained"
											color="primary"
											disabled={loading}
											onClick={handleSubscribe}
											sx={{
												position: "absolute",
												right: 4,
												top: 4,
												height: 46,
												borderRadius: 1.5,
												px: 2.5,
												fontSize: "1rem",
												fontWeight: 500,
												"&:hover": {
													boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
												},
											}}
											endIcon={loading ? undefined : <Send size={18} />}
										>
											{loading ? <CircularProgress size={24} color="inherit" /> : "Suscríbete"}
										</Button>

										{error && (
											<FormHelperText error id="newsletter-error">
												{error}
											</FormHelperText>
										)}
									</Box>

									<Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 2 }}>
										Nunca compartiremos tu correo con terceros. Lee nuestra política de privacidad para más información.
									</Typography>
								</Grid>
							</Grid>
						</FadeInWhenVisible>
					</Grid>

					<Grid item xs={12} md={6} sx={{ display: { xs: "none", md: "block" } }}>
						<FadeInWhenVisible>
							<Box
								sx={{
									position: "relative",
									py: 8,
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Box
									sx={{
										maxWidth: 400,
										position: "relative",
										"&:before": {
											content: '""',
											position: "absolute",
											width: 500,
											height: 500,
											borderRadius: "50%",
											top: -100,
											right: -200,
											background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(
												theme.palette.primary.main,
												0.05,
											)} 50%, transparent 70%)`,
											zIndex: 0,
										},
									}}
								>
									<Box sx={{ position: "relative", zIndex: 1 }}>
										<Typography variant="h2" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
											Newsletter
										</Typography>
										<Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
											Artículos exclusivos, eventos legales, actualizaciones de funciones y mucho más.
										</Typography>

										<Box
											sx={{
												p: 2.5,
												bgcolor: theme.palette.background.paper,
												borderRadius: 2,
												boxShadow: theme.shadows[4],
												border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
												maxWidth: 300,
											}}
										>
											<Typography variant="h6" gutterBottom>
												¿Qué recibirás?
											</Typography>
											<Box component="ul" sx={{ pl: 2 }}>
												{[
													"Actualizaciones de nuevas funciones",
													"Guías y tutoriales prácticos",
													"Noticias relevantes del sector legal",
													"Ofertas especiales y descuentos",
												].map((item, index) => (
													<Typography component="li" key={index} variant="body2" color="textSecondary" sx={{ mb: 1 }}>
														{item}
													</Typography>
												))}
											</Box>
										</Box>
									</Box>
								</Box>
							</Box>
						</FadeInWhenVisible>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default ContactUsPage;
