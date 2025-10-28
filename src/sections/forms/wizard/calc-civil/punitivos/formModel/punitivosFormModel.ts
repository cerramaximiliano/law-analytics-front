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
		compensacion: FormField;
		probabilidadPunitivos: FormField;
		probabilidadDsPs: FormField;
		nivelPrecaucion: FormField;
		porcentajeMin: FormField;
		probOcurrencia: FormField;
		folderId: FormField;
		folderName: FormField;
	};
}

const punitivosFormModel: FormModel = {
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
		compensacion: {
			name: "compensacion",
			label: "Compensación por daños y perjuicios*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		probabilidadPunitivos: {
			name: "probabilidadPunitivos",
			label: "Probabilidad de condena por Daños Punitivos*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		probabilidadDsPs: {
			name: "probabilidadDsPs",
			label: "Nivel de precaución socialmente deseable*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		nivelPrecaucion: {
			name: "nivelPrecaucion",
			label: "Porcentaje mínimo de nivel de precaución*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		porcentajeMin: {
			name: "porcentajeMin",
			label: "Probabilidad de ocurrencia del daño*",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		probOcurrencia: {
			name: "probOcurrencia",
			label: "Nombre del reclamado*",
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

export default punitivosFormModel;
