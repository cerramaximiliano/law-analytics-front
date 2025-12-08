// validationSchema.ts
import * as Yup from "yup";
import interesesFormModel from "./interesesFormModel";

const {
	formField: { reclamante, reclamado, capital, segments },
} = interesesFormModel;

// Esquema de validación actualizado para múltiples tramos
const esquemaValidacion = [
	Yup.object().shape({
		[reclamante.name]: Yup.string().required(`${reclamante.requiredErrorMsg}`),
		[reclamado.name]: Yup.string().required(`${reclamado.requiredErrorMsg}`),
		[capital.name]: Yup.number()
			.typeError(`El capital debe ser un número`)
			.required(`${capital.requiredErrorMsg}`)
			.moreThan(0, "El capital debe ser mayor a 0"),
		[segments.name]: Yup.array()
			.min(1, `${segments.requiredErrorMsg}`)
			.test("all-calculated", "Todos los tramos deben estar calculados", function (value) {
				if (!value || value.length === 0) return true; // La validación de min ya maneja el caso vacío
				const allCalculated = value.every((segment) => segment.isCalculated === true);
				if (!allCalculated) {
					return this.createError({
						message: "Todos los tramos deben estar calculados antes de continuar",
					});
				}
				return true;
			}),
	}),
];

// Función para crear el esquema de validación (mantener por compatibilidad)
export const crearEsquemaValidacion = () => {
	return esquemaValidacion;
};

export default esquemaValidacion;
