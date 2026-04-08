import React from "react";
import {
	Grid,
	InputLabel,
	Typography,
	Box,
	alpha,
	useTheme,
	FormControl,
	Select,
	MenuItem,
	FormHelperText,
	Button,
	IconButton,
	Stack,
	Alert,
	Paper,
} from "@mui/material";
import { Add, Trash } from "iconsax-react";
import { useFormikContext } from "formik";
import DateInputField from "components/UI/DateInputField";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const INDICES_MOVILIDAD = [{ value: "aumentos_generales_anses", label: "Aumentos Generales ANSES" }];

interface MovilidadCriterio {
	indiceMovilidad: string;
	fechaDesde: string;
}

interface ThirdFormProps {
	formField: any;
}

export default function ThirdForm({ formField }: ThirdFormProps) {
	const { criteriosMovilidad } = formField;

	const theme = useTheme();
	const { values, setFieldValue, errors, touched, submitCount } = useFormikContext<any>();

	const criterios: MovilidadCriterio[] = values[criteriosMovilidad.name] || [];

	const handleAddCriterio = () => {
		setFieldValue(criteriosMovilidad.name, [...criterios, { indiceMovilidad: "", fechaDesde: "" }]);
	};

	const handleRemoveCriterio = (index: number) => {
		const updated = criterios.filter((_, i) => i !== index);
		setFieldValue(criteriosMovilidad.name, updated);
	};

	const handleCriterioChange = (index: number, field: keyof MovilidadCriterio, value: string) => {
		const updated = criterios.map((c, i) => (i === index ? { ...c, [field]: value } : c));
		setFieldValue(criteriosMovilidad.name, updated);
	};

	const criterioErrors = (errors[criteriosMovilidad.name] as any[]) || [];
	const criterioTouched = (touched[criteriosMovilidad.name] as any[]) || [];
	const rootError = typeof errors[criteriosMovilidad.name] === "string" ? errors[criteriosMovilidad.name] : null;

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
				Criterios Aplicables a la Movilidad
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
				Defina los índices de movilidad aplicables. Puede agregar múltiples criterios para distintos períodos. Las fechas deben ser
				cronológicamente consecutivas.
			</Typography>

			{(rootError || (submitCount > 0 && typeof errors[criteriosMovilidad.name] === "string")) && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{rootError as string}
				</Alert>
			)}

			<Stack spacing={2}>
				{criterios.map((criterio, index) => {
					const errIndice = criterioErrors[index]?.indiceMovilidad;
					const errFecha = criterioErrors[index]?.fechaDesde;
					const touchedIndice = criterioTouched[index]?.indiceMovilidad;
					const touchedFecha = criterioTouched[index]?.fechaDesde;

					return (
						<Paper
							key={index}
							elevation={0}
							sx={{
								p: 2,
								border: `1px solid ${theme.palette.divider}`,
								borderRadius: 1,
								bgcolor: index % 2 === 0 ? theme.palette.background.paper : alpha(theme.palette.primary.main, 0.02),
							}}
						>
							<Stack direction="row" alignItems="flex-start" spacing={1}>
								<Box sx={{ flex: 1 }}>
									<Grid container spacing={2} alignItems="flex-start">
										{/* Número de período */}
										<Grid item xs={12}>
											<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
												<Box
													sx={{
														width: 24,
														height: 24,
														borderRadius: "50%",
														bgcolor: "primary.main",
														color: "primary.contrastText",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontSize: "0.75rem",
														fontWeight: 700,
														flexShrink: 0,
													}}
												>
													{index + 1}
												</Box>
												<Typography variant="subtitle2" color="text.secondary">
													{index === 0 ? "Período inicial" : `Período ${index + 1}`}
												</Typography>
											</Stack>
										</Grid>

										{/* Índice de movilidad */}
										<Grid item xs={12} md={6}>
											<InputLabel>Índice de Movilidad *</InputLabel>
											<FormControl fullWidth error={!!(touchedIndice && errIndice)}>
												<Select
													value={criterio.indiceMovilidad}
													onChange={(e) => handleCriterioChange(index, "indiceMovilidad", e.target.value)}
													displayEmpty
												>
													<MenuItem value="" disabled>
														<Typography color="text.secondary">Seleccione un índice</Typography>
													</MenuItem>
													{INDICES_MOVILIDAD.map((idx) => (
														<MenuItem key={idx.value} value={idx.value}>
															{idx.label}
														</MenuItem>
													))}
												</Select>
												{touchedIndice && errIndice && <FormHelperText>{errIndice}</FormHelperText>}
											</FormControl>
										</Grid>

										{/* Fecha desde */}
										<Grid item xs={12} md={6}>
											<InputLabel>Fecha de inicio *</InputLabel>
											<Box>
												<DateInputField
													name={`${criteriosMovilidad.name}[${index}].fechaDesde`}
												/>
											</Box>
											{index > 0 && criterios[index - 1]?.fechaDesde && (
												<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
													Debe ser posterior a {criterios[index - 1].fechaDesde}
												</Typography>
											)}
										</Grid>
									</Grid>
								</Box>

								{/* Botón eliminar */}
								{criterios.length > 1 && (
									<IconButton
										onClick={() => handleRemoveCriterio(index)}
										size="small"
										color="error"
										sx={{ mt: 3.5, flexShrink: 0 }}
									>
										<Trash size={18} />
									</IconButton>
								)}
							</Stack>
						</Paper>
					);
				})}
			</Stack>

			<Box sx={{ mt: 2 }}>
				<Button
					variant="outlined"
					startIcon={<Add size={16} />}
					onClick={handleAddCriterio}
					size="small"
				>
					Agregar criterio
				</Button>
			</Box>
		</>
	);
}
