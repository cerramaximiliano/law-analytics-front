import interesesFormModel from "./interesesFormModel";

const {
	formField: { reclamante, reclamado, tasa, capital, fechaInicial, fechaFinal, folderId, folderName },
} = interesesFormModel;

const initialValues = {
	[reclamante.name]: "",
	[reclamado.name]: "",
	[tasa.name]: "",
	[capital.name]: "",
	[fechaInicial.name]: "",
	[fechaFinal.name]: "",
	[folderId.name]: "",
	[folderName.name]: "",
};
export default initialValues;
