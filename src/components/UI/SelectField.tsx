import { FormControl, FormHelperText, Select, Typography, MenuItem, ListItemText } from "@mui/material";
import { useField } from "formik";
import { at } from "lodash";

const SelectField = (props: any) => {
	const { name, label, data, ...rest } = props;
	const [field, meta] = useField(name);
	const { value: selectedValue } = field;
	const [touched, error] = at(meta, "touched", "error");

	return (
		<>
			<FormControl fullWidth error={touched && error ? true : false}>
				<Select
					{...field}
					{...rest}
					value={selectedValue ? selectedValue : 0}
					renderValue={(selected: any) => {
						if (!selected) {
							return (
								<Typography variant="body2" color="secondary">
									{label}
								</Typography>
							);
						}
						return <Typography variant="subtitle2">{selected}</Typography>;
					}}
				>
					<MenuItem value={0} disabled={true}>
						<ListItemText primary={"Seleccione una opción"} />
					</MenuItem>
					{data.map((column: any) => (
						<MenuItem key={column} value={column}>
							<ListItemText primary={column} />
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
