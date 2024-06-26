interface FormField {
	name: string;
	label: string;
	requiredErrorMsg?: string;
	type?: string;
	labels?: { [key: string]: string };
}

interface FormModel {
	formId: string;
	formField: {
		reclamante: FormField;
		reclamado: FormField;
		fechaIngreso: FormField;
		fechaEgreso: FormField;
		remuneracion: FormField;
		otrasSumas: FormField;
		dias: FormField;
		liquidacion: FormField;
	};
}

const despidoFormModel: FormModel = {
	formId: "despidoForm",
	formField: {
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
			type: "reclamo",
		},
		dias: {
			name: "dias",
			label: "Dias de Descuento",
			type: "reclamo",
		},
		liquidacion: {
			name: "liquidacion",
			label: "Liquidación Final",
			requiredErrorMsg: "Debe seleccionar al menos una opción",
			type: "liquidacion",
			labels: {
				preaviso: "Preaviso",
				integracionMes: "Integración Mes",
				sacProp: "SAC Proporcional",
				sacPreaviso: "SAC s/ Preaviso",
				diasTrabajados: "Días Trabajados",
				vacaciones: "Vacaciones",
			},
		},
	},
};

export default despidoFormModel;
