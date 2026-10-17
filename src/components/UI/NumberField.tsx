import React from "react";
import at from "lodash/at";
import { useField } from "formik";
import { NumericFormat } from "react-number-format";
import { TextField } from "@mui/material";

interface NumberFieldProps {
	name: string;
	label?: string;
	allowNegative?: boolean;
	allowLeadingZeros?: boolean;
	thousandSeparator?: string | boolean;
	decimalScale?: number;
	inputMode?: "decimal" | "numeric";
	inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
	helperText?: string;
	[key: string]: any;
}

export default function NumberField(props: NumberFieldProps) {
	const {
		allowNegative,
		allowLeadingZeros,
		thousandSeparator,
		decimalScale,
		inputMode,
		inputProps,
		helperText: staticHelperText,
		...rest
	} = props;
	const [field, meta, helpers] = useField(props);
	const { setValue } = helpers;
	function _renderHelperText() {
		const [touched, error] = at(meta, "touched", "error");
		if (touched && error) {
			return error;
		}
		return staticHelperText;
	}
	const handleValueChange = (values: any) => {
		const { floatValue } = values;
		//field.onChange({ target: { name: field.name, value: floatValue } });
		setValue(floatValue);
	};
	return (
		<NumericFormat
			valueIsNumericString={true}
			allowNegative={allowNegative ?? false}
			allowLeadingZeros={allowLeadingZeros ?? false}
			decimalScale={decimalScale ?? 0}
			// Formato argentino: miles con punto y decimales con coma. Se acepta también el punto como
			// separador decimal para quien tipea "2558.50"; antes, al tipear "2558,50" la coma se descartaba
			// y el campo tomaba 255.850.
			thousandSeparator={thousandSeparator ? "." : undefined}
			decimalSeparator=","
			allowedDecimalSeparators={[",", "."]}
			type="text"
			customInput={TextField}
			error={Boolean(meta.touched && meta.error)}
			helperText={_renderHelperText()}
			onValueChange={handleValueChange}
			value={field.value}
			inputProps={{ ...inputProps, inputMode: inputMode ?? "decimal" }}
			{...rest}
		/>
	);
}
