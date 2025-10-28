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
		ingresosTotales: FormField;
		porcentajeIncapacidad: FormField;
		tasaInteres: FormField;
		edadDesde: FormField;
		edadHasta: FormField;
		folderId: FormField;
		folderName: FormField;
	};
}

const compensacionFormModel: FormModel = {
	formId: "despidoForm",
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
		ingresosTotales: {
			name: "ingresosTotales",
			label: "Ingresos totales anuales*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		porcentajeIncapacidad: {
			name: "porcentajeIncapacidad",
			label: "Porcentaje de incapacidad*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		tasaInteres: {
			name: "tasaInteres",
			label: "Tasa de interés anual*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		edadDesde: {
			name: "edadDesde",
			label: "Edad a partir de la cual se computan los ingresos*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		edadHasta: {
			name: "edadHasta",
			label: "Edad hasta la cual se computan los ingresos*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		folderId: {
			name: "folderId",
			label: "ID de la carpeta vinculada",
			type: "folder",
		},
		folderName: {
			name: "folderName",
			label: "Nombre de la carpeta vinculada",
			type: "folder",
		},
	},
};

export default compensacionFormModel;
