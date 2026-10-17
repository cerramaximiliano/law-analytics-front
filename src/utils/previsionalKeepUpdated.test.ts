import { describe, expect, it } from "vitest";
import { etiquetaVersion, fechaActualizadoAl, puedeMantenerActualizado } from "./previsionalKeepUpdated";

describe("previsionalKeepUpdated", () => {
	it("solo se puede mantener actualizado si el guardado trae variables.input", () => {
		expect(puedeMantenerActualizado({ variables: { input: { consolidacion: "2026-10-17" } } })).toBe(true);
		expect(puedeMantenerActualizado({ variables: { formulario: {} } })).toBe(false);
		expect(puedeMantenerActualizado(null)).toBe(false);
	});

	it("formatea la fecha de cierre del input", () => {
		expect(fechaActualizadoAl({ variables: { input: { consolidacion: "2026-09-30" } } })).toBe("30/09/2026");
		expect(fechaActualizadoAl({ variables: { input: { consolidacion: "2026-09-30T00:00:00.000Z" } } })).toBe("30/09/2026");
		expect(fechaActualizadoAl({ variables: { input: {} } })).toBeNull();
		expect(fechaActualizadoAl({})).toBeNull();
	});

	it("etiqueta las versiones según el motivo", () => {
		expect(etiquetaVersion({ motivo: "actualizacion_automatica" })).toBe("Actualización automática");
		expect(etiquetaVersion({ motivo: "edicion" })).toBe("Edición");
		expect(etiquetaVersion({})).toBe("Edición");
		expect(etiquetaVersion(undefined)).toBe("Edición");
	});
});
