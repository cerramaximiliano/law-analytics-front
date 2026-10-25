#!/usr/bin/env node
/**
 * Genera `public/privacy-policy.html` (versión estática, sin JavaScript) a partir del documento legal
 * vigente que sirve el hub (`GET /api/legal/privacy`, colección legaldocuments).
 *
 * Por qué existe: la página React `/privacy-policy` se renderiza en el cliente, así que los
 * verificadores automáticos (directorios de apps de OpenAI/Anthropic, Google, Meta) que leen el HTML
 * sin ejecutar JS ven una cáscara vacía. La copia estática es la que se declara como Privacy Policy URL
 * en esas fichas (`https://lawanalytics.app/privacy-policy.html`) y debe regenerarse cada vez que se
 * activa una versión nueva del documento (scripts/createPrivacyPolicyDraft.js en el hub).
 *
 * Uso:  node scripts/build-privacy-static.mjs [--from <archivo.json>] [--api https://server.lawanalytics.app]
 *
 * El "Markdown liviano" soportado es el mismo que `src/components/legal/LegalMarkdown.tsx`: párrafos
 * separados por línea en blanco, listas "- " / "• ", subtítulos "### ", **negrita**, *cursiva* y
 * [texto](url) con href solo para rutas internas, anclas, mailto: y https://.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = process.argv.slice(2);
const argValue = (flag) => {
	const i = args.indexOf(flag);
	return i >= 0 ? args[i + 1] : undefined;
};
const API = argValue("--api") || "https://server.lawanalytics.app";
const FROM = argValue("--from");
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "privacy-policy.html");

const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function classifyHref(href) {
	if (href.startsWith("/")) return "internal";
	if (href.startsWith("#")) return "anchor";
	if (href.startsWith("mailto:")) return "mailto";
	if (href.startsWith("https://")) return "external";
	return null;
}

const INLINE_RE = /(\*\*([^*]+?)\*\*)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*([^*\s][^*]*?)\*)/g;

function renderInline(text) {
	let out = "";
	let last = 0;
	for (const m of text.matchAll(INLINE_RE)) {
		out += escapeHtml(text.slice(last, m.index));
		if (m[1]) out += `<strong>${renderInline(m[2])}</strong>`;
		else if (m[3]) {
			const kind = classifyHref(m[5]);
			const label = renderInline(m[4]);
			if (!kind) out += label;
			else {
				const href = kind === "internal" ? `https://lawanalytics.app${m[5]}` : m[5];
				const target = kind === "external" ? ' target="_blank" rel="noopener noreferrer"' : "";
				out += `<a href="${escapeHtml(href)}"${target}>${label}</a>`;
			}
		} else if (m[6]) out += `<em>${renderInline(m[7])}</em>`;
		last = m.index + m[0].length;
	}
	return out + escapeHtml(text.slice(last));
}

const LIST_LINE = /^[-•]\s+/;

function renderMarkdown(content) {
	return String(content || "")
		.split(/\n\s*\n/)
		.map((b) => b.trim())
		.filter(Boolean)
		.map((block) => {
			const lines = block
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			if (lines.length === 1 && lines[0].startsWith("### ")) return `<h3>${renderInline(lines[0].slice(4))}</h3>`;
			if (lines.every((l) => LIST_LINE.test(l)))
				return `<ul>\n${lines.map((l) => `\t<li>${renderInline(l.replace(LIST_LINE, ""))}</li>`).join("\n")}\n</ul>`;
			return `<p>${lines.map(renderInline).join(" ")}</p>`;
		})
		.join("\n");
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fechaLarga(iso) {
	// La fecha de vigencia se guarda a las 03:00Z (medianoche en Argentina): leerla en UTC-3.
	const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
	return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

async function loadDocument() {
	if (FROM) return JSON.parse(readFileSync(FROM, "utf8")).document;
	const res = await fetch(`${API}/api/legal/privacy`);
	if (!res.ok) throw new Error(`GET ${API}/api/legal/privacy → ${res.status}`);
	const body = await res.json();
	if (!body.success || !body.document) throw new Error("respuesta sin document");
	return body.document;
}

const doc = await loadDocument();
if (doc.documentType !== "privacy" || doc.isActive === false) throw new Error("el documento no es la política de privacidad activa");
const sections = [...doc.sections].sort((a, b) => a.order - b.order);
const vigencia = fechaLarga(doc.effectiveDate);
const company = doc.companyDetails || {};

const html = `<!DOCTYPE html>
<html lang="es-AR">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Política de Privacidad - Law Analytics</title>
		<meta name="description" content="Política de privacidad de Law Analytics (versión ${escapeHtml(
			doc.version,
		)}): qué datos recopilamos, cómo los usamos y protegemos, integraciones con Google Calendar y conectores de IA (Claude, ChatGPT)." />
		<link rel="canonical" href="https://lawanalytics.app/privacy-policy" />
		<meta name="robots" content="index,follow" />
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
			.container { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
			h1 { color: #1677ff; font-size: 2.25rem; margin-bottom: 6px; }
			h2 { color: #444; margin-top: 35px; font-size: 1.6rem; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
			h3 { color: #555; margin-top: 24px; font-size: 1.15rem; }
			.meta { color: #666; font-size: 0.95rem; margin-bottom: 24px; }
			nav.toc { background: #f8f9fa; border-radius: 6px; padding: 16px 24px; margin: 24px 0; }
			nav.toc h2 { border: 0; margin: 0 0 8px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.04em; color: #666; }
			nav.toc ol { margin: 0; padding-left: 20px; }
			ul { padding-left: 24px; }
			li { margin-bottom: 6px; }
			a { color: #1677ff; }
			.entity { margin-top: 40px; padding: 20px 24px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafbff; }
			.entity dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 12px 0 0; }
			.entity dt { color: #666; font-weight: 500; }
			.entity dd { margin: 0; }
			.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 0.9rem; }
			@media (max-width: 600px) { body { padding: 10px; } .container { padding: 20px; } h1 { font-size: 1.7rem; } }
		</style>
	</head>
	<body>
		<div class="container">
			<h1>${escapeHtml(doc.title)}</h1>
			<p class="meta">Última actualización: ${escapeHtml(vigencia)} · Versión ${escapeHtml(
	doc.version,
)} · <a href="https://lawanalytics.app/">lawanalytics.app</a></p>

			<nav class="toc" aria-label="Contenido">
				<h2>Contenido</h2>
				<ol>
${sections.map((s) => `					<li><a href="#${escapeHtml(s.anchor)}">${escapeHtml(s.title)}</a></li>`).join("\n")}
				</ol>
			</nav>

${renderMarkdown(doc.introduction)}

${sections
	.map(
		(s) => `			<section id="${escapeHtml(s.anchor)}">
			<h2>${escapeHtml(s.title)}</h2>
${renderMarkdown(s.content)}
			</section>`,
	)
	.join("\n\n")}

${renderMarkdown(doc.conclusion)}

			<p><strong>Versión ${escapeHtml(doc.version)}</strong> — vigente desde el ${escapeHtml(vigencia)}.</p>

			<section class="entity" id="titular-del-servicio">
				<h2 style="border:0;margin-top:0">Responsable del tratamiento de datos</h2>
				<p>www.lawanalytics.app y la plataforma Law||Analytics son operados por RUMBA LLC, sociedad de responsabilidad limitada constituida en el Estado de Delaware, Estados Unidos.</p>
				<dl>
					<dt>Razón social</dt><dd>${escapeHtml(company.name || "RUMBA LLC")}</dd>
					<dt>Domicilio</dt><dd>${escapeHtml(company.address || "")}</dd>
					<dt>Teléfono</dt><dd><a href="tel:${escapeHtml((company.phone || "").replace(/\s/g, ""))}">${escapeHtml(company.phone || "")}</a></dd>
					<dt>Correo electrónico</dt><dd><a href="mailto:${escapeHtml(company.email || "")}">${escapeHtml(company.email || "")}</a></dd>
				</dl>
			</section>

			<div class="footer">
				<p>© ${new Date().getFullYear()} Law||Analytics — un servicio de RUMBA LLC. Esta es la versión estática de la política; la versión interactiva está en <a href="https://lawanalytics.app/privacy-policy">lawanalytics.app/privacy-policy</a>. Ver también los <a href="https://lawanalytics.app/terms">Términos y condiciones</a>.</p>
			</div>
		</div>
	</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`OK ${path.relative(process.cwd(), OUT)} — versión ${doc.version} (${sections.length} secciones, ${html.length} bytes)`);
