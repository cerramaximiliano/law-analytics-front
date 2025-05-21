import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Subscription } from "../types/user";
import * as subscriptionUtils from "../utils/subscriptionUtils";

/**
 * Hook to access subscription data and utility functions
 */
const useSubscription = () => {
	// Get subscription directly from Redux store
	const subscription = useSelector((state: RootState) => state.auth.subscription);

	// Return subscription data and utility functions
	return {
		subscription,
		hasFeature: subscriptionUtils.hasFeature,
		getLimit: subscriptionUtils.getLimit,
		hasReachedLimit: subscriptionUtils.hasReachedLimit,
		getLimitUsagePercentage: subscriptionUtils.getLimitUsagePercentage,
		isActive: subscriptionUtils.isSubscriptionActive,
		getPlan: subscriptionUtils.getSubscriptionPlan,
		isInTrialPeriod: subscriptionUtils.isInTrialPeriod,
		getDaysLeftInPeriod: subscriptionUtils.getDaysLeftInPeriod,
		getDaysLeftInTrial: subscriptionUtils.getDaysLeftInTrial,
		canUpgrade: subscriptionUtils.canUpgrade,
		canVinculateFolders: subscriptionUtils.canVinculateFolders,

		/**
		 * Checks if a feature is available in the user's current subscription
		 * This version uses the local subscription state instead of getting it from Redux store
		 * @param featureName The name of the feature to check
		 * @returns Boolean indicating if the feature is available
		 */
		hasFeatureLocal: (featureName: keyof Subscription["features"]): boolean => {
			if (!subscription || !subscription.features) {
				return false;
			}

			return !!subscription.features[featureName];
		},

		/**
		 * Gets the limit value for a specific resource
		 * This version uses the local subscription state instead of getting it from Redux store
		 * @param limitName The name of the limit to check
		 * @returns The limit value or 0 if not available
		 */
		getLimitLocal: (limitName: keyof Subscription["limits"]): number => {
			if (!subscription || !subscription.limits) {
				return 0;
			}

			return subscription.limits[limitName] || 0;
		},
	};
};

export default useSubscription;
