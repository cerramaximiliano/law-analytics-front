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
		tasaDescuentoAnual: FormField;
		edadDisolucion: FormField;
		edadLimite: FormField;
		cantIngresosMensuales: FormField;
		probCapacitacion: FormField;
		ingresoMax: FormField;
		probIngresoMax: FormField;
		ingresoReal: FormField;
		probIngresoReal: FormField;
		isPatrimonio: FormField;
		patrimonioInicialReclamado: FormField;
		patrimonioInicialReclamante: FormField;
		patrimonioFinalReclamado: FormField;
		patrimonioFinalReclamante: FormField;
		isVivienda: FormField;
		cantMesesAtribucionVivienda: FormField;
		porcentajeInmuebleOCanon: FormField;
		valorCanon: FormField;
		cantidadHijos: FormField;
		cantidadOtrosFamiliares: FormField;
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
		tasaDescuentoAnual: {
			name: "tasaDescuentoAnual",
			label: "Tasa de Descuento Anual",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		edadDisolucion: {
			name: "edadDisolucion",
			label: "Edad al momento de disolución del vínculo",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		edadLimite: {
			name: "edadLimite",
			label: "Edad límite hasta el cual se calculan los ingresos",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		cantIngresosMensuales: {
			name: "cantIngresosMensuales",
			label: "Cantidad de ingresos mensuales por año",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		probCapacitacion: {
			name: "probCapacitacion",
			label: "Probabilidad de capacitación de no haberse iniciado el vínculo conyugal",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		ingresoMax: {
			name: "ingresoMax",
			label: "Ingreso máximo para capacitación frustrada",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		probIngresoMax: {
			name: "probIngresoMax",
			label: "Probabilidad de acceder al máximo ingreso",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		ingresoReal: {
			name: "ingresoReal",
			label: "Ingreso real actual sin capacitación",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		probIngresoReal: {
			name: "probIngresoReal",
			label: "Probabilidad de acceder o mantener el ingreso real",
			requiredErrorMsg: "Campo requerido",
			type: "reclamo",
		},
		isPatrimonio: {
			name: "isPatrimonio",
			label: "Diferencia patrimonial al finalizar el vínculo",
			type: "patrimonio",
		},
		patrimonioInicialReclamado: {
			name: "patrimonioInicialReclamado",
			label: "Patrimonio inicial del cónyuge reclamado",
			requiredErrorMsg: "Campo requerido",
			type: "patrimonio",
		},
		patrimonioInicialReclamante: {
			name: "patrimonioInicialReclamante",
			label: "Patrimonio inicial del cónyuge reclamante",
			requiredErrorMsg: "Campo requerido",
			type: "patrimonio",
		},
		patrimonioFinalReclamado: {
			name: "patrimonioFinalReclamado",
			label: "Patrimonio final del cónyuge reclamado",
			requiredErrorMsg: "Campo requerido",
			type: "patrimonio",
		},
		patrimonioFinalReclamante: {
			name: "patrimonioFinalReclamante",
			label: "Patrimonio final del cónyuge reclamante",
			requiredErrorMsg: "Campo requerido",
			type: "patrimonio",
		},
		isVivienda: {
			name: "isVivienda",
			label: "Valor relevante a la atribución de vivienda",
			type: "vivienda",
		},
		cantMesesAtribucionVivienda: {
			name: "cantMesesAtribucionVivienda",
			label: "Cantidad de meses de atribución de vivienda familiar",
			requiredErrorMsg: "Campo requerido",
			type: "vivienda",
		},
		porcentajeInmuebleOCanon: {
			name: "porcentajeInmuebleOCanon",
			label: "Cuota parte de titularidad del inmueble o del pago del cánon locativo del reclamado",
			requiredErrorMsg: "Campo requerido",
			type: "vivienda",
		},
		valorCanon: {
			name: "valorCanon",
			label: "Valor locativo anual del inmueble",
			requiredErrorMsg: "Campo requerido",
			type: "vivienda",
		},
		cantidadHijos: {
			name: "cantidadHijos",
			label: "Cantidad de hijos que viven en inmueble familiar",
			requiredErrorMsg: "Campo requerido",
			type: "vivienda",
		},
		cantidadOtrosFamiliares: {
			name: "cantidadOtrosFamiliares",
			label: "Cantidad de otros familiares del reclamante que viven en inmueble familiar",
			requiredErrorMsg: "Campo requerido",
			type: "vivienda",
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
