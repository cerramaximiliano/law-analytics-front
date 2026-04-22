/**
 * BLOQUE 23 — Vinculaciones de recursos con folder en team mode.
 *
 * Recursos con vinculación a folder:
 *   - contacts         → array `folderIds[]` (endpoints: POST /:id/link-folders, DELETE /:id/folders/:folderId)
 *   - calculators      → campo `folderId` (GET /calculators/folder/:folderId)
 *   - events           → campo `folderId` (GET /events/folder/:folderId) — ya cubierto en BLOQUE 19
 *   - rich-text-docs   → campo `linkedFolderId` (GET /rich-text-documents?folderId=X)
 *
 * Matriz validada:
 *   - Owner y Editor pueden crear/vincular.
 *   - Viewer NO puede vincular (403 o create 403).
 *   - Todos los miembros del team PUEDEN VER las vinculaciones existentes.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-Links-${Date.now()}`;

test.describe.configure({ retries: 2 });

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, { data: { name, description: "E2E links" } });
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? "";
	} finally {
		await ctx.dispose();
	}
}

async function inviteAndAccept(teamId: string, role: "memberEditor" | "memberViewer", assigned: "editor" | "viewer") {
	const owner = await apiAsUser("owner");
	try {
		await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS[role].email, role: assigned }] },
		});
		const teamRes = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await teamRes.json()).group ?? {};
		const invitation = (group.invitations ?? []).find(
			(i: any) => i.email === TEST_USERS[role].email && i.status === "pending",
		);
		const invitee = await apiAsUser(role);
		try {
			const acc = await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, {
				data: { skipResourceCheck: true },
			});
			if (!acc.ok()) {
				const b = await acc.json();
				if (b.code === "USER_HAS_RESOURCES") {
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

async function createFolder(teamId: string, name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/folders`, {
			headers: { "x-group-id": teamId, "Content-Type": "application/json" },
			data: { folderName: name, status: "Nueva", materia: "Civil", orderStatus: "Actor", groupId: teamId },
		});
		const body = await res.json();
		return body.folder?._id ?? body.data?._id ?? "";
	} finally {
		await ctx.dispose();
	}
}

let sharedTeamId: string;
let sharedFolderId: string;

test.beforeAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
	await new Promise((r) => setTimeout(r, 700));

	sharedTeamId = await createTeamAsOwner(makeTeamName());
	await inviteAndAccept(sharedTeamId, "memberEditor", "editor");
	await inviteAndAccept(sharedTeamId, "memberViewer", "viewer");
	sharedFolderId = await createFolder(sharedTeamId, `E2E-Links-Folder-${Date.now()}`);
	expect(sharedFolderId).toBeTruthy();
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOQUE 23.1 — Contacts: link/unlink folder
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 23.1 — editor crea contact con folderIds → todos miembros lo ven en el array", async () => {
	const editor = await apiAsUser("memberEditor");
	let contactId = "";
	try {
		const res = await editor.post(`${API}/api/contacts/create`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				name: "E2E",
				lastName: `LinkFolder-${Date.now()}`,
				email: `e2e-link-${Date.now()}@test.com`,
				type: "Fisica",
				role: "Cliente",
				state: "CABA",
				city: "CABA",
				folderIds: [sharedFolderId],
				groupId: sharedTeamId,
			},
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		contactId = body.contact?._id ?? body.data?._id ?? "";
		expect(contactId).toBeTruthy();

		// Los 3 roles leen el contact y ven folderIds
		for (const role of ["owner", "memberEditor", "memberViewer"] as const) {
			const ctx = await apiAsUser(role);
			try {
				const list = await ctx.get(`${API}/api/contacts/group/${sharedTeamId}`);
				expect(list.ok()).toBe(true);
				const lb = await list.json();
				const contacts = lb.contacts ?? lb.data ?? [];
				const found = contacts.find((c: any) => String(c._id) === String(contactId));
				expect(found).toBeTruthy();
				const folderIds = (found?.folderIds ?? []).map((x: any) => String(x));
				expect(folderIds).toContain(String(sharedFolderId));
			} finally {
				await ctx.dispose();
			}
		}
	} finally {
		await editor.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/contacts/${contactId}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 23.1 — editor link/unlink folder a un contact existente (POST /:id/link-folders)", async () => {
	// Owner crea contact sin folder
	const owner = await apiAsUser("owner");
	let contactId = "";
	try {
		const r = await owner.post(`${API}/api/contacts/create`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				name: "E2E",
				lastName: `ToLink-${Date.now()}`,
				email: `to-link-${Date.now()}@test.com`,
				type: "Fisica",
				role: "Cliente",
				state: "CABA",
				city: "CABA",
				groupId: sharedTeamId,
			},
		});
		expect(r.ok()).toBe(true);
		contactId = (await r.json()).contact?._id ?? "";
	} finally {
		await owner.dispose();
	}

	const editor = await apiAsUser("memberEditor");
	try {
		// Link
		const linkRes = await editor.post(`${API}/api/contacts/${contactId}/link-folders`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: { folderIds: [sharedFolderId] },
		});
		expect(linkRes.status()).toBeLessThan(400);

		// Verificar link
		const list = await editor.get(`${API}/api/contacts/group/${sharedTeamId}`);
		const contacts = (await list.json()).contacts ?? (await list.clone().json()).data ?? [];
		const found = contacts.find((c: any) => String(c._id) === String(contactId));
		expect((found?.folderIds ?? []).map((x: any) => String(x))).toContain(String(sharedFolderId));

		// Unlink
		const unlinkRes = await editor.delete(`${API}/api/contacts/${contactId}/folders/${sharedFolderId}`, {
			headers: { "x-group-id": sharedTeamId },
		});
		expect(unlinkRes.status()).toBeLessThan(400);
	} finally {
		await editor.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/contacts/${contactId}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 23.1 — viewer intenta link folder a contact → 403", async () => {
	const owner = await apiAsUser("owner");
	let contactId = "";
	try {
		const r = await owner.post(`${API}/api/contacts/create`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				name: "E2E",
				lastName: `NoLinkByViewer-${Date.now()}`,
				email: `nolink-${Date.now()}@test.com`,
				type: "Fisica",
				role: "Cliente",
				state: "CABA",
				city: "CABA",
				groupId: sharedTeamId,
			},
		});
		contactId = (await r.json()).contact?._id ?? "";
	} finally {
		await owner.dispose();
	}

	const viewer = await apiAsUser("memberViewer");
	try {
		const res = await viewer.post(`${API}/api/contacts/${contactId}/link-folders`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: { folderIds: [sharedFolderId] },
		});
		expect(res.status()).toBe(403);
	} finally {
		await viewer.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/contacts/${contactId}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOQUE 23.2 — Calculators vinculados a folder
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 23.2 — editor crea calc con folderId → todos miembros lo ven en /calculators/folder/:id", async () => {
	const editor = await apiAsUser("memberEditor");
	let calcId = "";
	try {
		const res = await editor.post(`${API}/api/calculators`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				type: "Calculado",
				folderName: `Calc-Link-${Date.now()}`,
				amount: 1000,
				classType: "intereses",
				subClassType: "simple",
				date: new Date().toISOString(),
				folderId: sharedFolderId,
				groupId: sharedTeamId,
			},
		});
		expect(res.ok()).toBe(true);
		calcId = (await res.json()).calculator?._id ?? (await res.json()).data?._id ?? "";

		for (const role of ["owner", "memberEditor", "memberViewer"] as const) {
			const ctx = await apiAsUser(role);
			try {
				const r = await ctx.get(`${API}/api/calculators/folder/${sharedFolderId}`, {
					headers: { "x-group-id": sharedTeamId },
				});
				expect(r.status()).toBeLessThan(403);
				const body = await r.json();
				const calcs = Array.isArray(body) ? body : body.calculators ?? body.data ?? [];
				expect(calcs.some((c: any) => String(c._id) === String(calcId))).toBe(true);
			} finally {
				await ctx.dispose();
			}
		}
	} finally {
		await editor.dispose();
		const cleanup = await apiAsUser("owner");
		if (calcId) await cleanup.delete(`${API}/api/calculators/${calcId}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOQUE 23.3 — Events vinculados a folder (spot-check; cobertura principal en BLOQUE 19)
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 23.3 — editor crea event con folderId → todos miembros lo ven en /events/folder/:id", async () => {
	const editor = await apiAsUser("memberEditor");
	let eventId = "";
	try {
		const start = new Date();
		start.setHours(start.getHours() + 2);
		const end = new Date(start);
		end.setHours(end.getHours() + 1);
		const res = await editor.post(`${API}/api/events`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				title: `Event-Link-${Date.now()}`,
				description: "linked to folder",
				allDay: false,
				start: start.toISOString(),
				end: end.toISOString(),
				type: "audiencia",
				folderId: sharedFolderId,
				groupId: sharedTeamId,
			},
		});
		expect(res.ok()).toBe(true);
		eventId = (await res.json()).event?._id ?? "";

		for (const role of ["owner", "memberViewer"] as const) {
			const ctx = await apiAsUser(role);
			try {
				const r = await ctx.get(`${API}/api/events/folder/${sharedFolderId}`, {
					headers: { "x-group-id": sharedTeamId },
				});
				expect(r.status()).toBeLessThan(403);
				const body = await r.json();
				const events = Array.isArray(body) ? body : body.events ?? body.data ?? [];
				expect(events.some((e: any) => String(e._id) === String(eventId))).toBe(true);
			} finally {
				await ctx.dispose();
			}
		}
	} finally {
		await editor.dispose();
		const cleanup = await apiAsUser("owner");
		if (eventId) await cleanup.delete(`${API}/api/events/${eventId}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOQUE 23.4 — Rich-text documents (escritos) vinculados a folder
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 23.4 — editor crea escrito con linkedFolderId → se puede filtrar por folderId en GET", async () => {
	const editor = await apiAsUser("memberEditor");
	let docId = "";
	try {
		const res = await editor.post(`${API}/api/rich-text-documents`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				title: `Doc-Link-${Date.now()}`,
				content: "x",
				formData: {},
				status: "draft",
				linkedFolderId: sharedFolderId,
			},
		});
		expect(res.ok()).toBe(true);
		docId = (await res.json()).document?._id ?? "";
		expect(docId).toBeTruthy();

		for (const role of ["owner", "memberEditor", "memberViewer"] as const) {
			const ctx = await apiAsUser(role);
			try {
				const r = await ctx.get(`${API}/api/rich-text-documents?groupId=${sharedTeamId}&folderId=${sharedFolderId}`);
				expect(r.ok()).toBe(true);
				const body = await r.json();
				const docs = body.documents ?? body.data ?? [];
				expect(docs.some((d: any) => String(d._id) === String(docId))).toBe(true);
			} finally {
				await ctx.dispose();
			}
		}
	} finally {
		await editor.dispose();
		const cleanup = await apiAsUser("owner");
		if (docId) await cleanup.delete(`${API}/api/rich-text-documents/${docId}`).catch(() => {});
		await cleanup.dispose();
	}
});
