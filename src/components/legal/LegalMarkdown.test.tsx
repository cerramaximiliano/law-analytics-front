import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LegalMarkdown, { classifyHref, parseInline, parseLegalMarkdown } from "./LegalMarkdown";

const renderMd = (content: string) =>
	render(
		<MemoryRouter>
			<LegalMarkdown
				content={content}
				renderHeading={(children) => <h4>{children}</h4>}
				renderList={(items) => (
					<ul>
						{items.map((item, i) => (
							<li key={i}>{item}</li>
						))}
					</ul>
				)}
			/>
		</MemoryRouter>,
	);

describe("parseLegalMarkdown", () => {
	test("párrafos, subtítulos y listas", () => {
		const blocks = parseLegalMarkdown("Uno\ndos\n\n### Título\n\n- a\n- **b**\n\nFinal");
		expect(blocks.map((b) => b.type)).toEqual(["paragraph", "heading", "list", "paragraph"]);
		expect(blocks[2]).toMatchObject({ type: "list", items: [[{ type: "text", text: "a" }], [{ type: "strong" }]] });
	});

	test("inline: negrita, cursiva, links y texto con asteriscos sueltos", () => {
		expect(parseInline("**No vendemos** ni *Limited Use* [Cookies](/cookies-policy) 2 * 3")).toEqual([
			{ type: "strong", children: [{ type: "text", text: "No vendemos" }] },
			{ type: "text", text: " ni " },
			{ type: "em", children: [{ type: "text", text: "Limited Use" }] },
			{ type: "text", text: " " },
			{ type: "link", href: "/cookies-policy", kind: "internal", children: [{ type: "text", text: "Cookies" }] },
			{ type: "text", text: " 2 * 3" },
		]);
	});

	test("solo acepta hrefs seguros", () => {
		expect(classifyHref("/apps/profiles/account/pjn?view=ia")).toBe("internal");
		expect(classifyHref("#conectores-ia")).toBe("anchor");
		expect(classifyHref("mailto:soporte@lawanalytics.app")).toBe("mailto");
		expect(classifyHref("https://myaccount.google.com/permissions")).toBe("external");
		expect(classifyHref("javascript:alert(1)")).toBeNull();
		expect(classifyHref("//evil.example")).toBeNull();
		expect(classifyHref("http://inseguro.example")).toBeNull();
		expect(parseInline("[x](javascript:alert(1))")).toEqual([
			{ type: "text", text: "x" },
			{ type: "text", text: ")" },
		]);
	});
});

describe("<LegalMarkdown />", () => {
	test("no muestra marcas crudas y dibuja negrita, lista, subtítulo y links", () => {
		const { container } = renderMd(
			"### Cómo se autoriza\n\nEl conector es de **solo lectura**. Ver [Asistentes de IA](/apps/profiles/account/pjn?view=ia) y " +
				"[Google](https://myaccount.google.com/permissions).\n\n- Uno\n- Dos",
		);
		expect(container.textContent).not.toMatch(/\*\*|###|\]\(/);
		expect(screen.getByRole("heading", { name: "Cómo se autoriza" })).toBeInTheDocument();
		expect(screen.getByText("solo lectura").tagName).toBe("STRONG");
		expect(screen.getByRole("link", { name: "Asistentes de IA" })).toHaveAttribute("href", "/apps/profiles/account/pjn?view=ia");
		const ext = screen.getByRole("link", { name: "Google" });
		expect(ext).toHaveAttribute("target", "_blank");
		expect(ext).toHaveAttribute("rel", "noopener noreferrer");
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});

	test("el HTML del contenido se muestra como texto, nunca se interpreta", () => {
		const { container } = renderMd('<img src=x onerror="alert(1)"> <b>hola</b>');
		expect(container.querySelector("img")).toBeNull();
		expect(container.querySelector("b")).toBeNull();
		expect(container.textContent).toContain("<b>hola</b>");
	});
});
