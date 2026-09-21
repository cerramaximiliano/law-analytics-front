import { describe, expect, it } from "vitest";

import { varianteDesdeBusqueda } from "./jurisdiccion";

describe("variante de /funciones por provincia", () => {
	it("reconoce las tres provincias de la campaña del interior", () => {
		expect(varianteDesdeBusqueda("?source=google_ads&jur=salta")?.portal).toBe("el Poder Judicial de Salta");
		expect(varianteDesdeBusqueda("?jur=catamarca")?.etiqueta).toBe("Para abogados de Catamarca");
		expect(varianteDesdeBusqueda("?jur=Mendoza")?.portal).toBe("el Poder Judicial de Mendoza");
	});

	it("sin jur, o con un valor que no existe, deja la página como está", () => {
		expect(varianteDesdeBusqueda("?source=google_ads")).toBeNull();
		expect(varianteDesdeBusqueda("?jur=cordoba")).toBeNull();
		expect(varianteDesdeBusqueda("")).toBeNull();
	});
});
