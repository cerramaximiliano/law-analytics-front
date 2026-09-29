import { describe, expect, it } from "vitest";

import {
	getPjnBindingState,
	PJN_BINDING_COPY,
	PJN_BINDING_LABEL,
	PJN_CRED_ERROR_PUBLIC_COPY,
	PJN_CRED_ERROR_RESERVED_COPY,
	PJN_CRED_ERROR_NOTICE_SUFFIX,
	PJN_CRED_ERROR_NOTICE_SUFFIX_ACTION,
	formatPjnAccessCutoff,
	pjnAccessCutoffNoticeCopy,
	pjnCredErrorCopy,
	pjnCredErrorReservedCutoffCopy,
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

	it("reservada con corte de acceso: menciona hasta qué fecha ve movimientos", () => {
		// Mediodía UTC: la fecha es la misma en cualquier huso entre UTC-12 y UTC+11.
		const conCorte = { ...misCausas, causaCredentialCovered: false, causaAccessCutoffAt: "2026-05-11T12:00:00.000Z" };
		expect(pjnCredErrorCopy(conCorte)).toBe(pjnCredErrorReservedCutoffCopy("11/05/2026"));
		expect(pjnCredErrorCopy(conCorte)).toContain("ves lo actualizado hasta el 11/05/2026");
		// Pública con corte (no debería pasar, el cutoff es de reservadas): sigue el copy público.
		expect(pjnCredErrorCopy({ ...publica, causaAccessCutoffAt: "2026-05-11T12:00:00.000Z" })).toBe(PJN_CRED_ERROR_PUBLIC_COPY);
		// Cutoff inválido/nulo: copy reservado sin fecha.
		expect(pjnCredErrorCopy({ ...conCorte, causaAccessCutoffAt: null })).toBe(PJN_CRED_ERROR_RESERVED_COPY);
		expect(pjnCredErrorCopy({ ...conCorte, causaAccessCutoffAt: "no-es-fecha" })).toBe(PJN_CRED_ERROR_RESERVED_COPY);
	});
});

describe("corte de acceso — aviso del viewer de movimientos (2026-09-28)", () => {
	it("formatPjnAccessCutoff: dd/mm/aaaa, null si no hay o no parsea", () => {
		expect(formatPjnAccessCutoff("2026-07-04T12:00:00.000Z")).toBe("04/07/2026");
		expect(formatPjnAccessCutoff(new Date("2026-05-11T12:00:00.000Z"))).toBe("11/05/2026");
		expect(formatPjnAccessCutoff(null)).toBeNull();
		expect(formatPjnAccessCutoff(undefined)).toBeNull();
		expect(formatPjnAccessCutoff("")).toBeNull();
		expect(formatPjnAccessCutoff("no-es-fecha")).toBeNull();
	});

	it("pjnAccessCutoffNoticeCopy: copy con la fecha; null sin cutoff", () => {
		expect(pjnAccessCutoffNoticeCopy("2026-07-04T12:00:00.000Z")).toBe(
			"Mostrando movimientos hasta el 04/07/2026: renová tu credencial PJN para ver los nuevos.",
		);
		expect(pjnAccessCutoffNoticeCopy(null)).toBeNull();
		expect(pjnAccessCutoffNoticeCopy("no-es-fecha")).toBeNull();
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
