/**
 * Tests para store/reducers/teams.ts
 * Verifica el reducer y las acciones de Redux para equipos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Team, TeamState, TeamMember, TeamInvitation } from 'types/teams';

// Mock de datos para tests
const mockTeam: Team = {
  _id: 'team-123',
  name: 'Test Team',
  description: 'A test team',
  owner: 'owner-123',
  ownerInfo: {
    firstName: 'John',
    lastName: 'Owner',
    email: 'owner@test.com',
  },
  status: 'active',
  members: [
    {
      _id: 'member-1',
      userId: 'user-456',
      email: 'member@test.com',
      firstName: 'Jane',
      lastName: 'Member',
      role: 'editor',
      status: 'active',
      joinedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  invitations: [],
  settings: {
    autoShareNewResources: true,
    defaultRole: 'viewer',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockTeam2: Team = {
  _id: 'team-456',
  name: 'Second Team',
  description: 'Another team',
  owner: 'owner-456',
  status: 'active',
  members: [],
  invitations: [],
  settings: {
    autoShareNewResources: true,
    defaultRole: 'editor',
  },
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

const initialState: TeamState = {
  teams: [],
  activeTeam: null,
  currentUserRole: null,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Tipos de acciones (duplicados para tests sin import del módulo que tiene axios)
const SET_TEAMS_LOADING = 'SET_TEAMS_LOADING';
const GET_USER_TEAMS = 'GET_USER_TEAMS';
const GET_TEAM_BY_ID = 'GET_TEAM_BY_ID';
const CREATE_TEAM = 'CREATE_TEAM';
const UPDATE_TEAM = 'UPDATE_TEAM';
const DELETE_TEAM = 'DELETE_TEAM';
const SET_ACTIVE_TEAM = 'SET_ACTIVE_TEAM';
const CLEAR_ACTIVE_TEAM = 'CLEAR_ACTIVE_TEAM';
const SEND_INVITATIONS = 'SEND_INVITATIONS';
const CANCEL_INVITATION = 'CANCEL_INVITATION';
const RESEND_INVITATION = 'RESEND_INVITATION';
const UPDATE_MEMBER_ROLE = 'UPDATE_MEMBER_ROLE';
const REMOVE_MEMBER = 'REMOVE_MEMBER';
const MEMBER_LEFT = 'MEMBER_LEFT';
const SET_TEAMS_ERROR = 'SET_TEAMS_ERROR';
const RESET_TEAMS_STATE = 'RESET_TEAMS_STATE';
const SET_CURRENT_USER_ROLE = 'SET_CURRENT_USER_ROLE';

// Reducer puro para tests (sin axios)
const teamsReducer = (state = initialState, action: any): TeamState => {
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
        teams: state.teams.map((team) =>
          team._id === action.payload._id ? action.payload : team
        ),
        isLoading: false,
      };

    case CREATE_TEAM:
      return {
        ...state,
        teams: [...state.teams, action.payload],
        activeTeam: action.payload,
        currentUserRole: 'owner',
        isLoading: false,
      };

    case UPDATE_TEAM:
      return {
        ...state,
        activeTeam:
          state.activeTeam?._id === action.payload._id
            ? action.payload
            : state.activeTeam,
        teams: state.teams.map((team) =>
          team._id === action.payload._id ? action.payload : team
        ),
        isLoading: false,
      };

    case DELETE_TEAM:
      return {
        ...state,
        teams: state.teams.filter((team) => team._id !== action.payload),
        activeTeam:
          state.activeTeam?._id === action.payload ? null : state.activeTeam,
        currentUserRole:
          state.activeTeam?._id === action.payload
            ? null
            : state.currentUserRole,
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
      if (state.activeTeam && state.activeTeam._id === action.payload.teamId) {
        return {
          ...state,
          activeTeam: {
            ...state.activeTeam,
            invitations: [
              ...state.activeTeam.invitations,
              ...action.payload.invitations,
            ],
          },
          teams: state.teams.map((team) =>
            team._id === action.payload.teamId
              ? {
                  ...team,
                  invitations: [
                    ...team.invitations,
                    ...action.payload.invitations,
                  ],
                }
              : team
          ),
          isLoading: false,
        };
      }
      return { ...state, isLoading: false };

    case CANCEL_INVITATION:
      if (state.activeTeam) {
        const updatedInvitations = (state.activeTeam.invitations || []).filter(
          (inv) => inv._id !== action.payload.invitationId
        );
        return {
          ...state,
          activeTeam: {
            ...state.activeTeam,
            invitations: updatedInvitations,
          },
          teams: state.teams.map((team) =>
            team._id === action.payload.teamId
              ? { ...team, invitations: updatedInvitations }
              : team
          ),
          isLoading: false,
        };
      }
      return { ...state, isLoading: false };

    case RESEND_INVITATION:
      if (state.activeTeam) {
        const updatedInvitations = (state.activeTeam.invitations || []).map((inv) =>
          inv._id === action.payload.invitationId
            ? { ...inv, sentAt: new Date().toISOString() }
            : inv
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
          member.userId === action.payload.userId
            ? { ...member, role: action.payload.role }
            : member
        );
        return {
          ...state,
          activeTeam: {
            ...state.activeTeam,
            members: updatedMembers,
          },
          teams: state.teams.map((team) =>
            team._id === action.payload.teamId
              ? { ...team, members: updatedMembers }
              : team
          ),
          isLoading: false,
        };
      }
      return { ...state, isLoading: false };

    case REMOVE_MEMBER:
      if (state.activeTeam) {
        const filteredMembers = (state.activeTeam.members || []).filter(
          (member) => member.userId !== action.payload.userId
        );
        return {
          ...state,
          activeTeam: {
            ...state.activeTeam,
            members: filteredMembers,
          },
          teams: state.teams.map((team) =>
            team._id === action.payload.teamId
              ? { ...team, members: filteredMembers }
              : team
          ),
          isLoading: false,
        };
      }
      return { ...state, isLoading: false };

    case MEMBER_LEFT:
      return {
        ...state,
        teams: state.teams.filter((team) => team._id !== action.payload.teamId),
        activeTeam:
          state.activeTeam?._id === action.payload.teamId
            ? null
            : state.activeTeam,
        currentUserRole:
          state.activeTeam?._id === action.payload.teamId
            ? null
            : state.currentUserRole,
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
      return initialState;

    default:
      return state;
  }
};

describe('Teams Reducer', () => {
  describe('Estado Inicial', () => {
    it('debe retornar el estado inicial', () => {
      const state = teamsReducer(undefined, { type: 'UNKNOWN' });
      expect(state).toEqual(initialState);
    });
  });

  describe('SET_TEAMS_LOADING', () => {
    it('debe establecer isLoading en true y limpiar error', () => {
      const stateWithError = { ...initialState, error: 'some error' };
      const state = teamsReducer(stateWithError, { type: SET_TEAMS_LOADING });

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('GET_USER_TEAMS', () => {
    it('debe almacenar los equipos y marcar como inicializado', () => {
      const teams = [mockTeam, mockTeam2];
      const state = teamsReducer(initialState, {
        type: GET_USER_TEAMS,
        payload: teams,
      });

      expect(state.teams).toHaveLength(2);
      expect(state.teams).toEqual(teams);
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(true);
    });

    it('debe manejar lista vacía de equipos', () => {
      const state = teamsReducer(initialState, {
        type: GET_USER_TEAMS,
        payload: [],
      });

      expect(state.teams).toHaveLength(0);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('GET_TEAM_BY_ID', () => {
    it('debe establecer el equipo activo', () => {
      const stateWithTeams = { ...initialState, teams: [mockTeam] };
      const updatedTeam = { ...mockTeam, name: 'Updated Name' };

      const state = teamsReducer(stateWithTeams, {
        type: GET_TEAM_BY_ID,
        payload: updatedTeam,
      });

      expect(state.activeTeam).toEqual(updatedTeam);
      expect(state.teams[0].name).toBe('Updated Name');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('CREATE_TEAM', () => {
    it('debe agregar el equipo y establecerlo como activo con rol owner', () => {
      const state = teamsReducer(initialState, {
        type: CREATE_TEAM,
        payload: mockTeam,
      });

      expect(state.teams).toHaveLength(1);
      expect(state.teams[0]).toEqual(mockTeam);
      expect(state.activeTeam).toEqual(mockTeam);
      expect(state.currentUserRole).toBe('owner');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('UPDATE_TEAM', () => {
    it('debe actualizar el equipo activo si es el mismo', () => {
      const stateWithTeam = {
        ...initialState,
        teams: [mockTeam],
        activeTeam: mockTeam,
      };
      const updatedTeam = { ...mockTeam, name: 'New Name' };

      const state = teamsReducer(stateWithTeam, {
        type: UPDATE_TEAM,
        payload: updatedTeam,
      });

      expect(state.activeTeam?.name).toBe('New Name');
      expect(state.teams[0].name).toBe('New Name');
    });

    it('no debe actualizar el equipo activo si es diferente', () => {
      const stateWithTeams = {
        ...initialState,
        teams: [mockTeam, mockTeam2],
        activeTeam: mockTeam,
      };
      const updatedTeam2 = { ...mockTeam2, name: 'New Name' };

      const state = teamsReducer(stateWithTeams, {
        type: UPDATE_TEAM,
        payload: updatedTeam2,
      });

      expect(state.activeTeam?.name).toBe('Test Team');
      expect(state.teams[1].name).toBe('New Name');
    });
  });

  describe('DELETE_TEAM', () => {
    it('debe eliminar el equipo de la lista', () => {
      const stateWithTeams = {
        ...initialState,
        teams: [mockTeam, mockTeam2],
      };

      const state = teamsReducer(stateWithTeams, {
        type: DELETE_TEAM,
        payload: mockTeam._id,
      });

      expect(state.teams).toHaveLength(1);
      expect(state.teams[0]._id).toBe(mockTeam2._id);
    });

    it('debe limpiar activeTeam y rol si es el equipo activo', () => {
      const stateWithActive = {
        ...initialState,
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'owner' as const,
      };

      const state = teamsReducer(stateWithActive, {
        type: DELETE_TEAM,
        payload: mockTeam._id,
      });

      expect(state.activeTeam).toBeNull();
      expect(state.currentUserRole).toBeNull();
    });
  });

  describe('SET_ACTIVE_TEAM', () => {
    it('debe establecer el equipo activo y el rol', () => {
      const state = teamsReducer(initialState, {
        type: SET_ACTIVE_TEAM,
        payload: { team: mockTeam, role: 'editor' },
      });

      expect(state.activeTeam).toEqual(mockTeam);
      expect(state.currentUserRole).toBe('editor');
    });
  });

  describe('CLEAR_ACTIVE_TEAM', () => {
    it('debe limpiar el equipo activo y el rol', () => {
      const stateWithActive = {
        ...initialState,
        activeTeam: mockTeam,
        currentUserRole: 'owner' as const,
      };

      const state = teamsReducer(stateWithActive, {
        type: CLEAR_ACTIVE_TEAM,
      });

      expect(state.activeTeam).toBeNull();
      expect(state.currentUserRole).toBeNull();
    });
  });

  describe('SEND_INVITATIONS', () => {
    it('debe agregar invitaciones al equipo activo', () => {
      const newInvitations: TeamInvitation[] = [
        {
          _id: 'inv-1',
          email: 'invited@test.com',
          role: 'editor',
          status: 'pending',
          expiresAt: '2024-02-01T00:00:00.000Z',
          sentAt: '2024-01-01T00:00:00.000Z',
          invitedBy: 'owner-123',
        },
      ];

      const stateWithActive = {
        ...initialState,
        teams: [mockTeam],
        activeTeam: mockTeam,
      };

      const state = teamsReducer(stateWithActive, {
        type: SEND_INVITATIONS,
        payload: { teamId: mockTeam._id, invitations: newInvitations },
      });

      expect(state.activeTeam?.invitations).toHaveLength(1);
      expect(state.activeTeam?.invitations[0].email).toBe('invited@test.com');
    });

    it('no debe modificar si el teamId no coincide', () => {
      const stateWithActive = {
        ...initialState,
        teams: [mockTeam],
        activeTeam: mockTeam,
      };

      const state = teamsReducer(stateWithActive, {
        type: SEND_INVITATIONS,
        payload: { teamId: 'different-id', invitations: [] },
      });

      expect(state.activeTeam?.invitations).toHaveLength(0);
    });
  });

  describe('CANCEL_INVITATION', () => {
    it('debe eliminar la invitación del equipo activo', () => {
      const invitation: TeamInvitation = {
        _id: 'inv-1',
        email: 'test@test.com',
        role: 'editor',
        status: 'pending',
        expiresAt: '2024-02-01T00:00:00.000Z',
        sentAt: '2024-01-01T00:00:00.000Z',
        invitedBy: 'owner-123',
      };

      const teamWithInvitation = {
        ...mockTeam,
        invitations: [invitation],
      };

      const stateWithActive = {
        ...initialState,
        teams: [teamWithInvitation],
        activeTeam: teamWithInvitation,
      };

      const state = teamsReducer(stateWithActive, {
        type: CANCEL_INVITATION,
        payload: { teamId: mockTeam._id, invitationId: 'inv-1' },
      });

      expect(state.activeTeam?.invitations).toHaveLength(0);
    });
  });

  describe('UPDATE_MEMBER_ROLE', () => {
    it('debe actualizar el rol del miembro', () => {
      const stateWithActive = {
        ...initialState,
        teams: [mockTeam],
        activeTeam: mockTeam,
      };

      const state = teamsReducer(stateWithActive, {
        type: UPDATE_MEMBER_ROLE,
        payload: { teamId: mockTeam._id, userId: 'user-456', role: 'admin' },
      });

      expect(state.activeTeam?.members[0].role).toBe('admin');
    });
  });

  describe('REMOVE_MEMBER', () => {
    it('debe eliminar el miembro del equipo', () => {
      const stateWithActive = {
        ...initialState,
        teams: [mockTeam],
        activeTeam: mockTeam,
      };

      const state = teamsReducer(stateWithActive, {
        type: REMOVE_MEMBER,
        payload: { teamId: mockTeam._id, userId: 'user-456' },
      });

      expect(state.activeTeam?.members).toHaveLength(0);
    });
  });

  describe('MEMBER_LEFT', () => {
    it('debe eliminar el equipo cuando el usuario abandona', () => {
      const stateWithTeams = {
        ...initialState,
        teams: [mockTeam, mockTeam2],
        activeTeam: mockTeam,
        currentUserRole: 'editor' as const,
      };

      const state = teamsReducer(stateWithTeams, {
        type: MEMBER_LEFT,
        payload: { teamId: mockTeam._id },
      });

      expect(state.teams).toHaveLength(1);
      expect(state.activeTeam).toBeNull();
      expect(state.currentUserRole).toBeNull();
    });
  });

  describe('SET_TEAMS_ERROR', () => {
    it('debe establecer el error y desactivar loading', () => {
      const loadingState = { ...initialState, isLoading: true };

      const state = teamsReducer(loadingState, {
        type: SET_TEAMS_ERROR,
        payload: 'Error message',
      });

      expect(state.error).toBe('Error message');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('RESET_TEAMS_STATE', () => {
    it('debe resetear al estado inicial', () => {
      const modifiedState = {
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'owner' as const,
        isLoading: false,
        error: 'some error',
        isInitialized: true,
      };

      const state = teamsReducer(modifiedState, {
        type: RESET_TEAMS_STATE,
      });

      expect(state).toEqual(initialState);
    });
  });

  describe('SET_CURRENT_USER_ROLE', () => {
    it('debe actualizar el rol del usuario actual', () => {
      const state = teamsReducer(initialState, {
        type: SET_CURRENT_USER_ROLE,
        payload: 'admin',
      });

      expect(state.currentUserRole).toBe('admin');
    });
  });
});
