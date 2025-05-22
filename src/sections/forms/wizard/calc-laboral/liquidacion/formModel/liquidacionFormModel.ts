interface FormField {
	name: string;
	label: string;
	requiredErrorMsg?: string;
	type?: string;
}

interface FormModel {
	formId: string;
	formField: {
		// Paso 1: Datos básicos
		reclamante: FormField;
		reclamado: FormField;
		fechaIngreso: FormField;
		fechaEgreso: FormField;
		remuneracion: FormField;
		otrasSumas: FormField;
		dias: FormField;
		incluirSAC: FormField;

		// Paso 2: Cálculos opcionales
		liquidacion: FormField;
		
		// Paso 3: Actualización por intereses
		aplicarIntereses: FormField;
		fechaInicialIntereses: FormField;
		fechaFinalIntereses: FormField;
		tasaIntereses: FormField;

		// Campos de datos vinculados
		folderId: FormField;
		folderName: FormField;
	};
}

const liquidacionFormModel: FormModel = {
	formId: "liquidacionForm",
	formField: {
		// Paso 1: Datos básicos
		reclamante: {
			name: "reclamante",
			label: "Nombre del reclamante*",
			requiredErrorMsg: "El nombre del reclamante es requerido",
			type: "reclamo",
		},
		reclamado: {
			name: "reclamado",
			label: "Nombre del reclamado*",
			requiredErrorMsg: "El nombre del reclamado es requerido",
			type: "reclamo",
		},
		fechaIngreso: {
			name: "fechaIngreso",
			label: "Fecha de Ingreso*",
			requiredErrorMsg: "La fecha de ingreso es requerida",
			type: "reclamo",
		},
		fechaEgreso: {
			name: "fechaEgreso",
			label: "Fecha de Egreso*",
			requiredErrorMsg: "La fecha de egreso es requerida",
			type: "reclamo",
		},
		remuneracion: {
			name: "remuneracion",
			label: "Remuneracion*",
			requiredErrorMsg: "La remuneración es requerida",
			type: "reclamo",
		},
		otrasSumas: {
			name: "otrasSumas",
			label: "Otras Sumas Adeudadas",
			type: "otrasSumas",
		},
		dias: {
			name: "dias",
			label: "Dias no trabajados",
			type: "reclamo",
		},
		incluirSAC: {
			name: "incluirSAC",
			label: "Incluir SAC",
			type: "reclamo",
		},

		// Paso 2: Cálculos opcionales
		liquidacion: {
			name: "liquidacion",
			label: "Liquidación Final",
			requiredErrorMsg: "Debe seleccionar al menos una opción",
			type: "liquidacion",
		},

		// Paso 3: Actualización por intereses
		aplicarIntereses: {
			name: "aplicarIntereses",
			label: "Aplicar Intereses",
			type: "intereses",
		},
		fechaInicialIntereses: {
			name: "fechaInicialIntereses",
			label: "Fecha inicial de intereses",
			requiredErrorMsg: "La fecha inicial de intereses es requerida",
			type: "intereses",
		},
		fechaFinalIntereses: {
			name: "fechaFinalIntereses",
			label: "Fecha final de intereses",
			requiredErrorMsg: "La fecha final de intereses es requerida",
			type: "intereses",
		},
		tasaIntereses: {
			name: "tasaIntereses",
			label: "Tasa de intereses",
			requiredErrorMsg: "La tasa de intereses es requerida",
			type: "intereses",
		},

		// Campos de datos vinculados
		folderId: {
			name: "folderId",
			label: "ID de la carpeta",
			type: "reclamo",
		},
		folderName: {
			name: "folderName",
			label: "Nombre de la carpeta",
			type: "reclamo",
		},
	},
};

export default liquidacionFormModel;