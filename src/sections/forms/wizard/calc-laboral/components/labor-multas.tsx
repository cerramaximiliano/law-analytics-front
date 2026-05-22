import React from "react";
import {
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormLabel,
	Grid,
	FormControlLabel,
	Checkbox,
	FormHelperText,
	Tooltip,
	IconButton,
	Box,
	Typography,
	Stack,
} from "@mui/material";
import { Calendar, InfoCircle } from "iconsax-react";
import { useField } from "formik";
import { at } from "lodash";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";

interface Props {
	name: string;
	nameMultas: string;
	nameFechaFalsa: string;
	nameSalarioFalso: string;
	nameMulta245bisPorcentaje?: string;
	options: { value: string; label: string }[];
}

const LaborMultas: React.FC<Props> = (props) => {
	const { name, options, nameMultas, nameFechaFalsa, nameSalarioFalso, nameMulta245bisPorcentaje } = props;

	const [fieldMultas, metaMultas] = useField(nameMultas);
	const { value: selectedValue } = fieldMultas;
	const [touchedMultas, errorMultas] = at(metaMultas, "touched", "error");
	const isErrorMultas = touchedMultas && errorMultas && true;
	function _renderHelperTextMultas() {
		if (isErrorMultas) {
			return <FormHelperText>{errorMultas}</FormHelperText>;
		}
	}
	const [field, meta, helper] = useField(name);
	const { setValue } = helper;
	const [touched, error] = [meta.touched, meta.error];

	// Field para el porcentaje del agravamiento Art. 245 bis (50% o 100%).
	// Se renderiza solo cuando "multaArt245bis" está seleccionada.
	const [fieldPorcentaje, , helperPorcentaje] = useField(nameMulta245bisPorcentaje || "multa245bisPorcentaje");

	const _renderHelperText = () => {
		if (touched && error) {
			return <FormHelperText>{error}</FormHelperText>;
		}
	};

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

	const tooltipArt245bis = (
		<Box sx={{ p: 0.5, maxWidth: 360 }}>
			<Typography variant="caption" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
				Art. 245 bis (Ley 27.742) — Agravamiento por despido discriminatorio
			</Typography>
			<Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
				Procede cuando el despido se origina por motivos de raza, etnia, religión, nacionalidad, ideología, opinión política o gremial, sexo
				o género, orientación sexual, posición económica, caracteres físicos o discapacidad. La prueba está a cargo de quien lo invoca.
			</Typography>
			<Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
				Si la sentencia confirma el origen discriminatorio, corresponde una indemnización agravada equivalente al <strong>50%</strong> de la
				del art. 245 LCT (o del régimen especial aplicable). Según la gravedad, los jueces pueden incrementar hasta el <strong>100%</strong>
				.
			</Typography>
			<Typography variant="caption" component="div" sx={{ fontStyle: "italic" }}>
				No es acumulable con otros regímenes de agravamiento indemnizatorio.
			</Typography>
		</Box>
	);

	return (
		<Grid container spacing={3} justifyContent="center" sx={{ marginTop: "10px", marginBottom: "10px" }}>
			<FormControl error={isErrorMultas}>
				<FormLabel component="legend">Seleccione las opciones</FormLabel>
				{options.map((option) => {
					const isArt245bis = option.value === "multaArt245bis";
					return (
						<Stack key={option.value} direction="row" alignItems="center" sx={{ width: "100%" }}>
							<FormControlLabel
								name={field.name}
								value={option.value}
								control={
									<Checkbox
										{...field}
										checked={field.value.includes(option.value)}
										onChange={(e) => _onChange(option.value, e.target.checked)}
									/>
								}
								label={option.label}
								sx={{ flex: 1 }}
							/>
							{isArt245bis && (
								<Tooltip arrow placement="right" title={tooltipArt245bis}>
									<IconButton size="small" sx={{ p: 0.25 }} aria-label="Información sobre Art. 245 bis">
										<InfoCircle size={16} variant="Linear" />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					);
				})}
				{_renderHelperText()}
			</FormControl>

			{/* Selector de porcentaje cuando se aplica Art. 245 bis */}
			{field.value.includes("multaArt245bis") && nameMulta245bisPorcentaje && (
				<Grid container spacing={3} justifyContent="center" item xs={12} sx={{ marginTop: "10px", marginBottom: "10px" }}>
					<FormControl sx={{ width: 250 }}>
						<InputLabel id="multa-245bis-porcentaje-label">Porcentaje del agravamiento</InputLabel>
						<Select
							labelId="multa-245bis-porcentaje-label"
							label="Porcentaje del agravamiento"
							value={fieldPorcentaje.value || 50}
							onChange={(e) => helperPorcentaje.setValue(Number(e.target.value))}
							name={fieldPorcentaje.name}
						>
							<MenuItem value={50}>50% (mínimo legal)</MenuItem>
							<MenuItem value={100}>100% (máximo según gravedad)</MenuItem>
						</Select>
						<FormHelperText>El art. 245 bis permite incrementar de 50% hasta 100% según gravedad de los hechos.</FormHelperText>
					</FormControl>
				</Grid>
			)}

			<Grid container spacing={3} justifyContent="center" item xs={12} sx={{ marginTop: "10px", marginBottom: "10px" }}>
				<FormControl sx={{ width: 250 }} error={isErrorMultas}>
					<InputLabel id="demo-simple-select-label">Multas Ley 24.013</InputLabel>
					<Select
						{...fieldMultas}
						labelId="demo-simple-select-label"
						id="demo-simple-select"
						value={selectedValue ? selectedValue : 0}
						placeholder="Multas Ley 24.013"
						name={fieldMultas.name}
					>
						<MenuItem value={0}>Seleccione una opción</MenuItem>
						<MenuItem value={1}>Art. 9</MenuItem>
						<MenuItem value={2}>Art. 10</MenuItem>
						<MenuItem value={3}>Art. 11</MenuItem>
					</Select>
					{_renderHelperTextMultas()}
				</FormControl>
			</Grid>
			{selectedValue === 3 && (
				<Grid item sx={{ marginTop: "10px", marginBottom: "10px" }}>
					<InputLabel sx={{ textAlign: { xs: "center" } }}>Complete el salario falso consignado:</InputLabel>
					<NumberField
						thousandSeparator={","}
						allowNegative={false}
						allowLeadingZeros={false}
						decimalScale={2}
						placeholder="00.00"
						name={nameSalarioFalso}
						InputProps={{ startAdornment: "$" }}
					/>
				</Grid>
			)}
			{selectedValue === 2 && (
				<Grid item sx={{ marginTop: "10px", marginBottom: "10px" }}>
					<InputLabel sx={{ textAlign: { xs: "center" } }}>Complete la fecha de inicio falsa:</InputLabel>
					<InputField placeholder="DD/MM/AAAA" name={nameFechaFalsa} InputProps={{ startAdornment: <Calendar /> }} />
				</Grid>
			)}
		</Grid>
	);
};
export default LaborMultas;
