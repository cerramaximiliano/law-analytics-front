const previsionalFormModel = {
	formId: "previsionalRetroactivoForm",
	formField: {
		// Identificación del caso
		reclamante: { name: "reclamante", label: "Titular / Reclamante" },
		folderId: { name: "folderId" },
		folderName: { name: "folderName" },
		// Datos del expediente
		expedienteAdmin: { name: "expedienteAdmin", label: "Nº Expediente Administrativo" },
		prestacion: { name: "prestacion", label: "Prestación" },
		obraSocial: { name: "obraSocial", label: "Descuento Obra Social" },
		fechaAdquisicion: { name: "fechaAdquisicion", label: "Fecha de Adquisición del Derecho" },
		fechaAlta: { name: "fechaAlta", label: "Fecha de Alta" },
		// Haber pagado
		haberPagadoAnses: { name: "haberPagadoAnses", label: "Haber Pagado ANSES" },
		haberPagadoAl: { name: "haberPagadoAl", label: "Pagado al" },
		monedaHaberPagado: { name: "monedaHaberPagado", label: "Moneda" },
		// Haber reajustado
		tieneReajuste: { name: "tieneReajuste", label: "¿Posee haber reajustado por ANSES?" },
		fechaAltaReajuste: { name: "fechaAltaReajuste", label: "Fecha de Alta del Haber Reajustado" },
		importeReajuste: { name: "importeReajuste", label: "Importe del Haber Reajustado" },
		monedaReajuste: { name: "monedaReajuste", label: "Moneda" },
		// Haber reclamado
		haberReclamado: { name: "haberReclamado", label: "Haber Reclamado" },
		monedaReclamado: { name: "monedaReclamado", label: "Moneda" },
		// Período reclamado
		fechaDesdeReclamado: { name: "fechaDesdeReclamado", label: "Fecha desde" },
		fechaHastaReclamado: { name: "fechaHastaReclamado", label: "Fecha hasta" },
		// Cierre de liquidación
		fechaCierre: { name: "fechaCierre", label: "Fecha de Cierre de la Liquidación" },
		// Criterios de movilidad
		criteriosMovilidad: { name: "criteriosMovilidad", label: "Criterios de Movilidad" },
		// Topes
		tipoTope: { name: "tipoTope", label: "Aplica tope Art. 9 Ley 24.463 inc. 3" },
		topeDesde: { name: "topeDesde", label: "Desde fecha" },
		topeHasta: { name: "topeHasta", label: "Hasta fecha" },
		// Tasa de interés de sentencia
		tasaInteresSentencia: { name: "tasaInteresSentencia", label: "Tasa de Interés de Sentencia" },
	},
};

export default previsionalFormModel;
