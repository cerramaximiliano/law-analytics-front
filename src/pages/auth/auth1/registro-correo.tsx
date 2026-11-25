import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import type { CredentialResponse } from "@react-oauth/google";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Alert, Box, Button, CircularProgress, Container, Grid, Stack, Typography, useMediaQuery } from "@mui/material";

// icons
import { Notification, TickCircle, DocumentText1, Sms } from "iconsax-react";

// project-imports
import Logo from "components/logo";
import MainCard from "components/MainCard";
import PageBackground from "components/PageBackground";
import LogoDrawLoader from "components/logo/LogoDrawLoader";
import CustomGoogleButton from "components/auth/CustomGoogleButton";
import PanelCausasAnimado from "components/auth/PanelCausasAnimado";
import AuthDivider from "sections/auth/AuthDivider";
import useAuth from "hooks/useAuth";
import { useDeferredGoogleLogin } from "hooks/useDeferredGoogleLogin";
import { trackRegisterView, trackSignUp, trackGoogleSignupClick, trackRegisterFormSubmit, trackRegisterFormError } from "utils/gtm";
import { getAttributionPayload, resolveInternalSource } from "utils/attribution";

// ==============================|| REGISTRO DE UN CLIC DESDE EL CORREO ||============================== //
//
// Destino de {{registroUrl}} en los correos de captación (la-marketing-service): /registro/correo?t=<token>&source=email-pjn.
// El token lo firma el servicio de campañas por contacto y lo canjea el hub (GET/POST /api/auth/registro-link).
// - GET: trae el correo del contacto (se muestra, no se escribe). No crea nada: los antivirus abren los enlaces solos.
// - Botón: POST crea la cuenta ya verificada (el enlace llegó a esa casilla) y abre la sesión; de ahí, directo a
//   conectar la cuenta del PJN (/dashboard/default?conectar=pjn).
// - Si el correo ya tiene cuenta: al login con el correo escrito (por state, nunca en la URL: GA4 la guarda).
// - Enlace vencido o roto: al registro común con el mismo source.
//
// Eventos (docs/tracking-map.md §3 en la-ads): register_view al montar; register_form_submit y sign_up con
// method "email_link"; register_form_error con api_409/api_410/api_400; google_signup_click y sign_up "google"
// para el botón de Google. register_form_start no se dispara: no hay formulario que tipear.

type Estado =
	| { tipo: "cargando" }
	| { tipo: "listo"; email: string }
	| { tipo: "existe"; email: string }
	| { tipo: "invalido"; vencido: boolean };

const API = import.meta.env.VITE_BASE_URL;
const DESTINO_CONECTAR = "/dashboard/default?conectar=pjn";
const LIVE_GREEN = "#22C55E";
const BRAND_BLUE = "#3A7BFF";
const BRAND_GRADIENT_TEXT = "linear-gradient(90deg, #3A7BFF, #8A5CFF, #3A7BFF) 0 0 / 400% 100%";

const VALOR = [
	{ icon: DocumentText1, texto: "Conectás tu usuario del PJN y en un minuto ves todas tus causas, con sus movimientos." },
	{ icon: Notification, texto: "Se actualizan solas: cada día a las 19 te avisamos qué se movió." },
	{ icon: TickCircle, texto: "Gratis, sin tarjeta. Cancelás cuando quieras." },
];

const RegistroCorreo = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const location = useLocation();
	const navigate = useNavigate();
	const { loginWithGoogle, isLoggedIn } = useAuth();

	const params = new URLSearchParams(location.search);
	const token = params.get("t") || "";
	const source = resolveInternalSource(params) ?? "email-pjn";
	const feature = params.get("feature") || undefined;
	const registroComun = `/register?source=${encodeURIComponent(source)}`;

	const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
	const [creando, setCreando] = useState(false);
	const [googleCargando, setGoogleCargando] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		trackRegisterView(source, feature);
	}, [source, feature]);

	useEffect(() => {
		if (!token) {
			setEstado({ tipo: "invalido", vencido: false });
			return;
		}
		let vivo = true;
		axios
			.get<{ email: string; existe: boolean }>(`${API}/api/auth/registro-link`, { params: { t: token }, withCredentials: true })
			.then(({ data }) => {
				if (!vivo) return;
				setEstado(data.existe ? { tipo: "existe", email: data.email } : { tipo: "listo", email: data.email });
			})
			.catch((err) => {
				if (!vivo) return;
				setEstado({ tipo: "invalido", vencido: err?.response?.status === 410 });
			});
		return () => {
			vivo = false;
		};
	}, [token]);

	const crearCuenta = async () => {
		setError(null);
		setCreando(true);
		trackRegisterFormSubmit("email_link", source, feature);
		try {
			await axios.post(
				`${API}/api/auth/registro-link`,
				{ t: token, attribution: getAttributionPayload(source, feature ?? null, params.get("jurisdiction")) },
				{ withCredentials: true },
			);
			trackSignUp("email_link", source, feature);
			// Carga completa: el contexto de sesión arranca con /auth/me y las cookies que dejó el hub.
			setTimeout(() => {
				window.location.href = DESTINO_CONECTAR;
			}, 300);
		} catch (err: any) {
			const status = err?.response?.status;
			trackRegisterFormError(status ? `api_${status}` : "api_network", err?.response?.data?.message, source);
			setCreando(false);
			if (status === 409 && err?.response?.data?.email) {
				setEstado({ tipo: "existe", email: err.response.data.email });
			} else if (status === 410 || status === 400) {
				setEstado({ tipo: "invalido", vencido: status === 410 });
			} else {
				setError("No pudimos crear la cuenta. Probá de nuevo o continuá con Google.");
			}
		}
	};

	const handleGoogleSuccess = async (tokenResponse: any) => {
		setGoogleCargando(true);
		try {
			const credentialResponse: CredentialResponse = {
				clientId: tokenResponse.clientId || "",
				credential: tokenResponse.access_token,
				select_by: "user",
			};
			const result = await loginWithGoogle(credentialResponse);
			if (result.isNewUser) trackSignUp("google", source, feature);
			window.location.href = result.isNewUser ? DESTINO_CONECTAR : "/dashboard/default";
		} catch {
			setError("Error al autenticar con Google. Intentá nuevamente.");
			setGoogleCargando(false);
		}
	};

	const { login: googleLogin, warm: warmGoogle } = useDeferredGoogleLogin({
		onSuccess: handleGoogleSuccess,
		onError: () => {
			setError("Error al iniciar sesión con Google. Intentá nuevamente.");
			setGoogleCargando(false);
		},
	});

	const handleGoogleClick = () => {
		trackGoogleSignupClick(source, feature);
		googleLogin();
	};

	const irAlLogin = (email: string) => navigate("/login", { state: { email } });

	const botonGoogle = (texto: string) => (
		<CustomGoogleButton
			onClick={handleGoogleClick}
			onWarm={warmGoogle}
			disabled={googleCargando || creando}
			showLoader={googleCargando}
			text={texto}
			fullWidth
			sx={{
				py: 1.4,
				bgcolor: theme.palette.background.paper,
				color: theme.palette.text.primary,
				border: `1px solid ${alpha(theme.palette.text.primary, 0.18)}`,
				"&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.04) },
			}}
		/>
	);

	const legales = (
		<Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", fontSize: "0.68rem", lineHeight: 1.6, opacity: 0.8 }}>
			Al continuar aceptás los{" "}
			<Typography
				component={Link}
				to="/terms"
				target="_blank"
				rel="noopener noreferrer"
				variant="caption"
				sx={{ fontSize: "0.68rem", textDecoration: "none" }}
			>
				términos
			</Typography>{" "}
			y la{" "}
			<Typography
				component={Link}
				to="/privacy-policy"
				target="_blank"
				rel="noopener noreferrer"
				variant="caption"
				sx={{ fontSize: "0.68rem", textDecoration: "none" }}
			>
				política de privacidad
			</Typography>
			.
		</Typography>
	);

	const correoBox = (email: string, rotulo = "Tu cuenta va a ser") => (
		<Stack
			direction="row"
			spacing={1.25}
			alignItems="center"
			sx={{
				px: 1.75,
				py: 1.25,
				borderRadius: 1.5,
				bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.06),
				border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.18)}`,
			}}
		>
			<Sms size={20} color={theme.palette.primary.main} />
			<Box sx={{ minWidth: 0 }}>
				<Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
					{rotulo}
				</Typography>
				<Typography sx={{ fontWeight: 600, fontSize: "0.95rem", overflowWrap: "anywhere" }} data-hj-suppress>
					{email}
				</Typography>
			</Box>
		</Stack>
	);

	const renderContenido = () => {
		if (isLoggedIn) {
			return (
				<Stack spacing={2}>
					<Typography variant="h4">Ya iniciaste sesión</Typography>
					<Button variant="contained" size="large" fullWidth href={DESTINO_CONECTAR}>
						Conectar mi cuenta del PJN
					</Button>
				</Stack>
			);
		}

		if (estado.tipo === "cargando") {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
					<CircularProgress size={28} />
				</Box>
			);
		}

		if (estado.tipo === "invalido") {
			return (
				<Stack spacing={2}>
					<Alert severity="info" sx={{ py: 0.5 }}>
						{estado.vencido ? "Este enlace ya venció." : "No pudimos leer este enlace."} Igual te registrás en un minuto.
					</Alert>
					<Button variant="contained" size="large" fullWidth component={Link} to={registroComun}>
						Crear mi cuenta gratis
					</Button>
				</Stack>
			);
		}

		if (estado.tipo === "existe") {
			return (
				<Stack spacing={2}>
					<Typography sx={{ fontSize: "1.05rem", fontWeight: 600 }}>Ya tenés una cuenta con este correo</Typography>
					{correoBox(estado.email, "Tu correo")}
					<Button variant="contained" size="large" fullWidth onClick={() => irAlLogin(estado.email)}>
						Iniciar sesión
					</Button>
					{botonGoogle("Entrar con Google")}
					<Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
						¿No recordás la contraseña?{" "}
						<Typography component={Link} to="/forgot-password" variant="caption" sx={{ textDecoration: "none" }}>
							Recuperala
						</Typography>
					</Typography>
				</Stack>
			);
		}

		return (
			<Stack spacing={2}>
				{correoBox(estado.email)}
				{error && (
					<Alert severity="error" sx={{ py: 0.5 }}>
						{error}
					</Alert>
				)}
				<Button
					variant="contained"
					size="large"
					fullWidth
					disabled={creando || googleCargando}
					onClick={crearCuenta}
					sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600 }}
				>
					Crear mi cuenta y conectar el PJN
				</Button>
				<AuthDivider>
					<Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7, fontSize: "0.72rem" }}>
						o
					</Typography>
				</AuthDivider>
				{botonGoogle("Continuar con Google")}
				{legales}
				<Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
					¿Preferís otro correo?{" "}
					<Typography component={Link} to={registroComun} variant="caption" sx={{ textDecoration: "none" }}>
						Registrate acá
					</Typography>
				</Typography>
			</Stack>
		);
	};

	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				minHeight: { xs: "100dvh", sm: "100vh" },
				bgcolor: theme.palette.background.default,
				py: { xs: 4, sm: 6, md: 8 },
				display: "flex",
				alignItems: "center",
			}}
		>
			<PageBackground variant="default" />
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: { xs: "-8%", md: "-12%" },
					right: { xs: "-20%", md: "-10%" },
					width: { xs: 380, md: 620 },
					height: { xs: 380, md: 620 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.13)} 0%, transparent 62%)`,
					filter: "blur(60px)",
					pointerEvents: "none",
				}}
			/>
			<Container sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 3 } }}>
				<Grid container alignItems="center" justifyContent="center" spacing={{ xs: 3, md: 6 }}>
					<Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center" }}>
						<MainCard
							content={false}
							sx={{
								width: "100%",
								maxWidth: 460,
								boxShadow: `0 30px 60px ${alpha("#0F172A", isDark ? 0.35 : 0.12)}, 0 12px 28px ${alpha("#0F172A", isDark ? 0.25 : 0.08)}`,
								border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
							}}
						>
							<Box sx={{ p: { xs: 3, sm: 3.5, md: 4 }, position: "relative" }}>
								{creando && (
									<Box
										sx={{
											position: "absolute",
											inset: 0,
											zIndex: 10,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(theme.palette.background.paper, 0.94),
										}}
									>
										<LogoDrawLoader caption="Creando tu cuenta..." />
									</Box>
								)}
								<Stack spacing={3}>
									<Box sx={{ textAlign: "center" }}>
										<Logo to="/" />
									</Box>
									<Stack spacing={1}>
										<Typography
											component="h1"
											sx={{
												fontSize: { xs: "1.6rem", sm: "1.75rem" },
												fontWeight: 600,
												lineHeight: 1.22,
												letterSpacing: "-0.02em",
												textWrap: "balance",
											}}
										>
											Tus causas del PJN,
											<Box
												component="span"
												sx={{
													display: "block",
													background: BRAND_GRADIENT_TEXT,
													color: "transparent",
													WebkitBackgroundClip: "text",
													backgroundClip: "text",
													animation: "move-bg-registro-correo 24s infinite linear",
													"@keyframes move-bg-registro-correo": { "100%": { backgroundPosition: "400% 0" } },
												}}
											>
												actualizadas solas
											</Box>
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.9rem", textWrap: "pretty" }}>
											Creá tu cuenta gratis y conectá el PJN en un minuto.
										</Typography>
									</Stack>
									<Stack spacing={1.25}>
										{VALOR.map(({ icon: Icono, texto }) => (
											<Stack key={texto} direction="row" spacing={1.25} alignItems="flex-start">
												<Box sx={{ flexShrink: 0, mt: "1px", lineHeight: 0 }}>
													<Icono size={18} variant="Bulk" color={LIVE_GREEN} />
												</Box>
												<Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.86rem", lineHeight: 1.5 }}>
													{texto}
												</Typography>
											</Stack>
										))}
									</Stack>
									{renderContenido()}
								</Stack>
							</Box>
						</MainCard>
					</Grid>
					{!isMobile && (
						<Grid item md={6} sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
							<Stack spacing={3} alignItems="center" sx={{ width: "100%", maxWidth: 540, textAlign: "center" }}>
								<PanelCausasAnimado />
								<Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.9rem", maxWidth: 420, textWrap: "pretty" }}>
									Conectás el PJN una vez: tus causas se cargan solas y cada día a las 19 te avisamos qué se movió.
								</Typography>
							</Stack>
						</Grid>
					)}
				</Grid>
			</Container>
		</Box>
	);
};

export default RegistroCorreo;
