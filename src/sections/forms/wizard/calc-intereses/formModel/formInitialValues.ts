import interesesFormModel from "./interesesFormModel";

const {
	formField: { reclamante, reclamado, tasa, capital, fechaInicial, fechaFinal },
} = interesesFormModel;

const initialValues = {
	[reclamante.name]: "",
	[reclamado.name]: "",
	[tasa.name]: "",
	[capital.name]: "",
	[fechaInicial.name]: "",
	[fechaFinal.name]: "",
};
export default initialValues;
