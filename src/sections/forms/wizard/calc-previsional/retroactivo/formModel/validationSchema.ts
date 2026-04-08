import * as Yup from "yup";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const validationSchema = [
	// Step 1 — Datos del expediente
	Yup.object({
		reclamante: Yup.string().required("Ingrese un nombre o seleccione una carpeta"),
		prestacion: Yup.string().required("Seleccione una prestación"),
		fechaAdquisicion: Yup.string().required("Ingrese la fecha de adquisición del derecho"),
		haberPagadoAnses: Yup.number().typeError("Ingrese un monto válido").required("Ingrese el haber pagado por ANSES").positive("Debe ser mayor a 0"),
		haberPagadoAl: Yup.string().required("Ingrese la fecha de pago"),
	}),

	// Step 2 — Haber reajustado, reclamado y período
	Yup.object({
		fechaAltaReajuste: Yup.string().when("tieneReajuste", {
			is: true,
			then: (schema) => schema.required("Ingrese la fecha de alta del haber reajustado"),
			otherwise: (schema) => schema.notRequired(),
		}),
		importeReajuste: Yup.number()
			.typeError("Ingrese un monto válido")
			.when("tieneReajuste", {
				is: true,
				then: (schema) => schema.required("Ingrese el importe del haber reajustado").positive("Debe ser mayor a 0"),
				otherwise: (schema) => schema.notRequired(),
			}),
		haberReclamado: Yup.number()
			.typeError("Ingrese un monto válido")
			.required("Ingrese el haber reclamado")
			.positive("Debe ser mayor a 0"),
		fechaDesdeReclamado: Yup.string()
			.required("Ingrese la fecha de inicio del período reclamado")
			.test("desde-posterior-a-alta", "Debe ser posterior a la fecha de alta", function (value) {
				const { fechaAlta } = this.parent;
				if (!value || !fechaAlta) return true;
				const desde = dayjs(value, "DD/MM/YYYY");
				const alta = dayjs(fechaAlta, "MM/YYYY").startOf("month");
				return desde.isAfter(alta);
			}),
		fechaHastaReclamado: Yup.string()
			.required("Ingrese la fecha de fin del período reclamado")
			.test("hasta-posterior-a-desde", "Debe ser posterior a la fecha desde", function (value) {
				const { fechaDesdeReclamado } = this.parent;
				if (!value || !fechaDesdeReclamado) return true;
				return dayjs(value, "DD/MM/YYYY").isAfter(dayjs(fechaDesdeReclamado, "DD/MM/YYYY"));
			})
			.test("hasta-posterior-a-alta", "Debe ser posterior a la fecha de alta", function (value) {
				const { fechaAlta } = this.parent;
				if (!value || !fechaAlta) return true;
				return dayjs(value, "DD/MM/YYYY").isAfter(dayjs(fechaAlta, "MM/YYYY").startOf("month"));
			})
			.test("hasta-no-futura", "No puede ser posterior a la fecha actual", function (value) {
				if (!value) return true;
				return !dayjs(value, "DD/MM/YYYY").isAfter(dayjs());
			}),
		fechaCierre: Yup.string()
			.required("Ingrese la fecha de cierre de la liquidación")
			.test("cierre-no-anterior-a-hasta", "No puede ser anterior a la fecha hasta del período reclamado", function (value) {
				const { fechaHastaReclamado } = this.parent;
				if (!value || !fechaHastaReclamado) return true;
				return !dayjs(value, "DD/MM/YYYY").isBefore(dayjs(fechaHastaReclamado, "DD/MM/YYYY"));
			})
			.test("cierre-no-futura", "No puede ser posterior a la fecha actual", function (value) {
				if (!value) return true;
				return !dayjs(value, "DD/MM/YYYY").isAfter(dayjs());
			}),
	}),

	// Step 3 — Criterios de movilidad
	Yup.object({
		criteriosMovilidad: Yup.array()
			.of(
				Yup.object({
					indiceMovilidad: Yup.string().required("Seleccione un índice de movilidad"),
					fechaDesde: Yup.string().required("Ingrese la fecha de inicio"),
				}),
			)
			.min(1, "Agregue al menos un criterio de movilidad")
			.test("continuidad-fechas", "Las fechas deben ser cronológicamente consecutivas", (criterios) => {
				if (!criterios || criterios.length < 2) return true;
				for (let i = 1; i < criterios.length; i++) {
					const prev = criterios[i - 1]?.fechaDesde;
					const curr = criterios[i]?.fechaDesde;
					if (prev && curr) {
						const prevDate = dayjs(prev, "DD/MM/YYYY");
						const currDate = dayjs(curr, "DD/MM/YYYY");
						if (currDate.isBefore(prevDate) || currDate.isSame(prevDate)) {
							return false;
						}
					}
				}
				return true;
			}),
	}),

	// Step 4 — Aplicación de topes (sin cambios)
	Yup.object({
		topeDesde: Yup.string().when("tipoTope", {
			is: (val: string) => val && val !== "no",
			then: (schema) => schema.required("Ingrese la fecha de inicio de aplicación del tope"),
			otherwise: (schema) => schema.notRequired(),
		}),
		topeHasta: Yup.string().when("tipoTope", {
			is: (val: string) => val && val !== "no",
			then: (schema) => schema.required("Ingrese la fecha de fin de aplicación del tope"),
			otherwise: (schema) => schema.notRequired(),
		}),
	}),

	// Step 5 — Tasa de interés de sentencia
	Yup.object({
		tasaInteresSentencia: Yup.string().required("Seleccione una tasa de interés de sentencia"),
	}),
];

export default validationSchema;
