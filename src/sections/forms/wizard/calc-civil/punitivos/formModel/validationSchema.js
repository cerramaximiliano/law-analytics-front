import * as Yup from "yup";
import punitivosFormModel from "./punitivosFormModel";
const {
	formField: {
		reclamante,
		reclamado,
		compensacion,
		probabilidadPunitivos,
		probabilidadDsPs,
		nivelPrecaucion,
		porcentajeMin,
		probOcurrencia,
	},
} = punitivosFormModel;
const schema = [
	Yup.object().shape({
		[reclamante.name]: Yup.string().required(`${reclamante.requiredErrorMsg}`),
		[reclamado.name]: Yup.string().required(`${reclamado.requiredErrorMsg}`),
		[compensacion.name]: Yup.number()
			.typeError("Debe completar un número")
			.test("greaterThanZero", "El importe debe ser mayor a 0", (value) => parseFloat(value) > 0)
			.required(`${compensacion.requiredErrorMsg}`),
		[nivelPrecaucion.name]: Yup.number()
			.typeError("Debe completar un número")
			.test("greaterThanZero", "El importe debe ser mayor a 0", (value) => parseFloat(value) > 0)
			.required(`${nivelPrecaucion.requiredErrorMsg}`),
		[probabilidadPunitivos.name]: Yup.number()
			.required(`${probabilidadPunitivos.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
		[probabilidadDsPs.name]: Yup.number()
			.required(`${probabilidadDsPs.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
		[porcentajeMin.name]: Yup.number()
			.required(`${porcentajeMin.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
		[probOcurrencia.name]: Yup.number()
			.required(`${probOcurrencia.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
	}),
];

export default schema;
