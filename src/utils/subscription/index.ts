import useSubscription from "../../hooks/useSubscription";
import * as subscriptionUtils from "../subscriptionUtils";

export { subscriptionUtils, useSubscription };

// Export individual utility functions for convenience
export const {
	getCurrentSubscription,
	hasFeature,
	getLimit,
	hasReachedLimit,
	getLimitUsagePercentage,
	isSubscriptionActive,
	getSubscriptionPlan,
} = subscriptionUtils;
