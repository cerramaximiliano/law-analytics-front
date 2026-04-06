import { Box, Stack, Typography, Button, IconButton, alpha } from "@mui/material";
import { CloseCircle, TickCircle, CloseSquare } from "iconsax-react";
import AiSparklesIcon from "components/icons/AiSparklesIcon";
import { type Editor } from "@tiptap/react";
import type { DiffSegment } from "./diffUtils";

// ==============================|| DIFF REVIEW PANEL ||============================== //

export interface PendingDiff {
	from: number;
	to: number;
	actionLabel: string;
	segments: Array<DiffSegment>;
	originalText: string;
}

interface DiffReviewPanelProps {
	editor: Editor;
	diff: PendingDiff | null;
	loading: boolean;
	loadingLabel: string;
	onAcceptAll: () => void;
	onRejectAll: () => void;
	onRefine: (instruction: string) => Promise<void>;
	onClose: () => void;
	refining: boolean;
}

function countWords(segments: Array<DiffSegment>, type: "added" | "removed"): number {
	return segments
		.filter((s) => s.type === type)
		.reduce((sum, s) => sum + s.text.trim().split(/\s+/).filter(Boolean).length, 0);
}

const DiffReviewPanel = ({
	editor: _editor,
	diff,
	loading,
	loadingLabel,
	onAcceptAll,
	onRejectAll,
	onRefine: _onRefine,
	onClose,
	refining,
}: DiffReviewPanelProps) => {
	const isVisible = loading || refining || diff !== null;

	if (!isVisible) return null;

	const addedWords = diff ? countWords(diff.segments, "added") : 0;
	const removedWords = diff ? countWords(diff.segments, "removed") : 0;

	return (
		<Box
			sx={{
				position: "fixed",
				bottom: 24,
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 1400,
				pointerEvents: "all",
				animation: "slideUp 0.22s ease-out",
				"@keyframes slideUp": {
					from: { opacity: 0, transform: "translateX(-50%) translateY(12px)" },
					to: { opacity: 1, transform: "translateX(-50%) translateY(0)" },
				},
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				spacing={1}
				sx={{
					bgcolor: "background.paper",
					border: "1px solid",
					borderColor: "primary.light",
					borderRadius: 2,
					boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
					px: 1.5,
					py: 0.75,
					whiteSpace: "nowrap",
				}}
				onMouseDown={(e) => e.preventDefault()}
			>
				{/* Icon + label */}
				<AiSparklesIcon size={14} sx={{ flexShrink: 0 }} />
				<Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.78rem", color: "text.primary" }}>
					{loading || refining
						? `${refining ? "Refinando" : loadingLabel}...`
						: diff?.actionLabel ?? ""}
				</Typography>

				{/* Loading dots */}
				{(loading || refining) && (
					<Stack direction="row" alignItems="center" spacing={0.4}>
						{[0, 0.2, 0.4].map((delay, idx) => (
							<Box
								key={idx}
								sx={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									bgcolor: "secondary.main",
									opacity: 0.7,
									animation: "pulseDot 1.4s ease-in-out infinite",
									animationDelay: `${delay}s`,
									"@keyframes pulseDot": {
										"0%, 80%, 100%": { transform: "scale(0.7)", opacity: 0.35 },
										"40%": { transform: "scale(1)", opacity: 1 },
									},
								}}
							/>
						))}
					</Stack>
				)}

				{/* Diff ready */}
				{!loading && !refining && diff && (
					<>
						{/* Word count badges */}
						{addedWords > 0 && (
							<Typography
								variant="caption"
								sx={{
									bgcolor: alpha("#bbf7d0", 0.6),
									color: "#15803d",
									px: 0.75,
									py: 0.15,
									borderRadius: 1,
									fontWeight: 600,
									fontSize: "0.68rem",
								}}
							>
								+{addedWords}
							</Typography>
						)}
						{removedWords > 0 && (
							<Typography
								variant="caption"
								sx={{
									bgcolor: alpha("#fee2e2", 0.7),
									color: "#b91c1c",
									px: 0.75,
									py: 0.15,
									borderRadius: 1,
									fontWeight: 600,
									fontSize: "0.68rem",
									textDecoration: "line-through",
								}}
							>
								-{removedWords}
							</Typography>
						)}

						<Button
							variant="contained"
							size="small"
							color="success"
							startIcon={<TickCircle size={13} />}
							onClick={onAcceptAll}
							sx={{ fontSize: "0.72rem", textTransform: "none", borderRadius: 1.5, py: 0.4, px: 1, minWidth: 0 }}
						>
							Aceptar
						</Button>
						<Button
							variant="outlined"
							size="small"
							color="error"
							startIcon={<CloseSquare size={13} />}
							onClick={onRejectAll}
							sx={{ fontSize: "0.72rem", textTransform: "none", borderRadius: 1.5, py: 0.4, px: 1, minWidth: 0 }}
						>
							Rechazar
						</Button>
					</>
				)}

				{/* Close */}
				<IconButton
					size="small"
					onClick={onClose}
					disabled={loading || refining}
					sx={{ p: 0.3, borderRadius: 1, opacity: loading || refining ? 0.4 : 0.65, "&:hover": { opacity: 1 } }}
				>
					<CloseCircle size={15} />
				</IconButton>
			</Stack>
		</Box>
	);
};

export default DiffReviewPanel;
