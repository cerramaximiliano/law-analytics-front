import { describe, expect, it } from "vitest";

import {
	getPjnBindingState,
	PJN_BINDING_COPY,
	PJN_BINDING_LABEL,
	PJN_CRED_ERROR_PUBLIC_COPY,
	PJN_CRED_ERROR_RESERVED_COPY,
	PJN_CRED_ERROR_NOTICE_SUFFIX,
	PJN_CRED_ERROR_NOTICE_SUFFIX_ACTION,
	pjnCredErrorCopy,
	pjnStatusNotice,
} from "./pjnBindingState";

// Carpetas base: pública verificada (individual) y de Mis Causas.
const publica = { pjn: true, source: "pjn", causaVerified: true, causaIsValid: true, causaAssociationStatus: "completed" };
const misCausas = { ...publica, source: "pjn-login" };

describe("getPjnBindingState — credencial PJN que requiere acción (2026-09-28)", () => {
	it("sin credError no cambia nada: los estados propios de la carpeta mandan", () => {
		expect(getPjnBindingState(publica)).toBe("ok");
		expect(getPjnBindingState(misCausas)).toBe("ok");
		expect(getPjnBindingState({ ...misCausas, causaCredentialCovered: false })).toBe("revoked");
		expect(getPjnBindingState({ ...publica, causaIsPrivate: true })).toBe("reserved");
		expect(getPjnBindingState({ ...publica, causaIsPrivate: true, causaCredentialCovered: true })).toBe("reserved_covered");
		expect(getPjnBindingState({ ...misCausas, listRemoved: true, listRemovedSource: "pjn" })).toBe("list_removed");
		expect(getPjnBindingState({ ...publica, causaVerified: false, causaAssociationStatus: "pending" })).toBe("pending");
		expect(getPjnBindingState({ ...publica, causaAssociationStatus: "failed" })).toBe("failed");
		expect(getPjnBindingState({ ...publica, causaAssociationStatus: "pending_selection" })).toBe("pending_selection");
	});

	it("alcance: con credError aplica a TODAS las carpetas PJN, no solo a las de Mis Causas", () => {
		expect(getPjnBindingState(publica, { credError: true })).toBe("cred_error");
		expect(getPjnBindingState(misCausas, { credError: true })).toBe("cred_error");
		// No PJN: nunca.
		expect(getPjnBindingState({ pjn: false, mev: true } as any, { credError: true })).toBeNull();
		expect(getPjnBindingState(null, { credError: true })).toBeNull();
	});

	it("orden: cred_error gana sobre revoked / reserved_covered / reserved / list_removed (no sobre pending)", () => {
		expect(getPjnBindingState({ ...misCausas, causaCredentialCovered: false }, { credError: true })).toBe("cred_error");
		expect(getPjnBindingState({ ...publica, causaIsPrivate: true, causaCredentialCovered: true }, { credError: true })).toBe("cred_error");
		expect(getPjnBindingState({ ...publica, causaIsPrivate: true }, { credError: true })).toBe("cred_error");
		expect(getPjnBindingState({ ...misCausas, listRemoved: true, listRemovedSource: "pjn" }, { credError: true })).toBe("cred_error");
		// Una carpeta aún no verificada no puede decir "se sigue actualizando": pending gana.
		expect(getPjnBindingState({ ...publica, causaVerified: false, causaAssociationStatus: "pending" }, { credError: true })).toBe(
			"pending",
		);
	});

	it("orden: cred_error cede ante pending_selection y failed (acción propia más urgente)", () => {
		expect(getPjnBindingState({ ...publica, causaAssociationStatus: "pending_selection" }, { credError: true })).toBe("pending_selection");
		expect(getPjnBindingState({ ...publica, causaAssociationStatus: "failed" }, { credError: true })).toBe("failed");
		// verified + inválida es "failed" desde F7.
		expect(getPjnBindingState({ ...publica, causaIsValid: false }, { credError: true })).toBe("failed");
	});

	it("label y copy nuevos", () => {
		expect(PJN_BINDING_LABEL.cred_error).toBe("PJN — Credencial requiere acción");
		expect(PJN_BINDING_COPY.cred_error).toContain("Te seguimos avisando las novedades de tus causas públicas");
	});
});

describe("pjnCredErrorCopy — pública vs reservada", () => {
	it("pública: se sigue actualizando y se avisan sus novedades", () => {
		expect(pjnCredErrorCopy(publica)).toBe(PJN_CRED_ERROR_PUBLIC_COPY);
		expect(pjnCredErrorCopy(misCausas)).toBe(PJN_CRED_ERROR_PUBLIC_COPY);
		expect(PJN_CRED_ERROR_PUBLIC_COPY).toContain("se sigue actualizando");
	});

	it("reservada (causaIsPrivate o sin cobertura): no se actualiza hasta renovar", () => {
		expect(pjnCredErrorCopy({ ...publica, causaIsPrivate: true })).toBe(PJN_CRED_ERROR_RESERVED_COPY);
		expect(pjnCredErrorCopy({ ...publica, causaIsPrivate: true, causaCredentialCovered: true })).toBe(PJN_CRED_ERROR_RESERVED_COPY);
		expect(pjnCredErrorCopy({ ...misCausas, causaCredentialCovered: false })).toBe(PJN_CRED_ERROR_RESERVED_COPY);
		expect(PJN_CRED_ERROR_RESERVED_COPY).toContain("no se puede actualizar");
	});
});

describe("pjnStatusNotice — credencial que requiere acción", () => {
	it("credential_invalid y required_action agregan la frase de públicas/reservadas", () => {
		expect(pjnStatusNotice({ statusReason: "credential_invalid", enabled: true })).toContain(PJN_CRED_ERROR_NOTICE_SUFFIX);
		expect(pjnStatusNotice({ statusReason: "credential_invalid", enabled: false })).toContain(PJN_CRED_ERROR_NOTICE_SUFFIX);
		expect(pjnStatusNotice({ statusReason: "required_action" })).toContain(PJN_CRED_ERROR_NOTICE_SUFFIX_ACTION);
	});

	it("los demás motivos no la agregan", () => {
		expect(pjnStatusNotice({ statusReason: "portal_maintenance" })).not.toContain(PJN_CRED_ERROR_NOTICE_SUFFIX);
		expect(pjnStatusNotice({ statusReason: "sync_error" })).not.toContain(PJN_CRED_ERROR_NOTICE_SUFFIX);
		expect(pjnStatusNotice({ statusReason: "ok" })).toBeNull();
	});
});
