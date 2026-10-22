import { useEffect, useRef, useState } from "react";

// material-ui
import { Box, IconButton, Link } from "@mui/material";

// third-party
import { CloseCircle } from "iconsax-react";

// project-imports
import {
	APP_ICON_SRC,
	GOOGLE_PLAY_BADGE_SRC,
	dismissAppBanner,
	playStoreUrl,
	shouldShowAppBanner,
	trackAppDownloadClick,
} from "utils/appDownload";

const BANNER_CSS_VAR = "--app-banner-h";

/**
 * Aviso de descarga de la app en las páginas públicas, solo para visitantes con Android
 * (`shouldShowAppBanner`: tampoco a quien llegó desde la app ni a quien lo cerró hace < 7 días).
 *
 * Va fijo arriba, debajo del banner de descuento si lo hay (--discount-banner-h). Publica su
 * altura en --app-banner-h: el AppBar se corre con ella, y el body se corre con padding-top para
 * que ninguna página pública quede tapada sin tocar cada una.
 */
const AndroidAppBanner = () => {
	const [visible, setVisible] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setVisible(shouldShowAppBanner());
	}, []);

	useEffect(() => {
		if (!visible || !rootRef.current) return;
		const el = rootRef.current;
		const root = document.documentElement;
		const body = document.body;
		const previousPadding = body.style.paddingTop;

		const sync = () => {
			root.style.setProperty(BANNER_CSS_VAR, `${el.offsetHeight}px`);
			body.style.paddingTop = `${el.offsetHeight}px`;
		};
		sync();
		const ro = new ResizeObserver(sync);
		ro.observe(el);

		return () => {
			ro.disconnect();
			root.style.removeProperty(BANNER_CSS_VAR);
			body.style.paddingTop = previousPadding;
		};
	}, [visible]);

	if (!visible) return null;

	const close = () => {
		dismissAppBanner();
		setVisible(false);
	};

	return (
		<Box
			ref={rootRef}
			role="region"
			aria-label="Descargá la app para Android"
			sx={{
				position: "fixed",
				top: "var(--discount-banner-h, 0px)",
				left: 0,
				right: 0,
				zIndex: (t) => t.zIndex.appBar + 1,
				display: "flex",
				alignItems: "center",
				gap: 1.25,
				px: 1.5,
				py: 1,
				bgcolor: "#f4f6fb",
				borderBottom: "1px solid #e3e8f2",
				color: "#232d4f",
			}}
		>
			<IconButton size="small" aria-label="Cerrar aviso de la app" onClick={close} sx={{ color: "#6e6e6e", flexShrink: 0 }}>
				<CloseCircle size={20} />
			</IconButton>
			<Box component="img" src={APP_ICON_SRC} alt="" sx={{ width: 44, height: 44, borderRadius: "11px", flexShrink: 0 }} />
			<Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
				<Box component="span" sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
					Law Analytics
				</Box>
				<Box component="span" sx={{ fontSize: 12, color: "#5a6378", lineHeight: 1.3 }}>
					Tus causas y novedades con notificaciones
				</Box>
			</Box>
			<Link
				href={playStoreUrl("banner")}
				target="_blank"
				rel="noopener"
				onClick={() => trackAppDownloadClick("banner")}
				sx={{ display: "flex", flexShrink: 0, mr: -0.5 }}
			>
				<Box
					component="img"
					src={GOOGLE_PLAY_BADGE_SRC}
					alt="Descargar en Google Play"
					sx={{ height: 44, width: "auto", display: "block" }}
				/>
			</Link>
		</Box>
	);
};

export default AndroidAppBanner;
