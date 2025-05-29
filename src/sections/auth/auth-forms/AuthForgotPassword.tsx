import { useNavigate } from "react-router-dom";

// material-ui
import { Button, FormHelperText, Grid, InputLabel, OutlinedInput, Stack, Typography } from "@mui/material";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";

// project-imports
import useAuth from "hooks/useAuth";
import useScriptRef from "hooks/useScriptRef";
import AnimateButton from "components/@extended/AnimateButton";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import secureStorage from "services/secureStorage";

// ============================|| AUTH - FORGOT PASSWORD ||============================ //

const AuthForgotPassword = () => {
	const scriptedRef = useScriptRef();
	const navigate = useNavigate();

	const { resetPassword } = useAuth();

	return (
		<>
			<Formik
				initialValues={{
					email: "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					email: Yup.string().email("Debe ser un formato válido").max(255).required("El correo es requerido"),
				})}
				onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
					try {
						await resetPassword(values.email).then(
							() => {
								setStatus({ success: true });
								setSubmitting(false);
								dispatch(
									openSnackbar({
										open: true,
										message: "Revisa tu correo electrónico para obtener el código de verificación",
										variant: "alert",
										alert: {
											color: "success",
										},
										close: false,
									}),
								);

								// Navegar a la página de verificación de código con el email
								// Usar la ruta correcta: /auth/code-verification
								// Almacenar en localStorage que estamos en proceso de reseteo
								// Esto ayudará a mantener el contexto incluso si se recarga la página
								secureStorage.setSessionData("reset_in_progress", true);
								secureStorage.setSessionData("reset_email", values.email);

								setTimeout(() => {
									navigate("/auth/code-verification", {
										state: { email: values.email, mode: "reset" },
										replace: true,
									});
								}, 1500);
							},
							(err: any) => {
								setStatus({ success: false });
								setErrors({ submit: err.response.data.message });
								setSubmitting(false);
							},
						);
					} catch (err: any) {
						if (scriptedRef.current) {
							setStatus({ success: false });
							setErrors({ submit: err.response.data.message });
							setSubmitting(false);
						}
					}
				}}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
					<form noValidate onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="email-forgot">Correo Electrónico</InputLabel>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.email && errors.email)}
										id="email-forgot"
										type="email"
										value={values.email}
										name="email"
										onBlur={handleBlur}
										onChange={handleChange}
										placeholder="Ingrese su correo electrónico"
										inputProps={{}}
									/>
									{touched.email && errors.email && (
										<FormHelperText error id="helper-text-email-forgot">
											{errors.email}
										</FormHelperText>
									)}
								</Stack>
							</Grid>
							<Grid item xs={12} sx={{ mb: -2 }}>
								<Typography variant="caption">
									Recibirás un código de verificación en tu correo. No olvides revisar la casilla de SPAM.
								</Typography>
							</Grid>
							{errors.submit && (
								<Grid item xs={12}>
									<FormHelperText error>{errors.submit}</FormHelperText>
								</Grid>
							)}
							<Grid item xs={12}>
								<AnimateButton>
									<Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
										Enviar Código de Verificación
									</Button>
								</AnimateButton>
							</Grid>
						</Grid>
					</form>
				)}
			</Formik>
		</>
	);
};

export default AuthForgotPassword;
