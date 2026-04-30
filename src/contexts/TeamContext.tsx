import React, { createContext, useContext, useCallback, useEffect, useMemo, ReactNode } from "react";
import { useDispatch, useSelector } from "store";
import { Team, TeamRole, TeamAction, canRolePerformAction, OwnerSubscription } from "types/teams";
import { getUserTeams, setActiveTeam as setActiveTeamAction, clearActiveTeam, getTeamById } from "store/reducers/teams";

// Types for the context
interface TeamContextType {
	// State
	teams: Team[];
	activeTeam: Team | null;
	userRole: TeamRole | "owner" | null;
	isTeamMode: boolean; // true when user has teams (always in team mode)
	hasMultipleTeams: boolean; // true when user belongs to more than one team
	isLoading: boolean;
	isInitialized: boolean;
	isReady: boolean; // true when context is fully ready (initialized AND team selected if applicable)
	error: string | null;
	ownerSubscription: OwnerSubscription | null; // Subscription from team owner for feature inheritance

	// Actions
	setActiveTeam: (team: Team | null) => void;
	switchTeam: (teamId: string) => void; // Switch between teams (replaces switchToPersonalMode)
	refreshTeams: () => Promise<void>;
	refreshActiveTeam: () => Promise<void>;

	// Permission helpers
	hasPermission: (action: TeamAction) => boolean;
	hasTeamFeature: (featureName: string) => boolean; // Check if team owner has a feature
	canCreate: boolean;
	canRead: boolean;
	canUpdate: boolean;
	canDelete: boolean;
	canManageMembers: boolean;
	isOwner: boolean;
	isAdmin: boolean;

	// Utility
	getTeamIdForResource: () => string | undefined;
	getUserIdForResource: () => string;
	getRequestHeaders: () => Record<string, string>; // Headers for API requests with team context
}

// Initial context value
const initialContextValue: TeamContextType = {
	teams: [],
	activeTeam: null,
	userRole: null,
	isTeamMode: false,
	hasMultipleTeams: false,
	isLoading: false,
	isInitialized: false,
	isReady: false,
	error: null,
	ownerSubscription: null,
	setActiveTeam: () => {},
	switchTeam: () => {},
	refreshTeams: async () => {},
	refreshActiveTeam: async () => {},
	hasPermission: () => false,
	hasTeamFeature: () => false,
	canCreate: true,
	canRead: true,
	canUpdate: true,
	canDelete: true,
	canManageMembers: false,
	isOwner: false,
	isAdmin: false,
	getTeamIdForResource: () => undefined,
	getUserIdForResource: () => "",
	getRequestHeaders: () => ({}),
};

// Create context
const TeamContext = createContext<TeamContextType>(initialContextValue);

// Provider props
interface TeamProviderProps {
	children: ReactNode;
}

// Provider component
export function TeamProvider({ children }: TeamProviderProps) {
	const dispatch = useDispatch();

	// Get state from Redux
	const { teams, activeTeam, currentUserRole, isLoading, isInitialized, error } = useSelector((state) => state.teams);
	const auth = useSelector((state) => state.auth);
	const currentUserId = auth.user?._id;

	// NEW LOGIC: User is in "team mode" if they have any teams
	// There's no longer a "personal mode" - if you have teams, you're always in team context
	const isTeamMode = teams.length > 0;
	const hasMultipleTeams = teams.length > 1;

	// Determine if current user is the owner of the active team
	// Need to compute this BEFORE isReady check
	const isCurrentUserOwner = useMemo(() => {
		if (!activeTeam || !currentUserId) return false;
		const ownerId = typeof activeTeam.owner === "string" ? activeTeam.owner : (activeTeam.owner as any)?._id;
		return ownerId === currentUserId;
	}, [activeTeam, currentUserId]);

	// Owner subscription for feature inheritance
	const ownerSubscription = useMemo(() => {
		return activeTeam?.ownerSubscription ?? null;
	}, [activeTeam?.ownerSubscription]);

	// isReady: true when context is fully ready for feature checks
	// - If not initialized → not ready
	// - If initialized AND has teams but no activeTeam yet → not ready (still auto-selecting)
	// - If initialized AND no teams → ready (user is not in team mode)
	// - If initialized AND has activeTeam AND is owner → ready
	// - If initialized AND has activeTeam AND is NOT owner → ready only if ownerSubscription is available
	const isReady = useMemo(() => {
		if (!isInitialized) return false;
		if (teams.length > 0 && !activeTeam) return false; // Still waiting for auto-select
		// If user is a team member (not owner), wait for ownerSubscription to be available
		if (activeTeam && !isCurrentUserOwner && !ownerSubscription) {
			return false;
		}
		return true;
	}, [isInitialized, teams.length, activeTeam, isCurrentUserOwner, ownerSubscription]);

	// Helper to extract userId from member (handles both string and populated object)
	const getMemberUserId = (member: any): string | undefined => {
		if (!member?.userId) return undefined;
		return typeof member.userId === "string" ? member.userId : member.userId?._id;
	};

	// Determine the user's role in the active team
	const userRole = useMemo(() => {
		if (!activeTeam || !currentUserId) return null;

		// Check if user is owner (already computed in isCurrentUserOwner)
		if (isCurrentUserOwner) {
			return "owner" as const;
		}

		// Find user in members (handle populated userId objects)
		const member = activeTeam.members?.find((m) => getMemberUserId(m) === currentUserId);
		return member?.role ?? currentUserRole;
	}, [activeTeam, currentUserId, currentUserRole, isCurrentUserOwner]);

	// Permission helpers
	const hasPermission = useCallback(
		(action: TeamAction): boolean => {
			// If not in team mode, user has all permissions on their own resources
			if (!isTeamMode) return true;

			// If no role, no permissions
			if (!userRole) return false;

			return canRolePerformAction(userRole, action);
		},
		[isTeamMode, userRole],
	);

	// Memoized permission flags
	const canCreate = useMemo(() => hasPermission("create"), [hasPermission]);
	const canRead = useMemo(() => hasPermission("read"), [hasPermission]);
	const canUpdate = useMemo(() => hasPermission("update"), [hasPermission]);
	const canDelete = useMemo(() => hasPermission("delete"), [hasPermission]);
	const canManageMembers = useMemo(() => hasPermission("manage_members"), [hasPermission]);
	const isOwner = userRole === "owner";
	const isAdmin = userRole === "admin" || userRole === "owner";

	// Check if team owner has a specific feature
	const hasTeamFeature = useCallback(
		(featureName: string): boolean => {
			if (!isTeamMode || !ownerSubscription) return false;
			return ownerSubscription.features?.[featureName] ?? false;
		},
		[isTeamMode, ownerSubscription],
	);

	// Actions
	const setActiveTeam = useCallback(
		async (team: Team | null) => {
			if (team && currentUserId) {
				// Determine role
				// owner can be a string (ID) or an object with _id (when populated)
				const ownerId = typeof team.owner === "string" ? team.owner : (team.owner as any)?._id;

				let role: TeamRole | "owner" = "viewer";
				if (ownerId === currentUserId) {
					role = "owner";
				} else {
					// Handle populated userId objects in members
					const member = team.members?.find((m) => {
						const memberId = typeof m.userId === "string" ? m.userId : (m.userId as any)?._id;
						return memberId === currentUserId;
					});
					if (member) {
						role = member.role;
					}
				}
				dispatch(setActiveTeamAction(team, role) as any);
				// Fetch full team details to get invitations and other data
				await dispatch(getTeamById(team._id) as any);
			} else {
				dispatch(clearActiveTeam() as any);
			}
		},
		[dispatch, currentUserId],
	);

	// Switch between teams (no more "personal mode")
	const switchTeam = useCallback(
		async (teamId: string) => {
			const team = teams.find((t) => t._id === teamId);
			if (team) {
				await setActiveTeam(team);
			}
		},
		[teams, setActiveTeam],
	);

	const refreshTeams = useCallback(async () => {
		await dispatch(getUserTeams() as any);
	}, [dispatch]);

	const refreshActiveTeam = useCallback(async () => {
		if (activeTeam) {
			await dispatch(getTeamById(activeTeam._id) as any);
		}
	}, [dispatch, activeTeam]);

	// Utility functions
	const getTeamIdForResource = useCallback((): string | undefined => {
		// Always return team ID if user has teams and an active team is selected
		return activeTeam ? activeTeam._id : undefined;
	}, [activeTeam]);

	const getUserIdForResource = useCallback((): string => {
		// When in team mode, resources belong to the team owner
		// The backend will handle this via req.teamContext, but we provide it for consistency
		if (activeTeam) {
			// owner can be a string (ID) or an object with _id (when populated)
			const ownerId = typeof activeTeam.owner === "string" ? activeTeam.owner : (activeTeam.owner as any)?._id;
			return ownerId || "";
		}
		return currentUserId || "";
	}, [activeTeam, currentUserId]);

	// Get headers for API requests with team context
	const getRequestHeaders = useCallback((): Record<string, string> => {
		if (activeTeam) {
			return { "X-Group-Id": activeTeam._id };
		}
		return {};
	}, [activeTeam]);

	// Initialize teams on mount
	useEffect(() => {
		if (currentUserId && !isInitialized) {
			dispatch(getUserTeams() as any);
		}
	}, [currentUserId, isInitialized, dispatch]);

	// Auto-select team: restore from localStorage or select the first/only team
	useEffect(() => {
		if (teams.length === 0 || activeTeam) return;

		// Try to restore from localStorage first
		const storedTeamId = localStorage.getItem("activeTeamId");
		if (storedTeamId) {
			const team = teams.find((t) => t._id === storedTeamId);
			if (team) {
				setActiveTeam(team);
				return;
			} else {
				// Team no longer exists or user doesn't have access - clean up
				localStorage.removeItem("activeTeamId");
				localStorage.removeItem("activeTeamRole");
			}
		}

		// NEW: Auto-select the first team if user has teams but none is active
		// This ensures user is always in "team mode" when they have teams
		if (teams.length > 0) {
			setActiveTeam(teams[0]);
		}
	}, [teams, activeTeam, setActiveTeam]);

	// Context value
	const contextValue = useMemo<TeamContextType>(
		() => ({
			teams,
			activeTeam,
			userRole,
			isTeamMode,
			hasMultipleTeams,
			isLoading,
			isInitialized,
			isReady,
			error,
			ownerSubscription,
			setActiveTeam,
			switchTeam,
			refreshTeams,
			refreshActiveTeam,
			hasPermission,
			hasTeamFeature,
			canCreate,
			canRead,
			canUpdate,
			canDelete,
			canManageMembers,
			isOwner,
			isAdmin,
			getTeamIdForResource,
			getUserIdForResource,
			getRequestHeaders,
		}),
		[
			teams,
			activeTeam,
			userRole,
			isTeamMode,
			hasMultipleTeams,
			isLoading,
			isInitialized,
			isReady,
			error,
			ownerSubscription,
			setActiveTeam,
			switchTeam,
			refreshTeams,
			refreshActiveTeam,
			hasPermission,
			hasTeamFeature,
			canCreate,
			canRead,
			canUpdate,
			canDelete,
			canManageMembers,
			isOwner,
			isAdmin,
			getTeamIdForResource,
			getUserIdForResource,
			getRequestHeaders,
		],
	);

	return <TeamContext.Provider value={contextValue}>{children}</TeamContext.Provider>;
}

// Hook to use the context
export function useTeam() {
	const context = useContext(TeamContext);
	if (!context) {
		throw new Error("useTeam must be used within a TeamProvider");
	}
	return context;
}

// Hook for checking feature availability (teams feature requires paid plan)
export function useTeamsFeature() {
	const auth = useSelector((state) => state.auth);
	// Subscription is a top-level field in auth state, not inside user
	const subscription = auth.subscription;

	const isTeamsEnabled = useMemo(() => {
		if (!subscription) {
			return false;
		}

		const plan = subscription.plan?.toLowerCase();

		// Method 1: Check features object directly (if teams feature exists)
		if (subscription.features?.teams === true) {
			return true;
		}

		// Method 2: Check featuresWithDescriptions array (if available)
		if (subscription.featuresWithDescriptions) {
			const teamsFeature = subscription.featuresWithDescriptions.find((f: { name: string; enabled: boolean }) => f.name === "teams");
			if (teamsFeature?.enabled) {
				return true;
			}
		}

		// Method 3: Fallback - teams is enabled for standard and premium plans
		if (plan === "standard" || plan === "premium") {
			return true;
		}

		return false;
	}, [subscription]);

	const maxTeamMembers = useMemo(() => {
		if (!subscription) return 0;

		// Method 1: Check limitsWithDescriptions array
		if (subscription.limitsWithDescriptions) {
			const teamMembersLimit = subscription.limitsWithDescriptions.find((l: { name: string; limit: number }) => l.name === "teamMembers");
			if (teamMembersLimit) {
				return teamMembersLimit.limit;
			}
		}

		// Method 2: Fallback based on plan
		const plan = subscription.plan?.toLowerCase();
		if (plan === "premium") return 10;
		if (plan === "standard") return 5;
		return 0;
	}, [subscription]);

	// Get plan name for display (in Spanish)
	const planName = useMemo(() => {
		if (!subscription?.plan) return "Gratuito";
		const plan = subscription.plan.toLowerCase();
		if (plan === "premium") return "Premium";
		if (plan === "standard") return "Estándar";
		return "Gratuito";
	}, [subscription]);

	return {
		isTeamsEnabled,
		maxTeamMembers,
		planName,
	};
}

export { TeamContext };
