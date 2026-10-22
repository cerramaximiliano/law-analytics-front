import { useEffect, useState } from "react";

// material-ui
import { Box, IconButton, Link, Stack, Typography } from "@mui/material";

// third-party
import { CloseCircle } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import {
	APP_ICON_SRC,
	GOOGLE_PLAY_BADGE_SRC,
	GOOGLE_PLAY_QR_SRC,
	GOOGLE_PLAY_TRADEMARK,
	devicePlatform,
	dismissDashboardAppCard,
	playStoreUrl,
	shouldShowDashboardAppCard,
	trackAppDownloadClick,
	type DevicePlatform,
} from "utils/appDownload";

/**
 * Oferta de la app en el panel, después del registro (2026-10-22): se registra en la web (la
 * conversión y la atribución de campañas quedan medidas) y después se le ofrece la app. El panel
 * la muestra recién cuando el usuario ya tiene una carpeta: antes, lo único es cargar la primera
 * causa. Android: insignia. Computadora: insignia y QR. iPhone: no se muestra.
 */
const DashboardAppCard = () => {
	const [platform, setPlatform] = useState<DevicePlatform | null>(null);
	useEffect(() => {
		if (shouldShowDashboardAppCard()) setPlatform(devicePlatform());
	}, []);
	if (!platform) return null;

	const close = () => {
		dismissDashboardAppCard();
		setPlatform(null);
	};
	const placement = "dashboard" as const;

	return (
		<MainCard content={false} sx={{ p: { xs: 2, sm: 2.5 }, position: "relative" }}>
			<IconButton size="small" aria-label="Cerrar" onClick={close} sx={{ position: "absolute", top: 8, right: 8, color: "text.secondary" }}>
				<CloseCircle size={20} />
			</IconButton>
			<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ pr: 4 }}>
				<Box component="img" src={APP_ICON_SRC} alt="" sx={{ width: 48, height: 48, borderRadius: "12px", flexShrink: 0 }} />
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography variant="h5" sx={{ mb: 0.5 }}>
						Recibí las novedades de tus causas al instante
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Con la app para Android te llega una notificación con cada movimiento nuevo.
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
						{GOOGLE_PLAY_TRADEMARK}
					</Typography>
				</Box>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
					<Link
						href={playStoreUrl(placement)}
						target="_blank"
						rel="noopener"
						onClick={() => trackAppDownloadClick(placement)}
						sx={{ display: "flex", ml: -0.75 }}
					>
						<Box
							component="img"
							src={GOOGLE_PLAY_BADGE_SRC}
							alt="Descargar en Google Play"
							sx={{ height: 52, width: "auto", display: "block" }}
						/>
					</Link>
					{platform === "desktop" && (
						<Box
							component="img"
							src={GOOGLE_PLAY_QR_SRC}
							alt="Código QR para abrir Law Analytics en Google Play desde el teléfono"
							sx={{ width: 72, height: 72, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "#fff", p: 0.5 }}
						/>
					)}
				</Stack>
			</Stack>
		</MainCard>
	);
};

export default DashboardAppCard;
