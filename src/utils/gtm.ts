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
	// Vista pública de documentos de movimientos (/m/:token) — pending GTM tag
	NOTIFICATION_MOVEMENT_OPEN: "notification_movement_open",
	NOTIFICATION_MOVEMENT_CTA_CLICK: "notification_movement_cta_click",
	// Onboarding checklist events (pending GTM tags creation post-deploy)
	ONBOARDING_SHOWN: "onboarding_shown",
	ONBOARDING_STEP_CLICKED: "onboarding_step_clicked",
	ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
	ONBOARDING_JUDICIAL_LOGO_CLICKED: "onboarding_judicial_logo_clicked",
	ONBOARDING_EXAMPLE_FOLDER_USED: "onboarding_example_folder_used",
	ONBOARDING_DISMISSED: "onboarding_dismissed",
	ONBOARDING_COMPLETED: "onboarding_completed",
	// Uso interior de la app (productAnalytics.ts) — pending GTM tags / GA4 custom events
	SCREEN_VIEW: "screen_view",
	FOLDER_CREATE_START: "folder_create_start",
	FOLDER_CREATE_COMPLETE: "folder_create_complete",
	CAUSA_LINK_START: "causa_link_start",
	CAUSA_LINK_SUCCESS: "causa_link_success",
	CAUSA_LINK_ERROR: "causa_link_error",
	FOLDER_DETAIL_VIEW: "folder_detail_view",
	MOVEMENT_OPEN: "movement_open",
	CALENDAR_EVENT_CREATE: "calendar_event_create",
	GOOGLE_CALENDAR_SYNC: "google_calendar_sync",
	TASK_CREATE: "task_create",
	CONTACT_CREATE: "contact_create",
	CALCULATOR_RUN: "calculator_run",
	POSTAL_TRACKING_ADD: "postal_tracking_add",
	SUBSCRIPTION_CHECKOUT_START: "subscription_checkout_start",
	SUBSCRIPTION_SUCCESS: "subscription_success",
	WEB_VITALS: "web_vitals",
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
 * Track CTA click with location.
 * Pushea `source` (alineado con la convención de ?source= del funnel) y
 * `cta_location` (legacy — mantenido para no romper tags GTM existentes).
 */
export const trackCTAClick = (eventName: string, location: string): void => {
	pushGTMEvent(eventName, {
		source: location,
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
//     (view/accept/reject llevan `scope_write`: true si el consent pidió `mcp:write`, Etapa F)
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

/** Método de login OAuth: credenciales, Google o sesión recordada de Hydra ("Continuar como"). */
export type OauthLoginMethod = "email" | "google" | "remembered";

/** Submit del form de login OAuth (email/pwd, Google o "Continuar como") */
export const trackOauthLoginSubmit = (method: OauthLoginMethod, clientId?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_LOGIN_SUBMIT, {
		method,
		client_id: clientId || null,
	});
};

/** Login OAuth exitoso — Hydra acceptLoginRequest devolvió redirect_to */
export const trackOauthLoginSuccess = (method: OauthLoginMethod, clientId?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_LOGIN_SUCCESS, {
		method,
		client_id: clientId || null,
	});
};

/** Error en login OAuth (credenciales inválidas, Hydra error, etc.) */
export const trackOauthLoginError = (errorType: string, method?: OauthLoginMethod, clientId?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_LOGIN_ERROR, {
		error_type: errorType,
		method: method || null,
		client_id: clientId || null,
	});
};

/** Montaje de /oauth/consent */
export const trackOauthConsentView = (clientId?: string, clientName?: string, verified?: boolean, scopeWrite?: boolean): void => {
	pushGTMEvent(GTMEvents.OAUTH_CONSENT_VIEW, {
		client_id: clientId || null,
		client_name: clientName || null,
		verified: !!verified,
		scope_write: !!scopeWrite,
	});
};

/** User clickea "Autorizar" en consent — conversión soft */
export const trackOauthConsentAccept = (clientId?: string, grantedScopes?: string[], scopeWrite?: boolean): void => {
	pushGTMEvent(GTMEvents.OAUTH_CONSENT_ACCEPT, {
		client_id: clientId || null,
		granted_scopes: grantedScopes || [],
		scope_write: !!scopeWrite,
	});
};

/** User clickea "Rechazar" en consent */
export const trackOauthConsentReject = (clientId?: string, reason?: string, scopeWrite?: boolean): void => {
	pushGTMEvent(GTMEvents.OAUTH_CONSENT_REJECT, {
		client_id: clientId || null,
		reason: reason || null,
		scope_write: !!scopeWrite,
	});
};

/** Montaje de /oauth/upgrade-required — señal de upsell potencial */
export const trackOauthUpgradeView = (reason: string, plan?: string): void => {
	pushGTMEvent(GTMEvents.OAUTH_UPGRADE_VIEW, {
		reason,
		plan: plan || null,
	});
};

// =============================================================================
// Add-on "Conectores de IA" (mcp_access) — alta / baja
// =============================================================================
//
// Complementan a los eventos ya mapeados en la-ads (`mcp_plans_cta_click`,
// `mcp_landing_cta_click`), que se siguen emitiendo igual. Nuevos (sin etiqueta
// GTM todavía — documentar en la-ads tracking-map § Conector MCP):
//   - mcp_addon_cta_click      CTA del add-on fuera de /plans y las landings
//                              (cuenta → suscripción, integraciones → asistentes,
//                              suscripciones/tables → cta_location "pricing_tables";
//                              checkbox "Agregar Conectores de IA" junto a un plan al
//                              contratarlo (usuario sin plan pago) → cta_location
//                              "plan_checkout", cta_kind "plan_<planId>"; con ese
//                              cta_location también dialog_open, purchase_error y
//                              purchase (este último en /apps/subscription/success)
//   - mcp_addon_dialog_open    se abrió el diálogo de confirmación del alta
//   - mcp_addon_purchase       alta confirmada por el hub (conversión)
//   - mcp_addon_purchase_error el alta falló (error_code = code del hub: CARD_DECLINED, PAYMENT_REQUIRES_ACTION, …)
//   - mcp_addon_cancel         baja programada (fin de período) confirmada
//   - mcp_addon_reactivate     baja programada deshecha antes del fin del período

export type McpAddonCtaLocation =
	| "plans_page"
	| "account_subscription"
	| "integrations_ia"
	| "pricing_tables"
	| "plan_checkout"
	| "landing_conectores"
	| "landing_chatgpt"
	| string;

export const trackMcpAddonCtaClick = (ctaLocation: McpAddonCtaLocation, ctaKind: string, userState: string): void => {
	pushGTMEvent("mcp_addon_cta_click", { cta_location: ctaLocation, cta_kind: ctaKind, user_state: userState });
};

export const trackMcpAddonDialogOpen = (ctaLocation: McpAddonCtaLocation, policyRequired: boolean): void => {
	pushGTMEvent("mcp_addon_dialog_open", { cta_location: ctaLocation, policy_required: policyRequired });
};

export const trackMcpAddonPurchase = (
	ctaLocation: McpAddonCtaLocation,
	outcome: "active" | "already_active" | "payment_pending",
	value: number | null,
	currency: string,
): void => {
	pushGTMEvent("mcp_addon_purchase", { cta_location: ctaLocation, outcome, value: value ?? undefined, currency: currency.toUpperCase() });
};

export const trackMcpAddonPurchaseError = (ctaLocation: McpAddonCtaLocation, errorCode: string): void => {
	pushGTMEvent("mcp_addon_purchase_error", { cta_location: ctaLocation, error_code: errorCode });
};

export const trackMcpAddonCancel = (ctaLocation: McpAddonCtaLocation): void => {
	pushGTMEvent("mcp_addon_cancel", { cta_location: ctaLocation });
};

export const trackMcpAddonReactivate = (ctaLocation: McpAddonCtaLocation): void => {
	pushGTMEvent("mcp_addon_reactivate", { cta_location: ctaLocation });
};

// =============================================================================
// Vista pública de documentos de movimientos (/m/:token)
//
// El user llega desde el link "Ver documento" del email de movimientos nuevos,
// sin necesidad de estar logueado. Mide la apertura de la notificación (señal
// de engagement + re-engagement) y el click al CTA de "gestionar en la app".
//
// Tags GTM a crear post-deploy:
//   - notification_movement_open      → GA4 event con dimensiones source, fuero, has_pdf
//   - notification_movement_cta_click → GA4 event con dimensión has_folder
// =============================================================================

/** Mount de /m/:token — el user abrió el documento de un movimiento desde el email. */
export const trackNotificationMovementOpen = (params: { source?: string; fuero?: string | null; hasPdf: boolean }): void => {
	pushGTMEvent(GTMEvents.NOTIFICATION_MOVEMENT_OPEN, {
		source: params.source || "email",
		fuero: params.fuero || null,
		has_pdf: params.hasPdf,
	});
};

/** Click en el CTA "Iniciar sesión / gestionar" de la vista pública del documento. */
export const trackNotificationMovementCtaClick = (hasFolder: boolean): void => {
	pushGTMEvent(GTMEvents.NOTIFICATION_MOVEMENT_CTA_CLICK, {
		has_folder: hasFolder,
	});
};

// =============================================================================
// Onboarding checklist events — Phase 1
//
// Reemplaza el onboarding actual (banner + 4 cards) por un checklist de 4 pasos
// persistente hasta completarse. Métricas que cierran el loop post-signup que
// hoy es invisible (la colección OnboardingEvent vino vacía: el frontend
// nunca trackeaba nada).
//
// step_id values:
//   - "first_folder"        — crear primera carpeta
//   - "judicial_connection" — vincular cred PJN/SCBA o folder con causaType
//   - "first_contact"       — agregar primer contacto
//   - "first_deadline"      — configurar primera alerta de vencimiento
//
// jurisdiction values: "PJN" | "MEV" | "SCBA" | "EJE" | "SALTA" | "CATAMARCA" | "MENDOZA"
//
// Tags GTM a crear post-deploy:
//   - onboarding_shown                → GA4 event con dimensión completed_count
//   - onboarding_step_clicked         → GA4 event con dimensión step_id
//   - onboarding_step_completed       → GA4 event (conversión soft) con step_id
//   - onboarding_judicial_logo_clicked → GA4 event con dimensiones jurisdiction, mode
//   - onboarding_example_folder_used  → GA4 event (señal de fricción)
//   - onboarding_dismissed            → GA4 event con dimensión completed_count
//   - onboarding_completed            → GA4 event (conversión hard)
// =============================================================================

/** Mount del checklist — se dispara una vez por sesión cuando el user logueado lo ve */
export const trackOnboardingShown = (completedCount: number, totalSteps: number): void => {
	pushGTMEvent(GTMEvents.ONBOARDING_SHOWN, {
		completed_count: completedCount,
		total_steps: totalSteps,
	});
};

/** Click sobre un step pending — útil para medir CTR por step */
export const trackOnboardingStepClicked = (stepId: string): void => {
	pushGTMEvent(GTMEvents.ONBOARDING_STEP_CLICKED, { step_id: stepId });
};

/** Step pasa a completed (detectado en el reload, no en el click) — conversión soft */
export const trackOnboardingStepCompleted = (stepId: string): void => {
	pushGTMEvent(GTMEvents.ONBOARDING_STEP_COMPLETED, { step_id: stepId });
};

/** Click sobre un logo de jurisdicción dentro del step judicial.
 *  `jurisdiction`: PJN | SCBA | MEV | EJE | SALTA | CATAMARCA | MENDOZA, o la key de una
 *  jurisdicción nueva del catálogo de /admin/integrations (el panel se arma desde ahí).
 *  `mode` = "credential" (conectar cuenta) | "individual" (vincular expediente). */
export const trackOnboardingJudicialLogoClicked = (jurisdiction: string, mode: "credential" | "individual"): void => {
	pushGTMEvent(GTMEvents.ONBOARDING_JUDICIAL_LOGO_CLICKED, { jurisdiction, mode });
};

/** Click sobre "Crear con datos de ejemplo" — escape hatch del paso #1 */
export const trackOnboardingExampleFolderUsed = (): void => {
	pushGTMEvent(GTMEvents.ONBOARDING_EXAMPLE_FOLDER_USED, {});
};

/** Dismiss explícito ("Ocultar guía") — distingue abandono activo vs pasivo */
export const trackOnboardingDismissed = (completedCount: number, totalSteps: number): void => {
	pushGTMEvent(GTMEvents.ONBOARDING_DISMISSED, {
		completed_count: completedCount,
		total_steps: totalSteps,
	});
};

/** 4/4 — el user completó todos los pasos. Conversión hard del onboarding. */
export const trackOnboardingCompleted = (): void => {
	pushGTMEvent(GTMEvents.ONBOARDING_COMPLETED, {});
};
