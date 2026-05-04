import React, { useEffect, useState } from "react";
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
	Radio,
	Collapse,
} from "@mui/material";
import { Add, Trash, Setting2 } from "iconsax-react";
import { useFormikContext } from "formik";
import DateInputField from "components/UI/DateInputField";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const INDICES_MOVILIDAD = [
	{ value: "aumentos_generales_anses", label: "Aumentos Generales ANSES por movilidad" },
	{ value: "recomposicion_ley_27426", label: "Recomposición Ley 27.426 — Torelli (salto único en 1/2021)" },
	{ value: "ley_27426_diferido_6_meses", label: "Continuidad Ley 27.426 — IPC+RIPTE mes a mes" },
	{ value: "aumento_mar_2021_sem2_2020", label: "Aumento Marzo 2021 por segundo semestre 2020 (Cortes)" },
	{ value: "ipc_trimestral_retrasado_3m", label: "IPC trimestral retrasado 3 meses (Cortes)" },
];

interface PatronMovilidad {
	value: string;
	label: string;
	descripcion: string;
	generaTramos: (fechaInicial: string) => MovilidadCriterio[];
}

const PATRONES: PatronMovilidad[] = [
	{
		value: "aumentos_generales",
		label: "Solo aumentos generales ANSES",
		descripcion: "Aplica los aumentos generales ANSES en todo el período, sin doctrinas adicionales.",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
		],
	},
	{
		value: "torelli",
		label: "Recomposición Ley 27.426 — Torelli",
		descripcion: "Aumentos generales hasta 12/2020 → recomposición Torelli en 1/2021 (salto único) → aumentos generales desde 2/2021.",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/02/2021" },
		],
	},
	{
		value: "continuidad",
		label: "Continuidad Ley 27.426",
		descripcion: "Aumentos generales hasta 1/2020 → Ley 27.426 mes a mes (2/2020 - 1/2021) → aumentos generales desde 2/2021.",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "ley_27426_diferido_6_meses", fechaDesde: "01/02/2020" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/02/2021" },
		],
	},
	{
		value: "cortes",
		label: "Precedente Cortes, Leonardo Evaristo",
		descripcion:
			"Aumentos generales hasta 12/2020 → recomposición Torelli en 1/2021 → aumento Marzo 2021 (segundo semestre 2020) → IPC trimestral retrasado 3 meses (4/2021 - 3/2024) → aumentos generales desde 4/2024.",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "aumento_mar_2021_sem2_2020", fechaDesde: "01/02/2021" },
			{ indiceMovilidad: "ipc_trimestral_retrasado_3m", fechaDesde: "01/04/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/04/2024" },
		],
	},
];

// Detecta el patrón a partir de los criterios actuales (solo por estructura de índices, ignorando fechas).
// Devuelve "personalizado" si la combinación no matchea ningún patrón conocido.
const detectarPatron = (criterios: MovilidadCriterio[]): string => {
	if (!Array.isArray(criterios) || criterios.length === 0) return "personalizado";
	const indices = criterios.map((c) => c?.indiceMovilidad);
	if (indices.length === 1 && indices[0] === "aumentos_generales_anses") return "aumentos_generales";
	if (
		indices.length === 3 &&
		indices[0] === "aumentos_generales_anses" &&
		indices[1] === "recomposicion_ley_27426" &&
		indices[2] === "aumentos_generales_anses"
	)
		return "torelli";
	if (
		indices.length === 3 &&
		indices[0] === "aumentos_generales_anses" &&
		indices[1] === "ley_27426_diferido_6_meses" &&
		indices[2] === "aumentos_generales_anses"
	)
		return "continuidad";
	if (
		indices.length === 5 &&
		indices[0] === "aumentos_generales_anses" &&
		indices[1] === "recomposicion_ley_27426" &&
		indices[2] === "aumento_mar_2021_sem2_2020" &&
		indices[3] === "ipc_trimestral_retrasado_3m" &&
		indices[4] === "aumentos_generales_anses"
	)
		return "cortes";
	return "personalizado";
};

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
	const detectado = detectarPatron(criterios);
	const isPersonalizado = detectado === "personalizado";

	const [avanzado, setAvanzado] = useState(isPersonalizado);

	// Auto-inicialización del primer renderizado: si los criterios están vacíos (placeholder)
	// y haberPagadoAl está disponible, populamos con el patrón "aumentos_generales" por default.
	useEffect(() => {
		const sinDatos =
			criterios.length === 0 ||
			(criterios.length === 1 && !criterios[0]?.indiceMovilidad && !criterios[0]?.fechaDesde);
		if (sinDatos && values.haberPagadoAl) {
			const patronDef = PATRONES.find((p) => p.value === "aumentos_generales");
			if (patronDef) {
				setFieldValue(criteriosMovilidad.name, patronDef.generaTramos(values.haberPagadoAl));
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Si el detectado es "personalizado", abrir avanzado automáticamente.
	useEffect(() => {
		if (isPersonalizado) setAvanzado(true);
	}, [isPersonalizado]);

	const handlePatronChange = (nuevoPatron: string) => {
		const patronDef = PATRONES.find((p) => p.value === nuevoPatron);
		if (!patronDef) return;
		const fechaInicial = values.haberPagadoAl || criterios[0]?.fechaDesde || "";
		setFieldValue(criteriosMovilidad.name, patronDef.generaTramos(fechaInicial));
	};

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
				Elegí el patrón legal que aplica al reclamo. Si tu caso requiere algo no contemplado, podés ajustar los tramos en
				"Configuración avanzada".
			</Typography>

			{/* Selector visual de patrones */}
			<Stack spacing={1} sx={{ mb: 2 }}>
				{PATRONES.map((p) => {
					const isSelected = detectado === p.value;
					return (
						<Paper
							key={p.value}
							elevation={0}
							onClick={() => handlePatronChange(p.value)}
							sx={{
								p: 2,
								cursor: "pointer",
								border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
								bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : "background.paper",
								borderRadius: 1,
								transition: "border-color 0.2s, background-color 0.2s",
								"&:hover": {
									borderColor: theme.palette.primary.main,
								},
							}}
						>
							<Stack direction="row" alignItems="flex-start" spacing={1.5}>
								<Radio checked={isSelected} size="small" sx={{ p: 0, mt: 0.4 }} />
								<Box flex={1}>
									<Typography variant="subtitle2" fontWeight={isSelected ? 600 : 500}>
										{p.label}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
										{p.descripcion}
									</Typography>
								</Box>
							</Stack>
						</Paper>
					);
				})}
			</Stack>

			{isPersonalizado && (
				<Alert severity="info" sx={{ mb: 2 }}>
					Configuración personalizada — los tramos definidos no coinciden con ningún patrón predefinido. Editalos abajo en
					configuración avanzada.
				</Alert>
			)}

			{/* Toggle de configuración avanzada */}
			<Box sx={{ mb: 2 }}>
				<Button
					variant="text"
					size="small"
					startIcon={<Setting2 size={16} />}
					onClick={() => setAvanzado(!avanzado)}
					disabled={isPersonalizado}
				>
					{avanzado ? "Ocultar" : "Mostrar"} configuración avanzada
				</Button>
			</Box>

			<Collapse in={avanzado || isPersonalizado}>
				<Box>
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
														<DateInputField name={`${criteriosMovilidad.name}[${index}].fechaDesde`} />
													</Box>
													{index > 0 && criterios[index - 1]?.fechaDesde && (
														<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
															Debe ser posterior a {criterios[index - 1].fechaDesde}
														</Typography>
													)}
													{touchedFecha && errFecha && (
														<Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
															{errFecha}
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
						<Button variant="outlined" startIcon={<Add size={16} />} onClick={handleAddCriterio} size="small">
							Agregar criterio
						</Button>
					</Box>
				</Box>
			</Collapse>
		</>
	);
}
