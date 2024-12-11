import despidoFormModel from "./despidoFormModel";

const {
	formField: {
		reclamante,
		reclamado,
		fechaIngreso,
		fechaEgreso,
		remuneracion,
		otrasSumas,
		dias,
		incluirSAC,
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
		folderId,
	},
} = despidoFormModel;

const initialValues = {
	[reclamante.name]: "",
	[reclamado.name]: "",
	[fechaIngreso.name]: null,
	[fechaEgreso.name]: null,
	[remuneracion.name]: "",
	[otrasSumas.name]: "",
	[dias.name]: "",
	[incluirSAC.name]: false,
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
	[folderId.name]: "",
};
export default initialValues;
