import punitivosFormModel from "./punitivosFormModel";

const {
	formField: {
		reclamante,
		reclamado,
		compensacion,
		probabilidadPunitivos,
		probabilidadDsPs,
		nivelPrecaucion,
		porcentajeMin,
		probOcurrencia,
	},
} = punitivosFormModel;

const initialValues = {
	[reclamante.name]: "",
	[reclamado.name]: "",
	[compensacion.name]: "",
	[probabilidadPunitivos.name]: "",
	[probabilidadDsPs.name]: "",
	[nivelPrecaucion.name]: "",
	[porcentajeMin.name]: "",
	[probOcurrencia.name]: "",
};
export default initialValues;
