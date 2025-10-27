import React from "react";
import "dayjs/locale/es"; // Importar la localización en español
import { esES } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Calendar } from "iconsax-react";
import { DateField } from "@mui/x-date-pickers";
import { useField } from "formik";
import { at } from "lodash";
import { FormControl, FormHelperText } from "@mui/material";
import dayjs from "dayjs";

export default function DateInputField(props: any) {
	const esLocale = esES.components.MuiLocalizationProvider.defaultProps.localeText;
	const { customInputStyles } = props;
	const [field, meta, helper] = useField(props);
	const { setValue } = helper;
	const [touched, error] = at(meta, "touched", "error");

	const errorColor = {
		"& .MuiOutlinedInput-notchedOutline ": {
			borderColor: "#F04134",
		},
		...customInputStyles,
	};
	const currentColor = {
		"& .MuiOutlinedInput-notchedOutline ": {
			borderColor: "primary",
		},
		...customInputStyles,
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es" localeText={esLocale}>
			<FormControl fullWidth error={!!(touched && error)}>
				<DateField
					slotProps={{ textField: { fullWidth: true, InputProps: { startAdornment: <Calendar /> } } }}
					sx={touched && error ? errorColor : currentColor}
					value={field.value ? dayjs(field.value, "DD/MM/YYYY") : null}
					format="DD/MM/YYYY"
					onChange={(e: any) => {
						if (e) {
							const date = dayjs(e).locale("es").format("DD/MM/YYYY");
							setValue(date);
						} else {
							setValue("");
						}
					}}
				/>
				{touched && error && (
					<FormHelperText error>{typeof error === "string" ? error : (error as any)?.message || "Error de validación"}</FormHelperText>
				)}
			</FormControl>
		</LocalizationProvider>
	);
}
