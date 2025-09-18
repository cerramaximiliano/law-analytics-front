// ===============================
// Tipos para la API unificada de estadísticas
// ===============================

export interface CacheInfo {
	generatedAt: string;
	hoursAgo: number;
	isFromCache: boolean;
	nextUpdate: string;
	message: string;
}

export interface AnalyticsHistoryItem {
	id: string;
	createdAt: string;
	lastUpdated: string;
	ageInDays: number;
	isLatest: boolean;
}

export interface AnalyticsHistoryResponse {
	success: boolean;
	count: number;
	hasMore: boolean;
	documents: AnalyticsHistoryItem[];
}

export interface UnifiedStatsResponse {
	success: boolean;
	userId: string;
	lastUpdated: string;
	data: UnifiedStatsData;
	descriptions?: UnifiedStatsDescriptions;
	cacheInfo?: CacheInfo;
}

export interface UnifiedStatsData {
	dashboard?: DashboardStats;
	folders?: FolderStats;
	tasks?: TaskStats;
	financial?: FinancialStats;
	activity?: ActivityStats;
	notifications?: NotificationStats;
	matters?: MatterStats;
}

export interface DashboardStats {
	folders: {
		active: number;
		closed: number;
		total: number;
	};
	financial: {
		activeAmount: number;
		receivedAmount?: number;
		pendingAmount?: number;
	};
	deadlines: {
		nextWeek: number;
		next15Days: number;
		next30Days: number;
	};
	tasks: {
		pending: number;
		completed: number;
		overdue: number;
	};
	notifications: {
		unread: number;
		total?: number;
	};
	trends: {
		foldersLastMonth?: number;
		tasksLastMonth?: number;
		revenueLastMonth?: number;
		newFolders?: TrendItem[];
		closedFolders?: TrendItem[];
		movements?: TrendItem[];
		calculators?: TrendItem[];
		tasks?: TrendItem[];
		deadlines?: TrendItem[];
	};
}

export interface FolderStats {
	distribution: {
		nueva: number;
		enProceso: number;
		cerrada: number;
		pendiente: number;
	};
	resolutionTimes: {
		overall: number;
		byStatus: {
			nueva: number;
			enProceso: number;
			pendiente: number;
		};
	};
	upcomingDeadlines?: {
		"7_days": number;
		"15_days": number;
		"30_days": number;
	};
	byMatter?: {
		distribution: { [key: string]: number };
		averageAmount: { [key: string]: number };
		resolutionTime: { [key: string]: number };
	};
}

export interface TaskStats {
	metrics?: {
		completionRate: number;
		pendingTasks: number;
		completedTasks: number;
		overdueTasks: number;
	};
	completionRate: number;
	pendingTasks?: number;
	completedTasks?: number;
	overdueTasks?: number;
	tasksByPriority?: {
		high: number;
		medium: number;
		low: number;
	};
	tasksByType?: {
		[key: string]: number;
	};
}

export interface FinancialStats {
	totalActiveAmount: number;
	totalReceivedAmount?: number;
	totalPendingAmount?: number;
	averageAmountPerFolder?: number;
	paymentRate?: number;
	amountByStatus?: {
		[key: string]: number;
	};
	calculatorsByType?: {
		[key: string]: number;
	};
	calculatorsAmountByType?: {
		[key: string]: number;
	};
}

export interface ActivityStats {
	metrics?: {
		dailyAverage: number;
		weeklyAverage: number;
		monthlyAverage: number;
		mostActiveDay: string;
	};
	trends?: {
		newFolders?: TrendItem[];
		closedFolders?: TrendItem[];
		movements?: TrendItem[];
		calculators?: TrendItem[];
		foldersLastMonth?: number;
		tasksLastMonth?: number;
		revenueLastMonth?: number;
	};
	recentActivity?: ActivityItem[];
}

export interface NotificationStats {
	unreadCount: number;
	averageReadTime?: number;
	responseRate?: number;
	byType?: {
		[key: string]: number;
	};
}

export interface MatterStats {
	distribution: {
		[key: string]: number;
	};
	averageAmount?: {
		[key: string]: number;
	};
	resolutionTime?: {
		[key: string]: number;
	};
	topMatters?: {
		matter: string;
		count: number;
	}[];
}

export interface TrendItem {
	month: string;
	count: number;
	_id?: string;
}

export interface ActivityItem {
	type: string;
	description: string;
	timestamp: string;
}

// Estado del reducer
export interface UnifiedStatsState {
	isInitialized: boolean;
	lastFetchedUserId: string | null;
	lastFetchTime: number | null;
	isLoading: boolean;
	error: string | null;
	data: UnifiedStatsData | null;
	lastUpdated: string | null;
	descriptions: UnifiedStatsDescriptions | null;
	cacheInfo: CacheInfo | null;
	history: AnalyticsHistoryItem[];
	historyLoading: boolean;
	selectedHistoryId: string | null;
}

// Tipos para las descripciones
export interface UnifiedStatsDescriptions {
	dashboard?: {
		folders?: {
			active?: string;
			closed?: string;
			total?: string;
		};
		financial?: {
			activeAmount?: string;
			receivedAmount?: string;
			pendingAmount?: string;
		};
		deadlines?: {
			nextWeek?: string;
			next15Days?: string;
			next30Days?: string;
		};
		tasks?: {
			pending?: string;
			completed?: string;
			overdue?: string;
		};
		notifications?: {
			unread?: string;
			total?: string;
		};
		trends?: string;
	};
	folders?: {
		distribution?: string;
		resolutionTimes?: {
			overall?: string;
			byStatus?: string;
		};
		upcomingDeadlines?: string;
		byMatter?: {
			distribution?: string;
			averageAmount?: string;
			resolutionTime?: string;
		};
	};
	tasks?: {
		metrics?: {
			completionRate?: string;
			pendingTasks?: string;
			completedTasks?: string;
			overdueTasks?: string;
		};
	};
	financial?: {
		totalActiveAmount?: string;
		averageAmountPerFolder?: string;
		amountByStatus?: string;
		calculatorsByType?: string;
		calculatorsAmountByType?: string;
	};
	activity?: {
		metrics?: {
			dailyAverage?: string;
			weeklyAverage?: string;
			monthlyAverage?: string;
			mostActiveDay?: string;
		};
		trends?: string;
	};
	notifications?: {
		unreadCount?: string;
		averageReadTime?: string;
		responseRate?: string;
	};
	matters?: {
		distribution?: string;
		averageAmount?: string;
		resolutionTime?: string;
	};
}
