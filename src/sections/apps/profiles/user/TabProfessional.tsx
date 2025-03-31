import { RefObject, useState, useEffect } from "react";
import { useOutletContext } from "react-router";

// material-ui
import {
	Autocomplete,
	Box,
	Button,
	CardHeader,
	CircularProgress,
	Divider,
	FormHelperText,
	Grid,
	InputLabel,
	Stack,
	TextField,
	Typography,
	Tooltip,
	IconButton,
} from "@mui/material";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";
import axios from "axios";

// project-imports
import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import { updateUserProfile } from "store/reducers/auth";

// assets
import { Trash } from "iconsax-react";

// Interfaces para el tipo de datos
interface LawyerCollege {
	_id: string;
	name: string;
	abbreviation: string;
}

// Interfaz para los colegios de abogados con matrícula
interface LawyerCollegeWithRegistration {
	name: string;
	registrationNumber: string;
}

// Interfaz para los valores del formulario
interface FormValues {
	colleges: LawyerCollegeWithRegistration[];
	designation: string;
	submit: null;
}

function useInputRef() {
	return useOutletContext<RefObject<HTMLInputElement>>();
}

// ==============================|| USER PROFILE - PROFESSIONAL INFO ||============================== //

const TabProfessional = () => {
	const [loading, setLoading] = useState(false);
	const [collegesList, setCollegesList] = useState<string[]>([]);
	const [collegesLoading, setCollegesLoading] = useState(false);
	const inputRef = useInputRef();
	const userData = useSelector((state) => state.auth);

	// Efecto para cargar los colegios de abogados
	useEffect(() => {
		const fetchColleges = async () => {
			setCollegesLoading(true);
			try {
				const response = await axios.get("/api/colleges/");
				if (response.data.success) {
					// Extraemos solo los nombres para usar en el Autocomplete
					const names = response.data.data.map((college: LawyerCollege) => college.name);
					setCollegesList(names);
				}
			} catch (error) {
				console.error("Error al cargar colegios de abogados:", error);
			} finally {
				setCollegesLoading(false);
			}
		};

		fetchColleges();
	}, []);

	// Convertir el formato actual (array de strings o array de objetos) a array de objetos con matrícula
	const formatInitialColleges = (): LawyerCollegeWithRegistration[] => {
		if (!userData.user?.skill) return [];

		// Si ya es un array de objetos con name y registrationNumber
		if (Array.isArray(userData.user.skill) && userData.user.skill.length > 0 && typeof userData.user.skill[0] === "object") {
			return userData.user.skill as LawyerCollegeWithRegistration[];
		}

		// Si es un array de strings (formato antiguo)
		if (Array.isArray(userData.user.skill)) {
			return (userData.user.skill as string[]).map((name) => ({
				name,
				registrationNumber: "",
			}));
		}

		return [];
	};

	return (
		<MainCard content={false} title="Información Profesional" sx={{ "& .MuiInputLabel-root": { fontSize: "0.875rem" } }}>
			<Formik<FormValues>
				initialValues={{
					colleges: formatInitialColleges(),
					designation: userData.user?.designation || "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					colleges: Yup.array().of(
						Yup.object().shape({
							name: Yup.string().required("El nombre del colegio es requerido"),
							registrationNumber: Yup.string(),
						}),
					),
					designation: Yup.string().max(255),
					experienceYears: Yup.string(),
				})}
				onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
					setLoading(true);
					try {
						// Preparar datos para enviar al servidor
						const updateData = {
							designation: values.designation,
							skill: values.colleges, // Enviamos el array de objetos
						};

						// Utilizamos la acción de Redux para actualizar el perfil
						await dispatch(updateUserProfile(updateData));
						setStatus({ success: true });
					} catch (err: any) {
						console.error("Error al actualizar información profesional:", err);

						setStatus({ success: false });
						setErrors({
							submit: err.response?.data?.message || err.message || "Error al actualizar información profesional",
						});
					} finally {
						setLoading(false);
						setSubmitting(false);
					}
				}}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, setFieldValue, touched, values }) => (
					<form noValidate onSubmit={handleSubmit}>
						<Box sx={{ p: 2.5 }}>
							<Grid container spacing={3}>
								<Grid item xs={12} sm={6}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="professional-designation">Cargo</InputLabel>
										<TextField
											fullWidth
											id="professional-designation"
											value={values.designation}
											name="designation"
											onBlur={handleBlur}
											onChange={handleChange}
											placeholder="Cargo profesional"
											autoFocus
											inputRef={inputRef}
											error={Boolean(touched.designation && errors.designation)}
										/>
										{touched.designation && errors.designation && (
											<FormHelperText error id="professional-designation-helper">
												{typeof errors.designation === "string" ? errors.designation : "Error en el campo"}
											</FormHelperText>
										)}
									</Stack>
								</Grid>
							</Grid>
						</Box>
						<CardHeader title="Colegios de Abogados" />
						<Divider />
						<Box sx={{ p: 2.5 }}>
							{collegesLoading ? (
								<Box
									sx={{
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										minHeight: 200, // Altura mínima para dar espacio visual
										width: "100%",
									}}
								>
									<CircularProgress size={40} /> {/* Tamaño un poco más grande para mejor visibilidad */}
								</Box>
							) : (
								<>
									<Autocomplete
										fullWidth
										id="add-college"
										options={collegesList.filter((name) => !values.colleges.some((college) => college.name === name))}
										renderInput={(params) => <TextField {...params} placeholder="Agregar colegio de abogados" sx={{ mb: 2 }} />}
										onChange={(event, newValue) => {
											if (newValue) {
												setFieldValue("colleges", [...values.colleges, { name: newValue, registrationNumber: "" }]);
											}
										}}
									/>

									{values.colleges.length > 0 ? (
										<Stack spacing={3} sx={{ mt: 2 }}>
											<Typography variant="subtitle2">Matrículas en Colegios Profesionales</Typography>

											{values.colleges.map((college, index) => (
												<Stack
													key={index}
													direction={{ xs: "column", sm: "row" }}
													spacing={2}
													alignItems="flex-start"
													sx={{
														p: 2,
														borderRadius: 1,
														border: "1px solid",
														borderColor: "divider",
													}}
												>
													<Stack spacing={1} sx={{ flexGrow: 1 }}>
														<InputLabel htmlFor={`college-${index}-registration`}>{college.name}</InputLabel>
														<TextField
															fullWidth
															id={`college-${index}-registration`}
															value={college.registrationNumber}
															name={`colleges[${index}].registrationNumber`}
															onBlur={handleBlur}
															onChange={handleChange}
															placeholder="Número de matrícula"
														/>
													</Stack>

													<Tooltip title="Eliminar">
														<IconButton
															size="small"
															aria-label="delete"
															onClick={() => {
																const updatedColleges = [...values.colleges];
																updatedColleges.splice(index, 1);
																setFieldValue("colleges", updatedColleges);
															}}
															color="error"
															sx={{ mt: { xs: 1, sm: 3 } }} // Añadido margen superior para alineación
														>
															<Trash variant="Bulk" />
														</IconButton>
													</Tooltip>
												</Stack>
											))}
										</Stack>
									) : (
										<Box
											sx={{
												my: 4,
												py: 3,
												textAlign: "center",
												borderRadius: 1,
												border: "1px dashed",
												borderColor: "divider",
											}}
										>
											<Typography variant="body2" color="textSecondary">
												No hay colegios de abogados seleccionados. Por favor, agregue los colegios a los que pertenece.
											</Typography>
										</Box>
									)}
								</>
							)}

							{errors.submit && (
								<Box sx={{ mt: 2 }}>
									<FormHelperText error>{typeof errors.submit === "string" ? errors.submit : "Error al guardar"}</FormHelperText>
								</Box>
							)}

							<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 3 }}>
								<Button color="error">Cancelar</Button>
								<Button
									disabled={isSubmitting || loading}
									type="submit"
									variant="contained"
									startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
								>
									{loading ? "Guardando..." : "Guardar"}
								</Button>
							</Stack>
						</Box>
					</form>
				)}
			</Formik>
		</MainCard>
	);
};

export default TabProfessional;
