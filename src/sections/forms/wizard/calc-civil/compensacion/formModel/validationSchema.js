import * as Yup from "yup";
import compensacionFormModel from "./compensacionFormModel";
const {
	formField: {
		reclamante,
		reclamado,
		tasaDescuentoAnual,
		edadDisolucion,
		edadLimite,
		cantIngresosMensuales,
		probCapacitacion,
		ingresoMax,
		probIngresoMax,
		ingresoReal,
		probIngresoReal,
		isPatrimonio,
		patrimonioInicialReclamado,
		patrimonioInicialReclamante,
		patrimonioFinalReclamado,
		patrimonioFinalReclamante,
		isVivienda,
		cantMesesAtribucionVivienda,
		porcentajeInmuebleOCanon,
		valorCanon,
		cantidadHijos,
		cantidadOtrosFamiliares,
	},
} = compensacionFormModel;
const schema = [
	Yup.object().shape({
		[reclamante.name]: Yup.string().required(`${reclamante.requiredErrorMsg}`),
		[reclamado.name]: Yup.string().required(`${reclamado.requiredErrorMsg}`),
		[tasaDescuentoAnual.name]: Yup.number()
			.required(`${tasaDescuentoAnual.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
		//validar edades
		[edadDisolucion.name]: Yup.number()
			.typeError("Los días deben ser un número")
			.required(`${edadDisolucion.requiredErrorMsg}`)
			.test("is-integer", "Los días deben ser un número entero", function (value) {
				if (value === undefined || value === null) return true;
				return Number.isInteger(value) && value.toString().indexOf(".") === -1;
			})
			.moreThan(0, "Los días deben ser mayores a 0"),
		[edadLimite.name]: Yup.number()
			.typeError("Los días deben ser un número")
			.required(`${edadLimite.requiredErrorMsg}`)
			.test("is-integer", "Los días deben ser un número entero", function (value) {
				if (value === undefined || value === null) return true;
				return Number.isInteger(value) && value.toString().indexOf(".") === -1;
			})
			.moreThan(0, "Los días deben ser mayores a 0"),
		[cantIngresosMensuales.name]: Yup.number()
			.typeError(`La compensación debe ser un número con punto para indicar decimales`)
			.required(`${cantIngresosMensuales.requiredErrorMsg}`)
			.moreThan(0, "La remuneración debe ser mayor a 0"),
		[probCapacitacion.name]: Yup.number()
			.required(`${tasaDescuentoAnual.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
		[ingresoMax.name]: Yup.number()
			.typeError(`La compensación debe ser un número con punto para indicar decimales`)
			.required(`${ingresoMax.requiredErrorMsg}`)
			.moreThan(0, "La remuneración debe ser mayor a 0"),
		[probIngresoMax.name]: Yup.number()
			.required(`${tasaDescuentoAnual.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
		[ingresoReal.name]: Yup.number()
			.typeError(`La compensación debe ser un número con punto para indicar decimales`)
			.required(`${ingresoReal.requiredErrorMsg}`)
			.moreThan(0, "La remuneración debe ser mayor a 0"),
		[probIngresoReal.name]: Yup.number()
			.required(`${tasaDescuentoAnual.requiredErrorMsg}`)
			.min(1, "El valor debe ser entre 1 y 100")
			.max(100, "El valor debe ser entre 1 y 100"),
	}),
	Yup.object().shape({
		[isPatrimonio.name]: Yup.boolean(),
		[isVivienda.name]: Yup.boolean(),
		[patrimonioInicialReclamado.name]: Yup.number().when(isPatrimonio.name, {
			is: (isPatrimonio) => isPatrimonio,
			then: () => {
				return Yup.number()
					.typeError(`El monto debe ser un número con punto para indicar decimales`)
					.required(`${patrimonioInicialReclamado.requiredErrorMsg}`)
					.moreThan(0, "El monto debe ser mayor a 0");
			},
			otherwise: () => Yup.number(),
		}),
		[patrimonioInicialReclamante.name]: Yup.number().when(isPatrimonio.name, {
			is: (isPatrimonio) => isPatrimonio,
			then: () => {
				return Yup.number()
					.typeError(`El monto debe ser un número con punto para indicar decimales`)
					.required(`${patrimonioInicialReclamante.requiredErrorMsg}`)
					.moreThan(0, "El monto debe ser mayor a 0");
			},
			otherwise: () => Yup.number(),
		}),
		[patrimonioFinalReclamado.name]: Yup.number().when(isPatrimonio.name, {
			is: (isPatrimonio) => isPatrimonio,
			then: () => {
				return Yup.number()
					.typeError(`El monto debe ser un número con punto para indicar decimales`)
					.required(`${patrimonioFinalReclamado.requiredErrorMsg}`)
					.moreThan(0, "El monto debe ser mayor a 0");
			},
			otherwise: () => Yup.number(),
		}),
		[patrimonioFinalReclamante.name]: Yup.number().when(isPatrimonio.name, {
			is: (isPatrimonio) => isPatrimonio,
			then: () => {
				return Yup.number()
					.typeError(`El monto debe ser un número con punto para indicar decimales`)
					.required(`${patrimonioFinalReclamante.requiredErrorMsg}`)
					.moreThan(0, "El monto debe ser mayor a 0");
			},
			otherwise: () => Yup.number(),
		}),

		[cantMesesAtribucionVivienda.name]: Yup.number().when(isVivienda.name, {
			is: (isVivienda) => isVivienda,
			then: () => {
				return Yup.number()
					.typeError("Los días deben ser un número")
					.required(`${cantMesesAtribucionVivienda.requiredErrorMsg}`)
					.test("is-integer", "Los días deben ser un número entero", function (value) {
						if (value === undefined || value === null) return true;
						return Number.isInteger(value) && value.toString().indexOf(".") === -1;
					})
					.moreThan(0, "Los días deben ser mayores a 0");
			},
			otherwise: () => Yup.number(),
		}),
		[porcentajeInmuebleOCanon.name]: Yup.number().when(isVivienda.name, {
			is: (isVivienda) => isVivienda,
			then: () => {
				return Yup.number()
					.required(`${porcentajeInmuebleOCanon.requiredErrorMsg}`)
					.min(1, "El valor debe ser entre 1 y 100")
					.max(100, "El valor debe ser entre 1 y 100");
			},
			otherwise: () => Yup.number(),
		}),
		[valorCanon.name]: Yup.number().when(isVivienda.name, {
			is: (isVivienda) => isVivienda,
			then: () => {
				return Yup.number()
					.typeError(`El monto debe ser un número con punto para indicar decimales`)
					.required(`${valorCanon.requiredErrorMsg}`)
					.moreThan(0, "El monto debe ser mayor a 0");
			},
			otherwise: () => Yup.number(),
		}),
		[cantidadHijos.name]: Yup.number().when(isVivienda.name, {
			is: (isVivienda) => isVivienda,
			then: () => {
				return Yup.number()
					.typeError("Los días deben ser un número")
					.required(`${cantidadHijos.requiredErrorMsg}`)
					.test("is-integer", "Los días deben ser un número entero", function (value) {
						if (value === undefined || value === null) return true;
						return Number.isInteger(value) && value.toString().indexOf(".") === -1;
					})
					.moreThan(0, "Los días deben ser mayores a 0");
			},
			otherwise: () => Yup.number(),
		}),
		[cantidadOtrosFamiliares.name]: Yup.number().when(isVivienda.name, {
			is: (isVivienda) => isVivienda,
			then: () => {
				return Yup.number()
					.typeError("Los días deben ser un número")
					.required(`${cantidadOtrosFamiliares.requiredErrorMsg}`)
					.test("is-integer", "Los días deben ser un número entero", function (value) {
						if (value === undefined || value === null) return true;
						return Number.isInteger(value) && value.toString().indexOf(".") === -1;
					})
					.moreThan(0, "Los días deben ser mayores a 0");
			},
			otherwise: () => Yup.number(),
		}),
	}),
];

export default schema;
