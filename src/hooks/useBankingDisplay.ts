import { useContext } from "react";
import AuthContext from "contexts/ServerContext";

/**
 * Hook to determine if international banking data should be displayed
 *
 * @returns {boolean} false if banking data should be hidden, true if it should be shown
 */
const useBankingDisplay = (): boolean => {
	const authContext = useContext(AuthContext);

	// If context is not available yet, default to hiding banking data for safety
	if (!authContext) {
		return false;
	}

	// Return the inverse of hideInternationalBankingData (i.e., return true if banking data should be shown)
	return !authContext.hideInternationalBankingData;
};

export default useBankingDisplay;
