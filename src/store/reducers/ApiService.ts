import axios from "axios";
import { StripeCustomersResponse } from "../../types/stripe-subscription";
import { StripeCustomerHistory } from "../../types/stripe-history";
import { Subscription as UserSubscription } from "../../types/user";

const API_BASE_URL = import.meta.env.VITE_BASE_URL; // Ajusta esto según tu configuración

// ===============================
// Interfaces de respuesta API
// ===============================

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	document?: T;
	message?: string;
	requireLogin?: boolean;
	accountDeactivated?: boolean;
}

// ===============================
// Integraciones públicas (toggles de disponibilidad UI)
// ===============================
// Embebido en el response de GET /api/plan-configs/public para evitar requests
// extra al cargar la landing. Cada flag indica si la opción se muestra en UI.
// `enabled: false` → la UI debe ocultar la opción de esa integración.

/**
 * releaseStage: 'beta' → chip "Beta" + CTA "Solicitar acceso" + form de soporte.
 *                'stable' → chip "Disponible" + CTA directo a /connect.
 */
export type ReleaseStage = "beta" | "stable";

export interface ServiceFlag {
	enabled: boolean;
	maintenanceMessage: string | null;
	releaseStage: ReleaseStage;
}

export interface PublicIntegrations {
	/** Toggle para mostrar el banner MCP de Claude.ai en landing/plans + página /integraciones/claude-ai. */
	claudeAi: ServiceFlag;
	/** Toggle equivalente para ChatGPT — UI futura (placeholder hasta que el MCP soporte ChatGPT). */
	chatGpt: ServiceFlag;
}

/**
 * Defaults fail-CLOSED si el endpoint falla — ambas integraciones se asumen
 * NO disponibles. Cambiado de fail-open a fail-closed cuando el producto decidió
 * lanzar la integración deshabilitada por default (no exponer features que no
 * están listas en producción si el backend no puede confirmar el flag).
 */
export const DEFAULT_PUBLIC_INTEGRATIONS: PublicIntegrations = {
	claudeAi: { enabled: false, maintenanceMessage: null, releaseStage: "beta" },
	chatGpt: { enabled: false, maintenanceMessage: null, releaseStage: "beta" },
};

// ====================================
// Public Addons (piggyback en getPublicPlans)
// ====================================
// Cada entry incluye precio leído desde Stripe + flag de disponibilidad
// calculado en función de IntegrationsConfig (un addon mcp_access está
// available si claudeAi.enabled OR chatGpt.enabled).

export type AddonKey = "mcp_access";

export interface PublicAddon {
	key: AddonKey;
	displayName: string;
	description: string;
	/** Precio mensual en moneda real (no centavos). null si Stripe no devolvió precio. */
	priceMonthly: number | null;
	/** ISO currency lowercase: 'usd', 'ars', etc. */
	currency: string;
	interval: "month" | "year" | string;
	/** El addon está disponible para mostrar/comprar (alguna integración requerida enabled). */
	available: boolean;
	/** Planes en los que el user puede contratar el addon. Si no está en estos planes, debe upgradear primero. */
	requiredPlans: string[];
	/** Si el user no está en uno de estos planes, debe upgradear primero. */
	requiresIntegrationsAny: string[];
}

export const DEFAULT_PUBLIC_ADDONS: PublicAddon[] = [];

// ===============================
// Interfaces de usuario y sesiones
// ===============================

export interface UserPreferences {
	timeZone: string;
	dateFormat: string;
	language: string;
	theme: "light" | "dark" | "system";
	notifications: NotificationPreferences;
	pjn?: {
		syncContactsFromIntervinientes: boolean;
	};
}

export interface NotificationSettings {
	notifyOnceOnly: boolean;
	daysInAdvance: number;
}

export interface InactivitySettings {
	daysInAdvance: number;
	caducityDays: number;
	prescriptionDays: number;
	notifyOnceOnly: boolean;
}

export interface NotificationPreferences {
	enabled: boolean;
	channels?: {
		email: boolean;
		browser: boolean;
		mobile: boolean;
	};
	user: {
		enabled: boolean;
		calendar: boolean;
		calendarSettings?: NotificationSettings;
		expiration: boolean;
		expirationSettings?: NotificationSettings;
		taskExpiration: boolean;
		taskExpirationSettings?: NotificationSettings;
		inactivity: boolean;
		inactivitySettings?: InactivitySettings;
	};
	system: {
		enabled: boolean;
		alerts: boolean;
		news: boolean;
		userActivity: boolean;
	};
	otherCommunications?: boolean;
	loginAlerts?: boolean;
}

export interface DeactivateAccountData {
	password: string;
	reason?: string;
}

export interface ReactivateAccountData {
	email: string;
	password: string;
}

export interface SessionData {
	deviceId: string;
	deviceName: string;
	deviceType: string;
	browser: string;
	os: string;
	lastActivity: string | Date;
	location?: string;
	isCurrentSession: boolean;
	ip?: string;
}

// ===============================
// Interfaces para los planes
// ===============================

export interface ResourceLimit {
	name: string;
	limit: number;
	description: string;
	displayName: string;
	visibility?: string;
	order?: number;
}

export interface PlanFeature {
	name: string;
	enabled: boolean;
	description: string;
	displayName?: string;
	visibility?: string;
	order?: number;
}

export interface ActiveDiscount {
	code: string;
	name: string;
	discountType: "percentage" | "fixed";
	discountValue: number;
	validUntil: string;
	badge: string;
	promotionalMessage: string;
	applicablePlans: string[];
	applicableBillingPeriods: string[];
	duration: "once" | "repeating" | "forever";
	durationInMonths?: number;
	originalPrice: number;
	discountAmount: number;
	finalPrice: number;
	discountPercentage: number;
}

export interface Plan {
	_id?: {
		$oid: string;
	};
	planId: string;
	displayName: string;
	description: string;
	isActive: boolean;
	isDefault: boolean;
	resourceLimits: ResourceLimit[];
	features: PlanFeature[];
	// Indica si el backend tiene configuración de environments (el pricingInfo ya viene resuelto)
	hasEnvironments?: boolean;
	// Información de entornos con los datos de Stripe (legacy, el backend ahora resuelve esto)
	environments?: {
		development?: EnvironmentConfig;
		production?: EnvironmentConfig;
	};
	// Información de precios (el backend ya la resuelve según el entorno si hasEnvironments es true)
	pricingInfo: PlanPricingInfo;
	createdAt?: {
		$date: string;
	};
	updatedAt?: {
		$date: string;
	};
	__v?: number;
	stripePriceId?: string;
	stripeProductId?: string;
	metadata?: {
		lastSyncEnv?: string;
		lastSyncDate?: string;
		[key: string]: any;
	};
	changeHistory?: Array<{
		date: string;
		field: string;
		oldValue: any;
		newValue: any;
	}>;
	activeDiscounts?: ActiveDiscount[];
}

export interface PlanResourceLimits {
	folders?: number;
	calculations?: number;
	contacts?: number;
	adminAccounts?: number;
	associatedAccounts?: number;
}

export interface PlanFeatures {
	calendar?: boolean;
	automatedTracking?: boolean;
	clientAccess?: boolean;
}

export interface PlanPricingInfo {
	basePrice: number;
	currency: string;
	billingPeriod: "monthly" | "yearly" | "daily" | "weekly" | "annual" | string;
	stripePriceId?: string;
}

export interface EnvironmentConfig {
	stripeProductId?: string;
	stripePriceId?: string;
	basePrice?: number;
	currency?: string;
	billingPeriod?: "daily" | "weekly" | "monthly" | "annual";
	lastSync?: string | Date;
}

export interface Subscription {
	_id: string;
	user: string;
	stripeCustomerId: string;
	plan: string; // Este es el ID del plan actual
	status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
	cancelAtPeriodEnd: boolean;
	limits: {
		maxFolders: number;
		maxCalculators: number;
		maxContacts: number;
		storageLimit: number;
	};
	features: {
		advancedAnalytics: boolean;
		exportReports: boolean;
		taskAutomation: boolean;
		bulkOperations: boolean;
		prioritySupport: boolean;
	};
	createdAt: string;
	updatedAt: string;
	__v: number;
}

export interface PaymentItem {
	description: string;
	amount: number;
	currency: string;
	period: {
		start: Date | null;
		end: Date | null;
	};
}

export interface Payment {
	id: string;
	paymentId: string;
	amount: number;
	currency: string;
	status: string;
	createdAt: Date;
	paidAt: Date | null;
	invoiceId?: string;
	invoiceNumber?: string;
	invoiceUrl: string;
	pdfUrl: string;
	description: string;
	receiptEmail: string;
	receiptNumber?: string;
	receiptUrl?: string;
	period: {
		start: Date | null;
		end: Date | null;
	};
	subscription: {
		id: string;
		plan: string;
	};
	items?: PaymentItem[];
	type?: string;
	paid?: boolean;
	refunded?: boolean;
}

export interface PaymentHistoryResponse {
	success: boolean;
	payments: Payment[];
	customer?: {
		id: string;
		email: string | null;
	};
}

export interface LegalDocumentSection {
	title: string;
	content: string;
	order: number;
	visibleFor: string[];
}

export interface LegalDocumentCompanyDetails {
	name: string;
	address: string;
	email: string;
	phone: string;
	registrationNumber: string;
}

export interface LegalDocument {
	documentType: "terms" | "privacy" | "subscription" | "cookies" | "refund" | "billing";
	version: string;
	effectiveDate: Date;
	isActive: boolean;
	language: string;
	region: string;
	title: string;
	introduction: string;
	sections: LegalDocumentSection[];
	conclusion: string;
	companyDetails: LegalDocumentCompanyDetails;
	planDetails?: {
		name: string;
		description: string;
		price: number;
		currency: string;
		billingPeriod: string;
		resourceLimits: Record<string, { limit: number; description: string }>;
	};
}

export interface LegalDocumentAllPlans extends LegalDocument {
	sectionsByPlan: {
		free: LegalDocumentSection[];
		standard: LegalDocumentSection[];
		premium: LegalDocumentSection[];
	};
	commonSections: LegalDocumentSection[];
	exclusiveSectionsByPlan: {
		free: LegalDocumentSection[];
		standard: LegalDocumentSection[];
		premium: LegalDocumentSection[];
	};
}

// ===============================
// Servicio principal de API
// ===============================

class ApiService {
	// ================================
	// Gestión de sesiones activas
	// ================================

	/**
	 * Obtiene todas las sesiones activas del usuario
	 */
	static async getActiveSessions(): Promise<ApiResponse<SessionData[]>> {
		try {
			const response = await axios.get<ApiResponse<SessionData[]>>(`${API_BASE_URL}/api/sessions`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Termina una sesión específica por su ID de dispositivo
	 * @param deviceId - ID del dispositivo a terminar
	 */
	static async terminateSession(deviceId: string): Promise<ApiResponse> {
		try {
			const response = await axios.delete<ApiResponse>(`${API_BASE_URL}/api/sessions/${deviceId}`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Termina todas las sesiones excepto la actual
	 */
	static async terminateAllOtherSessions(): Promise<ApiResponse> {
		try {
			const response = await axios.delete<ApiResponse>(`${API_BASE_URL}/api/sessions`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Actualiza la información de la sesión actual
	 * @param data - Datos para actualizar (como ubicación)
	 */
	static async updateCurrentSession(data: Record<string, any>): Promise<ApiResponse> {
		try {
			const response = await axios.patch<ApiResponse>(`${API_BASE_URL}/api/sessions/current`, data, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	// ================================
	// Gestión de preferencias de usuario
	// ================================

	/**
	 * Obtiene las preferencias de notificaciones del usuario
	 */
	static async getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/notifications/preferences`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Actualiza las preferencias de notificaciones del usuario
	 * @param preferences - Las nuevas preferencias de notificaciones
	 */
	static async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
		try {
			const response = await axios.put(`${API_BASE_URL}/api/notifications/preferences`, preferences, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene todas las preferencias del usuario
	 */
	static async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/notifications/preferences`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Actualiza las preferencias del usuario
	 * @param preferences - Las nuevas preferencias
	 */
	static async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
		try {
			const response = await axios.put(`${API_BASE_URL}/api/notifications/preferences`, preferences, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	// ================================
	// Gestión de cuenta
	// ================================

	/**
	 * Desactiva la cuenta del usuario actual (soft delete)
	 * @param data - Datos para la desactivación, incluida la contraseña para confirmación
	 */
	static async deactivateAccount(data: DeactivateAccountData): Promise<ApiResponse> {
		try {
			const response = await axios.post<ApiResponse>(`${API_BASE_URL}/api/deactivate-account`, data, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Reactiva una cuenta previamente desactivada
	 * @param data - Credenciales para reactivar la cuenta
	 */
	static async reactivateAccount(data: ReactivateAccountData): Promise<ApiResponse> {
		try {
			const response = await axios.post<ApiResponse>(`${API_BASE_URL}/api/reactivate-account`, data);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	// ================================
	// Estadísticas y análisis - API Unificada
	// ================================

	/**
	 * Obtiene estadísticas unificadas del usuario
	 * @param userId - ID del usuario
	 * @param sections - Secciones específicas a obtener (por defecto: 'all')
	 */
	static async getUnifiedStats(userId: string, sections: string = "all"): Promise<any> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/stats/unified/${userId}`, {
				params: { sections },
				withCredentials: true,
			});

			if (!response.data || !response.data.success) {
				throw new Error("Formato de respuesta inválido");
			}

			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	// ================================
	// Utilidades
	// ================================

	/**
	 * Maneja errores de Axios de forma consistente
	 * @param error - El error capturado
	 */
	private static handleAxiosError(error: unknown): Error {
		if (axios.isAxiosError(error)) {
			// Verifica si es un error de cuenta desactivada
			if (error.response?.data?.accountDeactivated) {
				return new Error("Esta cuenta ha sido desactivada");
			}

			// Si hay un mensaje específico en la respuesta, úsalo
			if (error.response?.data?.message) {
				return new Error(error.response.data.message);
			}

			// Mensajes según el código de estado HTTP
			if (error.response) {
				switch (error.response.status) {
					case 401:
						return new Error("No autorizado. Por favor inicia sesión nuevamente");
					case 403:
						return new Error("No tienes permisos para realizar esta acción");
					case 404:
						return new Error("El recurso solicitado no fue encontrado");
					case 500:
						return new Error("Error interno del servidor");
					default:
						return new Error(`Error en la comunicación con el servidor (${error.response.status})`);
				}
			}

			// Error de red u otro error de Axios
			return new Error("Error de conexión. Verifica tu red e intenta nuevamente");
		}

		// Si no es un error de Axios, devuelve el error original o un mensaje genérico
		return error instanceof Error ? error : new Error("Error desconocido");
	}

	/**
	 * Comprueba si un error indica que la cuenta está desactivada
	 * @param error - El error a comprobar
	 */
	static isAccountDeactivatedError(error: unknown): boolean {
		if (axios.isAxiosError(error)) {
			return !!error.response?.data?.accountDeactivated;
		}
		return false;
	}

	// ================================
	// Gestión de planes y suscripciones
	// ================================
	/**
	 * Obtiene los planes públicos disponibles
	 */

	static async getPublicPlans(options?: {
		landingOnly?: boolean;
	}): Promise<ApiResponse<Plan[]> & { integrations?: PublicIntegrations; addons?: PublicAddon[] }> {
		try {
			// landingOnly=true fuerza al backend a devolver solo descuentos con
			// showOnLanding=true aunque haya sesión. Lo usa la landing pública (`/`)
			// para mostrar la promesa universal en vez del descuento personalizado.
			const params = options?.landingOnly ? { landingOnly: "true" } : undefined;
			const response = await axios.get(`${API_BASE_URL}/api/plan-configs/public`, {
				withCredentials: true,
				params,
			});
			// Cachear los bloques `integrations` y `addons` para que componentes que
			// solo los necesitan (Technologies banner, /plans banner, /integraciones/*)
			// no disparen su propia request. La landing ya consume getPublicPlans
			// dos veces (Planes + DiscountBanner) → cache se hidrata en el primer call.
			if (response.data?.integrations) {
				ApiService._cachedPublicIntegrations = response.data.integrations;
			}
			if (Array.isArray(response.data?.addons)) {
				ApiService._cachedPublicAddons = response.data.addons;
			}
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	// Cache module-level del bloque integrations devuelto por /plan-configs/public.
	// Vida = duración del bundle JS en memoria. Se hidrata en la primera call exitosa
	// a getPublicPlans y queda disponible vía fetchPublicIntegrations().
	private static _cachedPublicIntegrations: PublicIntegrations | null = null;
	private static _publicIntegrationsInflight: Promise<PublicIntegrations> | null = null;
	private static _cachedPublicAddons: PublicAddon[] | null = null;
	private static _publicAddonsInflight: Promise<PublicAddon[]> | null = null;

	/**
	 * Devuelve los flags de integraciones públicas. Usa cache (si existe) o
	 * dispara getPublicPlans para hidratarlo. Promise-dedupes — múltiples calls
	 * concurrentes comparten el mismo fetch.
	 *
	 * Fail-open: si el endpoint falla, asume todas las integraciones enabled.
	 */
	static async fetchPublicIntegrations(): Promise<PublicIntegrations> {
		if (ApiService._cachedPublicIntegrations) return ApiService._cachedPublicIntegrations;
		if (ApiService._publicIntegrationsInflight) return ApiService._publicIntegrationsInflight;

		ApiService._publicIntegrationsInflight = ApiService.getPublicPlans({ landingOnly: true })
			.then(() => ApiService._cachedPublicIntegrations || DEFAULT_PUBLIC_INTEGRATIONS)
			.catch(() => DEFAULT_PUBLIC_INTEGRATIONS)
			.finally(() => {
				ApiService._publicIntegrationsInflight = null;
			});
		return ApiService._publicIntegrationsInflight;
	}

	/** Lectura síncrona del cache — null si todavía no se hidrató. */
	static getCachedPublicIntegrations(): PublicIntegrations | null {
		return ApiService._cachedPublicIntegrations;
	}

	/**
	 * Devuelve los addons públicos. Mismo patrón que fetchPublicIntegrations —
	 * cache + Promise dedup. La landing piggybackea esto con getPublicPlans.
	 */
	static async fetchPublicAddons(): Promise<PublicAddon[]> {
		if (ApiService._cachedPublicAddons) return ApiService._cachedPublicAddons;
		if (ApiService._publicAddonsInflight) return ApiService._publicAddonsInflight;

		ApiService._publicAddonsInflight = ApiService.getPublicPlans({ landingOnly: true })
			.then(() => ApiService._cachedPublicAddons || DEFAULT_PUBLIC_ADDONS)
			.catch(() => DEFAULT_PUBLIC_ADDONS)
			.finally(() => {
				ApiService._publicAddonsInflight = null;
			});
		return ApiService._publicAddonsInflight;
	}

	static getCachedPublicAddons(): PublicAddon[] | null {
		return ApiService._cachedPublicAddons;
	}

	/**
	 * Agregar addon a la subscription paga del user.
	 * El backend hace stripe.subscriptions.update + el webhook de la-subscriptions
	 * sincroniza el campo addons[] cuando llega (~1-2s después).
	 */
	static async addAddon(addonKey: AddonKey): Promise<{
		success: boolean;
		alreadyActive?: boolean;
		pendingWebhookSync?: boolean;
		addon?: { key: AddonKey; status: string; stripePriceId: string; currentPeriodEnd: string | null };
		message?: string;
	}> {
		try {
			const response = await axios.post(`${API_BASE_URL}/api/subscriptions/addons/checkout`, { addonKey }, { withCredentials: true });
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Remover un addon de la subscription. Stripe prorratea automáticamente.
	 */
	static async removeAddon(addonKey: AddonKey): Promise<{ success: boolean; message?: string }> {
		try {
			const response = await axios.delete(`${API_BASE_URL}/api/subscriptions/addons/${addonKey}`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene todos los planes disponibles (admin)
	 */
	static async getAllPlans(): Promise<ApiResponse<Plan[]>> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/plan-configs`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene un plan específico por ID
	 * @param planId - ID del plan
	 */
	static async getPlanById(planId: string): Promise<ApiResponse<Plan>> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/plan-configs/${planId}`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Crea o actualiza un plan
	 * @param planData - Datos del plan
	 */
	static async createOrUpdatePlan(planData: Partial<Plan>, updateSubscriptions: boolean = false): Promise<ApiResponse<Plan>> {
		try {
			const response = await axios.post(`${API_BASE_URL}/api/plan-configs?updateSubscriptions=${updateSubscriptions}`, planData, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Elimina un plan
	 * @param planId - ID del plan
	 */
	static async deletePlan(planId: string): Promise<ApiResponse> {
		try {
			const response = await axios.delete(`${API_BASE_URL}/api/plan-configs/${planId}`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Sincroniza todos los planes con Stripe
	 */
	static async syncPlansWithStripe(): Promise<ApiResponse<Array<{ planId: string; displayName: string; synced: boolean }>>> {
		try {
			const response = await axios.post<ApiResponse<Array<{ planId: string; displayName: string; synced: boolean }>>>(
				`${API_BASE_URL}/api/plan-configs/sync-with-stripe`,
				{},
				{
					withCredentials: true,
				},
			);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene el plan actual del usuario
	 */
	static async getCurrentSubscription(): Promise<ApiResponse> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/subscriptions/current`, {
				withCredentials: true,
			});
			console.log("/api/subscriptions/current", response.data);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Sincroniza la suscripción del usuario con Stripe (fallback para cuando webhook falla)
	 */
	static async syncSubscription(): Promise<{
		success: boolean;
		message: string;
		user?: any;
		userStats?: any;
	}> {
		try {
			const response = await axios.post(`${API_BASE_URL}/api/subscriptions/sync`, {}, { withCredentials: true });
			console.log("/api/subscriptions/sync", response.data);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Repara la suscripción de un usuario específico sincronizándola con Stripe
	 * @param userId - ID del usuario a sincronizar
	 */
	static async repairUserSubscription(userId: string): Promise<{
		success: boolean;
		message: string;
		user?: any;
		subscription?: any;
	}> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/repair/fix-user-subscription/${userId}`, { withCredentials: true });
			console.log(`/api/repair/fix-user-subscription/${userId}`, response.data);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Recalcula y sincroniza el almacenamiento de un usuario específico
	 * @param userId - ID del usuario
	 */
	static async recalculateUserStorage(userId: string): Promise<{
		success: boolean;
		message: string;
		data?: {
			user: {
				id: string;
				email: string;
				plan: string;
			};
			before: {
				storage: number;
				storageMB: number;
			};
			after: {
				archived: {
					folders: number;
					contacts: number;
					calculators: number;
				};
				active: {
					folders: number;
					contacts: number;
					calculators: number;
				};
				storage: {
					folders: number;
					contacts: number;
					calculators: number;
					total: number;
					totalMB: number;
				};
			};
			changed: boolean;
			difference: {
				bytes: number;
				mb: number;
			};
		};
	}> {
		try {
			const response = await axios.post(`${API_BASE_URL}/api/admin/storage/recalculate/user/${userId}`, {}, { withCredentials: true });
			console.log(`/api/admin/storage/recalculate/user/${userId}`, response.data);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Cancela la suscripción actual del usuario
	 * @param atPeriodEnd - Si es true, la suscripción se cancela al finalizar el período actual
	 */
	static async cancelSubscription(atPeriodEnd: boolean = true): Promise<ApiResponse> {
		try {
			const response = await axios.post<ApiResponse>(
				`${API_BASE_URL}/api/subscriptions/cancel`,
				{ atPeriodEnd },
				{ withCredentials: true },
			);
			console.log("/api/subscriptions/cancel", response.data);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Inicia el proceso de suscripción a un plan
	 * @param planId - ID del plan al que se quiere suscribir
	 * @param successUrl - URL de redirección en caso de éxito
	 * @param cancelUrl - URL de redirección en caso de cancelación
	 * @param discountCode - Código de descuento opcional
	 */
	static async subscribeToPlan(
		planId: string,
		successUrl: string,
		cancelUrl: string,
		discountCode?: string,
	): Promise<ApiResponse<{ sessionId?: string; url?: string }>> {
		try {
			const response = await axios.post<ApiResponse<{ sessionId?: string; url?: string }>>(
				`${API_BASE_URL}/api/subscriptions/checkout`,
				{
					planId,
					successUrl,
					cancelUrl,
					...(discountCode && { discountCode }),
				},
				{ withCredentials: true },
			);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Reporta un intento de checkout fallido (fallo pre-Stripe: la sesión no se
	 * pudo crear o el backend devolvió error). Fire-and-forget: nunca lanza ni
	 * bloquea el flujo de UX, solo deja el registro para estadísticas.
	 * @param planId - Plan que se intentó contratar
	 * @param reason - Motivo legible del fallo
	 */
	static async reportFailedCheckout(planId: string, reason?: string): Promise<void> {
		try {
			await axios.post(
				`${API_BASE_URL}/api/subscriptions/payment-attempt-failed`,
				{ planId, reason },
				{ withCredentials: true },
			);
		} catch (error) {
			// Best-effort: no propagar — el registro de telemetría no debe romper el front
			console.warn("No se pudo reportar el intento de checkout fallido", error);
		}
	}

	// getPaymentHistory method has been removed - payment history is now fetched during login
	// and stored in Redux auth state. Use the fetchPaymentHistory action from auth reducer instead.

	/**
	 * Obtiene los métodos de pago del usuario
	 * @returns {Promise<Object>} Lista de métodos de pago
	 */
	static async getPaymentMethods(): Promise<any> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/subscriptions/payment-methods`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Actualiza el método de pago predeterminado
	 * @param {string} paymentMethodId - ID del método de pago a establecer como predeterminado
	 * @returns {Promise<Object>} Resultado de la operación
	 */
	static async updatePaymentMethod(paymentMethodId: string): Promise<any> {
		try {
			const response = await axios.post(
				`${API_BASE_URL}/api/subscriptions/payment-methods`,
				{ paymentMethodId },
				{ withCredentials: true },
			);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Crea una sesión del Stripe Billing Portal
	 * @param {string} returnUrl - URL a la que redirigir después de salir del portal
	 * @returns {Promise<Object>} Resultado con la URL del portal
	 */
	static async createBillingPortalSession(returnUrl: string): Promise<any> {
		try {
			const response = await axios.post(`${API_BASE_URL}/api/subscriptions/billing-portal`, { returnUrl }, { withCredentials: true });
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene los detalles de un plan específico
	 * @param {string} planId - ID del plan (standard, premium, free)
	 * @returns {Promise<Object>} Detalles del plan incluyendo features, limits y pricing
	 */
	static async getPlanDetails(planId: string): Promise<any> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/subscriptions/plan-details/${planId}`, { withCredentials: true });
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Cancela un downgrade programado
	 * @returns {Promise<Object>} Resultado de la operación
	 */
	static async cancelScheduledDowngrade(): Promise<any> {
		try {
			const response = await axios.post("/api/subscriptions/cancel-downgrade", {
				withCredentials: true,
			});
			console.log(response.data);
			return response.data;
		} catch (error: any) {
			return {
				success: false,
				message: error.response?.data?.message || "Error al cancelar el downgrade programado",
			};
		}
	}

	/**
	 * Cambia inmediatamente a un nuevo plan
	 * @param {string} planId - ID del nuevo plan
	 * @returns {Promise<Object>} Resultado de la operación
	 */
	static async changeImmediate(planId: string): Promise<any> {
		try {
			const response = await axios.post(
				"/api/subscriptions/change-immediate",
				{ planId },
				{
					withCredentials: true,
				},
			);
			return response.data;
		} catch (error: any) {
			return {
				success: false,
				code: error.response?.data?.code,
				message: error.response?.data?.message || "Error al cambiar el plan",
				teamCheck: error.response?.data?.teamCheck,
			};
		}
	}

	/**
	 * Programa un cambio de plan para cuando finalice el período actual
	 * @param {string} planId - ID del nuevo plan
	 * @returns {Promise<Object>} Resultado de la operación
	 */
	static async scheduleChange(planId: string): Promise<any> {
		try {
			const response = await axios.post("/api/subscriptions/schedule-change", { planId }, { withCredentials: true });
			return response.data;
		} catch (error: any) {
			return {
				success: false,
				code: error.response?.data?.code,
				message: error.response?.data?.message || "Error al programar el cambio de plan",
				teamCheck: error.response?.data?.teamCheck,
			};
		}
	}

	static async getLegalDocument(documentType: "subscription" | "refund" | "billing", planId?: string): Promise<ApiResponse<LegalDocument>> {
		try {
			const params = planId ? { planId } : {};
			const response = await axios.get<ApiResponse<LegalDocument>>(`${API_BASE_URL}/api/legal/${documentType}`, {
				params,
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene los términos de suscripción
	 * @param planId - ID del plan para personalizar los términos (opcional)
	 */
	static async getSubscriptionTerms(planId?: string): Promise<ApiResponse<LegalDocument>> {
		return this.getLegalDocument("subscription", planId);
	}

	/**
	 * Obtiene la política de reembolsos
	 * @param planId - ID del plan para personalizar la política (opcional)
	 */
	static async getRefundPolicy(planId?: string): Promise<ApiResponse<LegalDocument>> {
		return this.getLegalDocument("refund", planId);
	}

	/**
	 * Obtiene los términos de facturación
	 * @param planId - ID del plan para personalizar los términos (opcional)
	 */
	static async getBillingTerms(planId?: string): Promise<ApiResponse<LegalDocument>> {
		return this.getLegalDocument("billing", planId);
	}

	/**
	 * Obtiene un documento legal con TODAS las secciones organizadas por plan
	 * Este método es para mostrar todos los términos públicamente, organizados por tipo de plan
	 * @param documentType - Tipo de documento legal
	 */
	static async getLegalDocumentAllPlans(documentType: "subscription" | "refund" | "billing"): Promise<ApiResponse<LegalDocumentAllPlans>> {
		try {
			const response = await axios.get<ApiResponse<LegalDocumentAllPlans>>(`${API_BASE_URL}/api/legal/all-plans/${documentType}`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Verifica si una característica específica está disponible para el usuario actual
	 * @param featureName - Nombre de la característica a verificar
	 */
	static async checkUserFeature(featureName: string): Promise<
		ApiResponse<{
			isEnabled: boolean;
			planId: string;
			featureName: string;
			featureDescription?: string;
			currentPlan?: string;
			requiredPlan?: string;
		}>
	> {
		try {
			const response = await axios.get<ApiResponse>(`${API_BASE_URL}/api/plan-configs/check-feature/${featureName}`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Verifica si el usuario ha alcanzado el límite de un recurso específico
	 * @param resourceType - Tipo de recurso a verificar (folders, calculators, contacts, etc.)
	 */
	static async checkResourceLimit(
		resourceType: string,
		options?: { headers?: Record<string, string> },
	): Promise<
		ApiResponse<{
			hasReachedLimit: boolean;
			resourceType: string;
			currentCount: number;
			limit: number;
			planId: string;
			currentPlan?: string;
			requiredPlan?: string;
		}>
	> {
		try {
			const response = await axios.get<ApiResponse>(`${API_BASE_URL}/api/plan-configs/check-resource/${resourceType}`, {
				withCredentials: true,
				headers: options?.headers,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene todos los clientes de Stripe (solo administradores)
	 * @param cursor - Cursor para paginación (opcional)
	 */
	static async getStripeCustomers(cursor?: string): Promise<StripeCustomersResponse> {
		try {
			const params = cursor ? { cursor } : {};
			const response = await axios.get<StripeCustomersResponse>(`${API_BASE_URL}/api/subscriptions/stripe-subscriptions`, {
				params,
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene el historial completo de Stripe para un usuario específico
	 * @param userId - ID del usuario
	 */
	static async getStripeCustomerHistory(userId: string): Promise<ApiResponse<StripeCustomerHistory>> {
		try {
			const response = await axios.get<ApiResponse<StripeCustomerHistory>>(
				`${API_BASE_URL}/api/subscriptions/user/${userId}/stripe-history`,
				{
					withCredentials: true,
				},
			);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Actualiza la suscripción de un usuario específico
	 * @param userId - ID del usuario
	 * @param subscriptionData - Datos de suscripción a actualizar
	 */
	static async updateUserSubscription(userId: string, subscriptionData: Partial<UserSubscription>): Promise<ApiResponse<UserSubscription>> {
		try {
			const response = await axios.patch<ApiResponse<UserSubscription>>(
				`${API_BASE_URL}/api/subscriptions/user/${userId}`,
				subscriptionData,
				{
					withCredentials: true,
				},
			);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	// ================================
	// Onboarding
	// ================================

	/**
	 * Obtiene el estado de onboarding del usuario
	 */
	static async getOnboardingStatus(): Promise<ApiResponse<{ onboarding: OnboardingStatus; activeFoldersCount: number }>> {
		try {
			const response = await axios.get<ApiResponse<{ onboarding: OnboardingStatus; activeFoldersCount: number }>>(
				`${API_BASE_URL}/api/auth/onboarding`,
				{
					withCredentials: true,
				},
			);
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Actualiza el estado de onboarding del usuario
	 * @param data - Datos de actualización (step, featureName, dismissed)
	 */
	static async updateOnboarding(data: {
		step?: string;
		featureName?: string;
		dismissed?: boolean;
	}): Promise<ApiResponse<{ onboarding: OnboardingStatus }>> {
		try {
			const response = await axios.put<ApiResponse<{ onboarding: OnboardingStatus }>>(`${API_BASE_URL}/api/auth/onboarding`, data, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Descarta el onboarding (no mostrarlo más)
	 */
	static async dismissOnboarding(): Promise<ApiResponse<{ onboarding: OnboardingStatus }>> {
		return this.updateOnboarding({ dismissed: true });
	}

	/**
	 * Registra un evento del flujo de onboarding en la colección OnboardingEvent.
	 * Complementa a los eventos GTM/GA4 (que viven en analytics) con persistencia
	 * en Mongo para poder cruzarlos con el resto del estado del user en la
	 * admin UI (/admin/users/onboarding tab Eventos).
	 *
	 * Eventos válidos (ver authController.trackOnboardingEvent):
	 *   - onboarding_shown
	 *   - onboarding_step_clicked
	 *   - onboarding_step_completed
	 *   - onboarding_judicial_logo_clicked
	 *   - onboarding_example_folder_used
	 *   - onboarding_dismissed
	 *   - onboarding_completed
	 *   - (legacy) onboarding_cta_clicked, folder_created_from_onboarding
	 *
	 * El metadata es libre — se guarda tal cual. Convenciones que usa el
	 * OnboardingChecklist: `{ step_id, jurisdiction, mode, completed_count }`.
	 */
	static async trackOnboardingEvent(event: string, metadata?: Record<string, unknown>, sessionsCount?: number): Promise<void> {
		try {
			await axios.post(
				`${API_BASE_URL}/api/auth/onboarding/track`,
				{ event, metadata: metadata || {}, sessionsCount: sessionsCount || 1 },
				{ withCredentials: true },
			);
		} catch (error) {
			// Tracking no debe romper el flow del user — log y seguir.
			console.warn("trackOnboardingEvent failed", event, error);
		}
	}
}

// Interfaz para el estado de onboarding
export interface OnboardingStatus {
	createdFirstFolder: boolean;
	createdFirstFolderAt: string | null;
	usedFirstFeature: boolean;
	firstFeatureUsedAt: string | null;
	firstFeatureName: string | null;
	onboardingComplete: boolean;
	onboardingCompletedAt: string | null;
	completedSteps: string[];
	onboardingSessionsCount: number;
	lastOnboardingSessionAt: string | null;
	dismissed: boolean;
	dismissedAt: string | null;
}

export default ApiService;
