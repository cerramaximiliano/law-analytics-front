import React, { useState, useRef, useCallback } from "react";
import { Box, TextField, IconButton, Chip, Stack, useTheme, alpha, CircularProgress } from "@mui/material";
import { Send2, Refresh } from "iconsax-react";

// ==============================|| RAG CHAT INPUT ||============================== //

interface RagChatInputProps {
	onSend: (message: string) => void;
	disabled?: boolean;
	isStreaming?: boolean;
	placeholder?: string;
}

const SUGGESTIONS = [
	"Resumen del expediente",
	"Estado actual de la causa",
	"Partes intervinientes",
	"Plazos pendientes",
];

const RagChatInput: React.FC<RagChatInputProps> = ({ onSend, disabled, isStreaming, placeholder }) => {
	const theme = useTheme();
	const [message, setMessage] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(true);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSend = useCallback(() => {
		const trimmed = message.trim();
		if (!trimmed || disabled || isStreaming) return;

		onSend(trimmed);
		setMessage("");
		setShowSuggestions(false);
	}, [message, disabled, isStreaming, onSend]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	const handleSuggestion = useCallback(
		(suggestion: string) => {
			onSend(suggestion);
			setShowSuggestions(false);
		},
		[onSend],
	);

	return (
		<Box>
			{/* Suggestions */}
			{showSuggestions && !disabled && (
				<Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.5 }}>
					{SUGGESTIONS.map((suggestion) => (
						<Chip
							key={suggestion}
							label={suggestion}
							size="small"
							onClick={() => handleSuggestion(suggestion)}
							sx={{
								fontSize: "0.75rem",
								height: 28,
								bgcolor: alpha(theme.palette.primary.main, 0.06),
								border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
								cursor: "pointer",
								"&:hover": {
									bgcolor: alpha(theme.palette.primary.main, 0.12),
								},
							}}
						/>
					))}
				</Stack>
			)}

			{/* Input area */}
			<Box
				sx={{
					display: "flex",
					alignItems: "flex-end",
					gap: 1,
					p: 1,
					bgcolor: theme.palette.background.paper,
					border: `1px solid ${theme.palette.divider}`,
					borderRadius: 2,
				}}
			>
				<TextField
					inputRef={inputRef}
					fullWidth
					multiline
					maxRows={4}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder || "Preguntale a la IA sobre tu expediente..."}
					disabled={disabled || isStreaming}
					variant="standard"
					InputProps={{
						disableUnderline: true,
						sx: { fontSize: "0.875rem", px: 1 },
					}}
				/>
				<IconButton
					onClick={handleSend}
					disabled={!message.trim() || disabled || isStreaming}
					color="primary"
					sx={{
						bgcolor: message.trim() ? alpha(theme.palette.primary.main, 0.1) : "transparent",
						"&:hover": {
							bgcolor: alpha(theme.palette.primary.main, 0.2),
						},
					}}
				>
					{isStreaming ? <CircularProgress size={20} /> : <Send2 size={20} />}
				</IconButton>
			</Box>
		</Box>
	);
};

export default RagChatInput;
