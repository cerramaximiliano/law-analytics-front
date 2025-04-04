import { useState, useRef, FC } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	Button,
	Alert,
	AlertTitle,
	Box,
	Typography,
	Grid,
	Stack,
	InputLabel,
	OutlinedInput,
	FormHelperText,
	InputAdornment,
	Divider,
	CircularProgress,
} from "@mui/material";
import { Eye, EyeSlash } from "iconsax-react";
import * as Yup from "yup";
import { Formik, FormikHelpers } from "formik";
import IconButton from "components/@extended/IconButton";
import { GoogleLogin } from "@react-oauth/google";
import { UnauthorizedModalProps, FormValues } from "types/auth";

const validationSchema = Yup.object().shape({
	email: Yup.string().email("Debe ser un e-mail válido").required("El e-mail es requerido").trim(),
	password: Yup.string().required("El password es requerido").min(6, "El password debe tener al menos 6 caracteres"),
});

const initialValues: FormValues = {
	email: "",
	password: "",
	submit: null,
};

export const UnauthorizedModal: FC<UnauthorizedModalProps> = ({ open, onClose, onLogin, onGoogleLogin, onLogout }) => {
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submitAttempts = useRef(0);
	const maxRetries = 3;

	const handleFormSubmit = async (values: FormValues, { setErrors, setStatus }: FormikHelpers<FormValues>) => {
		if (isSubmitting) return;

		try {
			setIsSubmitting(true);
			submitAttempts.current += 1;

			await validationSchema.validate(values, { abortEarly: false });
			await onLogin(values.email.trim(), values.password);

			setStatus({ success: true });
			onClose();
		} catch (err: unknown) {
			console.error("Login error:", err);

			setStatus({ success: false });

			// Manejar errores con tipado seguro
			let errorMessage = "Error al iniciar sesión";

			if (err instanceof Error) {
				errorMessage = err.message;
			} else if (typeof err === "object" && err !== null) {
				const errorObj = err as { response?: { data?: { message?: string } } };
				if (errorObj.response?.data?.message) {
					errorMessage = errorObj.response.data.message;
				}
			}

			setErrors({
				submit: `${errorMessage}${submitAttempts.current >= maxRetries ? ". Demasiados intentos, serás redirigido." : ""}`,
			});

			if (submitAttempts.current >= maxRetries) {
				setTimeout(onLogout, 2000);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSuccess = async (credentialResponse: any) => {
		try {
			setIsSubmitting(true);
			await onGoogleLogin(credentialResponse);
			onClose();
		} catch (error) {
			console.error("Google login error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown={isSubmitting}>
			<DialogTitle>
				<Box display="flex" alignItems="center">
					<Typography variant="h5">Sesión Expirada</Typography>
				</Box>
			</DialogTitle>
			<DialogContent>
				<Alert severity="error" sx={{ mb: 2 }}>
					<AlertTitle>No Autorizado</AlertTitle>
					Tu sesión ha expirado o no tienes autorización para acceder a este recurso. Por favor, inicia sesión nuevamente.
				</Alert>

				<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleFormSubmit}>
					{({ errors, handleBlur, handleChange, handleSubmit, touched, values }) => (
						<form noValidate onSubmit={handleSubmit}>
							<Grid container spacing={3}>
								<Grid item xs={12}>
									<Stack spacing={1}>
										<InputLabel htmlFor="email-login">Email</InputLabel>
										<OutlinedInput
											id="email-login"
											type="email"
											value={values.email}
											name="email"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Ingresa tu email"
											fullWidth
											error={Boolean(touched.email && errors.email)}
											disabled={isSubmitting}
										/>
										{touched.email && errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
									</Stack>
								</Grid>

								<Grid item xs={12}>
									<Stack spacing={1}>
										<InputLabel htmlFor="password-login">Password</InputLabel>
										<OutlinedInput
											fullWidth
											error={Boolean(touched.password && errors.password)}
											id="password-login"
											type={showPassword ? "text" : "password"}
											value={values.password}
											name="password"
											onBlur={handleBlur}
											onChange={handleChange}
											disabled={isSubmitting}
											endAdornment={
												<InputAdornment position="end">
													<IconButton onClick={() => setShowPassword(!showPassword)} edge="end" color="secondary" disabled={isSubmitting}>
														{showPassword ? <Eye /> : <EyeSlash />}
													</IconButton>
												</InputAdornment>
											}
											placeholder="Ingresa tu password"
										/>
										{touched.password && errors.password && <FormHelperText error>{errors.password}</FormHelperText>}
									</Stack>
								</Grid>

								{errors.submit && (
									<Grid item xs={12}>
										<FormHelperText error>{errors.submit}</FormHelperText>
									</Grid>
								)}

								<Grid item xs={12}>
									<Stack spacing={2}>
										<Button variant="contained" type="submit" fullWidth disabled={isSubmitting}>
											{isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Iniciar Sesión"}
										</Button>

										<Divider>
											<Typography variant="caption" color="textSecondary">
												O
											</Typography>
										</Divider>

										<Box sx={{ width: "100%" }}>
											<GoogleLogin
												onSuccess={handleGoogleSuccess}
												onError={() => console.error("Error al iniciar sesión con Google")}
												theme="filled_blue"
												size="large"
												shape="rectangular"
												useOneTap={false}
												text="continue_with"
												type="standard"
												width={400}
											/>
										</Box>

										<Button variant="outlined" color="secondary" onClick={onLogout} fullWidth disabled={isSubmitting}>
											Cancelar
										</Button>
									</Stack>
								</Grid>
							</Grid>
						</form>
					)}
				</Formik>
			</DialogContent>
		</Dialog>
	);
};

export default UnauthorizedModal;
