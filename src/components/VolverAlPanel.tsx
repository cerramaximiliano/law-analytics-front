import React from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { Box, Button, Typography } from "@mui/material";

// icons
import { ArrowRight } from "iconsax-react";

// project-imports
import { APP_DEFAULT_PATH } from "config";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { trackActivity } from "utils/productAnalytics";

// =============================================================================
// Barra "Ir a mi panel" en las páginas públicas, solo con sesión iniciada (2026-10-23).
//
// En el teléfono, 10 de 19 usuarios nuevos terminaban su primera sesión en /funciones: el
// botón atrás del sistema los devolvía a la página del anuncio, que no ofrecía volver a la
// app. Va fija abajo (fuera del flujo, sin saltos de diseño) y CommonLayout la carga aparte
// solo si hay sesión. Ver la-ads/analysis/2026-10-23-primera-causa-medicion-y-siguiente-iteracion.md
// =============================================================================

const VolverAlPanel = () => (
	<>
		{/* Espacio al final de la página para que la barra no tape el pie */}
		<Box aria-hidden sx={{ height: 76 }} />
		<Box
			role="region"
			aria-label="Volver a tu panel"
			sx={{
				position: "fixed",
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: (t) => t.zIndex.appBar,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 1.5,
				px: 2,
				pt: 1.25,
				pb: "calc(10px + env(safe-area-inset-bottom))",
				bgcolor: "#fff",
				borderTop: "1px solid #e3e8f2",
				boxShadow: "0 -4px 16px rgba(35, 45, 79, 0.08)",
			}}
		>
			<Typography sx={{ fontSize: 14, fontWeight: 600, color: "#232d4f", display: { xs: "none", sm: "block" } }}>
				Ya tenés tu cuenta.
			</Typography>
			<Button
				component={RouterLink}
				to={APP_DEFAULT_PATH}
				onClick={() => trackActivity("onboarding_action", { type: "panel_bar" })}
				variant="contained"
				endIcon={<ArrowRight size={18} />}
				sx={{
					minHeight: 48,
					width: { xs: "100%", sm: "auto" },
					maxWidth: 420,
					px: 3,
					fontSize: "1rem",
					fontWeight: 600,
					borderRadius: 2,
					textTransform: "none",
					bgcolor: BRAND_BLUE,
					boxShadow: "none",
					"&:hover": { bgcolor: BRAND_BLUE, opacity: 0.92, boxShadow: "none" },
				}}
			>
				Ir a mi panel
			</Button>
		</Box>
	</>
);

export default VolverAlPanel;
