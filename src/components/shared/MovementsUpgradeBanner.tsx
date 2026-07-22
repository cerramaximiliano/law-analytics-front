import React from "react";
import { Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

// ==============================|| BANNER UNIFICADO DE UPGRADE (MOVIMIENTOS) ||============================== //
//
// Banner ÚNICO de "plan free con preview limitado" para todas las vistas de
// movimientos: viewer PJN, tabla clásica (MEV/SCBA/EJE) y Vista combinada.
// Rediseño 2026-07: una sola línea densa info-tinted + CTA "Ver planes".
// Si tocás el copy o el estilo, cambia en todas las vistas a la vez — esa es
// la gracia (antes había dos banners distintos con copys distintos).

const PLAN_LABELS: Record<string, string> = {
	standard: "Estándar",
	pro: "Pro",
	premium: "Premium",
};

interface MovementsUpgradeBannerProps {
	// Cuántos movimientos se están mostrando (preview free).
	previewCount?: number | null;
	// Total real de movimientos de la causa.
	totalMovements?: number | null;
	// Planes que desbloquean (del server); default = los 3 pagos.
	requiredPlans?: string[] | null;
	// Sufijo opcional de lo que desbloquea (ej. " y los PDF" en el viewer PJN).
	unlockSuffix?: string;
}

const MovementsUpgradeBanner: React.FC<MovementsUpgradeBannerProps> = ({
	previewCount,
	totalMovements,
	requiredPlans,
	unlockSuffix = "",
}) => {
	const navigate = useNavigate();

	const names = (requiredPlans && requiredPlans.length > 0 ? requiredPlans : ["standard", "pro", "premium"]).map(
		(p) => PLAN_LABELS[p] || p.charAt(0).toUpperCase() + p.slice(1),
	);
	const planText = names.length > 1 ? `${names.slice(0, -1).join(", ")} o ${names[names.length - 1]}` : names[0];

	const countText =
		previewCount != null && totalMovements != null && totalMovements > previewCount
			? `Estás viendo los últimos ${previewCount} de ${totalMovements.toLocaleString("es-AR")} movimientos. `
			: "";

	return (
		<Stack
			direction={{ xs: "column", sm: "row" }}
			spacing={1}
			alignItems={{ xs: "flex-start", sm: "center" }}
			justifyContent="space-between"
			sx={(t) => ({
				mb: 1.5,
				px: 1.5,
				py: 0.75,
				borderRadius: 1,
				border: `1px solid ${alpha(t.palette.info.main, 0.3)}`,
				bgcolor: alpha(t.palette.info.main, 0.06),
			})}
		>
			<Typography variant="caption" color="text.secondary">
				{countText}
				Los planes pagos ({planText}) desbloquean el expediente completo{unlockSuffix}.
			</Typography>
			<Button
				size="small"
				variant="outlined"
				color="info"
				onClick={() => navigate("/suscripciones/tables")}
				sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0, py: 0.25 }}
			>
				Ver planes
			</Button>
		</Stack>
	);
};

export default MovementsUpgradeBanner;
