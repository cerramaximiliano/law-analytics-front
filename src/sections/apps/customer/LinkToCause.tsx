import { useState } from "react";
import { Select, Button, Dialog, DialogActions, DialogTitle, DialogContent, Divider, Grid, MenuItem, Typography } from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

interface Props {
	openLink: boolean;
	onCancelLink: () => void;
	onLink: (cause: string) => void;
}

const LinkToCause = ({ openLink, onCancelLink, onLink }: Props) => {
	const [initialValues] = useState({ cause: "" });

	// Esquema de validación para el campo de selección
	const validationSchema = Yup.object().shape({
		cause: Yup.string().required("Debe seleccionar algún elemento de la lista"),
	});

	// Manejar la lógica de envío del formulario
	const handleSubmit = (values: { cause: string }) => {
		onLink(values.cause);
		onCancelLink(); // Cerrar el modal tras vincular
	};

	return (
		<Dialog open={openLink} onClose={onCancelLink} maxWidth="xs" fullWidth>
			<DialogTitle>Vincular con Causa</DialogTitle>
			<DialogContent>
				<Typography variant="subtitle1" gutterBottom>
					Vincule el contacto a una causa disponible
				</Typography>
				<Divider sx={{ my: 2 }} />

				<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
					{({ isSubmitting, errors, touched }) => (
						<Form>
							<Field
								component={Select}
								name="cause"
								label="Seleccionar causa"
								fullWidth
								variant="outlined"
								helperText={touched.cause && errors.cause}
								error={touched.cause && Boolean(errors.cause)}
							>
								<MenuItem value="">
									<em>Seleccione una causa</em>
								</MenuItem>
								<MenuItem value="Causa 1">Causa 1</MenuItem>
								<MenuItem value="Causa 2">Causa 2</MenuItem>
								<MenuItem value="Causa 3">Causa 3</MenuItem>
								{/* Agrega más elementos según sea necesario */}
							</Field>

							<DialogActions sx={{ mt: 3 }}>
								<Grid container justifyContent="flex-end" spacing={2}>
									<Grid item>
										<Button color="secondary" onClick={onCancelLink} variant="outlined">
											Cancelar
										</Button>
									</Grid>
									<Grid item>
										<Button type="submit" color="primary" variant="contained" disabled={isSubmitting}>
											Vincular
										</Button>
									</Grid>
								</Grid>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</DialogContent>
		</Dialog>
	);
};

export default LinkToCause;
