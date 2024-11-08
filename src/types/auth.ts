import { ReactElement } from "react";

// third-party
import firebase from "firebase/compat/app";

// ==============================|| TYPES - AUTH  ||============================== //

export type GuardProps = {
	children: ReactElement | null;
};

export type UserProfile = {
	id?: string;
	email?: string;
	avatar?: string;
	image?: string;
	name?: string;
	role?: string;
	tier?: string;
	picture?: string;
};

export interface AuthProps {
	isLoggedIn: boolean;
	isInitialized?: boolean;
	user?: UserProfile | null;
	email?: string;
	token?: string | null;
	needsVerification?: boolean;
}

export interface AuthActionProps {
	type: string;
	payload?: AuthProps;
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

export interface ServerContextType {
	isLoggedIn: boolean;
	isInitialized?: boolean;
	user?: UserProfile | null | undefined;
	needsVerification?: boolean;
	email?: string;
	isGoogleLoggedIn: boolean; // Nuevo campo para el estado de autenticación de Google
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
	register: (
		email: string,
		password: string,
		firstName: string,
		lastName: string,
	) => Promise<{ isLoggedIn: boolean; needsVerification: boolean }>;
	resetPassword: (email: string) => Promise<void>;
	updateProfile: (userData: any) => Promise<void>;
	setIsLoggedIn: (value: boolean) => void;
	setNeedsVerification: (value: boolean) => void;
	loginWithGoogle: (value: any) => void; // Nuevo método para iniciar sesión con Google
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
