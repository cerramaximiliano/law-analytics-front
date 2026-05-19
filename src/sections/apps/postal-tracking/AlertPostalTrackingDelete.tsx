import React from "react";
import { Box, Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import { PopupTransition } from "components/@extended/Transitions";
import { BRAND_BLUE } from "themes/dashboardTokens";

// assets
import { Trash } from "iconsax-react";

interface Props {
	numberId: string;
	open: boolean;
	handleClose: (confirmed: boolean) => void;
}

export default function AlertPostalTrackingDelete({ numberId, open, handleClose }: Props) {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;

	return (
		<Dialog
			open={open}
			onClose={() => handleClose(false)}
			keepMounted
			TransitionComponent={PopupTransition}
			maxWidth="xs"
			fullWidth
			aria-labelledby="postal-tracking-delete-title"
			aria-describedby="postal-tracking-delete-description"
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
							id="postal-tracking-delete-title"
							sx={{
								fontSize: "1.05rem",
								fontWeight: 600,
								letterSpacing: "-0.015em",
								color: "text.primary",
								textAlign: "center",
								textWrap: "balance",
							}}
						>
							¿Eliminar este seguimiento?
						</Typography>
						<Typography
							id="postal-tracking-delete-description"
							sx={{
								fontSize: "0.85rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								textAlign: "center",
								textWrap: "pretty",
							}}
						>
							Vas a eliminar el seguimiento{" "}
							<Box component="span" sx={{ fontWeight: 600, color: "text.primary", fontFamily: "monospace" }}>
								"{numberId}"
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
							onClick={() => handleClose(true)}
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
