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
		fechaIngreso: FormField;
		fechaEgreso: FormField;
		remuneracion: FormField;
		otrasSumas: FormField;
		dias: FormField;
		liquidacion: FormField;
		isLiquidacion: FormField;
		topes: FormField;
		isTopes: FormField;
		remuneracionTopes: FormField;
		isMultas: FormField;
		multas: FormField;
		multaLE: FormField;
		fechaFalsa: FormField;
		salarioFalso: FormField;
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
		isLiquidacion: {
			name: "isLiquidacion",
			label: "Liquidación Final",
			type: "liquidacion",
		},
		liquidacion: {
			name: "liquidacion",
			label: "Preaviso",
			requiredErrorMsg: "Debe seleccionar al menos una opción",
			type: "liquidacion",
		},
		isTopes: {
			name: "isTopes",
			label: "Topes",
			type: "topes",
		},
		topes: {
			name: "topes",
			label: "topes",
			requiredErrorMsg: "Debe seleccionar al menos una opción",
			type: "topes",
		},
		remuneracionTopes: {
			name: "remuneracionTopes",
			label: "Remuneración tope",
			requiredErrorMsg: "El tope de remuneración es requerido",
			type: "topes",
		},
		isMultas: {
			name: "isMultas",
			label: "Multas",
			type: "multas",
		},
		multas: {
			name: "multas",
			label: "multas",
			type: "multas",
		},
		multaLE: {
			name: "multaLE",
			label: "Multas Ley 24.013",
			requiredErrorMsg: "Debe seleccionar una opción de multa a aplicar",
			type: "multas",
		},
		fechaFalsa: {
			name: "fechaFalsa",
			label: "Fecha Falsa",
			requiredErrorMsg: "Debe consignar una fecha",
			type: "multas",
		},
		salarioFalso: {
			name: "salarioFalso",
			label: "Salario Falso",
			requiredErrorMsg: "Debe consignar un salario",
			type: "multas",
		},
	},
};

export default despidoFormModel;
