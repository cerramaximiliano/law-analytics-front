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

	// Permisivo: el juzgado que escribió el worker (PJN/IOL/EJE) puede no estar
	// en la lista de juzgados de la jurisdicción (nombre distinto, organismo
	// nuevo). Sin esto el campo aparecía vacío en edición y guardar lo borraba.
	// Se agrega como opción sintética al principio para que se vea y se conserve.
	const currentValue = typeof field.value === "string" ? field.value.trim() : "";
	const currentInOptions = !!currentValue && options.some((opt) => opt.organismo === currentValue);
	const effectiveOptions = currentValue && !currentInOptions ? [{ _id: "__current__", organismo: currentValue }, ...options] : options;

	return (
		<Autocomplete
			fullWidth
			size={size}
			options={effectiveOptions}
			getOptionLabel={(option) => option.organismo || ""}
			noOptionsText={loading ? "Cargando..." : "No hay juzgados disponibles"}
			isOptionEqualToValue={(option, value) => option._id === value?._id}
			loading={loading}
			disabled={(disabled && !currentValue) || loading}
			value={effectiveOptions.find((opt) => opt.organismo === field.value) || null}
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
