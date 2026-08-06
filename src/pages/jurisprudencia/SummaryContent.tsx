// Renderer mínimo del resumen IA (aiSummary.content).
//
// El backend garantiza un Markdown con exactamente tres secciones "## ...".
// En vez de sumar una dependencia de markdown, se parsea ese formato acotado:
// headings "## ", párrafos y negritas "**...**".

import React from "react";

// material-ui
import { Box, Stack, Typography } from "@mui/material";

interface SummarySection {
	title: string;
	paragraphs: string[];
}

export function parseSummarySections(content: string): SummarySection[] {
	const sections: SummarySection[] = [];
	let current: SummarySection | null = null;

	for (const rawLine of content.split("\n")) {
		const line = rawLine.trim();
		if (line.startsWith("## ")) {
			current = { title: line.replace(/^##\s+/, ""), paragraphs: [] };
			sections.push(current);
		} else if (line) {
			if (!current) {
				current = { title: "", paragraphs: [] };
				sections.push(current);
			}
			current.paragraphs.push(line);
		}
	}
	return sections;
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

// Texto plano del resumen (para excerpts en cards y meta descriptions).
export function summaryExcerpt(content: string, maxChars = 240): string {
	const plain = content
		.replace(/^##\s+.*$/gm, "")
		.replace(/\*\*/g, "")
		.replace(/\s+/g, " ")
		.trim();
	if (plain.length <= maxChars) return plain;
	return `${plain.slice(0, maxChars).replace(/\s+\S*$/, "")}…`;
}

interface SummaryContentProps {
	content: string;
}

const SummaryContent = ({ content }: SummaryContentProps) => {
	const sections = parseSummarySections(content);
	return (
		<Stack spacing={2.5}>
			{sections.map((section, i) => (
				<Box key={i}>
					{section.title && (
						<Typography variant="h5" sx={{ mb: 1 }}>
							{section.title}
						</Typography>
					)}
					<Stack spacing={1.25}>
						{section.paragraphs.map((p, j) => (
							<Typography key={j} variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
								{renderInline(p)}
							</Typography>
						))}
					</Stack>
				</Box>
			))}
		</Stack>
	);
};

export default SummaryContent;
