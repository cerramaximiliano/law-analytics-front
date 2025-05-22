import { store } from "../store";
import { Subscription } from "../types/user";

/**
 * Gets the user's current subscription from Redux state
 * @returns The user's subscription or null if not available
 */
export const getCurrentSubscription = (): Subscription | null => {
	const state = store.getState();
	return state.auth.subscription || null;
};

/**
 * Checks if a feature is available in the user's current subscription
 * @param featureName The name of the feature to check
 * @returns Boolean indicating if the feature is available
 */
export const hasFeature = (featureName: keyof Subscription["features"]): boolean => {
	const subscription = getCurrentSubscription();

	if (!subscription || !subscription.features) {
		return false;
	}

	return !!subscription.features[featureName];
};

/**
 * Gets the limit value for a specific resource
 * @param limitName The name of the limit to check
 * @returns The limit value or 0 if not available
 */
export const getLimit = (limitName: keyof Subscription["limits"]): number => {
	const subscription = getCurrentSubscription();

	if (!subscription || !subscription.limits) {
		return 0;
	}

	return subscription.limits[limitName] || 0;
};

/**
 * Checks if a resource has reached its limit
 * @param limitName The name of the limit to check
 * @param currentValue The current value to compare against the limit
 * @returns Boolean indicating if the limit has been reached
 */
export const hasReachedLimit = (limitName: keyof Subscription["limits"], currentValue: number): boolean => {
	const limitValue = getLimit(limitName);

	// If limit is 0 or negative, it means unlimited
	if (limitValue <= 0) {
		return false;
	}

	return currentValue >= limitValue;
};

/**
 * Gets the percentage of a limit that has been used
 * @param limitName The name of the limit to check
 * @param currentValue The current value to compare against the limit
 * @returns Percentage of the limit that has been used (0-100)
 */
export const getLimitUsagePercentage = (limitName: keyof Subscription["limits"], currentValue: number): number => {
	const limitValue = getLimit(limitName);

	// If limit is 0 or negative, it means unlimited
	if (limitValue <= 0) {
		return 0;
	}

	const percentage = (currentValue / limitValue) * 100;
	return Math.min(Math.max(percentage, 0), 100); // Ensure value is between 0-100
};

/**
 * Checks if the subscription is active
 * @returns Boolean indicating if the subscription is active
 */
export const isSubscriptionActive = (): boolean => {
	const subscription = getCurrentSubscription();
	return subscription?.status === "active";
};

/**
 * Gets the subscription plan name
 * @returns The subscription plan name or null if not available
 */
export const getSubscriptionPlan = (): string | null => {
	const subscription = getCurrentSubscription();
	return subscription?.plan || null;
};

/**
 * Checks if the subscription is in trial period
 * @returns Boolean indicating if the subscription is in trial period
 */
export const isInTrialPeriod = (): boolean => {
	const subscription = getCurrentSubscription();

	if (!subscription || !subscription.trialEnd) {
		return false;
	}

	const now = new Date();
	const trialEnd = new Date(subscription.trialEnd);

	return now < trialEnd;
};

/**
 * Gets the number of days left in the current subscription period
 * @returns Number of days left or null if no subscription
 */
export const getDaysLeftInPeriod = (): number | null => {
	const subscription = getCurrentSubscription();

	if (!subscription || !subscription.currentPeriodEnd) {
		return null;
	}

	const now = new Date();
	const endDate = new Date(subscription.currentPeriodEnd);
	const diffTime = endDate.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return Math.max(0, diffDays);
};

/**
 * Gets the number of days left in the trial period
 * @returns Number of days left or null if not in trial
 */
export const getDaysLeftInTrial = (): number | null => {
	const subscription = getCurrentSubscription();

	if (!subscription || !subscription.trialEnd) {
		return null;
	}

	const now = new Date();
	const trialEnd = new Date(subscription.trialEnd);

	if (now > trialEnd) {
		return 0;
	}

	const diffTime = trialEnd.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return diffDays;
};

/**
 * Checks if the user can upgrade from their current plan
 * @returns Boolean indicating if the user can upgrade
 */
export const canUpgrade = (): boolean => {
	const subscription = getCurrentSubscription();

	// If no subscription, they can upgrade
	if (!subscription) {
		return true;
	}

	// Can't upgrade if not active
	if (subscription.status !== "active") {
		return false;
	}

	// Can't upgrade from premium
	return subscription.plan !== "premium";
};

/**
 * Checks if the user can create more folders
 * @param currentFolderCount Current number of folders the user has
 * @returns Object with check result and limit info
 */
export const canCreateMoreFolders = (
	currentFolderCount: number,
): {
	canCreate: boolean;
	limitInfo: {
		resourceType: string;
		plan: string;
		currentCount: string;
		limit: number;
	} | null;
} => {
	const subscription = getCurrentSubscription();

	// If no subscription, we assume they can create folders (should not happen)
	if (!subscription) {
		return {
			canCreate: true,
			limitInfo: null,
		};
	}

	// Get the max folders limit
	const maxFolders = subscription.limits.maxFolders;

	// Check if the user has reached the limit
	const hasReached = hasReachedLimit("maxFolders", currentFolderCount);

	if (hasReached) {
		return {
			canCreate: false,
			limitInfo: {
				resourceType: "Carpetas/Causas",
				plan: subscription.plan,
				currentCount: `${currentFolderCount}`,
				limit: maxFolders,
			},
		};
	}

	return {
		canCreate: true,
		limitInfo: null,
	};
};

/**
 * Checks if the user has access to the vinculateFolders feature
 * @returns Object with check result and feature info
 */
export const canVinculateFolders = (): {
	canAccess: boolean;
	featureInfo: {
		feature: string;
		plan: string;
		availableIn: string[];
	} | null;
} => {
	const subscription = getCurrentSubscription();

	// If no subscription, we assume they don't have access
	if (!subscription) {
		return {
			canAccess: false,
			featureInfo: {
				feature: "Vincular con Poder Judicial",
				plan: "free",
				availableIn: ["standard", "premium"],
			},
		};
	}

	// Check if the vinculateFolders feature is enabled
	const hasAccess = subscription.features.vinculateFolders;

	if (!hasAccess) {
		return {
			canAccess: false,
			featureInfo: {
				feature: "Vincular con Poder Judicial",
				plan: subscription.plan,
				// This feature is available in standard and premium plans
				availableIn: ["standard", "premium"],
			},
		};
	}

	return {
		canAccess: true,
		featureInfo: null,
	};
};
