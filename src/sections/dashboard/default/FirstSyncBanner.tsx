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

	return (
		<Box
			role="status"
			sx={{
				display: "flex",
				alignItems: { xs: "flex-start", sm: "center" },
				gap: 1.5,
				px: { xs: 2, sm: 2.5 },
				py: { xs: 1.75, sm: 1.5 },
				borderRadius: 1.5,
				bgcolor: alpha(LIVE_GREEN, isDark ? 0.1 : 0.06),
				border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.24)}`,
			}}
		>
			<Box
				sx={{
					width: 32,
					height: 32,
					borderRadius: "50%",
					bgcolor: LIVE_GREEN,
					color: "#fff",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					boxShadow: `0 4px 12px ${alpha(LIVE_GREEN, 0.32)}`,
				}}
			>
				<TickCircle size={20} variant="Bold" color="#fff" />
			</Box>

			<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
				<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary", textWrap: "balance" }}>
					Tu primera causa ya tiene {movs} {movs === 1 ? "movimiento" : "movimientos"}
				</Typography>
				<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
					{folder.folderName ? `${folder.folderName}. ` : ""}A partir de ahora te avisamos de cada novedad que aparezca en el portal.
				</Typography>
			</Stack>

			<Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
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
				<IconButton size="small" aria-label="Cerrar aviso" onClick={markSeen} sx={{ color: "text.secondary" }}>
					<CloseCircle size={18} variant="Bulk" />
				</IconButton>
			</Stack>
		</Box>
	);
};

export default FirstSyncBanner;
