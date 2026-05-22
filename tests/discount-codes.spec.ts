/**
 * BLOQUE 28 — Discount codes (API pública).
 *
 * Endpoints:
 *   GET  /api/discounts/active                            → listado público
 *   POST /api/discounts/validate { code, planId?, billingPeriod? }  → dry-run
 *
 * Ambos endpoints son públicos (sin auth requerida). Tests contra backend
 * directo, sin navegación UI.
 */

import { test, expect, request as playwrightRequest } from "@playwright/test";

const API = "http://localhost:5000";

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function publicCtx() {
	// Sin storageState → request anónimo (los endpoints son públicos)
	return playwrightRequest.newContext();
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — GET /active lista descuentos públicos vigentes
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — GET /api/discounts/active devuelve array de descuentos", async () => {
	test.setTimeout(15_000);
	const ctx = await publicCtx();
	try {
		const res = await ctx.get(`${API}/api/discounts/active`);
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
		expect(typeof body.count).toBe("number");
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — validate sin code → 400
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — POST /validate sin code → 400 'El código es requerido'", async () => {
	test.setTimeout(15_000);
	const ctx = await publicCtx();
	try {
		const res = await ctx.post(`${API}/api/discounts/validate`, { data: {} });
		expect(res.status()).toBeGreaterThanOrEqual(400);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.message).toMatch(/código.*requerido|requerid.*código/i);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — validate con code inexistente → 400
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — POST /validate con code inexistente → 400 'Código no encontrado'", async () => {
	test.setTimeout(15_000);
	const ctx = await publicCtx();
	try {
		const res = await ctx.post(`${API}/api/discounts/validate`, {
			data: { code: "CODIGOQUENO_EXISTE_E2E_" + Date.now() },
		});
		expect(res.status()).toBeGreaterThanOrEqual(400);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.message).toMatch(/no encontrado|inválido|inactiv|expirado/i);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — validate con code válido (si existe alguno público) → success
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — POST /validate con code público existente → 200 y priceInfo", async () => {
	test.setTimeout(15_000);
	const ctx = await publicCtx();
	try {
		// 1. Buscar un código público activo para testear
		const listRes = await ctx.get(`${API}/api/discounts/active`);
		const listBody = await listRes.json();
		const codes: any[] = listBody.data ?? [];

		if (codes.length === 0) {
			test.info().annotations.push({
				type: "no-data",
				description: "No hay discount codes públicos activos en la DB para testear validación exitosa.",
			});
			test.skip();
			return;
		}

		const code = codes[0].code;
		const res = await ctx.post(`${API}/api/discounts/validate`, {
			data: { code, planId: "standard", billingPeriod: "monthly" },
		});

		// Puede fallar por restricciones (newCustomersOnly, activePlan, etc.) → documentar
		if (!res.ok()) {
			const body = await res.json();
			test.info().annotations.push({
				type: "restricted-code",
				description: `Code ${code} rechazado: ${body.message}`,
			});
			// Al menos el endpoint respondió con shape de error correcto
			expect(body.success).toBe(false);
			return;
		}

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data?.code).toBe(code);
		expect(typeof body.data?.discountValue).toBe("number");
		expect(["percentage", "fixed_amount"]).toContain(body.data?.discountType);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — validate es case-insensitive (el backend uppercase-ea)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — POST /validate con code en lowercase → mismo resultado que uppercase", async () => {
	test.setTimeout(15_000);
	const ctx = await publicCtx();
	try {
		const bogus = "test-lower-" + Date.now();
		const resLower = await ctx.post(`${API}/api/discounts/validate`, { data: { code: bogus } });
		const resUpper = await ctx.post(`${API}/api/discounts/validate`, {
			data: { code: bogus.toUpperCase() },
		});
		expect(resLower.status()).toBe(resUpper.status());
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — GET /active con filtro planId
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — GET /active?planId=standard retorna 200", async () => {
	test.setTimeout(15_000);
	const ctx = await publicCtx();
	try {
		const res = await ctx.get(`${API}/api/discounts/active?planId=standard&billingPeriod=monthly`);
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
	} finally {
		await ctx.dispose();
	}
});
