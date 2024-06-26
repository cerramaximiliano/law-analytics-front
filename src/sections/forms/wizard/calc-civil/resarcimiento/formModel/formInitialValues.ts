import mendezFormModel from "./mendezFormModel";

const {
	formField: { reclamante, reclamado, ingresosTotales, porcentajeIncapacidad, tasaInteres, edadDesde, edadHasta },
} = mendezFormModel;

const initialValues = {
	[reclamante.name]: "",
	[reclamado.name]: "",
	[ingresosTotales.name]: "",
	[porcentajeIncapacidad.name]: "",
	[tasaInteres.name]: "",
	[edadDesde.name]: "",
	[edadHasta.name]: "",
};
export default initialValues;
