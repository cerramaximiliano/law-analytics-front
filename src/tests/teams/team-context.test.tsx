/**
 * Tests para contexts/TeamContext.tsx
 * Verifica el contexto de equipos, hooks y lógica de permisos
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TeamProvider, useTeam, useTeamsFeature } from 'contexts/TeamContext';
import { Team, TeamState } from 'types/teams';

// Mock data
const mockOwnerUserId = 'owner-123';
const mockMemberUserId = 'member-456';

const mockTeam: Team = {
  _id: 'team-123',
  name: 'Test Team',
  description: 'A test team',
  owner: mockOwnerUserId,
  ownerInfo: {
    firstName: 'John',
    lastName: 'Owner',
    email: 'owner@test.com',
  },
  status: 'active',
  members: [
    {
      _id: 'member-1',
      userId: mockMemberUserId,
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
  ownerSubscription: {
    planName: 'premium',
    status: 'active',
    features: {
      teams: true,
      analytics: true,
      advancedReports: true,
    },
    featuresWithDescriptions: [
      { name: 'teams', enabled: true, displayName: 'Equipos' },
      { name: 'analytics', enabled: true, displayName: 'Analíticas' },
    ],
    resourceLimits: [
      { name: 'teamMembers', limit: 10, description: 'Miembros del equipo' },
    ],
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockTeam2: Team = {
  ...mockTeam,
  _id: 'team-456',
  name: 'Second Team',
  owner: 'other-owner',
};

// Helper to create a mock store
const createMockStore = (options: {
  teams?: Team[];
  activeTeam?: Team | null;
  currentUserRole?: 'owner' | 'admin' | 'editor' | 'viewer' | null;
  isInitialized?: boolean;
  userId?: string;
  subscription?: any;
}) => {
  const {
    teams = [],
    activeTeam = null,
    currentUserRole = null,
    isInitialized = true,
    userId = mockOwnerUserId,
    subscription = null,
  } = options;

  const teamsState: TeamState = {
    teams,
    activeTeam,
    currentUserRole,
    isLoading: false,
    error: null,
    isInitialized,
  };

  return configureStore({
    reducer: {
      teams: () => teamsState,
      auth: () => ({
        user: { _id: userId },
        subscription,
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });
};

// Wrapper component for tests
const createWrapper = (store: ReturnType<typeof createMockStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <TeamProvider>{children}</TeamProvider>
    </Provider>
  );
};

describe('TeamContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('useTeam - Estado Básico', () => {
    it('debe retornar estado inicial sin equipos', () => {
      const store = createMockStore({ teams: [], isInitialized: true });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.teams).toHaveLength(0);
      expect(result.current.activeTeam).toBeNull();
      expect(result.current.isTeamMode).toBe(false);
      expect(result.current.hasMultipleTeams).toBe(false);
    });

    it('debe detectar isTeamMode cuando hay equipos', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        userId: mockOwnerUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isTeamMode).toBe(true);
    });

    it('debe detectar hasMultipleTeams cuando hay más de un equipo', () => {
      const store = createMockStore({
        teams: [mockTeam, mockTeam2],
        activeTeam: mockTeam,
        userId: mockOwnerUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.hasMultipleTeams).toBe(true);
    });
  });

  describe('useTeam - Detección de Roles', () => {
    it('debe detectar al owner correctamente', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'owner',
        userId: mockOwnerUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.userRole).toBe('owner');
      expect(result.current.isOwner).toBe(true);
      expect(result.current.isAdmin).toBe(true);
    });

    it('debe detectar al admin correctamente', () => {
      const teamWithAdminMember = {
        ...mockTeam,
        members: [
          {
            ...mockTeam.members[0],
            role: 'admin' as const,
          },
        ],
      };

      const store = createMockStore({
        teams: [teamWithAdminMember],
        activeTeam: teamWithAdminMember,
        currentUserRole: 'admin',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.userRole).toBe('admin');
      expect(result.current.isOwner).toBe(false);
      expect(result.current.isAdmin).toBe(true);
    });

    it('debe detectar al editor correctamente', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'editor',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.userRole).toBe('editor');
      expect(result.current.isOwner).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('debe detectar al viewer correctamente', () => {
      const teamWithViewerMember = {
        ...mockTeam,
        members: [
          {
            ...mockTeam.members[0],
            role: 'viewer' as const,
          },
        ],
      };

      const store = createMockStore({
        teams: [teamWithViewerMember],
        activeTeam: teamWithViewerMember,
        currentUserRole: 'viewer',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.userRole).toBe('viewer');
      expect(result.current.isOwner).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('useTeam - Permisos', () => {
    it('owner tiene todos los permisos', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'owner',
        userId: mockOwnerUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canRead).toBe(true);
      expect(result.current.canUpdate).toBe(true);
      expect(result.current.canDelete).toBe(true);
      expect(result.current.canManageMembers).toBe(true);
    });

    it('admin tiene todos los permisos', () => {
      const teamWithAdminMember = {
        ...mockTeam,
        members: [
          {
            ...mockTeam.members[0],
            role: 'admin' as const,
          },
        ],
      };

      const store = createMockStore({
        teams: [teamWithAdminMember],
        activeTeam: teamWithAdminMember,
        currentUserRole: 'admin',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canRead).toBe(true);
      expect(result.current.canUpdate).toBe(true);
      expect(result.current.canDelete).toBe(true);
      expect(result.current.canManageMembers).toBe(true);
    });

    it('editor puede crear, leer, actualizar pero no eliminar', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'editor',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canRead).toBe(true);
      expect(result.current.canUpdate).toBe(true);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.canManageMembers).toBe(false);
    });

    it('viewer solo puede leer', () => {
      const teamWithViewerMember = {
        ...mockTeam,
        members: [
          {
            ...mockTeam.members[0],
            role: 'viewer' as const,
          },
        ],
      };

      const store = createMockStore({
        teams: [teamWithViewerMember],
        activeTeam: teamWithViewerMember,
        currentUserRole: 'viewer',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canCreate).toBe(false);
      expect(result.current.canRead).toBe(true);
      expect(result.current.canUpdate).toBe(false);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.canManageMembers).toBe(false);
    });

    it('sin modo equipo tiene todos los permisos', () => {
      const store = createMockStore({
        teams: [],
        activeTeam: null,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canRead).toBe(true);
      expect(result.current.canUpdate).toBe(true);
      expect(result.current.canDelete).toBe(true);
    });
  });

  describe('useTeam - hasPermission', () => {
    it('debe verificar permisos específicos', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'editor',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.hasPermission('create')).toBe(true);
      expect(result.current.hasPermission('read')).toBe(true);
      expect(result.current.hasPermission('update')).toBe(true);
      expect(result.current.hasPermission('delete')).toBe(false);
      expect(result.current.hasPermission('manage_members')).toBe(false);
    });
  });

  describe('useTeam - hasTeamFeature', () => {
    it('debe retornar true si el owner tiene la feature', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'editor',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.hasTeamFeature('teams')).toBe(true);
      expect(result.current.hasTeamFeature('analytics')).toBe(true);
    });

    it('debe retornar false si el owner no tiene la feature', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'editor',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.hasTeamFeature('nonexistent')).toBe(false);
    });

    it('debe retornar false si no está en modo equipo', () => {
      const store = createMockStore({
        teams: [],
        activeTeam: null,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.hasTeamFeature('teams')).toBe(false);
    });
  });

  describe('useTeam - ownerSubscription', () => {
    it('debe exponer la suscripción del owner', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'editor',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.ownerSubscription).toBeDefined();
      expect(result.current.ownerSubscription?.planName).toBe('premium');
      expect(result.current.ownerSubscription?.features.teams).toBe(true);
    });

    it('debe retornar null si no hay equipo activo', () => {
      const store = createMockStore({
        teams: [],
        activeTeam: null,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.ownerSubscription).toBeNull();
    });
  });

  describe('useTeam - getRequestHeaders', () => {
    it('debe retornar headers con X-Group-Id cuando hay equipo activo', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'owner',
        userId: mockOwnerUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      const headers = result.current.getRequestHeaders();
      expect(headers['X-Group-Id']).toBe(mockTeam._id);
    });

    it('debe retornar headers vacíos cuando no hay equipo activo', () => {
      const store = createMockStore({
        teams: [],
        activeTeam: null,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      const headers = result.current.getRequestHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('useTeam - getTeamIdForResource', () => {
    it('debe retornar el ID del equipo cuando hay uno activo', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'owner',
        userId: mockOwnerUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.getTeamIdForResource()).toBe(mockTeam._id);
    });

    it('debe retornar undefined cuando no hay equipo activo', () => {
      const store = createMockStore({
        teams: [],
        activeTeam: null,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.getTeamIdForResource()).toBeUndefined();
    });
  });

  describe('useTeam - getUserIdForResource', () => {
    it('debe retornar el ID del owner cuando hay equipo activo', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'editor',
        userId: mockMemberUserId,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.getUserIdForResource()).toBe(mockOwnerUserId);
    });

    it('debe retornar el ID del usuario actual cuando no hay equipo activo', () => {
      const store = createMockStore({
        teams: [],
        activeTeam: null,
        userId: mockMemberUserId,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.getUserIdForResource()).toBe(mockMemberUserId);
    });
  });

  describe('useTeam - isReady', () => {
    it('debe ser false si no está inicializado', () => {
      const store = createMockStore({
        teams: [],
        activeTeam: null,
        isInitialized: false,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isReady).toBe(false);
    });

    it('debe ser true si está inicializado y no hay equipos', () => {
      const store = createMockStore({
        teams: [],
        activeTeam: null,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isReady).toBe(true);
    });

    it('debe ser true si es owner con equipo activo', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'owner',
        userId: mockOwnerUserId,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isReady).toBe(true);
    });

    it('debe ser true si es miembro con ownerSubscription disponible', () => {
      const store = createMockStore({
        teams: [mockTeam],
        activeTeam: mockTeam,
        currentUserRole: 'editor',
        userId: mockMemberUserId,
        isInitialized: true,
      });
      const { result } = renderHook(() => useTeam(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isReady).toBe(true);
    });
  });
});

describe('useTeamsFeature', () => {
  // Create a simpler wrapper for this hook since it doesn't use TeamProvider
  const createAuthWrapper = (subscription: any) => {
    const store = configureStore({
      reducer: {
        auth: () => ({
          user: { _id: 'user-123' },
          subscription,
        }),
        teams: () => ({
          teams: [],
          activeTeam: null,
          currentUserRole: null,
          isLoading: false,
          error: null,
          isInitialized: true,
        }),
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
    });

    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
  };

  describe('isTeamsEnabled', () => {
    it('debe retornar false si no hay suscripción', () => {
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(null),
      });

      expect(result.current.isTeamsEnabled).toBe(false);
    });

    it('debe retornar true si features.teams es true', () => {
      const subscription = {
        plan: 'standard',
        features: { teams: true },
      };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.isTeamsEnabled).toBe(true);
    });

    it('debe retornar true para plan standard', () => {
      const subscription = {
        plan: 'standard',
        features: {},
      };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.isTeamsEnabled).toBe(true);
    });

    it('debe retornar true para plan premium', () => {
      const subscription = {
        plan: 'premium',
        features: {},
      };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.isTeamsEnabled).toBe(true);
    });

    it('debe retornar false para plan free', () => {
      const subscription = {
        plan: 'free',
        features: {},
      };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.isTeamsEnabled).toBe(false);
    });
  });

  describe('maxTeamMembers', () => {
    it('debe retornar 0 si no hay suscripción', () => {
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(null),
      });

      expect(result.current.maxTeamMembers).toBe(0);
    });

    it('debe retornar el límite de limitsWithDescriptions', () => {
      const subscription = {
        plan: 'standard',
        limitsWithDescriptions: [
          { name: 'teamMembers', limit: 5 },
        ],
      };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.maxTeamMembers).toBe(5);
    });

    it('debe retornar 5 para plan standard como fallback', () => {
      const subscription = {
        plan: 'standard',
      };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.maxTeamMembers).toBe(5);
    });

    it('debe retornar 10 para plan premium como fallback', () => {
      const subscription = {
        plan: 'premium',
      };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.maxTeamMembers).toBe(10);
    });

    it('debe retornar 0 para plan free', () => {
      const subscription = {
        plan: 'free',
      };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.maxTeamMembers).toBe(0);
    });
  });

  describe('planName', () => {
    it('debe retornar "Gratuito" si no hay suscripción', () => {
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(null),
      });

      expect(result.current.planName).toBe('Gratuito');
    });

    it('debe retornar "Estándar" para plan standard', () => {
      const subscription = { plan: 'standard' };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.planName).toBe('Estándar');
    });

    it('debe retornar "Premium" para plan premium', () => {
      const subscription = { plan: 'premium' };
      const { result } = renderHook(() => useTeamsFeature(), {
        wrapper: createAuthWrapper(subscription),
      });

      expect(result.current.planName).toBe('Premium');
    });
  });
});
