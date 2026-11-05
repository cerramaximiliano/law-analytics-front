/**
 * usePlanCheckoutBlocks — bloques de «Causas adicionales» elegidos en la tarjeta de Premium
 * para contratarlos en el mismo checkout que el plan (y el conector de IA, si se marcó).
 * Solo para usuarios logueados sin plan pago; la lógica pura vive en utils/planCheckoutBlocks.
 */

import { useCallback, useEffect, useState } from "react";

import useAuth from "hooks/useAuth";
import ApiService, { type ExtraFoldersStatus } from "store/reducers/ApiService";
import { clampBlocks, shouldOfferBlocksAtPlanCheckout } from "utils/planCheckoutBlocks";

const usePlanCheckoutBlocks = () => {
	const { isLoggedIn } = useAuth();
	const [status, setStatus] = useState<ExtraFoldersStatus | null>(null);
	const [blocks, setBlocksState] = useState(0);

	const refresh = useCallback(async () => {
		if (!isLoggedIn) {
			setStatus(null);
			return;
		}
		try {
			setStatus(await ApiService.getExtraFolders());
		} catch {
			// Sin estado no se ofrece el selector; el plan se contrata igual.
			setStatus(null);
		}
	}, [isLoggedIn]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const offer = shouldOfferBlocksAtPlanCheckout(status, !!isLoggedIn);
	const maxBlocks = status?.maxBlocks ?? 20;

	const setBlocks = useCallback((n: number) => setBlocksState(clampBlocks(n, maxBlocks)), [maxBlocks]);
	const reset = useCallback(() => setBlocksState(0), []);

	return {
		offer,
		status,
		/** Bloques elegidos (0 si no se ofrece). */
		blocks: offer ? blocks : 0,
		maxBlocks,
		unitPrice: status?.price?.amount ?? null,
		unitCurrency: status?.price?.currency || "usd",
		foldersPerBlock: status?.block.folders ?? 250,
		setBlocks,
		reset,
		refresh,
	};
};

export default usePlanCheckoutBlocks;
