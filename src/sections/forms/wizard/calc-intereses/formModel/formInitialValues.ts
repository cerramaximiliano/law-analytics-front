import interesesFormModel from "./interesesFormModel";

const {
	formField: { reclamante, reclamado, tasa, capital, fechaInicial, fechaFinal, folderId, folderName, segments, capitalizeInterest },
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
	[segments.name]: [],
	[capitalizeInterest.name]: false,
};
export default initialValues;
