import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	__getQueueForTests,
	__resetProductAnalyticsForTests,
	flushActivityQueue,
	isIdLikeSegment,
	normalizePath,
	reportFrontendError,
	sanitizeMeta,
	scrubText,
	setProductAnalyticsAuth,
	trackActivity,
	trackScreenView,
} from "./productAnalytics";

describe("normalizePath", () => {
	it("reemplaza ObjectId, uuid, números largos y tokens por :id", () => {
		expect(normalizePath("/apps/folders/details/64b7f0c2a1b2c3d4e5f6a7b8")).toBe("/apps/folders/details/:id");
		expect(normalizePath("/x/123e4567-e89b-12d3-a456-426614174000/y")).toBe("/x/:id/y");
		expect(normalizePath("/expedientes/1234567")).toBe("/expedientes/:id");
		expect(normalizePath("/m/AbCdEfGhIjKlMnOpQrStUvWx")).toBe("/m/:id");
		expect(normalizePath("/f/short")).toBe("/f/short");
	});
	it("descarta query, hash y origen", () => {
		expect(normalizePath("/login?source=google&email=a@b.com#top")).toBe("/login");
		expect(normalizePath("https://api.lawanalytics.app/api/folders/64b7f0c2a1b2c3d4e5f6a7b8?x=1")).toBe("/api/folders/:id");
	});
	it("maneja vacíos y barras", () => {
		expect(normalizePath("")).toBe("/");
		expect(normalizePath(undefined)).toBe("/");
		expect(normalizePath("/")).toBe("/");
		expect(normalizePath("/apps/calendar/")).toBe("/apps/calendar");
		expect(normalizePath("api//folders")).toBe("/api/folders");
	});
	it("no marca como id los años ni palabras comunes", () => {
		expect(isIdLikeSegment("2026")).toBe(false);
		expect(isIdLikeSegment("calendar")).toBe(false);
		expect(isIdLikeSegment("J-01-00012345-6")).toBe(true);
	});
});

describe("sanitizeMeta", () => {
	it("solo deja claves permitidas con valores primitivos", () => {
		const out = sanitizeMeta({
			jurisdiction: "caba",
			caratula: "PEREZ JUAN c/ GOMEZ",
			email: "a@b.com",
			count: 3,
			status: 404,
			flag: { nested: true },
			mode: true,
			value: Number.NaN,
			tab: undefined,
		});
		expect(out).toEqual({ jurisdiction: "caba", count: 3, status: 404, mode: true });
	});
	it("trunca strings a 80 y normaliza espacios", () => {
		const out = sanitizeMeta({ component: "  a   b  ", source: "x".repeat(200) });
		expect(out.component).toBe("a b");
		expect((out.source as string).length).toBe(80);
	});
	it("scrubbea datos personales en message_trunc", () => {
		const out = sanitizeMeta({ message_trunc: "Falló para juan@mail.com id 64b7f0c2a1b2c3d4e5f6a7b8 exp 1234567" });
		expect(out.message_trunc).not.toMatch(/@/);
		expect(out.message_trunc).not.toMatch(/64b7f0c2/);
		expect(out.message_trunc).not.toMatch(/1234567/);
		expect(scrubText("a\u0000b")).toBe("a b");
	});
	it("tolera null / undefined", () => {
		expect(sanitizeMeta(null)).toEqual({});
		expect(sanitizeMeta(undefined)).toEqual({});
	});
});

describe("cola de eventos", () => {
	beforeEach(() => {
		__resetProductAnalyticsForTests();
		(window as any).dataLayer = [];
	});

	it("retiene eventos hasta conocer la sesión y los descarta si no hay usuario", () => {
		trackActivity("task_create", { source: "tasks" });
		expect(__getQueueForTests()).toHaveLength(1);
		setProductAnalyticsAuth(false);
		expect(__getQueueForTests()).toHaveLength(0);
		trackActivity("task_create");
		expect(__getQueueForTests()).toHaveLength(0);
	});

	it("empuja a GTM los eventos de activación sin ids ni claves no permitidas", () => {
		setProductAnalyticsAuth(false);
		trackActivity("folder_create_complete", { mode: "manual", jurisdiction: "pjn", caratula: "SECRETO" } as any);
		const pushed = (window as any).dataLayer.find((e: any) => e.event === "folder_create_complete");
		expect(pushed).toBeTruthy();
		expect(pushed.mode).toBe("manual");
		expect(JSON.stringify(pushed)).not.toContain("SECRETO");
	});

	it("screen_view guarda el patrón, nunca la URL, y no repite la misma ruta", () => {
		trackScreenView("/apps/folders/details/64b7f0c2a1b2c3d4e5f6a7b8?tab=1#x");
		trackScreenView("/apps/folders/details/64b7f0c2a1b2c3d4e5f6a7b8");
		const q = __getQueueForTests();
		expect(q).toHaveLength(1);
		expect(q[0].path).toBe("/apps/folders/details/:id");
		expect(q[0].event).toBe("screen_view");
	});

	it("acota la cola a 100 eventos", () => {
		for (let i = 0; i < 150; i++) trackActivity("task_create");
		expect(__getQueueForTests().length).toBeLessThanOrEqual(100);
	});

	it("flush con usuario autenticado vacía la cola en lotes de hasta 25 (beacon)", () => {
		const beacon = vi.fn().mockReturnValue(true);
		Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
		for (let i = 0; i < 60; i++) trackActivity("contact_create");
		setProductAnalyticsAuth(true);
		flushActivityQueue(true);
		expect(__getQueueForTests()).toHaveLength(0);
		expect(beacon).toHaveBeenCalledTimes(3);
		expect(beacon.mock.calls[0][0]).toContain("/api/activity/track");
		expect(beacon.mock.calls[0][1].type).toBe("text/plain");
		expect(beacon.mock.calls[0][1].size).toBeGreaterThan(0);
	});

	it("frontend_error deduplica la misma firma y limita por sesión", () => {
		setProductAnalyticsAuth(true);
		reportFrontendError("Comp", "boom", "Error");
		reportFrontendError("Comp", "boom", "Error");
		expect(__getQueueForTests().filter((e) => e.event === "frontend_error")).toHaveLength(1);
		for (let i = 0; i < 30; i++) reportFrontendError("Comp", `distinto ${i}`, "Error");
		expect(__getQueueForTests().filter((e) => e.event === "frontend_error").length).toBeLessThanOrEqual(10);
	});
});
