import * as Yup from "yup";
import mendezFormModel from "./mendezFormModel";

const {
	formField: { reclamante, reclamado, ingresosTotales, porcentajeIncapacidad, tasaInteres, edadDesde, edadHasta },
} = mendezFormModel;
const schema = [
	Yup.object().shape({
		[reclamante.name]: Yup.string().required(`${reclamante.requiredErrorMsg}`),
		[reclamado.name]: Yup.string().required(`${reclamado.requiredErrorMsg}`),
		[ingresosTotales.name]: Yup.number()
			.typeError(`La remuneración debe ser un número con punto para indicar decimales`)
			.required(`${ingresosTotales.requiredErrorMsg}`)
			.moreThan(0, "La remuneración debe ser mayor a 0"),
		[edadDesde.name]: Yup.number()
			.typeError(`La remuneración debe ser un número con punto para indicar decimales`)
			.required(`${ingresosTotales.requiredErrorMsg}`)
			.moreThan(0, "La remuneración debe ser mayor a 0"),
		[edadHasta.name]: Yup.number()
			.typeError(`La remuneración debe ser un número con punto para indicar decimales`)
			.required(`${ingresosTotales.requiredErrorMsg}`)
			.moreThan(0, "La remuneración debe ser mayor a 0"),
		[porcentajeIncapacidad.name]: Yup.number()
			.required(`${porcentajeIncapacidad.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
		[tasaInteres.name]: Yup.number()
			.required(`${tasaInteres.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
	}),
];

export default schema;
