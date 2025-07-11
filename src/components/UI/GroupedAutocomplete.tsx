import { Autocomplete, TextField } from "@mui/material";
import { useField } from "formik";

const GroupedAutocomplete = (props: any) => {
	const { data, placeholder, name } = props;
	const [field] = useField(name);
	const helper = useField(name)[2];

	return (
		<Autocomplete
			id="grouped-demo"
			fullWidth
			options={data.sort((a: any, b: any) => -b.label.localeCompare(a.label))}
			groupBy={(option) => option.label}
			getOptionLabel={(option) => option.item}
			noOptionsText="No disponible"
			isOptionEqualToValue={(option, value) => {
				// Comparar solo por item para ser resiliente a cambios en el label
				// El item es el identificador único de la jurisdicción
				return option.item === value?.item;
			}}
			{...field}
			value={field.value || null}
			onChange={(e, value) => helper.setValue(value)}
			sx={{
				"& .MuiInputBase-input": {
					fontSize: 12,
				},
				"& .MuiInputBase-root": {
					height: 39.91,
				},
				"& input::placeholder": {
					color: "#000000",
					opacity: 0.6,
				},
				"& .MuiOutlinedInput-root": {
					p: 1,
					paddingTop: 0.3,
				},
				"& .MuiAutocomplete-tag": {
					bgcolor: "primary.lighter",
					border: "1px solid",
					borderColor: "primary.light",
					"& .MuiSvgIcon-root": {
						color: "primary.main",
						"&:hover": {
							color: "primary.dark",
						},
					},
				},
			}}
			renderInput={(params) => <TextField {...params} placeholder={placeholder} />}
		/>
	);
};
export default GroupedAutocomplete;
