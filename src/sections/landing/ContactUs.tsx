import React, { useState } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	CircularProgress,
	Container,
	FormHelperText,
	InputAdornment,
	Link,
	OutlinedInput,
	Stack,
	Typography,
} from "@mui/material";
import { Send, Sms, TickCircle } from "iconsax-react";
import { Link as RouterLink } from "react-router-dom";

// third party
import axios from "axios";

// project-imports
import FadeInWhenVisible from "./Animation";
import SectionEyebrow from "./SectionEyebrow";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// ============================== TOKENS ============================== //
const BRAND_BLUE = "#3A7BFF";

// ============================== NEWSLETTER SERVICE ============================== //

interface SubscriptionResponse {
	success: boolean;
	message: string;
}

const subscribeToNewsletter = async (email: string): Promise<SubscriptionResponse> => {
	try {
		const response = await axios.post("/api/newsletter/subscribe", { email });
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			return {
				success: false,
				message: error.response.data.message || "Ocurrió un error al suscribirse. Por favor, inténtalo de nuevo.",
			};
		}
		return {
			success: false,
			message: "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
		};
	}
};

// Bullets — mantienen el copy original a pedido del usuario.
const NEWSLETTER_BULLETS = [
	"Actualizaciones de nuevas funciones",
	"Guías y tutoriales prácticos",
	"Noticias relevantes del sector legal",
	"Ofertas especiales y descuentos",
];

// ============================== LANDING - CONTACT US ============================== //

const ContactUsPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const validateEmail = (value: string): boolean => {
		const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return re.test(value);
	};

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
		if (error) setError("");
	};

	const handleSubscribe = async () => {
		if (!email) {
			setError("Por favor, ingresá tu dirección de correo electrónico");
			return;
		}
		if (!validateEmail(email)) {
			setError("Por favor, ingresá una dirección de correo electrónico válida");
			return;
		}

		setLoading(true);
		try {
			const response = await subscribeToNewsletter(email);

			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Te suscribiste al newsletter. Gracias.",
						variant: "alert",
						alert: { color: "success", variant: "filled" },
						close: true,
					}),
				);
				setEmail("");
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message,
						variant: "alert",
						alert: { color: "error", variant: "filled" },
						close: true,
					}),
				);
			}
		} catch {
			dispatch(
				openSnackbar({
					open: true,
					message: "Ocurrió un error al procesar tu solicitud.",
					variant: "alert",
					alert: { color: "error", variant: "filled" },
					close: true,
				}),
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box
			component="section"
			sx={{
				position: "relative",
				overflow: "hidden",
				pt: { xs: 5, md: 8 },
				pb: { xs: 8, md: 12 },
			}}
		>
			{/* Atmósfera — radial soft brand-blue centrado detrás del form.
			    Cierre del landing, debe sentir foco final sin gritar. */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "40%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: { xs: 600, md: 900 },
					height: { xs: 600, md: 900 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)} 0%, transparent 65%)`,
					filter: "blur(90px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
				<FadeInWhenVisible>
					<Box sx={{ textAlign: "center", maxWidth: 720, mx: "auto" }}>
						<SectionEyebrow number="06" label="Newsletter" align="center" mb={2.5} />

						<Typography
							variant="h2"
							sx={{
								fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.75rem" },
								lineHeight: 1.08,
								letterSpacing: "-0.025em",
								textWrap: "balance",
								mb: 2,
							}}
						>
							Mantenéte al día de la práctica legal
						</Typography>

						<Typography
							color="text.secondary"
							sx={{
								maxWidth: 560,
								mx: "auto",
								mb: 4,
								fontSize: { xs: "1rem", md: "1.125rem" },
								fontWeight: 400,
								lineHeight: 1.5,
								letterSpacing: "-0.005em",
								textWrap: "pretty",
							}}
						>
							Novedades sobre integraciones, cambios normativos y mejoras de LawAnalytics. Mensual. 0 spam.
						</Typography>

						{/* Form — input + botón overlay derecha. max-width 480 para que respire centrado. */}
						<Box sx={{ position: "relative", maxWidth: 480, mx: "auto" }}>
							<OutlinedInput
								fullWidth
								id="newsletter-email"
								placeholder="tu@correo.com"
								value={email}
								onChange={handleEmailChange}
								error={Boolean(error)}
								sx={{
									pr: { xs: 13, sm: 15 },
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
									fontSize: "0.9rem",
									fontWeight: 500,
									"&:hover": {
										boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.3)}`,
									},
								}}
								endIcon={loading ? undefined : <Send size={18} />}
							>
								{loading ? <CircularProgress size={22} color="inherit" /> : "Suscribirme"}
							</Button>

							{error && (
								<FormHelperText error id="newsletter-error" sx={{ textAlign: "left", mt: 1 }}>
									{error}
								</FormHelperText>
							)}
						</Box>

						{/* Bullets — bloque centrado como conjunto, items left-aligned internamente.
						    Esto alinea los íconos verticalmente entre sí y posiciona el bloque
						    en el eje central de la sección (mismo eje que h2/h5/form de arriba). */}
						<Box
							sx={{
								mt: { xs: 4, md: 5 },
								display: "flex",
								justifyContent: "center",
							}}
						>
							<Stack spacing={1.5} sx={{ textAlign: "left" }}>
								{NEWSLETTER_BULLETS.map((bullet) => (
									<Box
										key={bullet}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<Box sx={{ flexShrink: 0, lineHeight: 0 }}>
											<TickCircle size={16} variant="Bulk" color={theme.palette.primary.main} />
										</Box>
										<Typography
											sx={{
												fontSize: "0.875rem",
												color: theme.palette.text.secondary,
												lineHeight: 1.4,
											}}
										>
											{bullet}
										</Typography>
									</Box>
								))}
							</Stack>
						</Box>

						<Typography
							variant="caption"
							color="text.secondary"
							sx={{
								display: "block",
								mt: 4,
								fontSize: "0.78rem",
							}}
						>
							Nunca compartiremos tu correo con terceros. Lee nuestra{" "}
							<Link component={RouterLink} to="/privacy-policy" color="primary" underline="hover" sx={{ fontWeight: 500 }}>
								política de privacidad
							</Link>{" "}
							para más información.
						</Typography>
					</Box>
				</FadeInWhenVisible>
			</Container>
		</Box>
	);
};

export default ContactUsPage;
