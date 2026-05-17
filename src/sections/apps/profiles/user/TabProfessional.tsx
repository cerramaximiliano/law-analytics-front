import React from "react";
import { RefObject, useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router";

// material-ui
import {
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	FormControl,
	FormHelperText,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// third-party
import * as Yup from "yup";
import { Formik } from "formik";
import axios from "axios";

// project-imports
import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import { updateUserProfile, addUserSkills, deleteUserSkill } from "store/reducers/auth";
import { useFormWithSnackbar } from "hooks/useFormWithSnackbar";

// assets
import { Trash, Edit2, Briefcase, Building, Warning2 } from "iconsax-react";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";

// Interfaces
interface LawyerCollege {
	_id: string;
	name: string;
	abbreviation: string;
	province: string;
}

interface LawyerCollegeWithRegistration {
	_id?: string;
	name: string;
	registrationNumber: string;
	taxCondition: "autonomo" | "monotributo" | "";
	taxCode: string;
	electronicAddress: string;
	physicalAddress?: string;
}

interface FormValues {
	colleges: LawyerCollegeWithRegistration[];
	designation: string;
	submit: null;
}

function useInputRef() {
	return useOutletContext<RefObject<HTMLInputElement>>();
}

// ── Section header brand ───────────────────────────────────────────────────────

const SectionHeader = ({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: React.ReactNode }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Stack direction="row" spacing={1.25} alignItems="center">
			<Box
				sx={{
					width: 32,
					height: 32,
					borderRadius: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					flexShrink: 0,
				}}
			>
				{icon}
			</Box>
			<Stack spacing={0.125}>
				<Stack direction="row" spacing={0.625} alignItems="center">
					<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
					<Typography
						sx={{
							fontSize: "0.6rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						{eyebrow}
					</Typography>
				</Stack>
				<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>{title}</Typography>
			</Stack>
		</Stack>
	);
};

// ==============================|| USER PROFILE - PROFESSIONAL INFO ||============================== //

const TabProfessional = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [loading, setLoading] = useState(false);
	const [collegesList, setCollegesList] = useState<LawyerCollege[]>([]);
	const [collegesLoading, setCollegesLoading] = useState(false);
	const [editingSkills, setEditingSkills] = useState<Set<number>>(new Set());
	const inputRef = useInputRef();
	const userData = useSelector((state) => state.auth);

	const setFieldValueRef = useRef<((field: string, value: any) => void) | null>(null);
	const setEditingSkillsRef = useRef(setEditingSkills);

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

	const formatCUIT = (value: string): string => {
		const numbers = value.replace(/\D/g, "");
		const truncated = numbers.substring(0, 11);
		if (truncated.length <= 2) return truncated;
		if (truncated.length <= 10) return `${truncated.substring(0, 2)}-${truncated.substring(2)}`;
		return `${truncated.substring(0, 2)}-${truncated.substring(2, 10)}-${truncated.substring(10)}`;
	};

	useEffect(() => {
		const fetchColleges = async () => {
			setCollegesLoading(true);
			try {
				const response = await axios.get("/api/colleges/?fields=name,province");
				if (response.data.success) {
					const sorted = [...response.data.data].sort((a: LawyerCollege, b: LawyerCollege) => {
						const prov = a.province.localeCompare(b.province, "es");
						return prov !== 0 ? prov : a.name.localeCompare(b.name, "es");
					});
					setCollegesList(sorted);
				}
			} catch (error) {
			} finally {
				setCollegesLoading(false);
			}
		};
		fetchColleges();
	}, []);

	const formatInitialColleges = (): LawyerCollegeWithRegistration[] => {
		if (!userData.user?.skill) return [];
		if (Array.isArray(userData.user.skill) && userData.user.skill.length > 0 && typeof userData.user.skill[0] === "object") {
			return (userData.user.skill as LawyerCollegeWithRegistration[]).map((skill) => ({
				...skill,
				taxCode: skill.taxCode ? formatCUIT(skill.taxCode.toString()) : "",
			}));
		}
		if (Array.isArray(userData.user.skill)) {
			return (userData.user.skill as string[]).map((name) => ({
				name,
				registrationNumber: "",
				taxCondition: "" as const,
				taxCode: "",
				electronicAddress: "",
				physicalAddress: "",
			}));
		}
		return [];
	};

	const handleSubmit = useFormWithSnackbar({
		onSubmit: async (values: FormValues) => {
			setLoading(true);
			try {
				const invalidColleges = values.colleges.filter(
					(college) =>
						!college.name || !college.registrationNumber || !college.taxCondition || !college.taxCode || !college.electronicAddress,
				);

				if (invalidColleges.length > 0) {
					throw new Error("Por favor completá todos los campos requeridos para cada colegio profesional");
				}

				if (values.designation) {
					await dispatch(updateUserProfile({ designation: values.designation }));
				}

				if (values.colleges && values.colleges.length > 0) {
					const result = await dispatch(addUserSkills(values.colleges));
					if (result && result.skills) {
						const formattedSkills = result.skills.map((skill: any) => ({
							...skill,
							taxCode: skill.taxCode ? formatCUIT(skill.taxCode.toString()) : "",
						}));
						setFieldValueRef.current?.("colleges", formattedSkills);
						setEditingSkillsRef.current(new Set());
					}
				}
			} finally {
				setLoading(false);
			}
		},
		successMessage: "Información profesional actualizada correctamente",
		errorMessage: "Error al actualizar información profesional",
	});

	// Brand helpers
	const labelSx = {
		fontSize: "0.72rem",
		fontWeight: 600,
		letterSpacing: "0.04em",
		textTransform: "uppercase" as const,
		color: "text.secondary",
	};
	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1.25,
			fontSize: "0.875rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14), transition: "border-color 0.15s ease" },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
	};
	const selectSx = {
		borderRadius: 1.25,
		fontSize: "0.875rem",
		"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
		"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
		"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
	};
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.75,
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};
	const brandPrimarySx = {
		minWidth: 120,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const iconBtnSx = {
		width: 28,
		height: 28,
		borderRadius: 1,
		color: "text.secondary",
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	};
	const iconBtnDestructiveSx = {
		...iconBtnSx,
		"&:hover": { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, isDark ? 0.14 : 0.08) },
	};
	const hairline = <Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08), my: 2.5 }} />;

	return (
		<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, p: 2.5 }}>
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
				})}
				onSubmit={handleSubmit}
			>
				{({ errors, handleBlur, handleChange, handleSubmit: formikHandleSubmit, isSubmitting, setFieldValue, touched, values, resetForm }) => {
					setFieldValueRef.current = setFieldValue;
					setEditingSkillsRef.current = setEditingSkills;
					return (
						<form noValidate onSubmit={formikHandleSubmit}>
							{/* Cargo */}
							<SectionHeader eyebrow="Información profesional" title="Cargo" icon={<Briefcase size={16} variant="Bulk" />} />
							<Box sx={{ mt: 2 }}>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<Stack spacing={0.75}>
											<InputLabel htmlFor="professional-designation" sx={labelSx}>
												Cargo profesional
											</InputLabel>
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
												sx={inputSx}
											/>
											{touched.designation && errors.designation && (
												<FormHelperText error sx={{ fontSize: "0.7rem" }}>
													{typeof errors.designation === "string" ? errors.designation : "Error en el campo"}
												</FormHelperText>
											)}
										</Stack>
									</Grid>
								</Grid>
							</Box>

							{hairline}

							{/* Colegios */}
							<SectionHeader eyebrow="Matrículas" title="Colegios profesionales" icon={<Building size={16} variant="Bulk" />} />
							<Box sx={{ mt: 2 }}>
								{collegesLoading ? (
									<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200, width: "100%" }}>
										<CircularProgress size={36} sx={{ color: BRAND_BLUE }} />
									</Box>
								) : (
									<>
										<Stack spacing={0.75} sx={{ mb: 2 }}>
											<InputLabel htmlFor="add-college" sx={labelSx}>
												Agregar colegio
											</InputLabel>
											<Autocomplete
												fullWidth
												id="add-college"
												options={collegesList.filter((c) => !values.colleges.some((college) => college.name === c.name))}
												getOptionLabel={(option) => option.name}
												groupBy={(option) => option.province}
												renderInput={(params) => <TextField {...params} placeholder="Buscar colegio de abogados..." sx={inputSx} />}
												onChange={(_event, newValue) => {
													if (newValue) {
														setFieldValue("colleges", [
															...values.colleges,
															{
																name: newValue.name,
																registrationNumber: "",
																taxCondition: "" as const,
																taxCode: "",
																electronicAddress: "",
															},
														]);
													}
												}}
											/>
										</Stack>

										{values.colleges.length > 0 ? (
											<Grid container spacing={1.5}>
												{values.colleges.map((college, index) => {
													const isReadOnly = !!college._id && !editingSkills.has(index);
													return (
														<Grid item xs={12} md={6} key={index} sx={{ display: "flex" }}>
															<Box
																sx={{
																	width: "100%",
																	p: 1.5,
																	borderRadius: 1.25,
																	bgcolor: "background.paper",
																	border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
																}}
															>
															<Stack spacing={1}>
																{/* Header de la card */}
																<Stack direction="row" justifyContent="space-between" alignItems="center">
																	<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
																		<Box
																			sx={{
																				width: 28,
																				height: 28,
																				borderRadius: 1,
																				display: "flex",
																				alignItems: "center",
																				justifyContent: "center",
																				bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
																				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
																				color: BRAND_BLUE,
																				flexShrink: 0,
																			}}
																		>
																			<Building size={14} variant="Bulk" />
																		</Box>
																		<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
																			{college.name}
																		</Typography>
																	</Stack>
																	<Stack direction="row" spacing={0.25}>
																		{!!college._id && (
																			<Tooltip title={editingSkills.has(index) ? "Guardar cambios" : "Editar"}>
																				<IconButton
																					sx={iconBtnSx}
																					onClick={async () => {
																						if (editingSkills.has(index)) {
																							try {
																								await formikHandleSubmit();
																								const newEditingSkills = new Set(editingSkills);
																								newEditingSkills.delete(index);
																								setEditingSkills(newEditingSkills);
																							} catch (error) {
																								console.error("Error saving skill:", error);
																							}
																						} else {
																							const newEditingSkills = new Set(editingSkills);
																							newEditingSkills.add(index);
																							setEditingSkills(newEditingSkills);
																						}
																					}}
																				>
																					<Edit2 size={14} variant="Linear" />
																				</IconButton>
																			</Tooltip>
																		)}
																		<Tooltip title="Eliminar">
																			<IconButton
																				sx={iconBtnDestructiveSx}
																				disabled={!!college._id && editingSkills.has(index)}
																				onClick={async () => {
																					try {
																						if (college._id) {
																							const result = await dispatch(deleteUserSkill(college._id));
																							if (result && result.skills) {
																								const formattedSkills = result.skills.map((skill: any) => ({
																									...skill,
																									taxCode: skill.taxCode ? formatCUIT(skill.taxCode.toString()) : "",
																								}));
																								setFieldValue("colleges", formattedSkills);
																							}
																						} else {
																							const updatedColleges = [...values.colleges];
																							updatedColleges.splice(index, 1);
																							setFieldValue("colleges", updatedColleges);
																						}
																					} catch (error) {
																						console.error("Error deleting skill:", error);
																					}
																				}}
																			>
																				<Trash size={14} variant="Linear" />
																			</IconButton>
																		</Tooltip>
																	</Stack>
																</Stack>

																<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06) }} />

																{/* Fields */}
																<Grid container spacing={2}>
																	{/* Número de matrícula */}
																	<Grid item xs={12}>
																		<Stack spacing={0.75}>
																			<InputLabel htmlFor={`college-${index}-registration`} sx={labelSx}>
																				Número de matrícula
																			</InputLabel>
																			{isReadOnly ? (
																				<Typography sx={{ fontSize: "0.85rem", color: "text.primary", py: 0.5 }}>
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
																					sx={inputSx}
																				/>
																			)}
																		</Stack>
																	</Grid>

																	{/* Condición fiscal */}
																	<Grid item xs={12}>
																		<Stack spacing={0.75}>
																			<InputLabel htmlFor={`college-${index}-taxCondition`} sx={labelSx}>
																				Condición fiscal
																			</InputLabel>
																			{isReadOnly ? (
																				<Typography sx={{ fontSize: "0.85rem", color: "text.primary", py: 0.5, textTransform: "capitalize" }}>
																					{college.taxCondition === "autonomo" ? "Autónomo" : "Monotributo"}
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
																						sx={selectSx}
																					>
																						<MenuItem value="">Seleccioná una opción</MenuItem>
																						<MenuItem value="autonomo">Autónomo</MenuItem>
																						<MenuItem value="monotributo">Monotributo</MenuItem>
																					</Select>
																					{getFieldError(errors, touched, `colleges[${index}].taxCondition`) && (
																						<FormHelperText error sx={{ fontSize: "0.7rem" }}>
																							{getFieldError(errors, touched, `colleges[${index}].taxCondition`)}
																						</FormHelperText>
																					)}
																				</FormControl>
																			)}
																		</Stack>
																	</Grid>

																	{/* CUIT */}
																	<Grid item xs={12}>
																		<Stack spacing={0.75}>
																			<InputLabel htmlFor={`college-${index}-taxCode`} sx={labelSx}>
																				CUIT
																			</InputLabel>
																			{isReadOnly ? (
																				<Typography sx={{ fontSize: "0.85rem", color: "text.primary", py: 0.5, fontVariantNumeric: "tabular-nums" }}>
																					{college.taxCode}
																				</Typography>
																			) : (
																				<TextField
																					fullWidth
																					id={`college-${index}-taxCode`}
																					value={college.taxCode}
																					name={`colleges[${index}].taxCode`}
																					onBlur={handleBlur}
																					onChange={(e) => setFieldValue(`colleges[${index}].taxCode`, formatCUIT(e.target.value))}
																					placeholder="XX-XXXXXXXX-X"
																					inputProps={{ maxLength: 13 }}
																					error={Boolean(getFieldError(errors, touched, `colleges[${index}].taxCode`))}
																					helperText={getFieldError(errors, touched, `colleges[${index}].taxCode`)}
																					sx={inputSx}
																				/>
																			)}
																		</Stack>
																	</Grid>

																	{/* Domicilio electrónico */}
																	<Grid item xs={12}>
																		<Stack spacing={0.75}>
																			<InputLabel htmlFor={`college-${index}-electronicAddress`} sx={labelSx}>
																				Domicilio electrónico
																			</InputLabel>
																			{isReadOnly ? (
																				<Typography sx={{ fontSize: "0.85rem", color: "text.primary", py: 0.5 }}>
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
																					sx={inputSx}
																				/>
																			)}
																		</Stack>
																	</Grid>

																	{/* Domicilio físico */}
																	<Grid item xs={12}>
																		<Stack spacing={0.75}>
																			<InputLabel htmlFor={`college-${index}-physicalAddress`} sx={labelSx}>
																				Domicilio físico constituido
																			</InputLabel>
																			{isReadOnly ? (
																				<Typography sx={{ fontSize: "0.85rem", color: college.physicalAddress ? "text.primary" : "text.secondary", py: 0.5 }}>
																					{college.physicalAddress || "No cargado"}
																				</Typography>
																			) : (
																				<TextField
																					fullWidth
																					id={`college-${index}-physicalAddress`}
																					value={college.physicalAddress || ""}
																					name={`colleges[${index}].physicalAddress`}
																					onBlur={handleBlur}
																					onChange={handleChange}
																					placeholder="Ej: Av. Corrientes 1234, CABA"
																					sx={inputSx}
																				/>
																			)}
																		</Stack>
																	</Grid>
																</Grid>
															</Stack>
															</Box>
														</Grid>
													);
												})}
											</Grid>
										) : (
											<Box
												sx={{
													position: "relative",
													overflow: "hidden",
													my: 2,
													p: 3,
													textAlign: "center",
													borderRadius: 1.5,
													bgcolor: alpha(STALE_AMBER, isDark ? 0.08 : 0.04),
													border: `1px dashed ${alpha(STALE_AMBER, isDark ? 0.4 : 0.3)}`,
												}}
											>
												<Box
													sx={{
														position: "absolute",
														top: -60,
														left: "50%",
														transform: "translateX(-50%)",
														width: 240,
														height: 240,
														borderRadius: "50%",
														background: `radial-gradient(circle, ${alpha(STALE_AMBER, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
														pointerEvents: "none",
													}}
												/>
												<Stack spacing={1.25} alignItems="center" sx={{ position: "relative" }}>
													<Box
														sx={{
															width: 48,
															height: 48,
															borderRadius: 1.5,
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.08),
															border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
															color: STALE_AMBER,
														}}
													>
														<Warning2 size={22} variant="Bulk" />
													</Box>
													<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
														Información profesional requerida
													</Typography>
													<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", maxWidth: 480, textWrap: "pretty" }}>
														No hay colegios de abogados registrados. Esta información es{" "}
														<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
															necesaria
														</Box>{" "}
														para generar automáticamente escritos judiciales y documentos legales.
													</Typography>
													<Typography sx={{ fontSize: "0.72rem", color: STALE_AMBER, fontStyle: "italic", letterSpacing: "-0.005em" }}>
														Agregá al menos un colegio profesional con su matrícula correspondiente.
													</Typography>
												</Stack>
											</Box>
										)}
									</>
								)}

								{errors.submit && (
									<Box sx={{ mt: 2 }}>
										<FormHelperText error sx={{ fontSize: "0.7rem" }}>
											{typeof errors.submit === "string" ? errors.submit : "Error al guardar"}
										</FormHelperText>
									</Box>
								)}

								<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1.25} sx={{ mt: 3 }}>
									<Button onClick={() => resetForm()} sx={ghostBtnSx}>
										Cancelar
									</Button>
									<Tooltip title={values.colleges.length === 0 ? "Debe agregar al menos un colegio profesional para guardar" : ""} arrow>
										<span>
											<Button
												disabled={isSubmitting || loading || values.colleges.length === 0}
												type="submit"
												variant="contained"
												startIcon={isSubmitting || loading ? <CircularProgress size={14} color="inherit" /> : null}
												sx={brandPrimarySx}
											>
												{isSubmitting || loading ? "Guardando..." : "Guardar"}
											</Button>
										</span>
									</Tooltip>
								</Stack>
							</Box>
						</form>
					);
				}}
			</Formik>
		</MainCard>
	);
};

export default TabProfessional;
