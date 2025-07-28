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
	Select,
	MenuItem,
	FormControl,
} from "@mui/material";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";
import axios from "axios";

// project-imports
import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import { updateUserProfile, addUserSkills, deleteUserSkill } from "store/reducers/auth";

// assets
import { Trash, Edit2, InfoCircle } from "iconsax-react";

// Interfaces para el tipo de datos
interface LawyerCollege {
	_id: string;
	name: string;
	abbreviation: string;
}

// Interfaz para los colegios de abogados con matrícula
interface LawyerCollegeWithRegistration {
	_id?: string;
	name: string;
	registrationNumber: string;
	taxCondition: "autonomo" | "monotributo" | "";
	taxCode: string;
	electronicAddress: string;
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
	const [editingSkills, setEditingSkills] = useState<Set<number>>(new Set());
	const inputRef = useInputRef();
	const userData = useSelector((state) => state.auth);

	// Helper functions for safe error access
	const getFieldError = (errors: any, touched: any, fieldPath: string): string | undefined => {
		const pathParts = fieldPath.split(".");
		let error = errors;
		let touch = touched;

		for (const part of pathParts) {
			if (part.includes("[") && part.includes("]")) {
				const field = part.substring(0, part.indexOf("["));
				const index = parseInt(part.substring(part.indexOf("[") + 1, part.indexOf("]")));
				error = error?.[field]?.[index];
				touch = touch?.[field]?.[index];
			} else {
				error = error?.[part];
				touch = touch?.[part];
			}
		}

		return touch && error ? error : undefined;
	};

	// Format CUIT as user types
	const formatCUIT = (value: string): string => {
		// Remove all non-digits
		const numbers = value.replace(/\D/g, '');
		
		// Limit to 11 digits
		const truncated = numbers.substring(0, 11);
		
		// Apply format XX-XXXXXXXX-X
		if (truncated.length <= 2) {
			return truncated;
		} else if (truncated.length <= 10) {
			return `${truncated.substring(0, 2)}-${truncated.substring(2)}`;
		} else {
			return `${truncated.substring(0, 2)}-${truncated.substring(2, 10)}-${truncated.substring(10)}`;
		}
	};

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
			// Formatear el CUIT cuando viene del servidor
			return (userData.user.skill as LawyerCollegeWithRegistration[]).map(skill => ({
				...skill,
				taxCode: skill.taxCode ? formatCUIT(skill.taxCode.toString()) : ""
			}));
		}

		// Si es un array de strings (formato antiguo)
		if (Array.isArray(userData.user.skill)) {
			return (userData.user.skill as string[]).map((name) => ({
				name,
				registrationNumber: "",
				taxCondition: "" as const,
				taxCode: "",
				electronicAddress: "",
			}));
		}

		return [];
	};

	return (
		<MainCard content={false} title="Información Profesional" sx={{ "& .MuiInputLabel-root": { fontSize: "0.875rem" } }}>
			<Formik<FormValues>
				enableReinitialize
				initialValues={{
					colleges: formatInitialColleges(),
					designation: userData.user?.designation || "",
					submit: null,
				}}
				validationSchema={Yup.object().shape({
					colleges: Yup.array().of(
						Yup.object().shape({
							name: Yup.string().required("El nombre del colegio es requerido"),
							registrationNumber: Yup.string().required("El número de matrícula es requerido"),
							taxCondition: Yup.string()
								.required("La condición fiscal es requerida")
								.oneOf(["autonomo", "monotributo"], "Debe seleccionar Autónomo o Monotributo"),
							taxCode: Yup.string()
								.required("El CUIT es requerido")
								.matches(/^\d{2}-\d{8}-\d{1}$/, "El formato del CUIT debe ser XX-XXXXXXXX-X"),
							electronicAddress: Yup.string().required("El domicilio electrónico es requerido"),
						}),
					),
					designation: Yup.string().max(255),
					experienceYears: Yup.string(),
				})}
				onSubmit={async (values, { setErrors, setStatus, setSubmitting, setFieldValue }) => {
					setLoading(true);
					try {
						// Validate that all college entries have complete information
						const invalidColleges = values.colleges.filter(
							(college) =>
								!college.name || !college.registrationNumber || !college.taxCondition || !college.taxCode || !college.electronicAddress,
						);

						if (invalidColleges.length > 0) {
							setErrors({
								submit: "Por favor complete todos los campos requeridos para cada colegio profesional",
							});
							return;
						}

						// First update the designation using the existing updateUserProfile
						if (values.designation) {
							await dispatch(updateUserProfile({ designation: values.designation }));
						}

						// Then update the skills using the new addUserSkills action
						if (values.colleges && values.colleges.length > 0) {
							const result = await dispatch(addUserSkills(values.colleges));
							// Update the form with the skills returned from the server (which include _id)
							if (result && result.skills) {
								// Format CUIT when updating from server response
								const formattedSkills = result.skills.map((skill: any) => ({
									...skill,
									taxCode: skill.taxCode ? formatCUIT(skill.taxCode.toString()) : ""
								}));
								setFieldValue("colleges", formattedSkills);
								// Clear editing state since all skills are now saved
								setEditingSkills(new Set());
							}
						}

						setStatus({ success: true });
					} catch (err: any) {
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
												setFieldValue("colleges", [
													...values.colleges,
													{
														name: newValue,
														registrationNumber: "",
														taxCondition: "" as const,
														taxCode: "",
														electronicAddress: "",
													},
												]);
											}
										}}
									/>

									{values.colleges.length > 0 ? (
										<Stack spacing={3} sx={{ mt: 2 }}>
											<Typography variant="subtitle2">Matrículas en Colegios Profesionales</Typography>

											{values.colleges.map((college, index) => (
												<Box
													key={index}
													sx={{
														p: 3,
														borderRadius: 1,
														border: "1px solid",
														borderColor: "divider",
														position: "relative",
													}}
												>
													<Grid container spacing={2}>
														{/* Nombre del colegio y botones de acción */}
														<Grid item xs={12}>
															<Stack direction="row" justifyContent="space-between" alignItems="center">
																<Typography variant="subtitle2" sx={{ mb: 1 }}>
																	{college.name}
																</Typography>
																<Stack direction="row" spacing={1}>
																	{/* Show edit button only for saved skills */}
																	{!!college._id && (
																		<Tooltip title={editingSkills.has(index) ? "Guardar cambios" : "Editar"}>
																			<IconButton
																				size="small"
																				aria-label="edit"
																				onClick={async () => {
																					if (editingSkills.has(index)) {
																						// Save changes
																						try {
																							await handleSubmit();
																							const newEditingSkills = new Set(editingSkills);
																							newEditingSkills.delete(index);
																							setEditingSkills(newEditingSkills);
																						} catch (error) {
																							console.error("Error saving skill:", error);
																						}
																					} else {
																						// Enter edit mode
																						const newEditingSkills = new Set(editingSkills);
																						newEditingSkills.add(index);
																						setEditingSkills(newEditingSkills);
																					}
																				}}
																				color="primary"
																			>
																				<Edit2 variant="Bulk" />
																			</IconButton>
																		</Tooltip>
																	)}
																	{/* Show delete button only for saved skills or new unsaved skills */}
																	{(college._id || !college._id) && (
																		<Tooltip title="Eliminar">
																			<IconButton
																				size="small"
																				aria-label="delete"
																				onClick={async () => {
																					try {
																						// If the college has an _id, it exists in the database and needs to be deleted via API
																						if (college._id) {
																							const result = await dispatch(deleteUserSkill(college._id));
																							// Update the form with the remaining skills from the server
																							if (result && result.skills) {
																								// Format CUIT when updating from server response
																								const formattedSkills = result.skills.map((skill: any) => ({
																									...skill,
																									taxCode: skill.taxCode ? formatCUIT(skill.taxCode.toString()) : ""
																								}));
																								setFieldValue("colleges", formattedSkills);
																							}
																						} else {
																							// Otherwise, it's a new entry that hasn't been saved yet, just remove from form
																							const updatedColleges = [...values.colleges];
																							updatedColleges.splice(index, 1);
																							setFieldValue("colleges", updatedColleges);
																						}
																					} catch (error) {
																						console.error("Error deleting skill:", error);
																					}
																				}}
																				color="error"
																				disabled={!!college._id && editingSkills.has(index)}
																			>
																				<Trash variant="Bulk" />
																			</IconButton>
																		</Tooltip>
																	)}
																</Stack>
															</Stack>
														</Grid>

														{/* Número de matrícula */}
														<Grid item xs={12} sm={6}>
															<Stack spacing={1}>
																<InputLabel htmlFor={`college-${index}-registration`}>Número de matrícula</InputLabel>
																{!!college._id && !editingSkills.has(index) ? (
																	<Typography variant="body2" sx={{ py: 1 }}>
																		{college.registrationNumber}
																	</Typography>
																) : (
																	<TextField
																		fullWidth
																		id={`college-${index}-registration`}
																		value={college.registrationNumber}
																		name={`colleges[${index}].registrationNumber`}
																		onBlur={handleBlur}
																		onChange={handleChange}
																		placeholder="Ej: 12345"
																		error={Boolean(getFieldError(errors, touched, `colleges[${index}].registrationNumber`))}
																		helperText={getFieldError(errors, touched, `colleges[${index}].registrationNumber`)}
																	/>
																)}
															</Stack>
														</Grid>

														{/* Condición fiscal */}
														<Grid item xs={12} sm={6}>
															<Stack spacing={1}>
																<InputLabel htmlFor={`college-${index}-taxCondition`}>Condición fiscal</InputLabel>
																{!!college._id && !editingSkills.has(index) ? (
																	<Typography variant="body2" sx={{ py: 1, textTransform: 'capitalize' }}>
																		{college.taxCondition === 'autonomo' ? 'Autónomo' : 'Monotributo'}
																	</Typography>
																) : (
																	<FormControl fullWidth>
																		<Select
																			id={`college-${index}-taxCondition`}
																			value={college.taxCondition}
																			name={`colleges[${index}].taxCondition`}
																			onChange={handleChange}
																			onBlur={handleBlur}
																			error={Boolean(getFieldError(errors, touched, `colleges[${index}].taxCondition`))}
																		>
																			<MenuItem value="">Seleccione una opción</MenuItem>
																			<MenuItem value="autonomo">Autónomo</MenuItem>
																			<MenuItem value="monotributo">Monotributo</MenuItem>
																		</Select>
																		{getFieldError(errors, touched, `colleges[${index}].taxCondition`) && (
																			<FormHelperText error>
																				{getFieldError(errors, touched, `colleges[${index}].taxCondition`)}
																			</FormHelperText>
																		)}
																	</FormControl>
																)}
															</Stack>
														</Grid>

														{/* CUIT */}
														<Grid item xs={12} sm={6}>
															<Stack spacing={1}>
																<InputLabel htmlFor={`college-${index}-taxCode`}>CUIT</InputLabel>
																{!!college._id && !editingSkills.has(index) ? (
																	<Typography variant="body2" sx={{ py: 1 }}>
																		{college.taxCode}
																	</Typography>
																) : (
																	<TextField
																		fullWidth
																		id={`college-${index}-taxCode`}
																		value={college.taxCode}
																		name={`colleges[${index}].taxCode`}
																		onBlur={handleBlur}
																		onChange={(e) => {
																			const formattedValue = formatCUIT(e.target.value);
																			setFieldValue(`colleges[${index}].taxCode`, formattedValue);
																		}}
																		placeholder="XX-XXXXXXXX-X"
																		inputProps={{ maxLength: 13 }}
																		error={Boolean(getFieldError(errors, touched, `colleges[${index}].taxCode`))}
																		helperText={getFieldError(errors, touched, `colleges[${index}].taxCode`)}
																	/>
																)}
															</Stack>
														</Grid>

														{/* Domicilio electrónico */}
														<Grid item xs={12} sm={6}>
															<Stack spacing={1}>
																<InputLabel htmlFor={`college-${index}-electronicAddress`}>Domicilio electrónico</InputLabel>
																{!!college._id && !editingSkills.has(index) ? (
																	<Typography variant="body2" sx={{ py: 1 }}>
																		{college.electronicAddress}
																	</Typography>
																) : (
																	<TextField
																		fullWidth
																		id={`college-${index}-electronicAddress`}
																		value={college.electronicAddress}
																		name={`colleges[${index}].electronicAddress`}
																		onBlur={handleBlur}
																		onChange={handleChange}
																		placeholder="ejemplo@domicilio.com o 20123456789"
																		error={Boolean(getFieldError(errors, touched, `colleges[${index}].electronicAddress`))}
																		helperText={getFieldError(errors, touched, `colleges[${index}].electronicAddress`)}
																	/>
																)}
															</Stack>
														</Grid>
													</Grid>
												</Box>
											))}
										</Stack>
									) : (
										<Box
											sx={{
												my: 3,
												p: 2.5,
												textAlign: "center",
												borderRadius: 1.5,
												border: "2px dashed",
												borderColor: "warning.main",
												bgcolor: "warning.lighter",
												backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.08)' : 'rgba(255, 193, 7, 0.08)'
											}}
										>
											<Stack spacing={1.5} alignItems="center">
												<Stack direction="row" spacing={1} alignItems="center">
													<InfoCircle size={24} color="#f59e0b" variant="Bold" />
													<Typography variant="subtitle1" color="warning.dark" fontWeight="bold">
														Información Profesional Requerida
													</Typography>
												</Stack>
												<Typography variant="body2" color="text.primary" sx={{ maxWidth: 500 }}>
													No hay colegios de abogados registrados. Esta información es <strong>necesaria</strong> para generar automáticamente escritos judiciales y documentos legales.
												</Typography>
												<Typography variant="caption" color="warning.dark" sx={{ fontStyle: 'italic' }}>
													Agregue al menos un colegio profesional con su matrícula correspondiente.
												</Typography>
											</Stack>
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
								<Tooltip 
									title={values.colleges.length === 0 ? "Debe agregar al menos un colegio profesional para guardar" : ""}
									arrow
								>
									<span>
										<Button
											disabled={isSubmitting || loading || values.colleges.length === 0}
											type="submit"
											variant="contained"
											startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
										>
											{loading ? "Guardando..." : "Guardar"}
										</Button>
									</span>
								</Tooltip>
							</Stack>
						</Box>
					</form>
				)}
			</Formik>
		</MainCard>
	);
};

export default TabProfessional;
