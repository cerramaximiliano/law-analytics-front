import React from "react";
import { Box, Button, Dialog, DialogContent, Stack, Typography, Zoom } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import { PopupTransition } from "components/@extended/Transitions";
import { BRAND_BLUE } from "themes/dashboardTokens";

// assets
import { Trash } from "iconsax-react";
import { dispatch } from "store";
import { deleteFolderById } from "store/reducers/folder";
import { useContext, useEffect } from "react";
import AuthContext from "contexts/ServerContext";
import { enqueueSnackbar } from "notistack";

// types
import { PropsAlert } from "types/folders";

// ==============================|| FOLDER - DELETE ||============================== //

export default function AlertFolderDelete({ title, open, handleClose, id, onDelete }: PropsAlert) {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const authContext = useContext(AuthContext);

	const handleClick = async () => {
		if (authContext && authContext.hasPlanRestrictionError) {
			handleClose(false);
			return;
		}
		handleClose(true);
		if (id) {
			const result = await dispatch(deleteFolderById(id));
			if (result.success) {
				enqueueSnackbar("Causa eliminada correctamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			} else {
				enqueueSnackbar(result.message || "Error al eliminar la causa", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
			if (onDelete) onDelete();
		}
	};

	useEffect(() => {
		if (open && authContext && authContext.hasPlanRestrictionError) handleClose(false);

		const handlePlanRestriction = () => {
			if (open) handleClose(false);
		};

		const checkGlobalFlag = () => {
			if ((window as any).FORCE_CLOSE_ALL_MODALS && open) handleClose(false);
		};

		window.addEventListener("planRestrictionError", handlePlanRestriction);
		const intervalId = setInterval(checkGlobalFlag, 200);

		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
			clearInterval(intervalId);
		};
	}, [open, authContext, handleClose]);

	return (
		<Dialog
			open={open}
			onClose={() => handleClose(false)}
			keepMounted
			TransitionComponent={PopupTransition}
			maxWidth="xs"
			fullWidth
			aria-labelledby="folder-delete-title"
			aria-describedby="folder-delete-description"
			PaperProps={{
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			<DialogContent sx={{ p: { xs: 3, sm: 3.5 }, position: "relative" }}>
				<Box
					sx={{
						position: "absolute",
						top: -80,
						left: "50%",
						transform: "translateX(-50%)",
						width: 280,
						height: 280,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(errorColor, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Stack alignItems="center" spacing={2.25} sx={{ position: "relative" }}>
					<Box
						sx={{
							width: 60,
							height: 60,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.2)}`,
							color: errorColor,
						}}
					>
						<Trash size={26} variant="Bulk" />
					</Box>
					<Stack spacing={1} alignItems="center">
						<Typography
							id="folder-delete-title"
							sx={{
								fontSize: "1.05rem",
								fontWeight: 600,
								letterSpacing: "-0.015em",
								color: "text.primary",
								textAlign: "center",
								textWrap: "balance",
							}}
						>
							¿Eliminar esta causa?
						</Typography>
						<Typography
							id="folder-delete-description"
							sx={{
								fontSize: "0.85rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								textAlign: "center",
								textWrap: "pretty",
							}}
						>
							Vas a eliminar{" "}
							<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
								"{title}"
							</Box>{" "}
							de forma permanente. Esta acción no se puede deshacer.
						</Typography>
					</Stack>

					<Stack direction="row" spacing={1.25} sx={{ width: 1, mt: 0.5 }}>
						<Button
							fullWidth
							onClick={() => handleClose(false)}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								color: "text.secondary",
								borderRadius: 1.25,
								py: 1,
								border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
								"&:hover": {
									color: BRAND_BLUE,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
									borderColor: alpha(BRAND_BLUE, 0.28),
								},
							}}
						>
							Cancelar
						</Button>
						<Button
							fullWidth
							onClick={handleClick}
							autoFocus
							variant="contained"
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								bgcolor: errorColor,
								color: "#fff",
								borderRadius: 1.25,
								py: 1,
								boxShadow: "none",
								"&:hover": { bgcolor: alpha(errorColor, 0.88), boxShadow: "none" },
							}}
						>
							Eliminar
						</Button>
					</Stack>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
