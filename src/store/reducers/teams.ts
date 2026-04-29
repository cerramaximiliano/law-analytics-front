// reducers/teams.ts

import axios from "axios";
import { Dispatch } from "redux";
import {
	Team,
	TeamState,
	TeamRole,
	CreateTeamRequest,
	UpdateTeamRequest,
	SendInvitationsRequest,
	AcceptInvitationRequest,
	VerifyInvitationResponse,
	AcceptInvitationResponse,
} from "types/teams";

// Action types
const SET_TEAMS_LOADING = "SET_TEAMS_LOADING";
const GET_USER_TEAMS = "GET_USER_TEAMS";
const GET_TEAM_BY_ID = "GET_TEAM_BY_ID";
const CREATE_TEAM = "CREATE_TEAM";
const UPDATE_TEAM = "UPDATE_TEAM";
const DELETE_TEAM = "DELETE_TEAM";
const SET_ACTIVE_TEAM = "SET_ACTIVE_TEAM";
const CLEAR_ACTIVE_TEAM = "CLEAR_ACTIVE_TEAM";
const SEND_INVITATIONS = "SEND_INVITATIONS";
const CANCEL_INVITATION = "CANCEL_INVITATION";
const RESEND_INVITATION = "RESEND_INVITATION";
const UPDATE_MEMBER_ROLE = "UPDATE_MEMBER_ROLE";
const REMOVE_MEMBER = "REMOVE_MEMBER";
const MEMBER_LEFT = "MEMBER_LEFT";
const SET_TEAMS_ERROR = "SET_TEAMS_ERROR";
const RESET_TEAMS_STATE = "RESET_TEAMS_STATE";
const SET_CURRENT_USER_ROLE = "SET_CURRENT_USER_ROLE";

// Initial state
const initialTeamsState: TeamState = {
	teams: [],
	activeTeam: null,
	currentUserRole: null,
	isLoading: false,
	error: null,
	isInitialized: false,
};

// Reducer
const teams = (state = initialTeamsState, action: any): TeamState => {
	switch (action.type) {
		case SET_TEAMS_LOADING:
			return { ...state, isLoading: true, error: null };

		case GET_USER_TEAMS:
			return {
				...state,
				teams: action.payload,
				isLoading: false,
				isInitialized: true,
			};

		case GET_TEAM_BY_ID:
			return {
				...state,
				activeTeam: action.payload,
				teams: state.teams.map((team) => (team._id === action.payload._id ? action.payload : team)),
				isLoading: false,
			};

		case CREATE_TEAM:
			return {
				...state,
				teams: [...state.teams, action.payload],
				activeTeam: action.payload,
				currentUserRole: "owner",
				isLoading: false,
			};

		case UPDATE_TEAM:
			return {
				...state,
				activeTeam: state.activeTeam?._id === action.payload._id ? action.payload : state.activeTeam,
				teams: state.teams.map((team) => (team._id === action.payload._id ? action.payload : team)),
				isLoading: false,
			};

		case DELETE_TEAM:
			return {
				...state,
				teams: state.teams.filter((team) => team._id !== action.payload),
				activeTeam: state.activeTeam?._id === action.payload ? null : state.activeTeam,
				currentUserRole: state.activeTeam?._id === action.payload ? null : state.currentUserRole,
				isLoading: false,
			};

		case SET_ACTIVE_TEAM:
			return {
				...state,
				activeTeam: action.payload.team,
				currentUserRole: action.payload.role,
			};

		case CLEAR_ACTIVE_TEAM:
			return {
				...state,
				activeTeam: null,
				currentUserRole: null,
			};

		case SEND_INVITATIONS:
			// Update team with new invitations
			if (state.activeTeam && state.activeTeam._id === action.payload.teamId) {
				return {
					...state,
					activeTeam: {
						...state.activeTeam,
						invitations: [...(state.activeTeam.invitations || []), ...(action.payload.invitations || [])],
					},
					teams: state.teams.map((team) =>
						team._id === action.payload.teamId
							? {
									...team,
									invitations: [...(team.invitations || []), ...(action.payload.invitations || [])],
							  }
							: team,
					),
					isLoading: false,
				};
			}
			return { ...state, isLoading: false };

		case CANCEL_INVITATION:
			if (state.activeTeam) {
				const updatedInvitations = (state.activeTeam.invitations || []).filter((inv) => inv._id !== action.payload.invitationId);
				return {
					...state,
					activeTeam: {
						...state.activeTeam,
						invitations: updatedInvitations,
					},
					teams: state.teams.map((team) => (team._id === action.payload.teamId ? { ...team, invitations: updatedInvitations } : team)),
					isLoading: false,
				};
			}
			return { ...state, isLoading: false };

		case RESEND_INVITATION:
			if (state.activeTeam) {
				const updatedInvitations = (state.activeTeam.invitations || []).map((inv) =>
					inv._id === action.payload.invitationId ? { ...inv, sentAt: new Date().toISOString() } : inv,
				);
				return {
					...state,
					activeTeam: {
						...state.activeTeam,
						invitations: updatedInvitations,
					},
					isLoading: false,
				};
			}
			return { ...state, isLoading: false };

		case UPDATE_MEMBER_ROLE:
			if (state.activeTeam) {
				const updatedMembers = (state.activeTeam.members || []).map((member) =>
					member.userId === action.payload.userId ? { ...member, role: action.payload.role } : member,
				);
				return {
					...state,
					activeTeam: {
						...state.activeTeam,
						members: updatedMembers,
					},
					teams: state.teams.map((team) => (team._id === action.payload.teamId ? { ...team, members: updatedMembers } : team)),
					isLoading: false,
				};
			}
			return { ...state, isLoading: false };

		case REMOVE_MEMBER:
			if (state.activeTeam) {
				const filteredMembers = (state.activeTeam.members || []).filter((member) => member.userId !== action.payload.userId);
				return {
					...state,
					activeTeam: {
						...state.activeTeam,
						members: filteredMembers,
					},
					teams: state.teams.map((team) => (team._id === action.payload.teamId ? { ...team, members: filteredMembers } : team)),
					isLoading: false,
				};
			}
			return { ...state, isLoading: false };

		case MEMBER_LEFT:
			// Remove the team from the user's list when they leave
			return {
				...state,
				teams: state.teams.filter((team) => team._id !== action.payload.teamId),
				activeTeam: state.activeTeam?._id === action.payload.teamId ? null : state.activeTeam,
				currentUserRole: state.activeTeam?._id === action.payload.teamId ? null : state.currentUserRole,
				isLoading: false,
			};

		case SET_CURRENT_USER_ROLE:
			return {
				...state,
				currentUserRole: action.payload,
			};

		case SET_TEAMS_ERROR:
			return {
				...state,
				error: action.payload,
				isLoading: false,
			};

		case RESET_TEAMS_STATE:
			return initialTeamsState;

		default:
			return state;
	}
};

// Action creators

/**
 * Get all teams for the current user (owned and member of)
 */
export const getUserTeams = () => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/groups`);

		if (response.data.success) {
			dispatch({
				type: GET_USER_TEAMS,
				payload: response.data.groups,
			});
			return { success: true, teams: response.data.groups };
		}
		return { success: false, message: "Error al obtener equipos" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al obtener equipos" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Get a specific team by ID
 */
export const getTeamById = (teamId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}`);

		if (response.data.success) {
			dispatch({
				type: GET_TEAM_BY_ID,
				payload: response.data.group,
			});
			return { success: true, team: response.data.group };
		}
		return { success: false, message: "Equipo no encontrado" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al obtener equipo" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Create a new team
 */
export const createTeam = (data: CreateTeamRequest) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/groups`, data);

		if (response.data.success) {
			dispatch({
				type: CREATE_TEAM,
				payload: response.data.group,
			});
			return { success: true, team: response.data.group };
		}
		return {
			success: false,
			message: response.data.message || "Error al crear equipo",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al crear equipo" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Update a team
 */
export const updateTeam = (teamId: string, data: UpdateTeamRequest) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}`, data);

		if (response.data.success) {
			dispatch({
				type: UPDATE_TEAM,
				payload: response.data.group,
			});
			return { success: true, team: response.data.group };
		}
		return {
			success: false,
			message: response.data.message || "Error al actualizar equipo",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al actualizar equipo" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Delete a team (only owner)
 */
export const deleteTeam = (teamId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}`);

		if (response.data.success) {
			dispatch({
				type: DELETE_TEAM,
				payload: teamId,
			});
			return { success: true };
		}
		return {
			success: false,
			message: response.data.message || "Error al eliminar equipo",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al eliminar equipo" : "Error desconocido";
		return { success: false, message: errorMessage };
	}
};

/**
 * Set the active team for the current session
 */
export const setActiveTeam =
	(team: Team | null, role: TeamRole | "owner" | null = null) =>
	(dispatch: Dispatch) => {
		if (team) {
			dispatch({
				type: SET_ACTIVE_TEAM,
				payload: { team, role },
			});
			// Persist to localStorage
			localStorage.setItem("activeTeamId", team._id);
			if (role) {
				localStorage.setItem("activeTeamRole", role);
			}
		} else {
			dispatch({ type: CLEAR_ACTIVE_TEAM });
			localStorage.removeItem("activeTeamId");
			localStorage.removeItem("activeTeamRole");
		}
	};

/**
 * Clear the active team (switch to personal mode)
 */
export const clearActiveTeam = () => (dispatch: Dispatch) => {
	dispatch({ type: CLEAR_ACTIVE_TEAM });
	localStorage.removeItem("activeTeamId");
	localStorage.removeItem("activeTeamRole");
};

/**
 * Send invitations to join a team
 */
export const sendInvitations = (teamId: string, data: SendInvitationsRequest) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}/invitations`, data);

		if (response.data.success) {
			dispatch({
				type: SEND_INVITATIONS,
				payload: {
					teamId,
					invitations: response.data.invitations,
				},
			});
			return {
				success: true,
				invitations: response.data.invitations,
				results: response.data.results,
			};
		}
		return {
			success: false,
			message: response.data.message || "Error al enviar invitaciones",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al enviar invitaciones" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Cancel a pending invitation
 */
export const cancelInvitation = (teamId: string, invitationId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}/invitations/${invitationId}`);

		if (response.data.success) {
			dispatch({
				type: CANCEL_INVITATION,
				payload: { teamId, invitationId },
			});
			return { success: true };
		}
		return {
			success: false,
			message: response.data.message || "Error al cancelar invitación",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al cancelar invitación" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Resend a pending invitation
 */
export const resendInvitation = (teamId: string, invitationId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}/invitations/${invitationId}/resend`);

		if (response.data.success) {
			dispatch({
				type: RESEND_INVITATION,
				payload: { teamId, invitationId },
			});
			return { success: true };
		}
		return {
			success: false,
			message: response.data.message || "Error al reenviar invitación",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al reenviar invitación" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Update a member's role
 */
export const updateMemberRole = (teamId: string, userId: string, role: TeamRole) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}/members/${userId}/role`, { role });

		if (response.data.success) {
			dispatch({
				type: UPDATE_MEMBER_ROLE,
				payload: { teamId, userId, role },
			});
			return { success: true };
		}
		return {
			success: false,
			message: response.data.message || "Error al cambiar rol",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al cambiar rol" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Remove a member from the team
 */
export const removeMember = (teamId: string, userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_TEAMS_LOADING });
		const response = await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}/members/${userId}`);

		if (response.data.success) {
			dispatch({
				type: REMOVE_MEMBER,
				payload: { teamId, userId },
			});
			return { success: true };
		}
		return {
			success: false,
			message: response.data.message || "Error al remover miembro",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al remover miembro" : "Error desconocido";
		dispatch({
			type: SET_TEAMS_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

/**
 * Leave a team (current user)
 */
export const leaveTeam = (teamId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/groups/${teamId}/leave`);

		if (response.data.success) {
			dispatch({
				type: MEMBER_LEFT,
				payload: { teamId },
			});
			// Clear localStorage if this was the active team
			const storedTeamId = localStorage.getItem("activeTeamId");
			if (storedTeamId === teamId) {
				localStorage.removeItem("activeTeamId");
				localStorage.removeItem("activeTeamRole");
			}
			return { success: true };
		}
		return {
			success: false,
			message: response.data.message || "Error al abandonar equipo",
		};
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al abandonar equipo" : "Error desconocido";
		return { success: false, message: errorMessage };
	}
};

/**
 * Verify an invitation token (public route)
 */
export const verifyInvitation = async (token: string): Promise<VerifyInvitationResponse> => {
	try {
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/groups/invitations/verify/${token}`);
		return response.data;
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al verificar invitación" : "Error desconocido";
		return { valid: false, error: errorMessage };
	}
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (token: string, data?: AcceptInvitationRequest): Promise<AcceptInvitationResponse> => {
	try {
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/groups/invitations/accept/${token}`, data || {});
		return response.data;
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al aceptar invitación" : "Error desconocido";
		return { success: false, message: errorMessage };
	}
};

/**
 * Decline an invitation
 */
export const declineInvitation = async (token: string): Promise<{ success: boolean; message: string }> => {
	try {
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/groups/invitations/decline/${token}`);
		return response.data;
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al rechazar invitación" : "Error desconocido";
		return { success: false, message: errorMessage };
	}
};

/**
 * Reset teams state (useful for logout)
 */
export const resetTeamsState = () => {
	// Clear localStorage
	localStorage.removeItem("activeTeamId");
	localStorage.removeItem("activeTeamRole");
	return {
		type: RESET_TEAMS_STATE,
	};
};

/**
 * Initialize team from localStorage (call on app start)
 */
export const initializeTeamFromStorage = () => async (dispatch: Dispatch, getState: any) => {
	const storedTeamId = localStorage.getItem("activeTeamId");
	const storedRole = localStorage.getItem("activeTeamRole") as TeamRole | "owner" | null;

	if (storedTeamId) {
		// First, get all teams to populate the list
		await dispatch(getUserTeams() as any);

		const state = getState();
		const team = state.teams.teams.find((t: Team) => t._id === storedTeamId);

		if (team) {
			dispatch({
				type: SET_ACTIVE_TEAM,
				payload: { team, role: storedRole },
			});
		} else {
			// Team no longer exists or user no longer has access
			localStorage.removeItem("activeTeamId");
			localStorage.removeItem("activeTeamRole");
		}
	}
};

export default teams;
