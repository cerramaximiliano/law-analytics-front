import { Grid, FormControl, FormLabel, FormControlLabel, Checkbox, InputLabel, FormHelperText } from "@mui/material";
import NumberField from "components/UI/NumberField";
import { useField } from "formik";
import { useState } from "react";

interface Props {
	name: string;
	nameRemuneracion: object;
	options: { value: string; label: string }[];
}
const LaborTopes: React.FC<Props> = (props) => {
	const [aplicaFalloVizzoti, setAplicaFalloVizzoti] = useState(false);
	//const [aplicaFalloTorrisi, setAplicaFalloTorrisi] = useState(false);
	const { nameRemuneracion, name, options } = props;
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
			<Grid>
				<FormControl error={!!error}>
					<FormLabel component="legend">Seleccione las opciones</FormLabel>
					<FormControlLabel
						name={field.name}
						value={options[0].value}
						control={
							<Checkbox
								{...field}
								checked={field.value.includes(options[0].value)}
								onChange={(e) => {
									setAplicaFalloVizzoti(!aplicaFalloVizzoti);
									_onChange(options[0].value, e.target.checked);
								}}
							/>
						}
						label="Aplica Vizzoti"
						sx={{ width: "100%" }}
					/>
					{_renderHelperText()}
				</FormControl>
			</Grid>
			{field.value.length > 0 && (
				<Grid item xs={12} style={{ maxWidth: "100%" }} justifyContent="center">
					<InputLabel sx={{ textAlign: { xs: "left" } }}>Remuneración tope:</InputLabel>
					<NumberField
						thousandSeparator={","}
						allowNegative={false}
						allowLeadingZeros={false}
						decimalScale={2}
						InputProps={{ startAdornment: "$" }}
						placeholder="Ingrese la remuneración tope"
						name={nameRemuneracion}
					/>
				</Grid>
			)}
		</Grid>
	);
};

export default LaborTopes;
