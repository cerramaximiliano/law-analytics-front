import React, { useState } from "react";
import { dispatch } from "store/index";

// material-ui
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Grid,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";

// project imports
import { User } from "types/user";
import userApi from "utils/userApi";
import { SET_ERROR } from "store/reducers/users";

// third party
import * as Yup from "yup";
import { Formik } from "formik";

interface GenerateDataModalProps {
	user: User;
	open: boolean;
	onClose: () => void;
}

const GenerateDataModal: React.FC<GenerateDataModalProps> = ({ user, open, onClose }) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Valores iniciales para el formulario
	const initialValues = {
		folders: 0,
		calculators: 0,
		contacts: 0,
		ignoreLimits: false,
	};

	// Esquema de validación
	const validationSchema = Yup.object().shape({
		folders: Yup.number().min(0, "Debe ser un número positivo").required("Requerido"),
		calculators: Yup.number().min(0, "Debe ser un número positivo").required("Requerido"),
		contacts: Yup.number().min(0, "Debe ser un número positivo").required("Requerido"),
		ignoreLimits: Yup.boolean(),
	});

	// Función para manejar el envío del formulario
	const handleSubmit = async (values: any, { setSubmitting }: any) => {
		try {
			setError(null);
			setSuccess(null);
			setLoading(true);

			// Verificar que al menos uno de los valores sea mayor que cero
			if (values.folders === 0 && values.calculators === 0 && values.contacts === 0) {
				setError("Debe especificar al menos un valor mayor que cero");
				setSubmitting(false);
				setLoading(false);
				return;
			}

			const payload = {
				folders: values.folders > 0 ? values.folders : undefined,
				calculators: values.calculators > 0 ? values.calculators : undefined,
				contacts: values.contacts > 0 ? values.contacts : undefined,
				ignoreLimits: values.ignoreLimits,
			};

			// Realizar la petición a la API
			const response = await userApi.post(`/api/users/${user._id}/generate-data`, payload);
			console.log("Datos generados:", response.data);

			// Mostrar mensaje de éxito
			setSuccess("Datos generados exitosamente");

			// Cerrar el modal después de 2 segundos
			setTimeout(() => {
				onClose();
			}, 2000);
		} catch (err: any) {
			console.error("Error al generar datos:", err);
			setError(err.response?.data?.message || err.message || "Error al generar datos");
			dispatch({
				type: SET_ERROR,
				payload: err.message || "Error al generar datos",
			});
		} finally {
			setSubmitting(false);
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Generar Datos para {user.name}</DialogTitle>
			<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => (
					<form noValidate onSubmit={handleSubmit}>
						<DialogContent>
							<Grid container spacing={3}>
								<Grid item xs={12}>
									<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
										Especifica la cantidad de cada tipo de dato a generar para este usuario.
									</Typography>
								</Grid>
								<Grid item xs={12} md={4}>
									<TextField
										fullWidth
										id="folders"
										name="folders"
										label="Carpetas"
										type="number"
										value={values.folders}
										onChange={handleChange}
										onBlur={handleBlur}
										error={Boolean(touched.folders && errors.folders)}
										helperText={touched.folders && errors.folders}
										InputProps={{ inputProps: { min: 0 } }}
									/>
								</Grid>
								<Grid item xs={12} md={4}>
									<TextField
										fullWidth
										id="calculators"
										name="calculators"
										label="Calculadoras"
										type="number"
										value={values.calculators}
										onChange={handleChange}
										onBlur={handleBlur}
										error={Boolean(touched.calculators && errors.calculators)}
										helperText={touched.calculators && errors.calculators}
										InputProps={{ inputProps: { min: 0 } }}
									/>
								</Grid>
								<Grid item xs={12} md={4}>
									<TextField
										fullWidth
										id="contacts"
										name="contacts"
										label="Contactos"
										type="number"
										value={values.contacts}
										onChange={handleChange}
										onBlur={handleBlur}
										error={Boolean(touched.contacts && errors.contacts)}
										helperText={touched.contacts && errors.contacts}
										InputProps={{ inputProps: { min: 0 } }}
									/>
								</Grid>
								<Grid item xs={12}>
									<FormControlLabel
										control={
											<Switch
												checked={values.ignoreLimits}
												onChange={(e) => setFieldValue("ignoreLimits", e.target.checked)}
												name="ignoreLimits"
												color="primary"
											/>
										}
										label="Forzar límites de suscripción"
									/>
									<Typography variant="caption" color="textSecondary" display="block">
										Al activar esta opción, se ignorarán los límites de la suscripción del usuario.
									</Typography>
								</Grid>
								{error && (
									<Grid item xs={12}>
										<Box sx={{ color: "error.main", mt: 2 }}>{error}</Box>
									</Grid>
								)}
								{success && (
									<Grid item xs={12}>
										<Box sx={{ color: "success.main", mt: 2 }}>{success}</Box>
									</Grid>
								)}
							</Grid>
						</DialogContent>
						<DialogActions>
							<Stack direction="row" spacing={1} justifyContent="flex-end">
								<Button onClick={onClose} color="secondary">
									Cancelar
								</Button>
								<Button type="submit" variant="contained" color="primary" disabled={isSubmitting || loading}>
									Generar Datos
								</Button>
							</Stack>
						</DialogActions>
					</form>
				)}
			</Formik>
		</Dialog>
	);
};

export default GenerateDataModal;
