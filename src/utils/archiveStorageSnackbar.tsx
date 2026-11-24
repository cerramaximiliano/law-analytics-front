import { Button } from "@mui/material";
import { closeSnackbar, enqueueSnackbar } from "notistack";

import { trackUpgradeCtaClick } from "utils/gtm";

export const ARCHIVE_STORAGE_PLANS_SOURCE = "archive_storage_limit";

/** El hub rechazó un archivado porque no entra en el almacenamiento del plan (code STORAGE_LIMIT). */
export const isArchiveStorageError = (result: { code?: string } | null | undefined): boolean => result?.code === "STORAGE_LIMIT";

/**
 * Aviso de archivado rechazado por falta de almacenamiento, con «Ver planes». Usa notistack (el snackbar de
 * redux no admite acciones). El mensaje viene del hub con los números (cuántos entran, MB usados y del plan).
 */
export const showArchiveStorageSnackbar = (message: string | undefined, navigate: (to: string) => void) => {
	enqueueSnackbar(message || "No hay almacenamiento en tu plan para archivar más. Pasá a un plan con más almacenamiento.", {
		variant: "default",
		anchorOrigin: { vertical: "bottom", horizontal: "right" },
		autoHideDuration: 10000,
		action: (key) => (
			<Button
				size="small"
				onClick={() => {
					closeSnackbar(key);
					trackUpgradeCtaClick(ARCHIVE_STORAGE_PLANS_SOURCE);
					navigate(`/suscripciones/tables?source=${ARCHIVE_STORAGE_PLANS_SOURCE}`);
				}}
				sx={{ color: "inherit", textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
			>
				Ver planes
			</Button>
		),
	});
};
