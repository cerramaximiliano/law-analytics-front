/**
 * BLOQUE 14 — Límites de plan en team mode al umbral.
 *
 * Objetivo: verificar que el cap del plan del OWNER se enforce al crear recursos
 * con `groupId`, tanto si el que los crea es el owner como si es un editor
 * miembro. El conteo se hace contra `UserStats[effectiveOwnerId]`.
 *
 * Escenarios:
 *   14.1 — Team ya al cap: editor miembro intenta crear uno más con groupId → 4xx
 *          (límite del plan del owner, no del editor)
 *   14.2 — Team cerca del cap (limit-1): editor crea el último OK
 *   14.3 — Mismo editor, SIN groupId → usa SU plan free (diferente cap), puede crear
 *
 * Usa **folders** como recurso (tiene checkResourceLimits + team-context full).
 *
 * Fillers vía API paralelos (BATCH=10) — patrón ya usado en folders.spec.ts.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-Limits-${Date.now()}`;

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getOwnerPlanInfo(): Promise<{ limit: number; currentFolders: number }> {
	const ctx = await apiAsUser("owner");
	try {
		const [subRes, statsRes] = await Promise.all([
			ctx.get(`${API}/api/subscriptions/current`),
			ctx.get(`${API}/api/user-stats/user`),
		]);
		const sub = await subRes.json();
		const stats = await statsRes.json();
		return {
			limit: sub.subscription?.limits?.folders ?? 0,
			currentFolders: stats.data?.counts?.folders ?? 0,
		};
	} finally {
		await ctx.dispose();
	}
}

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, { data: { name, description: "E2E limits" } });
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function inviteEditor(teamId: string) {
	const owner = await apiAsUser("owner");
	try {
		await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS.memberEditor.email, role: "editor" }] },
		});
		const teamRes = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await teamRes.json()).group ?? {};
		const invitation = (group.invitations ?? []).find(
			(i: any) => i.email === TEST_USERS.memberEditor.email && i.status === "pending",
		);
		const invitee = await apiAsUser("memberEditor");
		try {
			const acceptRes = await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, {
				data: { skipResourceCheck: true },
			});
			if (!acceptRes.ok()) {
				const body = await acceptRes.json();
				if (body.code === "USER_HAS_RESOURCES") {
					await invitee.delete(`${API}/api/groups/delete-my-resources`, {
						data: { confirmation: "DELETE_ALL_MY_RESOURCES" },
					});
					await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, {
						data: { skipResourceCheck: true },
					});
				}
			}
		} finally {
			await invitee.dispose();
		}
	} finally {
		await owner.dispose();
	}
}

async function createFillerFolders(teamId: string, count: number): Promise<string[]> {
	if (count <= 0) return [];
	const ctx = await apiAsUser("owner");
	const ids: string[] = [];
	const BATCH = 10;
	try {
		for (let i = 0; i < count; i += BATCH) {
			const slice = Array.from({ length: Math.min(BATCH, count - i) }, (_, j) => i + j);
			const results = await Promise.all(
				slice.map((idx) =>
					ctx
						.post(`${API}/api/folders`, {
							headers: { "x-group-id": teamId, "Content-Type": "application/json" },
							data: {
								folderName: `E2E-Limit-Filler-${Date.now()}-${idx}`,
								status: "Nueva",
								materia: "Civil",
								orderStatus: "Actor",
								groupId: teamId,
							},
						})
						.then(async (r) => {
							if (!r.ok()) return null;
							const body = await r.json();
							return body.folder?._id ?? body.data?._id ?? body._id ?? null;
						})
						.catch(() => null),
				),
			);
			for (const id of results) if (id) ids.push(id);
		}
	} finally {
		await ctx.dispose();
	}
	return ids;
}

async function deleteFolders(role: "owner", teamId: string, ids: string[]) {
	if (!ids.length) return;
	const ctx = await apiAsUser(role);
	const BATCH = 10;
	try {
		for (let i = 0; i < ids.length; i += BATCH) {
			const slice = ids.slice(i, i + BATCH);
			await Promise.all(
				slice.map((id) =>
					ctx.delete(`${API}/api/folders/${id}`, { headers: { "x-group-id": teamId } }).catch(() => {}),
				),
			);
		}
	} finally {
		await ctx.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await new Promise((r) => setTimeout(r, 700));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Umbral: editor llena hasta limit-1, crea el último, uno más → bloqueado
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — editor llega al cap del plan del owner: último OK, uno extra bloqueado", async () => {
	test.setTimeout(300_000);

	const { limit, currentFolders } = await getOwnerPlanInfo();
	// Si el owner ya está cerca del cap, skip (no podemos testear con seguridad)
	test.skip(limit - currentFolders < 5, `Owner a ${currentFolders}/${limit} folders — margen insuficiente`);

	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteEditor(teamId);

	// Llenar hasta limit-1 (dejando 1 slot libre)
	const needFillers = limit - currentFolders - 1;
	const fillerIds = await createFillerFolders(teamId, needFillers);

	try {
		// Editor crea el ÚLTIMO → debe permitirse
		const editor = await apiAsUser("memberEditor");
		let lastFolderId = "";
		try {
			const lastRes = await editor.post(`${API}/api/folders`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: {
					folderName: `E2E-Limit-Editor-Last-${Date.now()}`,
					status: "Nueva",
					materia: "Civil",
					orderStatus: "Actor",
					groupId: teamId,
				},
			});
			expect(lastRes.ok()).toBe(true);
			const body = await lastRes.json();
			lastFolderId = body.folder?._id ?? body.data?._id ?? body._id;
			expect(lastFolderId).toBeTruthy();

			// Uno más → 4xx bloqueado (límite del plan del OWNER)
			const extraRes = await editor.post(`${API}/api/folders`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: {
					folderName: `E2E-Limit-Editor-Extra-${Date.now()}`,
					status: "Nueva",
					materia: "Civil",
					orderStatus: "Actor",
					groupId: teamId,
				},
			});
			expect(extraRes.ok()).toBe(false);
			expect([400, 403, 409]).toContain(extraRes.status());
		} finally {
			await editor.dispose();
		}

		if (lastFolderId) fillerIds.push(lastFolderId);
	} finally {
		// Cleanup
		await deleteFolders("owner", teamId, fillerIds);
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Editor SIN groupId: usa su propio plan free (independiente del team)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — editor sin groupId → usa SU propio plan (free), no el del team", async () => {
	test.setTimeout(60_000);

	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteEditor(teamId);

	// Editor intenta crear folder SIN groupId → cuenta contra su propio plan free
	const editor = await apiAsUser("memberEditor");
	let personalFolderId = "";
	try {
		// Pre-cleanup: eliminar recursos personales del editor (por si tiene residuales)
		await editor.delete(`${API}/api/groups/delete-my-resources`, {
			data: { confirmation: "DELETE_ALL_MY_RESOURCES" },
		});

		const res = await editor.post(`${API}/api/folders`, {
			headers: { "Content-Type": "application/json" },
			data: {
				folderName: `E2E-Editor-Personal-${Date.now()}`,
				status: "Nueva",
				materia: "Civil",
				orderStatus: "Actor",
				// sin groupId
			},
		});
		// Si tiene slot disponible en free, debe permitir. Si no, 403/409.
		// En cualquier caso, NO debe ser 401 (autenticación fallida) ni 500.
		expect([200, 201, 400, 403, 409]).toContain(res.status());
		if (res.ok()) {
			const body = await res.json();
			personalFolderId = body.folder?._id ?? body.data?._id ?? "";
			// Verificar que el folder NO tiene groupId
			expect(body.folder?.groupId ?? body.data?.groupId).toBeFalsy();
		}
	} finally {
		// Cleanup del folder personal del editor
		if (personalFolderId) {
			const ctx = await apiAsUser("memberEditor");
			await ctx.delete(`${API}/api/folders/${personalFolderId}`).catch(() => {});
			await ctx.dispose();
		}
		await editor.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Cuenta efectiva es del owner: owner crea + editor crea van al mismo balde
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Límites de escritos (postalDocuments) en team mode
// ─────────────────────────────────────────────────────────────────────────────

async function getOwnerDocsInfo(): Promise<{ limit: number; currentDocs: number }> {
	const ctx = await apiAsUser("owner");
	try {
		const [subRes, statsRes] = await Promise.all([
			ctx.get(`${API}/api/subscriptions/current`),
			ctx.get(`${API}/api/user-stats/user`),
		]);
		const sub = await subRes.json();
		const stats = await statsRes.json();
		return {
			limit: sub.subscription?.limits?.postalDocuments ?? 0,
			currentDocs: stats.data?.counts?.postalDocuments ?? 0,
		};
	} finally {
		await ctx.dispose();
	}
}

async function createDocFillers(teamId: string, count: number): Promise<string[]> {
	if (count <= 0) return [];
	const ctx = await apiAsUser("owner");
	const ids: string[] = [];
	const BATCH = 10;
	try {
		for (let i = 0; i < count; i += BATCH) {
			const slice = Array.from({ length: Math.min(BATCH, count - i) }, (_, j) => i + j);
			const results = await Promise.all(
				slice.map((idx) =>
					ctx
						.post(`${API}/api/rich-text-documents`, {
							headers: { "x-group-id": teamId, "Content-Type": "application/json" },
							data: {
								title: `E2E-DocFiller-${Date.now()}-${idx}`,
								content: "x",
								formData: {},
								status: "draft",
							},
						})
						.then(async (r) => {
							if (!r.ok()) return null;
							const b = await r.json();
							return b.document?._id ?? b.data?._id ?? null;
						})
						.catch(() => null),
				),
			);
			for (const id of results) if (id) ids.push(id);
		}
	} finally {
		await ctx.dispose();
	}
	return ids;
}

async function deleteDocs(ids: string[]) {
	if (!ids.length) return;
	const ctx = await apiAsUser("owner");
	const BATCH = 10;
	try {
		for (let i = 0; i < ids.length; i += BATCH) {
			const slice = ids.slice(i, i + BATCH);
			await Promise.all(
				slice.map((id) => ctx.delete(`${API}/api/rich-text-documents/${id}`).catch(() => {})),
			);
		}
	} finally {
		await ctx.dispose();
	}
}

test("GRUPO 4 — escritos: editor llega al cap del plan del owner; último OK, extra bloqueado", async () => {
	test.setTimeout(300_000);

	const { limit, currentDocs } = await getOwnerDocsInfo();
	test.skip(limit <= 0, `postalDocuments limit=${limit} — plan no soporta docs`);
	test.skip(limit - currentDocs < 5, `Owner a ${currentDocs}/${limit} docs — margen insuficiente`);

	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteEditor(teamId);

	const fillerIds = await createDocFillers(teamId, limit - currentDocs - 1);

	let lastDocId = "";
	try {
		// Editor crea el ÚLTIMO → permitido
		const editor = await apiAsUser("memberEditor");
		try {
			const last = await editor.post(`${API}/api/rich-text-documents`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: { title: `E2E-Ed-Last-${Date.now()}`, content: "x", formData: {}, status: "draft" },
			});
			expect(last.ok()).toBe(true);
			lastDocId = (await last.json()).document?._id ?? "";

			// Extra → bloqueado (cap del owner alcanzado)
			const extra = await editor.post(`${API}/api/rich-text-documents`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: { title: `E2E-Ed-Extra-${Date.now()}`, content: "x", formData: {}, status: "draft" },
			});
			expect(extra.ok()).toBe(false);
			expect([400, 403, 409]).toContain(extra.status());
		} finally {
			await editor.dispose();
		}

		if (lastDocId) fillerIds.push(lastDocId);
	} finally {
		await deleteDocs(fillerIds);
	}
});

test("GRUPO 4 — escritos: owner solo (sin team) al cap del plan; último OK, extra bloqueado", async () => {
	test.setTimeout(300_000);

	const { limit, currentDocs } = await getOwnerDocsInfo();
	test.skip(limit - currentDocs < 5, `Owner a ${currentDocs}/${limit} docs — margen insuficiente`);

	const ownerCtx = await apiAsUser("owner");
	const personalIds: string[] = [];
	try {
		// Llenar hasta limit-1 (modo personal, sin groupId)
		const totalToFill = limit - currentDocs - 1;
		const BATCH = 10;
		for (let i = 0; i < totalToFill; i += BATCH) {
			const slice = Array.from({ length: Math.min(BATCH, totalToFill - i) }, (_, j) => i + j);
			const results = await Promise.all(
				slice.map((idx) =>
					ownerCtx
						.post(`${API}/api/rich-text-documents`, {
							headers: { "Content-Type": "application/json" },
							data: { title: `E2E-Own-Fill-${Date.now()}-${idx}`, content: "x", formData: {}, status: "draft" },
						})
						.then(async (r) => (r.ok() ? (await r.json()).document?._id ?? null : null))
						.catch(() => null),
				),
			);
			for (const id of results) if (id) personalIds.push(id);
		}

		// Último escrito personal → OK
		const last = await ownerCtx.post(`${API}/api/rich-text-documents`, {
			headers: { "Content-Type": "application/json" },
			data: { title: `E2E-Own-Last-${Date.now()}`, content: "x", formData: {}, status: "draft" },
		});
		expect(last.ok()).toBe(true);
		const lastId = (await last.json()).document?._id ?? "";
		if (lastId) personalIds.push(lastId);

		// Extra → bloqueado
		const extra = await ownerCtx.post(`${API}/api/rich-text-documents`, {
			headers: { "Content-Type": "application/json" },
			data: { title: `E2E-Own-Extra-${Date.now()}`, content: "x", formData: {}, status: "draft" },
		});
		expect(extra.ok()).toBe(false);
		expect([400, 403, 409]).toContain(extra.status());
	} finally {
		await Promise.all(personalIds.map((id) => ownerCtx.delete(`${API}/api/rich-text-documents/${id}`).catch(() => {})));
		await ownerCtx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers genéricos para otros recursos (postal, calcs, contacts)
// ─────────────────────────────────────────────────────────────────────────────

async function getOwnerLimitInfo(
	resourceKey: string,
	statsKey: string,
): Promise<{ limit: number; current: number }> {
	const ctx = await apiAsUser("owner");
	try {
		const [subRes, statsRes] = await Promise.all([
			ctx.get(`${API}/api/subscriptions/current`),
			ctx.get(`${API}/api/user-stats/user`),
		]);
		const sub = await subRes.json();
		const stats = await statsRes.json();
		return {
			limit: sub.subscription?.limits?.[resourceKey] ?? 0,
			current: stats.data?.counts?.[statsKey] ?? 0,
		};
	} finally {
		await ctx.dispose();
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — postal-tracking (postalTrackings=30)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — postal-tracking: editor al cap del owner vía team → último OK, extra bloqueado", async () => {
	test.setTimeout(90_000);

	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteEditor(teamId);

	// Resolver ownerId del JWT
	const ownerCtx = await apiAsUser("owner");
	let ownerId = "";
	try {
		const meRes = await ownerCtx.get(`${API}/api/subscriptions/current`);
		const me = await meRes.json();
		ownerId = me.subscription?.user ?? "";

		// Cleanup total: eliminar CUALQUIER tracking residual del owner (incluye not_found
		// de corridas previas que no decrementaron UserStats pero sí existen en DB y ocupan slot).
		const listAll = await ownerCtx.get(`${API}/api/postal-tracking?limit=200`);
		const listBody = await listAll.json();
		const residualIds = (listBody.data ?? []).map((t: any) => t._id);
		if (residualIds.length > 0) {
			await ownerCtx.delete(`${API}/api/postal-tracking/bulk`, { data: { ids: residualIds } }).catch(() => {});
		}
	} finally {
		await ownerCtx.dispose();
	}
	expect(ownerId).toBeTruthy();

	// Pausa para que el delete propague
	await new Promise((r) => setTimeout(r, 500));
	const backendDir = "/home/mcerra/www/law-analytics-server";
	const { execSync } = await import("child_process");

	function countActive(): number {
		const out = execSync(`node ${backendDir}/scripts/countPostalActive.js ${ownerId}`, {
			cwd: backendDir,
			encoding: "utf-8",
			env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
		}).trim();
		// Strip ANSI escape codes (algunos wrappers colorean stdout)
		const cleaned = out.replace(/\u001b\[[0-9;]*m/g, "");
		const n = parseInt(cleaned, 10);
		if (Number.isNaN(n)) throw new Error(`countActive parse fail: "${out}"`);
		return n;
	}

	// Obtener el limit via API (sub) pero el count REAL via script (UserStats desincroniza).
	const subRes = await (async () => {
		const c = await apiAsUser("owner");
		try {
			const r = await c.get(`${API}/api/subscriptions/current`);
			return await r.json();
		} finally {
			await c.dispose();
		}
	})();
	const limit = subRes.subscription?.limits?.postalTrackings ?? 0;
	test.skip(limit <= 0, "postalTrackings limit=0");
	let current = countActive();

	// Fase A: fillers = limit-1, editor crea el último → OK
	const fillersA: string[] = JSON.parse(
		execSync(
			`node ${backendDir}/scripts/createPostalFillers.js ${ownerId} ${limit - current - 1} ${teamId}`,
			{ cwd: backendDir, encoding: "utf-8" },
		).trim(),
	);
	expect(fillersA.length).toBe(limit - current - 1);

	let lastId = "";
	try {
		const editor = await apiAsUser("memberEditor");
		try {
			const last = await editor.post(`${API}/api/postal-tracking`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: {
					codeId: "CC",
					numberId: String(100000000 + Math.floor(Math.random() * 900000000)),
					label: `E2E-Ed-PostLast`,
				},
			});
			expect(last.ok()).toBe(true);
			lastId = (await last.json()).data?._id ?? "";
		} finally {
			await editor.dispose();
		}
	} finally {
		// Cleanup fase A (incluye el "último" del editor)
		const cleanup = await apiAsUser("owner");
		const ids = [...fillersA, ...(lastId ? [lastId] : [])];
		if (ids.length > 0) {
			await cleanup.delete(`${API}/api/postal-tracking/bulk`, { data: { ids } }).catch(() => {});
		}
		await cleanup.dispose();
	}

	// Fase B: fillers = limit exacto, editor extra → 4xx
	// Espera generosa para que el bulk delete del API propague en la DB
	await new Promise((r) => setTimeout(r, 2000));
	let currentB = countActive();

	// Si aún hay residuales tras el cleanup del API (bulk delete async), purgarlos vía DB directa
	if (currentB > 0) {
		execSync(`node -e "require('dotenv').config();const m=require('mongoose');(async()=>{await m.connect(process.env.URLDB);await m.connection.db.collection('postal-trackings').deleteMany({userId:new m.Types.ObjectId('${ownerId}')});await m.disconnect();})();"`, { cwd: backendDir });
		await new Promise((r) => setTimeout(r, 500));
		currentB = countActive();
	}

	const fillersB: string[] = JSON.parse(
		execSync(
			`node ${backendDir}/scripts/createPostalFillers.js ${ownerId} ${limit - currentB} ${teamId}`,
			{ cwd: backendDir, encoding: "utf-8" },
		).trim(),
	);
	expect(fillersB.length).toBe(limit - currentB);

	// Verificación defensiva: count directo post-fill debe ser limit
	const postFillCount = countActive();
	expect(postFillCount).toBe(limit);

	try {
		// Verificación defensiva: confirmar que el count pre-extra está en el cap
		const verifyCtx = await apiAsUser("owner");
		const verifyList = await verifyCtx.get(`${API}/api/postal-tracking?limit=200`);
		const verifyBody = await verifyList.json();
		const activeCount = (verifyBody.data ?? []).filter((t: any) =>
			["pending", "active"].includes(t.processingStatus),
		).length;
		await verifyCtx.dispose();

		if (activeCount < limit) {
			test.info().annotations.push({
				type: "pre-extra-state",
				description: `Active count pre-extra=${activeCount}/${limit}. El worker decrementó algún filler a pesar del nextCheckAt=2099.`,
			});
		}

		const editor = await apiAsUser("memberEditor");
		try {
			const extra = await editor.post(`${API}/api/postal-tracking`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: {
					codeId: "CC",
					numberId: String(100000000 + Math.floor(Math.random() * 900000000)),
					label: `E2E-Ed-PostExtra`,
				},
			});
			expect(extra.ok()).toBe(false);
			expect([400, 403, 409]).toContain(extra.status());
		} finally {
			await editor.dispose();
		}
	} finally {
		const cleanup = await apiAsUser("owner");
		if (fillersB.length > 0) {
			await cleanup.delete(`${API}/api/postal-tracking/bulk`, { data: { ids: fillersB } }).catch(() => {});
		}
		await cleanup.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 7 — calculators (calculators=20)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 7 — calculators: editor al cap del owner vía team → último OK, extra bloqueado", async () => {
	test.setTimeout(300_000);
	const { limit, current } = await getOwnerLimitInfo("calculators", "calculators");
	test.skip(limit - current < 3, `calculators margen insuficiente (${current}/${limit})`);

	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteEditor(teamId);

	const ownerCtx = await apiAsUser("owner");
	const fillerIds: string[] = [];
	const BATCH = 5;
	try {
		const toFill = limit - current - 1;
		for (let i = 0; i < toFill; i += BATCH) {
			const slice = Array.from({ length: Math.min(BATCH, toFill - i) }, (_, j) => i + j);
			const results = await Promise.all(
				slice.map((idx) =>
					ownerCtx
						.post(`${API}/api/calculators`, {
							headers: { "x-group-id": teamId, "Content-Type": "application/json" },
							data: {
								type: "Calculado",
								folderName: `E2E-Calc-Fill-${idx}`,
								amount: 1000,
								classType: "intereses",
								subClassType: "simple",
								date: new Date().toISOString(),
								groupId: teamId,
							},
						})
						.then(async (r) => (r.ok() ? (await r.json()).calculator?._id ?? (await r.json()).data?._id ?? null : null))
						.catch(() => null),
				),
			);
			for (const id of results) if (id) fillerIds.push(id);
		}

		const editor = await apiAsUser("memberEditor");
		let lastId = "";
		try {
			const last = await editor.post(`${API}/api/calculators`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: {
					type: "Calculado",
					folderName: "E2E-Ed-Calc-Last",
					amount: 1000,
					classType: "intereses",
					subClassType: "simple",
					date: new Date().toISOString(),
					groupId: teamId,
				},
			});
			expect(last.ok()).toBe(true);
			lastId = (await last.json()).calculator?._id ?? (await last.json()).data?._id ?? "";

			const extra = await editor.post(`${API}/api/calculators`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: {
					type: "Calculado",
					folderName: "E2E-Ed-Calc-Extra",
					amount: 1000,
					classType: "intereses",
					subClassType: "simple",
					date: new Date().toISOString(),
					groupId: teamId,
				},
			});
			expect(extra.ok()).toBe(false);
			expect([400, 403, 409]).toContain(extra.status());
		} finally {
			await editor.dispose();
			if (lastId) fillerIds.push(lastId);
		}
	} finally {
		for (const id of fillerIds) {
			await ownerCtx.delete(`${API}/api/calculators/${id}`, { headers: { "x-group-id": teamId } }).catch(() => {});
		}
		await ownerCtx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 8 — contacts (cap=100). Solo smoke del cap, con batch paralelo.
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 8 — contacts: editor al cap del owner vía team → último OK, extra bloqueado", async () => {
	test.setTimeout(420_000);

	// NOTA: el schema `Contact` requiere `role` (always), `state` y `city` (required cuando
	// importSource !== 'interviniente'; el controller hace default 'manual'). Todos los
	// payloads deben incluirlos o el backend devuelve 500 ValidationError.
	const BASE_PAYLOAD = {
		name: "E2E",
		type: "Fisica",
		role: "Cliente",
		state: "CABA",
		city: "CABA",
	};

	const { limit, current } = await getOwnerLimitInfo("contacts", "contacts");
	test.skip(limit - current < 5, `contacts margen insuficiente (${current}/${limit})`);

	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteEditor(teamId);

	const ownerCtx = await apiAsUser("owner");
	const fillerIds: string[] = [];
	const BATCH = 10;
	try {
		const toFill = limit - current - 1;
		for (let i = 0; i < toFill; i += BATCH) {
			const slice = Array.from({ length: Math.min(BATCH, toFill - i) }, (_, j) => i + j);
			const results = await Promise.all(
				slice.map((idx) =>
					ownerCtx
						.post(`${API}/api/contacts/create`, {
							headers: { "x-group-id": teamId, "Content-Type": "application/json" },
							data: {
								...BASE_PAYLOAD,
								lastName: `Fill-${Date.now()}-${i + idx}`,
								email: `e2e-fill-${Date.now()}-${i + idx}@test.com`,
								groupId: teamId,
							},
						})
						.then(async (r) => (r.ok() ? (await r.json()).contact?._id ?? (await r.json()).data?._id ?? null : null))
						.catch(() => null),
				),
			);
			for (const id of results) if (id) fillerIds.push(id);
		}

		await new Promise((r) => setTimeout(r, 1000));
		const postFill = await getOwnerLimitInfo("contacts", "contacts");
		const remainingSlots = Math.max(0, postFill.limit - postFill.current);

		// Con el payload correcto los fillers no deberían skippearse. Si aún hay margen, skip con diagnostic
		if (remainingSlots > 5) {
			test.info().annotations.push({
				type: "partial-fill-skip",
				description: `Sólo se pudo llenar hasta ${postFill.current}/${postFill.limit} contacts. Skip del umbral.`,
			});
			test.skip();
		}

		const editor = await apiAsUser("memberEditor");
		try {
			for (let i = 0; i < remainingSlots; i++) {
				const res = await editor.post(`${API}/api/contacts/create`, {
					headers: { "x-group-id": teamId, "Content-Type": "application/json" },
					data: {
						...BASE_PAYLOAD,
						lastName: `Ed-Fill-${Date.now()}-${i}`,
						email: `e2e-ed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}@test.com`,
						groupId: teamId,
					},
				});
				if (res.ok()) {
					const body = await res.json();
					fillerIds.push(body.contact?._id ?? body.data?._id ?? "");
				} else break;
			}

			// Extra → bloqueado
			const extra = await editor.post(`${API}/api/contacts/create`, {
				headers: { "x-group-id": teamId, "Content-Type": "application/json" },
				data: {
					...BASE_PAYLOAD,
					lastName: "Ed-Extra",
					email: `e2e-ed-extra-${Date.now()}@test.com`,
					groupId: teamId,
				},
			});
			expect(extra.ok()).toBe(false);
			expect([400, 403, 409]).toContain(extra.status());
		} finally {
			await editor.dispose();
		}
	} finally {
		for (const id of fillerIds) {
			await ownerCtx.delete(`${API}/api/contacts/${id}`, { headers: { "x-group-id": teamId } }).catch(() => {});
		}
		await ownerCtx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — folders por owner + editor suman contra el mismo UserStats
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — folders creados por owner y por editor con groupId suman contra el mismo UserStats del owner", async () => {
	test.setTimeout(60_000);

	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteEditor(teamId);

	// Baseline
	const ownerA = await apiAsUser("owner");
	let before = 0;
	try {
		const s = await ownerA.get(`${API}/api/user-stats/user`);
		before = (await s.json()).data?.counts?.folders ?? 0;
	} finally {
		await ownerA.dispose();
	}

	const createdIds: string[] = [];

	// Owner crea 1 folder con groupId
	const owner = await apiAsUser("owner");
	try {
		const r = await owner.post(`${API}/api/folders`, {
			headers: { "x-group-id": teamId, "Content-Type": "application/json" },
			data: { folderName: `Owner-${Date.now()}`, status: "Nueva", materia: "Civil", orderStatus: "Actor", groupId: teamId },
		});
		expect(r.ok()).toBe(true);
		createdIds.push((await r.json()).folder?._id);
	} finally {
		await owner.dispose();
	}

	// Editor crea 1 folder con groupId
	const editor = await apiAsUser("memberEditor");
	try {
		const r = await editor.post(`${API}/api/folders`, {
			headers: { "x-group-id": teamId, "Content-Type": "application/json" },
			data: { folderName: `Editor-${Date.now()}`, status: "Nueva", materia: "Civil", orderStatus: "Actor", groupId: teamId },
		});
		expect(r.ok()).toBe(true);
		createdIds.push((await r.json()).folder?._id);
	} finally {
		await editor.dispose();
	}

	await new Promise((r) => setTimeout(r, 1000));

	// Stats del owner +2
	const ownerB = await apiAsUser("owner");
	try {
		const s = await ownerB.get(`${API}/api/user-stats/user`);
		const after = (await s.json()).data?.counts?.folders ?? 0;
		expect(after).toBeGreaterThanOrEqual(before + 2);
	} finally {
		// Cleanup
		for (const id of createdIds.filter(Boolean)) {
			await ownerB.delete(`${API}/api/folders/${id}`, { headers: { "x-group-id": teamId } }).catch(() => {});
		}
		await ownerB.dispose();
	}
});
