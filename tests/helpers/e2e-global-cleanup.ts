/**
 * globalSetup de Playwright: deja las seis cuentas descartables sin equipos
 * antes de correr la suite (grupos propios eliminados, membresías abandonadas)
 * y descarta los storageState viejos de `tests/.auth/<rol>.json` para que cada
 * corrida arranque con tokens frescos.
 *
 * Todo pasa por la API del hub (E2E_API_URL) con las credenciales de
 * `.env.e2e.local`; no toca Mongo directamente. Si no hay cuentas descartables
 * configuradas, no hace nada (permite seguir usando el resto de la suite).
 */
import fs from "fs";
import path from "path";
import { hasE2EAccounts, E2E_API_URL } from "./e2e-env";
import { ALL_ROLES, deleteAllOwnedTeams, leaveAllTeams } from "./multi-user";

const AUTH_DIR = path.join(__dirname, "..", ".auth");

export default async function globalCleanup(): Promise<void> {
	if (!hasE2EAccounts()) {
		console.log("[e2e-cleanup] Sin cuentas descartables (E2E_OWNER_EMAIL) — se omite la limpieza de equipos.");
		return;
	}
	console.log(`[e2e-cleanup] Limpiando equipos de ${ALL_ROLES.length} cuentas descartables en ${E2E_API_URL}…`);

	for (const role of ALL_ROLES) {
		const statePath = path.join(AUTH_DIR, `${role}.json`);
		if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
	}

	// Primero abandonar membresías (un owner no puede borrar un equipo con miembros),
	// después eliminar los equipos propios; dos pasadas por si un rol es owner y miembro.
	for (let pass = 0; pass < 2; pass++) {
		for (const role of ALL_ROLES) {
			try {
				await leaveAllTeams(role);
			} catch (err) {
				console.warn(`[e2e-cleanup] leaveAllTeams(${role}) falló: ${(err as Error).message}`);
			}
		}
		for (const role of ALL_ROLES) {
			try {
				await deleteAllOwnedTeams(role);
			} catch (err) {
				console.warn(`[e2e-cleanup] deleteAllOwnedTeams(${role}) falló: ${(err as Error).message}`);
			}
		}
	}
	console.log("[e2e-cleanup] Listo.");
}
