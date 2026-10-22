import { useEffect, useState } from "react";

// material-ui
import { Box, Link, Stack, Typography } from "@mui/material";

// project-imports
import { GOOGLE_PLAY_BADGE_SRC, playStoreUrl, shouldShowLoginAppHint, trackAppDownloadClick } from "utils/appDownload";

/** Debajo del login, solo en Android: la app con notificaciones como alternativa a la web. */
const LoginAppHint = () => {
	const [visible, setVisible] = useState(false);
	useEffect(() => setVisible(shouldShowLoginAppHint()), []);
	if (!visible) return null;

	return (
		<Stack
			direction="row"
			alignItems="center"
			spacing={1.5}
			sx={{ mt: 1, p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
		>
			<Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
				Seguí tus causas desde el celular.
			</Typography>
			<Link
				href={playStoreUrl("login")}
				target="_blank"
				rel="noopener"
				onClick={() => trackAppDownloadClick("login")}
				sx={{ display: "flex", flexShrink: 0, mr: -0.75 }}
			>
				<Box
					component="img"
					src={GOOGLE_PLAY_BADGE_SRC}
					alt="Descargar en Google Play"
					sx={{ height: 44, width: "auto", display: "block" }}
				/>
			</Link>
		</Stack>
	);
};

export default LoginAppHint;
