import * as Yup from "yup";
import liquidacionFormModel from "./liquidacionFormModel";
import moment from "moment";

const {
	formField: {
		reclamante,
		reclamado,
		fechaIngreso,
		fechaEgreso,
		remuneracion,
		liquidacion,
		aplicarIntereses,
		fechaInicialIntereses,
		fechaFinalIntereses,
		tasaIntereses,
	},
} = liquidacionFormModel;

const schema = [
	// Step 1: Datos requeridos
	Yup.object().shape({
		[reclamante.name]: Yup.string().when("$isLinkedFolder", {
			is: false,
			then: (schema) => schema.required(reclamante.requiredErrorMsg),
			otherwise: (schema) => schema,
		}),
		[reclamado.name]: Yup.string().when("$isLinkedFolder", {
			is: false,
			then: (schema) => schema.required(reclamado.requiredErrorMsg),
			otherwise: (schema) => schema,
		}),
		[fechaIngreso.name]: Yup.string()
			.required(fechaIngreso.requiredErrorMsg)
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			})
			.test("is-before", "La fecha de ingreso debe ser anterior a la fecha de egreso", function (value) {
				const fechaEgresoValue = this.parent[fechaEgreso.name];
				if (!fechaEgresoValue) return true;
				return moment(value, "DD/MM/YYYY").isBefore(moment(fechaEgresoValue, "DD/MM/YYYY"));
			}),
		[fechaEgreso.name]: Yup.string()
			.required(fechaEgreso.requiredErrorMsg)
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			})
			.test("is-after", "La fecha de egreso debe ser posterior a la fecha de ingreso", function (value) {
				const fechaIngresoValue = this.parent[fechaIngreso.name];
				if (!fechaIngresoValue) return true;
				return moment(value, "DD/MM/YYYY").isAfter(moment(fechaIngresoValue, "DD/MM/YYYY"));
			}),
		[remuneracion.name]: Yup.number()
			.typeError("La remuneración debe ser un número")
			.test("greaterThanZero", "La remuneración debe ser mayor a 0", (value) => parseFloat(value) > 0)
			.required("La remuneración es requerida"),
	}),

	// Step 2: Cálculos opcionales
	Yup.object().shape({
		[liquidacion.name]: Yup.array()
			.min(1, "Debes seleccionar al menos una opción")
			.of(Yup.string().required("Debes seleccionar al menos una opción"))
			.required("Debe seleccionar al menos una opción"),
	}),

	// Step 3: Intereses
	Yup.object().shape({
		[aplicarIntereses.name]: Yup.boolean(),
		[fechaInicialIntereses.name]: Yup.string().when(aplicarIntereses.name, {
			is: true,
			then: (schema) =>
				schema
					.required("La fecha inicial de intereses es requerida")
					.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
						message: "El formato de fecha debe ser DD/MM/AAAA",
					}),
			otherwise: (schema) => schema,
		}),
		[fechaFinalIntereses.name]: Yup.string().when(aplicarIntereses.name, {
			is: true,
			then: (schema) =>
				schema
					.required("La fecha final de intereses es requerida")
					.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
						message: "El formato de fecha debe ser DD/MM/AAAA",
					})
					.test("is-after-initial", "La fecha final debe ser posterior a la fecha inicial", function (value) {
						const fechaInicialValue = this.parent[fechaInicialIntereses.name];
						if (!fechaInicialValue || !value) return true;
						return moment(value, "DD/MM/YYYY").isAfter(moment(fechaInicialValue, "DD/MM/YYYY"));
					}),
			otherwise: (schema) => schema,
		}),
		[tasaIntereses.name]: Yup.string().when(aplicarIntereses.name, {
			is: true,
			then: (schema) => schema.required("La tasa de intereses es requerida"),
			otherwise: (schema) => schema,
		}),
	}),

	// Step 4: No validation needed for results view
	Yup.object().shape({}),
];

export default schema;
