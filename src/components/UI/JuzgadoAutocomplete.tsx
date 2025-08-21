import React from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { useField } from "formik";

interface JuzgadoOption {
	_id: string;
	organismo: string;
}

interface JuzgadoAutocompleteProps {
	options: JuzgadoOption[];
	loading?: boolean;
	disabled?: boolean;
	placeholder?: string;
	name: string;
	size?: "small" | "medium";
	sx?: any;
}

const JuzgadoAutocomplete = ({ options, loading, disabled, placeholder, name, size = "medium", sx }: JuzgadoAutocompleteProps) => {
	const [field] = useField(name);
	const helper = useField(name)[2];

	return (
		<Autocomplete
			fullWidth
			size={size}
			options={options}
			getOptionLabel={(option) => option.organismo || ""}
			noOptionsText={loading ? "Cargando..." : "No hay juzgados disponibles"}
			isOptionEqualToValue={(option, value) => option._id === value?._id}
			loading={loading}
			disabled={disabled || loading}
			value={options.find((opt) => opt.organismo === field.value) || null}
			onChange={(_e, value) => helper.setValue(value?.organismo || "")}
			sx={{
				"& .MuiInputBase-input": {
					fontSize: size === "small" ? 12 : 14,
				},
				"& .MuiInputBase-root": {
					height: size === "small" ? 36 : 40,
				},
				...sx,
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					placeholder={placeholder || "Seleccione un juzgado"}
					InputProps={{
						...params.InputProps,
						endAdornment: (
							<>
								{loading && <CircularProgress color="inherit" size={20} />}
								{params.InputProps.endAdornment}
							</>
						),
					}}
				/>
			)}
		/>
	);
};

export default JuzgadoAutocomplete;
