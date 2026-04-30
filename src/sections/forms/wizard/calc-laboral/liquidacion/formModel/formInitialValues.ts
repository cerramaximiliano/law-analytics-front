import liquidacionFormModel from "./liquidacionFormModel";

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
		liquidacion,
		aplicarIntereses,
		fechaInicialIntereses,
		fechaFinalIntereses,
		tasaIntereses,
		segmentsIntereses,
		capitalizeInterest,
		folderId,
		folderName,
	},
} = liquidacionFormModel;

const initialValues = {
	[reclamante.name]: "",
	[reclamado.name]: "",
	[fechaIngreso.name]: "",
	[fechaEgreso.name]: "",
	[remuneracion.name]: "",
	[otrasSumas.name]: "",
	[dias.name]: "",
	[incluirSAC.name]: false,
	[liquidacion.name]: [],
	[aplicarIntereses.name]: false,
	[fechaInicialIntereses.name]: "",
	[fechaFinalIntereses.name]: "",
	[tasaIntereses.name]: "",
	[segmentsIntereses.name]: [],
	[capitalizeInterest.name]: false,
	[folderId.name]: "",
	[folderName.name]: "",
};
export default initialValues;
