import React, { useState } from "react";
import { Box, Typography, Paper, Chip, Popover, Stack, useTheme, alpha, IconButton, Tooltip } from "@mui/material";
import { DocumentText, Copy, TickCircle } from "iconsax-react";
import dayjs from "utils/dayjs-config";
import { RagMessage, RagCitation } from "types/rag";

// ==============================|| RAG CHAT MESSAGE ||============================== //

interface RagChatMessageProps {
	message: RagMessage;
	isStreaming?: boolean;
	streamingContent?: string;
}

const RagChatMessage: React.FC<RagChatMessageProps> = ({ message, isStreaming, streamingContent }) => {
	const theme = useTheme();
	const isUser = message.role === "user";
	const content = isStreaming && streamingContent ? streamingContent : message.content;
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: isUser ? "flex-end" : "flex-start",
				mb: 2,
				px: 1,
			}}
		>
			<Box sx={{ maxWidth: "85%" }}>
				{/* Message bubble */}
				<Paper
					elevation={0}
					sx={{
						px: 2,
						py: 1.5,
						borderRadius: 2,
						bgcolor: isUser ? alpha(theme.palette.primary.main, 0.08) : theme.palette.background.paper,
						border: `1px solid ${isUser ? alpha(theme.palette.primary.main, 0.2) : theme.palette.divider}`,
						position: "relative",
					}}
				>
					<Typography
						variant="body2"
						sx={{
							whiteSpace: "pre-wrap",
							lineHeight: 1.7,
							"& strong": { fontWeight: 600 },
						}}
					>
						{content}
						{isStreaming && (
							<Box
								component="span"
								sx={{
									display: "inline-block",
									width: 6,
									height: 16,
									bgcolor: theme.palette.primary.main,
									ml: 0.5,
									animation: "blink 1s infinite",
									"@keyframes blink": {
										"0%, 100%": { opacity: 1 },
										"50%": { opacity: 0 },
									},
								}}
							/>
						)}
					</Typography>

					{/* Copy button for assistant messages */}
					{!isUser && !isStreaming && content && (
						<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
							<Tooltip title={copied ? "Copiado" : "Copiar"}>
								<IconButton size="small" onClick={handleCopy} sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}>
									{copied ? <TickCircle size={14} /> : <Copy size={14} />}
								</IconButton>
							</Tooltip>
						</Box>
					)}
				</Paper>

				{/* Citations */}
				{!isUser && message.citations && message.citations.length > 0 && !isStreaming && (
					<Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
						{message.citations.map((citation, i) => (
							<CitationChip key={i} citation={citation} index={i} />
						))}
					</Stack>
				)}

				{/* Timestamp + metadata */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, px: 0.5 }}>
					<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
						{dayjs(message.createdAt).format("HH:mm")}
					</Typography>
					{!isUser && message.metadata?.model && (
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", opacity: 0.6 }}>
							{message.metadata.model}
						</Typography>
					)}
					{!isUser && message.metadata?.cost != null && message.metadata.cost > 0 && (
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", opacity: 0.6 }}>
							${message.metadata.cost.toFixed(4)}
						</Typography>
					)}
				</Box>
			</Box>
		</Box>
	);
};

// ==============================|| CITATION CHIP ||============================== //

interface CitationChipProps {
	citation: RagCitation;
	index: number;
}

const CitationChip: React.FC<CitationChipProps> = ({ citation, index }) => {
	const theme = useTheme();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	const label = `Doc ${index + 1}${citation.page ? `, pág ${citation.page}` : ""}`;

	return (
		<>
			<Chip
				size="small"
				icon={<DocumentText size={12} />}
				label={label}
				onClick={(e) => setAnchorEl(e.currentTarget)}
				sx={{
					height: 24,
					fontSize: "0.7rem",
					bgcolor: alpha(theme.palette.info.main, 0.08),
					border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
					cursor: "pointer",
					"&:hover": {
						bgcolor: alpha(theme.palette.info.main, 0.15),
					},
				}}
			/>
			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: "top", horizontal: "left" }}
				transformOrigin={{ vertical: "bottom", horizontal: "left" }}
			>
				<Box sx={{ p: 2, maxWidth: 400 }}>
					<Typography variant="subtitle2" gutterBottom>
						Fuente: Doc {index + 1}
					</Typography>
					{citation.docType && (
						<Typography variant="caption" color="text.secondary" display="block">
							Tipo: {citation.docType}
						</Typography>
					)}
					{citation.docDate && (
						<Typography variant="caption" color="text.secondary" display="block">
							Fecha: {dayjs(citation.docDate).format("DD/MM/YYYY")}
						</Typography>
					)}
					{citation.page > 0 && (
						<Typography variant="caption" color="text.secondary" display="block">
							Pag: {citation.page}
						</Typography>
					)}
					{citation.relevanceScore > 0 && (
						<Typography variant="caption" color="text.secondary" display="block">
							Relevancia: {Math.round(citation.relevanceScore * 100)}%
						</Typography>
					)}
					{citation.chunkText && (
						<Paper
							elevation={0}
							sx={{
								mt: 1,
								p: 1.5,
								bgcolor: alpha(theme.palette.grey[500], 0.08),
								borderRadius: 1,
								maxHeight: 200,
								overflow: "auto",
							}}
						>
							<Typography variant="caption" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
								{citation.chunkText}
							</Typography>
						</Paper>
					)}
				</Box>
			</Popover>
		</>
	);
};

export default RagChatMessage;
