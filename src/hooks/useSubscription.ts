import { useSelector } from "react-redux";
import { useMemo } from "react";
import { RootState } from "../store";
import { Subscription } from "../types/user";
import * as subscriptionUtils from "../utils/subscriptionUtils";
import { useTeam } from "../contexts/TeamContext";

/**
 * Hook to access subscription data and utility functions
 * Supports team mode: when user is part of a team, features are inherited from the team owner's subscription
 */
const useSubscription = () => {
	// Get personal subscription directly from Redux store
	const personalSubscription = useSelector((state: RootState) => state.auth.subscription);

	// Get team context for feature inheritance
	const { isTeamMode, ownerSubscription, isOwner } = useTeam();

	// Determine the effective subscription to use for feature checks
	// In team mode (for non-owners), use the owner's subscription features
	const effectiveSubscription = useMemo(() => {
		// If in team mode and not the owner, inherit owner's subscription features
		if (isTeamMode && !isOwner && ownerSubscription) {
			return {
				...personalSubscription,
				// Override plan and features with owner's subscription
				plan: ownerSubscription.planName,
				features: ownerSubscription.features,
				status: ownerSubscription.status,
				// Mark this as a team subscription for UI purposes
				isTeamSubscription: true,
				ownerPlanName: ownerSubscription.planName,
			};
		}
		// Otherwise use personal subscription
		return personalSubscription;
	}, [isTeamMode, isOwner, ownerSubscription, personalSubscription]);

	// Return subscription data and utility functions
	return {
		subscription: effectiveSubscription,
		personalSubscription, // Original personal subscription for reference
		isTeamSubscription: isTeamMode && !isOwner,
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
		 * Checks if a feature is available in the effective subscription
		 * In team mode, this checks the owner's subscription features
		 * @param featureName The name of the feature to check
		 * @returns Boolean indicating if the feature is available
		 */
		hasFeatureLocal: (featureName: keyof Subscription["features"] | string): boolean => {
			// In team mode for non-owners, check owner's subscription
			if (isTeamMode && !isOwner && ownerSubscription) {
				return !!ownerSubscription.features?.[featureName];
			}

			// Otherwise check personal subscription
			if (!personalSubscription || !personalSubscription.features) {
				return false;
			}

			return !!personalSubscription.features[featureName as keyof Subscription["features"]];
		},

		/**
		 * Gets the limit value for a specific resource
		 * This version uses the local subscription state instead of getting it from Redux store
		 * @param limitName The name of the limit to check
		 * @returns The limit value or 0 if not available
		 */
		getLimitLocal: (limitName: keyof Subscription["limits"]): number => {
			// For limits, we always use personal subscription as team limits are shared pool
			if (!personalSubscription || !personalSubscription.limits) {
				return 0;
			}

			return personalSubscription.limits[limitName] || 0;
		},
	};
};

export default useSubscription;
