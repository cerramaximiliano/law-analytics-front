// Google Tag Manager utility functions

declare global {
	interface Window {
		dataLayer: Record<string, unknown>[];
	}
}

/**
 * Push an event to GTM dataLayer
 * @param eventName - Name of the event (e.g., 'register_complete')
 * @param eventParams - Optional parameters to send with the event
 */
export const pushGTMEvent = (eventName: string, eventParams?: Record<string, unknown>): void => {
	if (typeof window !== "undefined" && window.dataLayer) {
		window.dataLayer.push({
			event: eventName,
			...eventParams,
		});
	}
};

// Pre-defined events for consistency
export const GTMEvents = {
	REGISTER_COMPLETE: "register_complete",
	LOGIN_SUCCESS: "login_success",
	CTA_CLICK: "cta_click",
} as const;
