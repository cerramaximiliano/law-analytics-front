interface FormField {
	name: string;
	label: string;
	requiredErrorMsg?: string;
	type?: string;
}

interface FormModel {
	formId: string;
	formField: {
		reclamante: FormField;
		reclamado: FormField;
		tasa: FormField;
		capital: FormField;
		fechaInicial: FormField;
		fechaFinal: FormField;
	};
}

const compensacionFormModel: FormModel = {
	formId: "interesesForm",
	formField: {
		reclamante: {
			name: "reclamante",
			label: "Nombre del reclamante*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		reclamado: {
			name: "reclamado",
			label: "Nombre del reclamado*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		tasa: {
			name: "tasa",
			label: "Tasa de interés",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		capital: {
			name: "capital",
			label: "Capital",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		fechaInicial: {
			name: "fechaInicial",
			label: "Fecha inicial",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		fechaFinal: {
			name: "fechaFinal",
			label: "Fecha final",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
	},
};

export default compensacionFormModel;
