import React from "react";
import { at } from "lodash";
import { useField } from "formik";
import { TextField } from "@mui/material";

export default function InputField(props: any) {
	const { ...rest } = props;
	const [field, meta] = useField(props);

	function _renderHelperText() {
		const [touched, error] = at(meta, "touched", "error");
		if (touched && error) {
			// Asegurar que siempre retornemos un string válido
			if (typeof error === "string") {
				return error;
			}
			// Si es un objeto (como cuando Yup usa .matches()), extraer el mensaje
			if (typeof error === "object" && error !== null) {
				return (error as any)?.message || "Error de validación";
			}
			return "Error de validación";
		}
	}

	return <TextField type="text" error={meta.touched && meta.error && true} helperText={_renderHelperText()} {...field} {...rest} />;
}
