import { useRef, useState, useEffect, useCallback } from "react";
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
import { CloseCircle, Copy, DirectboxSend, MagicStar, Send2, TextBlock } from "iconsax-react";
import axios from "utils/axios";

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
}

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

let msgCounter = 0;
const nextId = () => `msg-${++msgCounter}`;

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
	const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const stopStreaming = useCallback(() => {
		readerRef.current?.cancel();
		readerRef.current = null;
		setStreaming(false);
		// Mark last assistant message as no longer pending
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
				// Build history for OpenAI (exclude the pending placeholder)
				const history = [...messages, userMsg].map((m) => ({
					role: m.role,
					content: m.content,
				}));

				const documentText = includeDoc ? editor.getText() : undefined;
				const attachedPdfUrl = includePdf && pdfUrl ? pdfUrl : undefined;

				// Use fetch directly for SSE (axios does not support streaming)
				const token = localStorage.getItem("token") || "";
				const resp = await fetch("/rag/editor/chat", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					credentials: "include",
					body: JSON.stringify({ messages: history, documentText, pdfUrl: attachedPdfUrl, stream: true }),
				});

				if (!resp.ok || !resp.body) {
					throw new Error(`HTTP ${resp.status}`);
				}

				const reader = resp.body.getReader();
				readerRef.current = reader;
				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						if (!line.startsWith("data: ")) continue;
						const raw = line.slice(6).trim();
						if (!raw) continue;
						try {
							const event = JSON.parse(raw);
							if (event.type === "chunk") {
								setMessages((prev) =>
									prev.map((m) =>
										m.id === assistantId ? { ...m, content: m.content + event.text } : m
									)
								);
							} else if (event.type === "done" || event.type === "error") {
								break;
							}
						} catch {
							// ignore malformed event
						}
					}
				}
			} catch (err: any) {
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId
							? { ...m, content: "Error al conectar con el asistente. Intentá de nuevo.", pending: false }
							: m
					)
				);
			} finally {
				readerRef.current = null;
				setStreaming(false);
				setMessages((prev) => prev.map((m) => (m.pending ? { ...m, pending: false } : m)));
			}
		},
		[messages, streaming, includeDoc, editor]
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
									parseBlocks(msg.content).map((block, i) =>
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
									)
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
