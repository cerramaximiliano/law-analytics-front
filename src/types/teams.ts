// Types for the teams/multi-account system

export interface TeamMember {
	_id: string;
	userId: string;
	email: string;
	firstName?: string;
	lastName?: string;
	avatar?: string;
	role: TeamRole;
	status: "active" | "inactive";
	joinedAt: string;
	invitedBy?: string;
	lastActivityAt?: string;
}

export interface TeamInvitation {
	_id: string;
	email: string;
	role: TeamRole;
	status: "pending" | "accepted" | "rejected" | "expired" | "revoked";
	expiresAt: string;
	sentAt: string;
	invitedBy: string;
	inviterName?: string;
}

export interface TeamSettings {
	autoShareNewResources: boolean;
	defaultRole: "editor" | "viewer";
}

export interface TeamOwnerInfo {
	firstName: string;
	lastName: string;
	email: string;
	avatar?: string;
}

export interface TeamMetadata {
	totalResources: number;
	storageUsed: number;
}

// Stats del owner del equipo (para mostrar en perfil de todos los miembros)
export interface TeamOwnerStats {
	counts: {
		folders: number;
		contacts: number;
		calculators: number;
		events: number;
		tasks: number;
		notes: number;
	};
	storage: {
		total: number;
		folders: number;
		contacts: number;
		calculators: number;
		files: number;
		limit: number;
		limitMB: number;
		usedPercentage: number;
	};
}

// Feature info with display name for UI
export interface FeatureWithDescription {
	name: string;
	enabled: boolean;
	description?: string;
	displayName?: string; // Nombre amigable para mostrar en UI
}

// Subscription info from the team owner for feature inheritance
export interface OwnerSubscription {
	planName: "free" | "standard" | "premium";
	status: "active" | "canceled" | "past_due" | "trialing" | "paused" | "incomplete" | "incomplete_expired" | "unpaid";
	features: Record<string, boolean>;
	featuresWithDescriptions?: FeatureWithDescription[]; // Incluye displayName para UI
	resourceLimits?: Array<{
		name: string;
		limit: number;
		description?: string;
	}>;
}

export interface Team {
	_id: string;
	name: string;
	description?: string;
	owner: string;
	ownerInfo?: TeamOwnerInfo;
	status: "active" | "archived" | "deleted";
	members: TeamMember[];
	invitations: TeamInvitation[];
	settings: TeamSettings;
	metadata?: TeamMetadata;
	ownerSubscription?: OwnerSubscription;
	ownerStats?: TeamOwnerStats;
	createdAt: string;
	updatedAt: string;
}

export interface TeamState {
	teams: Team[];
	activeTeam: Team | null;
	currentUserRole: TeamRole | "owner" | null;
	isLoading: boolean;
	error: string | null;
	isInitialized: boolean;
}

// Roles and permissions
export const TEAM_ROLES = ["admin", "editor", "viewer"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ACTIONS = ["create", "read", "update", "delete", "manage_members"] as const;
export type TeamAction = (typeof TEAM_ACTIONS)[number];

export const TEAM_PERMISSIONS: Record<TeamRole, readonly TeamAction[]> = {
	admin: ["create", "read", "update", "delete", "manage_members"],
	editor: ["create", "read", "update"],
	viewer: ["read"],
} as const;

// Role display names and colors for UI
export const ROLE_CONFIG: Record<TeamRole | "owner", { label: string; color: "error" | "warning" | "info" | "success" }> = {
	owner: { label: "Propietario", color: "error" },
	admin: { label: "Administrador", color: "warning" },
	editor: { label: "Editor", color: "info" },
	viewer: { label: "Visualizador", color: "success" },
};

// Helper function to check if a role can perform an action
export const canRolePerformAction = (role: TeamRole | "owner", action: TeamAction): boolean => {
	if (role === "owner") return true; // Owner can do everything
	return TEAM_PERMISSIONS[role]?.includes(action) ?? false;
};

// API request/response types
export interface CreateTeamRequest {
	name: string;
	description?: string;
}

export interface UpdateTeamRequest {
	name?: string;
	description?: string;
	settings?: Partial<TeamSettings>;
}

export interface SendInvitationRequest {
	email: string;
	role: TeamRole;
}

export interface SendInvitationsRequest {
	invitations: SendInvitationRequest[];
}

export interface UpdateMemberRoleRequest {
	role: TeamRole;
}

export interface AcceptInvitationRequest {
	// For logged-in users - no extra data needed
	// For existing users not logged in
	email?: string;
	verificationCode?: string;
	// For new users
	password?: string;
	firstName?: string;
	lastName?: string;
}

export interface VerifyInvitationResponse {
	valid: boolean;
	invitation?: {
		email: string;
		role: TeamRole;
		groupName: string;
		inviterName: string;
		expiresAt: string;
	};
	userExists?: boolean;
	isLoggedIn?: boolean;
	error?: string;
}

export interface AcceptInvitationResponse {
	success: boolean;
	message: string;
	team?: Team;
	// For users that weren't logged in
	accessToken?: string;
	refreshToken?: string;
}
