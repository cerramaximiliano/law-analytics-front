import { ReactElement } from "react";
import { CredentialResponse } from "@react-oauth/google";

// third-party
import firebase from "firebase/compat/app";

// ==============================|| TYPES - AUTH  ||============================== //

export type GuardProps = {
	children: ReactElement | null;
};

// Definimos la interfaz para el objeto de colegio con matrícula
interface LawyerCollegeWithRegistration {
	name: string;
	registrationNumber: string;
}

// Definimos el tipo para las skills que pueden ser string[] o LawyerCollegeWithRegistration[]
type UserSkills = string[] | LawyerCollegeWithRegistration[];

export type UserProfile = {
	_id?: string;
	groupId?: string;
	address?: string;
	address1?: string;
	avatar?: string;
	contact?: string;
	country?: string;
	designation?: string;
	dob?: string;
	email?: string;
	firstName?: string;
	id?: string;
	image?: string;
	lastName?: string;
	name?: string;
	note?: string;
	picture?: string;
	role?: string;
	skill?: UserSkills;
	state?: string;
	subscription?: string;
	tier?: string;
	users?: User[];
	url?: string;
	zipCode?: string;
	isVerified?: boolean;
	profileCompletionScore?: number;
};

type User = {
	userId: string;
	name: string;
	email: string;
	role: string;
	status: string;
	avatar?: string;
};

export interface AuthProps {
	isLoggedIn: boolean;
	isInitialized: boolean;
	user?: UserProfile | null;
	email?: string;
	token?: string | null;
	needsVerification?: boolean;
	plan?: string;
}

export interface AuthActionProps {
	type: string;
	payload?: {
		user?: UserProfile;
		email?: string;
		needsVerification?: boolean;
		isLoggedIn?: boolean;
		isInitialized?: boolean;
		picture?: string;
	};
}

export type FirebaseContextType = {
	isLoggedIn: boolean;
	isInitialized?: boolean;
	user?: UserProfile | null | undefined;
	logout: () => Promise<void>;
	login: () => void;
	firebaseRegister: (email: string, password: string) => Promise<firebase.auth.UserCredential>;
	firebaseEmailPasswordSignIn: (email: string, password: string) => Promise<firebase.auth.UserCredential>;
	firebaseGoogleSignIn: () => Promise<firebase.auth.UserCredential>;
	firebaseTwitterSignIn: () => Promise<firebase.auth.UserCredential>;
	firebaseFacebookSignIn: () => Promise<firebase.auth.UserCredential>;
	resetPassword: (email: string) => Promise<void>;
	updateProfile: VoidFunction;
};

export type AWSCognitoContextType = {
	isLoggedIn: boolean;
	isInitialized?: boolean;
	user?: UserProfile | null | undefined;
	logout: () => void;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, firstName: string, lastName: string) => Promise<unknown>;
	resetPassword: (verificationCode: string, newPassword: string) => Promise<any>;
	forgotPassword: (email: string) => Promise<void>;
	updateProfile: VoidFunction;
};

export interface InitialLoginContextProps {
	isLoggedIn: boolean;
	isInitialized?: boolean;
	user?: UserProfile | null | undefined;
}

export interface JWTDataProps {
	userId: string;
}

export type JWTContextType = {
	isLoggedIn: boolean;
	isInitialized?: boolean;
	user?: UserProfile | null | undefined;
	logout: () => void;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	updateProfile: VoidFunction;
};

// Interfaces para respuestas de la API
export interface LoginResponse {
	user: UserProfile;
	success?: boolean;
	message?: string;
	accessToken?: string;
	refreshToken?: string;
	needsVerification?: boolean;
}

export interface RegisterResponse {
	user: UserProfile;
	token?: string;
	needsVerification: boolean;
}

export interface VerifyCodeResponse {
	success: boolean;
	message: string;
	user?: UserProfile; // Información del usuario después de la verificación
}

// Interfaz actualizada para el contexto del servidor
export interface ServerContextType extends AuthProps {
	isGoogleLoggedIn: boolean;
	login: (email: string, password: string) => Promise<boolean>;
	logout: (showMessage?: boolean) => Promise<void>;
	register: (
		email: string,
		password: string,
		firstName: string,
		lastName: string,
	) => Promise<{ email: string; isLoggedIn: boolean; needsVerification: boolean }>;
	verifyCode?: (email: string, code: string) => Promise<VerifyCodeResponse>;
	updateProfile: (userData: Partial<UserProfile>) => Promise<void>;
	setIsLoggedIn: (value: boolean) => void;
	setNeedsVerification: (value: boolean) => void;
	loginWithGoogle: (tokenResponse: CredentialResponse) => Promise<boolean>;
	handleLogoutAndRedirect?: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	verifyResetCode: (email: string, code: string) => Promise<boolean>;
	setNewPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
	hasPlanRestrictionError: boolean;
	hideInternationalBankingData: boolean;
}

export interface UnauthorizedModalProps {
	open: boolean;
	onClose: () => void;
	onLogin: (email: string, password: string) => Promise<boolean>;
	onGoogleLogin: (response: CredentialResponse) => Promise<boolean>;
	onLogout: () => void;
}

export interface FormValues {
	email: string;
	password: string;
	submit: string | null;
}

export type Auth0ContextType = {
	isLoggedIn: boolean;
	isInitialized?: boolean;
	user?: UserProfile | null | undefined;
	logout: () => void;
	login: () => void;
	resetPassword: (email: string) => Promise<void>;
	updateProfile: VoidFunction;
};
