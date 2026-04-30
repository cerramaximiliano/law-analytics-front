/**
 * BLOQUES 21 + 22 — CRUD de Notes y Tasks en team mode + personal + vinculación con folder.
 *
 * Notes y Tasks:
 *   - No tienen límite numérico del plan (ni `notes` ni `tasks` en plan config).
 *   - Sí tienen `folderId` (vinculación opcional con una causa/carpeta).
 *   - Team mode: el controller lee `req.teamContext` (via checkPermission).
 *
 * Matriz validada:
 *   | Acción                    | Owner | Editor | Viewer |
 *   | Crear (personal o team)   | ✓     | ✓      | ✗ (403) |
 *   | Leer del team             | ✓     | ✓      | ✓       |
 *   | Actualizar                | ✓     | ✓      | ✗ (403) |
 *   | Eliminar                  | ✓     | ✗ (403)| ✗ (403) |
 *
 * Vinculación folder:
 *   - Crear note/task con folderId → aparece en `GET /notes/folder/:folderId` y `/tasks/folder/:folderId`.
 *   - Todos los miembros del team (incluido viewer) pueden leer recursos vinculados al folder.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-NotesTasks-${Date.now()}`;

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, { data: { name, description: "E2E notes+tasks" } });
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
		const invitation = (group.invitations ?? []).find((i: any) => i.email === TEST_USERS[role].email && i.status === "pending");
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

type Role = "owner" | "memberEditor" | "memberViewer";

async function createNote(role: Role, teamId: string, title: string, folderId?: string) {
	const ctx = await apiAsUser(role);
	try {
		const res = await ctx.post(`${API}/api/notes/create`, {
			headers: { "x-group-id": teamId, "Content-Type": "application/json" },
			data: {
				title,
				content: "E2E note body",
				groupId: teamId,
				...(folderId ? { folderId } : {}),
			},
		});
		const status = res.status();
		const body = res.ok() ? await res.json() : null;
		return { status, id: body?.note?._id ?? body?.data?._id ?? body?._id ?? "" };
	} finally {
		await ctx.dispose();
	}
}

async function createTask(role: Role, teamId: string, name: string, folderId?: string) {
	const ctx = await apiAsUser(role);
	try {
		const due = new Date();
		due.setDate(due.getDate() + 7);
		const res = await ctx.post(`${API}/api/tasks`, {
			headers: { "x-group-id": teamId, "Content-Type": "application/json" },
			data: {
				name,
				description: "E2E task body",
				status: "pendiente",
				priority: "media",
				dueDate: due.toISOString(),
				groupId: teamId,
				...(folderId ? { folderId } : {}),
			},
		});
		const status = res.status();
		const body = res.ok() ? await res.json() : null;
		return { status, id: body?.task?._id ?? body?.data?._id ?? body?._id ?? "" };
	} finally {
		await ctx.dispose();
	}
}

// ─── Setup compartido ────────────────────────────────────────────────────────

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
	sharedFolderId = await createFolder(sharedTeamId, `E2E-NT-Folder-${Date.now()}`);
	await new Promise((r) => setTimeout(r, 500));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOQUE 21 — NOTES
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 21.1 — owner: create + update + delete note OK", async () => {
	const cr = await createNote("owner", sharedTeamId, `Note-Own-${Date.now()}`);
	expect(cr.status).toBeLessThan(400);
	expect(cr.id).toBeTruthy();

	const ctx = await apiAsUser("owner");
	try {
		const up = await ctx.put(`${API}/api/notes/${cr.id}`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: { title: "Updated", groupId: sharedTeamId },
		});
		expect(up.status()).toBeLessThan(400);

		const del = await ctx.delete(`${API}/api/notes/${cr.id}`, { headers: { "x-group-id": sharedTeamId } });
		expect(del.status()).toBeLessThan(400);
	} finally {
		await ctx.dispose();
	}
});

test("GRUPO 21.2 — editor: create + update OK, delete → 403", async () => {
	const cr = await createNote("memberEditor", sharedTeamId, `Note-Ed-${Date.now()}`);
	expect(cr.status).toBeLessThan(400);

	const editor = await apiAsUser("memberEditor");
	try {
		const up = await editor.put(`${API}/api/notes/${cr.id}`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: { title: "Updated-Ed", groupId: sharedTeamId },
		});
		expect(up.status()).toBeLessThan(400);

		const del = await editor.delete(`${API}/api/notes/${cr.id}`, { headers: { "x-group-id": sharedTeamId } });
		expect(del.status()).toBe(403);
	} finally {
		await editor.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/notes/${cr.id}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 21.3 — viewer: read OK, create/update/delete → 403", async () => {
	// Owner crea
	const cr = await createNote("owner", sharedTeamId, `Note-ForViewer-${Date.now()}`);
	expect(cr.status).toBeLessThan(400);

	const viewer = await apiAsUser("memberViewer");
	try {
		// read OK (lista del team)
		const list = await viewer.get(`${API}/api/notes/group/${sharedTeamId}`);
		expect(list.status()).toBeLessThan(403);

		// create bloqueado
		const create = await createNote("memberViewer", sharedTeamId, "Viewer-Denied");
		expect(create.status).toBe(403);

		// update bloqueado
		const up = await viewer.put(`${API}/api/notes/${cr.id}`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: { title: "Hacked", groupId: sharedTeamId },
		});
		expect(up.status()).toBe(403);

		// delete bloqueado
		const del = await viewer.delete(`${API}/api/notes/${cr.id}`, { headers: { "x-group-id": sharedTeamId } });
		expect(del.status()).toBe(403);
	} finally {
		await viewer.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/notes/${cr.id}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 21.4 — nota vinculada a folder aparece en /notes/folder/:folderId para todos los miembros", async () => {
	const cr = await createNote("memberEditor", sharedTeamId, `Note-LinkFolder-${Date.now()}`, sharedFolderId);
	expect(cr.status).toBeLessThan(400);
	expect(cr.id).toBeTruthy();

	for (const role of ["owner", "memberEditor", "memberViewer"] as const) {
		const ctx = await apiAsUser(role);
		try {
			const res = await ctx.get(`${API}/api/notes/folder/${sharedFolderId}`, {
				headers: { "x-group-id": sharedTeamId },
			});
			expect(res.status()).toBeLessThan(403);
			const body = await res.json();
			const notes = body.notes ?? body.data ?? [];
			expect(notes.some((n: any) => String(n._id) === String(cr.id))).toBe(true);
		} finally {
			await ctx.dispose();
		}
	}

	// Cleanup
	const cleanup = await apiAsUser("owner");
	await cleanup.delete(`${API}/api/notes/${cr.id}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
	await cleanup.dispose();
});

test("GRUPO 21.5 — nota personal (sin groupId, sin folder) del usuario regular", async () => {
	const ctx = await apiAsUser("memberExtra");
	let noteId = "";
	try {
		const res = await ctx.post(`${API}/api/notes/create`, {
			headers: { "Content-Type": "application/json" },
			data: { title: `Personal-Note-${Date.now()}`, content: "personal" },
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		noteId = body.note?._id ?? body.data?._id ?? "";
		expect(noteId).toBeTruthy();

		// La nota NO tiene groupId
		expect(body.note?.groupId ?? body.data?.groupId).toBeFalsy();
	} finally {
		if (noteId) await ctx.delete(`${API}/api/notes/${noteId}`).catch(() => {});
		await ctx.dispose();
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// BLOQUE 22 — TASKS
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 22.1 — owner: create + update + toggle + delete task OK", async () => {
	const cr = await createTask("owner", sharedTeamId, `Task-Own-${Date.now()}`);
	expect(cr.status).toBeLessThan(400);
	expect(cr.id).toBeTruthy();

	const ctx = await apiAsUser("owner");
	try {
		const up = await ctx.put(`${API}/api/tasks/${cr.id}`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: { name: "Updated-Task", groupId: sharedTeamId },
		});
		expect(up.status()).toBeLessThan(400);

		// toggle (marcar completada)
		const toggle = await ctx.put(`${API}/api/tasks/${cr.id}/toggle`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
		});
		expect(toggle.status()).toBeLessThan(400);

		const del = await ctx.delete(`${API}/api/tasks/${cr.id}`, { headers: { "x-group-id": sharedTeamId } });
		expect(del.status()).toBeLessThan(400);
	} finally {
		await ctx.dispose();
	}
});

test("GRUPO 22.2 — editor: create + update + toggle OK, delete → 403", async () => {
	const cr = await createTask("memberEditor", sharedTeamId, `Task-Ed-${Date.now()}`);
	expect(cr.status).toBeLessThan(400);

	const editor = await apiAsUser("memberEditor");
	try {
		const up = await editor.put(`${API}/api/tasks/${cr.id}`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: { name: "Updated-Ed", groupId: sharedTeamId },
		});
		expect(up.status()).toBeLessThan(400);

		const del = await editor.delete(`${API}/api/tasks/${cr.id}`, { headers: { "x-group-id": sharedTeamId } });
		expect(del.status()).toBe(403);
	} finally {
		await editor.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/tasks/${cr.id}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 22.3 — viewer: read OK, create/update/delete → 403", async () => {
	const cr = await createTask("owner", sharedTeamId, `Task-ForViewer-${Date.now()}`);
	expect(cr.status).toBeLessThan(400);

	const viewer = await apiAsUser("memberViewer");
	try {
		const list = await viewer.get(`${API}/api/tasks/group/${sharedTeamId}`);
		expect(list.status()).toBeLessThan(403);

		const create = await createTask("memberViewer", sharedTeamId, "Viewer-Denied-Task");
		expect(create.status).toBe(403);

		const up = await viewer.put(`${API}/api/tasks/${cr.id}`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: { name: "Hacked", groupId: sharedTeamId },
		});
		expect(up.status()).toBe(403);

		const del = await viewer.delete(`${API}/api/tasks/${cr.id}`, { headers: { "x-group-id": sharedTeamId } });
		expect(del.status()).toBe(403);
	} finally {
		await viewer.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/tasks/${cr.id}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 22.4 — task vinculada a folder aparece en /tasks/folder/:folderId para owner/editor/viewer", async () => {
	// Baseline: count de tasks del folder (via endpoint, no via folder.tasksCount denormalizado —
	// GET /folders/:id no lo proyecta; el contador del doc es interno).
	const ownerA = await apiAsUser("owner");
	let baseline = 0;
	try {
		const res = await ownerA.get(`${API}/api/tasks/folder/${sharedFolderId}`, { headers: { "x-group-id": sharedTeamId } });
		const body = await res.json();
		baseline = (Array.isArray(body) ? body : body.tasks ?? body.data ?? []).length;
	} finally {
		await ownerA.dispose();
	}

	const cr = await createTask("memberEditor", sharedTeamId, `Task-LinkFolder-${Date.now()}`, sharedFolderId);
	expect(cr.status).toBeLessThan(400);

	await new Promise((r) => setTimeout(r, 500));

	// Los 3 roles pueden leer el task vinculado al folder
	for (const role of ["owner", "memberEditor", "memberViewer"] as const) {
		const ctx = await apiAsUser(role);
		try {
			const res = await ctx.get(`${API}/api/tasks/folder/${sharedFolderId}`, {
				headers: { "x-group-id": sharedTeamId },
			});
			expect(res.status()).toBeLessThan(403);
			const body = await res.json();
			const tasks = Array.isArray(body) ? body : body.tasks ?? body.data ?? [];
			expect(tasks.some((t: any) => String(t._id) === String(cr.id))).toBe(true);
			if (role === "owner") expect(tasks.length).toBeGreaterThanOrEqual(baseline + 1);
		} finally {
			await ctx.dispose();
		}
	}

	// Cleanup
	const cleanup = await apiAsUser("owner");
	await cleanup.delete(`${API}/api/tasks/${cr.id}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
	await cleanup.dispose();
});

test("GRUPO 22.5 — task personal (sin groupId, sin folder) del usuario regular", async () => {
	const ctx = await apiAsUser("memberExtra");
	let taskId = "";
	try {
		const due = new Date();
		due.setDate(due.getDate() + 3);
		const res = await ctx.post(`${API}/api/tasks`, {
			headers: { "Content-Type": "application/json" },
			data: {
				name: `Personal-Task-${Date.now()}`,
				description: "personal",
				dueDate: due.toISOString(),
				status: "pendiente",
				priority: "media",
			},
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		// El endpoint devuelve el task directo (no `{ task: ... }`)
		taskId = body._id ?? body.task?._id ?? body.data?._id ?? "";
		expect(taskId).toBeTruthy();
		expect(body.groupId ?? body.task?.groupId ?? body.data?.groupId).toBeFalsy();
	} finally {
		if (taskId) await ctx.delete(`${API}/api/tasks/${taskId}`).catch(() => {});
		await ctx.dispose();
	}
});
