import despidoFormModel from "./despidoFormModel";

const {
	formField: { reclamante, reclamado, fechaIngreso, fechaEgreso, remuneracion, otrasSumas, dias, liquidacion },
} = despidoFormModel;

const initialValues = {
	[reclamante.name]: "asdf",
	[reclamado.name]: "asdf",
	[fechaIngreso.name]: "10/10/2020",
	[fechaEgreso.name]: "15/10/2020",
	[remuneracion.name]: "3215",
	[otrasSumas.name]: "",
	[dias.name]: "",
	[liquidacion.name]: [],
};
export default initialValues;
