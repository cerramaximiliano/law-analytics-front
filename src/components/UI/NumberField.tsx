import { at } from "lodash";
import { useField } from "formik";
import { NumericFormat } from "react-number-format";
import { TextField } from "@mui/material";

export default function NumberField(props: any) {
	const { allowNegative, allowLeadingZeros, thousandSeparator, decimalScale, ...rest } = props;
	const [field, meta, helpers] = useField(props);
	const { setValue } = helpers;
	function _renderHelperText() {
		const [touched, error] = at(meta, "touched", "error");
		if (touched && error) {
			return error;
		}
	}
	const handleValueChange = (values: any) => {
		const { floatValue } = values;
		//field.onChange({ target: { name: field.name, value: floatValue } });
		setValue(floatValue);
	};
	console.log(props);
	console.log(field);
	return (
		<NumericFormat
			valueIsNumericString={true}
			allowNegative={allowNegative || false}
			allowLeadingZeros={allowLeadingZeros || false}
			decimalScale={decimalScale || 0}
			thousandSeparator={thousandSeparator || null}
			type="text"
			customInput={TextField}
			error={meta.touched && meta.error && true}
			helperText={_renderHelperText()}
			onValueChange={handleValueChange}
			value={field.value}
			{...rest}
		/>
	);
}
