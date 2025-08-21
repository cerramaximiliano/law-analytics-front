import React from "react";
import { FormControl, FormHelperText, Select, Typography, MenuItem, ListItemText } from "@mui/material";
import { useField } from "formik";
import { at } from "lodash";

interface SelectOption {
	label: string;
	value: string;
}

interface SelectFieldProps {
	name: string;
	label: string;
	data: SelectOption[] | string[];
	[key: string]: any;
}

const SelectField = (props: SelectFieldProps) => {
	const { name, label, data, ...rest } = props;
	const [field, meta, helpers] = useField(name);
	const { value: selectedValue } = field;
	const [touched, error] = at(meta, "touched", "error");

	// Verificar si data es un array de strings o de objetos
	const isObjectData = data.length > 0 && typeof data[0] !== "string";

	// Función para manejar cambios y asegurar que se guarde el valor correcto
	const handleChange = (event: any) => {
		const newValue = event.target.value;
		helpers.setValue(newValue);
	};

	return (
		<>
			<FormControl fullWidth error={touched && error ? true : false}>
				<Select
					{...field}
					{...rest}
					value={selectedValue || 0}
					onChange={handleChange}
					renderValue={(selected: any) => {
						if (!selected || selected === 0) {
							return (
								<Typography variant="body2" color="secondary">
									{label}
								</Typography>
							);
						}

						// Si es un valor de objeto, mostrar la etiqueta correspondiente
						if (isObjectData) {
							const selectedItem = (data as SelectOption[]).find((item) => item.value === selected);
							return <Typography variant="subtitle2">{selectedItem?.label || selected}</Typography>;
						}

						return <Typography variant="subtitle2">{selected}</Typography>;
					}}
				>
					<MenuItem value={0} disabled={true}>
						<ListItemText primary={"Seleccione una opción"} />
					</MenuItem>

					{isObjectData
						? // Renderizar items si data es un array de objetos
						  (data as SelectOption[]).map((item) => (
								<MenuItem key={item.value} value={item.value}>
									<ListItemText primary={item.label} />
								</MenuItem>
						  ))
						: // Renderizar items si data es un array de strings
						  (data as string[]).map((item) => (
								<MenuItem key={item} value={item}>
									<ListItemText primary={item} />
								</MenuItem>
						  ))}
				</Select>
				{touched && error && (
					<FormHelperText
						error
						id="standard-weight-helper-text-email-login"
						sx={{
							pl: 1.4,
							mt: 0,
						}}
					>
						{error}
					</FormHelperText>
				)}
			</FormControl>
		</>
	);
};

export default SelectField;
