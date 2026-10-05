/**
 * Render mínimo y seguro del "Markdown liviano" de los documentos legales
 * (`LegalDocument.metadata.contentFormat: "markdown"`, ver
 * law-analytics-server/scripts/createPrivacyPolicyDraft.js).
 *
 * Soporta solo lo que usan los documentos: párrafos separados por línea en
 * blanco, listas "- " / "• ", subtítulos "### ", **negrita**, *cursiva* y
 * [texto](url). Nunca interpreta HTML: todo se dibuja como nodos React (texto
 * escapado). Los links solo se renderizan con href para rutas internas ("/…"),
 * anclas ("#…"), "mailto:" y "https://"; cualquier otro esquema queda como
 * texto plano.
 */

import { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Link, SxProps, Theme, Typography } from "@mui/material";

// ============================== PARSER (puro, testeable) ============================== //

export type InlineNode =
	| { type: "text"; text: string }
	| { type: "strong"; children: InlineNode[] }
	| { type: "em"; children: InlineNode[] }
	| { type: "link"; href: string; kind: "internal" | "anchor" | "external" | "mailto"; children: InlineNode[] };

export type Block =
	| { type: "heading"; children: InlineNode[] }
	| { type: "list"; items: InlineNode[][] }
	| { type: "paragraph"; children: InlineNode[] };

const INLINE_RE = /(\*\*([^*]+?)\*\*)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*([^*\s][^*]*?)\*)/g;

export function classifyHref(href: string): "internal" | "anchor" | "external" | "mailto" | null {
	if (/^\/(?!\/)/.test(href)) return "internal";
	if (/^#[\w-]+$/.test(href)) return "anchor";
	if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return "mailto";
	if (/^https:\/\/[^\s]+$/i.test(href)) return "external";
	return null;
}

export function parseInline(text: string): InlineNode[] {
	const out: InlineNode[] = [];
	let last = 0;
	// Copia local del regex: parseInline es recursiva y un /g compartido arrastra lastIndex.
	const re = new RegExp(INLINE_RE.source, "g");
	let m: RegExpExecArray | null;
	while ((m = re.exec(text)) !== null) {
		if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
		if (m[1]) {
			out.push({ type: "strong", children: parseInline(m[2]) });
		} else if (m[3]) {
			const kind = classifyHref(m[5]);
			const children = parseInline(m[4]);
			if (kind) out.push({ type: "link", href: m[5], kind, children });
			else out.push(...children);
		} else if (m[6]) {
			out.push({ type: "em", children: parseInline(m[7]) });
		}
		last = m.index + m[0].length;
	}
	if (last < text.length) out.push({ type: "text", text: text.slice(last) });
	return out;
}

const LIST_LINE = /^[-•]\s+/;

export function parseLegalMarkdown(content: string): Block[] {
	return (content || "")
		.split(/\n\s*\n/)
		.map((b) => b.trim())
		.filter(Boolean)
		.map((block): Block => {
			const lines = block.split("\n").map((l) => l.trim());
			if (lines.length === 1 && /^#{1,6}\s+/.test(lines[0])) {
				return { type: "heading", children: parseInline(lines[0].replace(/^#{1,6}\s+/, "")) };
			}
			if (lines.every((l) => LIST_LINE.test(l))) {
				return { type: "list", items: lines.map((l) => parseInline(l.replace(LIST_LINE, ""))) };
			}
			return { type: "paragraph", children: parseInline(lines.join("\n")) };
		});
}

// ============================== RENDER ============================== //

interface LegalMarkdownProps {
	content: string;
	bodySx?: SxProps<Theme>;
	linkSx?: SxProps<Theme>;
	renderHeading: (children: ReactNode) => ReactNode;
	renderList: (items: ReactNode[]) => ReactNode;
}

export function renderInlineNodes(nodes: InlineNode[], linkSx?: SxProps<Theme>, keyPrefix = "i"): ReactNode[] {
	return nodes.map((node, i) => {
		const key = `${keyPrefix}-${i}`;
		switch (node.type) {
			case "text":
				return node.text;
			case "strong":
				return (
					<Box key={key} component="strong" sx={{ fontWeight: 600 }}>
						{renderInlineNodes(node.children, linkSx, key)}
					</Box>
				);
			case "em":
				return <em key={key}>{renderInlineNodes(node.children, linkSx, key)}</em>;
			case "link": {
				const children = renderInlineNodes(node.children, linkSx, key);
				if (node.kind === "internal") {
					return (
						<Link key={key} component={RouterLink} to={node.href} sx={linkSx}>
							{children}
						</Link>
					);
				}
				if (node.kind === "external") {
					return (
						<Link key={key} href={node.href} target="_blank" rel="noopener noreferrer" sx={linkSx}>
							{children}
						</Link>
					);
				}
				return (
					<Link key={key} href={node.href} sx={linkSx}>
						{children}
					</Link>
				);
			}
			default:
				return null;
		}
	});
}

/** Texto suelto (introducción, conclusión): solo formato inline, respetando saltos de línea. */
export const LegalInline = ({ text, linkSx }: { text: string; linkSx?: SxProps<Theme> }) => (
	<>{renderInlineNodes(parseInline(text), linkSx)}</>
);

const LegalMarkdown = ({ content, bodySx, linkSx, renderHeading, renderList }: LegalMarkdownProps) => (
	<>
		{parseLegalMarkdown(content).map((block, i) => {
			const key = `b-${i}`;
			if (block.type === "heading") return <Box key={key}>{renderHeading(renderInlineNodes(block.children, linkSx, key))}</Box>;
			if (block.type === "list")
				return <Box key={key}>{renderList(block.items.map((item, j) => renderInlineNodes(item, linkSx, `${key}-${j}`)))}</Box>;
			return (
				<Typography key={key} paragraph sx={{ ...(bodySx as object), whiteSpace: "pre-line" }}>
					{renderInlineNodes(block.children, linkSx, key)}
				</Typography>
			);
		})}
	</>
);

export default LegalMarkdown;
