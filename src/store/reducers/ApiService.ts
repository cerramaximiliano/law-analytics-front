// services/statsService.js

import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BASE_URL; // Ajusta esto según tu configuración
// Definiciones de tipos
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
	// Incluir si se necesita la estructura completa
	folderStatusDistribution: FolderDistribution;
	// ...otros campos
}

// Clase de servicio
class StatsServiceClass {
	// Obtener el resumen del dashboard
	static async getDashboardSummary(userId?: string | null): Promise<DashboardSummary> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/stats/dashboard${userId ? `/${userId}` : ""}`);
			return response.data.summary;
		} catch (error) {
			console.error("Error fetching dashboard summary:", error);
			throw error;
		}
	}

	// Obtener análisis completos
	static async getFullAnalytics(userId?: string | null): Promise<UserAnalytics> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/stats/analytics${userId ? `/${userId}` : ""}`);
			return response.data.analytics;
		} catch (error) {
			console.error("Error fetching full analytics:", error);
			throw error;
		}
	}

	// Obtener análisis por categoría específica
	static async getCategoryAnalysis<T>(category: string, userId?: string | null): Promise<T> {
		try {
			const path = userId ? `/api/stats/${userId}/category/${category}` : `/api/stats/category/${category}`;
			const response = await axios.get(`${API_BASE_URL}${path}`);
			return response.data.data;
		} catch (error) {
			console.error(`Error fetching ${category} analysis:`, error);
			throw error;
		}
	}
}

export default StatsServiceClass;
