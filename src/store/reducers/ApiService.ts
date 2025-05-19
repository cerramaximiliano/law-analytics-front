import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BASE_URL; // Ajusta esto según tu configuración

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
// Interfaces de usuario y sesiones
// ===============================

export interface UserPreferences {
	timeZone: string;
	dateFormat: string;
	language: string;
	theme: "light" | "dark" | "system";
	notifications: NotificationPreferences;
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
		expiration: boolean;
		inactivity: boolean;
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
// Interfaces de estadísticas
// ===============================

export interface TrendItem {
	month: string;
	count: number;
}

export interface FolderDistribution {
	nueva: number;
	enProceso: number;
	cerrada: number;
	pendiente: number;
}

export interface ResolutionTimes {
	overall: number;
	byStatus: {
		nueva: number;
		enProceso: number;
		pendiente: number;
	};
}

export interface UpcomingDeadlines {
	next7Days: number;
	next15Days: number;
	next30Days: number;
}

export interface TaskMetrics {
	completionRate: number;
	pendingTasks: number;
	completedTasks: number;
	overdueTasks: number;
}

export interface DashboardSummary {
	folderStats: {
		active: number;
		closed: number;
		distribution: FolderDistribution;
	};
	financialStats: {
		totalActiveAmount: number;
		calculatorsAmount: number;
	};
	upcomingDeadlines: number;
	taskMetrics: {
		pendingTasks: number;
		completionRate: number;
	};
	notificationMetrics: {
		unreadCount: number;
	};
	trends: {
		newFolders: TrendItem[];
		movements: TrendItem[];
	};
	lastUpdated: string;
}

export interface FolderAnalytics {
	distribution: FolderDistribution;
	resolutionTimes: ResolutionTimes;
	deadlines: UpcomingDeadlines;
}

export interface UserAnalytics {
	folderStatusDistribution: FolderDistribution;
	// ...otros campos
}

// Añadir nuevas interfaces para los planes

export interface ResourceLimit {
	name: string;
	limit: number;
	description: string;
}

export interface PlanFeature {
	name: string;
	enabled: boolean;
	description: string;
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
	pricingInfo: PlanPricingInfo;
	createdAt?: {
		$date: string;
	};
	updatedAt?: {
		$date: string;
	};
	__v?: number;
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
	billingPeriod: "monthly" | "yearly";
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
	invoiceUrl: string;
	pdfUrl: string;
	description: string;
	receiptEmail: string;
	receiptNumber: string;
	period: {
		start: Date | null;
		end: Date | null;
	};
	subscription: {
		id: string;
		plan: string;
	};
	items: PaymentItem[];
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
			console.error("Error fetching active sessions:", error);
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
			console.error("Error terminating session:", error);
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
			console.error("Error terminating all other sessions:", error);
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
			console.error("Error updating current session:", error);
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
			console.error("Error fetching notification preferences:", error);
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
			console.error("Error updating notification preferences:", error);
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
			console.error("Error fetching user preferences:", error);
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
			console.error("Error updating user preferences:", error);
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
			console.error("Error deactivating account:", error);
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
			console.error("Error reactivating account:", error);
			throw this.handleAxiosError(error);
		}
	}

	// ================================
	// Estadísticas y análisis
	// ================================

	/**
	 * Obtiene el resumen del dashboard
	 * @param userId - ID de usuario opcional para administradores
	 */
	static async getDashboardSummary(userId?: string | null): Promise<DashboardSummary> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/stats/dashboard${userId ? `/${userId}` : ""}`, { withCredentials: true });

			if (!response.data || !response.data.summary) {
				throw new Error("Formato de respuesta inválido");
			}

			return response.data.summary;
		} catch (error) {
			console.error("Error fetching dashboard summary:", error);
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene análisis completos del usuario
	 * @param userId - ID de usuario opcional para administradores
	 */
	static async getFullAnalytics(userId?: string | null): Promise<UserAnalytics> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/stats/analytics${userId ? `/${userId}` : ""}`, { withCredentials: true });

			if (!response.data || !response.data.analytics) {
				throw new Error("Formato de respuesta inválido");
			}

			return response.data.analytics;
		} catch (error) {
			console.error("Error fetching full analytics:", error);
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene análisis por categoría específica
	 * @param category - La categoría de análisis a obtener
	 * @param userId - ID de usuario opcional para administradores
	 */
	static async getCategoryAnalysis<T>(category: string, userId?: string | null): Promise<T> {
		try {
			const path = userId ? `/api/stats/${userId}/category/${category}` : `/api/stats/category/${category}`;

			const response = await axios.get(`${API_BASE_URL}${path}`, {
				withCredentials: true,
			});

			if (!response.data || !response.data.data) {
				throw new Error("Formato de respuesta inválido");
			}

			return response.data.data;
		} catch (error) {
			console.error(`Error fetching ${category} analysis:`, error);
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Obtiene análisis de carpetas
	 * @param userId - ID de usuario opcional para administradores
	 */
	static async getFolderAnalytics(userId?: string | null): Promise<FolderAnalytics> {
		return this.getCategoryAnalysis<FolderAnalytics>("folders", userId);
	}

	/**
	 * Obtiene métricas de tareas
	 * @param userId - ID de usuario opcional para administradores
	 */
	static async getTaskMetrics(userId?: string | null): Promise<TaskMetrics> {
		return this.getCategoryAnalysis<TaskMetrics>("tasks", userId);
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

	static async getPublicPlans(): Promise<ApiResponse<Plan[]>> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/plan-configs/public`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			console.error("Error fetching public plans:", error);
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
			console.error("Error fetching all plans:", error);
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
			console.error(`Error fetching plan ${planId}:`, error);
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Crea o actualiza un plan
	 * @param planData - Datos del plan
	 */
	static async createOrUpdatePlan(planData: Partial<Plan>): Promise<ApiResponse<Plan>> {
		try {
			const response = await axios.post(`${API_BASE_URL}/api/plan-config`, planData, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			console.error("Error creating/updating plan:", error);
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Elimina un plan
	 * @param planId - ID del plan
	 */
	static async deletePlan(planId: string): Promise<ApiResponse> {
		try {
			const response = await axios.delete(`${API_BASE_URL}/api/plan-config/${planId}`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			console.error(`Error deleting plan ${planId}:`, error);
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
			return response.data;
		} catch (error) {
			console.error("Error fetching current subscription:", error);
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
			return response.data;
		} catch (error) {
			console.error("Error al cancelar suscripción:", error);
			throw this.handleAxiosError(error);
		}
	}

	/**
	 * Inicia el proceso de suscripción a un plan
	 * @param planId - ID del plan al que se quiere suscribir
	 */
	static async subscribeToPlan(
		planId: string,
		successUrl: string,
		cancelUrl: string,
	): Promise<ApiResponse<{ sessionId?: string; url?: string }>> {
		try {
			const response = await axios.post<ApiResponse<{ sessionId?: string; url?: string }>>(
				`${API_BASE_URL}/api/subscriptions/checkout`,
				{
					planId,
					successUrl,
					cancelUrl,
				},
				{ withCredentials: true },
			);
			return response.data;
		} catch (error) {
			console.error("Error subscribing to plan:", error);
			throw this.handleAxiosError(error);
		}
	}

	static async getPaymentHistory(): Promise<ApiResponse<PaymentHistoryResponse>> {
		try {
			const response = await axios.get<ApiResponse<PaymentHistoryResponse>>(`${API_BASE_URL}/api/subscriptions/payments`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			console.error("Error obteniendo historial de pagos:", error);
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
			return response.data;
		} catch (error: any) {
			console.error("Error al cancelar downgrade programado:", error);
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
			console.error("Error al cambiar plan inmediatamente:", error);
			return {
				success: false,
				message: error.response?.data?.message || "Error al cambiar el plan",
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
			console.error("Error al programar cambio de plan:", error);
			return {
				success: false,
				message: error.response?.data?.message || "Error al programar el cambio de plan",
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
			console.error(`Error obteniendo documento legal (${documentType}):`, error);
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
}

export default ApiService;
