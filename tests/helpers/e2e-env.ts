/**
 * Entorno del E2E: URLs y cuentas descartables.
 *
 * Las cuentas NO viven en el repo. Las genera el hub con
 *   law-analytics-server: NODE_PATH=$PWD/node_modules node tests/helpers/seedE2EAccounts.js
 * que escribe `.env.e2e.local` en la raíz del front (ignorado por git) con:
 *   E2E_BASE_URL, E2E_API_URL,
 *   E2E_<ROL>_EMAIL / E2E_<ROL>_PASSWORD / E2E_<ROL>_PLAN
 * para OWNER, OWNER_SECONDARY, MEMBER_ADMIN, MEMBER_EDITOR, MEMBER_VIEWER, MEMBER_EXTRA.
 *
 * Este módulo carga ese archivo (sin pisar variables ya presentes en process.env)
 * y expone helpers para leerlas con mensajes de error claros.
 */
import fs from "fs";
import path from "path";

export const E2E_ENV_FILE = process.env.E2E_ENV_FILE || path.join(__dirname, "..", "..", ".env.e2e.local");

function parseEnvFile(file: string): Record<string, string> {
	if (!fs.existsSync(file)) return {};
	const out: Record<string, string> = {};
	for (const rawLine of fs.readFileSync(file, "utf-8").split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const eq = line.indexOf("=");
		if (eq <= 0) continue;
		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		out[key] = value;
	}
	return out;
}

let loaded = false;
/** Carga `.env.e2e.local` en process.env (idempotente; no pisa valores existentes). */
export function loadE2EEnv(): void {
	if (loaded) return;
	loaded = true;
	let parsed: Record<string, string> = {};
	try {
		// Si el repo tiene dotenv lo usamos; si no, parser propio.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const dotenv = require("dotenv");
		const res = dotenv.config({ path: E2E_ENV_FILE, override: false });
		parsed = res?.parsed ?? {};
	} catch {
		parsed = parseEnvFile(E2E_ENV_FILE);
		for (const [k, v] of Object.entries(parsed)) {
			if (process.env[k] === undefined) process.env[k] = v;
		}
	}
}

loadE2EEnv();

export const E2E_BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
export const E2E_API_URL = process.env.E2E_API_URL || "http://localhost:5000";

/** true si hay archivo de cuentas descartables (o las variables ya están en el entorno). */
export function hasE2EAccounts(): boolean {
	return Boolean(process.env.E2E_OWNER_EMAIL && process.env.E2E_OWNER_PASSWORD);
}

export function requireE2EVar(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`Falta la variable ${name}. Generá las cuentas descartables desde law-analytics-server con ` +
				`"NODE_PATH=$PWD/node_modules node tests/helpers/seedE2EAccounts.js" (escribe ${E2E_ENV_FILE}) ` +
				`o definila en el entorno.`,
		);
	}
	return value;
}
