// Renderer mínimo del cuerpo markdown de los artículos educativos.
//
// Extiende el enfoque de jurisprudencia/SummaryContent.tsx: en vez de sumar una
// dependencia de markdown, se parsea el formato acotado que genera el backend —
// headings "## " y "### ", listas "- ", negritas "**...**" y párrafos.

import React from "react";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Stack, Typography } from "@mui/material";

type ArticleBlock =
	| { type: "heading"; level: 2 | 3; text: string }
	| { type: "paragraph"; text: string }
	| { type: "list"; items: string[] };

export function parseArticleBlocks(content: string): ArticleBlock[] {
	const blocks: ArticleBlock[] = [];
	let currentList: string[] | null = null;

	const flushList = () => {
		if (currentList && currentList.length > 0) {
			blocks.push({ type: "list", items: currentList });
		}
		currentList = null;
	};

	for (const rawLine of content.split("\n")) {
		const line = rawLine.trim();
		if (!line) {
			flushList();
			continue;
		}
		if (line.startsWith("### ")) {
			flushList();
			blocks.push({ type: "heading", level: 3, text: line.replace(/^###\s+/, "") });
		} else if (line.startsWith("## ")) {
			flushList();
			blocks.push({ type: "heading", level: 2, text: line.replace(/^##\s+/, "") });
		} else if (/^[-*]\s+/.test(line)) {
			if (!currentList) currentList = [];
			currentList.push(line.replace(/^[-*]\s+/, ""));
		} else {
			flushList();
			blocks.push({ type: "paragraph", text: line });
		}
	}
	flushList();
	return blocks;
}

// Convierte "**negrita**" en <strong> sin dependencias.
function renderInline(text: string): React.ReactNode[] {
	return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return <strong key={i}>{part.slice(2, -2)}</strong>;
		}
		return <React.Fragment key={i}>{part}</React.Fragment>;
	});
}

// Texto plano del artículo (para excerpts y meta descriptions de respaldo).
export function articleExcerpt(content: string, maxChars = 240): string {
	const plain = content
		.replace(/^#{2,3}\s+.*$/gm, "")
		.replace(/^[-*]\s+/gm, "")
		.replace(/\*\*/g, "")
		.replace(/\s+/g, " ")
		.trim();
	if (plain.length <= maxChars) return plain;
	return `${plain.slice(0, maxChars).replace(/\s+\S*$/, "")}…`;
}

interface ArticleContentProps {
	content: string;
}

const ArticleContent = ({ content }: ArticleContentProps) => {
	const theme = useTheme();
	const blocks = parseArticleBlocks(content);
	return (
		<Stack spacing={2}>
			{blocks.map((block, i) => {
				if (block.type === "heading") {
					return (
						<Typography
							key={i}
							sx={{
								fontSize: block.level === 2 ? { xs: "1.15rem", md: "1.3rem" } : { xs: "1rem", md: "1.1rem" },
								fontWeight: 600,
								letterSpacing: "-0.01em",
								lineHeight: 1.3,
								mt: i === 0 ? 0 : 1.5,
							}}
						>
							{block.text}
						</Typography>
					);
				}
				if (block.type === "list") {
					return (
						<Stack key={i} component="ul" spacing={0.75} sx={{ m: 0, pl: 3 }}>
							{block.items.map((item, j) => (
								<Typography
									key={j}
									component="li"
									color="text.secondary"
									sx={{
										fontSize: "0.92rem",
										lineHeight: 1.65,
										textWrap: "pretty",
										"&::marker": { color: alpha(theme.palette.text.secondary, 0.7) },
									}}
								>
									{renderInline(item)}
								</Typography>
							))}
						</Stack>
					);
				}
				return (
					<Typography key={i} color="text.secondary" sx={{ fontSize: "0.92rem", lineHeight: 1.65, textWrap: "pretty" }}>
						{renderInline(block.text)}
					</Typography>
				);
			})}
		</Stack>
	);
};

export default ArticleContent;
