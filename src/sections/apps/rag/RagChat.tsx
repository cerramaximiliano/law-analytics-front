import React, { useEffect, useRef, useCallback, useState } from "react";
import {
	Box,
	Typography,
	Divider,
	List,
	ListItemButton,
	ListItemText,
	IconButton,
	Tooltip,
	Drawer,
	useTheme,
	alpha,
	useMediaQuery,
	Paper,
	Skeleton,
	Alert,
} from "@mui/material";
import { MessageText1, Add, Trash, MessageQuestion, HambergerMenu } from "iconsax-react";
import dayjs from "utils/dayjs-config";
import { useSelector } from "react-redux";
import { dispatch } from "store";
import {
	fetchConversations,
	loadConversation,
	sendMessageStreaming,
	startNewConversation,
	archiveConversation,
	clearRagError,
} from "store/reducers/rag";
import { RagState, RagMessage } from "types/rag";
import MainCard from "components/MainCard";
import RagChatMessage from "./RagChatMessage";
import RagChatInput from "./RagChatInput";
import RagIndexStatus from "./RagIndexStatus";

// ==============================|| RAG CHAT - MAIN COMPONENT ||============================== //

interface RagChatProps {
	causaId: string;
	causaType: string;
	folderId: string;
}

const RagChat: React.FC<RagChatProps> = ({ causaId, causaType, folderId }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isIndexed, setIsIndexed] = useState(false);

	// Redux state
	const {
		conversations,
		activeConversation,
		messages,
		isStreaming,
		streamingContent,
		indexStatus,
		isLoadingConversations,
		isLoadingMessages,
		isSendingMessage,
		error,
	} = useSelector((state: any) => (state.rag || {}) as RagState);

	// Fetch conversations when causa changes or becomes indexed
	useEffect(() => {
		if (causaId && isIndexed) {
			dispatch(fetchConversations({ causaId }));
		}
	}, [causaId, isIndexed]);

	// Auto-scroll on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, streamingContent]);

	// Handle index completion
	const handleIndexed = useCallback(() => {
		setIsIndexed(true);
	}, []);

	// Check if already indexed on status change
	useEffect(() => {
		if (indexStatus?.status === "indexed") {
			setIsIndexed(true);
		}
	}, [indexStatus?.status]);

	// Send message
	const handleSendMessage = useCallback(
		(message: string) => {
			dispatch(
				sendMessageStreaming({
					message,
					causaId,
					causaType,
					folderId,
					conversationId: activeConversation?._id,
				}),
			);
		},
		[causaId, causaType, folderId, activeConversation?._id],
	);

	// Load conversation
	const handleSelectConversation = useCallback(
		(convId: string) => {
			dispatch(loadConversation(convId));
			if (isMobile) setSidebarOpen(false);
		},
		[isMobile],
	);

	// New conversation
	const handleNewConversation = useCallback(() => {
		dispatch(startNewConversation());
		if (isMobile) setSidebarOpen(false);
	}, [isMobile]);

	// Archive conversation
	const handleArchive = useCallback((convId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(archiveConversation(convId));
	}, []);

	// Dismiss error
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => dispatch(clearRagError()), 8000);
			return () => clearTimeout(timer);
		}
	}, [error]);

	// Sidebar content - conversation list
	const sidebarContent = (
		<Box sx={{ width: isMobile ? 280 : 240, height: "100%", display: "flex", flexDirection: "column" }}>
			<Box sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<Typography variant="subtitle2" color="text.secondary">
					Conversaciones
				</Typography>
				<Tooltip title="Nueva conversacion">
					<IconButton size="small" onClick={handleNewConversation} color="primary">
						<Add size={18} />
					</IconButton>
				</Tooltip>
			</Box>
			<Divider />
			<List sx={{ flexGrow: 1, overflow: "auto", py: 0.5 }}>
				{isLoadingConversations ? (
					<Box sx={{ p: 2 }}>
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
						))}
					</Box>
				) : conversations && conversations.length > 0 ? (
					conversations.map((conv) => (
						<ListItemButton
							key={conv._id}
							selected={activeConversation?._id === conv._id}
							onClick={() => handleSelectConversation(conv._id)}
							sx={{
								py: 1,
								px: 1.5,
								borderRadius: 1,
								mx: 0.5,
								mb: 0.25,
								"&.Mui-selected": {
									bgcolor: alpha(theme.palette.primary.main, 0.08),
								},
							}}
						>
							<MessageText1 size={16} style={{ marginRight: 8, flexShrink: 0, opacity: 0.5 }} />
							<ListItemText
								primary={conv.title}
								secondary={dayjs(conv.lastMessageAt).format("DD/MM HH:mm")}
								primaryTypographyProps={{
									variant: "body2",
									noWrap: true,
									sx: { fontSize: "0.8rem" },
								}}
								secondaryTypographyProps={{
									variant: "caption",
									sx: { fontSize: "0.65rem" },
								}}
							/>
							<Tooltip title="Archivar">
								<IconButton
									size="small"
									onClick={(e) => handleArchive(conv._id, e)}
									sx={{ opacity: 0, ".MuiListItemButton-root:hover &": { opacity: 0.5 } }}
								>
									<Trash size={14} />
								</IconButton>
							</Tooltip>
						</ListItemButton>
					))
				) : (
					<Box sx={{ p: 2, textAlign: "center" }}>
						<Typography variant="caption" color="text.secondary">
							No hay conversaciones
						</Typography>
					</Box>
				)}
			</List>
		</Box>
	);

	// Messages area
	const messagesArea = (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 400 }}>
			{/* Index status */}
			{!isIndexed && (
				<Box sx={{ display: "flex", flex: 1 }}>
					<RagIndexStatus causaId={causaId} causaType={causaType} folderId={folderId} onIndexed={handleIndexed} />
				</Box>
			)}
			{isIndexed && (
				<RagIndexStatus causaId={causaId} causaType={causaType} folderId={folderId} onIndexed={handleIndexed} />
			)}

			{/* Error alert */}
			{error && (
				<Alert severity="error" sx={{ mx: 2, mt: 1 }} onClose={() => dispatch(clearRagError())}>
					{error}
				</Alert>
			)}

			{/* Messages */}
			{isIndexed && <Box
				sx={{
					flexGrow: 1,
					overflow: "auto",
					py: 2,
					px: 1,
					minHeight: 300,
				}}
			>
				{isLoadingMessages ? (
					<Box sx={{ p: 2 }}>
						{[1, 2, 3].map((i) => (
							<Box key={i} sx={{ mb: 2, display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
								<Skeleton variant="rounded" width="60%" height={60} sx={{ borderRadius: 2 }} />
							</Box>
						))}
					</Box>
				) : messages && messages.length > 0 ? (
					<>
						{messages.map((msg: RagMessage, i: number) => (
							<RagChatMessage key={msg._id || i} message={msg} />
						))}
						{/* Streaming message (in progress) */}
						{isStreaming && streamingContent && (
							<RagChatMessage
								message={{
									_id: "streaming",
									conversationId: "",
									role: "assistant",
									content: "",
									createdAt: new Date().toISOString(),
								}}
								isStreaming
								streamingContent={streamingContent}
							/>
						)}
					</>
				) : (
					/* Empty state */
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
							gap: 1.5,
							py: 4,
						}}
					>
						{isIndexed && (
							<>
								<MessageQuestion size={48} color={alpha(theme.palette.text.secondary, 0.3)} />
								<Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 300 }}>
									Hacele preguntas a la IA sobre tu expediente judicial
								</Typography>
							</>
						)}
					</Box>
				)}
				<div ref={messagesEndRef} />
			</Box>}

			{/* Input */}
			{isIndexed && (
				<Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
					<RagChatInput onSend={handleSendMessage} disabled={isSendingMessage && !isStreaming} isStreaming={isStreaming} />
				</Box>
			)}
		</Box>
	);

	// Mobile layout with drawer
	if (isMobile) {
		return (
			<MainCard content={false} sx={{ display: "flex", flexDirection: "column" }}>
				{/* Mobile header */}
				{isIndexed && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
						<IconButton size="small" onClick={() => setSidebarOpen(true)}>
							<HambergerMenu size={20} />
						</IconButton>
						<Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
							{activeConversation?.title || "Nueva conversacion"}
						</Typography>
						<Tooltip title="Nueva conversacion">
							<IconButton size="small" onClick={handleNewConversation} color="primary">
								<Add size={18} />
							</IconButton>
						</Tooltip>
					</Box>
				)}

				{messagesArea}

				<Drawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
					{sidebarContent}
				</Drawer>
			</MainCard>
		);
	}

	// Desktop layout with sidebar
	return (
		<MainCard content={false} sx={{ display: "flex", minHeight: 500 }}>
			{/* Sidebar - only show when indexed */}
			{isIndexed && (
				<Paper
					elevation={0}
					sx={{
						borderRight: `1px solid ${theme.palette.divider}`,
						flexShrink: 0,
					}}
				>
					{sidebarContent}
				</Paper>
			)}

			{/* Main chat area */}
			<Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
				{messagesArea}
			</Box>
		</MainCard>
	);
};

export default RagChat;
