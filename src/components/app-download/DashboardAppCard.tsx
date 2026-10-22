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
		<MainCard content={false} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25 }}>
			<Stack direction="row" spacing={1.5} alignItems="center">
				<Box component="img" src={APP_ICON_SRC} alt="" sx={{ width: 36, height: 36, borderRadius: "9px", flexShrink: 0 }} />
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography variant="subtitle1" sx={{ lineHeight: 1.3 }}>
						Recibí las novedades de tus causas al instante
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
						Con la app para Android te llega una notificación con cada movimiento nuevo.
					</Typography>
				</Box>
				<Link
					href={playStoreUrl(placement)}
					target="_blank"
					rel="noopener"
					onClick={() => trackAppDownloadClick(placement)}
					sx={{ display: "flex", flexShrink: 0 }}
				>
					<Box
						component="img"
						src={GOOGLE_PLAY_BADGE_SRC}
						alt="Descargar en Google Play"
						sx={{ height: 40, width: "auto", display: "block" }}
					/>
				</Link>
				{platform === "desktop" && (
					<Box
						component="img"
						src={GOOGLE_PLAY_QR_SRC}
						alt="Código QR para abrir Law Analytics en Google Play desde el teléfono"
						sx={{
							width: 52,
							height: 52,
							borderRadius: 1,
							border: "1px solid",
							borderColor: "divider",
							bgcolor: "#fff",
							p: 0.25,
							flexShrink: 0,
						}}
					/>
				)}
				<IconButton size="small" aria-label="Cerrar" onClick={close} sx={{ color: "text.secondary", flexShrink: 0 }}>
					<CloseCircle size={18} />
				</IconButton>
			</Stack>
		</MainCard>
	);
};

export default DashboardAppCard;
