import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { Zoom } from "@mui/material";

import { dispatch } from "store";
import { scbaSyncReset } from "store/reducers/scbaSync";
import { pjnSyncReset } from "store/reducers/pjnSync";
import { invalidateScbaCredentialErrorCache } from "hooks/useScbaCredentialError";
import { invalidatePjnCredentialErrorCache } from "hooks/usePjnCredentialError";

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
	const scbaDeferredAt = useSelector((state: any) => state.scbaSync.deferredAt);
	const scbaDeferredMessage = useSelector((state: any) => state.scbaSync.deferredMessage);
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

	// Fase `deferred` SCBA: el worker no pudo entrar al portal pero la credencial
	// sigue habilitada y va a reintentar sola. Aviso amarillo, sin invalidar el
	// cache de error de los chips (no hay "Sincronización pausada").
	useEffect(() => {
		if (!scbaDeferredAt || !scbaDeferredMessage) return;
		enqueueSnackbar(`SCBA: ${scbaDeferredMessage}`, {
			variant: "warning",
			anchorOrigin: { vertical: "bottom", horizontal: "right" },
			TransitionComponent: Zoom,
			autoHideDuration: 8000,
		});
		dispatch(scbaSyncReset());
	}, [scbaDeferredAt, scbaDeferredMessage, enqueueSnackbar]);

	useEffect(() => {
		if (!pjnHasError || !pjnErrorMessage) return;
		enqueueSnackbar(`PJN: ${pjnErrorMessage}`, {
			variant: "error",
			anchorOrigin: { vertical: "bottom", horizontal: "right" },
			TransitionComponent: Zoom,
			autoHideDuration: 6000,
		});
		// Invalidar cache para que los chips/pills de folders PJN pidan el
		// estado actualizado y muestren "Sincronización pausada".
		invalidatePjnCredentialErrorCache();
		dispatch(pjnSyncReset());
	}, [pjnHasError, pjnErrorMessage, enqueueSnackbar]);

	return null;
};

export default GlobalSyncErrorListener;
