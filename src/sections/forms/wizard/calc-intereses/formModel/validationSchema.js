// validationSchema.ts
import * as Yup from "yup";
import interesesFormModel from "./interesesFormModel";
import moment from "moment";
import { obtenerRangoFechasTasa } from "./tasasFechasStore";

const {
	formField: { reclamante, reclamado, tasa, fechaInicial, fechaFinal, capital },
} = interesesFormModel;

// Función para crear el esquema de validación actualizado
export const crearEsquemaValidacion = () => {
	return [
		Yup.object().shape({
			[reclamante.name]: Yup.string().required(`${reclamante.requiredErrorMsg}`),
			[reclamado.name]: Yup.string().required(`${reclamado.requiredErrorMsg}`),
			[fechaInicial.name]: Yup.string()
				.required(`${fechaInicial.requiredErrorMsg}`)
				.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
					message: "El formato de fecha debe ser DD/MM/AAAA",
				})
				.test("is-before", "La fecha de inicio debe ser anterior a la fecha final", function (value) {
					const fechaEgresoValue = this.parent[fechaFinal.name];
					if (!value || !fechaEgresoValue) return true;
					const check = moment(value, "DD/MM/YYYY").isBefore(moment(fechaEgresoValue, "DD/MM/YYYY"));
					return check;
				})
				.test("dentro-rango-tasa", "La fecha está fuera del rango disponible para esta tasa", function (value) {
					const tasaValue = this.parent[tasa.name];
					if (!tasaValue || !value || tasaValue === 0) return true;

					const rangoFechas = obtenerRangoFechasTasa(tasaValue);
					if (!rangoFechas) return true;

					// Convertir fechas a strings en formato YYYY-MM-DD para comparación
					// Añadir 1 día a las fechas del rango para compensar el problema de zona horaria
					const fechaIngresoStr = moment(value, "DD/MM/YYYY").format("YYYY-MM-DD");

					// Crear fecha desde UTC para evitar problemas de zona horaria
					const fechaInicioAjustada = new Date(rangoFechas.fechaInicio);
					const fechaUltimaAjustada = new Date(rangoFechas.fechaUltima);

					const fechaInicioStr = moment(fechaInicioAjustada).add(1, "days").format("YYYY-MM-DD");
					const fechaUltimaStr = moment(fechaUltimaAjustada).add(1, "days").format("YYYY-MM-DD");

					console.log("Comparando fechas (inicial):", {
						ingresada: fechaIngresoStr,
						rangoInicio: fechaInicioStr,
						rangoFin: fechaUltimaStr,
					});

					if (fechaIngresoStr < fechaInicioStr) {
						return this.createError({
							message: `La fecha inicial debe ser posterior a ${moment(fechaInicioAjustada).add(1, "days").format("DD/MM/YYYY")}`,
						});
					}

					if (fechaIngresoStr > fechaUltimaStr) {
						return this.createError({
							message: `La fecha inicial debe ser anterior a ${moment(fechaUltimaAjustada).add(1, "days").format("DD/MM/YYYY")}`,
						});
					}

					return true;
				}),
			[fechaFinal.name]: Yup.string()
				.required(`${fechaFinal.requiredErrorMsg}`)
				.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
					message: "El formato de fecha debe ser DD/MM/AAAA",
				})
				.test("is-after", "La fecha final debe ser posterior a la fecha inicial", function (value) {
					const fechaIngresoValue = this.parent[fechaInicial.name];
					if (!value || !fechaIngresoValue) return true;
					const check = moment(value, "DD/MM/YYYY").isAfter(moment(fechaIngresoValue, "DD/MM/YYYY"));
					return check;
				})
				.test("dentro-rango-tasa", "La fecha está fuera del rango disponible para esta tasa", function (value) {
					const tasaValue = this.parent[tasa.name];
					if (!tasaValue || !value || tasaValue === 0) return true;

					const rangoFechas = obtenerRangoFechasTasa(tasaValue);
					if (!rangoFechas) return true;

					// Usar el mismo enfoque que para fechaInicial
					const fechaFinalStr = moment(value, "DD/MM/YYYY").format("YYYY-MM-DD");

					// Crear fecha desde UTC para evitar problemas de zona horaria
					const fechaInicioAjustada = new Date(rangoFechas.fechaInicio);
					const fechaUltimaAjustada = new Date(rangoFechas.fechaUltima);

					const fechaInicioStr = moment(fechaInicioAjustada).add(1, "days").format("YYYY-MM-DD");
					const fechaUltimaStr = moment(fechaUltimaAjustada).add(1, "days").format("YYYY-MM-DD");

					console.log("Comparando fechas (final):", {
						ingresada: fechaFinalStr,
						rangoInicio: fechaInicioStr,
						rangoFin: fechaUltimaStr,
					});

					if (fechaFinalStr < fechaInicioStr) {
						return this.createError({
							message: `La fecha final debe ser posterior a ${moment(fechaInicioAjustada).add(1, "days").format("DD/MM/YYYY")}`,
						});
					}

					if (fechaFinalStr > fechaUltimaStr) {
						return this.createError({
							message: `La fecha final debe ser anterior a ${moment(fechaUltimaAjustada).add(1, "days").format("DD/MM/YYYY")}`,
						});
					}

					return true;
				}),
			[tasa.name]: Yup.string().required(`${tasa.requiredErrorMsg}`),
			[capital.name]: Yup.number()
				.typeError(`La compensación debe ser un número con punto para indicar decimales`)
				.required(`${capital.requiredErrorMsg}`)
				.moreThan(0, "La remuneración debe ser mayor a 0"),
		}),
	];
};

// Esquema inicial (sin validaciones de rango de fechas específicas por tasa)
const esquemaInicial = [
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
				if (!value || !fechaEgresoValue) return true;
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
				if (!value || !fechaIngresoValue) return true;
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

export default esquemaInicial;
