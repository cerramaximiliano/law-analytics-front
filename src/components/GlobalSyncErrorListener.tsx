import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { Zoom } from "@mui/material";

import { dispatch } from "store";
import { scbaSyncReset } from "store/reducers/scbaSync";
import { pjnSyncReset } from "store/reducers/pjnSync";
import { invalidateScbaCredentialErrorCache } from "hooks/useScbaCredentialError";

/**
 * Escucha errores de sincronización (SCBA, PJN) a nivel global y dispara
 * el snackbar desde cualquier ruta. Sin esto, el snackbar solo aparece si
 * `ScbaAccountConnect` / `PjnAccountConnect` están montados — el user que
 * está laburando en otra vista nunca se entera del error en vivo.
 *
 * Hace reset del slice inmediatamente tras mostrar para que `hasError`
 * vuelva a false; el próximo error real dispara de nuevo cuando el slice
 * pasa de false → true. Los componentes locales mantienen su lógica de
 * refresh + stopPolling pero ya no llaman `enqueueSnackbar` (lo hace este
 * listener para evitar duplicado).
 */
const GlobalSyncErrorListener = () => {
	const scbaHasError = useSelector((state: any) => state.scbaSync.hasError);
	const scbaErrorMessage = useSelector((state: any) => state.scbaSync.errorMessage);
	const pjnHasError = useSelector((state: any) => state.pjnSync.hasError);
	const pjnErrorMessage = useSelector((state: any) => state.pjnSync.errorMessage);
	const { enqueueSnackbar } = useSnackbar();

	useEffect(() => {
		if (!scbaHasError || !scbaErrorMessage) return;
		enqueueSnackbar(`SCBA: ${scbaErrorMessage}`, {
			variant: "error",
			anchorOrigin: { vertical: "bottom", horizontal: "right" },
			TransitionComponent: Zoom,
			autoHideDuration: 6000,
		});
		// Invalidar cache para que los chips/pills de folders SCBA pidan el
		// estado actualizado y muestren "Sincronización pausada".
		invalidateScbaCredentialErrorCache();
		dispatch(scbaSyncReset());
	}, [scbaHasError, scbaErrorMessage, enqueueSnackbar]);

	useEffect(() => {
		if (!pjnHasError || !pjnErrorMessage) return;
		enqueueSnackbar(`PJN: ${pjnErrorMessage}`, {
			variant: "error",
			anchorOrigin: { vertical: "bottom", horizontal: "right" },
			TransitionComponent: Zoom,
			autoHideDuration: 6000,
		});
		dispatch(pjnSyncReset());
	}, [pjnHasError, pjnErrorMessage, enqueueSnackbar]);

	return null;
};

export default GlobalSyncErrorListener;
