import React, { useState } from "react";

// material-ui
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import { BRAND_BLUE, LIVE_GREEN } from "themes/dashboardTokens";
import { OnboardingSignals } from "store/reducers/ApiService";

// icons
import { ArrowRight, CloseCircle, TickCircle } from "iconsax-react";

// hooks
import { useNavigate } from "react-router-dom";

// types
import { ThemeMode } from "types/config";

// ==============================|| DASHBOARD - FIRST SYNC BANNER ||============================== //
// Momento de éxito del onboarding: la primera sincronización de una causa es
// silenciosa por diseño (no avisamos el histórico), así que el usuario conectaba
// su cuenta y la carpeta se llenaba sin que nada se lo dijera. Se muestra una
// sola vez por usuario y carpeta, hasta que el usuario lo cierra.

type FirstSynced = NonNullable<OnboardingSignals["firstSyncedFolder"]>;

interface FirstSyncBannerProps {
	userId?: string;
	folder: FirstSynced;
}

const seenKey = (userId: string | undefined, folderId: string) => `onboarding_first_sync_seen_${userId || "anon"}_${folderId}`;

function wasSeen(key: string): boolean {
	try {
		return localStorage.getItem(key) === "1";
	} catch {
		return false;
	}
}

const FirstSyncBanner = ({ userId, folder }: FirstSyncBannerProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const navigate = useNavigate();
	const key = seenKey(userId, folder.folderId);
	const [dismissed, setDismissed] = useState(() => wasSeen(key));

	if (dismissed || !folder.movementsCount) return null;

	const markSeen = () => {
		try {
			localStorage.setItem(key, "1");
		} catch {
			// sin storage: se vuelve a mostrar en la próxima visita
		}
		setDismissed(true);
	};

	const goToActivity = () => {
		markSeen();
		navigate(`/apps/folders/details/${folder.folderId}?tab=activity`);
	};

	const movs = folder.movementsCount;
	const title = `Tu primera causa ya tiene ${movs} ${movs === 1 ? "movimiento" : "movimientos"}`;

	// Layout: en desktop una sola fila (ícono · texto · acciones). En móvil la fila
	// no entra y cada pieza quedaba apilada en franjas: ahora el título lleva el
	// ícono al lado, la carátula va en una línea con elipsis y las acciones en
	// una fila propia debajo, alineadas a la derecha.
	const dismissButton = (
		<IconButton size="small" aria-label="Cerrar aviso" onClick={markSeen} sx={{ color: "text.secondary" }}>
			<CloseCircle size={18} variant="Bulk" />
		</IconButton>
	);
	const activityButton = (
		<Button
			variant="text"
			size="small"
			onClick={goToActivity}
			endIcon={<ArrowRight size={14} />}
			sx={{
				color: BRAND_BLUE,
				fontWeight: 600,
				fontSize: "0.85rem",
				textTransform: "none",
				whiteSpace: "nowrap",
				"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
			}}
		>
			Ver movimientos
		</Button>
	);

	return (
		<Box
			role="status"
			sx={{
				display: "flex",
				flexDirection: { xs: "column", sm: "row" },
				alignItems: { xs: "stretch", sm: "center" },
				gap: { xs: 0.75, sm: 1.5 },
				px: { xs: 2, sm: 2.5 },
				py: { xs: 1.5, sm: 1.5 },
				borderRadius: 1.5,
				bgcolor: alpha(LIVE_GREEN, isDark ? 0.1 : 0.06),
				border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.24)}`,
			}}
		>
			{/* Ícono grande sólo en desktop; en móvil va embebido en el título */}
			<Box
				sx={{
					display: { xs: "none", sm: "flex" },
					width: 32,
					height: 32,
					borderRadius: "50%",
					bgcolor: LIVE_GREEN,
					color: "#fff",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					boxShadow: `0 4px 12px ${alpha(LIVE_GREEN, 0.32)}`,
				}}
			>
				<TickCircle size={20} variant="Bold" color="#fff" />
			</Box>

			<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<Box sx={{ display: { xs: "inline-flex", sm: "none" }, color: LIVE_GREEN, flexShrink: 0 }}>
						<TickCircle size={20} variant="Bold" color={LIVE_GREEN} />
					</Box>
					<Typography
						sx={{
							flex: 1,
							minWidth: 0,
							fontSize: { xs: "0.875rem", sm: "0.95rem" },
							lineHeight: 1.3,
							fontWeight: 600,
							letterSpacing: "-0.01em",
							color: "text.primary",
						}}
					>
						{title}
					</Typography>
					<Box sx={{ display: { xs: "inline-flex", sm: "none" }, mr: -1 }}>{dismissButton}</Box>
				</Stack>
				{folder.folderName && (
					<Typography
						title={folder.folderName}
						sx={{
							fontSize: "0.85rem",
							color: "text.secondary",
							lineHeight: 1.5,
							whiteSpace: { xs: "nowrap", sm: "normal" },
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{folder.folderName}
					</Typography>
				)}
				<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.5, display: { xs: "none", sm: "block" } }}>
					A partir de ahora te avisamos de cada novedad que aparezca en el portal.
				</Typography>
			</Stack>

			{/* Acciones: fila propia en móvil, al final de la fila en desktop */}
			<Stack
				direction="row"
				alignItems="center"
				spacing={0.5}
				sx={{ flexShrink: 0, justifyContent: { xs: "flex-end", sm: "flex-start" }, mr: { xs: -1, sm: 0 } }}
			>
				{activityButton}
				<Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>{dismissButton}</Box>
			</Stack>
		</Box>
	);
};

export default FirstSyncBanner;
