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
	},
} = despidoFormModel;

const initialValues = {
	[reclamante.name]: "asdf",
	[reclamado.name]: "asdf",
	[fechaIngreso.name]: null,
	[fechaEgreso.name]: null,
	[remuneracion.name]: "",
	[otrasSumas.name]: "",
	[dias.name]: "",
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
};
export default initialValues;
