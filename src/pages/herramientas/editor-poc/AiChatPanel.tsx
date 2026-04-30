import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import ragAxios from "utils/ragAxios";
import { Alert, Box, Chip, CircularProgress, Collapse, Divider, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { type Editor } from "@tiptap/react";
import { CloseCircle, Copy, DirectboxSend, DocumentText, Edit2, MagicStar, Paperclip, Send2, TextBlock } from "iconsax-react";
import { Movement } from "types/movements";
import { useEditorActions, buildPrompt, type EditorActionDef } from "hooks/use-editor-actions";
import type { CaseContext } from "./SelectionBubble";
// ==============================|| AI CHAT PANEL ||============================== //

interface AttachedContext {
	label: string;
	type: "pdf" | "text";
	value: string;
}

interface AiChatPanelProps {
	editor: Editor;
	onClose?: () => void;
	movements?: Movement[];
	movementsLimited?: boolean;
	embedded?: boolean;
	caseContext?: CaseContext | null;
	initialMessage?: string;
}

interface PendingEdits {
	edits: EditOp[];
	indexMap: number[];
	messageId: string;
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	pending?: boolean;
	editsApplied?: number;
	hadDocContext?: boolean; // si se envió documento como contexto
	hadEditBlock?: boolean; // si la IA generó bloque [EDICION]
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

function buildNumberedContext(editor: Editor): { context: string; indexMap: number[] } {
	const doc = editor.getJSON() as any;
	const nodes: any[] = doc.content || [];
	const lines: string[] = [];
	const indexMap: number[] = [];

	nodes.forEach((node: any, docIdx: number) => {
		const text = extractNodeText(node).trim();
		if (!text) return;
		const typeHint = node.type === "heading" ? `(título N${node.attrs?.level ?? 1}) ` : node.type !== "paragraph" ? `(${node.type}) ` : "";
		lines.push(`[${indexMap.length}] ${typeHint}${text}`);
		indexMap.push(docIdx);
	});

	return { context: lines.join("\n"), indexMap };
}

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

function stripEditBlock(text: string): string {
	let result = text.replace(/\[EDICION\][\s\S]*?\[\/EDICION\]/g, "");
	result = result.replace(/\[EDICION\][\s\S]*$/, "");
	return result.trim();
}

function applyEdits(editor: Editor, edits: EditOp[], indexMap: number[]): number {
	const doc = editor.getJSON() as any;
	const clone: any = JSON.parse(JSON.stringify(doc));
	const content: any[] = clone.content || [];

	const toDocIdx = (ctxIdx: number): number => (ctxIdx >= 0 && ctxIdx < indexMap.length ? indexMap[ctxIdx] : ctxIdx);

	const sorted = [...edits].sort((a, b) => toDocIdx(b.idx) - toDocIdx(a.idx));

	let applied = 0;
	for (const edit of sorted) {
		const op = edit.op ?? "replace";
		const docIdx = toDocIdx(edit.idx);

		if (op === "delete") {
			if (docIdx >= 0 && docIdx < content.length) {
				content.splice(docIdx, 1);
				applied++;
			}
		} else if (op === "insert_after" && edit.new !== undefined) {
			const insertAt = Math.min(docIdx + 1, content.length);
			content.splice(insertAt, 0, {
				type: "paragraph",
				content: [{ type: "text", text: edit.new }],
			});
			applied++;
		} else if (op === "replace" && edit.new !== undefined) {
			if (docIdx >= 0 && docIdx < content.length) {
				content[docIdx] = {
					...content[docIdx],
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

const AiChatPanel = ({
	editor,
	onClose,
	movements = [],
	movementsLimited = false,
	embedded,
	caseContext,
	initialMessage,
}: AiChatPanelProps) => {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [includeDoc, setIncludeDoc] = useState(false);
	const [attachedContext, setAttachedContext] = useState<AttachedContext | null>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [streaming, setStreaming] = useState(false);
	const [selectedText, setSelectedText] = useState("");
	// Mode is automatic: selection active → auto (direct edit); no selection → suggest (pending review)
	const effectiveMode = selectedText ? "auto" : "suggest";
	const [pendingEdits, setPendingEdits] = useState<PendingEdits | null>(null);
	const { actions: panelActions } = useEditorActions({ scope: "panel" });
	const bottomRef = useRef<HTMLDivElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const msgCounterRef = useRef(0);
	const nextId = () => `msg-${++msgCounterRef.current}`;
	const selectionRangeRef = useRef<{ from: number; to: number } | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Set initial message and auto-focus when provided
	useEffect(() => {
		if (!initialMessage) return;
		setInput(initialMessage);
		setTimeout(() => inputRef.current?.focus(), 50);
	}, [initialMessage]);

	// Track editor text selection
	useEffect(() => {
		if (!editor) return;
		const update = () => {
			const { from, to } = editor.state.selection;
			if (from !== to) {
				const text = editor.state.doc.textBetween(from, to, " ").trim();
				setSelectedText(text);
				selectionRangeRef.current = { from, to };
			} else {
				setSelectedText("");
				selectionRangeRef.current = null;
			}
		};
		editor.on("selectionUpdate", update);
		return () => {
			editor.off("selectionUpdate", update);
		};
	}, [editor]);

	const movementsWithContent = useMemo((): AttachedContext[] => {
		const items: AttachedContext[] = [];
		for (const mov of movements) {
			const date = mov.time ? new Date(mov.time).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "";
			const baseLabel = mov.title || mov.movement || "Movimiento";
			// MEV: solo el texto guardado en la propiedad (los adjuntos no se incluyen como contexto)
			if (mov.source === "mev" && mov.texto) {
				items.push({ label: `${date} ${baseLabel}`.trim(), type: "text", value: mov.texto });
			}
			// PJN: viewer.seam sin parámetros devuelve HTML — download=true sirve el PDF binario
			if (mov.source === "pjn" && mov.link?.startsWith("http")) {
				const pdfUrl = mov.link.includes("download=true") ? mov.link : `${mov.link}${mov.link.includes("?") ? "&" : "?"}download=true`;
				items.push({ label: `${date} ${baseLabel}`.trim(), type: "pdf", value: pdfUrl });
			}
		}
		return items;
	}, [movements]);

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
		async (text: string, overrideIncludeDoc?: boolean) => {
			if (!text.trim() || streaming) return;

			const effectiveIncludeDoc = overrideIncludeDoc ?? includeDoc;

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

				let documentText: string | undefined;
				let contextIndexMap: number[] = [];
				if (effectiveIncludeDoc) {
					const { context, indexMap } = buildNumberedContext(editor);
					documentText = context;
					contextIndexMap = indexMap;
				}
				const attachedPdfUrl = attachedContext?.type === "pdf" ? attachedContext.value : undefined;
				const attachedMovementText = attachedContext?.type === "text" ? attachedContext.value : undefined;

				const controller = new AbortController();
				abortControllerRef.current = controller;

				let sseBuffer = "";
				let lastLength = 0;
				let accumulated = "";

				await ragAxios.post(
					"/rag/editor/chat",
					{
						messages: history,
						documentText,
						pdfUrl: attachedPdfUrl,
						movementText: attachedMovementText,
						stream: true,
						...(caseContext ? { caseContext } : {}),
					},
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
										setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)));
									}
								} catch {
									// ignore malformed SSE event
								}
							}
						},
					},
				);

				const hasEditBlock = accumulated.includes("[EDICION]");
				const edits = effectiveIncludeDoc && hasEditBlock ? parseEdits(accumulated) : null;
				const displayContent = hasEditBlock ? stripEditBlock(accumulated) : accumulated;
				let editsApplied = 0;

				if (edits && edits.length > 0) {
					if (effectiveMode === "suggest") {
						setPendingEdits({ edits, indexMap: contextIndexMap, messageId: assistantId });
						editsApplied = -edits.length; // negative = pending, positive = applied
					} else {
						editsApplied = applyEdits(editor, edits, contextIndexMap);
					}
				}

				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId
							? {
									...m,
									content: displayContent,
									editsApplied,
									pending: false,
									hadDocContext: effectiveIncludeDoc,
									hadEditBlock: hasEditBlock,
							  }
							: m,
					),
				);
			} catch (err: any) {
				if (!axios.isCancel(err)) {
					const status = err?.response?.status;
					const isLimit = status === 429 || (status === 403 && err?.response?.data?.upgradeRequired);
					const errorContent = isLimit
						? err?.response?.data?.message || "Alcanzaste el límite mensual de consultas al Asistente IA. Actualizá tu plan para continuar."
						: "Error al conectar con el asistente. Intentá de nuevo.";
					setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: errorContent, pending: false } : m)));
				}
			} finally {
				abortControllerRef.current = null;
				setStreaming(false);
				setMessages((prev) => prev.map((m) => (m.pending ? { ...m, pending: false } : m)));
			}
		},
		[messages, streaming, includeDoc, attachedContext, editor, selectedText],
	);

	// Quick actions: con selección → reemplazo directo + mensaje en chat; sin selección → chat con doc context
	const handleQuickAction = useCallback(
		async (action: EditorActionDef) => {
			const range = selectionRangeRef.current;
			const sel = selectedText;
			const resolvedPrompt = buildPrompt(action.prompt, sel || undefined);

			if (sel && range) {
				// Con selección: llamada directa → reemplaza en editor + muestra en chat
				if (streaming) return;
				const userMsg: ChatMessage = {
					id: nextId(),
					role: "user",
					content: `${action.label}\n\n_Selección:_ "${sel.length > 80 ? sel.slice(0, 80) + "…" : sel}"`,
				};
				const assistantId = nextId();
				const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "", pending: true };
				setMessages((prev) => [...prev, userMsg, assistantMsg]);
				setStreaming(true);
				const directPrompt = `${resolvedPrompt}\n\nTexto a trabajar:\n"${sel}"\n\nDevolvé SOLO el texto resultante, sin explicaciones ni comillas.`;
				const body: Record<string, unknown> = { messages: [{ role: "user", content: directPrompt }], stream: true };
				if (action.systemPromptOverride) body.systemPromptOverride = action.systemPromptOverride;
				if (action.useStyleCorpus) body.useStyleCorpus = true;
				if (caseContext) body.caseContext = caseContext;
				try {
					let sseBuffer = "";
					let lastLength = 0;
					let accumulated = "";
					await ragAxios.post("/rag/editor/chat", body, {
						responseType: "text",
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
									const evt = JSON.parse(raw);
									if (evt.type === "chunk") {
										accumulated += evt.text;
										setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)));
									}
								} catch {}
							}
						},
					});
					const result = accumulated.trim();
					if (result) {
						editor.chain().focus().insertContentAt({ from: range.from, to: range.to }, result).run();
						const newTo = range.from + result.length;
						editor.commands.setTextSelection({ from: range.from, to: newTo });
						setTimeout(() => editor.commands.setTextSelection(newTo), 1500);
						setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: result, pending: false, editsApplied: 1 } : m)));
					} else {
						setMessages((prev) =>
							prev.map((m) =>
								m.id === assistantId ? { ...m, content: "No se pudo generar el texto. Intentá de nuevo.", pending: false } : m,
							),
						);
					}
				} catch (err: any) {
					if (!axios.isCancel(err)) {
						const status = err?.response?.status;
						const isLimit = status === 429 || (status === 403 && err?.response?.data?.upgradeRequired);
						const errorContent = isLimit
							? err?.response?.data?.message ||
							  "Alcanzaste el límite mensual de consultas al Asistente IA. Actualizá tu plan para continuar."
							: "Error al conectar con el asistente.";
						setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: errorContent, pending: false } : m)));
					}
				} finally {
					setStreaming(false);
				}
			} else {
				// Sin selección: al chat con contexto completo + instrucción explícita de formato edición
				sendMessage(
					`${resolvedPrompt}

Aplicá los cambios directamente en el documento usando el bloque [EDICION]...[/EDICION].`,
					action.context.includeDocument,
				);
			}
		},
		[selectedText, streaming, editor, sendMessage],
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

	const sectionLabel = {
		color: "text.secondary",
		fontSize: "0.62rem",
		fontWeight: 700,
		textTransform: "uppercase" as const,
		letterSpacing: "0.07em",
	};

	return (
		<Box
			sx={{
				...(embedded ? { flex: 1 } : { width: 300, flexShrink: 0, borderLeft: "1px solid", borderColor: "divider" }),
				display: "flex",
				flexDirection: "column",
				bgcolor: "background.paper",
				overflow: "hidden",
			}}
		>
			{/* Header */}
			{!embedded && (
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
			)}

			{/* Messages */}
			<Box sx={{ flex: 1, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
				{messages.length === 0 && (
					<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
						Seleccioná texto en el documento para trabajar sobre él, o usá las acciones rápidas para redactar y corregir.
					</Typography>
				)}

				{messages.map((msg) => (
					<Box key={msg.id} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
						<Typography variant="caption" fontWeight={600} color={msg.role === "user" ? "primary.main" : "secondary.main"}>
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
											),
										)}
										{msg.editsApplied != null && msg.editsApplied > 0 && (
											<Chip
												icon={<Edit2 size={12} />}
												label={`${msg.editsApplied} cambio${msg.editsApplied !== 1 ? "s" : ""} aplicado${
													msg.editsApplied !== 1 ? "s" : ""
												} en el documento`}
												size="small"
												color="success"
												variant="outlined"
												sx={{ fontSize: "0.68rem", height: 22, alignSelf: "flex-start", mt: 0.25 }}
											/>
										)}
										{!msg.pending && msg.hadDocContext && !msg.hadEditBlock && (msg.editsApplied === 0 || msg.editsApplied == null) && (
											<Alert
												severity="warning"
												sx={{ mt: 0.5, py: 0.25, px: 1, fontSize: "0.75rem", "& .MuiAlert-icon": { fontSize: 16, mr: 0.75 } }}
											>
												La IA respondió sin generar ediciones directas. Intentá ser más específico.
											</Alert>
										)}
										{msg.editsApplied != null && msg.editsApplied < 0 && pendingEdits?.messageId === msg.id && (
											<Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.5} sx={{ mt: 0.25 }}>
												<Chip
													label={`${Math.abs(msg.editsApplied)} cambio${Math.abs(msg.editsApplied) !== 1 ? "s" : ""} pendiente${
														Math.abs(msg.editsApplied) !== 1 ? "s" : ""
													} — sin aplicar`}
													size="small"
													color="warning"
													variant="outlined"
													sx={{ fontSize: "0.68rem", height: 22 }}
												/>
												<Chip
													label="Aplicar cambios"
													size="small"
													color="primary"
													onClick={() => {
														const count = pendingEdits.edits.length;
														applyEdits(editor, pendingEdits.edits, pendingEdits.indexMap);
														setPendingEdits(null);
														setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, editsApplied: count } : m)));
													}}
													sx={{ fontSize: "0.68rem", height: 22, cursor: "pointer" }}
												/>
												<Chip
													label="Descartar"
													size="small"
													onClick={() => {
														setPendingEdits(null);
														setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, editsApplied: 0 } : m)));
													}}
													sx={{ fontSize: "0.68rem", height: 22, cursor: "pointer" }}
												/>
											</Stack>
										)}
									</>
								)}
							</Box>
						)}
					</Box>
				))}
				<div ref={bottomRef} />
			</Box>

			{/* ── Acciones rápidas ─────────────────────────── */}
			<Box sx={{ px: 1.5, pt: 1, pb: 0.75, borderTop: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
				<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
					<Typography sx={{ ...sectionLabel, color: "text.secondary", fontSize: "0.68rem" }}>Acciones rápidas</Typography>
					<Stack direction="row" spacing={0.25}>
						<Tooltip
							title={effectiveMode === "auto" ? "Con selección: edita directamente" : "Sin selección: muestra cambios para confirmar"}
						>
							<Chip
								label={effectiveMode === "auto" ? "✏ Editar" : "💬 Sugerir"}
								size="small"
								color={effectiveMode === "auto" ? "primary" : "secondary"}
								variant="filled"
								sx={{ fontSize: "0.62rem", height: 20 }}
							/>
						</Tooltip>
					</Stack>
				</Stack>
				<Stack direction="row" flexWrap="wrap" gap={0.5}>
					{panelActions.map((action) => (
						<Chip
							key={action.label}
							label={action.label}
							size="small"
							onClick={() => handleQuickAction(action)}
							disabled={streaming}
							variant="outlined"
							sx={{ fontSize: "0.7rem", height: 24, cursor: "pointer", bgcolor: "background.paper", fontWeight: 500 }}
						/>
					))}
				</Stack>
			</Box>

			<Divider />

			{/* ── Contexto activo ──────────────────────────── */}
			<Box sx={{ px: 1.5, pt: 0.75, pb: 0.75, position: "relative" }}>
				<Typography sx={{ ...sectionLabel, display: "block", mb: 0.75 }}>Contexto activo</Typography>
				<Stack direction="row" flexWrap="wrap" gap={0.5}>
					{/* Documento */}
					<Chip
						icon={<DocumentText size={12} />}
						label="Documento"
						size="small"
						onClick={() => setIncludeDoc((v) => !v)}
						variant={includeDoc ? "filled" : "outlined"}
						color={includeDoc ? "primary" : "default"}
						sx={{ fontSize: "0.7rem", height: 24, cursor: "pointer" }}
					/>

					{/* Movimiento adjunto */}
					{attachedContext ? (
						<Chip
							icon={attachedContext.type === "pdf" ? <Paperclip size={12} /> : <DocumentText size={12} />}
							label={attachedContext.label}
							size="small"
							color="info"
							variant="filled"
							onDelete={() => {
								setAttachedContext(null);
								setPickerOpen(false);
							}}
							sx={{ fontSize: "0.7rem", height: 24, maxWidth: 180 }}
						/>
					) : (
						movementsWithContent.length > 0 && (
							<Chip
								icon={<Paperclip size={12} />}
								label="Agregar Movimiento"
								size="small"
								variant="outlined"
								onClick={() => setPickerOpen((v) => !v)}
								sx={{ fontSize: "0.7rem", height: 24, cursor: "pointer" }}
							/>
						)
					)}

					{/* Selección activa */}
					{selectedText && (
						<Chip
							label={`"${selectedText.length > 30 ? selectedText.slice(0, 30) + "…" : selectedText}"`}
							size="small"
							color="secondary"
							variant="filled"
							sx={{ fontSize: "0.7rem", height: 24, maxWidth: 200 }}
						/>
					)}
				</Stack>

				{/* Picker de movimientos */}
				<Box sx={{ position: "absolute", bottom: "100%", left: 0, right: 0, zIndex: 20, px: 1.5, pb: 0.5 }}>
					<Collapse in={pickerOpen && !attachedContext}>
						<Box
							sx={{
								maxHeight: 160,
								overflowY: "auto",
								border: "1px solid",
								borderColor: "divider",
								borderRadius: 1,
								bgcolor: "background.paper",
								boxShadow: 4,
							}}
						>
							{movementsWithContent.map((item, idx) => (
								<Box
									key={idx}
									onClick={() => {
										setAttachedContext(item);
										setPickerOpen(false);
									}}
									sx={{
										px: 1,
										py: 0.5,
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										gap: 0.75,
										"&:hover": { bgcolor: "action.hover" },
										borderBottom: idx < movementsWithContent.length - 1 ? "1px solid" : "none",
										borderColor: "divider",
									}}
								>
									{item.type === "pdf" ? (
										<Paperclip size={11} style={{ flexShrink: 0, color: "#666" }} />
									) : (
										<DocumentText size={11} style={{ flexShrink: 0, color: "#666" }} />
									)}
									<Typography variant="caption" noWrap sx={{ fontSize: "0.7rem" }}>
										{item.label}
									</Typography>
								</Box>
							))}
							{movementsLimited && (
								<Typography
									variant="caption"
									sx={{
										display: "block",
										px: 1,
										py: 0.4,
										fontSize: "0.62rem",
										color: "text.secondary",
										borderTop: "1px solid",
										borderColor: "divider",
									}}
								>
									Solo últimos movimientos · Plan gratuito
								</Typography>
							)}
						</Box>
					</Collapse>
				</Box>
			</Box>

			{/* ── Input ───────────────────────────────────── */}
			<Box sx={{ px: 1, pb: 1, pt: 0.25, display: "flex", gap: 0.75, alignItems: "flex-end" }}>
				<TextField
					multiline
					maxRows={4}
					size="small"
					placeholder="Pedí ayuda para redactar, mejorar o modificar texto..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={streaming}
					fullWidth
					inputRef={inputRef}
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
