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
	[folderId.name]: "",
	[folderName.name]: "",
};
export default initialValues;
