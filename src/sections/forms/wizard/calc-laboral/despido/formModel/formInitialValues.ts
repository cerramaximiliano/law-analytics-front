import despidoFormModel from "./despidoFormModel";

const {
	formField: {
		reclamante,
		reclamado,
		fechaIngreso,
		fechaEgreso,
		remuneracion,
		remuneracionTope,
		otrasSumas,
		dias,
		incluirSAC,
		aplicarLey27742,
		isLiquidacion,
		liquidacion,
		isTopes,
		topes,
		remuneracionTopes,
		isMultas,
		multas,
		multaLE,
		fechaFalsa,
		salarioFalso,
		multa245bisPorcentaje,
		aplicarIntereses,
		fechaInicialIntereses,
		fechaFinalIntereses,
		tasaIntereses,
		segmentsIntereses,
		capitalizeInterest,
		includeCERComparison,
		folderId,
		folderName,
	},
} = despidoFormModel;

const initialValues = {
	// Paso 1: Datos básicos
	[reclamante.name]: "",
	[reclamado.name]: "",
	[fechaIngreso.name]: null,
	[fechaEgreso.name]: null,
	[remuneracion.name]: "",
	[remuneracionTope.name]: "",
	[otrasSumas.name]: "",
	[dias.name]: "",
	[incluirSAC.name]: false,
	[aplicarLey27742.name]: false,

	// Paso 2: Cálculos opcionales
	[isLiquidacion.name]: false,
	[liquidacion.name]: [],
	[isTopes.name]: false,
	[topes.name]: [],
	[remuneracionTopes.name]: "",
	[isMultas.name]: false,
	[multas.name]: [],
	[multaLE.name]: 0,
	[fechaFalsa.name]: "",
	[salarioFalso.name]: "",
	[multa245bisPorcentaje.name]: 50,

	// Paso 3: Actualización por intereses
	[aplicarIntereses.name]: false,
	[fechaInicialIntereses.name]: "",
	[fechaFinalIntereses.name]: "",
	[tasaIntereses.name]: "",
	[segmentsIntereses.name]: [],
	[capitalizeInterest.name]: false,
	[includeCERComparison.name]: false,

	// Campos de datos vinculados
	[folderId.name]: "",
	[folderName.name]: "",
};
export default initialValues;
