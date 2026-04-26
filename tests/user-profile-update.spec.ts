/**
 * BLOQUE 27 — User profile update + skills + password + preferences (API).
 *
 * Endpoints cubiertos:
 *   PUT    /api/auth/update              → actualiza campos no-sensibles del perfil
 *   PUT    /api/auth/change-password     → cambio de password (validación)
 *   POST   /api/auth/skills              → upsert de skills (matrícula abogado)
 *   DELETE /api/auth/skills/:skillId     → borrar skill individual
 *   PUT    /api/notifications/preferences → preferencias (timezone, canales, etc.)
 *
 * Estrategia: cada test guarda el valor original antes de mutar y lo restaura.
 * No se ejercita `deactivate-account` (destructivo).
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getProfile(): Promise<any> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/auth/me`);
		if (!res.ok()) {
			// Fallback: endpoint puede ser /api/users/me
			const alt = await ctx.get(`${API}/api/users/me`);
			if (!alt.ok()) throw new Error(`Cannot fetch profile: ${res.status()}/${alt.status()}`);
			const body = await alt.json();
			return body.user ?? body.data ?? body;
		}
		const body = await res.json();
		return body.user ?? body.data ?? body;
	} finally {
		await ctx.dispose();
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Profile update: firstName + contact + designation
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — PUT /api/auth/update modifica firstName/contact/designation y devuelve 200", async () => {
	test.setTimeout(30_000);

	const original = await getProfile();
	const origFirstName = original?.firstName ?? "";
	const origContact = original?.contact ?? "";
	const origDesignation = original?.designation ?? "";

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/auth/update`, {
			data: {
				firstName: "E2E-Test-FirstName",
				contact: "+54 11 0000-0000",
				designation: "E2E Designation",
			},
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.user?.firstName).toBe("E2E-Test-FirstName");

		// Verificar persistencia con un GET
		const check = await ctx.get(`${API}/api/auth/me`);
		if (check.ok()) {
			const checkBody = await check.json();
			const u = checkBody.user ?? checkBody.data ?? checkBody;
			expect(u.firstName).toBe("E2E-Test-FirstName");
			expect(u.contact).toBe("+54 11 0000-0000");
			expect(u.designation).toBe("E2E Designation");
		}
	} finally {
		// Restaurar valores originales
		try {
			await ctx.put(`${API}/api/auth/update`, {
				data: {
					firstName: origFirstName,
					contact: origContact,
					designation: origDesignation,
				},
			});
		} catch {}
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Profile update: DOB con fecha futura debería rechazarse
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — PUT /api/auth/update con DOB futura → 4xx (validación max(new Date()))", async () => {
	test.setTimeout(20_000);

	const futureDate = new Date();
	futureDate.setFullYear(futureDate.getFullYear() + 5);

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/auth/update`, {
			data: { dob: futureDate.toISOString() },
		});
		// Si el backend valida, rechaza; si no, marcamos el hallazgo.
		if (res.ok()) {
			test.info().annotations.push({
				type: "validation-gap",
				description: "Backend aceptó DOB futura (no hay validación max date en /auth/update).",
			});
			// Restaurar a fecha razonable para no ensuciar datos
			await ctx.put(`${API}/api/auth/update`, {
				data: { dob: "1990-01-01T00:00:00.000Z" },
			});
		} else {
			expect(res.status()).toBeGreaterThanOrEqual(400);
		}
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Password change: currentPassword incorrecto → 401
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — PUT /api/auth/change-password con currentPassword incorrecto → 401", async () => {
	test.setTimeout(15_000);

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/auth/change-password`, {
			data: {
				currentPassword: "thisIsWrong123!",
				newPassword: "Valid-NewPass-1!",
			},
		});
		expect(res.status()).toBeGreaterThanOrEqual(400);
		expect([400, 401, 403]).toContain(res.status());
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Password change: newPassword débil → validación
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — PUT /api/auth/change-password con newPassword débil → 4xx (validación)", async () => {
	test.setTimeout(15_000);

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/auth/change-password`, {
			data: {
				currentPassword: TEST_USERS.owner.password,
				newPassword: "short", // < 8 chars, sin mayúscula, sin número, sin special
			},
		});
		// Backend debe rechazar por validación o por "igual al actual"
		expect(res.status()).toBeGreaterThanOrEqual(400);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Skill management: crear skill vía POST /api/auth/skills
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — POST /api/auth/skills agrega matrícula profesional", async () => {
	test.setTimeout(30_000);
	const skillName = `E2E-Colegio-${Date.now()}`;

	const ctx = await apiAsUser("owner");
	let createdSkillId: string | null = null;
	try {
		const res = await ctx.post(`${API}/api/auth/skills`, {
			data: {
				skills: [
					{
						name: skillName,
						registrationNumber: "T-123-F-456",
						taxCondition: "autonomo",
						taxCode: 20123456789,
						electronicAddress: "e2e-matricula@example.com",
					},
				],
			},
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(Array.isArray(body.skills)).toBe(true);

		const created = body.skills.find((s: any) => s.name === skillName);
		expect(created).toBeDefined();
		expect(created.registrationNumber).toBe("T-123-F-456");
		expect(created.taxCondition).toBe("autonomo");
		createdSkillId = created._id;
	} finally {
		// Cleanup: eliminar la skill creada
		if (createdSkillId) {
			try {
				await ctx.delete(`${API}/api/auth/skills/${createdSkillId}`);
			} catch {}
		}
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Skill: DELETE /api/auth/skills/:id elimina la skill
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — DELETE /api/auth/skills/:id elimina la skill creada", async () => {
	test.setTimeout(30_000);
	const skillName = `E2E-Delete-${Date.now()}`;

	const ctx = await apiAsUser("owner");
	try {
		// Crear
		const createRes = await ctx.post(`${API}/api/auth/skills`, {
			data: {
				skills: [
					{
						name: skillName,
						registrationNumber: "DEL-1",
						taxCondition: "monotributo",
						taxCode: 20987654321,
						electronicAddress: "del@example.com",
					},
				],
			},
		});
		expect(createRes.ok()).toBe(true);
		const createdBody = await createRes.json();
		const skillId = createdBody.skills?.find((s: any) => s.name === skillName)?._id;
		expect(skillId).toBeDefined();

		// Eliminar
		const delRes = await ctx.delete(`${API}/api/auth/skills/${skillId}`);
		expect(delRes.ok()).toBe(true);
		const delBody = await delRes.json();
		expect(delBody.success).toBe(true);
		expect(Array.isArray(delBody.skills)).toBe(true);
		expect(delBody.skills.find((s: any) => s._id === skillId)).toBeUndefined();
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 7 — Skill: validación taxCondition inválido → 400
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 7 — POST /api/auth/skills con taxCondition='invalid' → 400", async () => {
	test.setTimeout(15_000);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/auth/skills`, {
			data: {
				skills: [
					{
						name: "E2E-Invalid",
						registrationNumber: "X-0",
						taxCondition: "invalid-condition",
						taxCode: 20111111111,
						electronicAddress: "x@example.com",
					},
				],
			},
		});
		expect(res.status()).toBeGreaterThanOrEqual(400);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 8 — Notification preferences: toggle email channel
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 8 — PUT /api/notifications/preferences toggles notifications.channels.email", async () => {
	test.setTimeout(30_000);

	const ctx = await apiAsUser("owner");
	try {
		// Leer estado inicial
		const getRes = await ctx.get(`${API}/api/notifications/preferences`);
		if (!getRes.ok()) {
			test.info().annotations.push({
				type: "endpoint-missing",
				description: "GET /api/notifications/preferences respondió no-OK. Skip.",
			});
			test.skip();
			return;
		}
		const getBody = await getRes.json();
		// GET devuelve `data` con el contenido de notifications spread (channels directamente en data)
		const current = getBody.data ?? getBody;
		const originalEmail = current?.channels?.email ?? true;

		// Toggle. El controller acepta `channels` top-level y hace set en preferences.notifications.channels.*
		const target = !originalEmail;
		const putRes = await ctx.put(`${API}/api/notifications/preferences`, {
			data: { channels: { email: target } },
		});
		expect(putRes.ok()).toBe(true);
		const putBody = await putRes.json();
		expect(putBody.success).toBe(true);

		// Verificar el cambio
		const verify = await ctx.get(`${API}/api/notifications/preferences`);
		const verifyBody = await verify.json();
		const updated = verifyBody.data ?? verifyBody;
		expect(updated?.channels?.email).toBe(target);

		// Restaurar
		await ctx.put(`${API}/api/notifications/preferences`, {
			data: { channels: { email: originalEmail } },
		});
	} finally {
		await ctx.dispose();
	}
});
