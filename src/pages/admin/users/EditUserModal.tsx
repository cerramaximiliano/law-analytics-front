import React, { useState } from "react";
import { useSelector } from "react-redux";
import { dispatch } from "store/index";

// material-ui
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormHelperText,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
} from "@mui/material";

// project imports
import { User } from "types/user";
import { DefaultRootStateProps } from "types/root";
import userApi from "utils/userApi";
import { SET_ERROR, UPDATE_USER } from "store/reducers/users";

// assets
import { CloseCircle } from "iconsax-react";

// third party
import * as Yup from "yup";
import { Formik } from "formik";

interface EditUserModalProps {
	user: User;
	open: boolean;
	onClose: () => void;
}

// Los roles disponibles en el sistema
const availableRoles = [
	{ value: "USER_ROLE", label: "Usuario" },
	{ value: "ADMIN_ROLE", label: "Administrador" },
];

// Los estados disponibles para un usuario
const availableStatuses = [
	{ value: "active", label: "Activo" },
	{ value: "inactive", label: "Inactivo" },
	{ value: "pending", label: "Pendiente" },
];

const EditUserModal: React.FC<EditUserModalProps> = ({ user, open, onClose }) => {
	const { loading } = useSelector((state: DefaultRootStateProps) => state.users);
	const [error, setError] = useState<string | null>(null);

	// Valores iniciales para el formulario
	const initialValues = {
		name: user?.name || "",
		email: user?.email || "",
		role: user?.role || "USER_ROLE",
		status: user?.status || "active",
		phone: user?.phone || "",
	};

	// Esquema de validación
	const validationSchema = Yup.object().shape({
		name: Yup.string().required("El nombre es requerido"),
		email: Yup.string().email("Email inválido").required("El email es requerido"),
		role: Yup.string().required("El rol es requerido"),
		status: Yup.string().required("El estado es requerido"),
		phone: Yup.string(),
	});

	// Función para manejar el envío del formulario
	const handleSubmit = async (values: any, { setSubmitting }: any) => {
		try {
			setError(null);
			const payload = {
				...values,
				id: user.id,
			};

			// Realizar la petición a la API
			const response = await userApi.put(`/api/users/${user.id}`, payload);
			console.log("Usuario actualizado:", response.data);

			// Actualizar el estado global
			const updatedUser = response.data.user || response.data;
			dispatch({
				type: UPDATE_USER,
				payload: updatedUser,
			});

			// Cerrar el modal
			onClose();
		} catch (err: any) {
			console.error("Error al actualizar usuario:", err);
			setError(err.message || "Error al actualizar el usuario");
			dispatch({
				type: SET_ERROR,
				payload: err.message || "Error al actualizar el usuario",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					Editar Usuario
					<IconButton onClick={onClose} size="small">
						<CloseCircle size={20} />
					</IconButton>
				</Stack>
			</DialogTitle>
			<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
					<form noValidate onSubmit={handleSubmit}>
						<DialogContent>
							<Grid container spacing={3}>
								<Grid item xs={12}>
									<TextField
										fullWidth
										id="name"
										name="name"
										label="Nombre"
										value={values.name}
										onChange={handleChange}
										onBlur={handleBlur}
										error={Boolean(touched.name && errors.name)}
										helperText={touched.name && errors.name}
									/>
								</Grid>
								<Grid item xs={12}>
									<TextField
										fullWidth
										id="email"
										name="email"
										label="Email"
										value={values.email}
										onChange={handleChange}
										onBlur={handleBlur}
										error={Boolean(touched.email && errors.email)}
										helperText={touched.email && errors.email}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<FormControl fullWidth error={Boolean(touched.role && errors.role)}>
										<InputLabel id="role-label">Rol</InputLabel>
										<Select
											labelId="role-label"
											id="role"
											name="role"
											value={values.role}
											label="Rol"
											onChange={handleChange}
											onBlur={handleBlur}
										>
											{availableRoles.map((role) => (
												<MenuItem key={role.value} value={role.value}>
													{role.label}
												</MenuItem>
											))}
										</Select>
										{touched.role && errors.role && <FormHelperText>{errors.role}</FormHelperText>}
									</FormControl>
								</Grid>
								<Grid item xs={12} md={6}>
									<FormControl fullWidth error={Boolean(touched.status && errors.status)}>
										<InputLabel id="status-label">Estado</InputLabel>
										<Select
											labelId="status-label"
											id="status"
											name="status"
											value={values.status}
											label="Estado"
											onChange={handleChange}
											onBlur={handleBlur}
										>
											{availableStatuses.map((status) => (
												<MenuItem key={status.value} value={status.value}>
													{status.label}
												</MenuItem>
											))}
										</Select>
										{touched.status && errors.status && <FormHelperText>{errors.status}</FormHelperText>}
									</FormControl>
								</Grid>
								<Grid item xs={12}>
									<TextField
										fullWidth
										id="phone"
										name="phone"
										label="Teléfono (opcional)"
										value={values.phone}
										onChange={handleChange}
										onBlur={handleBlur}
										error={Boolean(touched.phone && errors.phone)}
										helperText={touched.phone && errors.phone}
									/>
								</Grid>
								{error && (
									<Grid item xs={12}>
										<Box sx={{ color: "error.main", mt: 2 }}>{error}</Box>
									</Grid>
								)}
							</Grid>
						</DialogContent>
						<DialogActions>
							<Button onClick={onClose} color="secondary">
								Cancelar
							</Button>
							<Button type="submit" variant="contained" color="primary" disabled={isSubmitting || loading}>
								Guardar Cambios
							</Button>
						</DialogActions>
					</form>
				)}
			</Formik>
		</Dialog>
	);
};

export default EditUserModal;
