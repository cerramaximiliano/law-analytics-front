import { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";
import ragAxios from "utils/ragAxios";
import {
	Box,
	Chip,
	CircularProgress,
	Divider,
	FormControlLabel,
	IconButton,
	Stack,
	Switch,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { type Editor } from "@tiptap/react";
import { CloseCircle, Copy, DirectboxSend, Edit2, MagicStar, Send2, TextBlock } from "iconsax-react";
// ==============================|| AI CHAT PANEL ||============================== //

interface AiChatPanelProps {
	editor: Editor;
	onClose: () => void;
	pdfUrl?: string;
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	pending?: boolean;
	editsApplied?: number;
}

interface EditOp {
	op?: "replace" | "insert_after" | "delete";
	idx: number;
	new?: string;
}

// ── Document edit helpers ────────────────────────────────────────────────────

function extractNodeText(node: any): string {
	if (node.type === "text") return node.text || "";
	if (node.content) return (node.content as any[]).map(extractNodeText).join("");
	return "";
}

/** Builds numbered paragraph context sent to the LLM: "[0] text\n[1] text\n..." */
function buildNumberedContext(editor: Editor): string {
	const doc = editor.getJSON() as any;
	return (doc.content || [])
		.map((node: any, idx: number) => `[${idx}] ${extractNodeText(node)}`)
		.join("\n");
}

/** Parses the [EDICION]...[/EDICION] block from an LLM response */
function parseEdits(text: string): EditOp[] | null {
	const match = text.match(/\[EDICION\]([\s\S]*?)\[\/EDICION\]/);
	if (!match) return null;
	try {
		const parsed = JSON.parse(match[1].trim());
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

/** Strips the [EDICION] block from the displayed message (complete or truncated) */
function stripEditBlock(text: string): string {
	// Remove complete blocks first
	let result = text.replace(/\[EDICION\][\s\S]*?\[\/EDICION\]/g, "");
	// Remove any incomplete/truncated block at end of text
	result = result.replace(/\[EDICION\][\s\S]*$/, "");
	return result.trim();
}

/**
 * Applies edit operations to the TipTap editor.
 * Processes in descending idx order so splice operations don't shift indices.
 * Returns the number of operations successfully applied.
 */
function applyEdits(editor: Editor, edits: EditOp[]): number {
	const doc = editor.getJSON() as any;
	const clone: any = JSON.parse(JSON.stringify(doc));
	const content: any[] = clone.content || [];

	const sorted = [...edits].sort((a, b) => b.idx - a.idx);

	let applied = 0;
	for (const edit of sorted) {
		const op = edit.op ?? "replace";
		const { idx } = edit;

		if (op === "delete") {
			if (idx >= 0 && idx < content.length) {
				content.splice(idx, 1);
				applied++;
			}
		} else if (op === "insert_after" && edit.new !== undefined) {
			const insertAt = Math.min(idx + 1, content.length);
			content.splice(insertAt, 0, {
				type: "paragraph",
				content: [{ type: "text", text: edit.new }],
			});
			applied++;
		} else if (op === "replace" && edit.new !== undefined) {
			if (idx >= 0 && idx < content.length) {
				// Preserve node type (heading level, etc.) but replace text content
				clone.content[idx] = {
					...clone.content[idx],
					content: [{ type: "text", text: edit.new }],
				};
				applied++;
			}
		}
	}

	if (applied > 0) {
		editor.commands.setContent(clone);
	}
	return applied;
}

// ── Static helpers ───────────────────────────────────────────────────────────

/** Extracts code blocks wrapped in triple backtick from AI text */
function parseBlocks(text: string): { type: "text" | "code"; content: string }[] {
	const parts: { type: "text" | "code"; content: string }[] = [];
	const regex = /```([\s\S]*?)```/g;
	let last = 0;
	let match;
	while ((match = regex.exec(text)) !== null) {
		if (match.index > last) parts.push({ type: "text", content: text.slice(last, match.index) });
		parts.push({ type: "code", content: match[1].trim() });
		last = match.index + match[0].length;
	}
	if (last < text.length) parts.push({ type: "text", content: text.slice(last) });
	return parts;
}

const SUGGESTED_PROMPTS = [
	"Mejorá la redacción del documento actual",
	"Escribí una introducción formal para este escrito",
	"Sugerí un cierre con petitorio",
	"Corregí el estilo jurídico",
];

const AiChatPanel = ({ editor, onClose, pdfUrl }: AiChatPanelProps) => {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [includeDoc, setIncludeDoc] = useState(false);
	const [includePdf, setIncludePdf] = useState(false);
	const [streaming, setStreaming] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const msgCounterRef = useRef(0);
	const nextId = () => `msg-${++msgCounterRef.current}`;

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const stopStreaming = useCallback(() => {
		abortControllerRef.current?.abort();
		abortControllerRef.current = null;
		setStreaming(false);
		setMessages((prev) => prev.map((m) => (m.pending ? { ...m, pending: false } : m)));
	}, []);

	const sendMessage = useCallback(
		async (text: string) => {
			if (!text.trim() || streaming) return;

			const userMsg: ChatMessage = { id: nextId(), role: "user", content: text.trim() };
			const assistantId = nextId();
			const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "", pending: true };

			setMessages((prev) => [...prev, userMsg, assistantMsg]);
			setInput("");
			setStreaming(true);

			try {
				const history = [...messages, userMsg].map((m) => ({
					role: m.role,
					content: m.content,
				}));

				// Send numbered paragraphs when doc context is enabled so the LLM
				// can reference paragraphs by index in [EDICION] edit blocks.
				const documentText = includeDoc ? buildNumberedContext(editor) : undefined;
				const attachedPdfUrl = includePdf && pdfUrl ? pdfUrl : undefined;

				const controller = new AbortController();
				abortControllerRef.current = controller;

				let sseBuffer = "";
				let lastLength = 0;
				let accumulated = "";

				await ragAxios.post(
					"/rag/editor/chat",
					{ messages: history, documentText, pdfUrl: attachedPdfUrl, stream: true },
					{
						responseType: "text",
						signal: controller.signal,
						onDownloadProgress: (progressEvent) => {
							const fullText = (progressEvent.event?.target as XMLHttpRequest)?.response ?? "";
							const newText = fullText.slice(lastLength);
							lastLength = fullText.length;

							sseBuffer += newText;
							const lines = sseBuffer.split("\n");
							sseBuffer = lines.pop() ?? "";

							for (const line of lines) {
								if (!line.startsWith("data: ")) continue;
								const raw = line.slice(6).trim();
								if (!raw) continue;
								try {
									const sseEvent = JSON.parse(raw);
									if (sseEvent.type === "chunk") {
										accumulated += sseEvent.text;
										setMessages((prev) =>
											prev.map((m) =>
												m.id === assistantId ? { ...m, content: accumulated } : m
											)
										);
									}
								} catch {
									// ignore malformed SSE event
								}
							}
						},
					},
				);

				// After stream completes: detect and apply partial document edits.
				// Strip the [EDICION] block from display always — even if truncated or unparseable.
				const hasEditBlock = accumulated.includes("[EDICION]");
				const edits = includeDoc && hasEditBlock ? parseEdits(accumulated) : null;
				const displayContent = hasEditBlock ? stripEditBlock(accumulated) : accumulated;
				let editsApplied = 0;

				if (edits && edits.length > 0) {
					editsApplied = applyEdits(editor, edits);
				}

				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId
							? { ...m, content: displayContent, editsApplied, pending: false }
							: m
					)
				);
			} catch (err: any) {
				if (!axios.isCancel(err)) {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === assistantId
								? { ...m, content: "Error al conectar con el asistente. Intentá de nuevo.", pending: false }
								: m
						)
					);
				}
			} finally {
				abortControllerRef.current = null;
				setStreaming(false);
				// Fallback: ensure no messages remain pending
				setMessages((prev) => prev.map((m) => (m.pending ? { ...m, pending: false } : m)));
			}
		},
		[messages, streaming, includeDoc, includePdf, editor, pdfUrl],
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage(input);
		}
	};

	const insertIntoEditor = (text: string) => {
		editor.chain().focus().insertContent(text).run();
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).catch(() => {});
	};

	return (
		<Box
			sx={{
				width: 300,
				flexShrink: 0,
				borderLeft: "1px solid",
				borderColor: "divider",
				display: "flex",
				flexDirection: "column",
				bgcolor: "background.paper",
				overflow: "hidden",
			}}
		>
			{/* Header */}
			<Box
				sx={{
					px: 1.5,
					py: 1,
					borderBottom: "1px solid",
					borderColor: "divider",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Stack direction="row" alignItems="center" spacing={0.75}>
					<MagicStar size={16} color="#9c27b0" />
					<Typography variant="subtitle2" fontWeight={600}>
						Asistente IA
					</Typography>
				</Stack>
				<Tooltip title="Cerrar panel">
					<IconButton size="small" onClick={onClose}>
						<CloseCircle size={16} />
					</IconButton>
				</Tooltip>
			</Box>

			{/* Messages */}
			<Box sx={{ flex: 1, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
				{messages.length === 0 && (
					<Box>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
							Consultame sobre el documento o pedime que redacte, mejore o corrija texto.
						</Typography>
						<Stack spacing={0.75}>
							{SUGGESTED_PROMPTS.map((p) => (
								<Chip
									key={p}
									label={p}
									size="small"
									variant="outlined"
									onClick={() => sendMessage(p)}
									sx={{ justifyContent: "flex-start", height: "auto", py: 0.5, cursor: "pointer", fontSize: "0.7rem" }}
								/>
							))}
						</Stack>
					</Box>
				)}

				{messages.map((msg) => (
					<Box key={msg.id} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
						{/* Role label */}
						<Typography
							variant="caption"
							fontWeight={600}
							color={msg.role === "user" ? "primary.main" : "secondary.main"}
						>
							{msg.role === "user" ? "Vos" : "Asistente"}
						</Typography>

						{msg.role === "user" ? (
							<Box
								sx={{
									bgcolor: "primary.lighter",
									borderRadius: 1.5,
									px: 1.25,
									py: 0.75,
									fontSize: "0.8rem",
									lineHeight: 1.5,
									wordBreak: "break-word",
								}}
							>
								{msg.content}
							</Box>
						) : (
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
								{msg.pending && !msg.content ? (
									<Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
										<CircularProgress size={12} />
										<Typography variant="caption" color="text.secondary">
											Generando...
										</Typography>
									</Stack>
								) : (
									<>
										{parseBlocks(msg.content).map((block, i) =>
											block.type === "code" ? (
												<Box
													key={i}
													sx={{
														bgcolor: "grey.50",
														border: "1px solid",
														borderColor: "divider",
														borderRadius: 1,
														p: 1,
														fontSize: "0.78rem",
														lineHeight: 1.6,
														fontFamily: "inherit",
														whiteSpace: "pre-wrap",
														wordBreak: "break-word",
													}}
												>
													{block.content}
													<Stack direction="row" spacing={0.5} mt={0.75}>
														<Tooltip title="Insertar en el cursor">
															<Chip
																icon={<DirectboxSend size={12} />}
																label="Insertar"
																size="small"
																color="primary"
																variant="outlined"
																onClick={() => insertIntoEditor(block.content)}
																sx={{ fontSize: "0.68rem", height: 22, cursor: "pointer" }}
															/>
														</Tooltip>
														<Tooltip title="Copiar">
															<Chip
																icon={<Copy size={12} />}
																label="Copiar"
																size="small"
																variant="outlined"
																onClick={() => copyToClipboard(block.content)}
																sx={{ fontSize: "0.68rem", height: 22, cursor: "pointer" }}
															/>
														</Tooltip>
													</Stack>
												</Box>
											) : (
												<Typography
													key={i}
													variant="body2"
													sx={{ fontSize: "0.8rem", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
												>
													{block.content}
												</Typography>
											)
										)}
										{/* Edit confirmation chip */}
										{msg.editsApplied != null && msg.editsApplied > 0 && (
											<Chip
												icon={<Edit2 size={12} />}
												label={`${msg.editsApplied} cambio${msg.editsApplied !== 1 ? "s" : ""} aplicado${msg.editsApplied !== 1 ? "s" : ""} en el documento`}
												size="small"
												color="success"
												variant="outlined"
												sx={{ fontSize: "0.68rem", height: 22, alignSelf: "flex-start", mt: 0.25 }}
											/>
										)}
									</>
								)}
							</Box>
						)}
					</Box>
				))}
				<div ref={bottomRef} />
			</Box>

			<Divider />

			{/* Options */}
			<Box sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={includeDoc}
							onChange={(e) => setIncludeDoc(e.target.checked)}
						/>
					}
					label={
						<Typography variant="caption" color="text.secondary">
							Incluir documento como contexto
						</Typography>
					}
					sx={{ m: 0 }}
				/>
				{pdfUrl && (
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={includePdf}
								onChange={(e) => setIncludePdf(e.target.checked)}
							/>
						}
						label={
							<Typography variant="caption" color="text.secondary">
								Adjuntar PDF del movimiento
							</Typography>
						}
						sx={{ m: 0 }}
					/>
				)}
			</Box>

			{/* Input */}
			<Box sx={{ p: 1, display: "flex", gap: 0.75, alignItems: "flex-end" }}>
				<TextField
					multiline
					maxRows={4}
					size="small"
					placeholder="Escribí tu consulta..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={streaming}
					fullWidth
					sx={{ "& .MuiInputBase-root": { fontSize: "0.8rem" } }}
				/>
				{streaming ? (
					<Tooltip title="Cancelar">
						<IconButton size="small" color="error" onClick={stopStreaming}>
							<TextBlock size={16} />
						</IconButton>
					</Tooltip>
				) : (
					<Tooltip title="Enviar (Enter)">
						<span>
							<IconButton size="small" color="primary" onClick={() => sendMessage(input)} disabled={!input.trim()}>
								<Send2 size={16} />
							</IconButton>
						</span>
					</Tooltip>
				)}
			</Box>
		</Box>
	);
};

export default AiChatPanel;
