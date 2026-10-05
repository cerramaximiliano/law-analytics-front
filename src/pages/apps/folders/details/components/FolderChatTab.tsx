import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	Box,
	Button,
	ButtonBase,
	CircularProgress,
	InputBase,
	LinearProgress,
	MenuItem,
	Stack,
	TextField,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Add, Archive, MessageText1, Send2 } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";
import {
	archiveExpedienteChatConversation,
	ExpedienteChatCitation,
	ExpedienteChatConversation,
	ExpedienteChatError,
	ExpedienteIndexInfo,
	getExpedienteChatConversation,
	getExpedienteIndexStatus,
	listExpedienteChatConversations,
	sendExpedienteChatMessage,
} from "services/expedienteChatService";
import dayjs from "utils/dayjs-config";

// ==============================|| PESTAÑA "CHAT IA" DEL DETALLE DE LA CARPETA ||============================== //
//
// Chat con IA sobre los documentos de la causa (feature "expediente_chat").
// La pestaña solo se monta para usuarios con acceso (details.tsx lo decide
// con useExpedienteChatAccess); la RAG API vuelve a validarlo en cada mensaje.
//
// Antes de chatear la causa tiene que estar indexada. Tres estados:
//   - sin índice / en proceso → "Estamos preparando los documentos" (se
//     consulta de nuevo cada 20 s mientras esté en proceso)
//   - error de indexación     → aviso, sin chat
//   - indexada                → chat
//
// La indexación no se dispara desde acá: la gestiona el pipeline de RAG.
//
// Conversaciones: cada una es del usuario y de esta causa. Al entrar se abre
// la más reciente; la lista (panel lateral en escritorio, selector en móvil)
// permite retomar otra, empezar una nueva o archivarla. La RAG API usa los
// mensajes anteriores como contexto al continuar una conversación.

const POLL_MS = 20000;

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	text: string;
	citations?: ExpedienteChatCitation[];
	error?: boolean;
}

interface FolderChatTabProps {
	folder: { _id: string; causaId?: string | null; causaType?: string; folderName?: string };
}

const FolderChatTab: React.FC<FolderChatTabProps> = ({ folder }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const causaId = folder.causaId ? String(folder.causaId) : null;

	const [index, setIndex] = useState<ExpedienteIndexInfo | null>(null);
	const [indexError, setIndexError] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [conversations, setConversations] = useState<ExpedienteChatConversation[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [loadingConversation, setLoadingConversation] = useState(false);
	const [historyError, setHistoryError] = useState<string | null>(null);
	// Archivar pide confirmación en el mismo botón (dos clics).
	const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
	const conversationRef = useRef<string | null>(null);
	// Descarta la respuesta de una carga de historial que quedó vieja.
	const loadSeqRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);
	const endRef = useRef<HTMLDivElement | null>(null);

	// Estado del índice, con re-consulta mientras se está preparando.
	useEffect(() => {
		if (!causaId) return;
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;
		const load = async () => {
			try {
				const info = await getExpedienteIndexStatus(causaId);
				if (cancelled) return;
				setIndex(info);
				setIndexError(false);
				if (info.status === "pending" || info.status === "indexing") timer = setTimeout(load, POLL_MS);
			} catch (_err) {
				if (!cancelled) setIndexError(true);
			}
		};
		setIndex(null);
		setMessages([]);
		setConversations([]);
		setActiveId(null);
		setHistoryError(null);
		conversationRef.current = null;
		load();
		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
			abortRef.current?.abort();
		};
	}, [causaId]);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [messages]);

	const refreshConversations = useCallback(async (): Promise<ExpedienteChatConversation[]> => {
		if (!causaId) return [];
		const list = await listExpedienteChatConversations(causaId);
		setConversations(list);
		return list;
	}, [causaId]);

	const openConversation = useCallback(async (conversationId: string) => {
		const seq = ++loadSeqRef.current;
		abortRef.current?.abort();
		setSending(false);
		setConfirmArchiveId(null);
		setHistoryError(null);
		setActiveId(conversationId);
		conversationRef.current = conversationId;
		setLoadingConversation(true);
		try {
			const stored = await getExpedienteChatConversation(conversationId);
			if (seq !== loadSeqRef.current) return;
			setMessages(stored.map((m) => ({ id: m._id, role: m.role, text: m.content, citations: m.citations })));
		} catch (_err) {
			if (seq !== loadSeqRef.current) return;
			setMessages([]);
			setHistoryError("No pudimos abrir esta conversación.");
		} finally {
			if (seq === loadSeqRef.current) setLoadingConversation(false);
		}
	}, []);

	const startNewConversation = useCallback(() => {
		loadSeqRef.current++;
		abortRef.current?.abort();
		setSending(false);
		setConfirmArchiveId(null);
		setHistoryError(null);
		setLoadingConversation(false);
		setActiveId(null);
		conversationRef.current = null;
		setMessages([]);
	}, []);

	// Con la causa lista: traer las conversaciones y abrir la más reciente.
	const indexReady = index?.status === "indexed";
	useEffect(() => {
		if (!indexReady) return;
		let cancelled = false;
		refreshConversations()
			.then((list) => {
				if (!cancelled && list.length > 0) openConversation(list[0]._id);
			})
			.catch(() => {
				// Sin historial se puede chatear igual: queda la conversación nueva.
			});
		return () => {
			cancelled = true;
		};
	}, [indexReady, refreshConversations, openConversation]);

	const handleArchive = useCallback(
		async (conversationId: string) => {
			if (confirmArchiveId !== conversationId) {
				setConfirmArchiveId(conversationId);
				return;
			}
			setConfirmArchiveId(null);
			try {
				await archiveExpedienteChatConversation(conversationId);
				setConversations((prev) => prev.filter((c) => c._id !== conversationId));
				if (activeId === conversationId) startNewConversation();
			} catch (_err) {
				setHistoryError("No pudimos archivar la conversación.");
			}
		},
		[confirmArchiveId, activeId, startNewConversation],
	);

	const handleSend = useCallback(async () => {
		const text = input.trim();
		if (!text || sending || loadingConversation || !causaId) return;
		const wasNew = !conversationRef.current;
		const assistantId = `a-${Date.now()}`;
		setInput("");
		setSending(true);
		setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }, { id: assistantId, role: "assistant", text: "" }]);
		const patch = (fn: (m: ChatMessage) => ChatMessage) => setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));
		const controller = new AbortController();
		abortRef.current = controller;
		try {
			const result = await sendExpedienteChatMessage({
				causaId,
				causaType: folder.causaType,
				folderId: folder._id,
				conversationId: conversationRef.current,
				message: text,
				signal: controller.signal,
				onStart: (id) => {
					conversationRef.current = id;
				},
				onChunk: (chunk) => patch((m) => ({ ...m, text: m.text + chunk })),
			});
			conversationRef.current = result.conversationId;
			patch((m) => ({ ...m, citations: result.citations }));
			if (result.conversationId) setActiveId(result.conversationId);
			// La lista cambia de orden (y suma la conversación si era nueva).
			if (wasNew || conversations.length > 1) refreshConversations().catch(() => undefined);
		} catch (err) {
			if (controller.signal.aborted) return;
			const message = err instanceof ExpedienteChatError ? err.message : "No pudimos enviar tu consulta. Intentá de nuevo en unos minutos.";
			patch((m) => ({ ...m, text: m.text || message, error: true }));
		} finally {
			setSending(false);
		}
	}, [input, sending, loadingConversation, causaId, folder._id, folder.causaType, conversations.length, refreshConversations]);

	const panelSx = {
		p: 3,
		borderRadius: 1.5,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
	};

	const notice = (title: string, body: string, progress?: React.ReactNode) => (
		<Stack spacing={1.25} alignItems="center" sx={{ ...panelSx, textAlign: "center", py: 5 }}>
			<Box
				sx={{
					width: 44,
					height: 44,
					borderRadius: 1.25,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
				}}
			>
				<MessageText1 size={22} variant="Bulk" />
			</Box>
			<Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "text.primary" }}>{title}</Typography>
			<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 460, lineHeight: 1.55 }}>{body}</Typography>
			{progress}
		</Stack>
	);

	if (!causaId) {
		return notice("Chat no disponible", "Esta carpeta todavía no tiene una causa vinculada.");
	}
	if (indexError) {
		return notice("No pudimos consultar el estado de la causa", "Probá de nuevo en unos minutos.");
	}
	if (!index) {
		return (
			<Stack alignItems="center" sx={{ py: 6 }}>
				<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
			</Stack>
		);
	}
	if (index.status === "error") {
		return notice(
			"No pudimos preparar los documentos de esta causa",
			"Estamos revisándolo. El chat va a estar disponible cuando se resuelva.",
		);
	}
	if (index.status !== "indexed") {
		const pct = index.documentsTotal > 0 ? Math.round((index.documentsProcessed / index.documentsTotal) * 100) : 0;
		return notice(
			"Estamos preparando los documentos de esta causa",
			"Para poder consultarlos con IA primero hay que procesarlos. Cuando estén listos vas a poder chatear desde acá.",
			index.status === "indexing" && index.documentsTotal > 0 ? (
				<Stack spacing={0.5} sx={{ width: "100%", maxWidth: 320 }}>
					<LinearProgress
						variant="determinate"
						value={pct}
						sx={{ borderRadius: 1, bgcolor: alpha(BRAND_BLUE, 0.12), "& .MuiLinearProgress-bar": { bgcolor: BRAND_BLUE } }}
					/>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
						{index.documentsProcessed.toLocaleString("es-AR")} de {index.documentsTotal.toLocaleString("es-AR")} documentos
					</Typography>
				</Stack>
			) : undefined,
		);
	}

	const chatColumn = (
		<Stack spacing={1.5} sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
			<Stack
				spacing={1.25}
				sx={{
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					p: 2,
					borderRadius: 1.5,
					border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
				}}
			>
				{loadingConversation && (
					<Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
						<CircularProgress size={24} sx={{ color: BRAND_BLUE }} />
					</Stack>
				)}
				{historyError && <Typography sx={{ fontSize: "0.82rem", color: "error.main" }}>{historyError}</Typography>}
				{!loadingConversation && !historyError && messages.length === 0 && (
					<Stack spacing={0.5} alignItems="center" justifyContent="center" sx={{ flex: 1, textAlign: "center" }}>
						<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "text.primary" }}>Consultá este expediente</Typography>
						<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", maxWidth: 420 }}>
							Preguntá por lo que pasó en la causa, pedí un resumen o buscá un escrito. Las respuestas se basan en los documentos del
							expediente y pueden contener errores: verificá siempre contra el documento original.
						</Typography>
					</Stack>
				)}
				{!loadingConversation &&
					messages.map((m) => (
						<Box
							key={m.id}
							sx={{
								alignSelf: m.role === "user" ? "flex-end" : "flex-start",
								maxWidth: "85%",
								px: 1.5,
								py: 1,
								borderRadius: 1.5,
								fontSize: "0.875rem",
								lineHeight: 1.55,
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
								color: m.error ? "error.main" : "text.primary",
								bgcolor:
									m.role === "user" ? alpha(BRAND_BLUE, isDark ? 0.22 : 0.12) : alpha(theme.palette.text.primary, isDark ? 0.08 : 0.04),
							}}
						>
							{m.text || (m.role === "assistant" && sending ? "…" : "")}
							{m.citations && m.citations.length > 0 && (
								<Typography component="div" sx={{ mt: 0.75, fontSize: "0.72rem", color: "text.secondary" }}>
									Fuentes:{" "}
									{m.citations
										.map((c) => [c.docType, c.docDate ? dayjs.utc(c.docDate).format("DD/MM/YYYY") : null].filter(Boolean).join(" · "))
										.filter(Boolean)
										.join(" — ")}
								</Typography>
							)}
						</Box>
					))}
				<div ref={endRef} />
			</Stack>

			<Stack
				direction="row"
				spacing={1}
				alignItems="flex-end"
				sx={{
					p: 1,
					borderRadius: 1.5,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.2)}`,
				}}
			>
				<InputBase
					multiline
					maxRows={5}
					fullWidth
					value={input}
					placeholder="Escribí tu consulta sobre el expediente…"
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
					inputProps={{ "aria-label": "Consulta sobre el expediente", maxLength: 4000 }}
					sx={{ px: 1, py: 0.5, fontSize: "0.875rem" }}
				/>
				<Button
					variant="contained"
					onClick={handleSend}
					disabled={sending || loadingConversation || !input.trim()}
					endIcon={<Send2 size={16} variant="Bold" />}
					sx={{
						textTransform: "none",
						fontWeight: 600,
						bgcolor: BRAND_BLUE,
						borderRadius: 1.25,
						boxShadow: "none",
						flexShrink: 0,
						"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
					}}
				>
					{sending ? "Enviando…" : "Enviar"}
				</Button>
			</Stack>
		</Stack>
	);

	const conversationLabel = (c: ExpedienteChatConversation) => c.title || "Conversación";
	const conversationDate = (c: ExpedienteChatConversation) => {
		const d = c.lastMessageAt || c.createdAt;
		return d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "";
	};

	const newButton = (
		<Button
			onClick={startNewConversation}
			startIcon={<Add size={16} />}
			sx={{
				textTransform: "none",
				fontWeight: 600,
				color: BRAND_BLUE,
				borderRadius: 1.25,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.34 : 0.28)}`,
				justifyContent: "flex-start",
				flexShrink: 0,
			}}
		>
			Nueva conversación
		</Button>
	);

	// Móvil y tablet: selector arriba del chat.
	if (isMobile) {
		return (
			<Stack spacing={1.25} sx={{ height: "72vh" }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<TextField
						select
						size="small"
						fullWidth
						label="Conversación"
						value={activeId ?? "new"}
						onChange={(e) => (e.target.value === "new" ? startNewConversation() : openConversation(e.target.value))}
					>
						<MenuItem value="new">Nueva conversación</MenuItem>
						{conversations.map((c) => (
							<MenuItem key={c._id} value={c._id}>
								<Typography noWrap sx={{ fontSize: "0.85rem", maxWidth: 240 }}>
									{conversationLabel(c)}
								</Typography>
							</MenuItem>
						))}
					</TextField>
					{activeId && (
						<Button
							onClick={() => handleArchive(activeId)}
							color={confirmArchiveId === activeId ? "error" : "secondary"}
							sx={{ textTransform: "none", flexShrink: 0 }}
						>
							{confirmArchiveId === activeId ? "¿Archivar?" : "Archivar"}
						</Button>
					)}
				</Stack>
				{chatColumn}
			</Stack>
		);
	}

	return (
		<Stack direction="row" spacing={1.5} sx={{ height: 560 }}>
			<Stack spacing={1} sx={{ width: 248, flexShrink: 0, minHeight: 0 }}>
				{newButton}
				<Stack spacing={0.5} sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
					{conversations.length === 0 && (
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", px: 0.5, pt: 0.5 }}>
							Todavía no hay conversaciones guardadas de esta causa.
						</Typography>
					)}
					{conversations.map((c) => {
						const selected = c._id === activeId;
						return (
							<Stack
								key={c._id}
								direction="row"
								alignItems="center"
								sx={{
									borderRadius: 1.25,
									border: `1px solid ${selected ? alpha(BRAND_BLUE, isDark ? 0.34 : 0.28) : "transparent"}`,
									bgcolor: selected ? alpha(BRAND_BLUE, isDark ? 0.12 : 0.07) : "transparent",
									"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05) },
								}}
							>
								<ButtonBase
									onClick={() => openConversation(c._id)}
									sx={{ flex: 1, minWidth: 0, display: "block", textAlign: "left", px: 1, py: 0.75, borderRadius: 1.25 }}
								>
									<Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: selected ? 600 : 500, color: "text.primary" }}>
										{conversationLabel(c)}
									</Typography>
									<Typography noWrap sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
										{conversationDate(c)}
										{c.messagesCount ? ` · ${c.messagesCount} mensajes` : ""}
									</Typography>
								</ButtonBase>
								{confirmArchiveId === c._id ? (
									<Button
										size="small"
										color="error"
										onClick={() => handleArchive(c._id)}
										onBlur={() => setConfirmArchiveId(null)}
										sx={{ textTransform: "none", minWidth: 0, mr: 0.5, fontSize: "0.72rem" }}
									>
										¿Archivar?
									</Button>
								) : (
									<ButtonBase
										onClick={() => handleArchive(c._id)}
										aria-label={`Archivar la conversación ${conversationLabel(c)}`}
										sx={{ p: 0.75, mr: 0.25, borderRadius: 1, color: "text.secondary", "&:hover": { color: "error.main" } }}
									>
										<Archive size={16} />
									</ButtonBase>
								)}
							</Stack>
						);
					})}
				</Stack>
			</Stack>
			{chatColumn}
		</Stack>
	);
};

export default FolderChatTab;
