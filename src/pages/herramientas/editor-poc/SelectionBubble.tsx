import { useState, useCallback, useRef, useEffect } from "react";
import { Portal } from "@mui/base";
import { Box, Chip, CircularProgress, Stack, Tooltip, Typography } from "@mui/material";
import { type Editor } from "@tiptap/react";
import AiSparklesIcon from "components/icons/AiSparklesIcon";
import ragAxios from "utils/ragAxios";
import axios from "axios";
import { useEditorActions, buildPrompt, type EditorActionDef } from "hooks/use-editor-actions";
import { wordDiff, insertDiffWithoutHistory } from "./diffUtils";
import type { PendingDiff } from "./DiffReviewPanel";

// ==============================|| SELECTION BUBBLE — IA inline ||============================== //

// ── Types ────────────────────────────────────────────────────────────────────

export interface CaseContext {
	representedParty?: "actor" | "demandado" | null;
	representationType?: "patrocinio" | "apoderado" | null;
	folderName?: string | null;
	actorName?: string | null;
	demandadoName?: string | null;
	folderFuero?: string | null;
	folderJuris?: string | null;
}

interface SelectionBubbleProps {
	editor: Editor;
	onLoadingStart: (label: string) => void;
	onDiffReady: (diff: PendingDiff) => void;
	hasPendingDiff: boolean;
	caseContext?: CaseContext;
}

interface BubblePos {
	top: number;
	left: number;
}

// ── Component ────────────────────────────────────────────────────────────────

const SelectionBubble = ({ editor, onLoadingStart, onDiffReady, hasPendingDiff, caseContext }: SelectionBubbleProps) => {
	const { actions } = useEditorActions({ scope: "bubble" });
	const [pos, setPos] = useState<BubblePos | null>(null);
	const [loading, setLoading] = useState<string | null>(null);
	const [applied, setApplied] = useState<string | null>(null);
	const selectionRef = useRef<{ from: number; to: number } | null>(null);
	const hasPendingDiffRef = useRef(hasPendingDiff);

	// Keep ref in sync for use inside event handlers
	useEffect(() => {
		hasPendingDiffRef.current = hasPendingDiff;
	}, [hasPendingDiff]);

	// ── Position tracking ──────────────────────────────────────────────────

	useEffect(() => {
		if (!editor) return;

		const computePos = () => {
			const { from, to } = editor.state.selection;
			const sel = editor.state.selection as any;

			if (sel.empty || sel.node) {
				if (!hasPendingDiffRef.current) setPos(null);
				return;
			}

			const start = editor.view.coordsAtPos(from);
			const end = editor.view.coordsAtPos(to);
			const scrollEl = editor.view.dom.closest(".tiptap-scroll") as HTMLElement | null;
			const visibleRect = scrollEl?.getBoundingClientRect() ?? (editor.view.dom as HTMLElement).getBoundingClientRect();

			// Hide when the entire selection is outside the visible area
			if (start.top > visibleRect.bottom || end.bottom < visibleRect.top) {
				if (!hasPendingDiffRef.current) setPos(null);
				return;
			}

			const BUBBLE_H = 44;
			const GAP = 8;
			const vw = window.innerWidth;
			const vh = window.innerHeight;

			// Anchor: above the start if visible, otherwise stick to top of scroll container
			const anchorTop = start.top >= visibleRect.top ? start.top : visibleRect.top + BUBBLE_H + GAP;
			const anchorLeft = start.top >= visibleRect.top ? start.left : end.left;

			let top = anchorTop - BUBBLE_H - GAP;
			top = Math.max(visibleRect.top + GAP, top);
			top = Math.min(top, vh - BUBBLE_H - GAP);
			const left = Math.max(8, Math.min(anchorLeft - 80, vw - 200));

			setPos({ top, left });
		};

		const scrollEl = editor.view.dom.closest(".tiptap-scroll") as HTMLElement | null;

		editor.on("selectionUpdate", computePos);
		editor.on("focus", computePos);
		editor.on("blur", () => {
			setTimeout(() => {
				if (!editor.isFocused && !hasPendingDiffRef.current) setPos(null);
			}, 150);
		});
		scrollEl?.addEventListener("scroll", () => computePos(), { passive: true });

		return () => {
			editor.off("selectionUpdate", computePos);
			editor.off("focus", computePos);
		};
	}, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

	// ── Handle action ─────────────────────────────────────────────────────

	const handleAction = useCallback(
		async (action: EditorActionDef) => {
			const { from, to } = editor.state.selection;
			if (from === to) return;

			const selectedText = editor.state.doc.textBetween(from, to, " ").trim();
			if (!selectedText) return;

			selectionRef.current = { from, to };
			setLoading(action.label);
			setApplied(null);
			onLoadingStart(action.label);

			// ── Step 1: clear selection from editor (no history) so we can stream into it ──
			editor.view.dispatch(
				editor.state.tr.insertText("", from, to).setMeta("addToHistory", false)
			);
			let streamedTo = from;

			try {
				let sseBuffer = "";
				let lastLength = 0;
				let accumulated = "";

				const resolvedPrompt = buildPrompt(action.prompt, selectedText);
				const promptWithText = action.prompt.includes("{{text}}")
					? resolvedPrompt
					: `${resolvedPrompt}

Texto a trabajar:
"${selectedText}"`;
				const prompt = `${promptWithText}

Devolvé SOLO el texto resultante, sin explicaciones, aclaraciones ni comillas.`;
				const body: Record<string, unknown> = {
					messages: [{ role: "user", content: prompt }],
					stream: true,
				};
				if (action.systemPromptOverride) body.systemPromptOverride = action.systemPromptOverride;
			if (action.useStyleCorpus) body.useStyleCorpus = true;
			if (caseContext && Object.values(caseContext).some(Boolean)) body.caseContext = caseContext;

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
										// ── Step 2: stream each chunk into the editor (typewriter effect) ──
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
				if (!result || !selectionRef.current) return;

				const { from: f } = selectionRef.current;

				// ── Step 3: replace the streamed plain text with diff-marked version ──
				const segments = wordDiff(selectedText, result);
				const diffLen = segments.reduce((sum, s) => sum + s.text.length, 0);

				insertDiffWithoutHistory(editor, f, streamedTo, segments);

				// Select the diff range so bubble stays positioned correctly
				editor.commands.setTextSelection({ from: f, to: f + diffLen });

				// Notify parent with the full diff data
				onDiffReady({
					from: f,
					to: f + diffLen,
					actionLabel: action.label,
					segments,
					originalText: selectedText,
				});
			} catch (err: any) {
				if (!axios.isCancel(err)) {
					// On error: restore original text
					if (selectionRef.current) {
						editor.view.dispatch(
							editor.state.tr
								.insertText(selectedText, selectionRef.current.from, streamedTo)
								.setMeta("addToHistory", false)
						);
					}
				}
			} finally {
				setLoading(null);
			}
		},
		[editor, onLoadingStart, onDiffReady],
	);

	// ── Render ────────────────────────────────────────────────────────────

	if (!pos) return null;

	return (
		<Portal>
			<Box
				sx={{
					position: "fixed",
					top: pos.top,
					left: pos.left,
					zIndex: 1500,
					bgcolor: "background.paper",
					border: "1px solid",
					borderColor: "divider",
					borderRadius: 1.5,
					boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
					px: 0.75,
					py: 0.6,
					display: "flex",
					flexDirection: "column",
					gap: 0.5,
					userSelect: "none",
					pointerEvents: "all",
				}}
				onMouseDown={(e) => e.preventDefault()}
			>
				<Stack direction="row" alignItems="center" spacing={0.5}>
					<AiSparklesIcon size={13} sx={{ flexShrink: 0 }} />

					{applied ? (
						<Typography
							variant="caption"
							sx={{ fontSize: "0.7rem", color: "success.main", fontWeight: 700, px: 0.25, whiteSpace: "nowrap" }}
						>
							✓ {applied} aplicado
						</Typography>
					) : (
						// Default: action chips
						<>
							{actions.map((action) => (
								<Tooltip key={action._id} title={action.hint} placement="bottom">
									<Chip
										label={
											loading === action.label ? (
												<Stack direction="row" alignItems="center" spacing={0.4}>
													<CircularProgress size={10} color="inherit" />
													<span>{action.label}...</span>
												</Stack>
											) : (
												action.label
											)
										}
										size="small"
										onClick={() => !loading && handleAction(action)}
										disabled={!!loading && loading !== action.label}
										color={loading === action.label ? "secondary" : "default"}
										sx={{ fontSize: "0.68rem", height: 22, cursor: loading ? "default" : "pointer", "& .MuiChip-label": { px: 0.75 } }}
									/>
								</Tooltip>
							))}
						</>
					)}
				</Stack>
			</Box>
		</Portal>
	);
};

export default SelectionBubble;
