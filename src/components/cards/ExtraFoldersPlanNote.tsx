/**
 * Línea «¿Necesitás más causas?» bajo los recursos del plan Premium: ofrece el add-on
 * «Causas adicionales» (bloques de +250 causas / +100 MB). Solo se muestra si el catálogo
 * público lo marca `available` (interruptor de venta services.extraFolders + precio en Stripe).
 * La compra se hace desde Cuenta → Suscripción con Premium activo: acá solo se informa.
 */
import { Box, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { AddCircle } from "iconsax-react";

import { usePublicAddons } from "hooks/usePublicAddons";
import { formatMonthlyPrice } from "utils/mcpBannerCopy";

export const EXTRA_FOLDERS_PLAN_ID = "premium";

const ExtraFoldersPlanNote = () => {
	const theme = useTheme();
	const { addons } = usePublicAddons();
	const addon = addons.find((a) => a.key === "extra_folders");
	const price = addon ? formatMonthlyPrice(addon.priceMonthly, addon.currency) : null;
	if (!addon?.available || !price || !addon.block) return null;

	return (
		<Box
			data-testid="extra-folders-plan-note"
			sx={{
				display: "flex",
				alignItems: "flex-start",
				gap: 1,
				mt: 1.5,
				p: 1.25,
				borderRadius: 1.5,
				bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.05),
			}}
		>
			<Box sx={{ flexShrink: 0, mt: "2px", lineHeight: 0 }}>
				<AddCircle size={16} variant="Bulk" color={theme.palette.primary.main} />
			</Box>
			<Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, lineHeight: 1.5 }}>
				<Box component="span" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
					¿Necesitás más causas?
				</Box>{" "}
				Sumá bloques de +{addon.block.folders} causas y +{addon.block.storage} MB por {price} cada uno.
			</Typography>
		</Box>
	);
};

export default ExtraFoldersPlanNote;
