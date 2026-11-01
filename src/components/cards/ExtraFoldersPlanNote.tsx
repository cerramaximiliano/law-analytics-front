/**
 * Línea «¿Necesitás más causas?» bajo los recursos del plan Premium: ofrece el add-on
 * «Causas adicionales» (bloques de +250 causas / +100 MB).
 *
 * Sin `canManage` (landing, /plans, usuario con otro plan) solo informa, si el catálogo público lo
 * marca `available` (interruptor de venta services.extraFolders + precio en Stripe): la acción es
 * contratar Premium. Con `canManage` (Premium es el plan actual) manda el estado del hub y se
 * contrata ahí mismo, en un diálogo con los mismos controles de Cuenta → Suscripción.
 */
import { useCallback, useEffect, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useMediaQuery } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { AddCircle } from "iconsax-react";

import { usePublicAddons } from "hooks/usePublicAddons";
import ApiService, { type ExtraFoldersStatus } from "store/reducers/ApiService";
import ExtraFoldersManager, {
	EXTRA_FOLDERS_NAME,
	INELIGIBLE_COPY,
	blocksLabel,
	extraFoldersSubtitle,
	isExtraFoldersVisible,
	limitLabel,
} from "sections/addons/ExtraFoldersManager";
import { formatMonthlyPrice } from "utils/mcpBannerCopy";

export const EXTRA_FOLDERS_PLAN_ID = "premium";

interface ExtraFoldersPlanNoteProps {
	/** Premium es el plan actual del usuario: puede contratar o administrar bloques desde acá. */
	canManage?: boolean;
}

const ExtraFoldersPlanNote = ({ canManage = false }: ExtraFoldersPlanNoteProps) => {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
	const { addons } = usePublicAddons();
	const [status, setStatus] = useState<ExtraFoldersStatus | null>(null);
	const [open, setOpen] = useState(false);

	const load = useCallback(async () => {
		try {
			setStatus(await ApiService.getExtraFolders());
		} catch {
			setStatus(null); // fail-soft: queda el texto informativo, sin botón
		}
	}, []);

	useEffect(() => {
		if (canManage) load();
	}, [canManage, load]);

	const addon = addons.find((a) => a.key === "extra_folders");
	const catalogPrice = addon ? formatMonthlyPrice(addon.priceMonthly, addon.currency) : null;
	const offer =
		addon?.available && catalogPrice && addon.block
			? `bloques de +${addon.block.folders} causas y +${addon.block.storage} MB por ${catalogPrice} cada uno.`
			: null;

	let lead: string | null = "¿Necesitás más causas?";
	let text: string | null = offer && `Con Premium podés sumar ${offer}`;
	let buttonLabel: string | null = null;

	if (canManage) {
		text = offer && `Sumá ${offer}`;
		if (status) {
			// Con el estado del hub manda él, también si la venta al público está cerrada.
			if (!isExtraFoldersVisible(status)) return null;
			const price = status.price ? formatMonthlyPrice(status.price.amount, status.price.currency) : null;
			const hasBlocks = status.blocks.counted > 0;
			const notice = status.eligibilityReason ? INELIGIBLE_COPY[status.eligibilityReason] : status.maintenanceMessage;
			if (hasBlocks) {
				lead = null;
				text = `Tenés ${blocksLabel(status.blocks.counted)}: ${limitLabel(status.folders.limit)} causas activas en total.`;
			} else if (price) {
				text = `Sumá bloques de +${status.block.folders} causas y +${status.block.storage} MB por ${price} cada uno.`;
			}
			if (notice) text = hasBlocks ? `${text} ${notice}` : notice;
			if (status.canIncrease || status.canDecrease) buttonLabel = hasBlocks ? "Administrar bloques" : "Sumar bloques";
		}
	}
	if (!text) return null;

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
			<Box sx={{ minWidth: 0 }}>
				<Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, lineHeight: 1.5 }}>
					{lead && (
						<>
							<Box component="span" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
								{lead}
							</Box>{" "}
						</>
					)}
					{text}
				</Typography>
				{buttonLabel && (
					<Button
						size="small"
						variant="outlined"
						onClick={() => setOpen(true)}
						data-testid="extra-folders-plan-note-action"
						sx={{ mt: 1, minHeight: { xs: 44, sm: 32 } }}
					>
						{buttonLabel}
					</Button>
				)}
			</Box>

			{status && (
				<Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={fullScreen}>
					<DialogTitle>
						{EXTRA_FOLDERS_NAME}
						<Typography component="span" sx={{ display: "block", fontSize: "0.82rem", color: "text.secondary" }}>
							{extraFoldersSubtitle(status)}
						</Typography>
					</DialogTitle>
					<DialogContent>
						<ExtraFoldersManager
							status={status}
							onChanged={async () => {
								await load();
								setOpen(false);
							}}
						/>
					</DialogContent>
					<DialogActions>
						<Button color="inherit" onClick={() => setOpen(false)}>
							Cerrar
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</Box>
	);
};

export default ExtraFoldersPlanNote;
