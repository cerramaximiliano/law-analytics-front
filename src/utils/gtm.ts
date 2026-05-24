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
	// Feature section events (funnel tracking)
	VIEW_FEATURES_SECTION: "view_features_section",
	// Feature modal events
	FEATURE_MODAL_OPEN: "feature_modal_open",
	FEATURE_MODAL_CLOSE: "feature_modal_close",
	FEATURE_MODAL_SCROLL: "feature_modal_scroll",
	FEATURE_MODAL_CTA_CLICK: "feature_modal_cta_click",
	// Registration funnel events
	REGISTER_VIEW: "register_view",
	REGISTER_FORM_START: "register_form_start",
	REGISTER_FORM_SUBMIT: "register_form_submit",
	REGISTER_FORM_ERROR: "register_form_error",
	SIGN_UP: "sign_up",
	GOOGLE_SIGNUP_CLICK: "google_signup_click",
	// OAuth/MCP server connection events (Phase 2 — pending GTM tags creation)
	OAUTH_LOGIN_VIEW: "oauth_login_view",
	OAUTH_LOGIN_SUBMIT: "oauth_login_submit",
	OAUTH_LOGIN_SUCCESS: "oauth_login_success",
	OAUTH_LOGIN_ERROR: "oauth_login_error",
	OAUTH_CONSENT_VIEW: "oauth_consent_view",
	OAUTH_CONSENT_ACCEPT: "oauth_consent_accept",
	OAUTH_CONSENT_REJECT: "oauth_consent_reject",
	OAUTH_UPGRADE_VIEW: "oauth_upgrade_view",
} as const;

// Landing page section names for scroll tracking
export const LandingSections = {
	HERO: "hero",
	COMO_FUNCIONA: "como_funciona",
	HERRAMIENTAS: "herramientas",
	INTEGRACIONES: "integraciones",
	SEGURIDAD: "seguridad",
	PRUEBA_PAGAR: "prueba_pagar",
	TESTIMONIOS: "testimonios",
	PLANES: "planes",
	FAQ: "faq",
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
	ESCRITOS: "escritos",
	POSTAL_TRACKING: "postal_tracking",
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

/**
 * Track feature modal open
 */
export const trackFeatureModalOpen = (featureName: string): void => {
	pushGTMEvent(GTMEvents.FEATURE_MODAL_OPEN, {
		feature: featureName,
	});
};

/**
 * Track feature modal close
 */
export const trackFeatureModalClose = (featureName: string): void => {
	pushGTMEvent(GTMEvents.FEATURE_MODAL_CLOSE, {
		feature: featureName,
	});
};

/**
 * Track feature modal CTA click
 */
export const trackFeatureModalCTAClick = (featureName: string): void => {
	pushGTMEvent(GTMEvents.FEATURE_MODAL_CTA_CLICK, {
		feature: featureName,
		destination: "/register",
		source: "modal",
	});
};

/**
 * Track view of features section (Intersection Observer - 50% visible)
 */
export const trackViewFeaturesSection = (): void => {
	pushGTMEvent(GTMEvents.VIEW_FEATURES_SECTION, {
		section: "features",
		page: "landing",
	});
};

/**
 * Track scroll inside feature modal (50% scroll)
 */
export const trackFeatureModalScroll = (featureName: string): void => {
	pushGTMEvent(GTMEvents.FEATURE_MODAL_SCROLL, {
		feature: featureName,
	});
};

/**
 * Track register page view with attribution
 */
export const trackRegisterView = (source?: string, feature?: string): void => {
	pushGTMEvent(GTMEvents.REGISTER_VIEW, {
		source: source || "direct",
		feature: feature || null,
	});
};

/**
 * Track successful sign up with attribution
 */
export const trackSignUp = (method: "email" | "google", source?: string, feature?: string): void => {
	pushGTMEvent(GTMEvents.SIGN_UP, {
		method,
		source: source || "direct",
		feature: feature || null,
	});
};

/**
 * Track Google signup button click (before auth flow starts)
 */
export const trackGoogleSignupClick = (source?: string, feature?: string): void => {
	pushGTMEvent(GTMEvents.GOOGLE_SIGNUP_CLICK, {
		source: source || "direct",
		feature: feature || null,
	});
};

/**
 * Track first interaction with the register form (first keystroke)
 */
export const trackRegisterFormStart = (source?: string, feature?: string): void => {
	pushGTMEvent(GTMEvents.REGISTER_FORM_START, {
		source: source || "direct",
		feature: feature || null,
	});
};

/**
 * Track register form submit (user clicked "Registrarme")
 */
export const trackRegisterFormSubmit = (method: "email", source?: string, feature?: string): void => {
	pushGTMEvent(GTMEvents.REGISTER_FORM_SUBMIT, {
		method,
		source: source || "direct",
		feature: feature || null,
	});
};

/**
 * Track register form error (validation or API failure)
 */
export const trackRegisterFormError = (errorType: string, errorMessage?: string, source?: string): void => {
	pushGTMEvent(GTMEvents.REGISTER_FORM_ERROR, {
		error_type: errorType,
		error_message: errorMessage || null,
		source: source || "direct",
	});
};

// =============================================================================
// OAuth (MCP server connection) events — Phase 2 / PR 2.x
//
// NO confundir con register_* / sign_up: estos eventos NO son signups ni logins
// estándar — son autorizaciones para que un cliente externo (Claude.ai, ChatGPT)
// acceda a la cuenta del user via OAuth 2.1.
//
// IMPORTANTE: cada evento nuevo requiere su tag GTM (Setup B). Mientras no
// existan los tags en GTM, los pushes al dataLayer no llegan a GA4 — pero
// documentamos acá para que cuando se creen los tags estén alineados.
//
// Tags GTM a crear post-deploy de Phase 2:
//   - oauth_login_view      → GA4 event
//   - oauth_login_submit    → GA4 event con dimensión `method`
//   - oauth_login_success   → GA4 event con dimensión `method`
//   - oauth_login_error     → GA4 event con dimensiones `error_type`, `method`
//   - oauth_consent_view    → GA4 event con dimensión `client_name`, `verified`
//   - oauth_consent_accept  → GA4 event (conversión soft)
//   - oauth_consent_reject  → GA4 event con dimensión `reason`
//   - oauth_upgrade_view    → GA4 event con dimensión `reason` (señal de upsell)
// =============================================================================

/** Montaje de /oauth/login — un user con sesión OAuth iniciada llegó a la pantalla de login */
export const trackOauthLoginView = (clientId?: string, clientName?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_LOGIN_VIEW, {
		client_id: clientId || null,
		client_name: clientName || null,
	});
};

/** Submit del form de login OAuth (email/pwd o Google) */
export const trackOauthLoginSubmit = (method: "email" | "google", clientId?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_LOGIN_SUBMIT, {
		method,
		client_id: clientId || null,
	});
};

/** Login OAuth exitoso — Hydra acceptLoginRequest devolvió redirect_to */
export const trackOauthLoginSuccess = (method: "email" | "google", clientId?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_LOGIN_SUCCESS, {
		method,
		client_id: clientId || null,
	});
};

/** Error en login OAuth (credenciales inválidas, Hydra error, etc.) */
export const trackOauthLoginError = (errorType: string, method?: "email" | "google", clientId?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_LOGIN_ERROR, {
		error_type: errorType,
		method: method || null,
		client_id: clientId || null,
	});
};

/** Montaje de /oauth/consent */
export const trackOauthConsentView = (clientId?: string, clientName?: string, verified?: boolean): void => {
	pushGTMEvent(GTMEvents.OAUTH_CONSENT_VIEW, {
		client_id: clientId || null,
		client_name: clientName || null,
		verified: !!verified,
	});
};

/** User clickea "Autorizar" en consent — conversión soft */
export const trackOauthConsentAccept = (clientId?: string, grantedScopes?: string[]): void => {
	pushGTMEvent(GTMEvents.OAUTH_CONSENT_ACCEPT, {
		client_id: clientId || null,
		granted_scopes: grantedScopes || [],
	});
};

/** User clickea "Rechazar" en consent */
export const trackOauthConsentReject = (clientId?: string, reason?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_CONSENT_REJECT, {
		client_id: clientId || null,
		reason: reason || null,
	});
};

/** Montaje de /oauth/upgrade-required — señal de upsell potencial */
export const trackOauthUpgradeView = (reason: string, plan?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_UPGRADE_VIEW, {
		reason,
		plan: plan || null,
	});
};
