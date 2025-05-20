// types for user

// Interfaz para la suscripción del usuario
export interface Subscription {
	id: string;
	name: string;
	planId: string;
	status: string;
	startDate: string;
	endDate?: string;
	features?: string[];
	limits?: {
		[key: string]: number;
	};
	paymentInfo?: {
		method: string;
		lastPayment?: string;
		nextPayment?: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface User {
	id: string;
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
