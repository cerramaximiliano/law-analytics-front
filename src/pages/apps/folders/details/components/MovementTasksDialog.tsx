import React from "react";
import { Box, Button, Chip, DialogActions, DialogContent, DialogTitle, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { TaskSquare, TickCircle } from "iconsax-react";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { PopupTransition } from "components/@extended/Transitions";
import { BRAND_BLUE, LIVE_GREEN } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import type { TaskType } from "types/task";

interface MovementTasksDialogProps {
	open: boolean;
	onClose: () => void;
	tasks: TaskType[];
	/** Título del movimiento, para el encabezado. */
	movementTitle?: string;
	/** Abre el modal de nueva tarea sobre este movimiento (si quien lo usa puede crear). */
	onAddTask?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
	pendiente: "Pendiente",
	en_progreso: "En progreso",
	revision: "En revisión",
	completada: "Completada",
	cancelada: "Cancelada",
};

const PRIORITY_LABEL: Record<string, string> = { alta: "Alta", media: "Media", baja: "Baja" };

// Tareas de un movimiento (14/11/2026, pedido de Estudio FS Abogados): el ícono con el contador sobre el movimiento
// abre este diálogo, igual que el de notas (MovementNotesDialog, 12/11/2026). El listado completo de la carpeta
// está en Actividad → Tareas.
const MovementTasksDialog: React.FC<MovementTasksDialogProps> = ({ open, onClose, tasks, movementTitle, onAddTask }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const hoy = dayjs().startOf("day");
	const esCompletada = (t: TaskType) => t.checked || t.status === "completada";
	// Pendientes primero (la que vence antes arriba), después las completadas o canceladas.
	const ordenadas = [...tasks].sort((a, b) => {
		const ca = esCompletada(a) || a.status === "cancelada" ? 1 : 0;
		const cb = esCompletada(b) || b.status === "cancelada" ? 1 : 0;
		if (ca !== cb) return ca - cb;
		return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
	});

	const venceChip = (t: TaskType) => {
		if (!t.dueDate) return null;
		const v = dayjs(t.dueDate);
		if (!v.isValid()) return null;
		if (esCompletada(t) || t.status === "cancelada") {
			return <Chip size="small" variant="outlined" label={`Vencía ${v.format("DD/MM/YYYY")}`} sx={{ fontWeight: 600 }} />;
		}
		const dias = v.startOf("day").diff(hoy, "day");
		const color = dias < 0 ? "error" : dias === 0 ? "warning" : "default";
		const label = dias < 0 ? `Venció ${v.format("DD/MM/YYYY")}` : dias === 0 ? "Vence hoy" : `Vence ${v.format("DD/MM/YYYY")}`;
		return <Chip size="small" color={color} variant={dias <= 0 ? "filled" : "outlined"} label={label} sx={{ fontWeight: 600 }} />;
	};

	return (
		<ResponsiveDialog
			open={open}
			onClose={onClose}
			TransitionComponent={PopupTransition}
			maxWidth="sm"
			fullWidth
			aria-labelledby="movement-tasks-title"
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
				id="movement-tasks-title"
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					px: 2.5,
					py: 1.75,
					bgcolor: alpha(LIVE_GREEN, isDark ? 0.08 : 0.04),
					borderBottom: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.22 : 0.14)}`,
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
						bgcolor: alpha(LIVE_GREEN, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.3 : 0.2)}`,
						color: LIVE_GREEN,
						flexShrink: 0,
					}}
				>
					<TaskSquare size={18} variant="Bulk" />
				</Box>
				<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						{ordenadas.length === 1 ? "1 tarea del movimiento" : `${ordenadas.length} tareas del movimiento`}
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

			<DialogContent sx={{ p: 2.5 }} data-testid="movement-tasks-list">
				{ordenadas.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						Este movimiento no tiene tareas.
					</Typography>
				) : (
					<Stack spacing={1.25}>
						{ordenadas.map((task) => {
							const done = esCompletada(task);
							return (
								<Box
									key={task._id}
									sx={{
										p: 1.5,
										borderRadius: 1.25,
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
										bgcolor: theme.palette.background.paper,
										opacity: done || task.status === "cancelada" ? 0.72 : 1,
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
												bgcolor: alpha(done ? LIVE_GREEN : BRAND_BLUE, isDark ? 0.16 : 0.08),
												color: done ? LIVE_GREEN : BRAND_BLUE,
												flexShrink: 0,
											}}
										>
											{done ? <TickCircle size={14} variant="Bulk" /> : <TaskSquare size={14} variant="Bulk" />}
										</Box>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Typography
												sx={{
													fontSize: "0.9rem",
													fontWeight: 600,
													letterSpacing: "-0.005em",
													textDecoration: done ? "line-through" : "none",
												}}
											>
												{task.name}
											</Typography>
											<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ my: 0.5 }}>
												{venceChip(task)}
												<Chip
													size="small"
													variant="outlined"
													label={STATUS_LABEL[task.status || ""] || (done ? "Completada" : "Pendiente")}
													sx={{ fontWeight: 600 }}
												/>
												{task.priority && PRIORITY_LABEL[task.priority] ? (
													<Typography variant="caption" color="text.secondary">
														Prioridad {PRIORITY_LABEL[task.priority].toLowerCase()}
													</Typography>
												) : null}
											</Stack>
											{task.description ? (
												<Typography
													sx={{
														fontSize: "0.82rem",
														color: "text.secondary",
														lineHeight: 1.55,
														whiteSpace: "pre-wrap",
														wordBreak: "break-word",
													}}
												>
													{task.description}
												</Typography>
											) : null}
										</Box>
									</Stack>
								</Box>
							);
						})}
					</Stack>
				)}
				<Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 2 }}>
					Todas las tareas del expediente están en Actividad → Tareas.
				</Typography>
			</DialogContent>

			<DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				{onAddTask ? (
					<Button
						onClick={() => {
							onClose();
							onAddTask();
						}}
						sx={{ textTransform: "none", fontWeight: 600, color: LIVE_GREEN }}
					>
						Nueva tarea
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

export default MovementTasksDialog;
