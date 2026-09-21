import { describe, expect, it } from "vitest";

import { getPlanPricing } from "utils/planPricingUtils";

import { PLANES_RESPALDO } from "./planesRespaldo";

const cupo = (planId: string, recurso: string) =>
	PLANES_RESPALDO.find((p) => p.planId === planId)?.resourceLimits.find((r) => r.name === recurso)?.limit;

// Si esta prueba falla es porque cambió un precio o un cupo del respaldo que
// dibujan la landing y /plans antes de que responda la API. Confirmar primero
// que `planconfigs` en la base dice lo mismo, y recién ahí actualizar acá.
describe("respaldo estático de planes", () => {
	it("tiene los cuatro planes, en el orden en que se muestran", () => {
		expect(PLANES_RESPALDO.map((p) => p.planId)).toEqual(["free", "standard", "pro", "premium"]);
	});

	it("fija los precios vigentes en USD por mes", () => {
		expect(PLANES_RESPALDO.map((p) => p.pricingInfo.basePrice)).toEqual([0, 7.99, 14.99, 29.99]);
		expect(PLANES_RESPALDO.every((p) => p.pricingInfo.currency === "USD" && p.pricingInfo.billingPeriod === "monthly")).toBe(true);
	});

	it("el precio que se dibuja es el del respaldo, también en localhost", () => {
		expect(PLANES_RESPALDO.map((p) => getPlanPricing(p).basePrice)).toEqual([0, 7.99, 14.99, 29.99]);
	});

	it("fija los cupos que se anuncian: causas, consultas de IA y búsquedas de jurisprudencia", () => {
		const ids = ["free", "standard", "pro", "premium"];
		expect(ids.map((id) => cupo(id, "folders"))).toEqual([5, 50, 200, 500]);
		expect(ids.map((id) => cupo(id, "aiQueriesPerMonth"))).toEqual([5, 50, 200, 500]);
		// -1 = ilimitado en planconfigs
		expect(ids.map((id) => cupo(id, "jurisprudenciaSearchPerMonth"))).toEqual([5, -1, -1, -1]);
	});

	it("el gratuito no sincroniza causas ni tiene reservas; los pagos sí", () => {
		const funcion = (planId: string, nombre: string) =>
			PLANES_RESPALDO.find((p) => p.planId === planId)?.features.find((f) => f.name === nombre)?.enabled;
		expect(["movements", "booking"].map((f) => funcion("free", f))).toEqual([false, false]);
		for (const id of ["standard", "pro", "premium"]) {
			expect(["movements", "booking"].map((f) => funcion(id, f))).toEqual([true, true]);
		}
	});

	it("todas las tarjetas tienen las mismas filas, para que no cambien de alto entre sí", () => {
		const filas = PLANES_RESPALDO.map((p) => [p.resourceLimits.map((r) => r.name), p.features.map((f) => f.name)]);
		for (const f of filas) expect(f).toEqual(filas[0]);
	});
});
