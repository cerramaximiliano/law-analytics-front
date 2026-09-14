import React from "react";
// material-ui
import { Box, Dialog, DialogContent, DialogTitle, Stack, Typography, IconButton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import { TaskSquare, CloseSquare } from "iconsax-react";

// project import
import { PopupTransition } from "components/@extended/Transitions";
import AddEditTask from "./AddEditTask";
import { BRAND_BLUE } from "themes/dashboardTokens";

// types
import { TaskType } from "types/task";

interface Props {
	open: boolean;
	handleClose: () => void;
	task?: TaskType;
	showSnackbar: (message: string, severity: "success" | "error") => void;
}

// ==============================|| TASK MODAL ||============================== //

const TaskModal = ({ open, handleClose, task, showSnackbar }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	return (
		<Dialog
			maxWidth="sm"
			fullWidth
			TransitionComponent={PopupTransition}
			keepMounted
			open={open}
			onClose={handleClose}
			aria-labelledby="task-modal-title"
			PaperProps={{
				sx: {
					borderRadius: 2,
					overflow: "hidden",
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
				},
			}}
		>
			<DialogTitle
				id="task-modal-title"
				sx={{
					position: "relative",
					overflow: "hidden",
					p: { xs: 2.25, sm: 2.5 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				{/* Radial blob */}
				<Box
					sx={{
						position: "absolute",
						top: -60,
						right: -40,
						width: 220,
						height: 220,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				{/* Dot grid */}
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
						backgroundSize: "20px 20px",
						maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						opacity: 0.55,
						pointerEvents: "none",
					}}
				/>

				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<TaskSquare size={20} variant="Bulk" />
					</Box>
					<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction="row" spacing={0.75} alignItems="center">
							<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								{task ? "Editar tarea" : "Nueva tarea"}
							</Typography>
						</Stack>
						<Typography
							sx={{
								fontSize: "1.05rem",
								fontWeight: 600,
								letterSpacing: "-0.015em",
								color: "text.primary",
							}}
						>
							{task ? task.name : "Crear tarea"}
						</Typography>
						<Typography
							sx={{
								fontSize: "0.78rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
							}}
						>
							{task ? "Actualizá los detalles de esta tarea." : "Completá la información para organizar el trabajo."}
						</Typography>
					</Stack>
					<IconButton
						onClick={handleClose}
						sx={{
							color: "text.secondary",
							borderRadius: 1,
							transition: "color 0.15s ease, background-color 0.15s ease",
							"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
						}}
						aria-label="cerrar"
					>
						<CloseSquare size={20} variant="Linear" />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
				<AddEditTask task={task} onCancel={handleClose} showSnackbar={showSnackbar} />
			</DialogContent>
		</Dialog>
	);
};

export default TaskModal;
