import React, { useState } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";

// project-imports
import SupportModal from "./SupportModal";
import { BRAND_BLUE } from "themes/dashboardTokens";

// assets
import { MessageQuestion } from "iconsax-react";

// types
import { ThemeMode } from "types/config";

// ==============================|| DRAWER CONTENT - HELP TILE ||============================== //
// Reemplaza el viejo NavCard de "soporte" (avatar genérico + "Respuesta en 24
// horas" sin SLA real). Tile compacta on-brand con un solo CTA — abre el mismo
// SupportModal que existía antes, sin promesas que no podemos garantizar.

const NavCard = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const [openModal, setOpenModal] = useState(false);

	return (
		<>
			<Box sx={{ mx: 2, mb: 2, mt: 1.5 }}>
				<ButtonBase
					onClick={() => setOpenModal(true)}
					aria-label="Abrir soporte"
					sx={{
						width: "100%",
						p: 1.5,
						borderRadius: 1.5,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.16)}`,
						justifyContent: "flex-start",
						gap: 1.25,
						transition: "background-color 180ms, border-color 180ms",
						"&:hover": {
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.09),
							borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.26),
						},
						"&:focus-visible": {
							outline: `2px solid ${BRAND_BLUE}`,
							outlineOffset: 2,
						},
					}}
				>
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: 1,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12),
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						}}
					>
						<MessageQuestion size={18} variant="Bulk" color={BRAND_BLUE} />
					</Box>
					<Stack spacing={0.15} sx={{ minWidth: 0, textAlign: "left" }}>
						<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
							¿Necesitás ayuda?
						</Typography>
						<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							Contactá a soporte
						</Typography>
					</Stack>
				</ButtonBase>
			</Box>

			<SupportModal open={openModal} onClose={() => setOpenModal(false)} variant="dashboard" />
		</>
	);
};

export default NavCard;
