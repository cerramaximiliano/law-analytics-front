import { FormControl, InputLabel, Select, MenuItem, FormLabel, Grid, FormControlLabel, Checkbox, FormHelperText } from "@mui/material";
import { Calendar } from "iconsax-react";
import { useField } from "formik";
import { at } from "lodash";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";

interface Props {
	name: string;
	nameMultas: string;
	nameFechaFalsa: string;
	nameSalarioFalso: string;
	options: { value: string; label: string }[];
}

const LaborMultas: React.FC<Props> = (props) => {
	const { name, options, nameMultas, nameFechaFalsa, nameSalarioFalso } = props;

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

	return (
		<Grid container spacing={3} justifyContent="center" sx={{ marginTop: "10px", marginBottom: "10px" }}>
			<FormControl error={isErrorMultas}>
				<FormLabel component="legend">Seleccione las opciones</FormLabel>
				{options.map((option) => (
					<FormControlLabel
						key={option.value}
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
						sx={{ width: "100%" }}
					/>
				))}
				{_renderHelperText()}
			</FormControl>
			<Grid container spacing={3} justifyContent="center" item xs={12} sx={{ marginTop: "10px", marginBottom: "10px" }}>
				<FormControl sx={{ minWidth: 250 }} error={isErrorMultas}>
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
