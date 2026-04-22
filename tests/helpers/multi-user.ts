/**
 * Helpers para tests E2E que requieren múltiples usuarios reales.
 *
 * Cada usuario tiene un archivo de `storageState` dedicado en `tests/.auth/`
 * (distinto del principal `user.json` del global-setup).
 *
 * Uso típico:
 *   test("owner invita miembro", async ({ browser }) => {
 *     const owner = await loginAs(browser, "owner");
 *     await owner.page.goto("/apps/profiles/account/role");
 *     // ... acciones como owner
 *     await owner.context.close();
 *   });
 *
 * Para coordinar flujos entre users (ej. owner invita, invitee acepta):
 *   const owner = await loginAs(browser, "owner");
 *   const invitee = await loginAs(browser, "memberAdmin");
 *   // Usamos ambos contexts en paralelo.
 */

import { request as playwrightRequest, type Browser, type BrowserContext, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:5000";
const AUTH_DIR = path.join(__dirname, "..", ".auth");

// ─── Catálogo de users de test ───────────────────────────────────────────────

export const TEST_USERS = {
	owner: {
		email: "artista@mirtaaguilar.art",
		password: "988703za",
		plan: "standard",
		description: "Owner primario de team, plan standard (max 5 miembros)",
	},
	ownerSecondary: {
		email: "juancamino713@gmail.com",
		password: "988703za",
		plan: "standard",
		description: "Owner secundario con plan pagado — usado para ALREADY_IN_TEAM y PAID_PLAN_CONFLICT",
	},
	memberAdmin: {
		email: "maximilian@rumba-dev.com",
		password: "12345678",
		plan: "free",
		description: "Miembro destinado al rol Admin (nota: rol admin no está en UI aún)",
	},
	memberEditor: {
		email: "maximiliano@rumba-dev.com",
		password: "12345678",
		plan: "free",
		description: "Miembro destinado al rol Editor",
	},
	memberViewer: {
		email: "soporte@lawanalytics.app",
		password: "12345678",
		plan: "free",
		description: "Miembro destinado al rol Viewer",
	},
	memberExtra: {
		email: "cerramaximiliano@protonmail.com",
		password: "988703za",
		plan: "free",
		description: "Miembro extra (para test de max-members alcanzado)",
	},
} as const;

export type UserRole = keyof typeof TEST_USERS;

// ─── Login helpers ───────────────────────────────────────────────────────────

/** Path del storageState para un user específico (uno por user, persiste entre tests) */
function storageStateFor(role: UserRole): string {
	return path.join(AUTH_DIR, `${role}.json`);
}

/**
 * Hace login REAL para el user indicado y guarda el storageState a disco.
 * Retorna el path del archivo para usar con `browser.newContext({ storageState })`.
 */
export async function createStorageStateFor(role: UserRole): Promise<string> {
	const user = TEST_USERS[role];
	const statePath = storageStateFor(role);

	const ctx = await playwrightRequest.newContext();
	try {
		const res = await ctx.post(`${API_BASE}/api/auth/login`, {
			data: { email: user.email, password: user.password },
			headers: { "Content-Type": "application/json" },
		});
		if (!res.ok()) throw new Error(`Login failed for ${role} (${user.email}): ${res.status()}`);
		// Extract cookies + localStorage equivalent (JWT)
		const body = await res.json();
		const token = body.token as string | undefined;
		await ctx.storageState({ path: statePath });

		// Inyectar token en localStorage del state (el global-setup hace lo mismo)
		if (token) {
			const current = JSON.parse(fs.readFileSync(statePath, "utf-8"));
			const origin = {
				origin: "http://localhost:3000",
				localStorage: [{ name: "token", value: token }],
			};
			current.origins = current.origins ?? [];
			// Reemplazar o agregar
			const existing = current.origins.findIndex((o: any) => o.origin === origin.origin);
			if (existing >= 0) current.origins[existing] = origin;
			else current.origins.push(origin);
			fs.writeFileSync(statePath, JSON.stringify(current, null, 2));
		}
	} finally {
		await ctx.dispose();
	}
	return statePath;
}

/** Bundle de session + helpers para un user logueado */
export interface UserSession {
	role: UserRole;
	email: string;
	context: BrowserContext;
	page: Page;
	/** userId extraído del JWT */
	userId: string;
	/** cookies para API calls directas (curl-like) */
	cookieHeader: string;
	/** cleanup: cierra context */
	close: () => Promise<void>;
}

/**
 * Login UI-based para un user específico. Crea un nuevo BrowserContext + Page,
 * reutiliza el storageState existente o lo genera si no existe.
 */
export async function loginAs(browser: Browser, role: UserRole): Promise<UserSession> {
	const user = TEST_USERS[role];
	let statePath = storageStateFor(role);

	if (!fs.existsSync(statePath)) {
		statePath = await createStorageStateFor(role);
	}

	const context = await browser.newContext({ storageState: statePath });
	const page = await context.newPage();

	// Extraer userId del token
	const raw = JSON.parse(fs.readFileSync(statePath, "utf-8"));
	const token = raw?.origins?.[0]?.localStorage?.find((e: any) => e.name === "token")?.value ?? "";
	let userId = "";
	try {
		const payload = JSON.parse(Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
		userId = payload.id ?? payload._id ?? payload.userId ?? "";
	} catch {}

	const cookieHeader = (raw?.cookies ?? [])
		.map((c: any) => `${c.name}=${c.value}`)
		.join("; ");

	return {
		role,
		email: user.email,
		context,
		page,
		userId,
		cookieHeader,
		close: async () => {
			await context.close();
		},
	};
}

/** Refresca el storageState de un user (útil si el token caducó entre corridas) */
export async function refreshSession(role: UserRole): Promise<string> {
	return createStorageStateFor(role);
}

// ─── API helpers con sesión del user ─────────────────────────────────────────

/**
 * Crea un ApiRequestContext con las cookies del user indicado.
 * Útil para acciones puras de backend (setup/teardown de teams, etc.).
 */
export async function apiAsUser(role: UserRole) {
	const statePath = fs.existsSync(storageStateFor(role)) ? storageStateFor(role) : await createStorageStateFor(role);
	return playwrightRequest.newContext({ storageState: statePath });
}

// ─── Team setup helpers ──────────────────────────────────────────────────────

/**
 * Elimina todos los teams donde el user es owner (cleanup agresivo).
 * Para cada team: primero remueve TODOS los miembros (backend exige team vacío para eliminar),
 * luego elimina el team. Útil en beforeAll/afterAll para garantizar estado limpio.
 */
export async function deleteAllOwnedTeams(role: UserRole): Promise<void> {
	const ctx = await apiAsUser(role);
	try {
		const res = await ctx.get(`${API_BASE}/api/groups`);
		if (!res.ok()) return;
		const body = await res.json();
		const teams = body.groups ?? [];
		const raw = JSON.parse(fs.readFileSync(storageStateFor(role), "utf-8"));
		const token = raw?.origins?.[0]?.localStorage?.find((e: any) => e.name === "token")?.value ?? "";
		let userId = "";
		try {
			const payload = JSON.parse(Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
			userId = payload.id ?? payload._id ?? payload.userId ?? "";
		} catch {}

		const ownedTeams = teams.filter((t: any) => {
			const ownerId = typeof t.owner === "string" ? t.owner : t.owner?._id;
			return ownerId === userId;
		});

		for (const team of ownedTeams) {
			// 1) Cargar detalle para obtener miembros activos (el modelo usa `userId`, no `user`)
			const detailRes = await ctx.get(`${API_BASE}/api/groups/${team._id}`);
			if (detailRes.ok()) {
				const detail = await detailRes.json();
				const group = detail.group ?? detail.data ?? detail;
				const members = (group.members ?? []).filter((m: any) => {
					const mid = typeof m.userId === "string" ? m.userId : m.userId?._id;
					return mid && mid !== userId && m.status !== "removed";
				});
				// 2) Remover cada miembro (owner puede remover — verifyGroupAccess="admin" lo permite)
				for (const member of members) {
					const memberId = typeof member.userId === "string" ? member.userId : member.userId?._id;
					if (memberId) {
						await ctx.delete(`${API_BASE}/api/groups/${team._id}/members/${memberId}`).catch(() => {});
					}
				}
			}
			// 3) Eliminar el team
			await ctx.delete(`${API_BASE}/api/groups/${team._id}`).catch(() => {});
		}
	} finally {
		await ctx.dispose();
	}
}

/** Hace que un user abandone todos los teams donde es miembro (no owner) */
export async function leaveAllTeams(role: UserRole): Promise<void> {
	const ctx = await apiAsUser(role);
	try {
		const res = await ctx.get(`${API_BASE}/api/groups`);
		if (!res.ok()) return;
		const body = await res.json();
		const teams = body.groups ?? [];

		const raw = JSON.parse(fs.readFileSync(storageStateFor(role), "utf-8"));
		const token = raw?.origins?.[0]?.localStorage?.find((e: any) => e.name === "token")?.value ?? "";
		let userId = "";
		try {
			const payload = JSON.parse(Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
			userId = payload.id ?? payload._id ?? payload.userId ?? "";
		} catch {}

		for (const team of teams) {
			const ownerId = typeof team.owner === "string" ? team.owner : team.owner?._id;
			if (ownerId === userId) continue; // es owner, lo saltamos
			await ctx.post(`${API_BASE}/api/groups/${team._id}/leave`);
		}
	} finally {
		await ctx.dispose();
	}
}
