/**
 * /oauth/login — pantalla de login para el flow OAuth (MCP server).
 *
 * Flow:
 *  1. Cliente IA (Claude.ai, ChatGPT, etc.) → Hydra /oauth2/auth → redirige acá
 *     con ?login_challenge=X
 *  2. Esta página carga GET /api/oauth/login/context para enriquecer el banner
 *     con info del cliente OAuth.
 *  3. User submitea credenciales (email/pwd o Google) → POST a los endpoints
 *     OAuth-específicos del hub (NO /api/auth/login del flow estándar).
 *  4. Hub valida credenciales y llama acceptLoginRequest en Hydra; nos devuelve
 *     `redirect_to` con la URL a la que el browser tiene que ir para continuar
 *     el flow OAuth.
 *
 * NO usa useAuth().login ni loginWithGoogle del ServerContext — esos crean una
 * sesión del hub (cookie JWT) que NO queremos acá. El OAuth flow emite su propio
 * token via Hydra al final del consent.
 *
 * Tracking: dispatch eventos oauth_login_* (NO register_* / login_success — no es
 * un signup ni un login estándar). Ver la-ads/docs/tracking-map.md §7.
 */

import { SyntheticEvent, useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

// material-ui
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	FormHelperText,
	Grid,
	IconButton,
	InputAdornment,
	InputLabel,
	LinearProgress,
	Link,
	OutlinedInput,
	Stack,
	Typography,
} from "@mui/material";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";

// project-imports
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper from "sections/auth/AuthWrapper";
import CustomGoogleButton from "components/auth/CustomGoogleButton";
import Logo from "components/logo";
import OauthClientBanner from "sections/oauth/OauthClientBanner";
import axiosInstance from "utils/axios";
import { useOauthLoginContext } from "hooks/useOauthLoginContext";
import {
	trackOauthLoginError,
	trackOauthLoginSubmit,
	trackOauthLoginSuccess,
	trackOauthLoginView,
} from "utils/gtm";

// assets
import { Eye, EyeSlash } from "iconsax-react";

interface AcceptResponse {
	redirect_to: string;
}

interface ErrorResponse {
	error: string;
	error_description?: string;
	lockout_minutes?: number;
	register_url?: string;
	email?: string;
}

const OauthLoginPage = () => {
	const [searchParams] = useSearchParams();
	const challenge = searchParams.get("login_challenge");
	const contextState = useOauthLoginContext(challenge);

	const [showPassword, setShowPassword] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [isEmailLoading, setIsEmailLoading] = useState(false);

	const handleClickShowPassword = () => setShowPassword(!showPassword);
	const handleMouseDownPassword = (event: SyntheticEvent) => event.preventDefault();

	const clientId = contextState.status === "ready" ? contextState.context.client.client_id : null;
	const clientName = contextState.status === "ready" ? contextState.context.client.client_name : null;
	const logoUri = contextState.status === "ready" ? contextState.context.client.logo_uri || null : null;

	// Track view una sola vez cuando el context queda ready.
	// useEffect evita el anti-pattern de setState durante render.
	useEffect(() => {
		if (contextState.status === "ready") {
			trackOauthLoginView(clientId || undefined, clientName || undefined);
		}
	}, [contextState.status, clientId, clientName]);

	// Mapeo de error codes → mensajes amigables + tracking
	const handleAcceptError = (err: any, method: "email" | "google") => {
		const data = (err.response?.data as ErrorResponse) || {};
		const code = data.error || "request_failed";
		let msg = data.error_description || "Error al iniciar sesión. Intentá de nuevo.";

		if (code === "account_locked" && data.lockout_minutes) {
			msg = `Cuenta temporalmente bloqueada. Reintentá en ${data.lockout_minutes} minuto(s).`;
		} else if (code === "user_not_found" && data.email) {
			msg = `No hay una cuenta de lawanalytics asociada a ${data.email}. Registrate en lawanalytics.app primero.`;
		}

		trackOauthLoginError(code, method, clientId || undefined);
		setGlobalError(msg);
	};

	const submitGoogle = async (tokenResponse: any) => {
		setGlobalError(null);
		setIsGoogleLoading(true);
		trackOauthLoginSubmit("google", clientId || undefined);
		try {
			const res = await axiosInstance.post<AcceptResponse>("/api/oauth/login/accept-google", {
				login_challenge: challenge,
				token: tokenResponse.access_token,
				remember: true,
			});
			trackOauthLoginSuccess("google", clientId || undefined);
			window.location.href = res.data.redirect_to;
		} catch (err: any) {
			handleAcceptError(err, "google");
		} finally {
			setIsGoogleLoading(false);
		}
	};

	// useGoogleLogin debe ir antes de cualquier early return (Rules of Hooks).
	const googleLogin = useGoogleLogin({
		onSuccess: submitGoogle,
		onError: () => {
			trackOauthLoginError("google_provider_error", "google", clientId || undefined);
			setGlobalError("Error al iniciar sesión con Google. Intentá de nuevo.");
		},
		flow: "implicit",
		scope: "email profile",
	});

	// Loading inicial mientras se valida el challenge
	if (contextState.status === "loading") {
		return (
			<AuthWrapper>
				<Box sx={{ textAlign: "center", py: 4 }}>
					<CircularProgress />
					<Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
						Validando solicitud de autorización...
					</Typography>
				</Box>
			</AuthWrapper>
		);
	}

	// Challenge inválido/expirado/error de hub
	if (contextState.status === "error") {
		return (
			<AuthWrapper>
				<Grid container spacing={3}>
					<Grid item xs={12} sx={{ textAlign: "center" }}>
						<Logo />
					</Grid>
					<Grid item xs={12}>
						<Alert severity="error">
							<Typography variant="subtitle2" sx={{ mb: 0.5 }}>
								No se puede continuar
							</Typography>
							<Typography variant="body2">{contextState.message}</Typography>
						</Alert>
					</Grid>
				</Grid>
			</AuthWrapper>
		);
	}

	const isAnyLoading = isGoogleLoading || isEmailLoading;

	return (
		<AuthWrapper>
			<Box sx={{ position: "relative" }}>
				{isAnyLoading && (
					<Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000 }}>
						<LinearProgress />
					</Box>
				)}

				<Grid container spacing={3}>
					<Grid item xs={12} sx={{ textAlign: "center" }}>
						<Logo />
					</Grid>

					<Grid item xs={12}>
						{/* verified=undefined → banner NO muestra check ni warning. La verificación
						    contra allowlist sucede recién en /oauth/consent. */}
						<OauthClientBanner
							clientId={clientId}
							clientName={clientName}
							logoUrl={logoUri}
							action="te está pidiendo conectarse a tu cuenta. Ingresá para continuar."
						/>
					</Grid>

					<Grid item xs={12}>
						<Typography variant="h3">Ingresá a tu cuenta</Typography>
					</Grid>

					{globalError && (
						<Grid item xs={12}>
							<Alert severity="error">{globalError}</Alert>
						</Grid>
					)}

					<Grid item xs={12}>
						<Formik
							initialValues={{ email: "", password: "" }}
							validationSchema={Yup.object().shape({
								email: Yup.string().email("Debe ser un e-mail válido").max(255).required("El e-mail es requerido"),
								password: Yup.string().max(255).required("La contraseña es requerida"),
							})}
							onSubmit={async (values, { setSubmitting }) => {
								setGlobalError(null);
								setIsEmailLoading(true);
								trackOauthLoginSubmit("email", clientId || undefined);
								try {
									const res = await axiosInstance.post<AcceptResponse>("/api/oauth/login/accept", {
										login_challenge: challenge,
										email: values.email,
										password: values.password,
										remember: true,
									});
									trackOauthLoginSuccess("email", clientId || undefined);
									window.location.href = res.data.redirect_to;
								} catch (err: any) {
									handleAcceptError(err, "email");
									setSubmitting(false);
									setIsEmailLoading(false);
								}
							}}
						>
							{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
								<form noValidate onSubmit={handleSubmit}>
									<Grid container spacing={3}>
										<Grid item xs={12}>
											<Stack spacing={1}>
												<InputLabel htmlFor="email-oauth-login">E-mail</InputLabel>
												<OutlinedInput
													id="email-oauth-login"
													type="email"
													value={values.email}
													name="email"
													onBlur={handleBlur}
													onChange={handleChange}
													placeholder="tu@email.com"
													fullWidth
													error={Boolean(touched.email && errors.email)}
													disabled={isAnyLoading}
												/>
												{touched.email && errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
											</Stack>
										</Grid>

										<Grid item xs={12}>
											<Stack spacing={1}>
												<InputLabel htmlFor="password-oauth-login">Contraseña</InputLabel>
												<OutlinedInput
													id="password-oauth-login"
													type={showPassword ? "text" : "password"}
													value={values.password}
													name="password"
													onBlur={handleBlur}
													onChange={handleChange}
													placeholder="Tu contraseña"
													fullWidth
													error={Boolean(touched.password && errors.password)}
													disabled={isAnyLoading}
													endAdornment={
														<InputAdornment position="end">
															<IconButton
																aria-label="toggle password visibility"
																onClick={handleClickShowPassword}
																onMouseDown={handleMouseDownPassword}
																edge="end"
																color="secondary"
															>
																{showPassword ? <Eye size={20} /> : <EyeSlash size={20} />}
															</IconButton>
														</InputAdornment>
													}
												/>
												{touched.password && errors.password && (
													<FormHelperText error>{errors.password}</FormHelperText>
												)}
											</Stack>
										</Grid>

										<Grid item xs={12}>
											<Stack direction="row" justifyContent="flex-end">
												<Link
													component={RouterLink}
													to="/forgot-password"
													variant="body2"
													sx={{ pointerEvents: isAnyLoading ? "none" : "auto" }}
												>
													¿Olvidaste tu contraseña?
												</Link>
											</Stack>
										</Grid>

										<Grid item xs={12}>
											<Button
												disableElevation
												disabled={isSubmitting || isAnyLoading}
												fullWidth
												size="large"
												type="submit"
												variant="contained"
												color="primary"
											>
												{isEmailLoading ? "Ingresando..." : "Ingresar y continuar"}
											</Button>
										</Grid>
									</Grid>
								</form>
							)}
						</Formik>
					</Grid>

					<Grid item xs={12}>
						<AuthDivider>
							<Typography variant="body1">O</Typography>
						</AuthDivider>
					</Grid>

					<Grid item xs={12}>
						<CustomGoogleButton
							onClick={() => googleLogin()}
							disabled={isAnyLoading}
							text={isGoogleLoading ? "Ingresando con Google..." : "Continuar con Google"}
							fullWidth
							showLoader={isGoogleLoading}
						/>
					</Grid>

					<Grid item xs={12}>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
							Para conectar una aplicación necesitás una cuenta existente en lawanalytics.app.
						</Typography>
					</Grid>
				</Grid>
			</Box>
		</AuthWrapper>
	);
};

export default OauthLoginPage;
