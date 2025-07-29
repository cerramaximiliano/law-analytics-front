import React from "react";
import { Grid, Card, CardContent, Typography, Checkbox, FormControl, FormHelperText, Box, alpha } from "@mui/material";
import { useField } from "formik";
import { useTheme } from "@mui/material/styles";
import { Calculator, Calendar, DollarCircle, MoneyRecive, Clock, Award } from "iconsax-react";

interface CalculationOption {
	value: string;
	label: string;
	description: string;
	icon: React.ReactNode;
}

interface Props {
	name: string;
	options: { value: string; label: string }[];
}

const CalculationSelector: React.FC<Props> = ({ name, options }) => {
	const theme = useTheme();
	const [field, meta, helper] = useField(name);
	const { setValue } = helper;
	const [touched, error] = [meta.touched, meta.error];

	// Enhanced options with icons and descriptions
	const enhancedOptions: CalculationOption[] = [
		{
			value: "preaviso",
			label: "Preaviso",
			description: "Indemnización por falta de preaviso según la antigüedad del trabajador",
			icon: <Clock variant="Bold" size={24} color={theme.palette.primary.main} />,
		},
		{
			value: "integracionMes",
			label: "Integración mes",
			description: "Complemento del mes de despido hasta completar el salario mensual",
			icon: <Calendar variant="Bold" size={24} color={theme.palette.primary.main} />,
		},
		{
			value: "sacProp",
			label: "SAC proporcional",
			description: "Sueldo Anual Complementario proporcional al tiempo trabajado",
			icon: <DollarCircle variant="Bold" size={24} color={theme.palette.primary.main} />,
		},
		{
			value: "sacPreaviso",
			label: "SAC s/ Preaviso",
			description: "SAC sobre el período de preaviso no trabajado",
			icon: <MoneyRecive variant="Bold" size={24} color={theme.palette.primary.main} />,
		},
		{
			value: "diasTrabajados",
			label: "Días trabajados",
			description: "Remuneración por los días efectivamente trabajados en el último período",
			icon: <Calculator variant="Bold" size={24} color={theme.palette.primary.main} />,
		},
		{
			value: "vacaciones",
			label: "Vacaciones",
			description: "Vacaciones proporcionales no gozadas y sus respectivos adicionales",
			icon: <Award variant="Bold" size={24} color={theme.palette.primary.main} />,
		},
	];

	const _onChange = (optionValue: string, isChecked: boolean) => {
		const currentValues = field.value;
		const valueIndex = currentValues.indexOf(optionValue);
		let newValues;

		if (isChecked && valueIndex === -1) {
			newValues = [...currentValues, optionValue];
		} else if (!isChecked && valueIndex !== -1) {
			newValues = currentValues.filter((value: string) => value !== optionValue);
		}

		if (newValues) {
			setValue(newValues);
		}
	};

	const isSelected = (value: string) => field.value.includes(value);

	const _renderHelperText = () => {
		if (touched && error) {
			return <FormHelperText error>{error}</FormHelperText>;
		}
	};

	// Get selected labels instead of values
	const getSelectedLabels = () => {
		return field.value.map((value: string) => {
			const option = enhancedOptions.find((opt) => opt.value === value);
			return option ? option.label : value;
		});
	};

	return (
		<FormControl error={!!error} fullWidth>
			<Box sx={{ mb: 3 }}>
				<Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
					Seleccione Cálculos a incluir
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Elija los conceptos que desea incluir en el cálculo de liquidación final
				</Typography>
			</Box>

			<Grid container spacing={2}>
				{enhancedOptions.map((option) => {
					const selected = isSelected(option.value);
					return (
						<Grid item xs={12} sm={6} md={4} key={option.value}>
							<Card
								sx={{
									cursor: "pointer",
									transition: "all 0.3s ease",
									border: selected ? `2px solid ${theme.palette.primary.main}` : `2px solid ${theme.palette.divider}`,
									backgroundColor: selected ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.paper,
									"&:hover": {
										transform: "translateY(-2px)",
										boxShadow: theme.shadows[4],
										border: `2px solid ${alpha(theme.palette.primary.main, 0.8)}`,
									},
									height: "100%",
								}}
								onClick={() => _onChange(option.value, !selected)}
							>
								<CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
									{/* Header with icon and checkbox */}
									<Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
										<Box sx={{ mr: 2, flexShrink: 0 }}>{option.icon}</Box>
										<Box sx={{ flex: 1 }}>
											<Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
												{option.label}
											</Typography>
										</Box>
										<Checkbox
											checked={selected}
											onChange={(e) => _onChange(option.value, e.target.checked)}
											sx={{
												color: theme.palette.primary.main,
												"&.Mui-checked": {
													color: theme.palette.primary.main,
												},
											}}
											onClick={(e) => e.stopPropagation()}
										/>
									</Box>

									{/* Description */}
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{
											flex: 1,
											lineHeight: 1.4,
											fontSize: "0.875rem",
										}}
									>
										{option.description}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					);
				})}
			</Grid>

			{/* Summary */}
			<Box sx={{ mt: 3, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
				<Typography variant="body2" color="text.secondary">
					<strong>{field.value.length}</strong> concepto{field.value.length !== 1 ? "s" : ""} seleccionado
					{field.value.length !== 1 ? "s" : ""}
					{field.value.length > 0 && <span> • {getSelectedLabels().join(", ")}</span>}
				</Typography>
			</Box>

			{_renderHelperText()}
		</FormControl>
	);
};

export default CalculationSelector;
