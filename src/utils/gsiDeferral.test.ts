import { describe, expect, it } from "vitest";

import { installGsiDeferral, releaseGsi, rearmGsiDeferral } from "./gsiDeferral";

const gsiScript = () => {
	const s = document.createElement("script");
	s.src = "https://accounts.google.com/gsi/client";
	return s;
};
const inDom = (el: Node) => document.body.contains(el);

describe("gsiDeferral", () => {
	it("retiene el script de Google en /login y lo suelta al pedirlo", () => {
		window.history.pushState({}, "", "/login");
		installGsiDeferral();
		rearmGsiDeferral();

		const tag = gsiScript();
		document.body.appendChild(tag);
		expect(inDom(tag)).toBe(false);

		releaseGsi();
		expect(inDom(tag)).toBe(true);
		document.body.removeChild(tag);
	});

	it("removeChild de un script retenido no lanza", () => {
		rearmGsiDeferral();
		const tag = gsiScript();
		document.body.appendChild(tag);
		expect(() => document.body.removeChild(tag)).not.toThrow();
	});

	it("no retiene otros scripts ni rutas distintas", () => {
		rearmGsiDeferral();
		const other = document.createElement("script");
		other.src = "https://example.com/x.js";
		document.body.appendChild(other);
		expect(inDom(other)).toBe(true);
		document.body.removeChild(other);

		window.history.pushState({}, "", "/apps/folders");
		const tag = gsiScript();
		document.body.appendChild(tag);
		expect(inDom(tag)).toBe(true);
		document.body.removeChild(tag);
	});
});
