import { useEffect, useState } from "react";

// material-ui
import { Box, Link, Stack, Typography } from "@mui/material";

// project-imports
import {
	GOOGLE_PLAY_BADGE_SRC,
	GOOGLE_PLAY_QR_SRC,
	GOOGLE_PLAY_TRADEMARK,
	devicePlatform,
	playStoreUrl,
	trackAppDownloadClick,
	type DevicePlatform,
} from "utils/appDownload";

/**
 * "Llevá tus causas en el bolsillo" en el pie de las páginas públicas: insignia oficial de
 * Google Play y, en computadora, el QR para abrir la ficha desde el teléfono. En iPhone no se
 * muestra (la app es solo Android por ahora).
 */
const AppDownloadFooter = () => {
	// Se decide en el cliente (el UA no existe en el prerender).
	const [platform, setPlatform] = useState<DevicePlatform | null>(null);
	useEffect(() => setPlatform(devicePlatform()), []);

	if (!platform || platform === "ios") return null;

	return (
		<Box sx={{ p: 2.25, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", maxWidth: 420 }}>
			<Typography variant="h5" sx={{ mb: 0.75 }}>
				Llevá tus causas en el bolsillo
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
				Novedades de tus expedientes con notificaciones, en la app para Android.
			</Typography>
			<Stack direction="row" alignItems="center" spacing={2}>
				<Link
					href={playStoreUrl("footer")}
					target="_blank"
					rel="noopener"
					onClick={() => trackAppDownloadClick("footer")}
					sx={{ display: "flex", ml: -0.75 }}
				>
					<Box
						component="img"
						src={GOOGLE_PLAY_BADGE_SRC}
						alt="Descargar en Google Play"
						sx={{ height: 56, width: "auto", display: "block" }}
					/>
				</Link>
				{platform === "desktop" && (
					<Box
						component="img"
						src={GOOGLE_PLAY_QR_SRC}
						alt="Código QR para abrir Law Analytics en Google Play desde el teléfono"
						sx={{ width: 76, height: 76, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "#fff", p: 0.5 }}
					/>
				)}
			</Stack>
			{/* Aviso de marca que piden las reglas de uso de la insignia de Google Play. */}
			<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25 }}>
				{GOOGLE_PLAY_TRADEMARK}
			</Typography>
		</Box>
	);
};

export default AppDownloadFooter;
