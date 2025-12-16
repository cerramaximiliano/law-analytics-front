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
	// Landing page events
	SCROLL_SECTION: "scroll_section",
	CTA_CLICK_HERO: "cta_click_hero",
	CTA_CLICK_CITAS: "cta_click_citas",
	CTA_CLICK_PRUEBA_PAGAR: "cta_click_prueba_pagar",
	FEATURE_INTEREST: "feature_interest",
	HIGH_SCROLL_NO_CTA: "high_scroll_no_cta",
} as const;

// Landing page section names for scroll tracking
export const LandingSections = {
	HERO: "hero",
	HERRAMIENTAS: "herramientas",
	INTEGRACIONES: "integraciones",
	PRUEBA_PAGAR: "prueba_pagar",
	TESTIMONIOS: "testimonios",
	CONTACTO: "contacto",
} as const;

// Feature names for feature_interest tracking
export const FeatureNames = {
	CARPETAS: "carpetas",
	CONTACTOS: "contactos",
	CALENDARIO: "calendario",
	CALCULOS: "calculos",
	INTERESES: "intereses",
	TAREAS: "tareas",
	SISTEMA_CITAS: "sistema_citas",
} as const;

// CTA locations
export const CTALocations = {
	HERO: "hero",
	CITAS: "citas",
	PRUEBA_PAGAR: "prueba_pagar",
} as const;

/**
 * Track scroll to a specific section
 */
export const trackScrollSection = (sectionName: string): void => {
	pushGTMEvent(GTMEvents.SCROLL_SECTION, {
		section_name: sectionName,
	});
};

/**
 * Track CTA click with location
 */
export const trackCTAClick = (eventName: string, location: string): void => {
	pushGTMEvent(eventName, {
		cta_location: location,
	});
};

/**
 * Track feature interest (click on feature card)
 */
export const trackFeatureInterest = (featureName: string): void => {
	pushGTMEvent(GTMEvents.FEATURE_INTEREST, {
		feature: featureName,
	});
};

/**
 * Track high scroll without CTA click (for Instagram traffic analysis)
 */
export const trackHighScrollNoCTA = (source: string): void => {
	pushGTMEvent(GTMEvents.HIGH_SCROLL_NO_CTA, {
		source,
	});
};

/**
 * Get UTM source from URL
 */
export const getUTMSource = (): string | null => {
	if (typeof window === "undefined") return null;
	const params = new URLSearchParams(window.location.search);
	return params.get("utm_source");
};
