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
		haberReclamadoAl: { name: "haberReclamadoAl", label: "Haber reclamado al" },
		pisoPercibido: { name: "pisoPercibido", label: "Piso del haber percibido" },
		zonaAustral: { name: "zonaAustral", label: "Bonificación por zona austral (×1,4 en las sumas fijas y en el haber máximo)" },
		pensionFecha: { name: "pensionFecha", label: "Fecha de fallecimiento del causante" },
		pensionPorcentaje: { name: "pensionPorcentaje", label: "Porcentaje de la pensión" },
		topeEvaluacion: { name: "topeEvaluacion", label: "Cómo se evalúa el tope" },
		topePorcentaje: { name: "topePorcentaje", label: "Porcentaje de quita (opcional)" },
		sac: { name: "sac", label: "Incluir diferencias de SAC" },
		// cada ítem: { fecha: DD/MM/AAAA, importe, tipo: administrativo | embargo | deposito_judicial | otro }
		pagosACuenta: { name: "pagosACuenta", label: "Pagos a cuenta" },
		bono: { name: "bono", label: "Bono previsional (subsidios, refuerzos y bonos extraordinarios)" },
		bonoTratamiento: { name: "bonoTratamiento", label: "Cómo se liquida el bono" },
		capitalizarInteresImpago: { name: "capitalizarInteresImpago", label: "Capitalizar el interés impago" },
	},
};

export default previsionalFormModel;
