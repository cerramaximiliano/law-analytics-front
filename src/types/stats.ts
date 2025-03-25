// types/stats.ts
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

export interface ActivityMetrics {
	dailyAverage: number;
	weeklyAverage: number;
	monthlyAverage: number;
	mostActiveDay: string;
}

export interface FinancialMetrics {
	totalActiveAmount: number;
	averageAmountPerFolder: number;
	amountByStatus: {
		nueva: number;
		enProceso: number;
		cerrada: number;
		pendiente: number;
	};
	calculatorsByType: {
		calculado: number;
		ofertado: number;
		reclamado: number;
	};
	calculatorsAmountByType: {
		calculado: number;
		ofertado: number;
		reclamado: number;
	};
}

export interface TaskMetrics {
	completionRate: number;
	pendingTasks: number;
	completedTasks: number;
	overdueTasks: number;
}

export interface NotificationMetrics {
	unreadCount: number;
	averageReadTime: number;
	responseRate: number;
}

export interface TrendItem {
	month: string;
	count: number;
}

export interface TrendData {
	newFolders: TrendItem[];
	closedFolders: TrendItem[];
	movements: TrendItem[];
	calculators: TrendItem[];
}

export interface FolderAnalytics {
	distribution: FolderDistribution;
	resolutionTimes: ResolutionTimes;
	deadlines: UpcomingDeadlines;
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

export interface UserAnalytics {
	folderStatusDistribution: FolderDistribution;
	averageResolutionTimes: ResolutionTimes;
	upcomingDeadlines: UpcomingDeadlines;
	activityMetrics: ActivityMetrics;
	financialMetrics: FinancialMetrics;
	taskMetrics: TaskMetrics;
	notificationMetrics: NotificationMetrics;
	trendData: TrendData;
	lastUpdated: string;
	dataQuality: number;
	analyticsVersion: string;
}
