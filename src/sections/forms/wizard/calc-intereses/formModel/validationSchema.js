import * as Yup from "yup";
import interesesFormModel from "./interesesFormModel";
import moment from "moment";

const {
	formField: { reclamante, reclamado, tasa, fechaInicial, fechaFinal, capital },
} = interesesFormModel;
const schema = [
	Yup.object().shape({
		[reclamante.name]: Yup.string().required(`${reclamante.requiredErrorMsg}`),
		[reclamado.name]: Yup.string().required(`${reclamado.requiredErrorMsg}`),
		[fechaInicial.name]: Yup.string()
			.required(`${fechaInicial.requiredErrorMsg}`)
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			})
			.test("is-before", "La fecha de ingreso debe ser anterior a la fecha de egreso", function (value) {
				const fechaEgresoValue = this.parent[fechaFinal.name];
				const check = moment(value, "DD/MM/YYYY").isBefore(moment(fechaEgresoValue, "DD/MM/YYYY"));
				return check;
			}),
		[fechaFinal.name]: Yup.string()
			.required(`${fechaFinal.requiredErrorMsg}`)
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			})
			.test("is-after", "La fecha de egreso debe ser posterior a la fecha de ingreso", function (value) {
				const fechaIngresoValue = this.parent[fechaInicial.name];
				const check = moment(value, "DD/MM/YYYY").isAfter(moment(fechaIngresoValue, "DD/MM/YYYY"));
				return check;
			}),
		[tasa.name]: Yup.string().required(`${tasa.requiredErrorMsg}`),
		[capital.name]: Yup.number()
			.typeError(`La compensación debe ser un número con punto para indicar decimales`)
			.required(`${capital.requiredErrorMsg}`)
			.moreThan(0, "La remuneración debe ser mayor a 0"),
	}),
];

export default schema;
