import * as Yup from "yup";
import despidoFormModel from "./despidoFormModel";
import moment from "moment";

const {
	formField: { reclamante, reclamado, fechaIngreso, fechaEgreso, remuneracion, otrasSumas, dias, liquidacion },
} = despidoFormModel;
const schema = [
	Yup.object().shape({
		[reclamante.name]: Yup.string().required(`${reclamante.requiredErrorMsg}`),
		[reclamado.name]: Yup.string().required(`${reclamado.requiredErrorMsg}`),
		[fechaIngreso.name]: Yup.string()
			.required(`${fechaIngreso.requiredErrorMsg}`)
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			})
			.test("is-before", "La fecha de ingreso debe ser anterior a la fecha de egreso", function (value) {
				const fechaEgresoValue = this.parent[fechaEgreso.name];
				const check = moment(value, "DD/MM/YYYY").isBefore(moment(fechaEgresoValue, "DD/MM/YYYY"));
				return check;
			}),
		[fechaEgreso.name]: Yup.string()
			.required(`${fechaEgreso.requiredErrorMsg}`)
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			})
			.test("is-after", "La fecha de egreso debe ser posterior a la fecha de ingreso", function (value) {
				const fechaIngresoValue = this.parent[fechaIngreso.name];
				const check = moment(value, "DD/MM/YYYY").isAfter(moment(fechaIngresoValue, "DD/MM/YYYY"));
				return check;
			}),
		[remuneracion.name]: Yup.number()
			.typeError("La remuneración debe ser un número")
			.test("greaterThanZero", "La remuneración debe ser mayor a 0", (value) => parseFloat(value) > 0)
			.required("La remuneración es requerida"),
		[otrasSumas.name]: Yup.number().typeError("La suma debe ser un número"),
		[dias.name]: Yup.number()
			.typeError("Debe ingresar un número")
			.test("is-more", "Los días descontados no pueden mayores a los días totales", function (value) {
				if (!value) return true;
				const inicio = moment(this.parent[fechaIngreso.name], "DD/MM/YYYY");
				const fin = moment(this.parent[fechaEgreso.name], "DD/MM/YYYY");
				const diff = fin.diff(inicio, "days");
				return diff > value;
			}),
		[liquidacion.name]: Yup.array()
			.min(1, "Debes seleccionar al menos una opción")
			.of(Yup.string().required("Debes seleccionar al menos una opción"))
			.required("Debe seleccionar al menos una opción"),
	}),
];

export default schema;
