import React from "react";
import { Box, Button, DialogActions, DialogContent, DialogTitle, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DocumentText, Note1 } from "iconsax-react";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { PopupTransition } from "components/@extended/Transitions";
import { BRAND_BLUE } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import type { Note } from "types/note";

interface MovementNotesDialogProps {
	open: boolean;
	onClose: () => void;
	notes: Note[];
	/** Título del movimiento, para el encabezado. */
	movementTitle?: string;
	/** Abre el modal de nueva nota sobre este movimiento (si quien lo usa puede crear). */
	onAddNote?: () => void;
}

// Notas de un movimiento (12/11/2026, pedido de Estudio FS Abogados): el ícono con el contador
// sobre el movimiento solo mostraba un tooltip y no había dónde leer la nota; ahora abre este
// diálogo. El listado completo de la carpeta sigue en Gestión → Notas y en Actividad → Notas.
const MovementNotesDialog: React.FC<MovementNotesDialogProps> = ({ open, onClose, notes, movementTitle, onAddNote }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const ordenadas = [...notes].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

	return (
		<ResponsiveDialog
			open={open}
			onClose={onClose}
			TransitionComponent={PopupTransition}
			maxWidth="sm"
			fullWidth
			aria-labelledby="movement-notes-title"
			PaperProps={{
				elevation: 0,
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			<DialogTitle
				id="movement-notes-title"
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					px: 2.5,
					py: 1.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
						flexShrink: 0,
					}}
				>
					<Note1 size={18} variant="Bulk" />
				</Box>
				<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						{ordenadas.length === 1 ? "1 nota del movimiento" : `${ordenadas.length} notas del movimiento`}
					</Typography>
					{movementTitle ? (
						<Typography
							sx={{ fontSize: "0.72rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
						>
							{movementTitle}
						</Typography>
					) : null}
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 2.5 }} data-testid="movement-notes-list">
				{ordenadas.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						Este movimiento no tiene notas.
					</Typography>
				) : (
					<Stack spacing={1.25}>
						{ordenadas.map((note) => (
							<Box
								key={note._id}
								sx={{
									p: 1.5,
									borderRadius: 1.25,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									bgcolor: theme.palette.background.paper,
								}}
							>
								<Stack direction="row" spacing={1.25} alignItems="flex-start">
									<Box
										sx={{
											width: 28,
											height: 28,
											borderRadius: 0.875,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
											color: BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										<DocumentText size={14} variant="Bulk" />
									</Box>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography sx={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.005em" }}>{note.title}</Typography>
										<Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
											{dayjs(note.createdAt).format("DD/MM/YYYY HH:mm")}
										</Typography>
										<Typography
											sx={{
												fontSize: "0.82rem",
												color: "text.secondary",
												lineHeight: 1.55,
												whiteSpace: "pre-wrap",
												wordBreak: "break-word",
											}}
										>
											{note.content || "Sin contenido"}
										</Typography>
									</Box>
								</Stack>
							</Box>
						))}
					</Stack>
				)}
				<Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 2 }}>
					Todas las notas del expediente están en Actividad → Notas y en Gestión → Notas.
				</Typography>
			</DialogContent>

			<DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				{onAddNote ? (
					<Button
						onClick={() => {
							onClose();
							onAddNote();
						}}
						sx={{ textTransform: "none", fontWeight: 600, color: BRAND_BLUE }}
					>
						Nueva nota
					</Button>
				) : null}
				<Button
					onClick={onClose}
					variant="contained"
					sx={{ textTransform: "none", fontWeight: 600, bgcolor: BRAND_BLUE, boxShadow: "none" }}
				>
					Cerrar
				</Button>
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default MovementNotesDialog;
