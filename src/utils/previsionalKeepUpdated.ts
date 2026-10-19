// "Mantener actualizado" de los retroactivos previsionales guardados: el hub extiende el cálculo a cada mes de
// movilidad publicado y, al cambiar de mes, archiva la versión anterior en `variables.historial`.

/** ¿Los percibidos del guardado se cargaron a mano? Entonces no hay percibido para los meses nuevos. */
export function tienePercibidoManual(calc: any): boolean {
	return calc?.variables?.input?.percibido?.modo === "manual";
}

/**
 * ¿El guardado se puede mantener actualizado? Hace falta lo que recibió el motor (`variables.input`) y que el percibido
 * no se haya cargado a mano.
 */
export function puedeMantenerActualizado(calc: any): boolean {
	return !!calc?.variables?.input && !tienePercibidoManual(calc);
}

/** Fecha de cierre del cálculo (`variables.input.consolidacion`, YYYY-MM-DD) como DD/MM/AAAA; null si falta. */
export function fechaActualizadoAl(calc: any): string | null {
	const iso = calc?.variables?.input?.consolidacion;
	if (typeof iso !== "string") return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
	return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/** Etiqueta de una entrada de "Versiones anteriores". */
export function etiquetaVersion(entrada: any): string {
	return entrada?.motivo === "actualizacion_automatica" ? "Actualización automática" : "Edición";
}
