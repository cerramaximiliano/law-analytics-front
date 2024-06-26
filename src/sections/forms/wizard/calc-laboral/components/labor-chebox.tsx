import React from "react";
import { Grid, FormControlLabel, FormLabel, FormControl, FormHelperText, Checkbox } from "@mui/material";
import { useField } from "formik";

interface Props {
	name: string;
	options: { value: string; label: string }[];
}

const LaborCheckbox: React.FC<Props> = (props) => {
	const { name, options } = props;
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
			<FormControl error={!!error}>
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
		</Grid>
	);
};

export default LaborCheckbox;
