import { at } from "lodash";
import { useField } from "formik";
import { PatternFormat } from "react-number-format";
import { TextField } from "@mui/material";

export default function PatternField(props: any) {
	const { format, mask, ...rest } = props;
	const [field, meta] = useField(props);

	function _renderHelperText() {
		const [touched, error] = at(meta, "touched", "error");
		if (touched && error) {
			return error;
		}
	}

	return (
		<PatternFormat
			format={format}
			mask={mask || ""}
			customInput={TextField}
			error={meta.touched && meta.error && true}
			helperText={_renderHelperText()}
			{...field}
			{...rest}
		/>
	);
}
