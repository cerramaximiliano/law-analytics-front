// types for user

// Interfaz para la suscripción del usuario
export interface Subscription {
	_id: string;
	user: string;
	name: string; // Plan name for display
	stripeCustomerId: string;
	stripeSubscriptionId?: string;
	stripePriceId?: string;
	plan: "free" | "standard" | "premium";
	status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	startDate: Date; // Start date
	endDate?: Date; // End date
	cancelAtPeriodEnd: boolean;
	trialStart?: Date;
	trialEnd?: Date;
	canceledAt?: Date;
	paymentMethod?: string;
	paymentInfo?: {
		method: string;
		lastPayment?: Date;
		nextPayment?: Date;
	};
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
		vinculateFolders: boolean;
		booking: boolean;
	};
}

export interface User {
	id: string;
	_id: string; // Add _id property that matches id
	email: string;
	name: string;
	role: string;
	status: string;
	avatar?: string;
	phone?: string;
	lastLogin?: string;
	subscription?: Subscription;
	createdAt: string;
	updatedAt: string;
}

export interface UsersResponse {
	users: User[];
	total: number;
}

export interface UserResponse {
	user: User;
	subscription?: Subscription;
}
