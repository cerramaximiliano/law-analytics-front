import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Chip, CircularProgress, IconButton, Stack, TextField, Tooltip } from "@mui/material";
import { type Editor } from "@tiptap/react";
import { Send2 } from "iconsax-react";
import AiSparklesIcon from "components/icons/AiSparklesIcon";
import ragAxios from "utils/ragAxios";
import { useEditorActions, buildPrompt, type EditorActionDef } from "hooks/use-editor-actions";
import { wordDiff, insertDiffWithoutHistory } from "./diffUtils";
import type { PendingDiff } from "./DiffReviewPanel";
import type { CaseContext } from "./SelectionBubble";

// ==============================|| BOTTOM ACTION BAR ||============================== //

interface BottomActionBarProps {
	editor: Editor;
	onDiffReady: (diff: PendingDiff) => void;
	onLoadingStart: (label: string) => void;
	hasPendingDiff: boolean;
	caseContext?: CaseContext;
	onOpenAiDrawer: (initialMessage?: string) => void;
}

const BottomActionBar = ({ editor, onDiffReady, onLoadingStart, hasPendingDiff, caseContext, onOpenAiDrawer }: BottomActionBarProps) => {
	const { actions } = useEditorActions({ scope: "bubble" });
	const [instruction, setInstruction] = useState("");
	const [loading, setLoading] = useState<string | null>(null);
	const [selectedText, setSelectedText] = useState("");
	const selectionRef = useRef<{ from: number; to: number } | null>(null);
	const hasPendingDiffRef = useRef(hasPendingDiff);

	useEffect(() => {
		hasPendingDiffRef.current = hasPendingDiff;
	}, [hasPendingDiff]);

	// Monitor editor selection
	useEffect(() => {
		if (!editor) return;
		const update = () => {
			const { from, to } = editor.state.selection;
			if (from !== to) {
				const text = editor.state.doc.textBetween(from, to, " ").trim();
				setSelectedText(text);
				selectionRef.current = { from, to };
			} else {
				setSelectedText("");
				selectionRef.current = null;
			}
		};
		editor.on("selectionUpdate", update);
		return () => {
			editor.off("selectionUpdate", update);
		};
	}, [editor]);

	const streamDiff = useCallback(
		async (prompt: string, actionLabel: string, selText: string, selRange: { from: number; to: number }, body: Record<string, unknown>) => {
			onLoadingStart(actionLabel);
			setLoading(actionLabel);

			// Step 1: clear selection from editor (no history) so we can stream into it
			editor.view.dispatch(
				editor.state.tr.insertText("", selRange.from, selRange.to).setMeta("addToHistory", false)
			);
			let streamedTo = selRange.from;

			try {
				let sseBuffer = "";
				let lastLength = 0;
				let accumulated = "";

				await ragAxios.post(
					"/rag/editor/chat",
					body,
					{
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
										// Step 2: stream each chunk into the editor (typewriter effect)
										const tr = editor.state.tr
											.insertText(evt.text, streamedTo)
											.setMeta("addToHistory", false);
										editor.view.dispatch(tr);
										streamedTo += evt.text.length;
									}
								} catch {
									// ignore malformed SSE
								}
							}
						},
					},
				);

				const result = accumulated.trim();
				if (!result) return;

				// Step 3: replace the streamed plain text with diff-marked version
				const segments = wordDiff(selText, result);
				const diffLen = segments.reduce((sum, s) => sum + s.text.length, 0);

				insertDiffWithoutHistory(editor, selRange.from, streamedTo, segments);
				editor.commands.setTextSelection({ from: selRange.from, to: selRange.from + diffLen });

				onDiffReady({
					from: selRange.from,
					to: selRange.from + diffLen,
					actionLabel,
					segments,
					originalText: selText,
				});
			} catch (_err: any) {
				// On error: restore original text
				editor.view.dispatch(
					editor.state.tr
						.insertText(selText, selRange.from, streamedTo)
						.setMeta("addToHistory", false)
				);
			} finally {
				setLoading(null);
			}
		},
		[editor, onLoadingStart, onDiffReady]
	);

	const handleActionChip = useCallback(
		async (action: EditorActionDef) => {
			const range = selectionRef.current;
			const sel = selectedText;
			if (!sel || !range || loading) return;

			const resolvedPrompt = buildPrompt(action.prompt, sel);
			const promptWithText = action.prompt.includes("{{text}}")
				? resolvedPrompt
				: `${resolvedPrompt}\n\nTexto a trabajar:\n"${sel}"`;
			const prompt = `${promptWithText}\n\nDevolvé SOLO el texto resultante, sin explicaciones, aclaraciones ni comillas.`;

			const body: Record<string, unknown> = {
				messages: [{ role: "user", content: prompt }],
				stream: true,
			};
			if (action.systemPromptOverride) body.systemPromptOverride = action.systemPromptOverride;
			if (action.useStyleCorpus) body.useStyleCorpus = true;
			if (caseContext && Object.values(caseContext).some(Boolean)) body.caseContext = caseContext;

			await streamDiff(prompt, action.label, sel, range, body);
		},
		[selectedText, loading, caseContext, streamDiff]
	);

	const handleSubmit = useCallback(async () => {
		const trimmed = instruction.trim();
		if (!trimmed || loading) return;

		const range = selectionRef.current;
		const sel = selectedText;

		if (sel && range) {
			// With selection: stream as diff
			const prompt = `${trimmed}\n\nTexto a modificar:\n"${sel}"\n\nDevolvé SOLO el texto resultante, sin explicaciones, aclaraciones ni comillas.`;
			const body: Record<string, unknown> = {
				messages: [{ role: "user", content: prompt }],
				stream: true,
			};
			if (caseContext && Object.values(caseContext).some(Boolean)) body.caseContext = caseContext;
			setInstruction("");
			await streamDiff(prompt, trimmed, sel, range, body);
		} else {
			// No selection: open AI drawer with instruction as initial message
			setInstruction("");
			onOpenAiDrawer(trimmed);
		}
	}, [instruction, loading, selectedText, caseContext, streamDiff, onOpenAiDrawer]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const hasSelection = Boolean(selectedText);
	const isLoading = loading !== null;
	const placeholder = hasSelection
		? "Instrucción sobre el texto seleccionado..."
		: "Instrucción para el asistente IA...";

	return (
		<Box
			sx={{
				borderTop: "1px solid",
				borderColor: "divider",
				px: 1.5,
				py: 0.75,
				display: "flex",
				alignItems: "center",
				gap: 1,
				bgcolor: "background.paper",
				flexShrink: 0,
			}}
		>
			<AiSparklesIcon size={16} sx={{ flexShrink: 0 }} />

			{/* Action chips: only when text selected and not loading */}
			{hasSelection && !isLoading && (
				<Stack direction="row" spacing={0.5} flexShrink={0}>
					{actions.map((action) => (
						<Tooltip key={action._id} title={action.hint} placement="top">
							<Chip
								label={action.label}
								size="small"
								variant="outlined"
								onClick={() => handleActionChip(action)}
								sx={{ fontSize: "0.68rem", height: 22, cursor: "pointer" }}
							/>
						</Tooltip>
					))}
				</Stack>
			)}

			{/* Loading indicator */}
			{isLoading && (
				<Stack direction="row" alignItems="center" spacing={0.75} flexShrink={0}>
					<CircularProgress size={12} />
					<Box sx={{ fontSize: "0.72rem", color: "text.secondary", whiteSpace: "nowrap" }}>
						{loading}...
					</Box>
				</Stack>
			)}

			{/* Text field */}
			<TextField
				size="small"
				fullWidth
				placeholder={placeholder}
				value={instruction}
				onChange={(e) => setInstruction(e.target.value)}
				onKeyDown={handleKeyDown}
				disabled={isLoading}
				sx={{ "& .MuiInputBase-root": { height: 32, fontSize: "0.8rem" } }}
			/>

			{/* Send button */}
			<Tooltip title={hasSelection ? "Aplicar instrucción al texto seleccionado" : "Enviar al asistente IA"}>
				<span>
					<IconButton
						size="small"
						color="primary"
						onClick={handleSubmit}
						disabled={!instruction.trim() || isLoading}
					>
						<Send2 size={16} />
					</IconButton>
				</span>
			</Tooltip>

			{/* Open AI drawer button */}
			<Tooltip title="Abrir asistente IA">
				<IconButton
					size="small"
					color="secondary"
					onClick={() => onOpenAiDrawer()}
				>
					<AiSparklesIcon size={16} />
				</IconButton>
			</Tooltip>
		</Box>
	);
};

export default BottomActionBar;
