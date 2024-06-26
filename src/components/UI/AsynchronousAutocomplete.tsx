import { useEffect, useState } from "react";
import { Autocomplete, CircularProgress, TextField, FormHelperText, FormControl } from "@mui/material";
import { useField } from "formik";
import { at } from "lodash";

function sleep(delay = 0) {
	return new Promise((resolve) => {
		setTimeout(resolve, delay);
	});
}

const AsynchronousAutocomplete = (props: any) => {
	const { placeholder, options, name } = props;
	const field = useField(name)[0];
	const meta = useField(name)[1];
	const helper = useField(name)[2];
	const [touched, error] = at(meta, "touched", "error");
	const isError = touched && error && true;
	function _renderHelperText() {
		if (isError) {
			return <FormHelperText>{error}</FormHelperText>;
		}
	}

	const [open, setOpen] = useState(false);
	const [autocompleteOptions, setAutocompleteOptions] = useState(options);
	const loading = open && autocompleteOptions.length === 0;

	useEffect(() => {
		let active = true;

		if (!loading) {
			return undefined;
		}

		(async () => {
			await sleep(1e3);
			if (active) {
				setAutocompleteOptions([...options]);
			}
		})();

		return () => {
			active = false;
		};
	}, [loading, options]);

	useEffect(() => {
		if (!open) {
			setAutocompleteOptions([]);
		}
	}, [open]);

	return (
		<>
			<FormControl fullWidth>
				<Autocomplete
					loadingText="Cargando..."
					noOptionsText="No disponible"
					id="asynchronous-demo"
					open={open}
					value={field.value}
					onOpen={() => {
						setOpen(true);
					}}
					onClose={() => {
						setOpen(false);
					}}
					onChange={(e, value) => {
						helper.setValue(value);
					}}
					isOptionEqualToValue={(option, value) => option === value}
					getOptionLabel={(option: any) => option}
					options={autocompleteOptions}
					loading={loading}
					sx={{
						"& .MuiInputBase-input": {
							fontSize: 12,
						},
						"& input::placeholder": {
							color: "#000000",
							opacity: 0.6,
						},
						"& .MuiInputBase-root": {
							height: 39.91,
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
					renderInput={(params) => (
						<TextField
							error={isError}
							{...params}
							placeholder={placeholder}
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<>
										{loading ? <CircularProgress color="inherit" size={20} /> : null}
										{params.InputProps.endAdornment}
									</>
								),
							}}
							helperText={_renderHelperText()}
						/>
					)}
				/>
			</FormControl>
		</>
	);
};

export default AsynchronousAutocomplete;
