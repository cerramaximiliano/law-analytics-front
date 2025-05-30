// types for user

// Interfaz para los datos ligeros del usuario
export interface LightDataItem<T> {
	items: T[];
	count: number;
	totalCount: number;
}

export interface FolderLightData {
	_id: string;
	folderName: string;
	materia: string;
	status: string;
	initialDateFolder: string;
	finalDateFolder: string | null;
	amount: number;
}

export interface CalculatorLightData {
	_id: string;
	type: string;
	classType: string;
	amount: number;
	date: string;
	folderName: string;
}

export interface ContactLightData {
	_id: string;
	name: string;
	lastName: string;
	role: string;
	type: string;
	email: string;
	phone: string;
}

export interface EventLightData {
	_id: string;
	title: string;
	start: string;
	end: string;
	type: string;
	allDay: boolean;
}

export interface UserLightData {
	folders: LightDataItem<FolderLightData>;
	calculators: LightDataItem<CalculatorLightData>;
	contacts: LightDataItem<ContactLightData>;
	events: LightDataItem<EventLightData>;
}

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
	pendingPlanChange?: {
		planId: string;
		effectiveDate: Date;
	};
	downgradeGracePeriod?: {
		previousPlan: string;
		expiresAt: Date;
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
	lightData?: UserLightData;
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
	lightData?: UserLightData;
}
